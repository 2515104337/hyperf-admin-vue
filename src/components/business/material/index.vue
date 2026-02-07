<template>
  <div class="material-select">
    <div class="selected-list" v-if="modelValue.length > 0">
      <div
        v-for="(item, index) in modelValue"
        :key="index"
        class="selected-item"
      >
        <el-image
          v-if="type === FileType.IMAGE"
          :src="item"
          fit="cover"
          :preview-src-list="[item]"
          preview-teleported
        />
        <div v-else class="file-placeholder">
          <el-icon size="24"><VideoPlay v-if="type === FileType.VIDEO" /><Document v-else /></el-icon>
        </div>
        <div class="item-actions">
          <el-icon class="action-btn" @click="handleRemove(index)"><Close /></el-icon>
        </div>
      </div>
      <div
        v-if="!limit || modelValue.length < limit"
        class="add-btn"
        @click="handleOpen"
      >
        <el-icon size="24"><Plus /></el-icon>
      </div>
    </div>
    <div v-else class="add-btn" @click="handleOpen">
      <el-icon size="24"><Plus /></el-icon>
      <span>选择{{ typeName }}</span>
    </div>

    <!-- 选择弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="`选择${typeName}`"
      width="900px"
      destroy-on-close
      append-to-body
    >
      <div class="material-dialog-content">
        <!-- 左侧分类 -->
        <div class="dialog-sidebar">
          <div
            class="cate-item"
            :class="{ active: currentCid === 0 }"
            @click="handleCateClick(0)"
          >
            全部
          </div>
          <div
            v-for="cate in flatCateList"
            :key="cate.id"
            class="cate-item"
            :class="{ active: currentCid === cate.id }"
            @click="handleCateClick(cate.id)"
          >
            {{ cate.depth > 0 ? `${'—'.repeat(cate.depth)} ${cate.name}` : cate.name }}
          </div>
        </div>

        <!-- 右侧文件列表 -->
        <div class="dialog-main">
          <div class="dialog-toolbar">
            <el-upload
              :action="uploadUrl"
              :headers="uploadHeaders"
              :data="{ cid: currentCid }"
              :show-file-list="false"
              :accept="acceptTypes"
              :before-upload="beforeUpload"
              :on-success="handleUploadSuccess"
              :on-error="handleUploadError"
              multiple
            >
              <el-button type="primary" size="small">
                <el-icon><Upload /></el-icon>
                上传
              </el-button>
            </el-upload>
          </div>

          <div class="dialog-file-list" v-loading="loading">
            <template v-if="fileList.length > 0">
              <div
                v-for="file in fileList"
                :key="file.id"
                class="dialog-file-item"
                :class="{ selected: tempSelected.includes(file.url) }"
                @click="toggleSelect(file)"
              >
                <div class="file-preview">
                  <el-image
                    v-if="type === FileType.IMAGE"
                    :src="file.url"
                    fit="cover"
                  />
                  <div v-else class="file-placeholder">
                    <el-icon size="32"><VideoPlay v-if="type === FileType.VIDEO" /><Document v-else /></el-icon>
                  </div>
                  <div class="select-mask" v-if="tempSelected.includes(file.url)">
                    <el-icon size="20"><Check /></el-icon>
                  </div>
                </div>
                <div class="file-name">{{ file.name }}</div>
              </div>
            </template>
            <el-empty v-else description="暂无文件" />
          </div>

          <div class="dialog-pagination" v-if="total > 0">
            <el-pagination
              v-model:current-page="page"
              :total="total"
              :page-size="pageSize"
              layout="prev, pager, next"
              small
              @current-change="getFileList"
            />
          </div>
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer-info">已选择 {{ tempSelected.length }} 项</span>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirm">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Close, Upload, VideoPlay, Document, Check } from '@element-plus/icons-vue'
import { useUserStore } from '@/store/modules/user'
import {
  FileType,
  FileCate,
  FileInfo,
  fetchFileCateList,
  fetchFileList,
  getUploadImageUrl,
  getUploadVideoUrl,
  getUploadFileUrl
} from '@/api/file'

interface Props {
  modelValue: string[]
  type?: FileType
  limit?: number
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => [],
  type: FileType.IMAGE,
  limit: 0
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void
}>()

const userStore = useUserStore()

// 状态
const dialogVisible = ref(false)
const loading = ref(false)
const cateList = ref<FileCate[]>([])

const flatCateList = computed(() => {
  const result: Array<FileCate & { depth: number }> = []
  const walk = (nodes: FileCate[], depth: number) => {
    nodes.forEach((n) => {
      result.push({ ...(n as any), depth })
      if (Array.isArray(n.children) && n.children.length) {
        walk(n.children, depth + 1)
      }
    })
  }
  walk(cateList.value || [], 0)
  return result
})

const fileList = ref<FileInfo[]>([])
const currentCid = ref(0)
const tempSelected = ref<string[]>([])
const page = ref(1)
const pageSize = ref(18)
const total = ref(0)

// 计算属性
const typeName = computed(() => {
  const map = {
    [FileType.IMAGE]: '图片',
    [FileType.VIDEO]: '视频',
    [FileType.FILE]: '文件'
  }
  return map[props.type]
})

const uploadUrl = computed(() => {
  const map = {
    [FileType.IMAGE]: getUploadImageUrl(),
    [FileType.VIDEO]: getUploadVideoUrl(),
    [FileType.FILE]: getUploadFileUrl()
  }
  // 直接返回相对路径，让 Vite 代理处理
  return map[props.type]
})

const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${userStore.accessToken}`
}))

const acceptTypes = computed(() => {
  const map = {
    [FileType.IMAGE]: 'image/*',
    [FileType.VIDEO]: 'video/*',
    [FileType.FILE]: '*'
  }
  return map[props.type]
})

// 打开弹窗
const handleOpen = async () => {
  dialogVisible.value = true
  tempSelected.value = [...props.modelValue]
  currentCid.value = 0
  page.value = 1
  await Promise.all([getCateList(), getFileList()])
}

// 获取分类列表
const getCateList = async () => {
  try {
    cateList.value = await fetchFileCateList(props.type)
  } catch (e) {
    console.error(e)
  }
}

// 获取文件列表
const getFileList = async () => {
  loading.value = true
  try {
    const res = await fetchFileList({
      page: page.value,
      page_size: pageSize.value,
      cid: currentCid.value || undefined,
      type: props.type
    })
    fileList.value = res.records
    total.value = res.total
  } finally {
    loading.value = false
  }
}

// 分类点击
const handleCateClick = (cid: number) => {
  currentCid.value = cid
  page.value = 1
  getFileList()
}

// 选择文件
const toggleSelect = (file: FileInfo) => {
  const index = tempSelected.value.indexOf(file.url)
  if (index > -1) {
    tempSelected.value.splice(index, 1)
  } else {
    if (props.limit && tempSelected.value.length >= props.limit) {
      ElMessage.warning(`最多只能选择 ${props.limit} 个文件`)
      return
    }
    tempSelected.value.push(file.url)
  }
}

// 上传前校验
const beforeUpload = (file: File) => {
  const maxSize = props.type === FileType.VIDEO ? 100 : 10
  if (file.size / 1024 / 1024 > maxSize) {
    ElMessage.error(`文件大小不能超过 ${maxSize}MB`)
    return false
  }
  return true
}

// 上传成功
const handleUploadSuccess = () => {
  ElMessage.success('上传成功')
  getFileList()
}

// 上传失败
const handleUploadError = () => {
  ElMessage.error('上传失败')
}

// 确认选择
const handleConfirm = () => {
  emit('update:modelValue', [...tempSelected.value])
  dialogVisible.value = false
}

// 移除已选
const handleRemove = (index: number) => {
  const newValue = [...props.modelValue]
  newValue.splice(index, 1)
  emit('update:modelValue', newValue)
}
</script>

<style scoped lang="scss">
.material-select {
  .selected-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;

    .selected-item {
      position: relative;
      width: 100px;
      height: 100px;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid var(--el-border-color);

      :deep(.el-image) {
        width: 100%;
        height: 100%;
      }

      .file-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--el-fill-color-light);
        color: var(--el-text-color-secondary);
      }

      .item-actions {
        position: absolute;
        top: 0;
        right: 0;
        padding: 4px;
        opacity: 0;
        transition: opacity 0.2s;

        .action-btn {
          cursor: pointer;
          padding: 4px;
          background: rgba(0, 0, 0, 0.5);
          color: #fff;
          border-radius: 4px;

          &:hover {
            background: rgba(0, 0, 0, 0.7);
          }
        }
      }

      &:hover .item-actions {
        opacity: 1;
      }
    }
  }

  .add-btn {
    width: 100px;
    height: 100px;
    border: 1px dashed var(--el-border-color);
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    cursor: pointer;
    color: var(--el-text-color-secondary);
    transition: all 0.2s;

    &:hover {
      border-color: var(--el-color-primary);
      color: var(--el-color-primary);
    }
  }
}

.material-dialog-content {
  display: flex;
  height: 500px;

  .dialog-sidebar {
    width: 150px;
    flex-shrink: 0;
    border-right: 1px solid var(--el-border-color-light);
    padding-right: 16px;
    overflow-y: auto;

    .cate-item {
      padding: 8px 12px;
      cursor: pointer;
      border-radius: 4px;
      margin-bottom: 4px;
      transition: all 0.2s;

      &:hover {
        background: var(--el-fill-color-light);
      }

      &.active {
        background: var(--el-color-primary-light-9);
        color: var(--el-color-primary);
      }
    }
  }

  .dialog-main {
    flex: 1;
    padding-left: 16px;
    display: flex;
    flex-direction: column;
    min-width: 0;

    .dialog-toolbar {
      margin-bottom: 16px;
    }

    .dialog-file-list {
      flex: 1;
      overflow-y: auto;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: 12px;
      align-content: start;

      .dialog-file-item {
        cursor: pointer;
        border-radius: 8px;
        overflow: hidden;
        border: 2px solid transparent;
        transition: all 0.2s;

        &:hover {
          border-color: var(--el-color-primary-light-5);
        }

        &.selected {
          border-color: var(--el-color-primary);
        }

        .file-preview {
          position: relative;
          width: 100%;
          padding-top: 100%;
          background: var(--el-fill-color-light);

          :deep(.el-image) {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
          }

          .file-placeholder {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--el-text-color-secondary);
          }

          .select-mask {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(var(--el-color-primary-rgb), 0.3);
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--el-color-primary);
          }
        }

        .file-name {
          padding: 6px 8px;
          font-size: 12px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
    }

    .dialog-pagination {
      margin-top: 16px;
      display: flex;
      justify-content: center;
    }
  }
}

.dialog-footer-info {
  float: left;
  color: var(--el-text-color-secondary);
  line-height: 32px;
}
</style>
