/** 通用 API 响应包 */
export interface ApiResponse<T = any> {
  status: 'success' | 'fail'
  data: T
  reason: string
  timestamp: string
}

/** 分页查询参数 */
export interface PageQuery {
  page?: number
  size?: number
}

/** 分页结果 */
export interface PageResult<T> {
  items: T[]
}

/** 用户信息 */
export interface UserInfo {
  username: string
  account: string
  security: number
  roleId: string
  deptId: string
  /** 角色名称（登录响应返回） */
  role?: string
  /** 部门名称（登录响应返回） */
  dept?: string
}

/** 登录请求 */
export interface LoginRequest {
  account: string
  passwd: string
}

/** 登录响应 */
export interface LoginResponse {
  username: string
  account: string
  security: number
  role: string
  dept: string
  token: string
}

/** 部门 */
export interface Dept {
  deptId: string
  deptName: string
}

/** 角色 */
export interface Role {
  roleId: string
  roleName: string
  privileges?: string
}

/** 密级 */
export interface SecurityLevel {
  label: string
  level: number
}

/** 上传选项 */
export interface UploadOptions {
  dept: Dept[]
  role: Role[]
  security: SecurityLevel[]
  users: UserInfo[]
}

/** 上传请求参数 */
export interface UploadRequest {
  dept: string[]
  role: string[]
  security: number
  receiverAccounts: string[]
}

/** 上传响应 */
export interface UploadResponse {
  docTimestamp: string
  filename: string
  digest: {
    plainSm3: string
    cipherSm3: string
    metaSm3: string
    policySm3: string
    envelopeSetSm3: string
  }
  signatureId: string
}

/** 已发送文档项 */
export interface SentDocItem {
  docTimestamp: string
  filename: string
  dept: string[]
  role: string[]
  security: number
  sentTime: string
}

/** 收件箱文档项 */
export interface InboxDocItem {
  docTimestamp: string
  filename: string
  security: number
  senderAccount: string
  sentTime: string
}

/** 文档详情 */
export interface DocumentDetail {
  docTimestamp: string
  filename: string
  size: number
  sentTime: string
  status: 'active' | 'revoked' | 'deleted'
  senderAccount: string
  security: number
  dept: string[]
  role: string[]
  receiverAccounts: string[]
  digest: {
    plainSm3: string
    cipherSm3: string
    metaSm3: string
    policySm3: string
    envelopeSetSm3: string
  }
  signature: {
    sigId: string
    alg: string
    keyId: string
    signedDigest: string
    timestamp: string
    nonce: string
    signature: string
  }
}

/** 验证结果 */
export interface VerifyResult {
  plainSm3: boolean
  metaSm3: boolean
  policySm3: boolean
  cipherSm3: boolean
  envelopeSetSm3: boolean
  senderSignature: boolean
  timestamp: boolean
  nonce: boolean
  receiverEnvelope: boolean
  pass: boolean
}

/** 文档状态更新 */
export interface StatusUpdateRequest {
  docTimestamp: string
  status: 'active' | 'revoked' | 'deleted'
}

/** 管理员用户 */
export interface AdminUser {
  account: string
  username: string
  security: number
  role: string
  dept: string
}

/** 新增/更新用户请求 */
export interface UserRequest {
  account?: string
  username: string
  passwd: string
  role: string
  dept: string
  security: number
}

/** SM9 主密钥 */
export interface Sm9MasterKey {
  keyId: string
  usageType: string
  status: string
  wrappingAlg: string
  wrappingKeyId: string
  createdAt: string
  notBefore: string
  notAfter: string
  retiredAt: string
  revokedAt: string
}

/** SM9 主密钥轮换结果 */
export interface Sm9RotateResult {
  oldKeyId: string
  newKeyId: string
  status: string
  rewrappedEnvelopeCount: number
  updatedDocumentCount: number
  resignedDocumentCount: number
}

/** 审计日志 */
export interface AuditLog {
  logId: number
  time: string
  account: string
  action: string
  detail: string
  status: string
  reason: string
  prevHash: string
  logHash: string
}

/** 日志验证结果 */
export interface AuditVerifyResult {
  pass: boolean
  checkedCount: number
  firstBrokenId: number
}