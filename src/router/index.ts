import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    redirect: '/documents/inbox',
    children: [
      {
        path: 'documents/upload',
        name: 'DocumentUpload',
        component: () => import('@/views/documents/Upload.vue'),
        meta: { title: '上传文档' }
      },
      {
        path: 'documents/sent',
        name: 'DocumentSent',
        component: () => import('@/views/documents/Sent.vue'),
        meta: { title: '已发送' }
      },
      {
        path: 'documents/inbox',
        name: 'DocumentInbox',
        component: () => import('@/views/documents/Inbox.vue'),
        meta: { title: '收件箱' }
      },
      {
        path: 'documents/detail/:docTimestamp',
        name: 'DocumentDetail',
        component: () => import('@/views/documents/Detail.vue'),
        meta: { title: '文档详情' }
      },
      {
        path: 'admin/dashboard',
        name: 'AdminDashboard',
        component: () => import('@/views/admin/Dashboard.vue'),
        meta: { title: '管理后台' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, _from, next) => {
  const token = localStorage.getItem('token')
  if (to.meta.requiresAuth && !token) {
    next('/login')
  } else if (to.path === '/login' && token) {
    next('/')
  } else {
    next()
  }
})

export default router