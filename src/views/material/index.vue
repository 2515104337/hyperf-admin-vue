<template>
  <div class="material-page">
    <el-tabs v-model="activeTab" @tab-change="handleTabChange">
      <el-tab-pane label="图片" :name="FileType.IMAGE" />
      <el-tab-pane label="视频" :name="FileType.VIDEO" />
      <el-tab-pane label="文件" :name="FileType.FILE" />
    </el-tabs>

    <div class="material-content">
      <!-- 左侧分类树 -->
      <div class="material-sidebar">
        <div class="sidebar-header">
          <span>分类管理</span>
          <el-button type="primary" link @click="handleAddCate(0)">
            <el-icon><Plus /></el-icon>
            新增
          </el-button>
        </div>
        <el-tree
          ref="treeRef"
          :data="cateList"
          :props="{ label: 'name', children: 'children' }"
          node-key="id"
          highlight-current
          default-expand-all
          @node-click="handleCateClick"
        >
          <template #default="{ node, data }">
            <div class="tree-node">
              <el-icon class="folder-icon"><Folder /></el-icon>
              <span class="node-label">{{ node.label }}</span>
              <span class="node-actions" @click.stop>
                <el-dropdown trigger="click">
                  <el-icon><MoreFilled /></el-icon>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item @click="handleAddCate(data.id)">新增子分类</el-dropdown-item>
                      <el-dropdown-item @click="handleEditCate(data)">编辑</el-dropdown-item>
                      <el-dropdown-item @click="handleDeleteCate(data)">删除</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </span>
            </div>
          </template>
        </el-tree>
      </div>

      <!-- 右侧文件列表 -->
      <div class="material-main">
        <!-- 工具栏 -->
        <div class="toolbar">
          <div class="toolbar-left">
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
              <el-button type="primary">
                <el-icon><Upload /></el-icon>
                上传{{ fileTypeName }}
              </el-button>
            </el-upload>
            <el-checkbox
              v-if="fileList.length > 0"
              v-model="isAllSelected"
              :indeterminate="isIndeterminate"
              @change="handleSelectAll"
            >
              当页全选
            </el-checkbox>
          </div>
          <div class="toolbar-right">
            <el-input
              v-model="searchName"
              placeholder="搜索文件名"
              clearable
              style="width: 200px"
              @keyup.enter="handleSearch"
              @clear="handleSearch"
            >
              <template #append>
                <el-button @click="handleSearch">
                  <el-icon><Search /></el-icon>
                </el-button>
              </template>
            </el-input>
            <div class="view-toggle">
              <el-tooltip content="网格视图" placement="top">
                <el-icon
                  :class="{ active: viewMode === 'grid' }"
                  @click="viewMode = 'grid'"
                ><Grid /></el-icon>
              </el-tooltip>
              <el-tooltip content="列表视图" placement="top">
                <el-icon
                  :class="{ active: viewMode === 'list' }"
                  @click="viewMode = 'list'"
                ><List /></el-icon>
              </el-tooltip>
            </div>
          </div>
        </div>

        <!-- 网格视图 -->
        <div v-if="viewMode === 'grid'" class="file-grid" v-loading="loading">
          <template v-if="fileList.length > 0">
            <div
              v-for="file in fileList"
              :key="file.id"
              class="file-item"
              :class="{ selected: selectedIds.includes(file.id) }"
              @click="toggleSelect(file)"
            >
              <div class="file-preview">
                <el-image
                  v-if="activeTab === FileType.IMAGE"
                  :src="file.url"
                  fit="cover"
                  :preview-src-list="[file.url]"
                  preview-teleported
                  @click.stop
                />
                <div v-else-if="activeTab === FileType.VIDEO" class="video-preview">
                  <el-icon size="40"><VideoPlay /></el-icon>
                </div>
                <div v-else class="file-icon">
                  <el-icon size="40"><Document /></el-icon>
                </div>
                <div class="select-checkbox" @click.stop>
                  <el-checkbox
                    :model-value="selectedIds.includes(file.id)"
                    @change="toggleSelect(file)"
                  />
                </div>
                <div class="file-hover-actions" @click.stop>
                  <el-tooltip content="重命名" placement="top">
                    <el-icon @click="handleRename(file)"><Edit /></el-icon>
                  </el-tooltip>
                  <el-tooltip content="查看" placement="top">
                    <el-icon @click="handlePreview(file)"><View /></el-icon>
                  </el-tooltip>
                  <el-tooltip content="复制地址" placement="top">
                    <el-icon @click="handleCopyUrl(file)"><Link /></el-icon>
                  </el-tooltip>
                </div>
              </div>
              <div class="file-info">
                <el-tooltip :content="file.name" placement="top">
                  <span class="file-name">{{ file.name }}</span>
                </el-tooltip>
              </div>
            </div>
          </template>
          <el-empty v-else description="暂无文件" />
        </div>

        <!-- 列表视图 -->
        <div v-else class="file-table" v-loading="loading">
          <el-table :data="fileList" style="width: 100%">
            <el-table-column width="50">
              <template #header>
                <el-checkbox
                  v-model="isAllSelected"
                  :indeterminate="isIndeterminate"
                  @change="handleSelectAll"
                />
              </template>
              <template #default="{ row }">
                <el-checkbox
                  :model-value="selectedIds.includes(row.id)"
                  @change="toggleSelect(row)"
                />
              </template>
            </el-table-column>
            <el-table-column label="预览" width="80">
              <template #default="{ row }">
                <div class="table-preview">
                  <el-image
                    v-if="activeTab === FileType.IMAGE"
                    :src="row.url"
                    fit="cover"
                    :preview-src-list="[row.url]"
                    preview-teleported
                  />
                  <div v-else-if="activeTab === FileType.VIDEO" class="table-icon">
                    <el-icon><VideoPlay /></el-icon>
                  </div>
                  <div v-else class="table-icon">
                    <el-icon><Document /></el-icon>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="文件名" prop="name" show-overflow-tooltip />
            <el-table-column label="创建时间" prop="created_at" width="180" />
            <el-table-column label="操作" width="180" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="handleRename(row)">重命名</el-button>
                <el-button type="primary" link size="small" @click="handleCopyUrl(row)">复制地址</el-button>
                <el-button type="danger" link size="small" @click="handleDeleteFile(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 底部操作栏 -->
        <div class="footer-bar">
          <div class="footer-left">
            <template v-if="selectedIds.length > 0">
              <span class="selected-info">已选择 {{ selectedIds.length }} 项</span>
              <el-button type="danger" size="small" @click="handleBatchDelete">
                <el-icon><Delete /></el-icon>
                批量删除
              </el-button>
              <el-button size="small" @click="handleBatchMove">
                <el-icon><FolderOpened /></el-icon>
                移动到
              </el-button>
            </template>
          </div>
          <div class="footer-right">
            <el-pagination
              v-if="total > 0"
              v-model:current-page="page"
              v-model:page-size="pageSize"
              :total="total"
              :page-sizes="[20, 40, 60, 100]"
              layout="total, sizes, prev, pager, next"
              small
              @size-change="getFileList"
              @current-change="getFileList"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 分类编辑弹窗 -->
    <el-dialog v-model="cateDialogVisible" :title="cateForm.id ? '编辑分类' : '新增分类'" width="400px">
      <el-form ref="cateFormRef" :model="cateForm" :rules="cateRules" label-width="80px">
        <el-form-item label="分类名称" prop="name">
          <el-input v-model="cateForm.name" placeholder="请输入分类名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cateDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="cateSubmitLoading" @click="handleCateSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 移动文件弹窗 -->
    <el-dialog v-model="moveDialogVisible" title="移动到" width="400px">
      <el-tree
        ref="moveTreeRef"
        :data="[{ id: 0, name: '根目录', children: cateList }]"
        :props="{ label: 'name', children: 'children' }"
        node-key="id"
        highlight-current
        default-expand-all
        @node-click="handleMoveTargetClick"
      />
      <template #footer>
        <el-button @click="moveDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="moveSubmitLoading" @click="handleMoveSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>

    <!-- 重命名弹窗 -->
    <el-dialog v-model="renameDialogVisible" title="重命名" width="400px">
      <el-form ref="renameFormRef" :model="renameForm" :rules="renameRules" label-width="80px">
        <el-form-item label="文件名" prop="name">
          <el-input v-model="renameForm.name" placeholder="请输入文件名" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="renameDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="renameSubmitLoading" @click="handleRenameSubmit">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, FormInstance, FormRules } from 'element-plus'
import {
  Plus,
  MoreFilled,
  Upload,
  Search,
  VideoPlay,
  Document,
  Check,
  Edit,
  View,
  Link,
  Delete,
  FolderOpened,
  Grid,
  List,
  Folder
} from '@element-plus/icons-vue'
import { useUserStore } from '@/store/modules/user'
import { useClipboard } from '@vueuse/core'
import {
  FileType,
  FileCate,
  FileInfo,
  fetchFileCateList,
  fetchFileCateAdd,
  fetchFileCateEdit,
  fetchFileCateDelete,
  fetchFileList,
  fetchFileMove,
  fetchFileRename,
  fetchFileDelete,
  getUploadImageUrl,
  getUploadVideoUrl,
  getUploadFileUrl
} from '@/api/file'

const userStore = useUserStore()
const { copy } = useClipboard()

// 状态
const loading = ref(false)
const activeTab = ref<FileType>(FileType.IMAGE)
const cateList = ref<FileCate[]>([])
const fileList = ref<FileInfo[]>([])
const currentCid = ref(0)
const selectedIds = ref<number[]>([])
const searchName = ref('')
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const viewMode = ref<'grid' | 'list'>('grid')

// 全选相关
const isAllSelected = computed({
  get: () => fileList.value.length > 0 && selectedIds.value.length === fileList.value.length,
  set: () => {}
})
const isIndeterminate = computed(() => {
  return selectedIds.value.length > 0 && selectedIds.value.length < fileList.value.length
})

// 分类弹窗
const cateDialogVisible = ref(false)
const cateSubmitLoading = ref(false)
const cateFormRef = ref<FormInstance>()
const cateForm = reactive({
  id: 0,
  pid: 0,
  name: ''
})
const cateRules: FormRules = {
  name: [{ required: true, message: '请输入分类名称', trigger: 'blur' }]
}

// 移动弹窗
const moveDialogVisible = ref(false)
const moveSubmitLoading = ref(false)
const moveTargetCid = ref(0)
const moveFileIds = ref<number[]>([])

// 重命名弹窗
const renameDialogVisible = ref(false)
const renameSubmitLoading = ref(false)
const renameFormRef = ref<FormInstance>()
const renameForm = reactive({
  id: 0,
  name: ''
})
const renameRules: FormRules = {
  name: [{ required: true, message: '请输入文件名', trigger: 'blur' }]
}

// 计算属性
const fileTypeName = computed(() => {
  const map = {
    [FileType.IMAGE]: '图片',
    [FileType.VIDEO]: '视频',
    [FileType.FILE]: '文件'
  }
  return map[activeTab.value]
})

const uploadUrl = computed(() => {
  const map = {
    [FileType.IMAGE]: getUploadImageUrl(),
    [FileType.VIDEO]: getUploadVideoUrl(),
    [FileType.FILE]: getUploadFileUrl()
  }
  // 直接返回相对路径，让 Vite 代理处理
  return map[activeTab.value]
})

const uploadHeaders = computed(() => ({
  Authorization: userStore.accessToken
}))

const acceptTypes = computed(() => {
  const map = {
    [FileType.IMAGE]: 'image/*',
    [FileType.VIDEO]: 'video/*',
    [FileType.FILE]: '*'
  }
  return map[activeTab.value]
})

// 获取分类列表
const getCateList = async () => {
  try {
    cateList.value = await fetchFileCateList(activeTab.value)
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
      type: activeTab.value,
      name: searchName.value || undefined
    })
    fileList.value = res.records
    total.value = res.total
  } finally {
    loading.value = false
  }
}

// Tab切换
const handleTabChange = () => {
  currentCid.value = 0
  selectedIds.value = []
  page.value = 1
  getCateList()
  getFileList()
}

// 分类点击
const handleCateClick = (data: FileCate) => {
  currentCid.value = data.id
  selectedIds.value = []
  page.value = 1
  getFileList()
}

// 新增分类
const handleAddCate = (pid: number) => {
  cateForm.id = 0
  cateForm.pid = pid
  cateForm.name = ''
  cateDialogVisible.value = true
}

// 编辑分类
const handleEditCate = (data: FileCate) => {
  cateForm.id = data.id
  cateForm.pid = data.pid
  cateForm.name = data.name
  cateDialogVisible.value = true
}

// 删除分类
const handleDeleteCate = async (data: FileCate) => {
  await ElMessageBox.confirm('确定要删除该分类吗？', '提示', { type: 'warning' })
  await fetchFileCateDelete(data.id)
  getCateList()
  if (currentCid.value === data.id) {
    currentCid.value = 0
    getFileList()
  }
}

// 提交分类
const handleCateSubmit = async () => {
  await cateFormRef.value?.validate()
  cateSubmitLoading.value = true
  try {
    if (cateForm.id) {
      await fetchFileCateEdit({
        id: cateForm.id,
        pid: cateForm.pid,
        name: cateForm.name
      })
    } else {
      await fetchFileCateAdd({
        pid: cateForm.pid,
        type: activeTab.value,
        name: cateForm.name
      })
    }
    cateDialogVisible.value = false
    getCateList()
  } finally {
    cateSubmitLoading.value = false
  }
}

// 搜索
const handleSearch = () => {
  page.value = 1
  getFileList()
}

// 全选/取消全选
const handleSelectAll = (val: boolean) => {
  if (val) {
    selectedIds.value = fileList.value.map((f) => f.id)
  } else {
    selectedIds.value = []
  }
}

// 选择文件
const toggleSelect = (file: FileInfo) => {
  const index = selectedIds.value.indexOf(file.id)
  if (index > -1) {
    selectedIds.value.splice(index, 1)
  } else {
    selectedIds.value.push(file.id)
  }
}

// 预览文件
const handlePreview = (file: FileInfo) => {
  if (activeTab.value === FileType.IMAGE) {
    // 图片预览由 el-image 组件处理
    window.open(file.url, '_blank')
  } else if (activeTab.value === FileType.VIDEO) {
    window.open(file.url, '_blank')
  } else {
    window.open(file.url, '_blank')
  }
}

// 复制地址
const handleCopyUrl = async (file: FileInfo) => {
  try {
    await copy(file.url)
    ElMessage.success('地址已复制到剪贴板')
  } catch {
    ElMessage.error('复制失败')
  }
}

// 上传前校验
const beforeUpload = (file: File) => {
  const maxSize = activeTab.value === FileType.VIDEO ? 100 : 10 // MB
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

// 重命名
const handleRename = (file: FileInfo) => {
  renameForm.id = file.id
  renameForm.name = file.name
  renameDialogVisible.value = true
}

// 提交重命名
const handleRenameSubmit = async () => {
  await renameFormRef.value?.validate()
  renameSubmitLoading.value = true
  try {
    await fetchFileRename(renameForm.id, renameForm.name)
    renameDialogVisible.value = false
    getFileList()
  } finally {
    renameSubmitLoading.value = false
  }
}

// 移动单个文件
const handleMoveFile = (file: FileInfo) => {
  moveFileIds.value = [file.id]
  moveTargetCid.value = 0
  moveDialogVisible.value = true
}

// 批量移动
const handleBatchMove = () => {
  moveFileIds.value = [...selectedIds.value]
  moveTargetCid.value = 0
  moveDialogVisible.value = true
}

// 选择移动目标
const handleMoveTargetClick = (data: { id: number }) => {
  moveTargetCid.value = data.id
}

// 提交移动
const handleMoveSubmit = async () => {
  moveSubmitLoading.value = true
  try {
    await fetchFileMove(moveFileIds.value, moveTargetCid.value)
    moveDialogVisible.value = false
    selectedIds.value = []
    getFileList()
  } finally {
    moveSubmitLoading.value = false
  }
}

// 删除单个文件
const handleDeleteFile = async (file: FileInfo) => {
  await ElMessageBox.confirm('确定要删除该文件吗？', '提示', { type: 'warning' })
  await fetchFileDelete([file.id])
  getFileList()
}

// 批量删除
const handleBatchDelete = async () => {
  await ElMessageBox.confirm(`确定要删除选中的 ${selectedIds.value.length} 个文件吗？`, '提示', {
    type: 'warning'
  })
  await fetchFileDelete(selectedIds.value)
  selectedIds.value = []
  getFileList()
}

onMounted(() => {
  getCateList()
  getFileList()
})
</script>

<style scoped lang="scss">
.material-page {
  padding: 20px;
  background: var(--el-bg-color);
  min-height: calc(100vh - 120px);

  .material-content {
    display: flex;
    gap: 20px;
    margin-top: 20px;
  }

  .material-sidebar {
    width: 240px;
    flex-shrink: 0;
    background: var(--el-bg-color-overlay);
    border-radius: 8px;
    padding: 16px;
    border: 1px solid var(--el-border-color-light);

    .sidebar-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      font-weight: 500;
    }

    .tree-node {
      flex: 1;
      display: flex;
      align-items: center;
      padding-right: 8px;

      .folder-icon {
        color: #f9c035;
        font-size: 18px;
        margin-right: 8px;
        flex-shrink: 0;
      }

      .node-label {
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .node-actions {
        opacity: 0;
        transition: opacity 0.2s;
        cursor: pointer;
        margin-left: 8px;
      }

      &:hover .node-actions {
        opacity: 1;
      }
    }
  }

  .material-main {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;

    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;

      .toolbar-left {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .toolbar-right {
        display: flex;
        align-items: center;
        gap: 16px;

        .view-toggle {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 4px 8px;
          background: var(--el-fill-color-light);
          border-radius: 4px;

          .el-icon {
            font-size: 18px;
            cursor: pointer;
            color: var(--el-text-color-secondary);
            transition: color 0.2s;

            &:hover,
            &.active {
              color: var(--el-color-primary);
            }
          }
        }
      }
    }

    .file-grid {
      flex: 1;
      display: grid;
      grid-template-columns: repeat(auto-fill, 120px);
      gap: 16px;
      align-content: start;
      min-height: 300px;

      .file-item {
        width: 120px;
        background: var(--el-bg-color-overlay);
        border-radius: 8px;
        overflow: hidden;
        cursor: pointer;
        border: 2px solid transparent;
        transition: all 0.2s;

        &:hover {
          border-color: var(--el-color-primary-light-5);

          .file-hover-actions {
            opacity: 1;
          }

          .select-checkbox {
            opacity: 1;
          }
        }

        &.selected {
          border-color: var(--el-color-primary);

          .select-checkbox {
            opacity: 1;
          }
        }

        .file-preview {
          position: relative;
          width: 100%;
          height: 120px;
          background: var(--el-fill-color-light);

          :deep(.el-image) {
            width: 100%;
            height: 100%;
          }

          .video-preview,
          .file-icon {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--el-text-color-secondary);
          }

          .select-checkbox {
            position: absolute;
            top: 6px;
            left: 6px;
            opacity: 0;
            transition: opacity 0.2s;
            z-index: 2;

            :deep(.el-checkbox__inner) {
              background: rgba(255, 255, 255, 0.9);
            }
          }

          .file-hover-actions {
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            padding: 8px;
            background: linear-gradient(transparent, rgba(0, 0, 0, 0.6));
            display: flex;
            justify-content: center;
            gap: 12px;
            opacity: 0;
            transition: opacity 0.2s;

            .el-icon {
              font-size: 18px;
              color: #fff;
              cursor: pointer;
              transition: transform 0.2s;

              &:hover {
                transform: scale(1.2);
              }
            }
          }
        }

        .file-info {
          padding: 8px;
          text-align: center;

          .file-name {
            display: block;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-size: 12px;
            color: var(--el-text-color-regular);
          }
        }
      }
    }

    .file-table {
      flex: 1;
      min-height: 300px;

      .table-preview {
        width: 50px;
        height: 50px;
        border-radius: 4px;
        overflow: hidden;
        background: var(--el-fill-color-light);

        :deep(.el-image) {
          width: 100%;
          height: 100%;
        }

        .table-icon {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--el-text-color-secondary);
        }
      }
    }

    .footer-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 16px;
      padding: 12px 16px;
      background: var(--el-bg-color-overlay);
      border-radius: 8px;
      border: 1px solid var(--el-border-color-light);

      .footer-left {
        display: flex;
        align-items: center;
        gap: 12px;

        .selected-info {
          color: var(--el-color-primary);
          font-size: 14px;
        }
      }

      .footer-right {
        display: flex;
        align-items: center;
      }
    }
  }
}
</style>
