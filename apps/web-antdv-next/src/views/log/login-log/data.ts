import type { VxeTableGridOptions } from '#/adapter/vxe-table';

export const SUCCESS_OPTIONS = [
  { label: '成功', value: 1 },
  { label: '失败', value: 0 },
];

export const LOGIN_METHOD_OPTIONS = [
  { label: 'PASSWORD', value: 'PASSWORD' },
  { label: 'SSO', value: 'SSO' },
  { label: 'OAUTH', value: 'OAUTH' },
  { label: 'SMS', value: 'SMS' },
];

export function useLoginLogColumns(): VxeTableGridOptions['columns'] {
  return [
    { field: 'id', title: 'ID', width: 70 },
    { field: 'username', title: '用户名', minWidth: 120 },
    {
      field: 'success',
      title: '结果',
      width: 90,
      slots: { default: 'success' },
    },
    { field: 'loginMethod', title: '登录方式', width: 110 },
    { field: 'loginIp', title: '登录 IP', minWidth: 130 },
    {
      field: 'browser',
      title: '浏览器',
      minWidth: 140,
      slots: { default: 'browser' },
    },
    {
      field: 'os',
      title: '操作系统',
      minWidth: 140,
      slots: { default: 'os' },
    },
    { field: 'loginTime', title: '登录时间', minWidth: 170, formatter: 'formatDateTime' },
    { field: 'location', title: '地理位置', minWidth: 110 },
    { field: 'reason', title: '失败原因', minWidth: 160 },
  ];
}

export function useLoginLogSearchSchema(): Array<{
  component: string;
  componentProps?: Record<string, any>;
  fieldName: string;
  label: string;
}> {
  return [
    {
      component: 'Input',
      fieldName: 'username',
      label: '用户名',
      componentProps: { placeholder: '如 admin' },
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
      component: 'Select',
      fieldName: 'loginMethod',
      label: '登录方式',
      componentProps: {
        options: LOGIN_METHOD_OPTIONS,
        allowClear: true,
        placeholder: '全部',
      },
    },
    {
      component: 'Input',
      fieldName: 'loginIp',
      label: '登录 IP',
      componentProps: { placeholder: '如 10.0.0.' },
    },
    {
      component: 'RangePicker',
      fieldName: 'loginTimeRange',
      label: '登录时间',
      componentProps: {
        showTime: true,
        style: { width: '100%' },
      },
    },
  ];
}
