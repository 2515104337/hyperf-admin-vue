import { AppRouteRecord } from '@/types/router'

export const materialRoutes: AppRouteRecord = {
  path: '/material',
  name: 'Material',
  component: '/index/index',
  meta: {
    title: 'menus.material.title',
    icon: 'ri:folder-image-line',
    roles: ['R_SUPER', 'R_ADMIN']
  },
  children: [
    {
      path: 'index',
      name: 'MaterialIndex',
      component: '/material',
      meta: {
        title: 'menus.material.index',
        icon: 'ri:image-line',
        keepAlive: true,
        roles: ['R_SUPER', 'R_ADMIN']
      }
    }
  ]
}
