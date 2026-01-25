package kafka

import (
	"context"
	"log"
	"time"

	"github.com/IBM/sarama"
	"github.com/jasonw-lab/ec-demo-shipping/apps/api/internal/config"
)

// Consumer represents a Kafka consumer
type Consumer struct {
	config       *config.KafkaConfig
	handler      *OrderEventHandler
	client       sarama.ConsumerGroup
	producer     sarama.SyncProducer
	ready        chan bool
	ctx          context.Context
	cancel       context.CancelFunc
	maxRetries   int
	retryBackoff time.Duration
}

// NewConsumer creates a new Kafka consumer
func NewConsumer(cfg *config.KafkaConfig, handler *OrderEventHandler) (*Consumer, error) {
	saramaConfig := sarama.NewConfig()
	saramaConfig.Consumer.Group.Rebalance.GroupStrategies = []sarama.BalanceStrategy{sarama.NewBalanceStrategyRoundRobin()}
	saramaConfig.Consumer.Offsets.Initial = sarama.OffsetNewest
	saramaConfig.Consumer.Return.Errors = true

	// Producer config for DLQ
	saramaConfig.Producer.Return.Successes = true
	saramaConfig.Producer.RequiredAcks = sarama.WaitForAll

	client, err := sarama.NewConsumerGroup(cfg.Brokers, cfg.ConsumerGroup, saramaConfig)
	if err != nil {
		return nil, err
	}

	// Create DLQ producer
	producer, err := sarama.NewSyncProducer(cfg.Brokers, saramaConfig)
	if err != nil {
		client.Close()
		return nil, err
	}

	ctx, cancel := context.WithCancel(context.Background())

	return &Consumer{
		config:       cfg,
		handler:      handler,
		client:       client,
		producer:     producer,
		ready:        make(chan bool),
		ctx:          ctx,
		cancel:       cancel,
		maxRetries:   3,
		retryBackoff: time.Second,
	}, nil
}

// Start starts consuming messages from Kafka
func (c *Consumer) Start() error {
	topics := []string{c.config.OrderTopic}

	go func() {
		for {
			if err := c.client.Consume(c.ctx, topics, c); err != nil {
				log.Printf("[ERROR] Error from consumer: %v", err)
			}
			if c.ctx.Err() != nil {
				return
			}
			c.ready = make(chan bool)
		}
	}()

	<-c.ready
	log.Printf("[INFO] Kafka consumer started, listening on topic: %s", c.config.OrderTopic)

	return nil
}

// Stop stops the consumer
func (c *Consumer) Stop() error {
	c.cancel()
	if c.producer != nil {
		if err := c.producer.Close(); err != nil {
			log.Printf("[WARN] Error closing DLQ producer: %v", err)
		}
	}
	return c.client.Close()
}

// Setup is run at the beginning of a new session
func (c *Consumer) Setup(sarama.ConsumerGroupSession) error {
	close(c.ready)
	return nil
}

// Cleanup is run at the end of a session
func (c *Consumer) Cleanup(sarama.ConsumerGroupSession) error {
	return nil
}

// ConsumeClaim processes messages from a claim
func (c *Consumer) ConsumeClaim(session sarama.ConsumerGroupSession, claim sarama.ConsumerGroupClaim) error {
	for {
		select {
		case message, ok := <-claim.Messages():
			if !ok {
				return nil
			}
			c.processMessage(session, message)
		case <-session.Context().Done():
			return nil
		}
	}
}

// processMessage handles a single message with retry logic
func (c *Consumer) processMessage(session sarama.ConsumerGroupSession, message *sarama.ConsumerMessage) {
	log.Printf("[INFO] Received message: topic=%s partition=%d offset=%d",
		message.Topic, message.Partition, message.Offset)

	var lastErr error
	for attempt := 1; attempt <= c.maxRetries; attempt++ {
		err := c.handler.Handle(message.Value)
		if err == nil {
			session.MarkMessage(message, "")
			return
		}

		lastErr = err

		// Don't retry validation errors
		if IsValidationError(err) {
			log.Printf("[WARN] Validation error (sending to DLQ): %v", err)
			c.sendToDLQ(message, err)
			session.MarkMessage(message, "")
			return
		}

		// Retry with backoff
		if attempt < c.maxRetries {
			log.Printf("[WARN] Retry %d/%d for message at offset %d: %v",
				attempt, c.maxRetries, message.Offset, err)
			time.Sleep(c.retryBackoff * time.Duration(attempt))
		}
	}

	// All retries exhausted, send to DLQ
	log.Printf("[ERROR] Max retries exhausted, sending to DLQ: %v", lastErr)
	c.sendToDLQ(message, lastErr)
	session.MarkMessage(message, "")
}

// sendToDLQ sends a failed message to the Dead Letter Queue
func (c *Consumer) sendToDLQ(message *sarama.ConsumerMessage, err error) {
	dlqMessage := &sarama.ProducerMessage{
		Topic: c.config.DLQTopic,
		Value: sarama.ByteEncoder(message.Value),
		Headers: []sarama.RecordHeader{
			{Key: []byte("error"), Value: []byte(err.Error())},
			{Key: []byte("original_topic"), Value: []byte(message.Topic)},
			{Key: []byte("original_partition"), Value: []byte(string(rune(message.Partition)))},
			{Key: []byte("original_offset"), Value: []byte(string(rune(message.Offset)))},
		},
	}

	partition, offset, sendErr := c.producer.SendMessage(dlqMessage)
	if sendErr != nil {
		log.Printf("[ERROR] Failed to send message to DLQ: topic=%s partition=%d offset=%d error=%v",
			message.Topic, message.Partition, message.Offset, sendErr)
		return
	}

	log.Printf("[DLQ] Message sent to DLQ: dlq_topic=%s dlq_partition=%d dlq_offset=%d original_topic=%s original_partition=%d original_offset=%d error=%v",
		c.config.DLQTopic, partition, offset, message.Topic, message.Partition, message.Offset, err)
}
