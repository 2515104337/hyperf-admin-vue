import { AppRouteRecord } from '@/types/router'

export const settingRoutes: AppRouteRecord = {
  path: '/setting',
  name: 'Setting',
  component: '/index/index',
  meta: {
    title: 'menus.setting.title',
    icon: 'ri:settings-3-line',
    roles: ['R_SUPER', 'R_ADMIN']
  },
  children: [
    {
      path: 'storage',
      name: 'Storage',
      component: '/setting/storage',
      meta: {
        title: 'menus.setting.storage',
        icon: 'ri:hard-drive-2-line',
        keepAlive: true,
        roles: ['R_SUPER']
      }
    }
  ]
}
