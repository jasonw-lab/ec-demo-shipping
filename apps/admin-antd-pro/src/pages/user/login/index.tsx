/**
 * ログイン画面（SCR-010）
 * Issue 507: ログイン画面
 */
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { LoginForm, ProFormText } from '@ant-design/pro-components';
import { Helmet, history, useModel } from '@umijs/max';
import { Alert, App } from 'antd';
import { createStyles } from 'antd-style';
import React, { useState } from 'react';
import { flushSync } from 'react-dom';
import { Footer } from '@/components';
import { toCurrentUser } from '@/lib/auth/types';
import { login, toAuthError } from '@/services/auth/api';
import Settings from '../../../../config/defaultSettings';

const useStyles = createStyles(({ token }) => {
  return {
    container: {
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'auto',
      backgroundImage:
        "url('https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/V-_oS6r-i7wAAAAAAAAAAAAAFl94AQBr')",
      backgroundSize: '100% 100%',
    },
    content: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '32px 0',
    },
  };
});

/** エラーメッセージコンポーネント */
const LoginMessage: React.FC<{
  content: string;
}> = ({ content }) => {
  return (
    <Alert
      style={{
        marginBottom: 24,
      }}
      message={content}
      type="error"
      showIcon
    />
  );
};

/** ログインフォームの入力値 */
interface LoginFormValues {
  username: string;
  password: string;
}

const Login: React.FC = () => {
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const { initialState, setInitialState } = useModel('@@initialState');
  const { styles } = useStyles();
  const { message } = App.useApp();

  /**
   * ログイン成功後にユーザー情報を更新
   */
  const updateUserInfo = async (username: string, password: string) => {
    try {
      const response = await login({ username, password });

      // initialState を更新
      flushSync(() => {
        setInitialState((s) => ({
          ...s,
          currentUser: toCurrentUser(response.user),
        }));
      });

      return true;
    } catch (error) {
      const authError = toAuthError(error);
      setErrorMessage(authError.message);
      return false;
    }
  };

  /**
   * フォーム送信ハンドラ
   */
  const handleSubmit = async (values: LoginFormValues) => {
    setSubmitting(true);
    setErrorMessage('');

    try {
      const success = await updateUserInfo(values.username, values.password);

      if (success) {
        message.success('ログインしました');

        // リダイレクト先を取得
        const urlParams = new URL(window.location.href).searchParams;
        const redirect = urlParams.get('redirect');

        // SPA内遷移でリダイレクト
        history.push(redirect || '/');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      <Helmet>
        <title>ログイン - {Settings.title}</title>
      </Helmet>
      <div className={styles.content}>
        <LoginForm
          contentStyle={{
            minWidth: 280,
            maxWidth: '75vw',
          }}
          logo={<img alt="logo" src="/logo.svg" />}
          title="発送管理システム"
          subTitle="Shipping Service Admin"
          initialValues={{
            username: '',
            password: '',
          }}
          submitter={{
            searchConfig: {
              submitText: 'ログイン',
            },
            submitButtonProps: {
              loading: submitting,
              size: 'large',
              style: {
                width: '100%',
              },
            },
          }}
          onFinish={async (values) => {
            await handleSubmit(values as LoginFormValues);
          }}
        >
          {errorMessage && <LoginMessage content={errorMessage} />}

          <ProFormText
            name="username"
            fieldProps={{
              size: 'large',
              prefix: <UserOutlined />,
            }}
            placeholder="ユーザー名"
            rules={[
              {
                required: true,
                message: 'ユーザー名を入力してください',
              },
              {
                min: 3,
                message: 'ユーザー名は3文字以上で入力してください',
              },
              {
                max: 50,
                message: 'ユーザー名は50文字以下で入力してください',
              },
            ]}
          />

          <ProFormText.Password
            name="password"
            fieldProps={{
              size: 'large',
              prefix: <LockOutlined />,
            }}
            placeholder="パスワード"
            rules={[
              {
                required: true,
                message: 'パスワードを入力してください',
              },
              {
                min: 8,
                message: 'パスワードは8文字以上で入力してください',
              },
            ]}
          />
        </LoginForm>
      </div>
      <Footer />
    </div>
  );
};

export default Login;
