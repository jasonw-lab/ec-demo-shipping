import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

// material-ui
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Stack from '@mui/material/Stack';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

// project imports
import MainCard from 'components/MainCard';

// assets
import { CopyOutlined, ReloadOutlined, EditOutlined } from '@ant-design/icons';

// services
import {
  getShippings,
  STATUS_COLORS,
  STATUS_LABELS,
  CARRIER_NAMES,
  Shipping,
  ListParams
} from 'services/shipping';

// components
import ShippingDetailDrawer from './components/ShippingDetailDrawer';

// ==============================|| SHIPPING LIST ||============================== //

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

export default function ShippingList() {
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [shippings, setShippings] = useState<Shipping[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  // Filters
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [carrier, setCarrier] = useState('');
  const [keyword, setKeyword] = useState('');

  // Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: ListParams = {
        page: page + 1,
        size: rowsPerPage
      };
      if (status) params.status = status;
      if (carrier) params.carrier = carrier;
      if (keyword) params.keyword = keyword;

      const response = await getShippings(params);

      if (response.success) {
        setShippings(response.data || []);
        setTotal(response.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch shippings:', error);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, status, carrier, keyword]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle URL params for orderId
  useEffect(() => {
    const orderId = searchParams.get('orderId');
    if (orderId) {
      setSelectedOrderId(orderId);
      setDrawerOpen(true);
      // Clear the orderId param
      searchParams.delete('orderId');
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  const handleRowClick = (shipping: Shipping) => {
    setSelectedOrderId(shipping.order_id);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setSelectedOrderId(null);
  };

  const handleDrawerUpdate = () => {
    fetchData();
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleStatusChange = (event: SelectChangeEvent) => {
    setStatus(event.target.value);
    setPage(0);
  };

  const handleCarrierChange = (event: SelectChangeEvent) => {
    setCarrier(event.target.value);
    setPage(0);
  };

  const handleKeywordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setKeyword(event.target.value);
  };

  const handleKeywordKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      setPage(0);
      fetchData();
    }
  };

  const handleResetFilters = () => {
    setStatus('');
    setCarrier('');
    setKeyword('');
    setPage(0);
  };

  const handleCopyTrackingNumber = async (trackingNumber: string, event: React.MouseEvent) => {
    event.stopPropagation();
    try {
      await navigator.clipboard.writeText(trackingNumber);
      setSnackbar({ open: true, message: 'コピーしました', severity: 'success' });
    } catch {
      setSnackbar({ open: true, message: 'コピーに失敗しました', severity: 'error' });
    }
  };

  const handleRefresh = () => {
    fetchData();
  };

  return (
    <Grid container rowSpacing={4.5} columnSpacing={2.75}>
      {/* Header */}
      <Grid sx={{ mb: -2.25 }} size={12}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h5">発送一覧</Typography>
          <IconButton onClick={handleRefresh} size="small">
            <ReloadOutlined />
          </IconButton>
        </Stack>
      </Grid>

      {/* Filters */}
      <Grid size={12}>
        <MainCard>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <TextField
              size="small"
              label="キーワード"
              placeholder="注文ID・追跡番号"
              value={keyword}
              onChange={handleKeywordChange}
              onKeyPress={handleKeywordKeyPress}
              sx={{ minWidth: 200 }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>ステータス</InputLabel>
              <Select value={status} label="ステータス" onChange={handleStatusChange}>
                <MenuItem value="">すべて</MenuItem>
                <MenuItem value="CREATED">未着手</MenuItem>
                <MenuItem value="READY">出荷準備中</MenuItem>
                <MenuItem value="SHIPPED">出荷済み</MenuItem>
                <MenuItem value="DELIVERED">配達完了</MenuItem>
                <MenuItem value="RETURNED">返送</MenuItem>
                <MenuItem value="CANCELLED">キャンセル</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>配送業者</InputLabel>
              <Select value={carrier} label="配送業者" onChange={handleCarrierChange}>
                <MenuItem value="">すべて</MenuItem>
                <MenuItem value="YAMATO">ヤマト運輸</MenuItem>
                <MenuItem value="SAGAWA">佐川急便</MenuItem>
                <MenuItem value="JAPANPOST">日本郵便</MenuItem>
              </Select>
            </FormControl>
            <Button variant="outlined" size="small" onClick={handleResetFilters}>
              リセット
            </Button>
          </Stack>
        </MainCard>
      </Grid>

      {/* Table */}
      <Grid size={12}>
        <MainCard content={false}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>注文ID</TableCell>
                  <TableCell>ステータス</TableCell>
                  <TableCell>配送業者</TableCell>
                  <TableCell>追跡番号</TableCell>
                  <TableCell>更新日時</TableCell>
                  <TableCell align="center">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton /></TableCell>
                      <TableCell><Skeleton /></TableCell>
                      <TableCell><Skeleton /></TableCell>
                      <TableCell><Skeleton /></TableCell>
                      <TableCell><Skeleton /></TableCell>
                      <TableCell><Skeleton /></TableCell>
                    </TableRow>
                  ))
                ) : shippings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">データがありません</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  shippings.map((shipping) => (
                    <TableRow
                      key={shipping.id}
                      hover
                      sx={{ cursor: 'pointer' }}
                      onClick={() => handleRowClick(shipping)}
                    >
                      <TableCell>
                        <Typography
                          sx={{ fontFamily: 'monospace', color: 'primary.main' }}
                        >
                          {shipping.order_id}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={STATUS_LABELS[shipping.status] || shipping.status}
                          color={STATUS_COLORS[shipping.status] || 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {shipping.carrier ? CARRIER_NAMES[shipping.carrier] || shipping.carrier : '-'}
                      </TableCell>
                      <TableCell>
                        {shipping.tracking_number ? (
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <Typography sx={{ fontFamily: 'monospace' }}>
                              {shipping.tracking_number}
                            </Typography>
                            <Tooltip title="コピー">
                              <IconButton
                                size="small"
                                onClick={(e) => handleCopyTrackingNumber(shipping.tracking_number!, e)}
                              >
                                <CopyOutlined style={{ fontSize: 14 }} />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>{formatDateTime(shipping.updated_at)}</TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRowClick(shipping);
                          }}
                        >
                          <EditOutlined />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[10, 20, 50]}
            labelRowsPerPage="表示件数"
          />
        </MainCard>
      </Grid>

      {/* Detail Drawer */}
      <ShippingDetailDrawer
        open={drawerOpen}
        onClose={handleDrawerClose}
        orderId={selectedOrderId}
        onUpdate={handleDrawerUpdate}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Grid>
  );
}
