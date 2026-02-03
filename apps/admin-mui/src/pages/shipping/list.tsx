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
import TableSortLabel from '@mui/material/TableSortLabel';
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
import Checkbox from '@mui/material/Checkbox';
import Menu from '@mui/material/Menu';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

// project imports
import MainCard from 'components/MainCard';

// assets
import {
  CopyOutlined,
  ReloadOutlined,
  EditOutlined,
  DownloadOutlined,
  MoreOutlined
} from '@ant-design/icons';

// services
import {
  getShippings,
  updateShipping,
  STATUS_COLORS,
  STATUS_LABELS,
  CARRIER_NAMES,
  Shipping,
  ListParams
} from 'services/shipping';

// components
import ShippingDetailDrawer from './components/ShippingDetailDrawer';

// ==============================|| SHIPPING LIST ||============================== //

type Order = 'asc' | 'desc';
type OrderBy = 'order_id' | 'status' | 'carrier' | 'updated_at';

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

function descendingComparator<T>(a: T, b: T, orderBy: keyof T) {
  if (b[orderBy] < a[orderBy]) return -1;
  if (b[orderBy] > a[orderBy]) return 1;
  return 0;
}

function getComparator<Key extends keyof Shipping>(
  order: Order,
  orderBy: Key
): (a: Shipping, b: Shipping) => number {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

export default function ShippingList() {
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [shippings, setShippings] = useState<Shipping[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  // Sorting
  const [order, setOrder] = useState<Order>('desc');
  const [orderBy, setOrderBy] = useState<OrderBy>('updated_at');

  // Selection
  const [selected, setSelected] = useState<readonly number[]>([]);

  // Filters
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [carrier, setCarrier] = useState('');
  const [keyword, setKeyword] = useState('');

  // Drawer
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Bulk action menu
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const bulkMenuOpen = Boolean(anchorEl);

  // Bulk status dialog
  const [bulkStatusDialogOpen, setBulkStatusDialogOpen] = useState(false);
  const [bulkTargetStatus, setBulkTargetStatus] = useState('READY');
  const [bulkUpdating, setBulkUpdating] = useState(false);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' }>({
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
      searchParams.delete('orderId');
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  // Clear selection when data changes
  useEffect(() => {
    setSelected([]);
  }, [shippings]);

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

  // Sorting
  const handleRequestSort = (property: OrderBy) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const sortedShippings = [...shippings].sort(getComparator(order, orderBy));

  // Selection
  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = shippings.map((s) => s.id);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  const handleSelectClick = (event: React.MouseEvent, id: number) => {
    event.stopPropagation();
    const selectedIndex = selected.indexOf(id);
    let newSelected: readonly number[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1)
      );
    }
    setSelected(newSelected);
  };

  const isSelected = (id: number) => selected.indexOf(id) !== -1;

  // Bulk actions
  const handleBulkMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleBulkMenuClose = () => {
    setAnchorEl(null);
  };

  const handleBulkStatusDialogOpen = () => {
    handleBulkMenuClose();
    setBulkStatusDialogOpen(true);
  };

  const handleBulkStatusChange = async () => {
    const selectedShippings = shippings.filter((s) => selected.includes(s.id));
    if (selectedShippings.length === 0) return;

    setBulkUpdating(true);

    const results = await Promise.allSettled(
      selectedShippings.map((shipping) =>
        updateShipping(shipping.order_id, {
          status: bulkTargetStatus,
          version: shipping.version
        })
      )
    );

    const successCount = results.filter((r) => r.status === 'fulfilled' && (r.value as { success: boolean }).success).length;
    const failCount = selectedShippings.length - successCount;

    if (failCount === 0) {
      setSnackbar({ open: true, message: `${successCount}件のステータスを更新しました`, severity: 'success' });
    } else {
      setSnackbar({ open: true, message: `${successCount}件成功、${failCount}件失敗`, severity: 'warning' });
    }

    setBulkUpdating(false);
    setBulkStatusDialogOpen(false);
    setSelected([]);
    fetchData();
  };

  const handleExportCSV = () => {
    handleBulkMenuClose();
    const selectedShippings = shippings.filter((s) => selected.includes(s.id));
    if (selectedShippings.length === 0) {
      setSnackbar({ open: true, message: '対象を選択してください', severity: 'warning' });
      return;
    }

    const headers = ['注文ID', 'ステータス', '配送業者', '追跡番号', '更新日時'];
    const csvContent = [
      headers.join(','),
      ...selectedShippings.map((shipping) =>
        [
          shipping.order_id,
          STATUS_LABELS[shipping.status] || shipping.status,
          shipping.carrier ? CARRIER_NAMES[shipping.carrier] || shipping.carrier : '',
          shipping.tracking_number || '',
          shipping.updated_at
        ].join(',')
      )
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `shipments_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    setSnackbar({ open: true, message: `${selectedShippings.length}件をCSVエクスポートしました`, severity: 'success' });
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

      {/* Bulk Action Bar */}
      {selected.length > 0 && (
        <Grid size={12}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: 1.5,
              bgcolor: 'primary.lighter',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'primary.light'
            }}
          >
            <Chip
              label={`${selected.length}件選択中`}
              size="small"
              color="primary"
              variant="filled"
            />
            <Button
              size="small"
              variant="contained"
              startIcon={<MoreOutlined />}
              onClick={handleBulkMenuOpen}
            >
              一括操作
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={bulkMenuOpen}
              onClose={handleBulkMenuClose}
            >
              <MenuItem onClick={handleBulkStatusDialogOpen}>ステータス一括変更</MenuItem>
              <MenuItem onClick={handleExportCSV}>
                <DownloadOutlined style={{ marginRight: 8 }} />
                CSVエクスポート
              </MenuItem>
            </Menu>
            <Box sx={{ flexGrow: 1 }} />
            <Button
              size="small"
              variant="text"
              onClick={() => setSelected([])}
            >
              選択解除
            </Button>
          </Box>
        </Grid>
      )}

      {/* Table */}
      <Grid size={12}>
        <MainCard content={false}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={selected.length > 0 && selected.length < shippings.length}
                      checked={shippings.length > 0 && selected.length === shippings.length}
                      onChange={handleSelectAllClick}
                    />
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'order_id'}
                      direction={orderBy === 'order_id' ? order : 'asc'}
                      onClick={() => handleRequestSort('order_id')}
                    >
                      注文ID
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'status'}
                      direction={orderBy === 'status' ? order : 'asc'}
                      onClick={() => handleRequestSort('status')}
                    >
                      ステータス
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'carrier'}
                      direction={orderBy === 'carrier' ? order : 'asc'}
                      onClick={() => handleRequestSort('carrier')}
                    >
                      配送業者
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>追跡番号</TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={orderBy === 'updated_at'}
                      direction={orderBy === 'updated_at' ? order : 'asc'}
                      onClick={() => handleRequestSort('updated_at')}
                    >
                      更新日時
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="center">操作</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  [...Array(5)].map((_, index) => (
                    <TableRow key={index}>
                      <TableCell padding="checkbox"><Skeleton variant="rectangular" width={20} height={20} /></TableCell>
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
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">データがありません</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  sortedShippings.map((shipping) => {
                    const isItemSelected = isSelected(shipping.id);
                    return (
                      <TableRow
                        key={shipping.id}
                        hover
                        selected={isItemSelected}
                        sx={{ cursor: 'pointer' }}
                        onClick={() => handleRowClick(shipping)}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={isItemSelected}
                            onClick={(e) => handleSelectClick(e, shipping.id)}
                          />
                        </TableCell>
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
                    );
                  })
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

      {/* Bulk Status Dialog */}
      <Dialog open={bulkStatusDialogOpen} onClose={() => setBulkStatusDialogOpen(false)}>
        <DialogTitle>一括ステータス変更</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>{selected.length}件の発送ステータスを変更します。</Typography>
          <FormControl fullWidth size="small">
            <InputLabel>変更後のステータス</InputLabel>
            <Select
              value={bulkTargetStatus}
              label="変更後のステータス"
              onChange={(e) => setBulkTargetStatus(e.target.value)}
            >
              <MenuItem value="READY">出荷準備中</MenuItem>
              <MenuItem value="SHIPPED">出荷済み</MenuItem>
              <MenuItem value="DELIVERED">配達完了</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkStatusDialogOpen(false)}>キャンセル</Button>
          <Button onClick={handleBulkStatusChange} variant="contained" disabled={bulkUpdating}>
            変更
          </Button>
        </DialogActions>
      </Dialog>

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
