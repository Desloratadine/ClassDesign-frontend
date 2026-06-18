import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录', noAuth: true },
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/home',
    children: [
      {
        path: 'home',
        name: 'Home',
        component: () => import('@/views/Home.vue'),
        meta: { title: '首页' },
      },
      {
        path: 'upload',
        name: 'Upload',
        component: () => import('@/views/Upload.vue'),
        meta: { title: '文档上传', privilege: 'file:upload' },
      },
      {
        path: 'sent',
        name: 'Sent',
        component: () => import('@/views/Sent.vue'),
        meta: { title: '已发送', privilege: 'transfer:read' },
      },
      {
        path: 'inbox',
        name: 'Inbox',
        component: () => import('@/views/Inbox.vue'),
        meta: { title: '收件箱', privilege: 'doc:receive' },
      },
      {
        path: 'document/:docTimestamp',
        name: 'DocumentDetail',
        component: () => import('@/views/DocumentDetail.vue'),
        meta: { title: '文档详情', privilege: 'doc:download' },
      },
      {
        path: 'admin/users',
        name: 'AdminUsers',
        component: () => import('@/views/admin/Users.vue'),
        meta: { title: '用户管理', admin: true, privilege: 'user:manage' },
      },
      {
        path: 'admin/roles',
        name: 'AdminRoles',
        component: () => import('@/views/admin/Roles.vue'),
        meta: { title: '角色管理', admin: true, privilege: 'role:manage' },
      },
      {
        path: 'admin/depts',
        name: 'AdminDepts',
        component: () => import('@/views/admin/Depts.vue'),
        meta: { title: '部门管理', admin: true, privilege: 'dept:manage' },
      },
      {
        path: 'admin/sm9',
        name: 'AdminSm9',
        component: () => import('@/views/admin/Sm9Keys.vue'),
        meta: { title: 'SM9 密钥管理', admin: true, privilege: 'key:manage' },
      },
      {
        path: 'admin/audit',
        name: 'AdminAudit',
        component: () => import('@/views/admin/Audit.vue'),
        meta: { title: '审计日志', admin: true, privilege: ['audit:hash:verify', 'audit:report:export'] },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 从缓存用户数据检查是否拥有指定权限（与 auth store 逻辑一致）
function hasPrivilegeFromCache(perm: string): boolean {
  const cached = localStorage.getItem('user')
  if (!cached) return false
  try {
    const user = JSON.parse(cached)
    // admin 角色拥有所有权限
    if (user.role === 'admin' || user.roleId === 'admin') return true
    const p: string | undefined = user.privileges
    if (!p || !p.trim()) return false
    return p.trim().split(/\s+/).includes(perm)
  } catch {
    return false
  }
}

// 路由守卫
router.beforeEach((to, _from, next) => {
  document.title = (to.meta.title as string) || '文档安全传输系统'

  const token = localStorage.getItem('token')

  // 不需要认证的页面
  if (to.meta.noAuth) {
    if (token && to.path === '/login') {
      next('/home')
    } else {
      next()
    }
    return
  }

  // 未登录
  if (!token) {
    next('/login')
    return
  }

  // 权限校验（所有页面）
  const required = to.meta.privilege as string | string[] | undefined
  if (required) {
    const perms = Array.isArray(required) ? required : [required]
    const hasAccess = perms.some(p => hasPrivilegeFromCache(p))
    if (!hasAccess) {
      next('/home')
      return
    }
  }

  next()
})

export default router