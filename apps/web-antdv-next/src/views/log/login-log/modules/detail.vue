<script lang="ts" setup>
import type { LoginLogListItem } from '#/api/system/login-log';

import { ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';
import { formatDateTime } from '@vben/utils';

import { Descriptions, DescriptionsItem, Tag } from 'antdv-next';

const row = ref<LoginLogListItem | null>(null);

const [Drawer, drawerApi] = useVbenDrawer({
  footer: false,
  header: true,
  title: '登录日志详情',
  onOpenChange(isOpen: boolean) {
    if (!isOpen) {
      row.value = null;
      return;
    }
    const data = drawerApi.getData<{ row?: LoginLogListItem }>();
    row.value = data?.row ?? null;
  },
});

function dash(v: null | number | string | undefined) {
  if (v === null || v === undefined || v === '') return '-';
  return String(v);
}
</script>

<template>
  <Drawer class="w-[560px]">
    <Descriptions v-if="row" :column="1" bordered size="small">
      <DescriptionsItem label="ID">{{ row.id }}</DescriptionsItem>
      <DescriptionsItem label="用户名">
        {{ row.username || '-' }}
      </DescriptionsItem>
      <DescriptionsItem label="结果">
        <Tag :color="row.success === 1 ? 'success' : 'error'">
          {{ row.success === 1 ? '成功' : '失败' }}
        </Tag>
      </DescriptionsItem>
      <DescriptionsItem label="失败原因">
        {{ dash(row.reason) }}
      </DescriptionsItem>
      <DescriptionsItem label="状态码">
        {{ dash(row.statusCode) }}
      </DescriptionsItem>
      <DescriptionsItem label="用户 ID">
        {{ dash(row.sysUserId) }}
      </DescriptionsItem>
      <DescriptionsItem label="登录方式">
        {{ dash(row.loginMethod) }}
      </DescriptionsItem>
      <DescriptionsItem label="登录时间">
        {{ formatDateTime(row.loginTime) || '-' }}
      </DescriptionsItem>
      <DescriptionsItem label="登录 IP">
        {{ dash(row.loginIp) }}
      </DescriptionsItem>
      <DescriptionsItem label="MAC">
        {{ dash(row.loginMac) }}
      </DescriptionsItem>
      <DescriptionsItem label="客户端 ID">
        {{ dash(row.clientId) }}
      </DescriptionsItem>
      <DescriptionsItem label="客户端名">
        {{ dash(row.clientName) }}
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
        {{ formatDateTime(row.archivedAt) }}
      </DescriptionsItem>
    </Descriptions>
  </Drawer>
</template>
