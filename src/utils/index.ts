import { SM3 } from 'gm-crypto'

/**
 * 解码 JWT payload，提取 scope 字段
 * JWT 格式: header.payload.signature，payload 为 base64url 编码的 JSON
 */
export function decodeJwtScope(token: string): string {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return ''
    // base64url -> base64
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    // 补齐 padding
    while (base64.length % 4 !== 0) base64 += '='
    const jsonStr = atob(base64)
    const payload = JSON.parse(jsonStr)
    // 取 scope 字段（数据库文档约定 privileges 作为 JWT scope 字段）
    return payload.scope || payload.privileges || ''
  } catch {
    return ''
  }
}

/**
 * 使用 SM3 算法对密码进行哈希
 * @param plainText 明文密码
 * @returns SM3 哈希后的十六进制字符串
 */
export function sm3Hash(plainText: string): string {
  const hash = SM3.digest(plainText)
  return Array.from(new Uint8Array(hash as ArrayBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/** 密级颜色映射 */
export function getSecurityColor(level: number): string {
  if (level <= 3) return '#67c23a'
  if (level <= 6) return '#e6a23c'
  return '#f56c6c'
}

/** 密级标签 */
export function getSecurityLabel(level: number): string {
  return `密级 ${level}`
}

/** 格式化文件大小 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/** 文档状态标签 */
export function getStatusText(status: string): string {
  const map: Record<string, string> = {
    active: '活跃',
    revoked: '已撤销',
    deleted: '已删除',
  }
  return map[status] || status
}

/** 文档状态颜色 */
export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    active: '#67c23a',
    revoked: '#e6a23c',
    deleted: '#f56c6c',
  }
  return map[status] || '#909399'
}