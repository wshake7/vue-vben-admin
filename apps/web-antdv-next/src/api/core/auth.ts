import { requestClient } from '#/api/request';

export namespace AuthApi {
  /** 登录接口参数 */
  export interface LoginParams {
    password?: string;
    username?: string;
    /** ALTCHA PoW payload（Base64） */
    altcha?: string;
  }

  /** 登录接口返回值（sa-token 单 token + 用户摘要） */
  export interface LoginResult {
    accessToken: string;
    id?: number | string;
    username?: string;
    realName?: string;
    roles?: string[];
    homePath?: string;
  }
}

/**
 * 登录
 */
export async function loginApi(data: AuthApi.LoginParams) {
  return requestClient.post<AuthApi.LoginResult>('/auth/login', data);
}

/**
 * 退出登录（走 requestClient，自动携带 Authorization: Bearer）
 */
export async function logoutApi() {
  return requestClient.post('/auth/logout');
}

/**
 * 获取用户权限码
 */
export async function getAccessCodesApi() {
  return requestClient.get<string[]>('/auth/codes');
}
