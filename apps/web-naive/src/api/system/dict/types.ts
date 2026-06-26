/**
 * 字典管理 类型定义
 * 字段对齐 backend-mock-template 的 schema；软删 deleted_at: 0=未删
 */
export interface DictType {
  id: number;
  code: string;
  /** 平台标识：`''` = 通用、`vue-admin` / `react-admin` 为各前端管理端 */
  platform: string;
  name: string;
  remark: string;
  is_enabled: 0 | 1;
  deleted_at: number;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
}

export interface DictData {
  id: number;
  type_id: number;
  value: string;
  label: string;
  sort: number;
  is_default: 0 | 1;
  is_enabled: 0 | 1;
  deleted_at: number;
  remark: string;
  created_at: string;
  updated_at: string;
  created_by?: number;
  updated_by?: number;
  /** 关联的字典类型编码（仅 list 接口返回） */
  typeCode?: string;
}

export interface DictTypeQuery {
  page?: number;
  pageSize?: number;
  /** 字典类型编码；前端多选下拉时传数组（精确匹配任一） */
  code?: string | string[];
  name?: string;
  status?: 0 | 1;
  /** 平台标识筛选；空字符串或缺省=不过滤；非空时返回该平台 + 通用 */
  platform?: string;
}

export interface DictDataQuery {
  page?: number;
  pageSize?: number;
  typeId?: number;
  typeCode?: string;
  label?: string;
  value?: string;
  status?: 0 | 1;
  /** 平台标识筛选（按所属 type 的 platform 过滤） */
  platform?: string;
}

export interface CreateDictTypeRequest {
  code: string;
  platform?: string;
  name: string;
  remark?: string;
  is_enabled?: 0 | 1;
}

export interface UpdateDictTypeRequest {
  id: number;
  code?: string;
  platform?: string;
  name?: string;
  remark?: string;
  is_enabled?: 0 | 1;
}

export interface CreateDictDataRequest {
  typeId: number;
  value: string;
  label: string;
  sort?: number;
  isDefault?: boolean;
  is_enabled?: 0 | 1;
  remark?: string;
}

export interface UpdateDictDataRequest {
  id: number;
  value?: string;
  label?: string;
  sort?: number;
  is_default?: 0 | 1;
  is_enabled?: 0 | 1;
  remark?: string;
}

export interface PageResult<T> {
  items: T[];
  total: number;
}
