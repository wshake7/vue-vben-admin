/**
 * RSA 公钥缓存与拉取（走裸 fetch，避免请求拦截器递归加密）。
 */

import { importRsaPublicKey } from '#/utils/crypto';

let cachedPublicKeyBase64 = '';
let cachedPublicCryptoKey: CryptoKey | null = null;
let inflight: null | Promise<string> = null;

export function clearCachedPublicKey() {
  cachedPublicKeyBase64 = '';
  cachedPublicCryptoKey = null;
  inflight = null;
}

export function getCachedPublicKey(): string {
  return cachedPublicKeyBase64;
}

export function setCachedPublicKey(publicKey: string) {
  if (publicKey !== cachedPublicKeyBase64) {
    cachedPublicKeyBase64 = publicKey;
    cachedPublicCryptoKey = null;
  }
}

/**
 * 拉取公钥：`GET {apiBase}/encrypt/public/key` → Result{ data: { publicKey } }
 */
export async function fetchPublicKey(apiBase: string): Promise<string> {
  const base = apiBase.replace(/\/$/, '');
  const url = `${base}/encrypt/public/key`;
  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    return '';
  }
  const res = (await response.json()) as {
    data?: { publicKey?: string };
  };
  return res?.data?.publicKey || '';
}

export async function ensurePublicKey(apiBase: string): Promise<string> {
  if (cachedPublicKeyBase64) {
    return cachedPublicKeyBase64;
  }
  if (inflight) {
    return inflight;
  }
  inflight = (async () => {
    try {
      const key = await fetchPublicKey(apiBase);
      if (key) {
        setCachedPublicKey(key);
      }
      return key;
    } catch {
      return '';
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

export async function getPublicCryptoKey(): Promise<CryptoKey | undefined> {
  if (cachedPublicCryptoKey) {
    return cachedPublicCryptoKey;
  }
  if (!cachedPublicKeyBase64) {
    return undefined;
  }
  try {
    cachedPublicCryptoKey = await importRsaPublicKey(cachedPublicKeyBase64);
    return cachedPublicCryptoKey;
  } catch {
    return undefined;
  }
}
