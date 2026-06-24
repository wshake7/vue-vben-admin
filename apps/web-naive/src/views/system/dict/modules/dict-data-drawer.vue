<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import { useMessage } from 'naive-ui';

import { fetchAllDictTypesApi, type DictType } from '#/api/system/dict-type';
import {
  createDictDataApi,
  updateDictDataApi,
  type CreateDictDataBody,
  type DictData,
} from '#/api/system/dict-data';

interface Props {
  open: boolean;
  row: DictData | null;
  /** 抽屉打开时若指定了 typeId，则锁定 typeId Select（来自双表选中态） */
  defaultTypeId?: number;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'saved'): void;
}>();

const message = useMessage();

const model = ref<{
  typeId: number | null;
  value: string;
  label: string;
  sort: number;
  isDefault: boolean;
  is_enabled: 0 | 1;
  remark: string;
}>({
  typeId: null,
  value: '',
  label: '',
  sort: 0,
  isDefault: false,
  is_enabled: 1,
  remark: '',
});

const submitting = ref(false);
const isEdit = computed(() => !!props.row);
const typeOptions = ref<{ label: string; value: number }[]>([]);

async function loadTypeOptions() {
  try {
    const list: DictType[] = await fetchAllDictTypesApi({ status: 1 });
    typeOptions.value = list.map((t) => ({
      label: `${t.name}（${t.code}）`,
      value: t.id,
    }));
  } catch {
    // 静默失败：下拉可为空
    typeOptions.value = [];
  }
}

function fillForm() {
  if (props.row) {
    model.value = {
      typeId: props.row.type_id,
      value: props.row.value,
      label: props.row.label,
      sort: props.row.sort,
      isDefault: props.row.is_default === 1,
      is_enabled: props.row.is_enabled,
      remark: props.row.remark ?? '',
    };
  } else {
    model.value = {
      typeId: props.defaultTypeId ?? null,
      value: '',
      label: '',
      sort: 0,
      isDefault: false,
      is_enabled: 1,
      remark: '',
    };
  }
}

watch(
  () => props.open,
  async (val) => {
    if (val) {
      await loadTypeOptions();
      fillForm();
    }
  },
);

async function handleSave() {
  if (!model.value.typeId) {
    message.error('请选择所属类型');
    return;
  }
  if (!model.value.value.trim()) {
    message.error('字典值不能为空');
    return;
  }
  if (!model.value.label.trim()) {
    message.error('字典标签不能为空');
    return;
  }
  submitting.value = true;
  try {
    if (isEdit.value) {
      await updateDictDataApi(props.row!.id, {
        value: model.value.value,
        label: model.value.label,
        sort: model.value.sort,
        is_default: model.value.isDefault ? 1 : 0,
        is_enabled: model.value.is_enabled,
        remark: model.value.remark,
      });
      message.success('保存成功');
    } else {
      const body: CreateDictDataBody = {
        typeId: model.value.typeId!,
        value: model.value.value,
        label: model.value.label,
        sort: model.value.sort,
        isDefault: model.value.isDefault,
        is_enabled: model.value.is_enabled,
        remark: model.value.remark,
      };
      await createDictDataApi(body);
      message.success('创建成功');
    }
    emit('saved');
    emit('update:open', false);
  } catch (err) {
    message.error(`操作失败：${(err as Error).message ?? '未知错误'}`);
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <NDrawer
    :show="open"
    :width="560"
    @update:show="(v: boolean) => emit('update:open', v)"
  >
    <NDrawerContent :title="isEdit ? '编辑字典项' : '新建字典项'" closable>
      <NForm label-placement="top">
        <NFormItem label="所属类型">
          <NSelect
            v-model:value="model.typeId"
            :options="typeOptions"
            placeholder="请选择类型"
            :disabled="isEdit || !!defaultTypeId"
            filterable
          />
        </NFormItem>
        <NFormItem label="字典值">
          <NInput
            v-model:value="model.value"
            placeholder="例如 Y / N / 0 / 1"
            :disabled="isEdit"
          />
        </NFormItem>
        <NFormItem label="字典标签">
          <NInput
            v-model:value="model.label"
            placeholder="例如 是 / 否 / 启用"
          />
        </NFormItem>
        <NFormItem label="排序">
          <NInputNumber
            v-model:value="model.sort"
            placeholder="升序排序，0 排在前"
            :style="{ width: '100%' }"
          />
        </NFormItem>
        <NFormItem label="是否默认">
          <NSwitch v-model:value="model.isDefault">
            <template #checked>是</template>
            <template #unchecked>否</template>
          </NSwitch>
        </NFormItem>
        <NFormItem label="启用">
          <NSwitch
            v-model:value="model.is_enabled"
            :checked-value="1"
            :unchecked-value="0"
          >
            <template #checked>启用</template>
            <template #unchecked>禁用</template>
          </NSwitch>
        </NFormItem>
        <NFormItem label="备注">
          <NInput
            v-model:value="model.remark"
            type="textarea"
            :autosize="{ minRows: 3, maxRows: 5 }"
            placeholder="选填"
          />
        </NFormItem>
      </NForm>
      <template #footer>
        <NSpace justify="end">
          <NButton @click="emit('update:open', false)" :disabled="submitting">
            取消
          </NButton>
          <NButton type="primary" :loading="submitting" @click="handleSave">
            保存
          </NButton>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>
