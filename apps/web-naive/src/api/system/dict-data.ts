import { requestClient } from '#/api/request';

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
}

export interface DictDataListParams {
  page?: number;
  pageSize?: number;
  typeId?: number;
  label?: string;
  value?: string;
  status?: 0 | 1 | '';
}

export interface DictDataPageResp {
  items: DictData[];
  total: number;
}

export function fetchDictDataListApi(params: DictDataListParams = {}) {
  return requestClient.get<DictDataPageResp>('/system/dict-data/list', {
    params,
  });
}

export function fetchDictDataByTypeCodeApi(typeCode: string) {
  return requestClient.get<DictData[]>(
    `/system/dict-data/by-type/${encodeURIComponent(typeCode)}`,
  );
}

export interface CreateDictDataBody {
  typeId: number;
  value: string;
  label: string;
  sort?: number;
  isDefault?: boolean;
  is_enabled?: 0 | 1;
  remark?: string;
}

export function createDictDataApi(body: CreateDictDataBody) {
  return requestClient.post<DictData>('/system/dict-data', body);
}

export function updateDictDataApi(
  id: number,
  body: Partial<
    Pick<
      DictData,
      'value' | 'label' | 'sort' | 'is_default' | 'is_enabled' | 'remark'
    >
  >,
) {
  return requestClient.put<DictData>(`/system/dict-data/${id}`, body);
}

export function deleteDictDataApi(id: number) {
  return requestClient.delete<unknown>(`/system/dict-data/${id}`);
}
