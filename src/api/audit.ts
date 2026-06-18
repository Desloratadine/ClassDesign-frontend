import apiClient from './client'
import type { ApiResponse, AuditLog, AuditVerifyResult, PageResult } from '@/types'

export async function getAuditLogs(params: {
  page?: number
  size?: number
  account?: string
  action?: string
  fromTime?: string
  toTime?: string
}): Promise<PageResult<AuditLog>> {
  const res = await apiClient.get<ApiResponse<PageResult<AuditLog>>>('/audit/logs', { params })
  return res.data.data
}

export async function verifyAuditChain(): Promise<AuditVerifyResult> {
  const res = await apiClient.post<ApiResponse<AuditVerifyResult>>('/audit/verify')
  return res.data.data
}

export async function downloadAuditLogs(fromId: number, toId: number): Promise<Blob> {
  const res = await apiClient.get('/audit/download', {
    params: { fromId, toId },
    responseType: 'blob',
  })
  return res.data
}