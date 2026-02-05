import request from '@/utils/http'

// 文件类型枚举
export enum FileType {
  IMAGE = 10,
  VIDEO = 20,
  FILE = 30
}

// 文件分类
export interface FileCate {
  id: number
  pid: number
  type: number
  name: string
  children?: FileCate[]
}

// 文件信息
export interface FileInfo {
  id: number
  cid: number
  type: number
  name: string
  uri: string
  url: string
  source: number
  source_id: number
  created_at: string
}

// 文件列表响应
export interface FileListResponse {
  records: FileInfo[]
  current: number
  size: number
  total: number
}

// 获取文件分类列表
export function fetchFileCateList(type?: number) {
  return request.get<FileCate[]>({
    url: '/api/file/cate/list',
    params: type !== undefined ? { type } : {}
  })
}

// 添加文件分类
export function fetchFileCateAdd(data: { pid?: number; type: number; name: string }) {
  return request.post<{ id: number }>({
    url: '/api/file/cate/add',
    data,
    showSuccessMessage: true
  })
}

// 编辑文件分类
export function fetchFileCateEdit(data: { id: number; pid?: number; name: string }) {
  return request.post({
    url: '/api/file/cate/edit',
    data,
    showSuccessMessage: true
  })
}

// 删除文件分类
export function fetchFileCateDelete(id: number) {
  return request.post({
    url: '/api/file/cate/delete',
    data: { id },
    showSuccessMessage: true
  })
}

// 获取文件列表
export function fetchFileList(params: {
  page?: number
  page_size?: number
  cid?: number
  type?: number
  name?: string
}) {
  return request.get<FileListResponse>({
    url: '/api/file/list',
    params
  })
}

// 移动文件
export function fetchFileMove(ids: number[], cid: number) {
  return request.post({
    url: '/api/file/move',
    data: { ids, cid },
    showSuccessMessage: true
  })
}

// 重命名文件
export function fetchFileRename(id: number, name: string) {
  return request.post({
    url: '/api/file/rename',
    data: { id, name },
    showSuccessMessage: true
  })
}

// 删除文件
export function fetchFileDelete(ids: number[]) {
  return request.post({
    url: '/api/file/delete',
    data: { ids },
    showSuccessMessage: true
  })
}

// 上传图片
export function getUploadImageUrl() {
  return '/api/upload/image'
}

// 上传视频
export function getUploadVideoUrl() {
  return '/api/upload/video'
}

// 上传文件
export function getUploadFileUrl() {
  return '/api/upload/file'
}
