import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { z } from '#/adapter/form';

import type { DictData, DictType } from '#/api/system/dict';

/* ============================================================
 * 字典类型编码校验：^[a-z][a-z0-9_]{0,63}$
 * ============================================================ */
export const DICT_CODE_PATTERN = /^[a-z][a-z0-9_]{0,63}$/;

/* ============================================================
 * 字典类型 form schema（抽屉内表单）
 * ============================================================ */
export function useTypeFormSchema(): VbenFormProps['schema'] {
  return [
    {
      component: 'Input',
      fieldName: 'code',
      label: '类型编码',
      rules: z
        .string()
        .min(1, '请输入类型编码')
        .regex(DICT_CODE_PATTERN, '以小写字母开头，仅含字母数字下划线'),
      componentProps: { placeholder: '例如 sys_user_sex' },
    },
    {
      component: 'Input',
      fieldName: 'name',
      label: '类型名称',
      rules: z.string().min(1, '请输入类型名称').max(64, '最长 64 字符'),
    },
    {
      component: 'Textarea',
      fieldName: 'remark',
      label: '备注',
      componentProps: { placeholder: '选填', rows: 3 },
    },
    {
      component: 'Switch',
      fieldName: 'is_enabled',
      label: '启用',
      defaultValue: 1,
    },
  ];
}

/* ============================================================
 * 字典项 form schema（抽屉内表单）
 * ============================================================ */
export function useDataFormSchema(): VbenFormProps['schema'] {
  return [
    {
      component: 'Select',
      fieldName: 'typeId',
      label: '所属类型',
      rules: 'selectRequired',
      componentProps: {
        // options 由父组件在 buildSchema 时注入
        options: [] as Array<{ label: string; value: number }>,
        filterable: true,
        placeholder: '请选择类型',
      },
    },
    {
      component: 'Input',
      fieldName: 'value',
      label: '字典值',
      rules: z.string().min(1, '请输入字典值').max(64, '最长 64 字符'),
      componentProps: { placeholder: '例如 Y / N / 0 / 1' },
    },
    {
      component: 'Input',
      fieldName: 'label',
      label: '字典标签',
      rules: z.string().min(1, '请输入字典标签').max(128, '最长 128 字符'),
      componentProps: { placeholder: '例如 是 / 否 / 启用' },
    },
    {
      component: 'InputNumber',
      fieldName: 'sort',
      label: '排序',
      defaultValue: 0,
      componentProps: { placeholder: '升序排序，0 排在前' },
    },
    {
      component: 'Switch',
      fieldName: 'isDefault',
      label: '是否默认',
      defaultValue: false,
    },
    {
      component: 'Switch',
      fieldName: 'is_enabled',
      label: '启用',
      defaultValue: true,
    },
    {
      component: 'Textarea',
      fieldName: 'remark',
      label: '备注',
      componentProps: { placeholder: '选填', rows: 3 },
    },
  ];
}

/* ============================================================
 * 字典类型 列表检索 schema
 * ============================================================ */
export function useTypeSearchSchema(): VbenFormProps['schema'] {
  return [
    { component: 'Input', fieldName: 'code', label: '类型编码' },
    { component: 'Input', fieldName: 'name', label: '类型名称' },
    {
      component: 'Select',
      fieldName: 'status',
      label: '状态',
      componentProps: {
        allowClear: true,
        options: [
          { label: '启用', value: 1 },
          { label: '禁用', value: 0 },
        ],
        placeholder: '状态',
      },
    },
  ];
}

/* ============================================================
 * 字典项 列表检索 schema
 * ============================================================ */
export function useDataSearchSchema(): VbenFormProps['schema'] {
  return [
    { component: 'Input', fieldName: 'value', label: '字典值' },
    { component: 'Input', fieldName: 'label', label: '字典标签' },
    {
      component: 'Select',
      fieldName: 'status',
      label: '状态',
      componentProps: {
        allowClear: true,
        options: [
          { label: '启用', value: 1 },
          { label: '禁用', value: 0 },
        ],
        placeholder: '状态',
      },
    },
  ];
}

/* ============================================================
 * 表格列定义
 * ============================================================ */
export function useTypeColumns(): VxeTableGridOptions['columns'] {
  return [
    { field: 'id', title: 'ID', width: 80 },
    { field: 'code', title: '类型编码', width: 140, showOverflow: 'tooltip' },
    { field: 'name', title: '类型名称', width: 140, showOverflow: 'tooltip' },
    { field: 'remark', title: '备注', minWidth: 160, showOverflow: 'tooltip' },
    {
      cellRender: {
        name: 'CellTag',
        props: ({ row }: { row: DictType }) => ({
          color: row.is_enabled === 1 ? 'success' : 'default',
        }),
      },
      field: 'is_enabled',
      title: '状态',
      width: 90,
      formatter: ({ row }: { row: DictType }) =>
        row.is_enabled === 1 ? '启用' : '禁用',
    },
    {
      field: 'updated_at',
      title: '更新时间',
      width: 170,
      formatter: 'formatDateTime',
    },
    {
      field: 'action',
      title: '操作',
      fixed: 'right',
      slots: { default: 'action' },
      width: 140,
    },
  ];
}

export function useDataColumns(): VxeTableGridOptions['columns'] {
  return [
    { field: 'id', title: 'ID', width: 80 },
    { field: 'value', title: '字典值', width: 120 },
    { field: 'label', title: '字典标签', width: 140, showOverflow: 'tooltip' },
    { field: 'sort', title: '排序', width: 80 },
    {
      cellRender: {
        name: 'CellTag',
        props: ({ row }: { row: DictData }) => ({
          color: row.is_default === 1 ? 'processing' : 'default',
        }),
      },
      field: 'is_default',
      title: '默认',
      width: 80,
      formatter: ({ row }: { row: DictData }) =>
        row.is_default === 1 ? '默认' : '-',
    },
    {
      cellRender: {
        name: 'CellTag',
        props: ({ row }: { row: DictData }) => ({
          color: row.is_enabled === 1 ? 'success' : 'default',
        }),
      },
      field: 'is_enabled',
      title: '状态',
      width: 90,
      formatter: ({ row }: { row: DictData }) =>
        row.is_enabled === 1 ? '启用' : '禁用',
    },
    { field: 'remark', title: '备注', minWidth: 160, showOverflow: 'tooltip' },
    {
      field: 'action',
      title: '操作',
      fixed: 'right',
      slots: { default: 'action' },
      width: 140,
    },
  ];
}
