<script setup lang="ts">
import type { VxeGridListeners, VxeGridProps } from '#/adapter/vxe-table';

import { computed, ref, watch } from 'vue';

import { NButton, NCard, NGrid, NGridItem, NSpace, useMessage } from 'naive-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteDictTypeApi,
  fetchDictTypeListApi,
  type DictType,
} from '#/api/system/dict-type';
import {
  deleteDictDataApi,
  fetchDictDataListApi,
  type DictData,
} from '#/api/system/dict-data';

import DictTypeDrawer from './modules/dict-type-drawer.vue';
import DictDataDrawer from './modules/dict-data-drawer.vue';

defineOptions({ name: 'SystemDict' });

const message = useMessage();

// ---------- 共享状态 ----------
const selectedTypeId = ref<number | null>(null);
const selectedType = ref<DictType | null>(null);

const typeDrawerOpen = ref(false);
const editingType = ref<DictType | null>(null);
const entryDrawerOpen = ref(false);
const editingEntry = ref<DictData | null>(null);

// ============================================================
// 左表：字典类型（vxe-table）
// ============================================================

const typeGridOptions: VxeGridProps<DictType> = {
  columns: [
    { field: 'id', title: 'ID', width: 80 },
    { field: 'code', title: '类型编码', width: 160 },
    { field: 'name', title: '类型名称', width: 160 },
    {
      field: 'remark',
      title: '备注',
      minWidth: 160,
      showOverflow: 'tooltip',
    },
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
      fixed: 'right',
      slots: { default: 'action' },
      title: '操作',
      width: 160,
    },
  ],
  keepSource: true,
  pagerConfig: {},
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        const payload = {
          page: page.currentPage,
          pageSize: page.pageSize,
          code: formValues.code || undefined,
          name: formValues.name || undefined,
          status: (formValues.status as 0 | 1 | '') ?? '',
        };
        const res = await fetchDictTypeListApi(payload);
        return { items: res.items, total: res.total };
      },
    },
    sort: false,
  },
  rowConfig: { isCurrent: true },
  showOverflow: true,
  size: 'small',
  stripe: true,
  toolbarConfig: {
    custom: true,
    refresh: true,
    zoom: true,
  },
};

const typeGridEvents: VxeGridListeners<DictType> = {
  currentRowChange: ({ row }) => {
    if (!row) return;
    selectedTypeId.value = row.id;
    selectedType.value = row;
    // 切换类型后重载右表（reload 会回到第 1 页）
    entryGridApi.reload();
  },
};

const [TypeGrid, typeGridApi] = useVbenVxeGrid<DictType>({
  formOptions: {
    collapsed: true,
    schema: [
      {
        component: 'Input',
        fieldName: 'code',
        label: '类型编码',
      },
      {
        component: 'Input',
        fieldName: 'name',
        label: '类型名称',
      },
      {
        component: 'Select',
        componentProps: {
          allowClear: true,
          options: [
            { label: '启用', value: 1 },
            { label: '禁用', value: 0 },
          ],
          placeholder: '状态',
        },
        fieldName: 'status',
        label: '状态',
      },
    ],
    showCollapseButton: true,
    submitOnChange: false,
  },
  gridEvents: typeGridEvents,
  gridOptions: typeGridOptions,
});

function openTypeCreate() {
  editingType.value = null;
  typeDrawerOpen.value = true;
}
function openTypeEdit(row: DictType) {
  editingType.value = row;
  typeDrawerOpen.value = true;
}
async function handleDeleteType(row: DictType) {
  try {
    await deleteDictTypeApi(row.id);
    message.success('删除成功');
    if (selectedTypeId.value === row.id) {
      selectedTypeId.value = null;
      selectedType.value = null;
    }
    typeGridApi.reload();
  } catch (err) {
    message.error(`删除失败：${(err as Error).message ?? '未知错误'}`);
  }
}

function onTypeSaved() {
  typeGridApi.reload();
}

// ============================================================
// 右表：字典项（vxe-table）
// ============================================================

const entryGridOptions: VxeGridProps<DictData> = {
  columns: [
    { field: 'id', title: 'ID', width: 80 },
    { field: 'value', title: '字典值', width: 120 },
    { field: 'label', title: '字典标签', width: 160 },
    { field: 'sort', title: '排序', width: 80 },
    {
      cellRender: {
        name: 'CellTag',
        props: ({ row }: { row: DictData }) => ({
          color: row.is_default === 1 ? 'processing' : 'default',
        }),
      },
      field: 'is_default',
      formatter: ({ row }: { row: DictData }) =>
        row.is_default === 1 ? '默认' : '-',
      title: '默认',
      width: 80,
    },
    {
      cellRender: {
        name: 'CellTag',
        props: ({ row }: { row: DictData }) => ({
          color: row.is_enabled === 1 ? 'success' : 'default',
        }),
      },
      field: 'is_enabled',
      formatter: ({ row }: { row: DictData }) =>
        row.is_enabled === 1 ? '启用' : '禁用',
      title: '状态',
      width: 90,
    },
    {
      field: 'remark',
      title: '备注',
      minWidth: 160,
      showOverflow: 'tooltip',
    },
    {
      field: 'action',
      fixed: 'right',
      slots: { default: 'entry-action' },
      title: '操作',
      width: 160,
    },
  ],
  keepSource: true,
  pagerConfig: {},
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        if (!selectedTypeId.value) {
          // 未选中类型：返回空集，避免无效请求
          return { items: [], total: 0 };
        }
        const payload = {
          page: page.currentPage,
          pageSize: page.pageSize,
          typeId: selectedTypeId.value,
          label: formValues.label || undefined,
          value: formValues.value || undefined,
          status: (formValues.status as 0 | 1 | '') ?? '',
        };
        const res = await fetchDictDataListApi(payload);
        return { items: res.items, total: res.total };
      },
    },
    sort: false,
  },
  showOverflow: true,
  size: 'small',
  stripe: true,
  toolbarConfig: {
    custom: true,
    refresh: true,
    zoom: true,
  },
};

const [EntryGrid, entryGridApi] = useVbenVxeGrid<DictData>({
  formOptions: {
    collapsed: true,
    schema: [
      {
        component: 'Input',
        fieldName: 'value',
        label: '字典值',
      },
      {
        component: 'Input',
        fieldName: 'label',
        label: '字典标签',
      },
      {
        component: 'Select',
        componentProps: {
          allowClear: true,
          options: [
            { label: '启用', value: 1 },
            { label: '禁用', value: 0 },
          ],
          placeholder: '状态',
        },
        fieldName: 'status',
        label: '状态',
      },
    ],
    showCollapseButton: true,
    submitOnChange: false,
  },
  gridOptions: entryGridOptions,
});

function openEntryCreate() {
  if (!selectedTypeId.value) {
    message.warning('请先在左侧选择一个字典类型');
    return;
  }
  editingEntry.value = null;
  entryDrawerOpen.value = true;
}
function openEntryEdit(row: DictData) {
  editingEntry.value = row;
  entryDrawerOpen.value = true;
}
async function handleDeleteEntry(row: DictData) {
  try {
    await deleteDictDataApi(row.id);
    message.success('删除成功');
    entryGridApi.reload();
  } catch (err) {
    message.error(`删除失败：${(err as Error).message ?? '未知错误'}`);
  }
}

function onEntrySaved() {
  entryGridApi.reload();
}

// 切换选中类型时右表回到第 1 页并刷新
watch(selectedTypeId, () => {
  entryGridApi.reload();
});

const rightTitle = computed(() => {
  if (!selectedType.value) return '字典数据（请先选择左侧类型）';
  return `字典数据：${selectedType.value.name}（${selectedType.value.code}）`;
});
</script>

<template>
  <div class="dict-page">
    <NGrid cols="1 m:2" responsive="screen" :x-gap="16" :y-gap="16">
      <NGridItem>
        <NCard title="字典类型">
          <TypeGrid table-title="字典类型列表">
            <template #toolbar-tools>
              <NButton type="primary" @click="openTypeCreate">
                新建类型
              </NButton>
            </template>
            <template #action="{ row }">
              <NSpace>
                <NButton text type="primary" @click="openTypeEdit(row)">
                  编辑
                </NButton>
                <NButton text type="error" @click="handleDeleteType(row)">
                  删除
                </NButton>
              </NSpace>
            </template>
          </TypeGrid>
        </NCard>
      </NGridItem>

      <NGridItem>
        <NCard :title="rightTitle">
          <EntryGrid table-title="字典条目列表">
            <template #toolbar-tools>
              <NButton
                type="primary"
                :disabled="!selectedTypeId"
                @click="openEntryCreate"
              >
                新建条目
              </NButton>
            </template>
            <template #entry-action="{ row }">
              <NSpace>
                <NButton text type="primary" @click="openEntryEdit(row)">
                  编辑
                </NButton>
                <NButton text type="error" @click="handleDeleteEntry(row)">
                  删除
                </NButton>
              </NSpace>
            </template>
          </EntryGrid>
        </NCard>
      </NGridItem>
    </NGrid>

    <DictTypeDrawer
      :open="typeDrawerOpen"
      :row="editingType"
      @update:open="(v: boolean) => (typeDrawerOpen = v)"
      @saved="onTypeSaved"
    />
    <DictDataDrawer
      :open="entryDrawerOpen"
      :row="editingEntry"
      :default-type-id="selectedTypeId ?? undefined"
      @update:open="(v: boolean) => (entryDrawerOpen = v)"
      @saved="onEntrySaved"
    />
  </div>
</template>

<style scoped>
.dict-page {
  padding: 16px;
}
</style>
