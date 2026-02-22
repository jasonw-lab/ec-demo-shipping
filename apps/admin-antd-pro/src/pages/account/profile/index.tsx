/**
 * プロフィール画面
 * Issue 508: SCR-020 プロフィール画面
 */
import { UserOutlined } from '@ant-design/icons';
import { PageContainer, ProForm, ProFormText } from '@ant-design/pro-components';
import { useModel } from '@umijs/max';
import { Badge, Card, Divider, Form, Input, message, Spin, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import {
  changeMyPassword,
  getMyProfile,
  updateMyProfile,
  type UserData,
} from '@/services/users/api';

const { Title, Text } = Typography;

/** ロールバッジの色 */
const ROLE_COLORS: Record<string, string> = {
  admin: 'purple',
  operator: 'blue',
  viewer: 'default',
};

/** ロール名の日本語表示 */
const ROLE_NAMES: Record<string, string> = {
  admin: 'システム管理者',
  operator: 'オペレーター',
  viewer: '閲覧者',
};

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordChanging, setPasswordChanging] = useState(false);
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();
  const { initialState, setInitialState } = useModel('@@initialState');

  // プロフィール取得
  const fetchProfile = async () => {
    setLoading(true);
    try {
      const data = await getMyProfile();
      setProfile(data);
      profileForm.setFieldsValue({
        display_name: data.display_name,
        email: data.email || '',
      });
    } catch (error) {
      message.error('プロフィールの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // プロフィール保存
  const handleProfileSubmit = async (values: { display_name: string; email?: string }) => {
    if (!profile) return;
    setProfileSaving(true);
    try {
      const updated = await updateMyProfile({
        display_name: values.display_name,
        email: values.email,
        version: profile.version,
      });
      setProfile(updated);
      message.success('プロフィールを更新しました');

      // ヘッダーのユーザー名も更新
      if (initialState?.currentUser) {
        setInitialState((prev) => ({
          ...prev,
          currentUser: {
            ...prev?.currentUser!,
            name: updated.display_name,
            email: updated.email || undefined,
          },
        }));
      }
    } catch (error: unknown) {
      const err = error as { response?: { status: number } };
      if (err.response?.status === 409) {
        message.error('データが更新されています。再読み込みしてください');
        await fetchProfile();
      } else {
        message.error('プロフィールの更新に失敗しました');
      }
    } finally {
      setProfileSaving(false);
    }
  };

  // プロフィール編集キャンセル
  const handleProfileReset = () => {
    if (profile) {
      profileForm.setFieldsValue({
        display_name: profile.display_name,
        email: profile.email || '',
      });
    }
  };

  // パスワード変更
  const handlePasswordSubmit = async (values: {
    current_password: string;
    new_password: string;
    confirm_password: string;
  }) => {
    setPasswordChanging(true);
    try {
      await changeMyPassword({
        current_password: values.current_password,
        new_password: values.new_password,
      });
      message.success('パスワードを変更しました');
      passwordForm.resetFields();
    } catch (error: unknown) {
      const err = error as { response?: { status: number } };
      if (err.response?.status === 401) {
        message.error('現在のパスワードが正しくありません');
      } else {
        message.error('パスワードの変更に失敗しました');
      }
    } finally {
      setPasswordChanging(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <Spin size="large" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer
      header={{
        title: (
          <>
            <UserOutlined style={{ marginRight: 8 }} />
            マイプロフィール
          </>
        ),
      }}
    >
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        {/* プロフィール情報カード */}
        <Card title="プロフィール情報" style={{ marginBottom: 24 }}>
          {/* 読み取り専用フィールド */}
          <div style={{ marginBottom: 24 }}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
              ユーザー名
            </Text>
            <Text strong>{profile?.username}</Text>
          </div>
          <div style={{ marginBottom: 24 }}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>
              ロール
            </Text>
            <div>
              {profile?.roles.map((role) => (
                <Badge
                  key={role.code}
                  color={ROLE_COLORS[role.code] || 'default'}
                  text={ROLE_NAMES[role.code] || role.name}
                  style={{ marginRight: 8 }}
                />
              ))}
            </div>
          </div>

          <Divider />

          {/* 編集可能フィールド */}
          <ProForm
            form={profileForm}
            layout="vertical"
            onFinish={handleProfileSubmit}
            onReset={handleProfileReset}
            submitter={{
              searchConfig: {
                submitText: '保存',
                resetText: 'キャンセル',
              },
              resetButtonProps: {
                onClick: handleProfileReset,
              },
            }}
            loading={profileSaving}
          >
            <ProFormText
              name="display_name"
              label="表示名"
              rules={[
                { required: true, message: '表示名を入力してください' },
                { max: 100, message: '表示名は100文字以内で入力してください' },
              ]}
              placeholder="表示名を入力"
            />
            <ProFormText
              name="email"
              label="メールアドレス"
              rules={[
                { type: 'email', message: '有効なメールアドレスを入力してください' },
                { max: 255, message: 'メールアドレスは255文字以内で入力してください' },
              ]}
              placeholder="メールアドレスを入力"
            />
          </ProForm>
        </Card>

        {/* パスワード変更カード */}
        <Card title="パスワード変更">
          <ProForm
            form={passwordForm}
            layout="vertical"
            onFinish={handlePasswordSubmit}
            submitter={{
              searchConfig: {
                submitText: 'パスワードを変更',
              },
              render: (_, dom) => dom[1],
            }}
            loading={passwordChanging}
          >
            <ProFormText.Password
              name="current_password"
              label="現在のパスワード"
              rules={[{ required: true, message: '現在のパスワードを入力してください' }]}
              placeholder="現在のパスワードを入力"
            />
            <ProFormText.Password
              name="new_password"
              label="新しいパスワード"
              rules={[
                { required: true, message: '新しいパスワードを入力してください' },
                { min: 8, message: 'パスワードは8文字以上で入力してください' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('current_password') !== value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error('現在のパスワードと異なるパスワードを入力してください'),
                    );
                  },
                }),
              ]}
              placeholder="新しいパスワードを入力"
            />
            <ProFormText.Password
              name="confirm_password"
              label="新しいパスワード（確認）"
              rules={[
                { required: true, message: '確認用パスワードを入力してください' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('new_password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('パスワードが一致しません'));
                  },
                }),
              ]}
              placeholder="新しいパスワードを再入力"
            />
          </ProForm>
        </Card>
      </div>
    </PageContainer>
  );
};

export default ProfilePage;
