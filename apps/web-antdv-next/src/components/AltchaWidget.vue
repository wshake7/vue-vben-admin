<script lang="ts" setup>
/**
 * ALTCHA PoW widget 的 Vue 薄封装。
 *
 * `<altcha-widget>` 是 altcha 包注册的 Web Component。为避免 Vue 模板编译器
 * 对自定义元素产生告警（共享 vite-config 未暴露 isCustomElement 注入点），
 * 这里在 onMounted 用 document.createElement 挂载，纯 DOM 交互。
 *
 * 用法（VbenForm schema 自定义控件）：
 *   component: markRaw(AltchaWidget),
 *   componentProps: { challenge: '/api/altcha/challenge' },
 *   rules: z.string().min(1, ...)
 */
import { onBeforeUnmount, onMounted, ref } from 'vue';

interface Props {
  challenge?: string;
  language?: string;
  /** 受控值（Base64 payload），由 VbenForm model 注入 */
  modelValue?: string;
}

const props = withDefaults(defineProps<Props>(), {
  challenge: '/api/altcha/challenge',
  language: 'zh',
  modelValue: '',
});
const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const host = ref<HTMLDivElement>();
let widget: HTMLElement | null = null;

type AltchaState =
  | 'code'
  | 'error'
  | 'expired'
  | 'unverified'
  | 'verified'
  | 'verifying';

function onStateChange(ev: Event) {
  const detail = (ev as CustomEvent<{ payload?: string; state: AltchaState }>)
    .detail;
  // widget 在 verified 时会把 Base64 payload 写入内部隐藏 input；从 DOM 取最稳
  const payload =
    detail?.payload ??
    (widget?.querySelector('input[type="hidden"]') as HTMLInputElement | null)
      ?.value ??
    '';
  if (detail?.state === 'verified' && payload) {
    emit('update:modelValue', payload);
  } else if (detail?.state !== 'verified' && props.modelValue !== '') {
    // 重新校验或失败时清空，防止提交旧 payload
    emit('update:modelValue', '');
  }
}

onMounted(() => {
  const el = host.value;
  if (!el) return;
  widget = document.createElement('altcha-widget');
  widget.setAttribute('language', props.language);
  widget.setAttribute('challenge', props.challenge);
  widget.addEventListener('statechange', onStateChange);
  el.append(widget);
});

onBeforeUnmount(() => {
  if (widget) {
    widget.removeEventListener('statechange', onStateChange);
    widget.remove();
    widget = null;
  }
});
</script>

<template>
  <div ref="host" class="altcha-widget-host"></div>
</template>

<style scoped>
.altcha-widget-host {
  width: 100%;
}

.altcha-widget-host :deep(altcha-widget) {
  display: block;
  width: 100%;
}
</style>
