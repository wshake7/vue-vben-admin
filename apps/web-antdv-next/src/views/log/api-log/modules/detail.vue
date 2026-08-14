<script lang="ts" setup>
import type { ApiLogListItem } from '#/api/system/api-log';

import { ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import { Descriptions, DescriptionsItem, Tag } from 'antdv-next';

const row = ref<ApiLogListItem | null>(null);

const [Drawer, drawerApi] = useVbenDrawer({
  footer: false,
  header: true,
  title: 'API 日志详情',
  onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      row.value = null;
      return;
    }
    const data = drawerApi.getData<{ row?: ApiLogListItem }>();
    row.value = data?.row ?? null;
  },
});

function dash(v: null | number | string | undefined) {
  if (v === null || v === undefined || v === '') return '-';
  return String(v);
}

function methodColor(method: string) {
  const m = (method || '').toUpperCase();
  if (m === 'GET') return 'blue';
  if (m === 'POST') return 'green';
  if (m === 'PUT' || m === 'PATCH') return 'orange';
  if (m === 'DELETE') return 'red';
  return 'default';
}
</script>

<template>
  <Drawer class="w-[720px]">
    <Descriptions v-if="row" :column="1" bordered size="small">
      <DescriptionsItem label="ID">{{ row.id }}</DescriptionsItem>
      <DescriptionsItem label="方法">
        <Tag :color="methodColor(row.method)">{{ row.method }}</Tag>
      </DescriptionsItem>
      <DescriptionsItem label="模块">{{ dash(row.module) }}</DescriptionsItem>
      <DescriptionsItem label="路径">{{ dash(row.path) }}</DescriptionsItem>
      <DescriptionsItem label="状态码">
        {{ dash(row.statusCode) }}
      </DescriptionsItem>
      <DescriptionsItem label="结果">
        <Tag :color="row.success === 1 ? 'success' : 'error'">
          {{ row.success === 1 ? '成功' : '失败' }}
        </Tag>
      </DescriptionsItem>
      <DescriptionsItem label="失败原因">
        {{ dash(row.reason) }}
      </DescriptionsItem>
      <DescriptionsItem label="耗时(ms)">
        {{ dash(row.costTime) }}
      </DescriptionsItem>
      <DescriptionsItem label="请求 ID">
        <span class="break-all">{{ dash(row.requestId) }}</span>
      </DescriptionsItem>
      <DescriptionsItem label="用户 ID">
        {{ dash(row.sysUserId) }}
      </DescriptionsItem>
      <DescriptionsItem label="用户名">
        {{ dash(row.username) }}
      </DescriptionsItem>
      <DescriptionsItem label="完整 URI">
        <span class="break-all">{{ dash(row.requestUri) }}</span>
      </DescriptionsItem>
      <DescriptionsItem label="Query">
        <span class="break-all">{{ dash(row.requestQuery) }}</span>
      </DescriptionsItem>
      <DescriptionsItem label="请求头">
        <pre
          class="m-0 max-h-40 overflow-auto whitespace-pre-wrap break-all text-xs"
          >{{ dash(row.requestHeader) }}</pre>
      </DescriptionsItem>
      <DescriptionsItem label="请求体">
        <pre
          class="m-0 max-h-40 overflow-auto whitespace-pre-wrap break-all text-xs"
          >{{ dash(row.requestBody) }}</pre>
      </DescriptionsItem>
      <DescriptionsItem label="响应">
        <pre
          class="m-0 max-h-40 overflow-auto whitespace-pre-wrap break-all text-xs"
          >{{ dash(row.response) }}</pre>
      </DescriptionsItem>
      <DescriptionsItem label="变更前">
        <pre
          class="m-0 max-h-32 overflow-auto whitespace-pre-wrap break-all text-xs"
          >{{ dash(row.beforeChange) }}</pre>
      </DescriptionsItem>
      <DescriptionsItem label="变更后">
        <pre
          class="m-0 max-h-32 overflow-auto whitespace-pre-wrap break-all text-xs"
          >{{ dash(row.afterChange) }}</pre>
      </DescriptionsItem>
      <DescriptionsItem label="变更摘要">
        {{ dash(row.formatChange) }}
      </DescriptionsItem>
      <DescriptionsItem label="Referer">
        <span class="break-all">{{ dash(row.referer) }}</span>
      </DescriptionsItem>
      <DescriptionsItem label="客户端 ID">
        {{ dash(row.clientId) }}
      </DescriptionsItem>
      <DescriptionsItem label="客户端名">
        {{ dash(row.clientName) }}
      </DescriptionsItem>
      <DescriptionsItem label="客户端 IP">
        {{ dash(row.clientIp) }}
      </DescriptionsItem>
      <DescriptionsItem label="浏览器">
        {{
          [row.browserName, row.browserVersion].filter(Boolean).join(' ') || '-'
        }}
      </DescriptionsItem>
      <DescriptionsItem label="操作系统">
        {{ [row.osName, row.osVersion].filter(Boolean).join(' ') || '-' }}
      </DescriptionsItem>
      <DescriptionsItem label="地理位置">
        {{ dash(row.location) }}
      </DescriptionsItem>
      <DescriptionsItem label="User-Agent">
        <span class="break-all">{{ dash(row.userAgent) }}</span>
      </DescriptionsItem>
      <DescriptionsItem label="创建时间">
        {{ formatDateTime(row.createdAt) || '-' }}
      </DescriptionsItem>
      <DescriptionsItem v-if="row.archivedAt" label="归档时间">
        {{ row.archivedAt }}
      </DescriptionsItem>
    </Descriptions>
  </Drawer>
</template>
