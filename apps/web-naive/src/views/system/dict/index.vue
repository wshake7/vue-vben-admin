<script lang="ts" setup>
import type { VxeGridListeners } from '#/adapter/vxe-table';
import type { DictData, DictType } from '#/api/system/dict';

import { computed, onMounted, ref } from 'vue';

import { Page, useVbenDrawer } from '@vben/common-ui';

import {
  NButton,
  NCard,
  NCheckbox,
  NGrid,
  NGridItem,
  NPopconfirm,
  NSelect,
  NSpace,
  NTag,
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
import { useListDictData } from '#/api/system/dict/hooks';
import {
  DEFAULT_PLATFORM,
  SEARCH_PLATFORM_OPTIONS,
  useDataColumns,
  useDataSearchSchema,
  useTypeColumns,
  useTypeSearchSchema,
} from '#/views/system/dict/data';
import Form from '#/views/system/dict/modules/form.vue';

defineOptions({ name: 'SystemDict' });

// 与 React 版 getCurrentPlatform() 一致：取当前环境的 platform，
// 找不到时兜底为 'general'（与 VITE_APP_PLATFORM 缺失行为一致）。
function getCurrentPlatform(): string {
  return (import.meta.env.VITE_APP_PLATFORM as string | undefined) ?? 'general';
}

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

// 右表当前 typeCode：由左表点击行 / 关闭按钮写入，ajax.query 直接读这个 ref。
// typeCode 不再走表单：搜索栏也不显示该字段，逻辑完全在代码里完成。
const entryTypeCode = ref<string | undefined>(undefined);

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
// 一次 list 调用拉两份字典（sys_switch_status + sys_platform）
// 客户端按返回的 typeCode 字段拆成 switchStatusDict / platformDict。
// 字典未加载完时（首次 render / 错误）数组为空，列定义走兜底分支。
// 显式带 includeGeneral: true：mock dict-data/list.ts 默认 includeGeneral=false，
// 平台为 react-admin / vue-admin 时不会自动并入 general 组；显式开启后才能
// 同时拿到 general + 当前平台两组字典项。
// ============================================================
const { data: dictPage } = useListDictData({
  typeCode: ['sys_switch_status', 'sys_platform'],
  includeGeneral: true,
});
const switchStatusDict = computed<DictData[]>(() =>
  (dictPage.value?.items ?? []).filter(
    (d) => d.typeCode === 'sys_switch_status',
  ),
);
const platformDict = computed<DictData[]>(() =>
  (dictPage.value?.items ?? []).filter((d) => d.typeCode === 'sys_platform'),
);

// ============================================================
// 左表：字典类型
// ============================================================
const typeColumns: ReturnType<typeof useTypeColumns> = useTypeColumns({
  switchStatusDict: switchStatusDict.value,
});

const typeGridEvents: VxeGridListeners<DictType> = {
  currentRowChange: ({ row }) => {
    if (!row) return;
    // 选中左表行后，把右表的 typeCode（由 entryTypeCode 持有）同步为该类型编码。
    entryTypeCode.value = row.code;
    selectedTypeId.value = row.id;
    selectedType.value = row;
    entryGridApi.reload();
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
const dataColumns: ReturnType<typeof useDataColumns> = useDataColumns({
  switchStatusDict: switchStatusDict.value,
  platformDict: platformDict.value,
});

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
    // 接管 form 重置：把右侧插槽里那个独立维护的 `includeGeneralChecked` ref
    // 拉回 true 并写回 form 字段。否则重置后 checkbox 视觉上仍然为空（ref 没
    // 跟着 form 一起 reset），跟用户预期「通用默认勾上」不一致。
    handleReset: async () => {
      includeGeneralChecked.value = true;
      await entryGridApi.formApi?.setFieldValue?.('includeGeneral', true);
      await entryGridApi.formApi?.resetForm?.();
      // 把 reset 后的 formValues 同步给 ajax.query：vxe-grid 的 ajax 通过
      // extendProxyOptions 桥接到 formApi.getLatestSubmissionValues()，而不是
      // 每次现读 getValues()。如果不写 latest snapshot，ajax.query 拿到的还是
      // reset 之前的「不含通用」的旧值，结果就是「reset 后 checkbox 勾上了但
      // 列表没刷新」。
      const formValues = (await entryGridApi.formApi?.getValues?.()) ?? {};
      entryGridApi.formApi?.setLatestSubmissionValues?.(formValues);
      await entryGridApi.reload();
    },
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
          // typeCode 不在搜索表单里，由 entryTypeCode 提供（点击行 / 关闭按钮）。
          // platform：表单未选时落到 DEFAULT_PLATFORM（=VITE_APP_PLATFORM）。
          // includeGeneral：复选框布尔值；后端 platform=general 时忽略。
          return await fetchDictDataListApi({
            page: page.currentPage,
            pageSize: page.pageSize,
            typeCode: entryTypeCode.value,
            value: formValues.value || undefined,
            platform: formValues.platform || DEFAULT_PLATFORM,
            includeGeneral: formValues.includeGeneral === true,
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

/**
 * 清除右表的「点击行筛选」状态：
 * - 清空 typeCode ref
 * - 清空 selectedType / selectedTypeId（Tag 消失，标题变回「字典数据」）
 * - 重新拉一次右表数据，typeCode 变 undefined 后右表回到「全部」
 */
function clearEntrySelection() {
  entryTypeCode.value = undefined;
  selectedTypeId.value = null;
  selectedType.value = null;
  entryGridApi.reload();
}

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

// ------------------------------------------------------------
// #form-platform 插槽：Select + 包含通用 Checkbox 同行渲染
// - platform 字段由 schema 接管（v-model 等价物 = value / onUpdate:value）
// - includeGeneral 在 schema 里以「不渲染的隐藏字段」形式注册（useDataSearchSchema
//   里的 dependencies.if: () => false），所以 defaultValue: true 在 form init 时就
//   落进 form.values；不需要再在 onMounted 里 setFieldValue 兜底。
// - 插槽里的 Checkbox 仍通过 formApi.setFieldValue 写回，与 schema 里那个隐藏
//   field 共享同一个 form 字段；提交时 formValues.includeGeneral === true。
// - 当 platform === 'general' 时 Checkbox 强制 disabled（与 React 版一致）。
// ------------------------------------------------------------
const includeGeneralChecked = ref(true);

function setIncludeGeneralField(value: boolean) {
  void entryGridApi.formApi?.setFieldValue?.('includeGeneral', value);
}
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
        <NCard>
          <template #header>
            <NSpace align="center" :size="8">
              <span>字典数据</span>
              <NTag
                v-if="selectedType"
                closable
                :bordered="false"
                @close="clearEntrySelection"
              >
                {{ selectedType.name }}（{{ selectedType.code }}）
              </NTag>
            </NSpace>
          </template>
          <EntryGrid table-title="字典条目列表">
            <template
              #form-platform="{
                value: platformValue,
                'onUpdate:value': onUpdatePlatform,
              }"
            >
              <div
                style="
                  display: flex;
                  gap: 12px;
                  align-items: center;
                  width: 100%;
                "
              >
                <NSelect
                  :value="platformValue ?? getCurrentPlatform()"
                  :on-update:value="
                    (v: string | null) => {
                      onUpdatePlatform?.(v ?? undefined);
                    }
                  "
                  :options="SEARCH_PLATFORM_OPTIONS"
                  placeholder="请选择归属平台"
                  clearable
                  style="flex: 1; min-width: 0"
                />
                <NCheckbox
                  :checked="includeGeneralChecked"
                  :on-update:checked="
                    (v: boolean) => {
                      includeGeneralChecked = v;
                      setIncludeGeneralField(v);
                    }
                  "
                  :disabled="platformValue === 'general'"
                  style="white-space: nowrap"
                >
                  通用
                </NCheckbox>
              </div>
            </template>
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
