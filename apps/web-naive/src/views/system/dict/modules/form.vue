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
  updateDictDataApi,
  updateDictTypeApi,
} from '#/api/system/dict';

import { useDataFormSchema, useTypeFormSchema } from '#/views/system/dict/data';

interface Props {
  /** 表单类型：'type' = 字典类型 / 'data' = 字典项 */
  kind: 'type' | 'data';
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

const formData = ref<DictType | DictData | undefined>();

const id = ref<number>();

/**
 * 渲染 schema：kind='data' 时把 typeId 字段的 options 注入 props.typeOptions
 */
function buildSchema() {
  const base =
    (props.kind === 'data' ? useDataFormSchema() : useTypeFormSchema()) ?? [];
  if (props.kind !== 'data') return base;
  return base.map((item) => {
    if (item.fieldName === 'typeId') {
      return {
        ...item,
        componentProps: {
          ...(item.componentProps ?? {}),
          options: props.typeOptions,
        },
      };
    }
    return item;
  });
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
      await nextTick();

      if (data) {
        if (props.kind === 'type') {
          const t = data as DictType;
          formApi.setValues({ ...t, is_enabled: t.is_enabled === 1 });
        } else {
          const d = data as DictData;
          formApi.setValues({
            ...d,
            isDefault: d.is_default === 1,
            is_enabled: d.is_enabled === 1,
          });
        }
      } else if (props.kind === 'data') {
        // 新建字典项：优先用 defaultTypeId
        formApi.setValues({
          typeId: props.defaultTypeId ?? null,
          is_enabled: true,
        });
      }
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
