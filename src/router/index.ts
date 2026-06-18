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
        meta: { title: '文档上传' },
      },
      {
        path: 'sent',
        name: 'Sent',
        component: () => import('@/views/Sent.vue'),
        meta: { title: '已发送' },
      },
      {
        path: 'inbox',
        name: 'Inbox',
        component: () => import('@/views/Inbox.vue'),
        meta: { title: '收件箱' },
      },
      {
        path: 'document/:docTimestamp',
        name: 'DocumentDetail',
        component: () => import('@/views/DocumentDetail.vue'),
        meta: { title: '文档详情' },
      },
      {
        path: 'admin/users',
        name: 'AdminUsers',
        component: () => import('@/views/admin/Users.vue'),
        meta: { title: '用户管理', admin: true },
      },
      {
        path: 'admin/roles',
        name: 'AdminRoles',
        component: () => import('@/views/admin/Roles.vue'),
        meta: { title: '角色管理', admin: true },
      },
      {
        path: 'admin/depts',
        name: 'AdminDepts',
        component: () => import('@/views/admin/Depts.vue'),
        meta: { title: '部门管理', admin: true },
      },
      {
        path: 'admin/sm9',
        name: 'AdminSm9',
        component: () => import('@/views/admin/Sm9Keys.vue'),
        meta: { title: 'SM9 密钥管理', admin: true },
      },
      {
        path: 'admin/audit',
        name: 'AdminAudit',
        component: () => import('@/views/admin/Audit.vue'),
        meta: { title: '审计日志', admin: true },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

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

  // 管理员页面检查
  if (to.meta.admin) {
    const cached = localStorage.getItem('user')
    if (cached) {
      try {
        const user = JSON.parse(cached)
        if (user.role !== 'admin') {
          next('/home')
          return
        }
      } catch {
        next('/login')
        return
      }
    }
  }

  next()
})

export default router