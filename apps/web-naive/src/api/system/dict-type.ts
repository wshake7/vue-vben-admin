import { requestClient } from '#/api/request';

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

export interface DictTypeListParams {
  page?: number;
  pageSize?: number;
  code?: string;
  name?: string;
  status?: 0 | 1 | '';
}

export interface DictTypePageResp {
  items: DictType[];
  total: number;
}

export function fetchDictTypeListApi(params: DictTypeListParams = {}) {
  return requestClient.get<DictTypePageResp>('/system/dict-type/list', {
    params,
  });
}

export function fetchAllDictTypesApi(params?: { status?: 0 | 1 }) {
  return requestClient.get<DictType[]>('/system/dict-type/all', {
    params,
  });
}

export function getDictTypeApi(id: number) {
  return requestClient.get<DictType>(`/system/dict-type/${id}`);
}

export interface CreateDictTypeBody {
  code: string;
  name: string;
  remark?: string;
  is_enabled?: 0 | 1;
}

export function createDictTypeApi(body: CreateDictTypeBody) {
  return requestClient.post<DictType>('/system/dict-type', body);
}

export function updateDictTypeApi(
  id: number,
  body: Partial<Pick<DictType, 'name' | 'remark' | 'is_enabled'>>,
) {
  return requestClient.put<DictType>(`/system/dict-type/${id}`, body);
}

export function deleteDictTypeApi(id: number) {
  return requestClient.delete<unknown>(`/system/dict-type/${id}`);
}
