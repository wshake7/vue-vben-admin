import { defineConfig, loadEnv } from 'vite';

import { createProxy } from './build/vite/proxy';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 解析 .env.* 时，VITE_ 前缀的环境变量会被自动注入到 import.meta.env
  const env = loadEnv(mode, process.cwd(), '');
  const { VITE_PROXY } = env;

  // VITE_PROXY 格式：'[["/api/", "http://localhost:4000/api/"]]'
  const proxyList: [string, string][] = VITE_PROXY ? JSON.parse(VITE_PROXY) : [];

  return {
    application: {},
    vite: {
      server: {
        proxy: createProxy(proxyList),
      },
    },
  };
});