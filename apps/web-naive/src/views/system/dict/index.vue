<script lang="ts" setup>
import type { VxeGridListeners } from '#/adapter/vxe-table';

import { computed, onMounted, ref, watch } from 'vue';

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
  deleteDictDataApi,
  fetchAllDictTypesApi,
  fetchDictDataListApi,
  fetchDictTypeListApi,
  type DictData,
  type DictType,
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

// ---------- 共享状态 ----------
const selectedTypeId = ref<number | null>(null);
const selectedType = ref<DictType | null>(null);
const typeOptions = ref<Array<{ label: string; value: number }>>([]);

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
  currentRowChange: ({ row }) => {
    if (!row) return;
    selectedTypeId.value = row.id;
    selectedType.value = row;
    entryGridApi.reload();
  },
};

const [TypeGrid, typeGridApi] = useVbenVxeGrid<DictType>({
  formOptions: {
    collapsed: true,
    schema: useTypeSearchSchema(),
    showCollapseButton: true,
  },
  gridEvents: typeGridEvents,
  gridOptions: {
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
            status: formValues.status,
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

const [EntryGrid, entryGridApi] = useVbenVxeGrid<DictData>({
  formOptions: {
    collapsed: true,
    schema: useDataSearchSchema(),
    showCollapseButton: true,
  },
  gridOptions: {
    columns: dataColumns,
    keepSource: true,
    proxyConfig: {
      ajax: {
        query: async (
          { page }: { page: { currentPage: number; pageSize: number } },
          formValues: Record<string, any>,
        ) => {
          if (!selectedTypeId.value) {
            return { items: [], total: 0 };
          }
          return await fetchDictDataListApi({
            page: page.currentPage,
            pageSize: page.pageSize,
            typeId: selectedTypeId.value,
            value: formValues.value || undefined,
            label: formValues.label || undefined,
            status: formValues.status,
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
  if (!selectedTypeId.value) {
    message.warning('请先在左侧选择一个字典类型');
    return;
  }
  dataFormDrawerApi.setData({}).open();
}

const rightTitle = computed(() => {
  if (!selectedType.value) return '字典数据（请先选择左侧类型）';
  return `字典数据：${selectedType.value.name}（${selectedType.value.code}）`;
});

// 切类型时强制右表回到第 1 页
watch(selectedTypeId, () => {
  entryGridApi.reload();
});

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
              <NButton type="primary" @click="openTypeCreate">
                新建类型
              </NButton>
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
              <NButton
                type="primary"
                :disabled="!selectedTypeId"
                @click="openEntryCreate"
              >
                新建条目
              </NButton>
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
