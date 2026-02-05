import request from '@/utils/http'

// 存储引擎类型
export interface StorageEngine {
  name: string
  engine: string
  status: number
  describe: string
}

// 存储引擎配置详情
export interface StorageDetail {
  engine: string
  status: number
  config: Record<string, any>
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
