import { useState, useEffect, useCallback } from 'react';

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
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import InputAdornment from '@mui/material/InputAdornment';

// project imports
import MainCard from 'components/MainCard';
import {
  getUsers,
  createUser,
  updateUser,
  updateUserStatus,
  resetUserPassword,
  getRoles,
  User,
  Role,
  ROLE_COLORS,
  ROLE_LABELS
} from 'services/users';
import { useAuth } from 'contexts/AuthContext';

// assets
import {
  PlusOutlined,
  EditOutlined,
  KeyOutlined,
  ReloadOutlined,
  EyeOutlined,
  EyeInvisibleOutlined
} from '@ant-design/icons';

// ==============================|| USER MANAGEMENT PAGE ||============================== //

function formatDateTime(value?: string | null): string {
  if (!value) return '-';
  try {
    const date = new Date(value);
    if (isNaN(date.getTime())) return '-';
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

export default function UserManagementPage() {
  const { user: currentUser } = useAuth();

  // Data state
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  // Filters
  const [keyword, setKeyword] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // User dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formUsername, setFormUsername] = useState('');
  const [formDisplayName, setFormDisplayName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState('viewer');
  const [formPassword, setFormPassword] = useState('');
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Password reset dialog state
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordUser, setPasswordUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resettingPassword, setResettingPassword] = useState(false);

  // Status toggle dialog state
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [statusUser, setStatusUser] = useState<User | null>(null);
  const [togglingStatus, setTogglingStatus] = useState(false);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'warning' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params: { keyword?: string; role?: string; is_active?: boolean; page?: number; size?: number } = {
        page: page + 1,
        size: rowsPerPage
      };
      if (keyword) params.keyword = keyword;
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.is_active = statusFilter === 'active';

      const response = await getUsers(params);

      if (response.success) {
        setUsers(response.data || []);
        setTotal(response.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, keyword, roleFilter, statusFilter]);

  // Fetch roles
  const fetchRoles = useCallback(async () => {
    try {
      const response = await getRoles();
      if (response.success && response.data) {
        // Filter out service role
        setRoles(response.data.filter(r => r.code !== 'service'));
      }
    } catch (error) {
      console.error('Failed to fetch roles:', error);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  // Handlers
  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleKeywordKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      setPage(0);
      fetchUsers();
    }
  };

  const handleResetFilters = () => {
    setKeyword('');
    setRoleFilter('');
    setStatusFilter('');
    setPage(0);
  };

  // Create user dialog
  const handleOpenCreateDialog = () => {
    setDialogMode('create');
    setEditingUser(null);
    setFormUsername('');
    setFormDisplayName('');
    setFormEmail('');
    setFormRole('viewer');
    setFormPassword('');
    setShowFormPassword(false);
    setFormError(null);
    setDialogOpen(true);
  };

  // Edit user dialog
  const handleOpenEditDialog = (user: User) => {
    setDialogMode('edit');
    setEditingUser(user);
    setFormUsername(user.username);
    setFormDisplayName(user.display_name);
    setFormEmail(user.email || '');
    setFormRole(user.roles[0]?.code || 'viewer');
    setFormPassword('');
    setShowFormPassword(false);
    setFormError(null);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
  };

  const handleSaveUser = async () => {
    setFormError(null);

    // Validation
    if (dialogMode === 'create') {
      if (!formUsername.trim()) {
        setFormError('ユーザー名を入力してください');
        return;
      }
      if (formUsername.length < 3) {
        setFormError('ユーザー名は3文字以上で入力してください');
        return;
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(formUsername)) {
        setFormError('ユーザー名は英数字、ハイフン、アンダースコアのみ使用できます');
        return;
      }
      if (!formPassword) {
        setFormError('初期パスワードを入力してください');
        return;
      }
      if (formPassword.length < 8) {
        setFormError('パスワードは8文字以上で入力してください');
        return;
      }
    }

    if (!formDisplayName.trim()) {
      setFormError('表示名を入力してください');
      return;
    }

    if (formEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formEmail)) {
      setFormError('有効なメールアドレスを入力してください');
      return;
    }

    setSaving(true);
    try {
      if (dialogMode === 'create') {
        const response = await createUser({
          username: formUsername.trim(),
          display_name: formDisplayName.trim(),
          email: formEmail.trim() || undefined,
          role: formRole,
          password: formPassword
        });

        if (response.success) {
          setSnackbar({ open: true, message: 'ユーザーを作成しました', severity: 'success' });
          setDialogOpen(false);
          fetchUsers();
        } else if (response.errorCode === 409) {
          setFormError('このユーザー名は既に使用されています');
        } else {
          setFormError(response.errorMessage || '作成に失敗しました');
        }
      } else {
        if (!editingUser) return;

        // Check if trying to change own role
        if (editingUser.id === currentUser?.id && editingUser.roles[0]?.code !== formRole) {
          setFormError('自分自身のロールは変更できません');
          return;
        }

        const response = await updateUser(editingUser.id, {
          display_name: formDisplayName.trim(),
          email: formEmail.trim() || undefined,
          role: formRole,
          version: editingUser.version
        });

        if (response.success) {
          setSnackbar({ open: true, message: 'ユーザー情報を更新しました', severity: 'success' });
          setDialogOpen(false);
          fetchUsers();
        } else if (response.errorCode === 409) {
          setFormError('データが更新されています。再読み込みしてください');
        } else {
          setFormError(response.errorMessage || '更新に失敗しました');
        }
      }
    } catch (error) {
      setFormError('システムエラーが発生しました');
    } finally {
      setSaving(false);
    }
  };

  // Password reset dialog
  const handleOpenPasswordDialog = (user: User) => {
    setPasswordUser(user);
    setNewPassword('');
    setShowNewPassword(false);
    setPasswordDialogOpen(true);
  };

  const handleClosePasswordDialog = () => {
    setPasswordDialogOpen(false);
    setPasswordUser(null);
  };

  const handleResetPassword = async () => {
    if (!passwordUser) return;

    if (!newPassword) {
      setSnackbar({ open: true, message: '新しいパスワードを入力してください', severity: 'error' });
      return;
    }

    if (newPassword.length < 8) {
      setSnackbar({ open: true, message: 'パスワードは8文字以上で入力してください', severity: 'error' });
      return;
    }

    setResettingPassword(true);
    try {
      const response = await resetUserPassword(passwordUser.id, { new_password: newPassword });

      if (response.success) {
        setSnackbar({ open: true, message: 'パスワードをリセットしました。新しいパスワードをユーザーに通知してください。', severity: 'success' });
        setPasswordDialogOpen(false);
      } else {
        setSnackbar({ open: true, message: response.errorMessage || 'パスワードリセットに失敗しました', severity: 'error' });
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'システムエラーが発生しました', severity: 'error' });
    } finally {
      setResettingPassword(false);
    }
  };

  // Status toggle dialog
  const handleOpenStatusDialog = (user: User) => {
    setStatusUser(user);
    setStatusDialogOpen(true);
  };

  const handleCloseStatusDialog = () => {
    setStatusDialogOpen(false);
    setStatusUser(null);
  };

  const handleToggleStatus = async () => {
    if (!statusUser) return;

    // Check if trying to disable self
    if (statusUser.id === currentUser?.id) {
      setSnackbar({ open: true, message: '自分自身を無効化することはできません', severity: 'error' });
      setStatusDialogOpen(false);
      return;
    }

    setTogglingStatus(true);
    try {
      const response = await updateUserStatus(statusUser.id, {
        is_active: !statusUser.is_active,
        version: statusUser.version
      });

      if (response.success) {
        const message = statusUser.is_active ? 'ユーザーを無効化しました' : 'ユーザーを有効化しました';
        setSnackbar({ open: true, message, severity: 'success' });
        setStatusDialogOpen(false);
        fetchUsers();
      } else if (response.errorCode === 409) {
        setSnackbar({ open: true, message: 'データが更新されています。再読み込みしてください', severity: 'warning' });
      } else {
        setSnackbar({ open: true, message: response.errorMessage || 'ステータス変更に失敗しました', severity: 'error' });
      }
    } catch (error) {
      setSnackbar({ open: true, message: 'システムエラーが発生しました', severity: 'error' });
    } finally {
      setTogglingStatus(false);
    }
  };

  return (
    <Grid container spacing={3}>
      {/* Header */}
      <Grid size={12}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h5">ユーザー管理</Typography>
          <Stack direction="row" spacing={1}>
            <IconButton onClick={fetchUsers} size="small">
              <ReloadOutlined />
            </IconButton>
            <Button
              variant="contained"
              startIcon={<PlusOutlined />}
              onClick={handleOpenCreateDialog}
            >
              新規ユーザー作成
            </Button>
          </Stack>
        </Stack>
      </Grid>

      {/* Filters */}
      <Grid size={12}>
        <MainCard>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <TextField
              size="small"
              label="キーワード"
              placeholder="名前・メール"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyPress={handleKeywordKeyPress}
              sx={{ minWidth: 200 }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>ロール</InputLabel>
              <Select value={roleFilter} label="ロール" onChange={(e: SelectChangeEvent) => { setRoleFilter(e.target.value); setPage(0); }}>
                <MenuItem value="">すべて</MenuItem>
                {roles.map((role) => (
                  <MenuItem key={role.code} value={role.code}>{role.name || ROLE_LABELS[role.code] || role.code}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>ステータス</InputLabel>
              <Select value={statusFilter} label="ステータス" onChange={(e: SelectChangeEvent) => { setStatusFilter(e.target.value); setPage(0); }}>
                <MenuItem value="">すべて</MenuItem>
                <MenuItem value="active">有効</MenuItem>
                <MenuItem value="inactive">無効</MenuItem>
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
                  <TableCell>ユーザー名</TableCell>
                  <TableCell>表示名</TableCell>
                  <TableCell>メールアドレス</TableCell>
                  <TableCell>ロール</TableCell>
                  <TableCell>ステータス</TableCell>
                  <TableCell>最終ログイン</TableCell>
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
                      <TableCell><Skeleton /></TableCell>
                    </TableRow>
                  ))
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">データがありません</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>
                        <Typography sx={{ fontFamily: 'monospace' }}>{user.username}</Typography>
                      </TableCell>
                      <TableCell>{user.display_name}</TableCell>
                      <TableCell>{user.email || '-'}</TableCell>
                      <TableCell>
                        {user.roles.map((role) => (
                          <Chip
                            key={role.code}
                            label={role.name || ROLE_LABELS[role.code] || role.code}
                            size="small"
                            color={ROLE_COLORS[role.code] || 'default'}
                          />
                        ))}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.is_active ? '有効' : '無効'}
                          size="small"
                          color={user.is_active ? 'success' : 'error'}
                          onClick={() => handleOpenStatusDialog(user)}
                          sx={{ cursor: 'pointer' }}
                        />
                      </TableCell>
                      <TableCell>{formatDateTime(user.last_login_at)}</TableCell>
                      <TableCell align="center">
                        <Tooltip title="編集">
                          <IconButton size="small" onClick={() => handleOpenEditDialog(user)}>
                            <EditOutlined />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="パスワードリセット">
                          <IconButton size="small" onClick={() => handleOpenPasswordDialog(user)}>
                            <KeyOutlined />
                          </IconButton>
                        </Tooltip>
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

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{dialogMode === 'create' ? '新規ユーザー作成' : 'ユーザー編集'}</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            {formError && <Alert severity="error">{formError}</Alert>}

            <TextField
              label="ユーザー名"
              value={formUsername}
              onChange={(e) => setFormUsername(e.target.value)}
              fullWidth
              required
              disabled={dialogMode === 'edit'}
              helperText={dialogMode === 'create' ? '英数字、ハイフン、アンダースコアのみ' : 'ユーザー名は変更できません'}
            />

            <TextField
              label="表示名"
              value={formDisplayName}
              onChange={(e) => setFormDisplayName(e.target.value)}
              fullWidth
              required
            />

            <TextField
              label="メールアドレス"
              type="email"
              value={formEmail}
              onChange={(e) => setFormEmail(e.target.value)}
              fullWidth
            />

            <FormControl fullWidth required>
              <InputLabel>ロール</InputLabel>
              <Select
                value={formRole}
                label="ロール"
                onChange={(e: SelectChangeEvent) => setFormRole(e.target.value)}
                disabled={dialogMode === 'edit' && editingUser?.id === currentUser?.id}
              >
                {roles.map((role) => (
                  <MenuItem key={role.code} value={role.code}>
                    {role.name || ROLE_LABELS[role.code] || role.code}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {dialogMode === 'create' && (
              <TextField
                label="初期パスワード"
                type={showFormPassword ? 'text' : 'password'}
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                fullWidth
                required
                helperText="8文字以上で入力してください"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowFormPassword(!showFormPassword)}
                        edge="end"
                      >
                        {showFormPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>キャンセル</Button>
          <Button onClick={handleSaveUser} variant="contained" disabled={saving}>
            {saving ? '保存中...' : dialogMode === 'create' ? '作成' : '保存'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={passwordDialogOpen} onClose={handleClosePasswordDialog} maxWidth="sm" fullWidth>
        <DialogTitle>パスワードリセット</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Typography>
              ユーザー: <strong>{passwordUser?.username}</strong> ({passwordUser?.display_name})
            </Typography>

            <TextField
              label="新しいパスワード"
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              fullWidth
              required
              helperText="8文字以上で入力してください"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      edge="end"
                    >
                      {showNewPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            <Alert severity="warning">
              リセット後、このユーザーの全セッションが無効化されます。
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePasswordDialog}>キャンセル</Button>
          <Button onClick={handleResetPassword} variant="contained" color="warning" disabled={resettingPassword}>
            {resettingPassword ? 'リセット中...' : 'リセット'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Toggle Dialog */}
      <Dialog open={statusDialogOpen} onClose={handleCloseStatusDialog}>
        <DialogTitle>
          {statusUser?.is_active ? 'ユーザーを無効化' : 'ユーザーを有効化'}
        </DialogTitle>
        <DialogContent>
          <Typography>
            {statusUser?.is_active
              ? `${statusUser?.display_name} を無効にしますか？ 無効化すると、このユーザーはログインできなくなります。`
              : `${statusUser?.display_name} を有効にしますか？`}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseStatusDialog}>キャンセル</Button>
          <Button
            onClick={handleToggleStatus}
            variant="contained"
            color={statusUser?.is_active ? 'error' : 'success'}
            disabled={togglingStatus}
          >
            {togglingStatus ? '処理中...' : statusUser?.is_active ? '無効化' : '有効化'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
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
