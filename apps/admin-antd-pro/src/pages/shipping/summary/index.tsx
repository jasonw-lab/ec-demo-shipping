import { PageContainer } from '@ant-design/pro-components';
import { Card, Col, Row, Table, Tag, Tooltip, Typography } from 'antd';
import {
  InboxOutlined,
  CheckCircleOutlined,
  SendOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from '@umijs/max';
import type { ColumnsType } from 'antd/es/table';
import { ChartCard, Field } from '@/pages/dashboard/analysis/components/Charts';

const { Title } = Typography;

// KPI データ（Issue 503 で API 連携）
const summaryData = {
  created: 12,
  ready: 8,
  shippedToday: 25,
  returned: 3,
};

// 要対応発送リスト（Issue 503 で API 連携）
interface PriorityShipping {
  id: string;
  orderId: string;
  status: string;
  reason: string;
  updatedAt: string;
}

const priorityShippings: PriorityShipping[] = [
  {
    id: '1',
    orderId: 'ORD-2024-001',
    status: 'RETURNED',
    reason: '返送対応が必要',
    updatedAt: '2026-02-01 10:30',
  },
  {
    id: '2',
    orderId: 'ORD-2024-002',
    status: 'CREATED',
    reason: '24時間以上未処理',
    updatedAt: '2026-01-30 15:20',
  },
  {
    id: '3',
    orderId: 'ORD-2024-003',
    status: 'READY',
    reason: '出荷作業待ち',
    updatedAt: '2026-02-01 08:00',
  },
];

const statusColors: Record<string, string> = {
  CREATED: 'default',
  READY: 'processing',
  SHIPPED: 'success',
  RETURNED: 'error',
};

const ShippingSummary: React.FC = () => {
  const navigate = useNavigate();

  const columns: ColumnsType<PriorityShipping> = [
    {
      title: '注文ID',
      dataIndex: 'orderId',
      key: 'orderId',
      render: (text: string, record: PriorityShipping) => (
        <a onClick={() => navigate(`/shipping/list?id=${record.id}`)}>{text}</a>
      ),
    },
    {
      title: 'ステータス',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColors[status]}>{status}</Tag>
      ),
    },
    {
      title: '理由',
      dataIndex: 'reason',
      key: 'reason',
    },
    {
      title: '更新日時',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
    },
  ];

  const handleCardClick = (status: string) => {
    navigate(`/shipping/list?status=${status}`);
  };

  const topColResponsiveProps = {
    xs: 24,
    sm: 12,
    md: 12,
    lg: 12,
    xl: 6,
    style: {
      marginBottom: 24,
    },
  };

  return (
    <PageContainer>
      <Row gutter={24}>
        <Col {...topColResponsiveProps}>
          <ChartCard
            bordered={false}
            title="未着手"
            action={
              <Tooltip title="発送作成済み、未処理の件数">
                <InfoCircleOutlined />
              </Tooltip>
            }
            total={summaryData.created}
            footer={
              <Field
                label="ステータス"
                value="CREATED"
              />
            }
            contentHeight={46}
            style={{ cursor: 'pointer' }}
            onClick={() => handleCardClick('CREATED')}
          >
            <div style={{ textAlign: 'center', paddingTop: 8 }}>
              <InboxOutlined style={{ fontSize: 24, color: '#8c8c8c' }} />
            </div>
          </ChartCard>
        </Col>

        <Col {...topColResponsiveProps}>
          <ChartCard
            bordered={false}
            title="出荷作業待ち"
            action={
              <Tooltip title="出荷準備完了、作業待ちの件数">
                <InfoCircleOutlined />
              </Tooltip>
            }
            total={summaryData.ready}
            footer={
              <Field
                label="ステータス"
                value="READY"
              />
            }
            contentHeight={46}
            style={{ cursor: 'pointer' }}
            onClick={() => handleCardClick('READY')}
          >
            <div style={{ textAlign: 'center', paddingTop: 8 }}>
              <CheckCircleOutlined style={{ fontSize: 24, color: '#1890ff' }} />
            </div>
          </ChartCard>
        </Col>

        <Col {...topColResponsiveProps}>
          <ChartCard
            bordered={false}
            title="本日出荷"
            action={
              <Tooltip title="本日出荷済みの件数">
                <InfoCircleOutlined />
              </Tooltip>
            }
            total={summaryData.shippedToday}
            footer={
              <Field
                label="ステータス"
                value="SHIPPED"
              />
            }
            contentHeight={46}
            style={{ cursor: 'pointer' }}
            onClick={() => handleCardClick('SHIPPED')}
          >
            <div style={{ textAlign: 'center', paddingTop: 8 }}>
              <SendOutlined style={{ fontSize: 24, color: '#52c41a' }} />
            </div>
          </ChartCard>
        </Col>

        <Col {...topColResponsiveProps}>
          <ChartCard
            bordered={false}
            title="返送/トラブル"
            action={
              <Tooltip title="返送対応が必要な件数">
                <InfoCircleOutlined />
              </Tooltip>
            }
            total={summaryData.returned}
            footer={
              <Field
                label="ステータス"
                value="RETURNED"
              />
            }
            contentHeight={46}
            style={{ cursor: 'pointer' }}
            onClick={() => handleCardClick('RETURNED')}
          >
            <div style={{ textAlign: 'center', paddingTop: 8 }}>
              <ExclamationCircleOutlined style={{ fontSize: 24, color: '#ff4d4f' }} />
            </div>
          </ChartCard>
        </Col>
      </Row>

      <Card
        title={<Title level={5}>要対応発送リスト</Title>}
        style={{ marginTop: 16 }}
        extra={<a onClick={() => navigate('/shipping/list')}>すべて表示</a>}
      >
        <Table
          columns={columns}
          dataSource={priorityShippings}
          rowKey="id"
          size="small"
          pagination={false}
        />
      </Card>
    </PageContainer>
  );
};

export default ShippingSummary;
