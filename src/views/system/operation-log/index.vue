<!-- 操作日志页面 -->
<template>
  <div class="operation-log-page art-full-height">
    <ElCard class="art-table-card" shadow="never">
      <!-- 搜索栏 -->
      <ElForm :model="searchForm" inline>
        <ElFormItem label="用户ID">
          <ElInput v-model="searchForm.user_id" placeholder="请输入用户ID" clearable />
        </ElFormItem>
        <ElFormItem label="模块">
          <ElInput v-model="searchForm.module" placeholder="请输入模块名称" clearable />
        </ElFormItem>
        <ElFormItem label="开始日期">
          <ElDatePicker v-model="searchForm.start_date" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" />
        </ElFormItem>
        <ElFormItem label="结束日期">
          <ElDatePicker v-model="searchForm.end_date" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" />
        </ElFormItem>
        <ElFormItem>
          <ElButton type="primary" @click="handleSearch">查询</ElButton>
          <ElButton @click="resetSearch">重置</ElButton>
        </ElFormItem>
      </ElForm>

      <!-- 表格 -->
      <ArtTable
        :loading="loading"
        :data="data"
        :columns="columns"
        :pagination="pagination"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      />
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, h } from 'vue'
  import { useTable } from '@/hooks/core/useTable'
  import request from '@/utils/http'
  import { ElTag } from 'element-plus'

  defineOptions({ name: 'OperationLog' })

  const searchForm = ref({
    user_id: undefined,
    module: undefined,
    start_date: undefined,
    end_date: undefined
  })

  const columns = [
    { prop: 'id', label: 'ID', width: 80 },
    { prop: 'username', label: '用户名', width: 120 },
    { prop: 'method', label: '请求方法', width: 100, formatter: (row: any) => h(ElTag, { type: row.method === 'POST' ? 'success' : row.method === 'DELETE' ? 'danger' : 'warning' }, () => row.method) },
    { prop: 'path', label: '请求路径', minWidth: 200 },
    { prop: 'module', label: '模块', width: 120 },
    { prop: 'description', label: '操作描述', width: 150 },
    { prop: 'ip', label: 'IP地址', width: 140 },
    { prop: 'status', label: '状态码', width: 100, formatter: (row: any) => h(ElTag, { type: row.status === 200 ? 'success' : 'danger' }, () => row.status) },
    { prop: 'created_at', label: '操作时间', width: 180 }
  ]

  const fetchData = (params: any) => {
    return request.get({
      url: '/api/system/operation-logs',
      params
    })
  }

  const { data, loading, pagination, handleSizeChange, handleCurrentChange, refreshData } = useTable({
    core: {
      apiFn: fetchData,
      apiParams: {
        current: 1,
        size: 20,
        ...searchForm.value
      }
    },
    columnsFactory: () => columns
  })

  const handleSearch = () => {
    refreshData()
  }

  const resetSearch = () => {
    searchForm.value = {
      user_id: undefined,
      module: undefined,
      start_date: undefined,
      end_date: undefined
    }
    refreshData()
  }

  onMounted(() => {
    refreshData()
  })
</script>
