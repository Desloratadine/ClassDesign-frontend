/** 用户信息 */
export interface UserInfo {
  username: string
  account: string
  security: number
  role: string
  dept: string
  token?: string
}

/** 文档摘要信息 */
export interface DigestInfo {
  plainSm3: string
  cipherSm3: string
  metaSm3: string
  policySm3: string
  envelopeSetSm3: string
}

/** 文档签名信息 */
export interface SignatureInfo {
  sigId: string
  alg: string
  keyId: string
  signedDigest: string
  timestamp: string
  nonce: string
  signature: string
}

/** 文档信息 */
export interface DocumentInfo {
  docTimestamp: string
  filename: string
  size?: number
  sentTime: string
  status?: string
  senderAccount: string
  security: number
  dept: string[]
  role: string[]
  receiverAccounts: string[]
  digest?: DigestInfo
  signature?: SignatureInfo
}

/** 文档验证结果 */
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

/** 部门项 */
export interface DeptItem {
  deptId: string
  deptName: string
}

/** 角色项 */
export interface RoleItem {
  roleId: string
  roleName: string
}

/** 密级项 */
export interface SecurityItem {
  label: string
  level: number
}

/** 用户选项 */
export interface UserOption {
  account: string
  username: string
  deptId: string
  security: number
  roleId: string
}

/** 上传页面选项数据 */
export interface OptionsData {
  dept: DeptItem[]
  role: RoleItem[]
  security: SecurityItem[]
  users: UserOption[]
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

/** API 统一返回格式 */
export interface ApiResponse<T = any> {
  status: 'success' | 'fail'
  data: T
  reason: string
  timestamp: string
}