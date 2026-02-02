import { PageContainer } from '@ant-design/pro-components';
import { Card, Col, Row, Skeleton, Table, Tag, Tooltip, Typography } from 'antd';
import {
  InboxOutlined,
  CheckCircleOutlined,
  SendOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useNavigate, useRequest } from '@umijs/max';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { ChartCard, Field } from '@/pages/dashboard/analysis/components/Charts';
import { getSummary, getPriorityShippings } from '@/services/shipping';

const { Title } = Typography;

const statusColors: Record<string, string> = {
  CREATED: 'default',
  READY: 'processing',
  SHIPPED: 'success',
  DELIVERED: 'cyan',
  RETURNED: 'error',
  CANCELLED: 'warning',
};

const statusLabels: Record<string, string> = {
  CREATED: '未着手',
  READY: '出荷準備中',
  SHIPPED: '出荷済み',
  DELIVERED: '配達完了',
  RETURNED: '返送',
  CANCELLED: 'キャンセル',
};

const getPriorityReason = (shipping: ShippingAPI.Shipping): string => {
  if (shipping.status === 'RETURNED') {
    return '返送対応が必要';
  }
  if (shipping.status === 'CREATED') {
    const createdAt = dayjs(shipping.created_at);
    const hoursAgo = dayjs().diff(createdAt, 'hour');
    if (hoursAgo >= 24) {
      return `${hoursAgo}時間以上未処理`;
    }
    return '未処理';
  }
  if (shipping.status === 'READY') {
    return '出荷作業待ち';
  }
  return '';
};

const ShippingSummary: React.FC = () => {
  const navigate = useNavigate();

  const { data: summaryData, loading: summaryLoading } = useRequest(getSummary);
  const { data: priorityShippings, loading: priorityLoading } = useRequest(() =>
    getPriorityShippings(5),
  );

  const columns: ColumnsType<ShippingAPI.Shipping> = [
    {
      title: '注文ID',
      dataIndex: 'order_id',
      key: 'order_id',
      render: (text: string, record: ShippingAPI.Shipping) => (
        <a onClick={() => navigate(`/shipping/list?orderId=${record.order_id}`)}>{text}</a>
      ),
    },
    {
      title: 'ステータス',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColors[status]}>{statusLabels[status] || status}</Tag>
      ),
    },
    {
      title: '理由',
      key: 'reason',
      render: (_: unknown, record: ShippingAPI.Shipping) => getPriorityReason(record),
    },
    {
      title: '更新日時',
      dataIndex: 'updated_at',
      key: 'updated_at',
      render: (value: string) => dayjs(value).format('YYYY-MM-DD HH:mm'),
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
            variant="borderless"
            title="未着手"
            action={
              <Tooltip title="発送作成済み、未処理の件数">
                <InfoCircleOutlined />
              </Tooltip>
            }
            loading={summaryLoading}
            total={summaryData?.created ?? 0}
            footer={<Field label="ステータス" value="CREATED" />}
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
            variant="borderless"
            title="出荷作業待ち"
            action={
              <Tooltip title="出荷準備完了、作業待ちの件数">
                <InfoCircleOutlined />
              </Tooltip>
            }
            loading={summaryLoading}
            total={summaryData?.ready ?? 0}
            footer={<Field label="ステータス" value="READY" />}
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
            variant="borderless"
            title="本日出荷"
            action={
              <Tooltip title="本日出荷済みの件数（JST基準）">
                <InfoCircleOutlined />
              </Tooltip>
            }
            loading={summaryLoading}
            total={summaryData?.shipped_today ?? 0}
            footer={<Field label="ステータス" value="SHIPPED" />}
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
            variant="borderless"
            title="返送/トラブル"
            action={
              <Tooltip title="返送対応が必要な件数">
                <InfoCircleOutlined />
              </Tooltip>
            }
            loading={summaryLoading}
            total={summaryData?.returned ?? 0}
            footer={<Field label="ステータス" value="RETURNED" />}
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
        {priorityLoading ? (
          <Skeleton active paragraph={{ rows: 3 }} />
        ) : (
          <Table
            columns={columns}
            dataSource={priorityShippings || []}
            rowKey="id"
            size="small"
            pagination={false}
            locale={{ emptyText: '対応が必要な発送はありません' }}
          />
        )}
      </Card>
    </PageContainer>
  );
};

export default ShippingSummary;
