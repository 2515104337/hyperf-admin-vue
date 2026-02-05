<template>
  <ElDialog
    v-model="dialogVisible"
    :title="dialogType === 'add' ? '添加用户' : '编辑用户'"
    width="30%"
    align-center
  >
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="80px">
      <ElFormItem label="头像" prop="avatar">
        <MaterialSelect v-model="avatarList" :type="FileType.IMAGE" :limit="1" />
      </ElFormItem>
      <ElFormItem label="用户名" prop="username">
        <ElInput v-model="formData.username" placeholder="请输入用户名" />
      </ElFormItem>
      <ElFormItem label="昵称" prop="nickname">
        <ElInput v-model="formData.nickname" placeholder="请输入昵称" />
      </ElFormItem>
      <ElFormItem label="邮箱" prop="email">
        <ElInput v-model="formData.email" placeholder="请输入邮箱" />
      </ElFormItem>
      <ElFormItem label="手机号" prop="phone">
        <ElInput v-model="formData.phone" placeholder="请输入手机号" />
      </ElFormItem>
      <ElFormItem label="性别" prop="gender">
        <ElSelect v-model="formData.gender">
          <ElOption label="男" value="male" />
          <ElOption label="女" value="female" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="状态" prop="status">
        <ElSelect v-model="formData.status">
          <ElOption label="启用" value="1" />
          <ElOption label="禁用" value="2" />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="角色" prop="roles">
        <ElSelect v-model="formData.roles" multiple :loading="roleLoading" placeholder="请选择角色">
          <ElOption
            v-for="role in roleList"
            :key="role.code"
            :value="role.code"
            :label="role.name"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem v-if="dialogType === 'add'" label="密码" prop="password">
        <ElInput v-model="formData.password" type="password" placeholder="请输入密码" show-password />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" :loading="submitting" @click="handleSubmit">提交</ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { fetchGetAllRoles, fetchCreateUser, fetchUpdateUser } from '@/api/system-manage'
  import MaterialSelect from '@/components/business/material/index.vue'
  import { FileType } from '@/api/file'
  import type { FormInstance, FormRules } from 'element-plus'

  interface Props {
    visible: boolean
    type: string
    userData?: Partial<Api.SystemManage.UserListItem>
  }

  interface Emits {
    (e: 'update:visible', value: boolean): void
    (e: 'submit'): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  // 头像列表（用于素材选择组件）
  const avatarList = ref<string[]>([])

  // 角色列表数据
  const roleList = ref<Api.SystemManage.RoleListItem[]>([])
  const roleLoading = ref(false)

  // 加载角色列表
  const loadRoleList = async () => {
    roleLoading.value = true
    try {
      const data = await fetchGetAllRoles()
      roleList.value = data || []
    } catch (error) {
      console.error('加载角色列表失败:', error)
      ElMessage.error('加载角色列表失败')
    } finally {
      roleLoading.value = false
    }
  }

  // 对话框显示控制
  const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  const dialogType = computed(() => props.type)

  // 表单实例
  const formRef = ref<FormInstance>()

  // 表单数据
  const formData = reactive({
    username: '',
    nickname: '',
    avatar: '',
    email: '',
    phone: '',
    gender: 'male',
    status: '1',
    password: '',
    roles: [] as string[]
  })

  // 表单验证规则
  const rules: FormRules = {
    username: [
      { required: true, message: '请输入用户名', trigger: 'blur' },
      { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
    ],
    nickname: [
      { max: 50, message: '昵称长度不能超过50个字符', trigger: 'blur' }
    ],
    email: [
      { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
    ],
    phone: [
      { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式', trigger: 'blur' }
    ],
    gender: [{ required: true, message: '请选择性别', trigger: 'blur' }],
    status: [{ required: true, message: '请选择状态', trigger: 'blur' }],
    password: [
      { required: true, message: '请输入密码', trigger: 'blur' },
      { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
    ],
    roles: [{ required: true, message: '请选择角色', trigger: 'blur' }]
  }

  /**
   * 初始化表单数据
   * 根据对话框类型（新增/编辑）填充表单
   */
  const initFormData = () => {
    const isEdit = props.type === 'edit' && props.userData
    const row = props.userData

    Object.assign(formData, {
      username: isEdit && row ? row.username || '' : '',
      nickname: isEdit && row ? row.nickname || '' : '',
      avatar: isEdit && row ? row.avatar || '' : '',
      email: isEdit && row ? row.email || '' : '',
      phone: isEdit && row ? row.phone || '' : '',
      gender: isEdit && row ? row.gender || 'male' : 'male',
      status: isEdit && row ? row.status || '1' : '1',
      password: '',
      roles: isEdit && row ? (Array.isArray(row.roles) ? row.roles : []) : []
    })

    // 初始化头像列表
    avatarList.value = formData.avatar ? [formData.avatar] : []
  }

  /**
   * 监听对话框状态变化
   * 当对话框打开时初始化表单数据并清除验证状态
   */
  watch(
    () => [props.visible, props.type, props.userData],
    ([visible]) => {
      if (visible) {
        loadRoleList()
        initFormData()
        nextTick(() => {
          formRef.value?.clearValidate()
        })
      }
    },
    { immediate: true }
  )

  /**
   * 提交表单
   * 验证通过后调用API并触发提交事件
   */
  const submitting = ref(false)
  const handleSubmit = async () => {
    if (!formRef.value) return

    await formRef.value.validate(async (valid) => {
      if (valid) {
        submitting.value = true
        try {
          const submitData: Api.SystemManage.UserForm = {
            username: formData.username,
            nickname: formData.nickname,
            avatar: avatarList.value[0] || '',
            email: formData.email,
            phone: formData.phone,
            gender: formData.gender,
            status: formData.status,
            roles: formData.roles
          }

          if (dialogType.value === 'add') {
            // 新增时传递密码
            await fetchCreateUser({ ...submitData, password: formData.password })
            ElMessage.success('添加成功')
          } else {
            const userId = props.userData?.id
            if (userId) {
              await fetchUpdateUser(userId, submitData)
              ElMessage.success('更新成功')
            }
          }
          dialogVisible.value = false
          emit('submit')
        } catch (error) {
          console.error('提交失败:', error)
        } finally {
          submitting.value = false
        }
      }
    })
  }
</script>
