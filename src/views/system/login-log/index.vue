<!-- 登录日志页面 -->
<template>
  <div class="login-log-page art-full-height">
    <ElCard class="art-table-card" shadow="never">
      <!-- 搜索栏 -->
      <ElForm :model="searchForm" inline>
        <ElFormItem label="用户ID">
          <ElInput v-model="searchForm.user_id" placeholder="请输入用户ID" clearable />
        </ElFormItem>
        <ElFormItem label="状态">
          <ElSelect v-model="searchForm.status" placeholder="请选择状态" clearable>
            <ElOption label="成功" value="success" />
            <ElOption label="失败" value="failed" />
          </ElSelect>
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

  defineOptions({ name: 'LoginLog' })

  const searchForm = ref({
    user_id: undefined,
    status: undefined,
    start_date: undefined,
    end_date: undefined
  })

  const columns = [
    { prop: 'id', label: 'ID', width: 80 },
    { prop: 'username', label: '用户名', width: 120 },
    { prop: 'action', label: '操作', width: 100, formatter: (row: any) => h(ElTag, { type: row.action === 'login' ? 'primary' : 'info' }, () => row.action === 'login' ? '登录' : '登出') },
    { prop: 'status', label: '状态', width: 100, formatter: (row: any) => h(ElTag, { type: row.status === 'success' ? 'success' : 'danger' }, () => row.status === 'success' ? '成功' : '失败') },
    { prop: 'failure_reason', label: '失败原因', width: 150 },
    { prop: 'ip', label: 'IP地址', width: 140 },
    { prop: 'browser', label: '浏览器', width: 120 },
    { prop: 'os', label: '操作系统', width: 120 },
    { prop: 'created_at', label: '登录时间', width: 180 }
  ]

  const fetchData = (params: any) => {
    return request.get({
      url: '/api/system/login-logs',
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
      status: undefined,
      start_date: undefined,
      end_date: undefined
    }
    refreshData()
  }

  onMounted(() => {
    refreshData()
  })
</script>
