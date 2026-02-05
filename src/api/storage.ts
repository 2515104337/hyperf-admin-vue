import request from '@/utils/http'

/** 存储引擎列表项（对齐后端 /api/setting/storage/list） */
export interface StorageEngine {
  /** 引擎 key：local/aliyun/qiniu/qcloud */
  key: string
  /** 显示名称 */
  name: string
  /** 描述 */
  desc: string
  /** 是否为默认引擎：1=启用 0=未启用 */
  status: number
}

/** 存储引擎配置字段（对齐后端 /api/setting/storage/detail） */
export interface StorageField {
  key: string
  name: string
  type: 'text' | 'password'
  placeholder?: string
  value?: string
}

/** 存储引擎配置详情 */
export interface StorageDetail {
  engine: string
  fields: StorageField[]
}

// 获取存储引擎列表
export function fetchStorageList() {
  return request.get<StorageEngine[]>({
    url: '/api/setting/storage/list'
  })
}

// 获取存储引擎配置详情
export function fetchStorageDetail(engine: string) {
  return request.get<StorageDetail>({
    url: '/api/setting/storage/detail',
    params: { engine }
  })
}

// 配置存储引擎
export function fetchStorageSetup(data: { engine: string; config: Record<string, any> }) {
  return request.post({
    url: '/api/setting/storage/setup',
    data,
    showSuccessMessage: true
  })
}

// 切换存储引擎
export function fetchStorageChange(engine: string) {
  return request.post({
    url: '/api/setting/storage/change',
    data: { engine },
    showSuccessMessage: true
  })
}
