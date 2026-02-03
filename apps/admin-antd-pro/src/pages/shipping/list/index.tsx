import { PageContainer, ProTable } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { Tag, Button, Space, message, Modal, Select, Popconfirm } from 'antd';
import { useState, useRef, useCallback } from 'react';
import { useSearchParams } from '@umijs/max';
import { ExportOutlined, ReloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import ShippingDetailDrawer from './components/ShippingDetailDrawer';
import { getShippings, updateShipping } from '@/services/shipping';

dayjs.extend(customParseFormat);

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

const carrierNames: Record<string, string> = {
  YAMATO: 'ヤマト運輸',
  SAGAWA: '佐川急便',
  JAPANPOST: '日本郵便',
};

const ShipmentList: React.FC = () => {
  const [searchParams] = useSearchParams();
  const actionRef = useRef<ActionType>();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [selectedRows, setSelectedRows] = useState<ShippingAPI.Shipping[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [bulkStatusModalOpen, setBulkStatusModalOpen] = useState(false);
  const [bulkTargetStatus, setBulkTargetStatus] = useState<string>('READY');
  const [bulkUpdating, setBulkUpdating] = useState(false);

  const initialStatus = searchParams.get('status') || undefined;

  const handleRowClick = (record: ShippingAPI.Shipping) => {
    setSelectedOrderId(record.order_id);
    setDrawerOpen(true);
  };

  const handleDrawerClose = useCallback(() => {
    setDrawerOpen(false);
    setSelectedOrderId(null);
  }, []);

  const handleDrawerUpdate = useCallback(() => {
    actionRef.current?.reload();
  }, []);

  const handleBulkStatusChange = async () => {
    if (selectedRows.length === 0) {
      message.warning('対象を選択してください');
      return;
    }

    setBulkUpdating(true);
    const results = await Promise.allSettled(
      selectedRows.map((row) =>
        updateShipping(row.order_id, {
          status: bulkTargetStatus,
          version: row.version,
        }),
      ),
    );

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const failCount = results.filter((r) => r.status === 'rejected').length;

    if (failCount === 0) {
      message.success(`${successCount}件のステータスを更新しました`);
    } else {
      message.warning(`${successCount}件成功、${failCount}件失敗`);
    }

    setBulkUpdating(false);
    setBulkStatusModalOpen(false);
    setSelectedRowKeys([]);
    setSelectedRows([]);
    actionRef.current?.reload();
  };

  const handleExportCSV = () => {
    if (selectedRows.length === 0) {
      message.warning('対象を選択してください');
      return;
    }

    const headers = ['注文ID', 'ステータス', '配送業者', '追跡番号', '更新日時'];
    const csvContent = [
      headers.join(','),
      ...selectedRows.map((row) =>
        [
          row.order_id,
          statusLabels[row.status] || row.status,
          row.carrier ? carrierNames[row.carrier] || row.carrier : '',
          row.tracking_number || '',
          row.updated_at,
        ].join(','),
      ),
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `shipments_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    message.success(`${selectedRows.length}件をCSVエクスポートしました`);
  };

  const formatDateTime = (value?: string | null) => {
    if (!value) return '-';
    const strictParsed = dayjs(
      value,
      [
        'YYYY-MM-DD HH:mm:ss.SSS',
        'YYYY-MM-DD HH:mm:ss',
        'YYYY-MM-DDTHH:mm:ssZ',
        'YYYY-MM-DDTHH:mm:ss.SSSZ',
      ],
      true,
    );
    const parsed = strictParsed.isValid() ? strictParsed : dayjs(value);
    if (!parsed.isValid() || parsed.year() <= 1) return '-';
    return parsed.format('YYYY-MM-DD HH:mm');
  };

  const columns: ProColumns<ShippingAPI.Shipping>[] = [
    {
      title: '注文ID',
      dataIndex: 'order_id',
      key: 'order_id',
      render: (_, record) => (
        <a onClick={() => handleRowClick(record)}>{record.order_id}</a>
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
        <Tag color={statusColors[record.status]}>
          {statusLabels[record.status] || record.status}
        </Tag>
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
        record.carrier ? carrierNames[record.carrier] || record.carrier : '-',
    },
    {
      title: '追跡番号',
      dataIndex: 'tracking_number',
      key: 'tracking_number',
      copyable: true,
      search: false,
      render: (_, record) => record.tracking_number || '-',
    },
    {
      title: '更新日時',
      dataIndex: 'updated_at',
      key: 'updated_at',
      valueType: 'dateTime',
      sorter: true,
      search: false,
      render: (_, record) => formatDateTime(record.updated_at),
    },
    {
      title: 'キーワード',
      dataIndex: 'keyword',
      key: 'keyword',
      hideInTable: true,
      fieldProps: {
        placeholder: '注文ID・追跡番号で検索',
      },
    },
  ];

  return (
    <PageContainer>
      <ProTable<ShippingAPI.Shipping>
        actionRef={actionRef}
        columns={columns}
        rowKey="id"
        request={async (params, sort) => {
          const { status, carrier, keyword, current, pageSize } = params;
          const response = await getShippings({
            status,
            carrier,
            keyword,
            page: current,
            size: pageSize,
          });

          return {
            data: response.data,
            success: response.success,
            total: response.total,
          };
        }}
        search={{
          labelWidth: 'auto',
        }}
        rowSelection={{
          selectedRowKeys,
          onChange: (keys, rows) => {
            setSelectedRowKeys(keys);
            setSelectedRows(rows);
          },
        }}
        tableAlertRender={({ selectedRowKeys }) => (
          <Space>
            <span>{selectedRowKeys.length} 件選択中</span>
          </Space>
        )}
        tableAlertOptionRender={() => (
          <Space>
            <Button
              size="small"
              onClick={() => setBulkStatusModalOpen(true)}
              disabled={selectedRowKeys.length === 0}
            >
              ステータス変更
            </Button>
            <Button
              size="small"
              icon={<ExportOutlined />}
              onClick={handleExportCSV}
              disabled={selectedRowKeys.length === 0}
            >
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
        onClose={handleDrawerClose}
        orderId={selectedOrderId}
        onUpdate={handleDrawerUpdate}
      />

      <Modal
        title="一括ステータス変更"
        open={bulkStatusModalOpen}
        onOk={handleBulkStatusChange}
        onCancel={() => setBulkStatusModalOpen(false)}
        confirmLoading={bulkUpdating}
      >
        <p>{selectedRowKeys.length}件の発送ステータスを変更します。</p>
        <Select
          style={{ width: '100%' }}
          value={bulkTargetStatus}
          onChange={setBulkTargetStatus}
          options={[
            { value: 'READY', label: '出荷準備中' },
            { value: 'SHIPPED', label: '出荷済み' },
            { value: 'DELIVERED', label: '配達完了' },
          ]}
        />
      </Modal>
    </PageContainer>
  );
};

export default ShipmentList;
