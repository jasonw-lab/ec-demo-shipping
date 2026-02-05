import { useState, useEffect, useCallback } from 'react';

// material-ui
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Link from '@mui/material/Link';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Snackbar from '@mui/material/Snackbar';

// assets
import {
  CloseOutlined,
  CopyOutlined,
  ExportOutlined,
  WarningOutlined,
  ReloadOutlined
} from '@ant-design/icons';

// services
import {
  getShipping,
  updateShipping,
  STATUS_COLORS,
  STATUS_LABELS,
  CARRIER_NAMES,
  CARRIER_TRACKING_URLS,
  Shipping,
  UpdateParams
} from 'services/shipping';

// ==============================|| SHIPPING DETAIL DRAWER ||============================== //

interface ShippingDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  orderId: string | null;
  onUpdate?: () => void;
}

const STATUS_STEPS = ['CREATED', 'READY', 'SHIPPED', 'DELIVERED'];
const STATUS_STEP_LABELS = ['作成', '出荷準備中', '出荷済み', '配達完了'];

function getNextStatuses(currentStatus: string): { value: string; label: string }[] {
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
      minute: '2-digit',
      second: '2-digit'
    });
  } catch {
    return '-';
  }
}

export default function ShippingDetailDrawer({
  open,
  onClose,
  orderId,
  onUpdate
}: ShippingDetailDrawerProps) {
  // State
  const [shipping, setShipping] = useState<Shipping | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [conflictError, setConflictError] = useState(false);

  // Form state
  const [newStatus, setNewStatus] = useState('');
  const [newCarrier, setNewCarrier] = useState('');
  const [newTrackingNumber, setNewTrackingNumber] = useState('');

  // Return dialog
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  const fetchShipping = useCallback(async () => {
    if (!orderId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await getShipping(orderId);
      if (response.success && response.data) {
        setShipping(response.data);
        setNewCarrier(response.data.carrier || '');
        setNewTrackingNumber(response.data.tracking_number || '');
        setNewStatus('');
        setConflictError(false);
      } else {
        setError(response.errorMessage || 'データの取得に失敗しました');
      }
    } catch (err) {
      setError('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (open && orderId) {
      fetchShipping();
    }
  }, [open, orderId, fetchShipping]);

  const handleClose = () => {
    setShipping(null);
    setError(null);
    setConflictError(false);
    setNewStatus('');
    setNewCarrier('');
    setNewTrackingNumber('');
    onClose();
  };

  const getCurrentStep = (): number => {
    if (!shipping) return -1;
    if (shipping.status === 'RETURNED' || shipping.status === 'CANCELLED') {
      return -1;
    }
    return STATUS_STEPS.indexOf(shipping.status);
  };

  const handleOpenTracking = () => {
    if (shipping?.carrier && shipping?.tracking_number) {
      const url = CARRIER_TRACKING_URLS[shipping.carrier] + shipping.tracking_number;
      window.open(url, '_blank');
    }
  };

  const handleCopyTrackingNumber = async () => {
    if (shipping?.tracking_number) {
      try {
        await navigator.clipboard.writeText(shipping.tracking_number);
        setSnackbar({ open: true, message: 'コピーしました', severity: 'success' });
      } catch {
        setSnackbar({ open: true, message: 'コピーに失敗しました', severity: 'error' });
      }
    }
  };

  const handleStatusUpdate = async () => {
    if (!shipping || !newStatus) {
      setSnackbar({ open: true, message: '変更後のステータスを選択してください', severity: 'error' });
      return;
    }

    // Validation for SHIPPED status
    if (newStatus === 'SHIPPED') {
      if (!newCarrier) {
        setSnackbar({ open: true, message: '出荷済みにするには配送業者を選択してください', severity: 'error' });
        return;
      }
      if (!newTrackingNumber) {
        setSnackbar({ open: true, message: '出荷済みにするには追跡番号を入力してください', severity: 'error' });
        return;
      }
    }

    setUpdating(true);
    setConflictError(false);

    try {
      const updateData: UpdateParams = {
        status: newStatus,
        version: shipping.version
      };

      if (newStatus === 'SHIPPED') {
        updateData.carrier = newCarrier;
        updateData.tracking_number = newTrackingNumber;
      }

      const response = await updateShipping(shipping.order_id, updateData);

      if (response.success) {
        setSnackbar({ open: true, message: 'ステータスを更新しました', severity: 'success' });
        fetchShipping();
        onUpdate?.();
        setNewStatus('');
      } else {
        if (response.errorCode === 409) {
          setConflictError(true);
          setSnackbar({ open: true, message: 'データが更新されています。再読み込みしてください。', severity: 'error' });
        } else {
          setSnackbar({ open: true, message: response.errorMessage || '更新に失敗しました', severity: 'error' });
        }
      }
    } catch (err) {
      setSnackbar({ open: true, message: '更新に失敗しました', severity: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  const handleReturn = async () => {
    if (!shipping) return;

    setUpdating(true);
    setConflictError(false);
    setReturnDialogOpen(false);

    try {
      const response = await updateShipping(shipping.order_id, {
        status: 'RETURNED',
        version: shipping.version
      });

      if (response.success) {
        setSnackbar({ open: true, message: '返送処理を実行しました', severity: 'success' });
        fetchShipping();
        onUpdate?.();
      } else {
        if (response.errorCode === 409) {
          setConflictError(true);
          setSnackbar({ open: true, message: 'データが更新されています。再読み込みしてください。', severity: 'error' });
        } else {
          setSnackbar({ open: true, message: response.errorMessage || '返送処理に失敗しました', severity: 'error' });
        }
      }
    } catch (err) {
      setSnackbar({ open: true, message: '返送処理に失敗しました', severity: 'error' });
    } finally {
      setUpdating(false);
    }
  };

  const handleRefresh = () => {
    setConflictError(false);
    fetchShipping();
  };

  const nextStatuses = shipping ? getNextStatuses(shipping.status) : [];
  const canUpdate = nextStatuses.length > 0;
  const canReturn = shipping && !['RETURNED', 'CANCELLED', 'DELIVERED'].includes(shipping.status);

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={handleClose}
        PaperProps={{ sx: { width: { xs: '100%', sm: 480 } } }}
      >
        {/* Header */}
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h5">
              発送詳細{orderId ? `: ${orderId}` : ''}
            </Typography>
            <Stack direction="row" spacing={1}>
              {shipping && (
                <Chip
                  label={STATUS_LABELS[shipping.status] || shipping.status}
                  color={STATUS_COLORS[shipping.status] || 'default'}
                  size="small"
                />
              )}
              <IconButton size="small" onClick={handleClose}>
                <CloseOutlined />
              </IconButton>
            </Stack>
          </Stack>
        </Box>

        {/* Content */}
        <Box sx={{ p: 2, overflow: 'auto', flex: 1 }}>
          {loading ? (
            <Stack spacing={2}>
              <Skeleton variant="rectangular" height={100} />
              <Skeleton variant="rectangular" height={150} />
              <Skeleton variant="rectangular" height={100} />
            </Stack>
          ) : error ? (
            <Alert severity="error">{error}</Alert>
          ) : !shipping ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography color="text.secondary">データが見つかりません</Typography>
            </Box>
          ) : (
            <Stack spacing={3}>
              {/* Conflict Error Alert */}
              {conflictError && (
                <Alert
                  severity="error"
                  icon={<WarningOutlined />}
                  action={
                    <Button color="inherit" size="small" onClick={handleRefresh} startIcon={<ReloadOutlined />}>
                      再読み込み
                    </Button>
                  }
                >
                  他のユーザーによりデータが更新されました。
                </Alert>
              )}

              {/* Basic Info */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  基本情報
                </Typography>
                <Stack spacing={1.5}>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">注文ID</Typography>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{shipping.order_id}</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">ステータス</Typography>
                    <Chip
                      label={STATUS_LABELS[shipping.status] || shipping.status}
                      color={STATUS_COLORS[shipping.status] || 'default'}
                      size="small"
                    />
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">配送先住所</Typography>
                    <Typography variant="body2" sx={{ maxWidth: 200, textAlign: 'right' }}>
                      {shipping.shipping_address || '-'}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">配送業者</Typography>
                    <Typography variant="body2">
                      {shipping.carrier ? CARRIER_NAMES[shipping.carrier] || shipping.carrier : '-'}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">追跡番号</Typography>
                    {shipping.tracking_number ? (
                      <Stack direction="row" alignItems="center" spacing={0.5}>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {shipping.tracking_number}
                        </Typography>
                        <Tooltip title="コピー">
                          <IconButton size="small" onClick={handleCopyTrackingNumber}>
                            <CopyOutlined style={{ fontSize: 14 }} />
                          </IconButton>
                        </Tooltip>
                        {shipping.carrier && (
                          <Tooltip title="追跡サイトを開く">
                            <IconButton size="small" onClick={handleOpenTracking}>
                              <ExportOutlined style={{ fontSize: 14 }} />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Stack>
                    ) : (
                      <Typography variant="body2">-</Typography>
                    )}
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">作成日時</Typography>
                    <Typography variant="body2">{formatDateTime(shipping.created_at)}</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">更新日時</Typography>
                    <Typography variant="body2">{formatDateTime(shipping.updated_at)}</Typography>
                  </Stack>
                </Stack>
              </Box>

              <Divider />

              {/* Status History */}
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  ステータス履歴
                </Typography>
                {shipping.status !== 'RETURNED' && shipping.status !== 'CANCELLED' ? (
                  <Stepper activeStep={getCurrentStep()} orientation="vertical">
                    {STATUS_STEP_LABELS.map((label, index) => (
                      <Step key={label}>
                        <StepLabel>
                          <Typography variant="body2">{label}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {index === 0 && formatDateTime(shipping.created_at)}
                            {index === 1 && formatDateTime(shipping.ready_at)}
                            {index === 2 && formatDateTime(shipping.shipped_at)}
                            {index === 3 && formatDateTime(shipping.delivered_at)}
                          </Typography>
                        </StepLabel>
                      </Step>
                    ))}
                  </Stepper>
                ) : (
                  <Stepper activeStep={1} orientation="vertical">
                    <Step>
                      <StepLabel>
                        <Typography variant="body2">作成</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDateTime(shipping.created_at)}
                        </Typography>
                      </StepLabel>
                    </Step>
                    <Step>
                      <StepLabel error>
                        <Typography variant="body2">
                          {shipping.status === 'RETURNED' ? '返送' : 'キャンセル'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDateTime(shipping.updated_at)}
                        </Typography>
                      </StepLabel>
                    </Step>
                  </Stepper>
                )}
              </Box>

              {/* Status Update Form */}
              {canUpdate && (
                <>
                  <Divider />
                  <Box>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      ステータス更新
                    </Typography>
                    <Stack spacing={2}>
                      <FormControl fullWidth size="small">
                        <InputLabel>変更後のステータス</InputLabel>
                        <Select
                          value={newStatus}
                          label="変更後のステータス"
                          onChange={(e: SelectChangeEvent) => setNewStatus(e.target.value)}
                        >
                          <MenuItem value="">選択してください</MenuItem>
                          {nextStatuses.map((s) => (
                            <MenuItem key={s.value} value={s.value}>
                              {s.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>

                      {newStatus === 'SHIPPED' && (
                        <>
                          <FormControl fullWidth size="small" required>
                            <InputLabel>配送業者</InputLabel>
                            <Select
                              value={newCarrier}
                              label="配送業者"
                              onChange={(e: SelectChangeEvent) => setNewCarrier(e.target.value)}
                            >
                              <MenuItem value="">選択してください</MenuItem>
                              <MenuItem value="YAMATO">ヤマト運輸</MenuItem>
                              <MenuItem value="SAGAWA">佐川急便</MenuItem>
                              <MenuItem value="JAPANPOST">日本郵便</MenuItem>
                            </Select>
                          </FormControl>
                          <TextField
                            fullWidth
                            size="small"
                            label="追跡番号"
                            value={newTrackingNumber}
                            onChange={(e) => setNewTrackingNumber(e.target.value)}
                            required
                          />
                        </>
                      )}

                      <Button
                        variant="contained"
                        fullWidth
                        onClick={handleStatusUpdate}
                        disabled={updating || conflictError || !newStatus}
                      >
                        ステータス更新
                      </Button>
                    </Stack>
                  </Box>
                </>
              )}

              {/* Return Button */}
              {canReturn && (
                <>
                  <Divider />
                  <Button
                    variant="outlined"
                    color="error"
                    fullWidth
                    onClick={() => setReturnDialogOpen(true)}
                    disabled={updating || conflictError}
                  >
                    返送処理
                  </Button>
                </>
              )}
            </Stack>
          )}
        </Box>
      </Drawer>

      {/* Return Confirmation Dialog */}
      <Dialog open={returnDialogOpen} onClose={() => setReturnDialogOpen(false)}>
        <DialogTitle>返送処理</DialogTitle>
        <DialogContent>
          <DialogContentText>
            この発送を返送処理しますか？この操作は元に戻せません。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReturnDialogOpen(false)}>キャンセル</Button>
          <Button onClick={handleReturn} color="error" variant="contained">
            返送する
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
    </>
  );
}
