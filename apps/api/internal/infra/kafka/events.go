package kafka

import "time"

// EventType represents the type of order event
type EventType string

const (
	EventOrderPaid      EventType = "ORDER_PAID"
	EventOrderCancelled EventType = "ORDER_CANCELLED"
)

// OrderEvent represents the base structure for order events
type OrderEvent struct {
	EventType EventType `json:"event_type"`
	OrderID   string    `json:"order_id"`
}

// Address represents a customer address
type Address struct {
	PostalCode string `json:"postal_code"`
	Prefecture string `json:"prefecture"`
	City       string `json:"city"`
	Street     string `json:"street"`
	Building   string `json:"building"`
}

// Customer represents customer information
type Customer struct {
	Name    string  `json:"name"`
	Phone   string  `json:"phone"`
	Address Address `json:"address"`
}

// OrderItem represents an item in an order
type OrderItem struct {
	ProductID string `json:"product_id"`
	Name      string `json:"name"`
	Quantity  int    `json:"quantity"`
}

// OrderPaidEvent represents the ORDER_PAID event payload
type OrderPaidEvent struct {
	EventType EventType   `json:"event_type"`
	OrderID   string      `json:"order_id"`
	PaidAt    time.Time   `json:"paid_at"`
	Customer  Customer    `json:"customer"`
	Items     []OrderItem `json:"items"`
}

// FormatAddress formats the address into a single string
func (a *Address) FormatAddress() string {
	addr := "〒" + a.PostalCode + "\n"
	addr += a.Prefecture + a.City + a.Street
	if a.Building != "" {
		addr += "\n" + a.Building
	}
	return addr
}
