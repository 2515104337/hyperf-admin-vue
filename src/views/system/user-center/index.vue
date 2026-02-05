<!-- 个人中心页面 -->
<template>
  <div class="w-full h-full p-0 bg-transparent border-none shadow-none">
    <div class="relative flex-b mt-2.5 max-md:block max-md:mt-1">
      <div class="w-112 mr-5 max-md:w-full max-md:mr-0">
        <div class="art-card-sm relative p-9 pb-6 overflow-hidden text-center">
          <img class="absolute top-0 left-0 w-full h-50 object-cover" src="@imgs/user/bg.webp" />
          <div class="relative z-10 mt-30 mx-auto">
            <img
              class="w-20 h-20 mx-auto object-cover border-2 border-white rounded-full cursor-pointer hover:opacity-80 transition-opacity"
              :src="userAvatar"
              @click="openAvatarSelect"
            />
            <div class="text-xs text-gray-400 mt-2">点击更换头像</div>
          </div>
          <h2 class="mt-3 text-xl font-normal">{{ userInfo.username }}</h2>
          <p class="mt-5 text-sm">{{ form.des || '暂无个人介绍' }}</p>

          <div class="w-75 mx-auto mt-7.5 text-left">
            <div class="mt-2.5">
              <ArtSvgIcon icon="ri:mail-line" class="text-g-700" />
              <span class="ml-2 text-sm">{{ form.email || '暂无邮箱' }}</span>
            </div>
            <div class="mt-2.5">
              <ArtSvgIcon icon="ri:user-3-line" class="text-g-700" />
              <span class="ml-2 text-sm">{{ form.realName || '暂无姓名' }}</span>
            </div>
            <div class="mt-2.5">
              <ArtSvgIcon icon="ri:map-pin-line" class="text-g-700" />
              <span class="ml-2 text-sm">{{ form.address || '暂无地址' }}</span>
            </div>
            <div class="mt-2.5">
              <ArtSvgIcon icon="ri:phone-line" class="text-g-700" />
              <span class="ml-2 text-sm">{{ form.mobile || '暂无手机' }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="flex-1 overflow-hidden max-md:w-full max-md:mt-3.5">
        <div class="art-card-sm">
          <h1 class="p-4 text-xl font-normal border-b border-g-300">基本设置</h1>

          <ElForm
            :model="form"
            class="box-border p-5 [&>.el-row_.el-form-item]:w-[calc(50%-10px)] [&>.el-row_.el-input]:w-full [&>.el-row_.el-select]:w-full"
            ref="ruleFormRef"
            :rules="rules"
            label-width="86px"
            label-position="top"
          >
            <ElRow>
              <ElFormItem label="姓名" prop="realName">
                <ElInput v-model="form.realName" :disabled="!isEdit" />
              </ElFormItem>
              <ElFormItem label="性别" prop="sex" class="ml-5">
                <ElSelect v-model="form.sex" placeholder="Select" :disabled="!isEdit">
                  <ElOption
                    v-for="item in options"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </ElSelect>
              </ElFormItem>
            </ElRow>

            <ElRow>
              <ElFormItem label="昵称" prop="nikeName">
                <ElInput v-model="form.nikeName" :disabled="!isEdit" />
              </ElFormItem>
              <ElFormItem label="邮箱" prop="email" class="ml-5">
                <ElInput v-model="form.email" :disabled="!isEdit" />
              </ElFormItem>
            </ElRow>

            <ElRow>
              <ElFormItem label="手机" prop="mobile">
                <ElInput v-model="form.mobile" :disabled="!isEdit" />
              </ElFormItem>
              <ElFormItem label="地址" prop="address" class="ml-5">
                <ElInput v-model="form.address" :disabled="!isEdit" />
              </ElFormItem>
            </ElRow>

            <ElFormItem label="个人介绍" prop="des" class="h-32">
              <ElInput type="textarea" :rows="4" v-model="form.des" :disabled="!isEdit" />
            </ElFormItem>

            <div class="flex-c justify-end [&_.el-button]:!w-27.5">
              <ElButton type="primary" class="w-22.5" v-ripple @click="edit" :loading="saving">
                {{ isEdit ? '保存' : '编辑' }}
              </ElButton>
            </div>
          </ElForm>
        </div>

        <div class="art-card-sm my-5">
          <h1 class="p-4 text-xl font-normal border-b border-g-300">更改密码</h1>

          <ElForm :model="pwdForm" class="box-border p-5" label-width="86px" label-position="top">
            <ElFormItem label="当前密码" prop="password">
              <ElInput
                v-model="pwdForm.password"
                type="password"
                :disabled="!isEditPwd"
                show-password
              />
            </ElFormItem>

            <ElFormItem label="新密码" prop="newPassword">
              <ElInput
                v-model="pwdForm.newPassword"
                type="password"
                :disabled="!isEditPwd"
                show-password
              />
            </ElFormItem>

            <ElFormItem label="确认新密码" prop="confirmPassword">
              <ElInput
                v-model="pwdForm.confirmPassword"
                type="password"
                :disabled="!isEditPwd"
                show-password
              />
            </ElFormItem>

            <div class="flex-c justify-end [&_.el-button]:!w-27.5">
              <ElButton type="primary" class="w-22.5" v-ripple @click="editPwd" :loading="savingPwd">
                {{ isEditPwd ? '保存' : '编辑' }}
              </ElButton>
            </div>
          </ElForm>
        </div>
      </div>
    </div>

    <!-- 头像选择弹窗 -->
    <el-dialog v-model="avatarDialogVisible" title="选择头像" width="900px" destroy-on-close>
      <MaterialSelect v-model="avatarList" :type="FileType.IMAGE" :limit="1" />
      <template #footer>
        <el-button @click="avatarDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="avatarSaving" @click="saveAvatar">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { useUserStore } from '@/store/modules/user'
  import type { FormInstance, FormRules } from 'element-plus'
  import { ElMessage } from 'element-plus'
  import request from '@/utils/http'
  import MaterialSelect from '@/components/business/material/index.vue'
  import { FileType } from '@/api/file'
  import defaultAvatar from '@imgs/user/avatar.webp'

  defineOptions({ name: 'UserCenter' })

  const userStore = useUserStore()
  const userInfo = computed(() => userStore.getUserInfo)

  // 用户头像
  const userAvatar = computed(() => userInfo.value.avatar || defaultAvatar)

  // 头像选择相关
  const avatarDialogVisible = ref(false)
  const avatarList = ref<string[]>([])
  const avatarSaving = ref(false)

  const isEdit = ref(false)
  const isEditPwd = ref(false)
  const saving = ref(false)
  const savingPwd = ref(false)
  const ruleFormRef = ref<FormInstance>()

  /**
   * 用户信息表单
   */
  const form = reactive({
    realName: '',
    nikeName: '',
    email: '',
    mobile: '',
    address: '',
    sex: 'unknown',
    des: ''
  })

  /**
   * 密码修改表单
   */
  const pwdForm = reactive({
    password: '',
    newPassword: '',
    confirmPassword: ''
  })

  /**
   * 表单验证规则
   */
  const rules = reactive<FormRules>({
    realName: [
      { required: true, message: '请输入姓名', trigger: 'blur' },
      { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
    ],
    nikeName: [
      { required: true, message: '请输入昵称', trigger: 'blur' },
      { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
    ],
    email: [{ required: true, message: '请输入邮箱', trigger: 'blur' }],
    mobile: [{ required: true, message: '请输入手机号码', trigger: 'blur' }],
    address: [{ required: true, message: '请输入地址', trigger: 'blur' }],
    sex: [{ required: true, message: '请选择性别', trigger: 'blur' }]
  })

  /**
   * 性别选项
   */
  const options = [
    { value: 'unknown', label: '未知' },
    { value: 'male', label: '男' },
    { value: 'female', label: '女' }
  ]

  onMounted(() => {
    fetchProfile()
  })

  /**
   * 打开头像选择弹窗
   */
  const openAvatarSelect = () => {
    avatarList.value = userInfo.value.avatar ? [userInfo.value.avatar] : []
    avatarDialogVisible.value = true
  }

  /**
   * 保存头像
   */
  const saveAvatar = async () => {
    const newAvatar = avatarList.value[0] || ''
    if (newAvatar === userInfo.value.avatar) {
      avatarDialogVisible.value = false
      return
    }

    avatarSaving.value = true
    try {
      await request.put({ url: '/api/user/profile', params: { avatar: newAvatar } })
      // 更新 store 中的用户信息
      userStore.setUserInfo({ ...userInfo.value, avatar: newAvatar })
      ElMessage.success('头像更新成功')
      avatarDialogVisible.value = false
    } catch (error: any) {
      ElMessage.error(error.message || '头像更新失败')
    } finally {
      avatarSaving.value = false
    }
  }

  /**
   * 获取用户资料
   */
  const fetchProfile = async () => {
    try {
      const data = await request.get<any>({ url: '/api/user/profile' })
      Object.assign(form, {
        realName: data?.real_name || '',
        nikeName: data?.nickname || '',
        email: data?.email || '',
        mobile: data?.phone || '',
        address: data?.address || '',
        sex: data?.gender || 'unknown',
        des: data?.description || ''
      })
    } catch (error) {
      console.error('获取用户资料失败:', error)
    }
  }

  /**
   * 切换用户信息编辑状态并保存
   */
  const edit = async () => {
    if (isEdit.value) {
      // 保存
      try {
        saving.value = true
        await request.put({
          url: '/api/user/profile',
          params: {
            real_name: form.realName,
            nickname: form.nikeName,
            email: form.email,
            phone: form.mobile,
            address: form.address,
            gender: form.sex,
            description: form.des
          }
        })
        ElMessage.success('保存成功')
        isEdit.value = false
      } catch (error: any) {
        ElMessage.error(error.message || '保存失败')
      } finally {
        saving.value = false
      }
    } else {
      isEdit.value = true
    }
  }

  /**
   * 切换密码编辑状态并保存
   */
  const editPwd = async () => {
    if (isEditPwd.value) {
      // 保存
      if (!pwdForm.password) {
        ElMessage.error('请输入当前密码')
        return
      }
      if (!pwdForm.newPassword) {
        ElMessage.error('请输入新密码')
        return
      }
      if (pwdForm.newPassword.length < 6) {
        ElMessage.error('新密码长度不能少于6位')
        return
      }
      if (pwdForm.newPassword !== pwdForm.confirmPassword) {
        ElMessage.error('两次输入的密码不一致')
        return
      }

      try {
        savingPwd.value = true
        await request.put({ url: '/api/user/password', params: pwdForm })
        ElMessage.success('密码修改成功')
        isEditPwd.value = false
        // 重置密码表单
        pwdForm.password = ''
        pwdForm.newPassword = ''
        pwdForm.confirmPassword = ''
      } catch (error: any) {
        ElMessage.error(error.message || '密码修改失败')
      } finally {
        savingPwd.value = false
      }
    } else {
      isEditPwd.value = true
    }
  }
</script>
