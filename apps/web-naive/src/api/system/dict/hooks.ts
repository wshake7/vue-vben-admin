import type { UseMutationOptions, UseQueryOptions } from '@tanstack/vue-query';

import type { MaybeRefOrGetter } from 'vue';

/**
 * 字典管理 vue-query hook 层
 *
 * 与 react-admin `apps/react-admin/src/api/hooks/dict.ts` 同语义：
 *   - 自动注入 platform = VITE_APP_PLATFORM || 'general'，与后端
 *     `?platform=` 过滤对齐；
 *   - 支持调用方显式传入 platform 覆盖默认；
 *   - queryKey 用最终 merged 查询，避免缓存命中失败。
 *
 * 与现有 `apps/vue-vben-admin/apps/web-naive/src/api/system/dict/index.ts`
 * （裸 request 函数）并存：调用方可按需切换；index.vue 默认走原 request 路径，
 * 保留现状。
 */
import type {
  CreateDictDataRequest,
  CreateDictTypeRequest,
  DictData,
  DictDataQuery,
  DictType,
  DictTypeQuery,
  PageResult,
  UpdateDictDataRequest,
  UpdateDictTypeRequest,
} from './types';

import { isRef } from 'vue';

import { useMutation, useQuery } from '@tanstack/vue-query';

import {
  createDictDataApi,
  createDictTypeApi,
  deleteDictDataApi,
  deleteDictTypeApi,
  fetchDictDataListApi,
  fetchDictTypeListApi,
  updateDictDataApi,
  updateDictTypeApi,
} from '.';

/**
 * 当前前端平台标识（VITE_APP_PLATFORM）。
 * 与 backend mock 的 ?platform= 过滤对齐：dict_data.list 默认只返回
 * platform = 'general' 或 platform = currentPlatform 的项。
 * 缺省 'general'（向后兼容未配置的环境）。
 */
export const CURRENT_PLATFORM: string =
  (import.meta.env.VITE_APP_PLATFORM as string | undefined) || 'general';

// =========================================================
// 内部工具：从 MaybeRefOrGetter 解包
// =========================================================

/**
 * 解包 ref / getter / 普通值。
 *
 * 修复历史：旧版仅判断 function / RefLike(value.value)，对普通对象
 * `{ typeCode: [...], includeGeneral: true }` 会强转 `RefLike<T>` 后读
 * `.value` 取到 `undefined`，导致 useListDictData 调出的 query 丢掉
 * 调用方传入的字段（只发 `?platform=vue-admin`）。
 *
 * 当前四分支优先级：
 *   1. null / undefined → fallback
 *   2. function → 当 getter 调用
 *   3. isRef(value) → 取 value.value（vue 官方守卫，避免 unref 重载让 T 退化）
 *   4. 其他（普通对象 / 数组 / 字符串 / 数字等）→ 原样返回
 */
function unwrap<T>(value: MaybeRefOrGetter<T> | undefined, fallback: T): T {
  if (value === undefined || value === null) return fallback;
  if (typeof value === 'function') {
    return (value as () => T)();
  }
  if (isRef(value)) {
    return value.value as T;
  }
  return value;
}

// =========================================================
// 字典类型（dict-type）
// =========================================================

export function useListDictType(
  query: MaybeRefOrGetter<DictTypeQuery> = {},
  options?: Omit<
    UseQueryOptions<PageResult<DictType>, Error>,
    'queryFn' | 'queryKey'
  >,
) {
  // 解包一次拿到稳定值；queryKey 依赖稳定值避免 watchEffect 反复触发。
  const stableQuery = unwrap(query, {} as DictTypeQuery);
  return useQuery({
    queryKey: ['dict', 'listDictType', stableQuery] as const,
    queryFn: () => fetchDictTypeListApi(stableQuery),
    ...options,
  });
}

export function useCreateDictType(
  options?: UseMutationOptions<DictType, Error, CreateDictTypeRequest>,
) {
  return useMutation({
    mutationFn: (body) => createDictTypeApi(body),
    ...options,
  });
}

export function useUpdateDictType(
  options?: UseMutationOptions<DictType, Error, UpdateDictTypeRequest>,
) {
  return useMutation({
    mutationFn: (req) => updateDictTypeApi(req.id, req),
    ...options,
  });
}

export function useDeleteDictType(
  options?: UseMutationOptions<unknown, Error, number>,
) {
  return useMutation({
    mutationFn: (id) => deleteDictTypeApi(id),
    ...options,
  });
}

// =========================================================
// 字典数据（dict-data）
// =========================================================

/**
 * 自动注入 platform 默认值。
 *
 * 优先级（高到低）：
 *   1. query.platform（调用方显式传入，覆盖一切）
 *   2. CURRENT_PLATFORM = VITE_APP_PLATFORM || 'general'
 *
 * 注意：queryKey 用最终 merged 查询，避免缓存命中失败（与 react-admin 同语义）。
 */
export function useListDictData(
  query: MaybeRefOrGetter<DictDataQuery> = {},
  options?: Omit<
    UseQueryOptions<PageResult<DictData>, Error>,
    'queryFn' | 'queryKey'
  >,
) {
  const stableQuery = unwrap(query, {} as DictDataQuery);
  const merged: DictDataQuery = {
    platform: CURRENT_PLATFORM,
    ...stableQuery,
  };
  return useQuery({
    queryKey: ['dict', 'listDictData', merged] as const,
    queryFn: () => fetchDictDataListApi(merged),
    ...options,
  });
}

export function useCreateDictData(
  options?: UseMutationOptions<DictData, Error, CreateDictDataRequest>,
) {
  return useMutation({
    mutationFn: (body) => createDictDataApi(body),
    ...options,
  });
}

export function useUpdateDictData(
  options?: UseMutationOptions<DictData, Error, UpdateDictDataRequest>,
) {
  return useMutation({
    mutationFn: (req) => updateDictDataApi(req.id, req),
    ...options,
  });
}

export function useDeleteDictData(
  options?: UseMutationOptions<unknown, Error, number>,
) {
  return useMutation({
    mutationFn: (id) => deleteDictDataApi(id),
    ...options,
  });
}
