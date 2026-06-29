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

import {
  useMutation,
  useQuery,
  type UseMutationOptions,
  type UseQueryOptions,
} from '@tanstack/vue-query';
import type { MaybeRefOrGetter } from 'vue';

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
 * 解包 ref / getter；普通值原样返回；与 vue-query 内部 useQuery 的
 * queryKey 处理兼容（vue-query 期望 queryKey 是稳定结构，避免 watchEffect
 * 误把整个对象当响应式源）。
 *
 * 用 `MaybeRef<T>` 形态作为对象分支（vue 的 ref / computed）的入口：
 *   - MaybeRef<T> = Ref<T> | T —— 我们只取对象的 `{ value: T }` 通道，
 *     因此用结构子类型 cast `{ value: T }` 是安全的；不为 value 通道
 *     使用 unref() 因为 unref 的重载会让 T 退化为 unknown。
 */
type RefLike<T> = { value: T };

function unwrap<T>(value: MaybeRefOrGetter<T> | undefined, fallback: T): T {
  if (value === undefined || value === null) return fallback;
  if (typeof value === 'function') {
    return (value as () => T)();
  }
  // Ref<T> 对象走结构子类型通道，避免 unref() 重载导致 T 退化为 unknown
  return (value as RefLike<T>).value;
}

// =========================================================
// 字典类型（dict-type）
// =========================================================

export function useListDictType(
  query: MaybeRefOrGetter<DictTypeQuery> = {},
  options?: Omit<
    UseQueryOptions<PageResult<DictType>, Error>,
    'queryKey' | 'queryFn'
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
    'queryKey' | 'queryFn'
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
