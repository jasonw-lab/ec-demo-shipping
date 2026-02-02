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
} from 'antd';
import { CopyOutlined, ExportOutlined } from '@ant-design/icons';

const { Paragraph } = Typography;

interface Shipping {
  id: string;
  orderId: string;
  status: string;
  carrier: string | null;
  trackingNumber: string | null;
  updatedAt: string;
}

interface ShippingDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  shipping: Shipping | null;
}

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

const carrierTrackingUrls: Record<string, string> = {
  YAMATO: 'https://jizen.kuronekoyamato.co.jp/jizen/servlet/crjz.b.NQ0010?id=',
  SAGAWA: 'https://k2k.sagawa-exp.co.jp/p/web/okurijosearch.do?okurijoNo=',
  JAPANPOST: 'https://trackings.post.japanpost.jp/services/srv/search/?requestNo1=',
};

const statusSteps = ['CREATED', 'READY', 'SHIPPED', 'DELIVERED'];

const ShippingDetailDrawer: React.FC<ShippingDetailDrawerProps> = ({
  open,
  onClose,
  shipping,
}) => {
  if (!shipping) return null;

  const getCurrentStep = () => {
    if (shipping.status === 'RETURNED' || shipping.status === 'CANCELLED') {
      return -1;
    }
    return statusSteps.indexOf(shipping.status);
  };

  const handleCopyTrackingNumber = () => {
    if (shipping.trackingNumber) {
      navigator.clipboard.writeText(shipping.trackingNumber);
      message.success('追跡番号をコピーしました');
    }
  };

  const handleOpenTracking = () => {
    if (shipping.carrier && shipping.trackingNumber) {
      const url = carrierTrackingUrls[shipping.carrier] + shipping.trackingNumber;
      window.open(url, '_blank');
    }
  };

  const handleStatusUpdate = () => {
    message.info('ステータス更新（Issue 505 で実装）');
  };

  return (
    <Drawer
      title={`発送詳細: ${shipping.orderId}`}
      open={open}
      onClose={onClose}
      width={480}
      extra={
        <Tag color={statusColors[shipping.status]}>{shipping.status}</Tag>
      }
    >
      <Descriptions column={1} bordered size="small">
        <Descriptions.Item label="注文ID">{shipping.orderId}</Descriptions.Item>
        <Descriptions.Item label="ステータス">
          <Tag color={statusColors[shipping.status]}>{shipping.status}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="配送業者">
          {shipping.carrier ? carrierNames[shipping.carrier] : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="追跡番号">
          {shipping.trackingNumber ? (
            <Space>
              <Paragraph
                copyable={{ tooltips: ['コピー', 'コピーしました'] }}
                style={{ marginBottom: 0 }}
              >
                {shipping.trackingNumber}
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
        <Descriptions.Item label="更新日時">{shipping.updatedAt}</Descriptions.Item>
      </Descriptions>

      <Divider>ステータス履歴</Divider>

      {shipping.status !== 'RETURNED' && shipping.status !== 'CANCELLED' ? (
        <Steps
          direction="vertical"
          size="small"
          current={getCurrentStep()}
          items={[
            { title: '作成', description: 'CREATED' },
            { title: '出荷準備中', description: 'READY' },
            { title: '出荷済み', description: 'SHIPPED' },
            { title: '配達完了', description: 'DELIVERED' },
          ]}
        />
      ) : (
        <Steps
          direction="vertical"
          size="small"
          current={1}
          status="error"
          items={[
            { title: '作成', description: 'CREATED' },
            {
              title: shipping.status === 'RETURNED' ? '返送' : 'キャンセル',
              description: shipping.status,
            },
          ]}
        />
      )}

      <Divider />

      <Space style={{ width: '100%' }} direction="vertical">
        <Button type="primary" block onClick={handleStatusUpdate}>
          ステータス更新
        </Button>
        {shipping.status !== 'RETURNED' && shipping.status !== 'CANCELLED' && (
          <Button danger block onClick={() => message.info('返送処理（Issue 505 で実装）')}>
            返送処理
          </Button>
        )}
      </Space>
    </Drawer>
  );
};

export default ShippingDetailDrawer;
