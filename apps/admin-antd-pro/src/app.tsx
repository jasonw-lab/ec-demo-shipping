import { LinkOutlined } from '@ant-design/icons';
import type { Settings as LayoutSettings } from '@ant-design/pro-components';
import { SettingDrawer } from '@ant-design/pro-components';
import type { RequestOptions } from '@@/plugin-request/request';
import type { RequestConfig, RunTimeLayoutConfig } from '@umijs/max';
import { history, Link } from '@umijs/max';
import React from 'react';
import {
  AvatarDropdown,
  AvatarName,
  Footer,
  Question,
  SelectLang,
} from '@/components';
import type { CurrentUser } from '@/lib/auth/types';
import { toCurrentUser } from '@/lib/auth/types';
import { getAccessToken, clearAccessToken } from '@/lib/auth/token';
import { getCurrentUser, refreshToken } from '@/services/auth/api';
import defaultSettings from '../config/defaultSettings';
import { errorConfig } from './requestErrorConfig';
import '@ant-design/v5-patch-for-react-19';

const isDev = process.env.NODE_ENV === 'development' || process.env.CI;
const loginPath = '/user/login';

/**
 * @see https://umijs.org/docs/api/runtime-config#getinitialstate
 */
export async function getInitialState(): Promise<{
  settings?: Partial<LayoutSettings>;
  currentUser?: CurrentUser;
  loading?: boolean;
  fetchUserInfo?: () => Promise<CurrentUser | undefined>;
}> {
  const fetchUserInfo = async (): Promise<CurrentUser | undefined> => {
    try {
      const user = await getCurrentUser();
      if (user) {
        return toCurrentUser(user);
      }
    } catch {
      // 認証失敗時は何もしない
    }
    return undefined;
  };

  const { location } = history;

  // ログインページ以外では認証チェック
  if (
    ![loginPath, '/user/register', '/user/register-result'].includes(
      location.pathname,
    )
  ) {
    const currentUser = await fetchUserInfo();
    if (!currentUser) {
      // 未認証の場合はログインページへリダイレクト
      history.push(loginPath);
      return {
        fetchUserInfo,
        settings: defaultSettings as Partial<LayoutSettings>,
      };
    }
    return {
      fetchUserInfo,
      currentUser,
      settings: defaultSettings as Partial<LayoutSettings>,
    };
  }

  return {
    fetchUserInfo,
    settings: defaultSettings as Partial<LayoutSettings>,
  };
}

// ProLayout 支持的api https://procomponents.ant.design/components/layout
export const layout: RunTimeLayoutConfig = ({
  initialState,
  setInitialState,
}) => {
  return {
    actionsRender: () => [
      <Question key="doc" />,
      <SelectLang key="SelectLang" />,
    ],
    avatarProps: {
      src: initialState?.currentUser?.avatar,
      title: <AvatarName />,
      render: (_, avatarChildren) => {
        return <AvatarDropdown>{avatarChildren}</AvatarDropdown>;
      },
    },
    waterMarkProps: {
      content: '',
    },
    footerRender: () => <Footer />,
    onPageChange: () => {
      const { location } = history;
      // ログインページ以外で未認証の場合はリダイレクト
      if (!initialState?.currentUser && location.pathname !== loginPath) {
        history.push(loginPath);
      }
    },
    bgLayoutImgList: [
      {
        src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/D2LWSqNny4sAAAAAAAAAAAAAFl94AQBr',
        left: 85,
        bottom: 100,
        height: '303px',
      },
      {
        src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/C2TWRpJpiC0AAAAAAAAAAAAAFl94AQBr',
        bottom: -68,
        right: -45,
        height: '303px',
      },
      {
        src: 'https://mdn.alipayobjects.com/yuyan_qk0oxh/afts/img/F6vSTbj8KpYAAAAAAAAAAAAAFl94AQBr',
        bottom: 0,
        left: 0,
        width: '331px',
      },
    ],
    links: isDev
      ? [
          <Link key="openapi" to="/umi/plugin/openapi" target="_blank">
            <LinkOutlined />
            <span>OpenAPI 文档</span>
          </Link>,
        ]
      : [],
    menuHeaderRender: undefined,
    childrenRender: (children) => {
      return (
        <>
          {children}
          {isDev && (
            <SettingDrawer
              disableUrlParams
              enableDarkTheme
              settings={initialState?.settings}
              onSettingChange={(settings) => {
                setInitialState((preInitialState) => ({
                  ...preInitialState,
                  settings,
                }));
              }}
            />
          )}
        </>
      );
    },
    ...initialState?.settings,
  };
};

/**
 * @name request 配置
 * @doc https://umijs.org/docs/max/request#配置
 */
export const request: RequestConfig = {
  baseURL: process.env.UMI_APP_API_BASE_URL || '',
  withCredentials: true, // Cookie を送受信
  ...errorConfig,
  requestInterceptors: [
    (config: RequestOptions) => {
      // Authorization ヘッダーを追加
      const token = getAccessToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    ...(errorConfig.requestInterceptors || []),
  ],
  responseInterceptors: [
    async (response) => {
      // 401 エラー時の処理
      if (response.status === 401) {
        // トークンリフレッシュを試行
        const refreshed = await refreshToken();
        if (!refreshed) {
          // リフレッシュ失敗時はログアウト
          clearAccessToken();
          history.push(loginPath);
        }
      }
      return response;
    },
    ...(errorConfig.responseInterceptors || []),
  ],
};
