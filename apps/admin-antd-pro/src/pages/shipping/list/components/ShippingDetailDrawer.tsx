import {
  Drawer,
  Descriptions,
  Tag,
  Steps,
  Button,
  Space,
  Typography,
  Divider,
  message,
  Skeleton,
  Form,
  Select,
  Input,
  Popconfirm,
  Alert,
} from 'antd';
import { ExportOutlined, CopyOutlined, WarningOutlined } from '@ant-design/icons';
import { useRequest } from '@umijs/max';
import { useEffect, useState, useCallback } from 'react';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { getShipping, updateShipping } from '@/services/shipping';

const { Paragraph } = Typography;

dayjs.extend(customParseFormat);

interface ShippingDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  orderId: string | null;
  onUpdate?: () => void;
}

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

const carrierTrackingUrls: Record<string, string> = {
  YAMATO: 'https://jizen.kuronekoyamato.co.jp/jizen/servlet/crjz.b.NQ0010?id=',
  SAGAWA: 'https://k2k.sagawa-exp.co.jp/p/web/okurijosearch.do?okurijoNo=',
  JAPANPOST: 'https://trackings.post.japanpost.jp/services/srv/search/?requestNo1=',
};

const statusSteps = ['CREATED', 'READY', 'SHIPPED', 'DELIVERED'];

// ステータス遷移ルール
const getNextStatuses = (currentStatus: string): { value: string; label: string }[] => {
  switch (currentStatus) {
    case 'CREATED':
      return [{ value: 'READY', label: '出荷準備中' }];
    case 'READY':
      return [{ value: 'SHIPPED', label: '出荷済み' }];
    case 'SHIPPED':
      return [{ value: 'DELIVERED', label: '配達完了' }];
    default:
      return [];
  }
};

const ShippingDetailDrawer: React.FC<ShippingDetailDrawerProps> = ({
  open,
  onClose,
  orderId,
  onUpdate,
}) => {
  const [form] = Form.useForm();
  const [updating, setUpdating] = useState(false);
  const [conflictError, setConflictError] = useState(false);

  const {
    data: shippingData,
    loading,
    error,
    run,
  } = useRequest(
    (id: string) => getShipping(id),
    {
      manual: true,
      onError: (e) => {
        console.error('Failed to fetch shipping:', e);
      },
    },
  );

  const shipping =
    shippingData?.data ??
    // Fallbacks for unexpected response shapes from request wrappers.
    (shippingData as { data?: { data?: ShippingAPI.Shipping } } | undefined)?.data?.data ??
    (shippingData as { data?: { data?: { data?: ShippingAPI.Shipping } } } | undefined)?.data?.data
      ?.data ??
    (shippingData as ShippingAPI.Shipping | undefined);

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
    return parsed.format('YYYY-MM-DD HH:mm:ss');
  };

  // Drawer が開かれたときにデータを取得
  useEffect(() => {
    if (open && orderId) {
      run(orderId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, orderId]);

  useEffect(() => {
    if (shipping) {
      form.setFieldsValue({
        status: undefined,
        carrier: shipping.carrier || undefined,
        tracking_number: shipping.tracking_number || '',
      });
      setConflictError(false);
    }
  }, [shipping, form]);

  const getCurrentStep = useCallback(() => {
    if (!shipping) return -1;
    if (shipping.status === 'RETURNED' || shipping.status === 'CANCELLED') {
      return -1;
    }
    return statusSteps.indexOf(shipping.status);
  }, [shipping]);

  const handleOpenTracking = () => {
    if (shipping?.carrier && shipping?.tracking_number) {
      const url = carrierTrackingUrls[shipping.carrier] + shipping.tracking_number;
      window.open(url, '_blank');
    }
  };

  const handleStatusUpdate = async () => {
    if (!shipping) return;

    try {
      const values = await form.validateFields();
      if (!values.status) {
        message.warning('変更後のステータスを選択してください');
        return;
      }

      setUpdating(true);
      setConflictError(false);

      const updateData: {
        status: string;
        carrier?: string;
        tracking_number?: string;
        version: number;
      } = {
        status: values.status,
        version: shipping.version,
      };

      // SHIPPED への遷移時は carrier と tracking_number が必要
      if (values.status === 'SHIPPED') {
        if (!values.carrier) {
          message.error('出荷済みにするには配送業者を選択してください');
          setUpdating(false);
          return;
        }
        if (!values.tracking_number) {
          message.error('出荷済みにするには追跡番号を入力してください');
          setUpdating(false);
          return;
        }
        updateData.carrier = values.carrier;
        updateData.tracking_number = values.tracking_number;
      }

      const result = await updateShipping(shipping.order_id, updateData);

      if (result.success) {
        message.success('ステータスを更新しました');
        run(shipping.order_id);
        onUpdate?.();
        form.setFieldValue('status', undefined);
      } else {
        if (result.errorCode === 409) {
          setConflictError(true);
          message.error('データが更新されています。再読み込みしてください。');
        } else {
          message.error(result.errorMessage || '更新に失敗しました');
        }
      }
    } catch (error: any) {
      if (error?.response?.status === 409) {
        setConflictError(true);
        message.error('データが更新されています。再読み込みしてください。');
      } else {
        message.error('更新に失敗しました');
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleReturn = async () => {
    if (!shipping) return;

    setUpdating(true);
    setConflictError(false);

    try {
      const result = await updateShipping(shipping.order_id, {
        status: 'RETURNED',
        version: shipping.version,
      });

      if (result.success) {
        message.success('返送処理を実行しました');
        run(shipping.order_id);
        onUpdate?.();
      } else {
        if (result.errorCode === 409) {
          setConflictError(true);
          message.error('データが更新されています。再読み込みしてください。');
        } else {
          message.error(result.errorMessage || '返送処理に失敗しました');
        }
      }
    } catch (error: any) {
      if (error?.response?.status === 409) {
        setConflictError(true);
        message.error('データが更新されています。再読み込みしてください。');
      } else {
        message.error('返送処理に失敗しました');
      }
    } finally {
      setUpdating(false);
    }
  };

  const handleRefresh = () => {
    setConflictError(false);
    if (orderId) {
      run(orderId);
    }
  };

  const nextStatuses = shipping ? getNextStatuses(shipping.status) : [];
  const canUpdate = nextStatuses.length > 0;
  const canReturn =
    shipping &&
    !['RETURNED', 'CANCELLED', 'DELIVERED'].includes(shipping.status);

  return (
    <Drawer
      title={orderId ? `発送詳細: ${orderId}` : '発送詳細'}
      open={open}
      onClose={onClose}
      width={520}
      extra={
        shipping && (
          <Tag color={statusColors[shipping.status]}>
            {statusLabels[shipping.status] || shipping.status}
          </Tag>
        )
      }
    >
      {loading ? (
        <Skeleton active paragraph={{ rows: 10 }} />
      ) : error ? (
        <Alert
          message="エラー"
          description={`データの取得に失敗しました: ${error.message || '不明なエラー'}`}
          type="error"
          showIcon
        />
      ) : !shipping ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          データが見つかりません
        </div>
      ) : (
        <>
          {conflictError && (
            <Alert
              message="データ競合エラー"
              description="他のユーザーによりデータが更新されました。最新データを再読み込みしてください。"
              type="error"
              showIcon
              icon={<WarningOutlined />}
              action={
                <Button size="small" onClick={handleRefresh}>
                  再読み込み
                </Button>
              }
              style={{ marginBottom: 16 }}
            />
          )}

          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="注文ID">{shipping.order_id}</Descriptions.Item>
            <Descriptions.Item label="ステータス">
              <Tag color={statusColors[shipping.status]}>
                {statusLabels[shipping.status] || shipping.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="配送先住所">
              {shipping.shipping_address || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="配送業者">
              {shipping.carrier ? carrierNames[shipping.carrier] || shipping.carrier : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="追跡番号">
              {shipping.tracking_number ? (
                <Space>
                  <Paragraph
                    copyable={{ tooltips: ['コピー', 'コピーしました'] }}
                    style={{ marginBottom: 0 }}
                  >
                    {shipping.tracking_number}
                  </Paragraph>
                  {shipping.carrier && (
                    <Button
                      type="link"
                      size="small"
                      icon={<ExportOutlined />}
                      onClick={handleOpenTracking}
                    >
                      追跡
                    </Button>
                  )}
                </Space>
              ) : (
                '-'
              )}
            </Descriptions.Item>
            <Descriptions.Item label="作成日時">
              {formatDateTime(shipping.created_at)}
            </Descriptions.Item>
            <Descriptions.Item label="更新日時">
              {formatDateTime(shipping.updated_at)}
            </Descriptions.Item>
          </Descriptions>

          <Divider>ステータス履歴</Divider>

          {shipping.status !== 'RETURNED' && shipping.status !== 'CANCELLED' ? (
            <Steps
              direction="vertical"
              size="small"
              current={getCurrentStep()}
              items={[
                {
                  title: '作成',
                  description:
                    formatDateTime(shipping.created_at) !== '-'
                      ? dayjs(shipping.created_at).format('YYYY-MM-DD HH:mm')
                      : 'CREATED',
                },
                {
                  title: '出荷準備中',
                  description:
                    formatDateTime(shipping.ready_at) !== '-'
                      ? dayjs(shipping.ready_at).format('YYYY-MM-DD HH:mm')
                      : 'READY',
                },
                {
                  title: '出荷済み',
                  description:
                    formatDateTime(shipping.shipped_at) !== '-'
                      ? dayjs(shipping.shipped_at).format('YYYY-MM-DD HH:mm')
                      : 'SHIPPED',
                },
                {
                  title: '配達完了',
                  description:
                    formatDateTime(shipping.delivered_at) !== '-'
                      ? dayjs(shipping.delivered_at).format('YYYY-MM-DD HH:mm')
                      : 'DELIVERED',
                },
              ]}
            />
          ) : (
            <Steps
              direction="vertical"
              size="small"
              current={1}
              status="error"
              items={[
                {
                  title: '作成',
                  description:
                    formatDateTime(shipping.created_at) !== '-'
                      ? dayjs(shipping.created_at).format('YYYY-MM-DD HH:mm')
                      : 'CREATED',
                },
                {
                  title: shipping.status === 'RETURNED' ? '返送' : 'キャンセル',
                  description:
                    formatDateTime(shipping.updated_at) !== '-'
                      ? dayjs(shipping.updated_at).format('YYYY-MM-DD HH:mm')
                      : '-',
                },
              ]}
            />
          )}

          {canUpdate && (
            <>
              <Divider>ステータス更新</Divider>

              <Form form={form} layout="vertical">
                <Form.Item
                  name="status"
                  label="変更後のステータス"
                  rules={[{ required: false }]}
                >
                  <Select
                    placeholder="ステータスを選択"
                    options={nextStatuses}
                    allowClear
                  />
                </Form.Item>

                <Form.Item
                  noStyle
                  shouldUpdate={(prev, curr) => prev.status !== curr.status}
                >
                  {({ getFieldValue }) =>
                    getFieldValue('status') === 'SHIPPED' && (
                      <>
                        <Form.Item
                          name="carrier"
                          label="配送業者"
                          rules={[{ required: true, message: '配送業者を選択してください' }]}
                        >
                          <Select
                            placeholder="配送業者を選択"
                            options={[
                              { value: 'YAMATO', label: 'ヤマト運輸' },
                              { value: 'SAGAWA', label: '佐川急便' },
                              { value: 'JAPANPOST', label: '日本郵便' },
                            ]}
                          />
                        </Form.Item>
                        <Form.Item
                          name="tracking_number"
                          label="追跡番号"
                          rules={[{ required: true, message: '追跡番号を入力してください' }]}
                        >
                          <Input placeholder="追跡番号を入力" />
                        </Form.Item>
                      </>
                    )
                  }
                </Form.Item>
              </Form>

              <Button
                type="primary"
                block
                onClick={handleStatusUpdate}
                loading={updating}
                disabled={conflictError}
              >
                ステータス更新
              </Button>
            </>
          )}

          {canReturn && (
            <>
              <Divider />
              <Popconfirm
                title="返送処理"
                description="この発送を返送処理しますか？"
                onConfirm={handleReturn}
                okText="返送する"
                cancelText="キャンセル"
                okButtonProps={{ danger: true }}
              >
                <Button danger block loading={updating} disabled={conflictError}>
                  返送処理
                </Button>
              </Popconfirm>
            </>
          )}
        </>
      )}
    </Drawer>
  );
};

export default ShippingDetailDrawer;
