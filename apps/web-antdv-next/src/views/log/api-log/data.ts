import type { VxeTableGridOptions } from '#/adapter/vxe-table';

export const SUCCESS_OPTIONS = [
  { label: '成功', value: 1 },
  { label: '失败', value: 0 },
];

export const METHOD_OPTIONS = [
  { label: 'GET', value: 'GET' },
  { label: 'POST', value: 'POST' },
  { label: 'PUT', value: 'PUT' },
  { label: 'DELETE', value: 'DELETE' },
  { label: 'PATCH', value: 'PATCH' },
];

export function useApiLogColumns(): VxeTableGridOptions['columns'] {
  return [
    { field: 'id', title: 'ID', width: 70 },
    {
      field: 'method',
      title: '方法',
      width: 90,
      slots: { default: 'method' },
    },
    { field: 'module', title: '模块', width: 100 },
    { field: 'path', title: '路径', minWidth: 200 },
    {
      field: 'statusCode',
      title: '状态码',
      width: 90,
    },
    {
      field: 'success',
      title: '结果',
      width: 90,
      slots: { default: 'success' },
    },
    { field: 'costTime', title: '耗时(ms)', width: 100 },
    { field: 'username', title: '用户', width: 110 },
    { field: 'clientIp', title: '客户端 IP', minWidth: 130 },
    { field: 'createdAt', title: '时间', minWidth: 170, formatter: 'formatDateTime' },
    { field: 'reason', title: '失败原因', minWidth: 140 },
  ];
}

export function useApiLogSearchSchema(): Array<{
  component: string;
  componentProps?: Record<string, any>;
  fieldName: string;
  label: string;
}> {
  return [
    {
      component: 'Select',
      fieldName: 'method',
      label: '方法',
      componentProps: {
        options: METHOD_OPTIONS,
        allowClear: true,
        placeholder: '全部',
      },
    },
    {
      component: 'Input',
      fieldName: 'module',
      label: '模块',
      componentProps: { placeholder: '如 user' },
    },
    {
      component: 'Input',
      fieldName: 'path',
      label: '路径',
      componentProps: { placeholder: '如 /api/system' },
    },
    {
      component: 'Select',
      fieldName: 'success',
      label: '结果',
      componentProps: {
        options: SUCCESS_OPTIONS,
        allowClear: true,
        placeholder: '全部',
      },
    },
    {
      component: 'Input',
      fieldName: 'username',
      label: '用户名',
      componentProps: { placeholder: '如 admin' },
    },
    {
      component: 'Input',
      fieldName: 'clientIp',
      label: '客户端 IP',
      componentProps: { placeholder: '如 10.0.0.' },
    },
    {
      component: 'Input',
      fieldName: 'requestId',
      label: '请求 ID',
      componentProps: { placeholder: 'request_id' },
    },
    {
      component: 'RangePicker',
      fieldName: 'createdAtRange',
      label: '时间',
      componentProps: {
        showTime: true,
        style: { width: '100%' },
      },
    },
  ];
}
