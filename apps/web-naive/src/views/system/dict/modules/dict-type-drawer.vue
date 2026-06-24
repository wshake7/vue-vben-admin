<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import { useMessage } from 'naive-ui';

import {
  createDictTypeApi,
  updateDictTypeApi,
  type CreateDictTypeBody,
  type DictType,
} from '#/api/system/dict-type';

import { CODE_PATTERN } from './shared';

interface Props {
  open: boolean;
  row: DictType | null;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'update:open', value: boolean): void;
  (e: 'saved'): void;
}>();

const message = useMessage();

const model = ref<{
  code: string;
  name: string;
  remark: string;
  is_enabled: 0 | 1;
}>({
  code: '',
  name: '',
  remark: '',
  is_enabled: 1,
});

const submitting = ref(false);
const isEdit = computed(() => !!props.row);

function fillForm() {
  if (props.row) {
    model.value = {
      code: props.row.code,
      name: props.row.name,
      remark: props.row.remark ?? '',
      is_enabled: props.row.is_enabled,
    };
  } else {
    model.value = { code: '', name: '', remark: '', is_enabled: 1 };
  }
}

watch(
  () => props.open,
  (val) => {
    if (val) fillForm();
  },
);

async function handleSave() {
  if (!model.value.code.trim() || !CODE_PATTERN.test(model.value.code)) {
    message.error('类型编码必须以小写字母开头，仅含字母数字下划线');
    return;
  }
  if (!model.value.name.trim()) {
    message.error('类型名称不能为空');
    return;
  }
  submitting.value = true;
  try {
    if (isEdit.value) {
      await updateDictTypeApi(props.row!.id, {
        name: model.value.name,
        remark: model.value.remark,
        is_enabled: model.value.is_enabled,
      });
      message.success('保存成功');
    } else {
      const body: CreateDictTypeBody = {
        code: model.value.code,
        name: model.value.name,
        remark: model.value.remark,
        is_enabled: model.value.is_enabled,
      };
      await createDictTypeApi(body);
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
    <NDrawerContent :title="isEdit ? '编辑字典类型' : '新建字典类型'" closable>
      <NForm label-placement="top">
        <NFormItem label="类型编码">
          <NInput
            v-model:value="model.code"
            placeholder="例如 sys_user_sex"
            :disabled="isEdit"
          />
        </NFormItem>
        <NFormItem label="类型名称">
          <NInput
            v-model:value="model.name"
            placeholder="例如 用户性别"
            :disabled="isEdit"
          />
        </NFormItem>
        <NFormItem label="备注">
          <NInput
            v-model:value="model.remark"
            type="textarea"
            :autosize="{ minRows: 3, maxRows: 5 }"
            placeholder="选填"
          />
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
