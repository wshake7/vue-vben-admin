import type { ProxyOptions } from 'vite';

type ProxyList = [string, string][];

type ProxyTargetList = Record<string, ProxyOptions>;

/**
 * 根据环境变量 VITE_PROXY 创建 Vite 代理配置。
 * 格式：`[["/api/", "http://localhost:4000/api/"]]`，二维数组。
 * 会把 `/api/xxx` 重写为 `xxx`，再转发到 target。
 */
export function createProxy(list: ProxyList = []) {
  const res: ProxyTargetList = {};

  for (const [prefix, target] of list) {
    res[`^${prefix}`] = {
      target,
      changeOrigin: true,
      rewrite: (path) => path.replace(new RegExp(`^${prefix}`), ''),
    };
  }

  return res;
}