import axios from 'axios'
import type { ApiResponse } from '@/types'
import { ElMessage } from 'element-plus'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '/api/v1',
  timeout: 30000,
})

// 请求拦截器：注入 token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器：统一错误处理
apiClient.interceptors.response.use(
  (response) => {
    const data = response.data as ApiResponse
    if (data.status === 'fail') {
      handleErrorReason(data.reason)
      return Promise.reject(new Error(data.reason))
    }
    return response
  },
  (error) => {
    if (error.response) {
      const status = error.response.status
      if (status === 401) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        window.location.href = '/login'
      } else if (status === 403) {
        ElMessage.error('权限不足')
      } else {
        ElMessage.error(error.response.data?.reason || '请求失败')
      }
    } else {
      ElMessage.error('网络错误，请检查连接')
    }
    return Promise.reject(error)
  }
)

function handleErrorReason(reason: string) {
  const messages: Record<string, string> = {
    UNAUTHORIZED: '未登录或令牌已失效',
    VALIDATION_ERROR: '参数错误',
    FORBIDDEN: '权限不足',
    POLICY_NOT_MATCH: '当前用户策略组不符合文档策略要求',
    NOT_FOUND: '资源不存在',
    DIGEST_MISMATCH: '文件完整性校验失败',
    SIGNATURE_INVALID: '文件签名校验失败',
    SERVER_ERROR: '服务端错误',
    ENVELOPE_NOT_FOUND: '当前用户没有文档密钥封装记录',
    KEY_UNWRAP_FAILED: '当前用户身份无法解封文档密钥',
    SIGNATURE_BINDING_INVALID: '签名绑定内容校验失败',
    KEY_REVOKED: 'SM9 密钥已撤销',
    KEY_EXPIRED: 'SM9 密钥已过期',
    DOCUMENT_INACTIVE: '文档状态异常，禁止操作',
  }
  const msg = messages[reason]
  if (msg) {
    ElMessage.error(msg)
  } else {
    // 显示后端原始错误信息，便于调试
    ElMessage.error(reason || '请求失败')
  }
}

export default apiClient