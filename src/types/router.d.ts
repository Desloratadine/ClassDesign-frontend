import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    /** 是否需要登录认证 */
    requiresAuth?: boolean
    /** 页面标题 */
    title?: string
  }
}