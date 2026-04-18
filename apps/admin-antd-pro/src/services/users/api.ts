/**
 * ユーザー API サービス
 * Issue 508: プロフィール画面
 * Issue 509: ユーザー管理画面
 */
import { request } from '@umijs/max';


/** ユーザー情報 */
export interface UserData {
  id: number;
  username: string;
  display_name: string;
  email: string | null;
  is_active: boolean;
  roles: { code: string; name: string }[];
  last_login_at: string | null;
  created_at: string;
  version: number;
}

/** ユーザー一覧レスポンス */
export interface UsersListResponse {
  success: boolean;
  data: UserData[];
  total: number;
  page: number;
  size: number;
}

/** プロフィール更新リクエスト */
export interface UpdateProfileRequest {
  display_name: string;
  email?: string;
  version: number;
}

/** パスワード変更リクエスト */
export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

/** ユーザー作成リクエスト */
export interface CreateUserRequest {
  username: string;
  display_name: string;
  email?: string;
  role: string;
  password: string;
}

/** ユーザー更新リクエスト */
export interface UpdateUserRequest {
  display_name: string;
  email?: string;
  role: string;
  version: number;
}

/** ユーザー一覧取得パラメータ */
export interface UsersListParams {
  page?: number;
  size?: number;
  keyword?: string;
  role?: string;
  is_active?: boolean;
}

/** バックエンドの /users/me レスポンス */
interface MeResponse {
  id: number;
  username: string;
  display_name: string;
  tenant_id?: string;
  roles: string[];
  permissions: string[];
}

/**
 * 現在のユーザープロフィールを取得
 * GET /api/v1/users/me
 */
export async function getMyProfile(): Promise<UserData> {
  console.log('[Users API] Fetching profile from:', '/api/v1/users/me');
  try {
    // バックエンドは { success, data } ラッパーなしで直接レスポンスを返す
    const response = await request<MeResponse | { success: boolean; data: MeResponse }>(
      '/api/v1/users/me',
      {
        method: 'GET',
      },
    );
    console.log('[Users API] Profile response:', response);

    // レスポンス形式の正規化
    const data = ('data' in response && response.data) ? response.data : response as MeResponse;

    // UserData 形式に変換
    return {
      id: data.id,
      username: data.username,
      display_name: data.display_name,
      email: null, // バックエンドから提供されていない
      is_active: true,
      roles: data.roles.map((role) => ({ code: role, name: role })),
      last_login_at: null,
      created_at: new Date().toISOString(),
      version: 1,
    };
  } catch (error) {
    console.error('[Users API] Profile fetch failed:', error);
    throw error;
  }
}

/**
 * プロフィールを更新
 * PUT /api/v1/users/me
 */
export async function updateMyProfile(data: UpdateProfileRequest): Promise<UserData> {
  const response = await request<{ success: boolean; data: UserData }>(
    '/api/v1/users/me',
    {
      method: 'PUT',
      data,
    },
  );
  return response.data;
}

/**
 * パスワードを変更
 * PUT /api/v1/users/me/password
 */
export async function changeMyPassword(data: ChangePasswordRequest): Promise<{ message: string }> {
  const response = await request<{ success: boolean; data: { message: string } }>(
    '/api/v1/users/me/password',
    {
      method: 'PUT',
      data,
    },
  );
  return response.data;
}

/**
 * ユーザー一覧を取得
 * GET /api/v1/users
 */
export async function getUsers(params: UsersListParams): Promise<UsersListResponse> {
  const response = await request<UsersListResponse>('/api/v1/users', {
    method: 'GET',
    params: {
      page: params.page || 1,
      size: params.size || 20,
      ...(params.keyword && { keyword: params.keyword }),
      ...(params.role && { role: params.role }),
      ...(params.is_active !== undefined && { is_active: params.is_active }),
    },
  });
  return response;
}

/**
 * ユーザーを作成
 * POST /api/v1/users
 */
export async function createUser(data: CreateUserRequest): Promise<UserData> {
  const response = await request<{ success: boolean; data: UserData }>(
    '/api/v1/users',
    {
      method: 'POST',
      data,
    },
  );
  return response.data;
}

/**
 * ユーザーを更新
 * PUT /api/v1/users/:id
 */
export async function updateUser(id: number, data: UpdateUserRequest): Promise<UserData> {
  const response = await request<{ success: boolean; data: UserData }>(
    `/api/v1/users/${id}`,
    {
      method: 'PUT',
      data,
    },
  );
  return response.data;
}

/**
 * ユーザーステータスを変更
 * PUT /api/v1/users/:id/status
 */
export async function updateUserStatus(
  id: number,
  data: { is_active: boolean; version: number },
): Promise<{ id: number; is_active: boolean; version: number }> {
  const response = await request<{
    success: boolean;
    data: { id: number; is_active: boolean; version: number };
  }>(`/api/v1/users/${id}/status`, {
    method: 'PUT',
    data,
  });
  return response.data;
}

/**
 * ユーザーパスワードをリセット
 * PUT /api/v1/users/:id/password
 */
export async function resetUserPassword(
  id: number,
  newPassword: string,
): Promise<{ message: string }> {
  const response = await request<{ success: boolean; data: { message: string } }>(
    `/api/v1/users/${id}/password`,
    {
      method: 'PUT',
      data: { new_password: newPassword },
    },
  );
  return response.data;
}
