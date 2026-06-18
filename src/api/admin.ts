import apiClient from './client'
import type {
  ApiResponse,
  AdminUser,
  Role,
  Dept,
  SecurityLevel,
  UserRequest,
  Sm9MasterKey,
  Sm9RotateResult,
  PageResult,
} from '@/types'

// ========== 用户管理 ==========
export async function getUsers(params: {
  page?: number
  size?: number
  account?: string
}): Promise<PageResult<AdminUser>> {
  const res = await apiClient.get<ApiResponse<PageResult<AdminUser>>>('/admin/users', { params })
  return res.data.data
}

export async function addUser(data: UserRequest): Promise<{ account: string }> {
  const res = await apiClient.post<ApiResponse<{ account: string }>>('/admin/users/add', data)
  return res.data.data
}

export async function updateUser(data: UserRequest): Promise<boolean> {
  const res = await apiClient.post<ApiResponse<{ update: boolean }>>('/admin/users/update', data)
  return res.data.data.update
}

export async function deleteUser(account: string): Promise<boolean> {
  const res = await apiClient.post<ApiResponse<{ delete: boolean }>>('/admin/users/delete', { account })
  return res.data.data.delete
}

// ========== 角色管理 ==========
export async function getRoles(params: {
  page?: number
  size?: number
}): Promise<PageResult<Role>> {
  const res = await apiClient.get<ApiResponse<PageResult<Role>>>('/admin/roles', { params })
  return res.data.data
}

export async function addRole(data: { roleName: string; privileges: string }): Promise<boolean> {
  const res = await apiClient.post<ApiResponse<{ add: boolean }>>('/admin/roles/add', data)
  return res.data.data.add
}

export async function updateRole(data: {
  roleId: string
  roleName: string
  privileges: string
}): Promise<boolean> {
  const res = await apiClient.post<ApiResponse<{ update: boolean }>>('/admin/roles/update', data)
  return res.data.data.update
}

export async function deleteRole(roleId: string): Promise<boolean> {
  const res = await apiClient.post<ApiResponse<{ delete: boolean }>>('/admin/roles/delete', { roleId })
  return res.data.data.delete
}

// ========== 部门管理 ==========
export async function getDepts(params: {
  page?: number
  size?: number
}): Promise<PageResult<Dept>> {
  const res = await apiClient.get<ApiResponse<PageResult<Dept>>>('/admin/dept', { params })
  return res.data.data
}

export async function addDept(data: { deptName: string }): Promise<boolean> {
  const res = await apiClient.post<ApiResponse<{ add: boolean }>>('/admin/dept/add', data)
  return res.data.data.add
}

export async function updateDept(data: {
  deptId: string
  deptName: string
}): Promise<boolean> {
  const res = await apiClient.post<ApiResponse<{ update: boolean }>>('/admin/dept/update', data)
  return res.data.data.update
}

export async function deleteDept(deptId: string): Promise<boolean> {
  const res = await apiClient.post<ApiResponse<{ delete: boolean }>>('/admin/dept/delete', { deptId })
  return res.data.data.delete
}

// ========== 密级管理 ==========
export async function getSecurityLevels(params: {
  page?: number
  size?: number
}): Promise<PageResult<SecurityLevel>> {
  const res = await apiClient.get<ApiResponse<PageResult<SecurityLevel>>>('/admin/security', { params })
  return res.data.data
}

export async function addSecurityLevel(data: {
  label: string
  level: number
}): Promise<boolean> {
  const res = await apiClient.post<ApiResponse<{ add: boolean }>>('/admin/security/add', data)
  return res.data.data.add
}

export async function updateSecurityLevel(data: {
  label: string
  level: number
}): Promise<boolean> {
  const res = await apiClient.post<ApiResponse<{ update: boolean }>>('/admin/security/update', data)
  return res.data.data.update
}

export async function deleteSecurityLevel(level: number): Promise<boolean> {
  const res = await apiClient.post<ApiResponse<{ delete: boolean }>>('/admin/security/delete', { level })
  return res.data.data.delete
}

// ========== SM9 密钥管理 ==========
export async function getSm9MasterKeys(params?: {
  usageType?: string
}): Promise<Sm9MasterKey[]> {
  const res = await apiClient.get<ApiResponse<{ items: Sm9MasterKey[] }>>('/admin/key/sm9', { params })
  return res.data.data.items
}

export async function rotateSm9EncKey(): Promise<Sm9RotateResult> {
  const res = await apiClient.post<ApiResponse<Sm9RotateResult>>('/admin/key/sm9/rotate-enc')
  return res.data.data
}