<template>
  <div class="storage-page">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>存储设置</span>
        </div>
      </template>
      <el-table :data="storageList" v-loading="loading" style="width: 100%">
        <el-table-column prop="name" label="存储方式" min-width="150" />
        <el-table-column prop="desc" label="描述" min-width="250" />
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '已启用' : '未启用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">配置</el-button>
            <el-button v-if="row.status !== 1" type="success" link @click="handleChange(row)">
              启用
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 配置弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="`${currentEngine?.name || ''}配置`"
      width="600px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="120px"
        v-loading="detailLoading"
      >
        <el-form-item v-if="currentEngine?.key === 'local'" label="提示">
          <el-alert type="info" :closable="false" show-icon>
            本地存储默认保存到服务器本地目录（public/uploads）。如需生成完整访问 URL，可配置访问域名。
          </el-alert>
        </el-form-item>

        <template v-for="field in engineFields" :key="field.key">
          <el-form-item :label="field.name" :prop="field.key">
            <el-input
              v-model="formData[field.key]"
              :type="field.type === 'password' ? 'password' : 'text'"
              :show-password="field.type === 'password'"
              :placeholder="field.placeholder || `请输入${field.name}`"
              autocomplete="off"
            />
          </el-form-item>
        </template>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, onMounted } from 'vue'
  import { ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
  import {
    fetchStorageList,
    fetchStorageDetail,
    fetchStorageSetup,
    fetchStorageChange,
    type StorageEngine,
    type StorageField
  } from '@/api/storage'

  const loading = ref(false)
  const detailLoading = ref(false)
  const submitLoading = ref(false)
  const dialogVisible = ref(false)

  const storageList = ref<StorageEngine[]>([])
  const currentEngine = ref<StorageEngine | null>(null)

  const formRef = ref<FormInstance>()
  const formData = reactive<Record<string, any>>({})
  const formRules = reactive<FormRules>({})
  const engineFields = ref<StorageField[]>([])

  // 获取存储引擎列表
  const getStorageList = async () => {
    loading.value = true
    try {
      storageList.value = await fetchStorageList()
    } finally {
      loading.value = false
    }
  }

  const isOptionalField = (field: StorageField) => {
    const name = field.name || ''
    const placeholder = field.placeholder || ''
    return name.includes('可选') || placeholder.includes('可选')
  }

  const rebuildRules = (fields: StorageField[]) => {
    // 清空旧 rules
    Object.keys(formRules).forEach((k) => delete (formRules as any)[k])

    fields.forEach((f) => {
      if (isOptionalField(f)) return
      ;(formRules as any)[f.key] = [{ required: true, message: `请输入${f.name}`, trigger: 'blur' }]
    })
  }

  const loadEngineDetail = async (engineKey: string) => {
    detailLoading.value = true
    try {
      const detail = await fetchStorageDetail(engineKey)
      engineFields.value = detail.fields || []

      // 重置表单数据
      Object.keys(formData).forEach((k) => delete formData[k])
      engineFields.value.forEach((f) => {
        formData[f.key] = f.value ?? ''
      })

      rebuildRules(engineFields.value)
    } finally {
      detailLoading.value = false
    }
  }

  // 编辑配置
  const handleEdit = async (row: StorageEngine) => {
    currentEngine.value = row
    dialogVisible.value = true
    await loadEngineDetail(row.key)
  }

  // 提交配置
  const handleSubmit = async () => {
    if (!currentEngine.value) return

    if (engineFields.value.length) {
      await formRef.value?.validate()
    }

    submitLoading.value = true
    try {
      await fetchStorageSetup({
        engine: currentEngine.value.key,
        config: { ...formData }
      })

      dialogVisible.value = false
      getStorageList()
    } finally {
      submitLoading.value = false
    }
  }

  // 切换存储引擎
  const handleChange = async (row: StorageEngine) => {
    await ElMessageBox.confirm(`确定要启用"${row.name}"作为默认存储方式吗？`, '提示', {
      type: 'warning'
    })

    loading.value = true
    try {
      await fetchStorageChange(row.key)
      getStorageList()
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    getStorageList()
  })
</script>
