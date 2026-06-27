import type { VbenFormProps } from '#/adapter/form';
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { DictData, DictType } from '#/api/system/dict';

import { z } from '#/adapter/form';
import { fetchAllDictTypesApi } from '#/api/system/dict';

/* ============================================================
 * 平台标识选项：空=通用，vue-admin / react-admin 为各前端管理端
 * ============================================================ */
export const PLATFORM_OPTIONS: Array<{ label: string; value: string }> = [
  { label: '通用', value: '' },
  { label: 'vue-admin', value: 'vue-admin' },
  { label: 'react-admin', value: 'react-admin' },
];

/**
 * 搜索下拉用：不含「通用」选项。
 * 编辑表单仍然使用 PLATFORM_OPTIONS（创建/编辑通用类型仍需此选项）。
 */
export const PLATFORM_SEARCH_OPTIONS: Array<{ label: string; value: string }> =
  PLATFORM_OPTIONS.filter((o) => o.value !== '');

/**
 * 右表平台标识搜索下拉：包含「通用」选项。
 * 用途：点行选中 platform=''（通用）时，下拉需要能把 value='' 渲染成"通用"
 * 标签，否则选中后字段显示为空白。
 * 后端语义：选「通用」时 value=''，前端透传 platform=''，后端把它识别为「仅通用」。
 */
export const PLATFORM_ENTRY_SEARCH_OPTIONS: Array<{
  label: string;
  value: string;
}> = PLATFORM_OPTIONS;

/** 当前应用默认平台，用于列表默认筛选；从 Vite 环境变量读取 */
export const DEFAULT_PLATFORM: string =
  (import.meta.env.VITE_APP_PLATFORM as string | undefined) ?? '';

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
      component: 'Select',
      fieldName: 'platform',
      label: '平台标识',
      help: '空=通用；非空为前端管理端',
      defaultValue: '',
      componentProps: {
        options: PLATFORM_OPTIONS,
        filterable: true,
        placeholder: '请选择平台',
      },
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
    {
      component: 'Select',
      fieldName: 'platform',
      label: '平台标识',
      defaultValue: DEFAULT_PLATFORM,
      componentProps: {
        options: PLATFORM_SEARCH_OPTIONS,
        filterable: true,
        allowClear: true,
        placeholder: '请选择平台',
      },
    },
  ];
}

/* ============================================================
 * 字典项 列表检索 schema
 *
 * 参数 isPlatformLockedGetter：当左表已点行时返回 true，
 * 右表 platform 字段被禁用并跟随选中行 platform 值。用 getter 让 schema
 * 的 componentProps 可以在响应式状态变化时拿到最新值。
 * ============================================================ */
export function useDataSearchSchema(
  isPlatformLockedGetter: () => boolean = () => false,
): VbenFormProps['schema'] {
  // typeCode 由代码逻辑控制（点击行 / 关闭按钮），不进搜索表单。
  return [
    { component: 'Input', fieldName: 'value', label: '字典值' },
    {
      component: 'Select',
      fieldName: 'platform',
      label: '平台标识',
      defaultValue: DEFAULT_PLATFORM,
      componentProps: () => ({
        // 右表：包含「通用」选项，使选中通用类型时能正确显示「通用」标签
        options: PLATFORM_ENTRY_SEARCH_OPTIONS,
        filterable: true,
        allowClear: true,
        placeholder: '请选择平台',
        disabled: isPlatformLockedGetter(),
      }),
    },
  ];
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
    {
      field: 'platform',
      title: '平台标识',
      width: 130,
      formatter: ({ row }: { row: DictType }) => row.platform || '通用',
    },
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
