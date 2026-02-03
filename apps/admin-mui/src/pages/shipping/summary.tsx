import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// material-ui
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';

// project imports
import MainCard from 'components/MainCard';

// assets
import {
  InboxOutlined,
  CheckCircleOutlined,
  SendOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';

// services
import {
  getSummary,
  getPriorityShippings,
  STATUS_COLORS,
  STATUS_LABELS,
  Summary,
  Shipping
} from 'services/shipping';

// ==============================|| SHIPPING SUMMARY ||============================== //

interface SummaryCardProps {
  title: string;
  count: number;
  icon: React.ReactNode;
  color: string;
  loading: boolean;
  onClick: () => void;
}

function SummaryCard({ title, count, icon, color, loading, onClick }: SummaryCardProps) {
  return (
    <MainCard
      contentSX={{ p: 2.25, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
      onClick={onClick}
    >
      <Stack sx={{ gap: 0.5 }}>
        <Typography variant="h6" color="text.secondary">
          {title}
        </Typography>
        <Grid container sx={{ alignItems: 'center' }}>
          <Grid>
            {loading ? (
              <Skeleton width={60} height={40} />
            ) : (
              <Typography variant="h4" color="inherit">
                {count}
              </Typography>
            )}
          </Grid>
          <Grid sx={{ ml: 'auto' }}>
            <Box sx={{ color, fontSize: '2rem' }}>{icon}</Box>
          </Grid>
        </Grid>
      </Stack>
    </MainCard>
  );
}

function formatDateTime(value?: string | null): string {
  if (!value) return '-';
  try {
    const date = new Date(value);
    if (isNaN(date.getTime()) || date.getFullYear() <= 1) return '-';
    return date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '-';
  }
}

function getPriorityReason(shipping: Shipping): string {
  if (shipping.status === 'RETURNED') {
    return '返送対応が必要';
  }
  if (shipping.status === 'CREATED') {
    const createdAt = new Date(shipping.created_at);
    const hoursAgo = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60));
    if (hoursAgo >= 24) {
      return `${hoursAgo}時間以上未処理`;
    }
    return '未処理';
  }
  if (shipping.status === 'READY') {
    return '出荷作業待ち';
  }
  return '';
}

export default function ShippingSummary() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [priorityShippings, setPriorityShippings] = useState<Shipping[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [priorityLoading, setPriorityLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summaryRes, priorityRes] = await Promise.all([
          getSummary(),
          getPriorityShippings(5)
        ]);

        if (summaryRes.success && summaryRes.data) {
          setSummary(summaryRes.data);
        }
        if (priorityRes.success && priorityRes.data) {
          setPriorityShippings(priorityRes.data);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setSummaryLoading(false);
        setPriorityLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCardClick = (status: string) => {
    navigate(`/shipping/list?status=${status}`);
  };

  return (
    <Grid container rowSpacing={4.5} columnSpacing={2.75}>
      {/* Header */}
      <Grid sx={{ mb: -2.25 }} size={12}>
        <Typography variant="h5">発送管理サマリー</Typography>
      </Grid>

      {/* Summary Cards */}
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <SummaryCard
          title="未着手"
          count={summary?.created ?? 0}
          icon={<InboxOutlined />}
          color="#8c8c8c"
          loading={summaryLoading}
          onClick={() => handleCardClick('CREATED')}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <SummaryCard
          title="出荷作業待ち"
          count={summary?.ready ?? 0}
          icon={<CheckCircleOutlined />}
          color="#1890ff"
          loading={summaryLoading}
          onClick={() => handleCardClick('READY')}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <SummaryCard
          title="本日出荷"
          count={summary?.shipped_today ?? 0}
          icon={<SendOutlined />}
          color="#52c41a"
          loading={summaryLoading}
          onClick={() => handleCardClick('SHIPPED')}
        />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
        <SummaryCard
          title="返送/トラブル"
          count={summary?.returned ?? 0}
          icon={<ExclamationCircleOutlined />}
          color="#ff4d4f"
          loading={summaryLoading}
          onClick={() => handleCardClick('RETURNED')}
        />
      </Grid>

      {/* Priority Shippings Table */}
      <Grid size={12}>
        <MainCard
          title={
            <Typography variant="h5">要対応発送リスト</Typography>
          }
          secondary={
            <Link
              component="button"
              variant="body2"
              onClick={() => navigate('/shipping/list')}
              sx={{ cursor: 'pointer' }}
            >
              すべて表示
            </Link>
          }
        >
          {priorityLoading ? (
            <Box sx={{ p: 2 }}>
              <Skeleton height={40} />
              <Skeleton height={40} />
              <Skeleton height={40} />
            </Box>
          ) : priorityShippings.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">
                対応が必要な発送はありません
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>注文ID</TableCell>
                    <TableCell>ステータス</TableCell>
                    <TableCell>理由</TableCell>
                    <TableCell>更新日時</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {priorityShippings.map((shipping) => (
                    <TableRow
                      key={shipping.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/shipping/list?orderId=${shipping.order_id}`)}
                    >
                      <TableCell>
                        <Link component="button" variant="body2">
                          {shipping.order_id}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={STATUS_LABELS[shipping.status] || shipping.status}
                          color={STATUS_COLORS[shipping.status] || 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{getPriorityReason(shipping)}</TableCell>
                      <TableCell>{formatDateTime(shipping.updated_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </MainCard>
      </Grid>
    </Grid>
  );
}
