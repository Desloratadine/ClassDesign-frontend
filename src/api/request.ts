import axios from 'axios'
import type { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

const BASE_URL = '/api/v1'

const request: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000
})

// 请求拦截器
request.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse) => {
    const { status, reason } = response.data
    if (status === 'fail') {
      handleError(reason)
      return Promise.reject(new Error(reason))
    }
    return response.data
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      router.push('/login')
      ElMessage.error('登录已过期，请重新登录')
    }
    return Promise.reject(error)
  }
)

function handleError(reason: string) {
  const errorMessages: Record<string, string> = {
    UNAUTHORIZED: '未登录或 token 失效',
    VALIDATION_ERROR: '参数错误',
    FORBIDDEN: '权限不足',
    POLICY_NOT_MATCH: '当前用户策略组不符合文档策略要求',
    NOT_FOUND: '资源不存在',
    DIGEST_MISMATCH: '文件完整性校验失败',
    SIGNATURE_INVALID: '文件签名校验失败',
    SERVER_ERROR: '服务端错误',
    ENVELOPE_NOT_FOUND: '当前用户没有文档密钥封装记录',
    KEY_UNWRAP_FAILED: '当前用户身份无法解封文档密钥',
    DOCUMENT_INACTIVE: '文档已撤销或删除'
  }

  const message = errorMessages[reason] || reason || '未知错误'
  ElMessage.error(message)
}

export default request