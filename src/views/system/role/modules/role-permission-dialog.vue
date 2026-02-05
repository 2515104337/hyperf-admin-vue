<template>
  <ElDialog
    v-model="visible"
    title="菜单权限"
    width="520px"
    align-center
    class="el-dialog-border"
    @close="handleClose"
  >
    <ElScrollbar height="70vh">
      <ElTree
        ref="treeRef"
        :data="processedMenuList"
        show-checkbox
        node-key="id"
        :default-expand-all="isExpandAll"
        :default-checked-keys="checkedMenuIds"
        :props="defaultProps"
        @check="handleTreeCheck"
      >
        <template #default="{ data }">
          <div style="display: flex; align-items: center">
            <span v-if="data.isAuth">
              {{ data.label }}
            </span>
            <span v-else>{{ defaultProps.label(data) }}</span>
          </div>
        </template>
      </ElTree>
    </ElScrollbar>
    <template #footer>
      <ElButton @click="toggleExpandAll">{{ isExpandAll ? '全部收起' : '全部展开' }}</ElButton>
      <ElButton @click="toggleSelectAll" style="margin-left: 8px">{{
        isSelectAll ? '取消全选' : '全部选择'
      }}</ElButton>
      <ElButton type="primary" :loading="submitting" @click="savePermission">保存</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { formatMenuTitle } from '@/utils/router'
  import { fetchGetRoleMenus, fetchUpdateRoleMenus, fetchGetAllMenuList } from '@/api/system-manage'
  import type { AppRouteRecord } from '@/types/router'

  type RoleListItem = Api.SystemManage.RoleListItem

  interface Props {
    modelValue: boolean
    roleData?: RoleListItem
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'success'): void
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: false,
    roleData: undefined
  })

  const emit = defineEmits<Emits>()

  // 所有菜单列表（从 API 获取）
  const menuList = ref<AppRouteRecord[]>([])
  const treeRef = ref()
  const isExpandAll = ref(true)
  const isSelectAll = ref(false)
  const checkedMenuIds = ref<number[]>([])
  const loading = ref(false)
  const submitting = ref(false)

  /**
   * 弹窗显示状态双向绑定
   */
  const visible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  /**
   * 菜单节点类型
   */
  interface MenuNode {
    id?: string | number
    name?: string
    label?: string
    meta?: {
      title?: string
      authList?: Array<{
        id?: number
        authMark: string
        title: string
        checked?: boolean
      }>
    }
    children?: MenuNode[]
    [key: string]: any
  }

  /**
   * 处理菜单数据，将 authList 转换为树形子节点
   * 递归处理菜单树，将权限列表展开为可选择的子节点
   */
  const processedMenuList = computed(() => {
    const processNode = (node: MenuNode): MenuNode => {
      const processed = { ...node }

      // 如果有 authList，将其转换为子节点
      if (node.meta?.authList?.length) {
        const authNodes = node.meta.authList.map((auth) => ({
          // 使用按钮的真实 ID（如果有的话），否则使用临时 ID
          id: auth.id || `${node.id}_${auth.authMark}`,
          name: `${node.name}_${auth.authMark}`,
          label: auth.title,
          authMark: auth.authMark,
          isAuth: true,
          checked: auth.checked || false
        }))

        processed.children = processed.children ? [...processed.children, ...authNodes] : authNodes
      }

      // 递归处理子节点
      if (processed.children) {
        processed.children = processed.children.map(processNode)
      }

      return processed
    }

    return menuList.value.map(processNode)
  })

  /**
   * 树形组件配置
   */
  const defaultProps = {
    children: 'children',
    label: (data: any) => formatMenuTitle(data.meta?.title) || data.label || ''
  }

  /**
   * 监听弹窗打开，初始化权限数据
   */
  watch(
    () => props.modelValue,
    async (newVal) => {
      if (newVal && props.roleData) {
        loading.value = true
        try {
          // 并行获取所有菜单列表和角色已有权限
          const [allMenus, menuIds] = await Promise.all([
            fetchGetAllMenuList(),
            fetchGetRoleMenus(props.roleData.id)
          ])
          menuList.value = allMenus
          checkedMenuIds.value = menuIds || []
          // 需要等待 DOM 更新后再设置选中状态
          nextTick(() => {
            treeRef.value?.setCheckedKeys(checkedMenuIds.value)
          })
        } catch (error) {
          console.error('加载权限失败:', error)
        } finally {
          loading.value = false
        }
      }
    }
  )

  /**
   * 关闭弹窗并清空选中状态
   */
  const handleClose = () => {
    visible.value = false
    treeRef.value?.setCheckedKeys([])
    checkedMenuIds.value = []
    menuList.value = []
  }

  /**
   * 保存权限配置
   */
  const savePermission = async () => {
    if (!props.roleData) return

    const tree = treeRef.value
    if (!tree) return

    submitting.value = true
    try {
      // 获取选中的菜单ID（包括半选状态的父节点）
      const checkedKeys = tree.getCheckedKeys()
      const halfCheckedKeys = tree.getHalfCheckedKeys()
      const allKeys = [...checkedKeys, ...halfCheckedKeys]

      // 过滤掉非数字的 ID（authList 转换的子节点 ID 格式是 "parentId_authMark"）
      const menuIds = allKeys.filter((key): key is number => typeof key === 'number')

      await fetchUpdateRoleMenus(props.roleData.id, menuIds)
      ElMessage.success('权限保存成功')
      emit('success')
      handleClose()
    } catch (error) {
      console.error('保存权限失败:', error)
    } finally {
      submitting.value = false
    }
  }

  /**
   * 切换全部展开/收起状态
   */
  const toggleExpandAll = () => {
    const tree = treeRef.value
    if (!tree) return

    const nodes = tree.store.nodesMap
    // 这里保留 any，因为 Element Plus 的内部节点类型较复杂
    Object.values(nodes).forEach((node: any) => {
      node.expanded = !isExpandAll.value
    })

    isExpandAll.value = !isExpandAll.value
  }

  /**
   * 切换全选/取消全选状态
   */
  const toggleSelectAll = () => {
    const tree = treeRef.value
    if (!tree) return

    if (!isSelectAll.value) {
      const allKeys = getAllNodeKeys(processedMenuList.value)
      tree.setCheckedKeys(allKeys)
    } else {
      tree.setCheckedKeys([])
    }

    isSelectAll.value = !isSelectAll.value
  }

  /**
   * 递归获取所有节点的 key
   * @param nodes 节点列表
   * @returns 所有节点的 key 数组
   */
  const getAllNodeKeys = (nodes: MenuNode[]): number[] => {
    const keys: number[] = []
    const traverse = (nodeList: MenuNode[]): void => {
      nodeList.forEach((node) => {
        if (typeof node.id === 'number') keys.push(node.id)
        if (node.children?.length) traverse(node.children)
      })
    }
    traverse(nodes)
    return keys
  }

  /**
   * 处理树节点选中状态变化
   * 同步更新全选按钮状态
   */
  const handleTreeCheck = () => {
    const tree = treeRef.value
    if (!tree) return

    const checkedKeys = tree.getCheckedKeys()
    const allKeys = getAllNodeKeys(processedMenuList.value)

    isSelectAll.value = checkedKeys.length === allKeys.length && allKeys.length > 0
  }
</script>
