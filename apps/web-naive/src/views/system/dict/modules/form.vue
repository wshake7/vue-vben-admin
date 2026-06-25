<script lang="ts" setup>
import type {
  CreateDictDataRequest,
  CreateDictTypeRequest,
  DictData,
  DictType,
  UpdateDictDataRequest,
  UpdateDictTypeRequest,
} from '#/api/system/dict';

import { computed, nextTick, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { useVbenForm } from '#/adapter/form';
import {
  createDictDataApi,
  createDictTypeApi,
  fetchAllDictTypesApi,
  updateDictDataApi,
  updateDictTypeApi,
} from '#/api/system/dict';
import { useDataFormSchema, useTypeFormSchema } from '#/views/system/dict/data';

interface Props {
  /** 表单类型：'type' = 字典类型 / 'data' = 字典项 */
  kind: 'data' | 'type';
  /** 双表选中态：dict-data 新建时若指定了 typeId，则锁定 typeId 字段不可改 */
  defaultTypeId?: number;
  /** 字典类型下拉选项（kind='data' 时需要） */
  typeOptions?: Array<{ label: string; value: number }>;
}

const props = withDefaults(defineProps<Props>(), {
  defaultTypeId: undefined,
  typeOptions: () => [],
});

const emits = defineEmits<{
  (e: 'success'): void;
}>();

const formData = ref<DictData | DictType | undefined>();

const id = ref<number>();

// 兜底：父组件 typeOptions 还没就绪时自己拉一次，
// 否则 Select 拿不到匹配项，setValues 设的 typeId 显示不出来
const fallbackTypeOptions = ref<Array<{ label: string; value: number }>>([]);

const effectiveTypeOptions = computed(() =>
  props.typeOptions.length > 0 ? props.typeOptions : fallbackTypeOptions.value,
);

async function ensureTypeOptions() {
  if (effectiveTypeOptions.value.length > 0) return;
  const list = await fetchAllDictTypesApi({ status: 1 });
  fallbackTypeOptions.value = list.map((t) => ({
    label: `${t.name}（${t.code}）`,
    value: t.id,
  }));
}

/**
 * 渲染 schema：kind='data' 时把 typeId 字段的 options 注入 effectiveTypeOptions
 */
function buildSchema() {
  const base =
    (props.kind === 'data' ? useDataFormSchema() : useTypeFormSchema()) ?? [];
  if (props.kind !== 'data') return base;
  return base.map((item) =>
    item.fieldName === 'typeId'
      ? {
          ...item,
          componentProps: {
            ...item.componentProps,
            options: effectiveTypeOptions.value,
          },
        }
      : item,
  );
}

const [Form, formApi] = useVbenForm({
  schema: buildSchema(),
  showDefaultActions: false,
});

const [Drawer, drawerApi] = useVbenDrawer({
  onCancel() {
    drawerApi.close();
  },
  async onConfirm() {
    const { valid } = await formApi.validate();
    if (!valid) return;
    const rawValues = await formApi.getValues();

    let req: Promise<unknown>;
    if (props.kind === 'type') {
      const values = { ...rawValues, is_enabled: rawValues.is_enabled ? 1 : 0 };
      req = id.value
        ? updateDictTypeApi(
            id.value,
            values as unknown as UpdateDictTypeRequest,
          )
        : createDictTypeApi(values as unknown as CreateDictTypeRequest);
    } else {
      const values = {
        ...rawValues,
        isDefault: !!rawValues.isDefault,
        is_enabled: rawValues.is_enabled ? 1 : 0,
      };
      req = id.value
        ? updateDictDataApi(
            id.value,
            values as unknown as UpdateDictDataRequest,
          )
        : createDictDataApi(values as unknown as CreateDictDataRequest);
    }

    drawerApi.lock();
    req
      .then(() => {
        emits('success');
        drawerApi.close();
      })
      .catch(() => {
        drawerApi.unlock();
      });
  },
  async onOpenChange(isOpen) {
    if (isOpen) {
      const data =
        props.kind === 'type'
          ? drawerApi.getData<DictType>()
          : drawerApi.getData<DictData>();
      // 新建模式：先确保 typeOptions 已加载，再 updateSchema 注入，
      // 否则 Select 拿不到匹配项 typeId 回显不出来。
      // 注意：Vben Drawer 的 getData() 默认返回 {}，setData({}) 与「未传 data」
      // 等价；这里用 data?.id 判别「编辑/新建」，避免空对象误入编辑分支。
      if (props.kind === 'data' && !data?.id) {
        await ensureTypeOptions();
      }
      formApi.resetForm();
      // 切到新 schema（kind 变化时尤其需要）
      formApi.updateSchema(buildSchema());

      if (data?.id) {
        formData.value = data;
        id.value = data.id;
      } else {
        id.value = undefined;
        formData.value = undefined;
      }
      // 等 form 子项（Select）完成挂载与 schema 同步：
      // updateSchema 是异步重建的，单次 nextTick 不足以让 Select 注册到 store，
      // 立即 setValues 会丢。延后到下一帧再回显 typeId 等字段。
      await nextTick();
      setTimeout(() => {
        if (data?.id) {
          if (props.kind === 'type') {
            const t = data as DictType;
            formApi.setValues({ ...t, is_enabled: t.is_enabled === 1 });
          } else {
            const d = data as DictData;
            formApi.setValues({
              typeId: d.type_id,
              value: d.value,
              label: d.label,
              sort: d.sort,
              isDefault: d.is_default === 1,
              is_enabled: d.is_enabled === 1,
              remark: d.remark,
            });
          }
        } else if (props.kind === 'data') {
          // 新建字典项：默认沿用左侧选中的类型，未选则空
          formApi.setValues({
            typeId: props.defaultTypeId ?? undefined,
            is_enabled: true,
          });
        }
      }, 0);
    }
  },
});

const getDrawerTitle = computed(() => {
  if (props.kind === 'type') {
    return formData.value?.id ? '编辑字典类型' : '新建字典类型';
  }
  return formData.value?.id ? '编辑字典项' : '新建字典项';
});
</script>

<template>
  <Drawer :title="getDrawerTitle">
    <Form />
  </Drawer>
</template>
