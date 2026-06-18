import apiClient from './client'
import type {
  ApiResponse,
  UploadOptions,
  UploadResponse,
  SentDocItem,
  InboxDocItem,
  DocumentDetail,
  VerifyResult,
  StatusUpdateRequest,
  PageResult,
} from '@/types'

export async function getUploadOptions(): Promise<UploadOptions> {
  const res = await apiClient.get<ApiResponse<UploadOptions>>('/documents/options')
  return res.data.data
}

export async function uploadDocument(
  file: File,
  meta: { dept: string[]; role: string[]; security: number; receiverAccounts: string[] },
  onProgress?: (percent: number) => void
): Promise<UploadResponse> {
  const formData = new FormData()
  formData.append('meta', new Blob([JSON.stringify(meta)], { type: 'application/json' }))
  formData.append('file', file)
  const res = await apiClient.post<ApiResponse<UploadResponse>>('/documents/upload', formData, {
    onUploadProgress: (e) => {
      if (e.total && onProgress) {
        onProgress(Math.round((e.loaded * 100) / e.total))
      }
    },
  })
  return res.data.data
}

export async function getSentDocs(params: {
  page?: number
  size?: number
  keyword?: string
}): Promise<PageResult<SentDocItem>> {
  const res = await apiClient.get<ApiResponse<PageResult<SentDocItem>>>('/documents/sent', { params })
  return res.data.data
}

export async function getInboxDocs(params: {
  page?: number
  size?: number
  keyword?: string
}): Promise<PageResult<InboxDocItem>> {
  const res = await apiClient.get<ApiResponse<PageResult<InboxDocItem>>>('/documents/inbox', { params })
  return res.data.data
}

export async function getDocumentDetail(docTimestamp: string): Promise<DocumentDetail> {
  const res = await apiClient.get<ApiResponse<DocumentDetail>>('/documents/detail', {
    params: { docTimestamp },
  })
  return res.data.data
}

export async function verifyDocument(docTimestamp: string): Promise<VerifyResult> {
  const res = await apiClient.post<ApiResponse<VerifyResult>>('/documents/verify', { docTimestamp })
  return res.data.data
}

export async function downloadDocument(docTimestamp: string): Promise<Blob> {
  const res = await apiClient.get('/documents/download', {
    params: { docTimestamp },
    responseType: 'blob',
  })
  return res.data
}

export async function updateDocumentStatus(data: StatusUpdateRequest): Promise<StatusUpdateRequest> {
  const res = await apiClient.post<ApiResponse<StatusUpdateRequest>>('/documents/status', data)
  return res.data.data
}

export async function deleteDocument(docTimestamp: string): Promise<boolean> {
  const res = await apiClient.post<ApiResponse<{ delete: boolean }>>('/documents/delete', { docTimestamp })
  return res.data.data.delete
}