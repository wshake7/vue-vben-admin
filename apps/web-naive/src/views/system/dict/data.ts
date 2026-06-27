import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { DictData, DictType } from '#/api/system/dict';

import { z } from '#/adapter/form';
import { fetchAllDictTypesApi } from '#/api/system/dict';

/* ============================================================
 * 平台（与 schema v8 + 后端 ?platform= 对齐）
 * ============================================================ */

/** 当前前端平台标识（VITE_APP_PLATFORM）。缺省 'general'。 */
export const DEFAULT_PLATFORM: string =
  (import.meta.env.VITE_APP_PLATFORM as string | undefined) || 'general';

/**
 * 字典项 platform 字段的候选下拉选项。
 * 仅展示「自己」+「通用」两项；本前端不允许选择其他平台。
 */
export const PLATFORM_OPTIONS: Array<{ label: string; value: string }> =
  (() => {
    const list: Array<{ label: string; value: string }> = [
      { label: '通用', value: 'general' },
    ];
    if (DEFAULT_PLATFORM !== 'general') {
      list.push({ label: DEFAULT_PLATFORM, value: DEFAULT_PLATFORM });
    }
    return list;
  })();

/* ============================================================
 * 共享：字典类型下拉选项（用于左右两个搜索框的「类型编码」下拉）
 * ============================================================ */
function useDictTypeCodeOptions(multiple = false) {
  return {
    component: 'ApiSelect',
    componentProps: () => ({
      api: () => fetchAllDictTypesApi(),
      afterFetch: (data: DictType[]) =>
        data.map((t) => ({
          label: `${t.name}（${t.code}）`,
          value: t.code,
        })),
      allowClear: true,
      filterable: true,
      multiple,
      placeholder: '请选择类型编码',
    }),
  };
}

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
        // options 由 form.vue 的 buildSchema 注入 localTypeOptions
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
      component: 'Select',
      fieldName: 'platform',
      label: '归属平台',
      defaultValue: DEFAULT_PLATFORM,
      componentProps: {
        options: PLATFORM_OPTIONS,
        filterable: false,
        placeholder: '请选择归属平台',
      },
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
  const typeCode = useDictTypeCodeOptions(true);
  return [
    { ...typeCode, fieldName: 'code', label: '类型编码' },
    { component: 'Input', fieldName: 'name', label: '类型名称' },
  ];
}

/* ============================================================
 * 字典项 列表检索 schema
 *
 * typeCode 由代码逻辑控制（点击行 / 关闭按钮），不进搜索表单。
 * ============================================================ */
export function useDataSearchSchema(): VbenFormProps['schema'] {
  return [{ component: 'Input', fieldName: 'value', label: '字典值' }];
}

/* ============================================================
 * 表格列定义
 * 第一列 type='checkbox' 用于多选；批量工具栏由父组件通过 gridEvents
 * （checkboxChange / checkboxAll）拿到勾选行后渲染。
 * ============================================================ */
export function useTypeColumns(): VxeTableGridOptions['columns'] {
  return [
    { type: 'checkbox', width: 44, fixed: 'left' },
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
    { type: 'checkbox', width: 44, fixed: 'left' },
    { field: 'id', title: 'ID', width: 80 },
    {
      field: 'typeCode',
      title: '类型编码',
      width: 140,
      showOverflow: 'tooltip',
    },
    { field: 'value', title: '字典值', width: 120 },
    { field: 'label', title: '字典标签', width: 140, showOverflow: 'tooltip' },
    {
      cellRender: {
        name: 'CellTag',
        props: ({ row }: { row: DictData }) => ({
          color: row.platform === 'general' ? 'default' : 'info',
        }),
      },
      field: 'platform',
      title: '归属平台',
      width: 110,
    },
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
