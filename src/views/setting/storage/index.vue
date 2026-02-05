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
        <el-table-column prop="describe" label="描述" min-width="250" />
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
            <el-button
              v-if="row.status !== 1"
              type="success"
              link
              @click="handleChange(row)"
            >
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
        <!-- 本地存储 -->
        <template v-if="currentEngine?.engine === 'local'">
          <el-form-item label="提示">
            <el-alert type="info" :closable="false" show-icon>
              本地存储无需额外配置，文件将保存在服务器本地目录
            </el-alert>
          </el-form-item>
        </template>

        <!-- 阿里云OSS -->
        <template v-if="currentEngine?.engine === 'aliyun'">
          <el-form-item label="Bucket" prop="bucket">
            <el-input v-model="formData.bucket" placeholder="请输入Bucket名称" />
          </el-form-item>
          <el-form-item label="AccessKey ID" prop="access_key">
            <el-input v-model="formData.access_key" placeholder="请输入AccessKey ID" />
          </el-form-item>
          <el-form-item label="AccessKey Secret" prop="secret_key">
            <el-input
              v-model="formData.secret_key"
              type="password"
              show-password
              placeholder="请输入AccessKey Secret"
            />
          </el-form-item>
          <el-form-item label="Endpoint" prop="domain">
            <el-input v-model="formData.domain" placeholder="如：oss-cn-hangzhou.aliyuncs.com" />
          </el-form-item>
        </template>

        <!-- 七牛云 -->
        <template v-if="currentEngine?.engine === 'qiniu'">
          <el-form-item label="Bucket" prop="bucket">
            <el-input v-model="formData.bucket" placeholder="请输入Bucket名称" />
          </el-form-item>
          <el-form-item label="AccessKey" prop="access_key">
            <el-input v-model="formData.access_key" placeholder="请输入AccessKey" />
          </el-form-item>
          <el-form-item label="SecretKey" prop="secret_key">
            <el-input
              v-model="formData.secret_key"
              type="password"
              show-password
              placeholder="请输入SecretKey"
            />
          </el-form-item>
          <el-form-item label="访问域名" prop="domain">
            <el-input v-model="formData.domain" placeholder="请输入访问域名（含http://或https://）" />
          </el-form-item>
        </template>

        <!-- 腾讯云COS -->
        <template v-if="currentEngine?.engine === 'qcloud'">
          <el-form-item label="Bucket" prop="bucket">
            <el-input v-model="formData.bucket" placeholder="请输入Bucket名称" />
          </el-form-item>
          <el-form-item label="Region" prop="region">
            <el-input v-model="formData.region" placeholder="如：ap-guangzhou" />
          </el-form-item>
          <el-form-item label="SecretId" prop="access_key">
            <el-input v-model="formData.access_key" placeholder="请输入SecretId" />
          </el-form-item>
          <el-form-item label="SecretKey" prop="secret_key">
            <el-input
              v-model="formData.secret_key"
              type="password"
              show-password
              placeholder="请输入SecretKey"
            />
          </el-form-item>
          <el-form-item label="访问域名" prop="domain">
            <el-input v-model="formData.domain" placeholder="请输入访问域名（含http://或https://）" />
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="handleSubmit">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'
import {
  fetchStorageList,
  fetchStorageDetail,
  fetchStorageSetup,
  fetchStorageChange,
  StorageEngine
} from '@/api/storage'

const loading = ref(false)
const detailLoading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const storageList = ref<StorageEngine[]>([])
const currentEngine = ref<StorageEngine | null>(null)
const formRef = ref<FormInstance>()

const formData = reactive({
  bucket: '',
  access_key: '',
  secret_key: '',
  domain: '',
  region: ''
})

const formRules: FormRules = {
  bucket: [{ required: true, message: '请输入Bucket名称', trigger: 'blur' }],
  access_key: [{ required: true, message: '请输入AccessKey', trigger: 'blur' }],
  secret_key: [{ required: true, message: '请输入SecretKey', trigger: 'blur' }],
  domain: [{ required: true, message: '请输入域名', trigger: 'blur' }]
}

// 获取存储引擎列表
const getStorageList = async () => {
  loading.value = true
  try {
    storageList.value = await fetchStorageList()
  } finally {
    loading.value = false
  }
}

// 编辑配置
const handleEdit = async (row: StorageEngine) => {
  currentEngine.value = row
  dialogVisible.value = true

  // 重置表单
  Object.assign(formData, {
    bucket: '',
    access_key: '',
    secret_key: '',
    domain: '',
    region: ''
  })

  if (row.engine !== 'local') {
    detailLoading.value = true
    try {
      const detail = await fetchStorageDetail(row.engine)
      if (detail.config) {
        Object.assign(formData, detail.config)
      }
    } finally {
      detailLoading.value = false
    }
  }
}

// 提交配置
const handleSubmit = async () => {
  if (!currentEngine.value) return

  if (currentEngine.value.engine !== 'local') {
    await formRef.value?.validate()
  }

  submitLoading.value = true
  try {
    await fetchStorageSetup({
      engine: currentEngine.value.engine,
      config: currentEngine.value.engine === 'local' ? {} : { ...formData }
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
    await fetchStorageChange(row.engine)
    getStorageList()
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  getStorageList()
})
</script>

<style scoped lang="scss">
.storage-page {
  padding: 20px;

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}
</style>
