import request from '@/utils/http'
import { AppRouteRecord } from '@/types/router'

// 获取用户列表
export function fetchGetUserList(params: Api.SystemManage.UserSearchParams) {
  return request.get<Api.SystemManage.UserList>({
    url: '/api/user/list',
    params
  })
}

// 创建用户
export function fetchCreateUser(data: Api.SystemManage.UserForm) {
  return request.post({
    url: '/api/user',
    data
  })
}

// 更新用户
export function fetchUpdateUser(id: number, data: Api.SystemManage.UserForm) {
  return request.put({
    url: `/api/user/${id}`,
    data
  })
}

// 删除用户
export function fetchDeleteUser(id: number) {
  return request.del({
    url: `/api/user/${id}`
  })
}

// 获取角色列表
export function fetchGetRoleList(params: Api.SystemManage.RoleSearchParams) {
  return request.get<Api.SystemManage.RoleList>({
    url: '/api/role/list',
    params
  })
}

// 获取所有角色（不分页，用于下拉选择）
export function fetchGetAllRoles() {
  return request.get<Api.SystemManage.RoleListItem[]>({
    url: '/api/role/all'
  })
}

// 创建角色
export function fetchCreateRole(data: Api.SystemManage.RoleForm) {
  return request.post({
    url: '/api/role',
    data
  })
}

// 更新角色
export function fetchUpdateRole(id: number, data: Api.SystemManage.RoleForm) {
  return request.put({
    url: `/api/role/${id}`,
    data
  })
}

// 删除角色
export function fetchDeleteRole(id: number) {
  return request.del({
    url: `/api/role/${id}`
  })
}

// 获取角色菜单权限
export function fetchGetRoleMenus(id: number) {
  return request.get<number[]>({
    url: `/api/role/menus/${id}`
  })
}

// 更新角色菜单权限
export function fetchUpdateRoleMenus(id: number, menuIds: number[]) {
  return request.put({
    url: `/api/role/menus/${id}`,
    data: { menuIds }
  })
}

// 获取用户菜单列表（用于动态路由）
export function fetchGetMenuList() {
  return request.get<AppRouteRecord[]>({
    url: '/api/menu/user'
  })
}

// 获取所有菜单列表（用于菜单管理和角色权限分配）
export function fetchGetAllMenuList() {
  return request.get<AppRouteRecord[]>({
    url: '/api/menu/list'
  })
}

// 创建菜单
export function fetchCreateMenu(data: Record<string, any>) {
  return request.post({
    url: '/api/menu',
    data
  })
}

// 更新菜单
export function fetchUpdateMenu(id: number, data: Record<string, any>) {
  return request.put({
    url: `/api/menu/${id}`,
    data
  })
}

// 删除菜单
export function fetchDeleteMenu(id: number) {
  return request.del({
    url: `/api/menu/${id}`
  })
}
