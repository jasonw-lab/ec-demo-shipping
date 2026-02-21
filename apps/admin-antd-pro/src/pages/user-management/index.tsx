/**
 * ユーザー管理画面
 * Issue 509: SCR-030 ユーザー管理画面
 */
import {
  EditOutlined,
  KeyOutlined,
  PlusOutlined,
  ReloadOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import {
  ModalForm,
  PageContainer,
  ProFormSelect,
  ProFormText,
  ProTable,
} from '@ant-design/pro-components';
import { useAccess, useModel } from '@umijs/max';
import { Badge, Button, Input, message, Modal, Popconfirm, Select, Space, Tag, Tooltip } from 'antd';
import React, { useRef, useState } from 'react';
import {
  createUser,
  getUsers,
  resetUserPassword,
  updateUser,
  updateUserStatus,
  type UserData,
} from '@/services/users/api';

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

/** ロール選択肢 */
const ROLE_OPTIONS = [
  { label: 'システム管理者', value: 'admin' },
  { label: 'オペレーター', value: 'operator' },
  { label: '閲覧者', value: 'viewer' },
];

const UserManagementPage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const access = useAccess();
  const { initialState } = useModel('@@initialState');
  const currentUserId = initialState?.currentUser?.userid;

  // ダイアログ状態
  const [userFormVisible, setUserFormVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [passwordResetVisible, setPasswordResetVisible] = useState(false);
  const [resetTargetUser, setResetTargetUser] = useState<UserData | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // フィルター状態
  const [filters, setFilters] = useState<{
    keyword?: string;
    role?: string;
    is_active?: boolean;
  }>({});

  // ユーザー作成/編集ダイアログを開く
  const handleOpenUserForm = (user?: UserData) => {
    setEditingUser(user || null);
    setUserFormVisible(true);
  };

  // ユーザー作成/編集
  const handleUserFormSubmit = async (values: {
    username?: string;
    display_name: string;
    email?: string;
    role: string;
    password?: string;
  }) => {
    try {
      if (editingUser) {
        // 編集
        await updateUser(editingUser.id, {
          display_name: values.display_name,
          email: values.email,
          role: values.role,
          version: editingUser.version,
        });
        message.success('ユーザー情報を更新しました');
      } else {
        // 新規作成
        await createUser({
          username: values.username!,
          display_name: values.display_name,
          email: values.email,
          role: values.role,
          password: values.password!,
        });
        message.success('ユーザーを作成しました');
      }
      setUserFormVisible(false);
      setEditingUser(null);
      actionRef.current?.reload();
      return true;
    } catch (error: unknown) {
      const err = error as { response?: { status: number } };
      if (err.response?.status === 409) {
        if (editingUser) {
          message.error('データが更新されています。再読み込みしてください');
          actionRef.current?.reload();
        } else {
          message.error('このユーザー名は既に使用されています');
        }
      } else {
        message.error(editingUser ? 'ユーザー情報の更新に失敗しました' : 'ユーザーの作成に失敗しました');
      }
      return false;
    }
  };

  // ステータス変更
  const handleStatusChange = async (user: UserData) => {
    const newStatus = !user.is_active;
    try {
      await updateUserStatus(user.id, {
        is_active: newStatus,
        version: user.version,
      });
      message.success(newStatus ? 'ユーザーを有効化しました' : 'ユーザーを無効化しました');
      actionRef.current?.reload();
    } catch (error: unknown) {
      const err = error as { response?: { status: number } };
      if (err.response?.status === 409) {
        message.error('データが更新されています。再読み込みしてください');
        actionRef.current?.reload();
      } else {
        message.error('ステータスの変更に失敗しました');
      }
    }
  };

  // パスワードリセットダイアログを開く
  const handleOpenPasswordReset = (user: UserData) => {
    setResetTargetUser(user);
    setNewPassword('');
    setPasswordResetVisible(true);
  };

  // パスワードリセット
  const handlePasswordReset = async () => {
    if (!resetTargetUser || !newPassword) return;
    if (newPassword.length < 8) {
      message.error('パスワードは8文字以上で入力してください');
      return;
    }
    try {
      await resetUserPassword(resetTargetUser.id, newPassword);
      message.success('パスワードをリセットしました。新しいパスワードをユーザーに通知してください。');
      setPasswordResetVisible(false);
      setResetTargetUser(null);
      setNewPassword('');
    } catch {
      message.error('パスワードのリセットに失敗しました');
    }
  };

  // テーブルカラム定義
  const columns: ProColumns<UserData>[] = [
    {
      title: 'ユーザー名',
      dataIndex: 'username',
      width: 120,
      sorter: true,
    },
    {
      title: '表示名',
      dataIndex: 'display_name',
      width: 150,
      sorter: true,
    },
    {
      title: 'メールアドレス',
      dataIndex: 'email',
      width: 200,
      sorter: true,
      render: (_, record) => record.email || '-',
    },
    {
      title: 'ロール',
      dataIndex: 'roles',
      width: 120,
      render: (_, record) => (
        <Space>
          {record.roles.map((role) => (
            <Tag key={role.code} color={ROLE_COLORS[role.code] || 'default'}>
              {ROLE_NAMES[role.code] || role.name}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: 'ステータス',
      dataIndex: 'is_active',
      width: 100,
      render: (_, record) => {
        const isSelf = String(record.id) === currentUserId;
        const badge = record.is_active ? (
          <Badge status="success" text="有効" />
        ) : (
          <Badge status="error" text="無効" />
        );
        if (isSelf) {
          return badge;
        }
        return (
          <Popconfirm
            title={record.is_active ? 'ユーザーを無効化' : 'ユーザーを有効化'}
            description={
              record.is_active
                ? 'このユーザーを無効にしますか？無効化すると、このユーザーはログインできなくなります。'
                : 'このユーザーを有効にしますか？'
            }
            onConfirm={() => handleStatusChange(record)}
            okText="実行"
            cancelText="キャンセル"
          >
            <span style={{ cursor: 'pointer' }}>{badge}</span>
          </Popconfirm>
        );
      },
    },
    {
      title: '最終ログイン',
      dataIndex: 'last_login_at',
      width: 140,
      sorter: true,
      render: (_, record) => {
        if (!record.last_login_at) return '-';
        const date = new Date(record.last_login_at);
        return date.toLocaleString('ja-JP');
      },
    },
    {
      title: '操作',
      width: 100,
      valueType: 'option',
      render: (_, record) => {
        const isSelf = String(record.id) === currentUserId;
        return (
          <Space>
            <Tooltip title="編集">
              <Button
                type="text"
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleOpenUserForm(record)}
              />
            </Tooltip>
            <Tooltip title="パスワードリセット">
              <Button
                type="text"
                size="small"
                icon={<KeyOutlined />}
                onClick={() => handleOpenPasswordReset(record)}
                disabled={isSelf}
              />
            </Tooltip>
          </Space>
        );
      },
    },
  ];

  return (
    <PageContainer
      header={{
        title: (
          <>
            <TeamOutlined style={{ marginRight: 8 }} />
            ユーザー管理
          </>
        ),
      }}
    >
      <ProTable<UserData>
        actionRef={actionRef}
        columns={columns}
        rowKey="id"
        search={false}
        toolbar={{
          search: {
            placeholder: 'キーワード検索: 名前 / メール',
            onSearch: (value) => {
              setFilters((prev) => ({ ...prev, keyword: value || undefined }));
              actionRef.current?.reload();
            },
            style: { width: 250 },
          },
          filter: (
            <Space>
              <Select
                placeholder="ロール"
                allowClear
                style={{ width: 150 }}
                options={[{ label: 'すべて', value: '' }, ...ROLE_OPTIONS]}
                onChange={(value) => {
                  setFilters((prev) => ({ ...prev, role: value || undefined }));
                  actionRef.current?.reload();
                }}
              />
              <Select
                placeholder="ステータス"
                allowClear
                style={{ width: 120 }}
                options={[
                  { label: 'すべて', value: '' },
                  { label: '有効', value: true },
                  { label: '無効', value: false },
                ]}
                onChange={(value) => {
                  setFilters((prev) => ({
                    ...prev,
                    is_active: value === '' ? undefined : value,
                  }));
                  actionRef.current?.reload();
                }}
              />
            </Space>
          ),
          actions: [
            <Button
              key="reload"
              icon={<ReloadOutlined />}
              onClick={() => {
                setFilters({});
                actionRef.current?.reload();
              }}
            >
              リセット
            </Button>,
            <Button
              key="create"
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => handleOpenUserForm()}
            >
              新規ユーザー作成
            </Button>,
          ],
        }}
        request={async (params, sort) => {
          const response = await getUsers({
            page: params.current,
            size: params.pageSize,
            ...filters,
          });
          return {
            data: response.data,
            success: true,
            total: response.total,
          };
        }}
        pagination={{
          defaultPageSize: 20,
          showSizeChanger: true,
          showTotal: (total) => `全 ${total} 件`,
        }}
      />

      {/* ユーザー作成/編集ダイアログ */}
      <ModalForm
        title={editingUser ? 'ユーザー編集' : '新規ユーザー作成'}
        open={userFormVisible}
        onOpenChange={setUserFormVisible}
        onFinish={handleUserFormSubmit}
        modalProps={{
          destroyOnClose: true,
          onCancel: () => {
            setEditingUser(null);
          },
        }}
        initialValues={
          editingUser
            ? {
                username: editingUser.username,
                display_name: editingUser.display_name,
                email: editingUser.email || '',
                role: editingUser.roles[0]?.code || 'viewer',
              }
            : undefined
        }
      >
        <ProFormText
          name="username"
          label="ユーザー名"
          disabled={!!editingUser}
          rules={
            editingUser
              ? []
              : [
                  { required: true, message: 'ユーザー名を入力してください' },
                  { min: 3, message: 'ユーザー名は3文字以上で入力してください' },
                  { max: 50, message: 'ユーザー名は50文字以内で入力してください' },
                  {
                    pattern: /^[a-zA-Z0-9_-]+$/,
                    message: 'ユーザー名は英数字、ハイフン、アンダースコアのみ使用できます',
                  },
                ]
          }
          placeholder="ユーザー名を入力"
        />
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
        <ProFormSelect
          name="role"
          label="ロール"
          options={ROLE_OPTIONS}
          rules={[{ required: true, message: 'ロールを選択してください' }]}
          placeholder="ロールを選択"
          disabled={editingUser && String(editingUser.id) === currentUserId}
          extra={
            editingUser && String(editingUser.id) === currentUserId
              ? '自分自身のロールは変更できません'
              : undefined
          }
        />
        {!editingUser && (
          <ProFormText.Password
            name="password"
            label="初期パスワード"
            rules={[
              { required: true, message: 'パスワードを入力してください' },
              { min: 8, message: 'パスワードは8文字以上で入力してください' },
            ]}
            placeholder="初期パスワードを入力"
          />
        )}
      </ModalForm>

      {/* パスワードリセットダイアログ */}
      <Modal
        title="パスワードリセット"
        open={passwordResetVisible}
        onOk={handlePasswordReset}
        onCancel={() => {
          setPasswordResetVisible(false);
          setResetTargetUser(null);
          setNewPassword('');
        }}
        okText="リセット"
        cancelText="キャンセル"
      >
        <p>
          ユーザー: {resetTargetUser?.username} ({resetTargetUser?.display_name})
        </p>
        <Input.Password
          placeholder="新しいパスワード"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          style={{ marginBottom: 16 }}
        />
        <p style={{ color: '#faad14', fontSize: 12 }}>
          リセット後、このユーザーの全セッションが無効化されます。
        </p>
      </Modal>
    </PageContainer>
  );
};

export default UserManagementPage;
