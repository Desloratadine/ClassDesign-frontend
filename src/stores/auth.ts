import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { UserInfo } from '@/types'
import { login as loginApi, getMe as getMeApi, logout as logoutApi } from '@/api/auth'
import { sm3Hash } from '@/utils'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string>(localStorage.getItem('token') || '')
  const user = ref<UserInfo | null>(null)

  /** 从 localStorage 恢复用户信息 */
  function loadUserFromCache() {
    const cached = localStorage.getItem('user')
    if (cached) {
      try {
        user.value = JSON.parse(cached)
      } catch {
        // ignore
      }
    }
  }

  /** 登录 */
  async function login(account: string, password: string) {
    const passwdHash = sm3Hash(password)
    const result = await loginApi({ account, passwd: passwdHash })
    token.value = result.token
    user.value = {
      username: result.username,
      account: result.account,
      security: result.security,
      roleId: result.role,
      deptId: result.dept,
      role: result.role,
      dept: result.dept,
    }
    localStorage.setItem('token', result.token)
    localStorage.setItem('user', JSON.stringify(user.value))
  }

  /** 获取当前用户信息 */
  async function fetchUser() {
    const info = await getMeApi()
    user.value = info
    localStorage.setItem('user', JSON.stringify(info))
  }

  /** 退出登录 */
  async function logout() {
    try {
      await logoutApi()
    } catch {
      // ignore
    }
    token.value = ''
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  /** 是否已登录 */
  const isLoggedIn = () => !!token.value

  /** 是否为管理员 */
  const isAdmin = () => user.value?.roleId === 'admin' || user.value?.role === 'admin'

  return { token, user, login, fetchUser, logout, isLoggedIn, isAdmin, loadUserFromCache }
})