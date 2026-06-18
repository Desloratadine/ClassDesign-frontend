import apiClient from './client'
import type { ApiResponse, LoginRequest, LoginResponse, UserInfo } from '@/types'

export async function login(data: LoginRequest): Promise<LoginResponse> {
  const res = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', data)
  return res.data.data
}

export async function getMe(): Promise<UserInfo> {
  const res = await apiClient.get<ApiResponse<UserInfo>>('/auth/me')
  return res.data.data
}

export async function logout(): Promise<boolean> {
  const res = await apiClient.post<ApiResponse<{ logout: boolean }>>('/auth/logout')
  return res.data.data.logout
}