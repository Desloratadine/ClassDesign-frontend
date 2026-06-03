import request from './request'

export interface LoginParams {
  account: string
  passwd: string
}

export interface LoginResult {
  username: string
  account: string
  security: number
  token: string
  role: string
  dept: string
}

export interface UserMeResult {
  username: string
  account: string
  security: number
  role: string
  dept: string
}

/** 登录 */
export function loginApi(data: LoginParams) {
  return request.post<{ data: LoginResult }>('/auth/login', data)
}

/** 获取当前用户信息 */
export function getMeApi() {
  return request.get<{ data: UserMeResult }>('/auth/me')
}

/** 退出登录 */
export function logoutApi() {
  return request.post<{ data: { logout: boolean } }>('/auth/logout')
}