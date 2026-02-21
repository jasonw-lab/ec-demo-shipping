/**
 * リクエストエラーハンドリング設定
 * Issue 506: 認証基盤
 */
import type { RequestOptions } from '@@/plugin-request/request';
import type { RequestConfig } from '@umijs/max';
import { message, notification } from 'antd';

// エラー表示タイプ
enum ErrorShowType {
  SILENT = 0,
  WARN_MESSAGE = 1,
  ERROR_MESSAGE = 2,
  NOTIFICATION = 3,
  REDIRECT = 9,
}

// バックエンドとの約束されたレスポンスフォーマット
interface ResponseStructure {
  success: boolean;
  data: any;
  errorCode?: number;
  errorMessage?: string;
  showType?: ErrorShowType;
}

/**
 * @name エラーハンドリング設定
 * @doc https://umijs.org/docs/max/request#配置
 */
export const errorConfig: RequestConfig = {
  errorConfig: {
    // エラーを投げる
    errorThrower: (res) => {
      const { success, data, errorCode, errorMessage, showType } =
        res as unknown as ResponseStructure;
      // success が明示的に false の場合のみエラーとして処理
      if (success === false) {
        const error: any = new Error(errorMessage);
        error.name = 'BizError';
        error.info = { errorCode, errorMessage, showType, data };
        throw error;
      }
    },
    // エラー受信と処理
    errorHandler: (error: any, opts: any) => {
      if (opts?.skipErrorHandler) throw error;

      // カスタムエラー
      if (error.name === 'BizError') {
        const errorInfo: ResponseStructure | undefined = error.info;
        if (errorInfo) {
          const { errorMessage, errorCode } = errorInfo;
          switch (errorInfo.showType) {
            case ErrorShowType.SILENT:
              break;
            case ErrorShowType.WARN_MESSAGE:
              message.warning(errorMessage);
              break;
            case ErrorShowType.ERROR_MESSAGE:
              message.error(errorMessage);
              break;
            case ErrorShowType.NOTIFICATION:
              notification.open({
                description: errorMessage,
                message: String(errorCode),
              });
              break;
            case ErrorShowType.REDIRECT:
              break;
            default:
              message.error(errorMessage);
          }
        }
      } else if (error.response) {
        // Axios エラー（ステータスコードが 2xx 以外）
        const status = error.response.status;
        // 401 は app.tsx で処理するのでここでは何もしない
        if (status !== 401) {
          message.error(`リクエストエラー: ${status}`);
        }
      } else if (error.request) {
        // リクエストは送信されたがレスポンスがない
        message.error('サーバーからの応答がありません。接続を確認してください');
      } else {
        // リクエスト送信時のエラー
        message.error('リクエストエラーが発生しました');
      }
    },
  },

  // リクエストインターセプター
  requestInterceptors: [
    (config: RequestOptions) => {
      // app.tsx で Authorization ヘッダーを追加するため、ここでは何もしない
      return config;
    },
  ],

  // レスポンスインターセプター
  responseInterceptors: [
    (response) => {
      const { data } = response as unknown as ResponseStructure;

      // success が明示的に false の場合のみエラー表示
      if (data?.success === false) {
        message.error('リクエストが失敗しました');
      }
      return response;
    },
  ],
};
