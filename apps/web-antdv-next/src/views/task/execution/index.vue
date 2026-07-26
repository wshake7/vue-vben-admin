<script lang="ts" setup>
import type { TaskExecution } from '#/api/system/task-execution';

import { onMounted, ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import { Button, Tag } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { fetchTaskConfigListApi } from '#/api/system/task-config';
import { fetchTaskExecutionListApi } from '#/api/system/task-execution';
import {
  executionStatusLabel,
  formatDuration,
  STATUS_TAG_COLOR,
  useExecutionColumns,
  useExecutionSearchSchema,
} from '#/views/task/execution/data';
import ExecutionDetail from '#/views/task/execution/modules/detail.vue';

defineOptions({ name: 'TaskExecutionPanel' });

const configOptions = ref<Array<{ label: string; value: number }>>([]);

const [DetailDrawer, detailDrawerApi] = useVbenDrawer({
  connectedComponent: ExecutionDetail,
  destroyOnClose: true,
});

function openDetail(row: TaskExecution) {
  detailDrawerApi.setData({ row }).open();
}

function hasFailure(row: TaskExecution) {
  return (
    Boolean(row.failureReason) ||
    row.status === 'FAILED' ||
    row.status === 'TIMED_OUT' ||
    row.status === 'TERMINATED'
  );
}

const [Grid, gridApi] = useVbenVxeGrid<TaskExecution>({
  formOptions: {
    collapsed: false,
    schema: useExecutionSearchSchema(),
    showCollapseButton: false,
  },
  gridOptions: {
    columns: useExecutionColumns(),
    keepSource: true,
    rowConfig: { isHover: true },
    size: 'small',
    stripe: true,
    toolbarConfig: {
      custom: true,
      refresh: true,
      zoom: true,
    },
    proxyConfig: {
      ajax: {
        query: async (
          { page }: { page: { currentPage: number; pageSize: number } },
          formValues: Record<string, any>,
        ) => {
          const range = formValues.startedAtRange as
            | [unknown, unknown]
            | undefined;
          const startedAtFrom =
            range?.[0] === undefined || range[0] === null
              ? undefined
              : String(range[0]);
          const startedAtTo =
            range?.[1] === undefined || range[1] === null
              ? undefined
              : String(range[1]);
          const rawConfigId = formValues.configId;
          const configId =
            rawConfigId === undefined ||
            rawConfigId === null ||
            rawConfigId === ''
              ? undefined
              : Number(rawConfigId);
          return await fetchTaskExecutionListApi({
            page: page.currentPage,
            pageSize: page.pageSize,
            configId,
            status: formValues.status || undefined,
            startedAtFrom,
            startedAtTo,
          });
        },
      },
    },
  } as never,
});

onMounted(async () => {
  try {
    const res = await fetchTaskConfigListApi({ page: 1, pageSize: 200 });
    configOptions.value = res.items.map((c) => ({
      label: `${c.name}（${c.code}）`,
      value: c.id,
    }));
    // 局部更新 configId 下拉 options（schema 在 grid 初始化时已固化）
    gridApi.formApi?.updateSchema?.([
      {
        fieldName: 'configId',
        componentProps: {
          options: configOptions.value,
          allowClear: true,
          showSearch: true,
          optionFilterProp: 'label',
        },
      },
    ]);
  } catch {
    // 下拉失败不影响列表
  }
});
</script>

<template>
  <div>
    <Grid :table-title="$t('task.execution.title')">
      <template #configName="{ row }">
        {{ row.configName || $t('task.execution.unknownConfig') }}
      </template>
      <template #status="{ row }">
        <Tag :color="STATUS_TAG_COLOR[row.status] ?? 'default'">
          {{ executionStatusLabel(row.status) }}
        </Tag>
      </template>
      <template #duration="{ row }">
        {{ formatDuration(row.startedAt, row.closedAt) }}
      </template>
      <template #failure="{ row }">
        <Button
          v-if="hasFailure(row)"
          type="link"
          size="small"
          @click="openDetail(row)"
        >
          {{ $t('task.execution.viewFailure') }}
        </Button>
        <span v-else style="color: var(--ant-color-text-secondary)">—</span>
      </template>
    </Grid>
    <DetailDrawer />
  </div>
</template>
