/**
 * 该文件可自行根据业务逻辑进行调整
 */
import type { RequestClientOptions } from '@vben/request';

import { useAppConfig } from '@vben/hooks';
import { preferences } from '@vben/preferences';
import {
  authenticateResponseInterceptor,
  defaultResponseInterceptor,
  errorMessageResponseInterceptor,
  RequestClient,
} from '@vben/request';
import { useAccessStore } from '@vben/stores';

import { message } from 'antdv-next';

import { useAuthStore } from '#/store';

const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);

function createRequestClient(baseURL: string, options?: RequestClientOptions) {
  const client = new RequestClient({
    ...options,
    baseURL,
  });

  /**
   * 重新认证逻辑（sa-token 单 token：401 后直接登出 / 弹窗重新登录）
   *
   * - 单飞锁：并发 401 只处理一次，避免风暴
   * - skipApi：会话已 401，再调 /auth/logout 会二次 401 并死循环
   */
  let reAuthPromise: null | Promise<void> = null;
  async function doReAuthenticate() {
    if (reAuthPromise) {
      return reAuthPromise;
    }
    reAuthPromise = (async () => {
      console.warn('Access token is invalid or expired.');
      const accessStore = useAccessStore();
      const authStore = useAuthStore();
      accessStore.setAccessToken(null);
      if (
        preferences.app.loginExpiredMode === 'modal' &&
        accessStore.isAccessChecked
      ) {
        accessStore.setLoginExpired(true);
      } else {
        await authStore.logout(true, { skipApi: true });
      }
    })().finally(() => {
      reAuthPromise = null;
    });
    return reAuthPromise;
  }

  function formatToken(token: null | string) {
    return token ? `Bearer ${token}` : null;
  }

  // 请求头处理
  client.addRequestInterceptor({
    fulfilled: async (config) => {
      // public 端点不需要登录态
      if (!config.url?.startsWith('/public/')) {
        const accessStore = useAccessStore();
        config.headers.Authorization = formatToken(accessStore.accessToken);
      }
      config.headers['Accept-Language'] = preferences.app.locale;
      return config;
    },
  });

  // 处理返回的响应数据格式
  client.addResponseInterceptor(
    defaultResponseInterceptor({
      codeField: 'code',
      dataField: 'data',
      successCode: 0,
    }),
  );

  // token 过期：直接重新认证，不做客户端 refresh
  client.addResponseInterceptor(
    authenticateResponseInterceptor({
      doReAuthenticate,
    }),
  );

  // 通用的错误处理,如果没有进入上面的错误处理逻辑，就会进入这里
  client.addResponseInterceptor(
    errorMessageResponseInterceptor((msg: string, error) => {
      // 统一契约：优先 msg（java-admin Result），兼容旧 message/error
      const responseData = error?.response?.data ?? error ?? {};
      const errorMessage =
        responseData?.msg ?? responseData?.message ?? responseData?.error ?? '';
      // 如果没有错误信息，则会根据状态码进行提示
      message.error(errorMessage || msg);
    }),
  );

  return client;
}

export const requestClient = createRequestClient(apiURL, {
  responseReturn: 'data',
});

export const baseRequestClient = new RequestClient({ baseURL: apiURL });
