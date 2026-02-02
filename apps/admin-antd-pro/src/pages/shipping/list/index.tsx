import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { ProColumns } from '@ant-design/pro-components';
import { Tag, Button, Space, message } from 'antd';
import { useState } from 'react';
import { useSearchParams } from '@umijs/max';
import ShippingDetailDrawer from './components/ShippingDetailDrawer';

// 型定義（Issue 504 で共通型に移動）
interface Shipping {
  id: string;
  orderId: string;
  status: string;
  carrier: string | null;
  trackingNumber: string | null;
  updatedAt: string;
}

// モックデータ（Issue 504 で API 連携）
const mockData: Shipping[] = [
  {
    id: '1',
    orderId: 'ORD-2024-001',
    status: 'READY',
    carrier: 'YAMATO',
    trackingNumber: null,
    updatedAt: '2026-02-01 10:30',
  },
  {
    id: '2',
    orderId: 'ORD-2024-002',
    status: 'SHIPPED',
    carrier: 'SAGAWA',
    trackingNumber: '1234567890',
    updatedAt: '2026-02-01 09:15',
  },
  {
    id: '3',
    orderId: 'ORD-2024-003',
    status: 'CREATED',
    carrier: null,
    trackingNumber: null,
    updatedAt: '2026-01-31 16:45',
  },
  {
    id: '4',
    orderId: 'ORD-2024-004',
    status: 'RETURNED',
    carrier: 'JAPANPOST',
    trackingNumber: '9876543210',
    updatedAt: '2026-02-01 08:00',
  },
];

const statusColors: Record<string, string> = {
  CREATED: 'default',
  READY: 'processing',
  SHIPPED: 'success',
  DELIVERED: 'cyan',
  RETURNED: 'error',
  CANCELLED: 'warning',
};

const carrierNames: Record<string, string> = {
  YAMATO: 'ヤマト運輸',
  SAGAWA: '佐川急便',
  JAPANPOST: '日本郵便',
};

const ShipmentList: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedShipping, setSelectedShipping] = useState<Shipping | null>(null);

  const initialStatus = searchParams.get('status') || 'READY';

  const handleRowClick = (record: Shipping) => {
    setSelectedShipping(record);
    setDrawerOpen(true);
  };

  const handleBulkAction = (action: string) => {
    if (selectedRowKeys.length === 0) {
      message.warning('対象を選択してください');
      return;
    }
    message.info(`${action}: ${selectedRowKeys.length}件を処理します（Issue 504 で実装）`);
  };

  const columns: ProColumns<Shipping>[] = [
    {
      title: '注文ID',
      dataIndex: 'orderId',
      key: 'orderId',
      render: (_, record) => (
        <a onClick={() => handleRowClick(record)}>{record.orderId}</a>
      ),
    },
    {
      title: 'ステータス',
      dataIndex: 'status',
      key: 'status',
      valueType: 'select',
      initialValue: initialStatus,
      valueEnum: {
        CREATED: { text: '未着手', status: 'Default' },
        READY: { text: '出荷準備中', status: 'Processing' },
        SHIPPED: { text: '出荷済み', status: 'Success' },
        DELIVERED: { text: '配達完了', status: 'Success' },
        RETURNED: { text: '返送', status: 'Error' },
        CANCELLED: { text: 'キャンセル', status: 'Warning' },
      },
      render: (_, record) => (
        <Tag color={statusColors[record.status]}>{record.status}</Tag>
      ),
    },
    {
      title: '配送業者',
      dataIndex: 'carrier',
      key: 'carrier',
      valueType: 'select',
      valueEnum: {
        YAMATO: { text: 'ヤマト運輸' },
        SAGAWA: { text: '佐川急便' },
        JAPANPOST: { text: '日本郵便' },
      },
      render: (_, record) =>
        record.carrier ? carrierNames[record.carrier] : '-',
    },
    {
      title: '追跡番号',
      dataIndex: 'trackingNumber',
      key: 'trackingNumber',
      copyable: true,
      render: (_, record) => record.trackingNumber || '-',
    },
    {
      title: '更新日時',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      valueType: 'dateTime',
      sorter: true,
    },
  ];

  return (
    <PageContainer>
      <ProTable<Shipping>
        columns={columns}
        dataSource={mockData}
        rowKey="id"
        search={{
          labelWidth: 'auto',
        }}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
        tableAlertRender={({ selectedRowKeys }) => (
          <Space>
            <span>{selectedRowKeys.length} 件選択中</span>
          </Space>
        )}
        tableAlertOptionRender={() => (
          <Space>
            <Button size="small" onClick={() => handleBulkAction('ステータス変更')}>
              ステータス変更
            </Button>
            <Button size="small" onClick={() => handleBulkAction('CSVエクスポート')}>
              CSVエクスポート
            </Button>
          </Space>
        )}
        onRow={(record) => ({
          onClick: () => handleRowClick(record),
          style: { cursor: 'pointer' },
        })}
        options={{
          density: true,
          fullScreen: true,
          reload: true,
        }}
        pagination={{
          defaultPageSize: 20,
          showSizeChanger: true,
        }}
      />
      <ShippingDetailDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        shipping={selectedShipping}
      />
    </PageContainer>
  );
};

export default ShipmentList;
