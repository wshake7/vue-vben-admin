<script lang="ts" setup>
import type { VxeGridListeners } from '#/adapter/vxe-table';
import type { DictData, DictType } from '#/api/system/dict';

import { computed, onMounted, ref, toRaw } from 'vue';

import { Page, useVbenDrawer } from '@vben/common-ui';

import {
  NButton,
  NCard,
  NGrid,
  NGridItem,
  NPopconfirm,
  NSpace,
  useMessage,
} from 'naive-ui';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  batchDictDataApi,
  batchDictTypeApi,
  deleteDictDataApi,
  fetchAllDictTypesApi,
  fetchDictDataListApi,
  fetchDictTypeListApi,
} from '#/api/system/dict';
import {
  useDataColumns,
  useDataSearchSchema,
  useTypeColumns,
  useTypeSearchSchema,
} from '#/views/system/dict/data';
import Form from '#/views/system/dict/modules/form.vue';

defineOptions({ name: 'SystemDict' });

const message = useMessage();

type BulkAction = 'delete' | 'disable' | 'enable';

// 批量操作成功提示文案，避免嵌套三元
const BULK_SUCCESS_TEXT: Record<BulkAction, string> = {
  delete: '批量删除成功',
  disable: '批量禁用成功',
  enable: '批量启用成功',
};

// ---------- 共享状态 ----------
const selectedTypeId = ref<null | number>(null);
const selectedType = ref<DictType | null>(null);
const typeOptions = ref<Array<{ label: string; value: number }>>([]);

// 多选状态（左右两表各自独立）
const typeSelectedIds = ref<Set<number>>(new Set());
const entrySelectedIds = ref<Set<number>>(new Set());
const bulkLoading = ref({ type: false, data: false });

// ============================================================
// 抽屉（vben drawer + connectedComponent）
// ============================================================
const [TypeFormDrawer, typeFormDrawerApi] = useVbenDrawer({
  connectedComponent: Form,
  destroyOnClose: true,
});

const [DataFormDrawer, dataFormDrawerApi] = useVbenDrawer({
  connectedComponent: Form,
  destroyOnClose: true,
});

// ============================================================
// 左表：字典类型
// ============================================================
const typeColumns: ReturnType<typeof useTypeColumns> = useTypeColumns();

const typeGridEvents: VxeGridListeners<DictType> = {
  currentRowChange: async ({ row }) => {
    if (!row) return;
    // 1. 把右表搜索框的「类型编码」同步为该类型编码
    // 2. 显式更新 vben-form 的「最近一次提交值」：vxe-grid 的 proxy 是从那里读取表单值，
    //    直接 setFieldValue 不会触发它，必须手动 setLatestSubmissionValues，
    //    否则点击行后右表不会按新编码筛选。
    // 3. 调用 query 并显式传入 formValues，避免任何缓存导致的旧值。
    await entryGridApi.formApi.setFieldValue('typeCode', row.code);
    const formValues = toRaw(await entryGridApi.formApi.getValues());
    entryGridApi.formApi.setLatestSubmissionValues(formValues);
    selectedTypeId.value = row.id;
    selectedType.value = row;
    entryGridApi.query(formValues);
  },
  checkboxChange: ({ row, checked }) => {
    if (!row) return;
    const next = new Set(typeSelectedIds.value);
    if (checked) next.add(row.id);
    else next.delete(row.id);
    typeSelectedIds.value = next;
  },
  checkboxAll: ({ checked }) => {
    const records = (typeGridApi.grid?.getCheckboxRecords?.() ??
      []) as DictType[];
    typeSelectedIds.value = checked
      ? new Set(records.map((r) => r.id))
      : new Set();
  },
};

const [TypeGrid, typeGridApi] = useVbenVxeGrid<DictType>({
  formOptions: {
    collapsed: false,
    schema: useTypeSearchSchema(),
    showCollapseButton: false,
  },
  gridEvents: typeGridEvents,
  gridOptions: {
    checkboxConfig: { highlight: true },
    columns: typeColumns,
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async (
          { page }: { page: { currentPage: number; pageSize: number } },
          formValues: Record<string, any>,
        ) => {
          return await fetchDictTypeListApi({
            page: page.currentPage,
            pageSize: page.pageSize,
            code: formValues.code || undefined,
            name: formValues.name || undefined,
          });
        },
      },
    },
    rowConfig: { isCurrent: true },
    size: 'small',
    stripe: true,
    toolbarConfig: {
      custom: true,
      refresh: true,
      zoom: true,
    },
  } as never,
});

// ============================================================
// 右表：字典项
// ============================================================
const dataColumns: ReturnType<typeof useDataColumns> = useDataColumns();

const entryGridEvents: VxeGridListeners<DictData> = {
  checkboxChange: ({ row, checked }) => {
    if (!row) return;
    const next = new Set(entrySelectedIds.value);
    if (checked) next.add(row.id);
    else next.delete(row.id);
    entrySelectedIds.value = next;
  },
  checkboxAll: ({ checked }) => {
    const records = (entryGridApi.grid?.getCheckboxRecords?.() ??
      []) as DictData[];
    entrySelectedIds.value = checked
      ? new Set(records.map((r) => r.id))
      : new Set();
  },
};

const [EntryGrid, entryGridApi] = useVbenVxeGrid<DictData>({
  formOptions: {
    collapsed: false,
    schema: useDataSearchSchema(),
    showCollapseButton: false,
  },
  gridEvents: entryGridEvents,
  gridOptions: {
    checkboxConfig: { highlight: true },
    columns: dataColumns,
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async (
          { page }: { page: { currentPage: number; pageSize: number } },
          formValues: Record<string, any>,
        ) => {
          return await fetchDictDataListApi({
            page: page.currentPage,
            pageSize: page.pageSize,
            typeCode: formValues.typeCode || undefined,
            value: formValues.value || undefined,
            label: formValues.label || undefined,
          });
        },
      },
    },
    size: 'small',
    stripe: true,
    toolbarConfig: {
      custom: true,
      refresh: true,
      zoom: true,
    },
  } as never,
});

// ============================================================
// 行为
// ============================================================
function openTypeCreate() {
  typeFormDrawerApi.setData({}).open();
}

function openEntryCreate() {
  dataFormDrawerApi.setData({}).open();
}

const rightTitle = computed(() => {
  if (!selectedType.value) return '字典数据';
  return `字典数据：${selectedType.value.name}（${selectedType.value.code}）`;
});

/* ============================================================
 * 批量操作
 * - 选择变更后自动清空「待操作 ID 列表」，避免过期的勾选残留
 * - 操作完成后调用 reload() 重拉数据，并 clearCheckboxRow() 清掉勾选
 * ============================================================ */
async function bulkTypeAction(action: 'delete' | 'disable' | 'enable') {
  const ids = [...typeSelectedIds.value];
  if (ids.length === 0) {
    message.warning('请先勾选要操作的字典类型');
    return;
  }
  bulkLoading.value.type = true;
  try {
    await batchDictTypeApi({ action, ids });
    message.success(BULK_SUCCESS_TEXT[action]);
    typeSelectedIds.value = new Set();
    typeGridApi.grid?.clearCheckboxRow?.();
    typeGridApi.reload();
  } catch (error) {
    message.error(`批量操作失败：${(error as Error).message ?? '未知错误'}`);
  } finally {
    bulkLoading.value.type = false;
  }
}

async function bulkEntryAction(action: 'delete' | 'disable' | 'enable') {
  const ids = [...entrySelectedIds.value];
  if (ids.length === 0) {
    message.warning('请先勾选要操作的字典项');
    return;
  }
  bulkLoading.value.data = true;
  try {
    await batchDictDataApi({ action, ids });
    message.success(BULK_SUCCESS_TEXT[action]);
    entrySelectedIds.value = new Set();
    entryGridApi.grid?.clearCheckboxRow?.();
    entryGridApi.reload();
  } catch (error) {
    message.error(`批量操作失败：${(error as Error).message ?? '未知错误'}`);
  } finally {
    bulkLoading.value.data = false;
  }
}

// 预加载字典类型下拉选项
onMounted(async () => {
  try {
    const list = await fetchAllDictTypesApi({ status: 1 });
    typeOptions.value = list.map((t) => ({
      label: `${t.name}（${t.code}）`,
      value: t.id,
    }));
  } catch {
    // 静默失败：drawer 打开时再尝试
  }
});
</script>

<template>
  <Page auto-content-height>
    <NGrid cols="1 m:2" responsive="screen" :x-gap="16" :y-gap="16">
      <NGridItem>
        <NCard title="字典类型">
          <TypeGrid table-title="字典类型列表">
            <template #toolbar-tools>
              <NSpace :size="8" align="center">
                <span
                  v-if="typeSelectedIds.size > 0"
                  style="font-size: 12px; color: var(--n-text-color-3)"
                >
                  已选
                  <strong style="color: var(--n-text-color-1)">{{
                    typeSelectedIds.size
                  }}</strong>
                  条
                </span>
                <NButton
                  v-if="typeSelectedIds.size > 0"
                  size="small"
                  :loading="bulkLoading.type"
                  @click="bulkTypeAction('enable')"
                >
                  批量启用
                </NButton>
                <NButton
                  v-if="typeSelectedIds.size > 0"
                  size="small"
                  :loading="bulkLoading.type"
                  @click="bulkTypeAction('disable')"
                >
                  批量禁用
                </NButton>
                <NPopconfirm
                  v-if="typeSelectedIds.size > 0"
                  @positive-click="bulkTypeAction('delete')"
                >
                  <template #trigger>
                    <NButton
                      size="small"
                      type="error"
                      ghost
                      :loading="bulkLoading.type"
                    >
                      批量删除
                    </NButton>
                  </template>
                  确定要删除选中的
                  {{ typeSelectedIds.size }}
                  个字典类型？若仍有字典项将无法删除。
                </NPopconfirm>
                <NButton
                  v-if="typeSelectedIds.size === 0"
                  type="primary"
                  size="small"
                  @click="openTypeCreate"
                >
                  新建类型
                </NButton>
              </NSpace>
            </template>
            <template #action="{ row }">
              <NSpace>
                <NButton
                  text
                  type="primary"
                  @click="typeFormDrawerApi.setData(row).open()"
                >
                  编辑
                </NButton>
                <NPopconfirm
                  @positive-click="
                    (e: MouseEvent) => {
                      e?.stopPropagation?.();
                      return false;
                    }
                  "
                >
                  <template #trigger>
                    <NButton text type="error">删除</NButton>
                  </template>
                  确定要删除该字典类型？若仍有字典项将无法删除。
                </NPopconfirm>
              </NSpace>
            </template>
          </TypeGrid>
        </NCard>
      </NGridItem>

      <NGridItem>
        <NCard :title="rightTitle">
          <EntryGrid table-title="字典条目列表">
            <template #toolbar-tools>
              <NSpace :size="8" align="center">
                <span
                  v-if="entrySelectedIds.size > 0"
                  style="font-size: 12px; color: var(--n-text-color-3)"
                >
                  已选
                  <strong style="color: var(--n-text-color-1)">{{
                    entrySelectedIds.size
                  }}</strong>
                  条
                </span>
                <NButton
                  v-if="entrySelectedIds.size > 0"
                  size="small"
                  :loading="bulkLoading.data"
                  @click="bulkEntryAction('enable')"
                >
                  批量启用
                </NButton>
                <NButton
                  v-if="entrySelectedIds.size > 0"
                  size="small"
                  :loading="bulkLoading.data"
                  @click="bulkEntryAction('disable')"
                >
                  批量禁用
                </NButton>
                <NPopconfirm
                  v-if="entrySelectedIds.size > 0"
                  @positive-click="bulkEntryAction('delete')"
                >
                  <template #trigger>
                    <NButton
                      size="small"
                      type="error"
                      ghost
                      :loading="bulkLoading.data"
                    >
                      批量删除
                    </NButton>
                  </template>
                  确定要删除选中的 {{ entrySelectedIds.size }} 条字典项？
                </NPopconfirm>
                <NButton
                  v-if="entrySelectedIds.size === 0"
                  type="primary"
                  size="small"
                  @click="openEntryCreate"
                >
                  新建条目
                </NButton>
              </NSpace>
            </template>
            <template #action="{ row }">
              <NSpace>
                <NButton
                  text
                  type="primary"
                  @click="dataFormDrawerApi.setData(row).open()"
                >
                  编辑
                </NButton>
                <NButton
                  text
                  type="error"
                  @click="
                    deleteDictDataApi(row.id)
                      .then(() => entryGridApi.reload())
                      .then(() => message.success('删除成功'))
                      .catch((err: Error) =>
                        message.error(`删除失败：${err.message}`),
                      )
                  "
                >
                  删除
                </NButton>
              </NSpace>
            </template>
          </EntryGrid>
        </NCard>
      </NGridItem>
    </NGrid>

    <TypeFormDrawer kind="type" @success="typeGridApi.reload()" />
    <DataFormDrawer
      kind="data"
      :default-type-id="selectedTypeId ?? undefined"
      :type-options="typeOptions"
      @success="entryGridApi.reload()"
    />
  </Page>
</template>
