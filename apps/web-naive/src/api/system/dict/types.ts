/**
 * 字典管理 类型定义
 * 字段对齐 backend-mock-template 的 schema；软删 deleted_at: 0=未删
 */
export interface DictType {
  id: number;
  code: string;
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
  /** 归属平台：general / react-admin / vue-admin；与 schema v8 对齐 */
  platform: string;
  /** 预设样式标识：default / primary / success / warning 等；与 schema v9 对齐 */
  tag_type: string;
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
}

export interface DictDataQuery {
  page?: number;
  pageSize?: number;
  typeId?: number;
  /** 字典类型编码；多选下拉时传数组（精确匹配任一） */
  typeCode?: string | string[];
  label?: string;
  value?: string;
  status?: 0 | 1;
  /** 归属平台过滤（精确匹配；缺省由调用方注入 VITE_APP_PLATFORM） */
  platform?: string;
  /** 是否把通用（general）并入过滤结果（仅当 platform !== 'general' 时生效） */
  includeGeneral?: boolean;
}

export interface CreateDictTypeRequest {
  code: string;
  name: string;
  remark?: string;
  is_enabled?: 0 | 1;
}

export interface UpdateDictTypeRequest {
  id: number;
  code?: string;
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
  /** 归属平台；缺省 mock 层回退到 'general' */
  platform?: string;
  /** 预设样式标识；缺省 mock 层回退到 'default' */
  tag_type?: string;
  is_enabled?: 0 | 1;
  remark?: string;
}

export interface UpdateDictDataRequest {
  id: number;
  value?: string;
  label?: string;
  sort?: number;
  is_default?: 0 | 1;
  platform?: string;
  tag_type?: string;
  is_enabled?: 0 | 1;
  remark?: string;
}

export interface PageResult<T> {
  items: T[];
  total: number;
}
