import { useState, useEffect } from 'react';

// material-ui
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';

// project imports
import MainCard from 'components/MainCard';
import {
  getProfile,
  updateProfile,
  changePassword,
  UserProfile,
  ROLE_LABELS
} from 'services/users';

// assets
import {
  EyeOutlined,
  EyeInvisibleOutlined
} from '@ant-design/icons';

// ==============================|| PROFILE PAGE ||============================== //

export default function ProfilePage() {
  // Profile state
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Snackbar
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  // Fetch profile on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await getProfile();
        if (response.success && response.data) {
          setProfile(response.data);
          setDisplayName(response.data.display_name);
          setEmail(response.data.email || '');
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Handle profile save
  const handleSaveProfile = async () => {
    setFormError(null);

    if (!displayName.trim()) {
      setFormError('表示名を入力してください');
      return;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError('有効なメールアドレスを入力してください');
      return;
    }

    setSaving(true);
    try {
      const response = await updateProfile({
        display_name: displayName.trim(),
        email: email.trim() || undefined,
        version: profile?.version || 1
      });

      if (response.success && response.data) {
        setProfile(response.data);
        setSnackbar({ open: true, message: 'プロフィールを更新しました', severity: 'success' });
      } else if (response.errorCode === 409) {
        setFormError('データが更新されています。再読み込みしてください');
      } else {
        setFormError(response.errorMessage || '更新に失敗しました');
      }
    } catch (error) {
      setFormError('システムエラーが発生しました');
    } finally {
      setSaving(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (profile) {
      setDisplayName(profile.display_name);
      setEmail(profile.email || '');
      setFormError(null);
    }
  };

  // Handle password change
  const handleChangePassword = async () => {
    setPasswordError(null);

    if (!currentPassword) {
      setPasswordError('現在のパスワードを入力してください');
      return;
    }

    if (!newPassword) {
      setPasswordError('新しいパスワードを入力してください');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('パスワードは8文字以上で入力してください');
      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError('現在のパスワードと異なるパスワードを入力してください');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('パスワードが一致しません');
      return;
    }

    setChangingPassword(true);
    try {
      const response = await changePassword({
        current_password: currentPassword,
        new_password: newPassword
      });

      if (response.success) {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setSnackbar({ open: true, message: 'パスワードを変更しました', severity: 'success' });
      } else if (response.errorCode === 401) {
        setPasswordError('現在のパスワードが正しくありません');
      } else {
        setPasswordError(response.errorMessage || 'パスワード変更に失敗しました');
      }
    } catch (error) {
      setPasswordError('システムエラーが発生しました');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <Grid container justifyContent="center" sx={{ py: 4 }}>
        <CircularProgress />
      </Grid>
    );
  }

  return (
    <Grid container spacing={3}>
      {/* Header */}
      <Grid size={12}>
        <Typography variant="h5">マイプロフィール</Typography>
      </Grid>

      {/* Profile Card */}
      <Grid size={{ xs: 12, md: 6 }}>
        <MainCard>
          <CardHeader title="プロフィール情報" sx={{ p: 0, pb: 2 }} />
          <Divider sx={{ mb: 2 }} />

          <Stack spacing={3}>
            {/* Read-only fields */}
            <Stack direction="row" alignItems="center" spacing={2}>
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
                ユーザー名
              </Typography>
              <Typography variant="body1">{profile?.username}</Typography>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={2}>
              <Typography variant="body2" color="text.secondary" sx={{ minWidth: 100 }}>
                ロール
              </Typography>
              <Stack direction="row" spacing={1}>
                {profile?.roles.map((role) => (
                  <Chip
                    key={role.code}
                    label={role.name || ROLE_LABELS[role.code] || role.code}
                    size="small"
                    color={role.code === 'admin' ? 'secondary' : role.code === 'operator' ? 'primary' : 'default'}
                  />
                ))}
              </Stack>
            </Stack>

            <Divider />

            {/* Editable fields */}
            {formError && <Alert severity="error">{formError}</Alert>}

            <TextField
              label="表示名"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              fullWidth
              required
              error={!displayName.trim()}
            />

            <TextField
              label="メールアドレス"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              fullWidth
            />

            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button variant="outlined" onClick={handleCancel} disabled={saving}>
                キャンセル
              </Button>
              <Button
                variant="contained"
                onClick={handleSaveProfile}
                disabled={saving}
                startIcon={saving ? <CircularProgress size={20} color="inherit" /> : null}
              >
                {saving ? '保存中...' : '保存'}
              </Button>
            </Stack>
          </Stack>
        </MainCard>
      </Grid>

      {/* Password Change Card */}
      <Grid size={{ xs: 12, md: 6 }}>
        <MainCard>
          <CardHeader title="パスワード変更" sx={{ p: 0, pb: 2 }} />
          <Divider sx={{ mb: 2 }} />

          <Stack spacing={3}>
            {passwordError && <Alert severity="error">{passwordError}</Alert>}

            <TextField
              label="現在のパスワード"
              type={showCurrentPassword ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              fullWidth
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      edge="end"
                    >
                      {showCurrentPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

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

            <TextField
              label="新しいパスワード（確認）"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              fullWidth
              required
              error={confirmPassword !== '' && newPassword !== confirmPassword}
              helperText={confirmPassword !== '' && newPassword !== confirmPassword ? 'パスワードが一致しません' : ''}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="contained"
                onClick={handleChangePassword}
                disabled={changingPassword}
                startIcon={changingPassword ? <CircularProgress size={20} color="inherit" /> : null}
              >
                {changingPassword ? '変更中...' : 'パスワードを変更'}
              </Button>
            </Stack>
          </Stack>
        </MainCard>
      </Grid>

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
