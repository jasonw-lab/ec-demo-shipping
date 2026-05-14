import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// material-ui
import Button from '@mui/material/Button';
import FormHelperText from '@mui/material/FormHelperText';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';

// third-party
import * as Yup from 'yup';
import { Formik } from 'formik';

// project imports
import IconButton from 'components/@extended/IconButton';
import AnimateButton from 'components/@extended/AnimateButton';
import { useAuth } from 'contexts/AuthContext';

// assets
import EyeOutlined from '@ant-design/icons/EyeOutlined';
import EyeInvisibleOutlined from '@ant-design/icons/EyeInvisibleOutlined';

// ============================|| JWT - LOGIN ||============================ //

export default function AuthLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState(null);

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  return (
    <>
      <Formik
        initialValues={{
          username: '',
          password: '',
          submit: null
        }}
        validationSchema={Yup.object().shape({
          username: Yup.string()
            .min(3, 'ユーザー名は3文字以上で入力してください')
            .max(50, 'ユーザー名は50文字以内で入力してください')
            .required('ユーザー名を入力してください'),
          password: Yup.string().min(8, 'パスワードは8文字以上で入力してください').required('パスワードを入力してください')
        })}
        onSubmit={async (values, { setSubmitting }) => {
          setLoginError(null);
          try {
            const result = await login(values.username, values.password);
            if (result.success) {
              navigate('/');
            } else {
              setLoginError(result.error || 'ユーザー名またはパスワードが正しくありません');
            }
          } catch {
            setLoginError('システムエラーが発生しました。しばらく待ってから再試行してください');
          }
          setSubmitting(false);
        }}
      >
        {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
          <form noValidate onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {loginError && (
                <Grid size={12}>
                  <Alert severity="error">{loginError}</Alert>
                </Grid>
              )}
              <Grid size={12}>
                <Stack sx={{ gap: 1 }}>
                  <InputLabel htmlFor="username-login">ユーザー名</InputLabel>
                  <OutlinedInput
                    id="username-login"
                    type="text"
                    value={values.username}
                    name="username"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    placeholder="ユーザー名を入力"
                    fullWidth
                    autoComplete="username"
                    error={Boolean(touched.username && errors.username)}
                  />
                </Stack>
                {touched.username && errors.username && (
                  <FormHelperText error id="standard-weight-helper-text-username-login">
                    {errors.username}
                  </FormHelperText>
                )}
              </Grid>
              <Grid size={12}>
                <Stack sx={{ gap: 1 }}>
                  <InputLabel htmlFor="password-login">パスワード</InputLabel>
                  <OutlinedInput
                    fullWidth
                    error={Boolean(touched.password && errors.password)}
                    id="password-login"
                    type={showPassword ? 'text' : 'password'}
                    value={values.password}
                    name="password"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    autoComplete="current-password"
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleClickShowPassword}
                          onMouseDown={handleMouseDownPassword}
                          edge="end"
                          color="secondary"
                        >
                          {showPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                        </IconButton>
                      </InputAdornment>
                    }
                    placeholder="パスワードを入力"
                  />
                </Stack>
                {touched.password && errors.password && (
                  <FormHelperText error id="standard-weight-helper-text-password-login">
                    {errors.password}
                  </FormHelperText>
                )}
              </Grid>
              <Grid size={12}>
                <AnimateButton>
                  <Button
                    fullWidth
                    size="large"
                    variant="contained"
                    color="primary"
                    type="submit"
                    disabled={isSubmitting}
                    startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
                  >
                    {isSubmitting ? 'ログイン中...' : 'ログイン'}
                  </Button>
                </AnimateButton>
              </Grid>
            </Grid>
          </form>
        )}
      </Formik>
    </>
  );
}
