# 后端基本约定
## API 基本约定
后端所有 API 接口的基本 URL 为 /api/v1；<br>
后续所有 API 接口 URL 都要在这个基础上进行拼接，如:
```text
POST /api/v1/auth/login
```

## 返回数据包基本约定
后端所有接口返回统一以 json 数据包的格式返回，基本 json 数据包示例如下<br>
data 字段为后端业务返回的相关数据内容<br>
```json
{
  "status": "success",
  "data": {},
  "reason": "",
  "timestamp": "2026-05-11T14:30:00+08:00"
}
```
status 字段约束<br>
```text
success: 事务完成
fail: 事务失败
```
reason 字段用当事务失败时，返回失败原因，常见约束字段如下<br>
```text
UNAUTHORIZED: 未登陆或 token 令牌失效
VALIDATION_ERROR: 参数错误
FORBIDDEN: 权限不足
POLICY_NOT_MATCH: 当前用户策略组不符合文档策略要求
NOT_FOUND: 资源不存在
DIGEST_MISMATCH: 文件完整性校验失败
SIGNATURE_INVALID: 文件签名校验失败
SERVER_ERROR: 服务端错误
Others: 其他的错误描述
```

## 登陆 API 说明
```http request
POST baseUrl/auth/login
```
作用：登陆接口，用于用户登陆认证<br>
请求参数：<br>
```json
{
  "account": "xxx",
  "passwd": "passwdHash"
}
```
account: 由八位数字组成的的用户唯一身份表示符，如 00000001<br>
passwd: 使用 SM3 算法计算出的密钥摘要，即 passwdHash = SM3(passwdPlainText)<br>
接口返回 data ：<br>
```json
{
  "username": "xxxx",
  "account": "xxxxx",
  "security": 1,
  "token": "xxxxx",
  "role": "xxxx",
  "dept": "xx"
}
```
username: 当前登陆用户的用户名，string 类型<br>
account: 当前登陆用户的账户，string 类型<br>
security: 当前登陆用户的密级，int 类型，取值为 0-9 的一位数字，引用 security.level<br>
role: 当前登陆用户的角色，string 类型<br>
dept: 当前登陆用户所属部门，string 类型<br>
token 为后端返回的身份标识令牌，后续所有的请求中必须包含该字段，该字段使用 Authorization: Bearer xxx 传递<br>
```http request
GET /auth/me
```
作用：获取当前登陆用户的信息
请求参数：无
接口返回 data ：
```json
{
  "username": "xxxx",
  "account": "xxxxx",
  "security": 1,
  "role": "xxxx",
  "dept": "xx"
}
```
username: 当前登陆用户的用户名，string 类型<br>
account: 当前登陆用户的账户，string 类型<br>
security: 当前登陆用户的密级，int 类型，取值为 0-9 的一位数字，引用 security.level<br>
role: 当前登陆用户的角色，string 类型<br>
dept: 当前登陆用户所属部门，string 类型<br>
```http request
POST /auth/logout
```
作用：退出当前登陆<br>
请求参数：无<br>
接口返回 data ：<br>
```json
{
  "logout": true
}
```
logout: 是否退出成功，boolean 类型<br>

## 文件传输 API 说明
方案 B 接口更新（2026-05-27）：<br>
本文档已按“document_digest + key_envelope + signature_record + sm9_master_key”方案扩展。旧版 `documents.sender_signature` 仍保留为兼容字段，但完整签名证据以 `signature_record` 为准；旧版 `document_sm4_crypto.sm4_key` 不再作为 DEK 存储位置，DEK 只保存在每个接收者自己的 `key_envelope.encrypted_dek` 中。SM9 主私钥保存到 `sm9_master_key.private_key_cipher` 时由 `cert` 包管理的证书公钥包装，服务端使用证书私钥解包装并缓存到内存，主密钥材料不返回客户端。<br>
```http request
GET /documents/options
```
作用：获取部门信息、角色信息、密级，用于上传页<br>
请求参数：无<br>
接口返回 data ：<br>
```json
{
  "dept": [
    {"deptId": "xxx", "deptName": "xxx"},
    {"deptId": "xxx", "deptName": "xxx"}
  ],
  "role": [
    {"roleId": "xxx", "roleName": "xxx"},
    {"roleId": "xxx", "roleName": "xxx"}
  ],
  "security": [
    {"label": "xxx", "level": 1},
    {"label": "xxx", "level": 2},
    {"label": "xxx", "level": 3}
  ],
  "users": [
    {"account": "xxx", "username": "xxx", "deptId": "xxx", "security": 1, "roleId": "xxx"},
    {"account": "xxx", "username": "xxx", "deptId": "xxx", "security": 2, "roleId": "xxx"},
    {"account": "xxx", "username": "xxx", "deptId": "xxx", "security": 3, "roleId": "xxx"}
  ]
}
```
dept: 部门列表，array 类型<br>
deptId: 部门唯一标识符，string 类型<br>
deptName: 部门名称，string 类型<br>
role: 角色列表，array 类型<br>
roleId: 角色唯一标识符，string 类型<br>
roleName: 角色名称，string 类型<br>
security: 密级列表，array 类型，元素字段为 label、level<br>
label: 密级名称，string 类型，最长 10 个字符<br>
level: 密级标识符，int 类型，取值为 0-9 的一位数字，对应 security.level<br>
users: 可选接收用户列表，array 类型<br>
account: 用户账户，string 类型<br>
username: 用户名，string 类型<br>
```http request
POST /documents/upload
Content-Type: multipart/form-data
```
作用：上传文件后端完成 SM4 加密、SM3 摘要、SM9 密钥封装或签名绑定，并创建发送记录<br>
请求参数：<br>
```json
{
  "dept": ["deptId", "deptId", "deptId"],
  "role": ["roleId", "roleId", "roleId"],
  "security": 1,
  "receiverAccounts": ["xxx", "xxx", "xxx"]
}
```
file: 原始上传文件，File 类型<br>
dept: 允许访问的部门 id 列表，array 类型<br>
role: 允许访问的角色 id 列表，array 类型<br>
security: 文档密级，int 类型，取值为 0-9 的一位数字，引用 security.level<br>
receiverAccounts: 文档接收者账户列表，array 类型<br>
上传约束：<br>
receiverAccounts 不为空时，表示指定接收者发送<br>
dept 数组只允许包含 receiverAccounts 中接收者所属的部门 id，不允许额外添加非接收者部门<br>
role 数组只允许包含 receiverAccounts 中接收者拥有的角色 id，不允许额外添加非接收者角色<br>
security 字段必须为 receiverAccounts 中所有接收者密级标识符的最小值，用于表示该文档面向接收者集合时可采用的最高限制等级<br>
receiverAccounts 为空数组时，表示不指定固定接收者，由上传用户填写 dept、role、security 作为文档访问策略<br>
receiverAccounts 为空数组时，后端只校验 dept、role、security 是否为系统中存在且合法的策略字段，不按接收者集合反推<br>
receiverAccounts 不为空时，后端需要根据 receiverAccounts 查询数据库中的用户部门、角色和密级，并校验 dept、role、security 是否满足上述约束<br>
服务端处理：<br>
计算 `plainSm3`、`cipherSm3`、`metaSm3`、`policySm3`、`envelopeSetSm3`<br>
为发送者和每个接收者生成独立 `key_envelope`，`receiverIdentity` 形如 `user:00000002`<br>
生成 `signature_record`，签名输入绑定文档标识、发送者、文件名、文件大小、全部摘要、SM4 参数、时间戳、nonce 和算法版本<br>
请求示例一：指定接收者<br>
```json
{
  "dept": ["0001", "0002"],
  "role": ["02", "04"],
  "security": 1,
  "receiverAccounts": ["00000002", "00000003"]
}
```
示例说明：<br>
00000002 用户属于部门 0001，角色 02，密级 3<br>
00000003 用户属于部门 0002，角色 04，密级 1<br>
因此 dept 只能包含 0001、0002，role 只能包含 02、04，security 必须填写接收者中最小密级 1<br>
请求示例二：不指定接收者，由用户填写访问策略<br>
```json
{
  "dept": ["0001", "0003"],
  "role": ["04"],
  "security": 2,
  "receiverAccounts": []
}
```
HTTP 数据包示例：<br>
```http request
POST /api/v1/documents/upload HTTP/1.1
Host: localhost:8080
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data; boundary=----WebKitFormBoundaryDemo

------WebKitFormBoundaryDemo
Content-Disposition: form-data; name="meta"
Content-Type: application/json

{
  "dept": ["0001", "0002"],
  "role": ["02", "04"],
  "security": 1,
  "receiverAccounts": ["00000002", "00000003"]
}
------WebKitFormBoundaryDemo
Content-Disposition: form-data; name="file"; filename="contract.pdf"
Content-Type: application/pdf

<binary file content>
------WebKitFormBoundaryDemo--
```
meta: 传递的接口参数，该部分 name 固定为 meta
file: 上传的文件，该部分的 name 固定为 file
接口返回 data ：<br>
```json
{
  "docTimestamp": "xxx",
  "filename": "xxx",
  "digest": {
    "plainSm3": "xxx",
    "cipherSm3": "xxx",
    "metaSm3": "xxx",
    "policySm3": "xxx",
    "envelopeSetSm3": "xxx"
  },
  "signatureId": "xxx"
}
```
docTimestamp: 文档对外暴露的时间戳标识，string 类型<br>
filename: 上传文件名称，string 类型<br>
digest: 文档摘要信息，object 类型<br>
plainSm3: 文档明文摘要，string 类型<br>
cipherSm3: 文档密文摘要，string 类型<br>
metaSm3: 文档元数据摘要，string 类型<br>
policySm3: 文档访问策略摘要，string 类型<br>
envelopeSetSm3: 文档密钥封装集合摘要，string 类型<br>
signatureId: 签名记录标识，string 类型<br>
```http request
GET /documents/sent
```
作用：查看当前用户发送过的文档<br>
请求参数：<br>
```text
page: 页码，int 类型，不填写则默认 1
size: 单页记录数，int 类型，不填写则默认 10
keyword: 文件名关键字， string 类型，不填写则默认 ""
```
接口返回 data ：<br>
```json
{
  "items": [
    {
      "docTimestamp": "xxx",
      "filename": "xxx",
      "dept": ["xxx", "xxx", "xxx"],
      "role": ["xxx", "xxx", "xxx"],
      "security": 1,
      "sentTime": "xxx"
    }
  ]
}
```
items: 文档列表，array 类型<br>
docTimestamp: 文档对外暴露的时间戳标识，string 类型<br>
filename: 文件名称，string 类型<br>
dept: 文档访问部门策略列表，array 类型<br>
role: 文档访问角色策略列表，array 类型<br>
security: 文档密级，int 类型，取值为 0-9 的一位数字，引用 security.level<br>
sentTime: 文档发送时间，string 类型<br>
```http request
GET /documents/inbox
```
作用：查看当前用户收到的且有权限访问的文档<br>
查询参数：<br>
```text
page: 页码，int 类型，不填写则默认 1
size: 单页记录数，int 类型，不填写则默认 10
keyword: 文件名关键字，string 类型，不填写则默认 ""
```
接口返回 data ：<br>
```json
{
  "items": [
    {
      "docTimestamp": "xxx",
      "filename": "xxx",
      "security": 1,
      "senderAccount": "xxx",
      "sentTime": "xxx"
    }
  ]
}
```
items: 文档列表，array 类型<br>
docTimestamp: 文档对外暴露的时间戳标识，string 类型<br>
filename: 文件名称，string 类型<br>
security: 文档密级，int 类型，取值为 0-9 的一位数字，引用 security.level<br>
senderAccount: 文档发送者账户，string 类型<br>
sentTime: 文档发送时间，string 类型<br>
```http request
GET /documents/detail
```
作用：查看文档元数据、元数据摘要<br>
查询参数：<br>
```text
docTimestamp: 文档对外暴露的时间戳标识
```
接口返回 data ：<br>
```json
{
  "docTimestamp": "xxx",
  "filename": "xxx",
  "size": 1111,
  "sentTime": "xxx",
  "status": "active",
  "senderAccount": "xxx",
  "security": 1,
  "dept": ["xxx", "xxx", "xxx"],
  "role": ["xxx", "xxx", "xxx"],
  "receiverAccounts": ["xxx", "xxx", "xxx"],
  "digest": {
    "plainSm3": "xxx",
    "cipherSm3": "xxx",
    "metaSm3": "xxx",
    "policySm3": "xxx",
    "envelopeSetSm3": "xxx"
  },
  "signature": {
    "sigId": "xxx",
    "alg": "SM9-Sign",
    "keyId": "xxx",
    "signedDigest": "xxx",
    "timestamp": "xxx",
    "nonce": "xxx",
    "signature": "xxx"
  }
}
```
docTimestamp: 文档对外暴露的时间戳标识，string 类型<br>
filename: 文件名称，string 类型<br>
size: 文件大小，long 类型<br>
sentTime: 文档发送时间，string 类型<br>
status: 文档状态，string 类型，active 表示可验证和下载<br>
senderAccount: 文档发送者账户，string 类型<br>
security: 文档密级，int 类型，取值为 0-9 的一位数字，引用 security.level<br>
dept: 文档访问部门策略列表，array 类型<br>
role: 文档访问角色策略列表，array 类型<br>
receiverAccounts: 文档接收者账户列表，array 类型<br>
digest: 文档摘要信息，object 类型<br>
plainSm3: 文档明文摘要，string 类型<br>
cipherSm3: 文档密文摘要，string 类型<br>
metaSm3: 文档元数据摘要，string 类型<br>
policySm3: 文档访问策略摘要，string 类型<br>
envelopeSetSm3: 文档密钥封装集合摘要，string 类型<br>
signature: 文档签名证据，object 类型<br>
sigId: 签名记录标识，string 类型<br>
alg: 签名算法，string 类型<br>
keyId: 签名密钥标识，string 类型<br>
signedDigest: 被签名的摘要，string 类型<br>
timestamp: 签名时间戳，string 类型<br>
nonce: 签名随机数，string 类型<br>
signature.signature: SM9 签名值，string 类型<br>
senderSignature: 旧版发送者签名兼容字段，完整签名证据以 signature_record 为准<br>
```http request
POST /documents/verify
```
作用：验证文档元数据、密文摘要以及发送者签名<br>
查询参数：<br>
```json
{
  "docTimestamp": "xxx"
}
```
docTimestamp: 文档对外暴露的时间戳标识，string 类型<br>
接口返回 data ：<br>
```json
{
  "plainSm3": true,
  "metaSm3": true,
  "policySm3": true,
  "cipherSm3": true,
  "envelopeSetSm3": true,
  "senderSignature": true,
  "timestamp": true,
  "nonce": true,
  "receiverEnvelope": true,
  "pass": true
}
```
plainSm3: 明文摘要是否验证通过，boolean 类型<br>
metaSm3: 元数据摘要是否验证通过，boolean 类型<br>
policySm3: 访问策略摘要是否验证通过，boolean 类型<br>
cipherSm3: 密文摘要是否验证通过，boolean 类型<br>
envelopeSetSm3: 密钥封装集合摘要是否验证通过，boolean 类型<br>
senderSignature: 发送者签名是否验证通过，boolean 类型<br>
timestamp: 签名时间戳是否验证通过，boolean 类型<br>
nonce: 签名随机数是否验证通过，boolean 类型<br>
receiverEnvelope: 当前用户密钥封装是否验证通过，boolean 类型<br>
pass: 文档整体是否验证通过，boolean 类型<br>
```http request
GET /documents/download
```
作用：下载文档<br>
查询参数：<br>
```text
docTimestamp: 文档对外暴露的时间戳标识
```
下载前校验顺序：访问策略校验、当前用户 `key_envelope` 查询、SM9 按当前接收者身份解封 DEK、密文 SM3、SM4-GCM 解密认证、明文 SM3、元数据摘要、策略摘要、envelope 集合摘要、SM9 签名绑定校验<br>
任一失败均不返回明文<br>
接口返回：文件流或 json ，当权限验证失败时，会返回 json<br>
```http request
POST /documents/status
```
作用：发送者更新本人文档状态。`active` 表示可验证和下载，`revoked` 表示撤销授权并拒绝验证/下载，`deleted` 表示软删除并拒绝验证/下载。接收者只能访问 `active` 文档<br>
权限：transfer:read，且当前用户必须是文档发送者<br>
请求参数：<br>
```json
{
  "docTimestamp": "xxx",
  "status": "revoked"
}
```
docTimestamp: 文档对外暴露的时间戳标识，string 类型<br>
status: 文档状态，string 类型，可选 active、revoked、deleted<br>
接口返回 data ：<br>
```json
{
  "docTimestamp": "xxx",
  "status": "revoked"
}
```
docTimestamp: 文档对外暴露的时间戳标识，string 类型<br>
status: 更新后的文档状态，string 类型<br>
```http request
POST /documents/delete
```
作用：发送者硬删除本人文档。删除数据库中的文档记录时，同时删除 `cipher_path` 指向的本地加密文件。区别于 `POST /documents/status` 的 `deleted` 软删除状态，本接口会物理删除文档记录和本地密文文件<br>
权限：transfer:read，且当前用户必须是文档发送者<br>
请求参数：<br>
```json
{
  "docTimestamp": "xxx"
}
```
docTimestamp: 文档对外暴露的时间戳标识，string 类型<br>
接口返回 data ：<br>
```json
{
  "delete": true
}
```
delete: 是否删除成功，boolean 类型<br>
文件传输接口新增 reason 字段约束如下<br>
```text
ENVELOPE_NOT_FOUND: 当前用户没有文档密钥封装记录
KEY_UNWRAP_FAILED: 当前用户身份无法解封文档密钥
SIGNATURE_BINDING_INVALID: 签名绑定内容、时间戳、nonce 或 SM9 签名校验失败
KEY_REVOKED: SM9 主密钥或用户密钥已撤销
KEY_EXPIRED: SM9 主密钥已过期
DOCUMENT_INACTIVE: 文档不是 active 状态，禁止验证或下载
```

## 管理员 API 说明
```http request
GET admin/users
```
作用：获取当前系统所有用户信息<br>
查询参数：<br>
```text
page: 页码，int 类型，不填写则默认 1
size: 单页记录数，int 类型，不填写则默认 10
account: 指定用户 account ，不填写则默认 "" 
```
接口返回 data ：<br>
```json
{
  "items": [
    {
      "account": "xxx",
      "username": "xxx",
      "security": 1,
      "role": "xxx",
      "dept": "xxx"
    }
  ]
}
```
items: 用户列表，array 类型<br>
account: 用户账户，string 类型<br>
username: 用户名，string 类型<br>
security: 用户密级，int 类型，取值为 0-9 的一位数字，引用 security.level<br>
role: 用户角色，string 类型<br>
dept: 用户所属部门，string 类型<br>
```http request
POST admin/users/add
```
作用：新增用户<br>
请求参数：<br>
```json
{
  "username": "xxx",
  "passwd": "xxx",
  "role": "xxx",
  "dept": "xxx",
  "security": 1
}
```
username: 新增用户的用户名，string 类型<br>
passwd: SM3 计算出来的密码摘要 string 类型<br>
role: 角色 id 标识符，string 类型<br>
dept: 部门 id 标识符，string 类型<br>
security: 密级，int 类型，取值为 0-9 的一位数字，引用 security.level<br>
接口返回 data ：<br>
```json
{
  "account": "xxx"
}
```
account: 后端生成的用户账户，string 类型<br>
```http request
POST admin/users/update
```
作用：更新指定用户信息<br>
请求参数：<br>
```json
{
  "account": "xxx",
  "username": "xxx",
  "passwd": "xxx",
  "dept": "xxx",
  "role": "xxx",
  "security": 1
}
```
account: 指定更新的用户账户，string 类型<br>
username: 更新后的用户名，string 类型<br>
passwd: 更新后的密码摘要，string 类型<br>
dept: 更新后的部门 id 标识符，string 类型<br>
role: 更新后的角色 id 标识符，string 类型<br>
security: 更新后的密级，int 类型，取值为 0-9 的一位数字，引用 security.level<br>
接口返回 data ：<br>
```json
{
  "update": true
}
```
update: 是否更新成功，boolean 类型<br>
```http request
POST admin/users/delete
```
作用：删除指定用户<br>
请求参数：<br>
```json
{
  "account": "xxx"
}
```
account: 指定删除的用户账户，string 类型<br>
接口返回 data ：<br>
```json
{
  "delete": true
}
```
delete: 是否删除成功，boolean 类型<br>
```http request
GET admin/roles
```
作用：获取当前系统内所有的角色<br>
请求参数：<br>
```text
page: 页码，int 类型，不填写则默认 1
size: 单页记录数，int 类型，不填写则默认 10
```
接口返回 data ：<br>
```json
{
  "items": [
    {"roleId": "xxx", "roleName": "xxx", "privileges": 11111}
  ]
}
```
items: 角色列表，array 类型<br>
roleId: 角色唯一标识符，string 类型<br>
roleName: 角色名称，string 类型<br>
privileges: 角色权限值，int 类型<br>
```http request
POST admin/roles/add
```
作用：新增角色<br>
请求参数：<br>
```json
{
  "roleName": "xxx",
  "privileges": 11111
}
```
roleName: 新增角色名称，string 类型<br>
privileges: 新增角色权限值，int 类型<br>
接口返回 data ：<br>
```json
{
  "add": true
}
```
add: 是否新增成功，boolean 类型<br>
```http request
POST admin/roles/update
```
作用：修改角色信息<br>
请求参数：<br>
```json
{
  "roleId": "xxx",
  "roleName": "xxx",
  "privileges": 11111
}
```
roleId: 指定修改的角色唯一标识符，string 类型<br>
roleName: 修改后的角色名称，string 类型<br>
privileges: 修改后的角色权限值，int 类型<br>
接口返回 data ：<br>
```json
{
  "update": true
}
```
update: 是否更新成功，boolean 类型<br>
```http request
POST admin/roles/delete
```
作用：删除指定角色<br>
请求参数：<br>
```json
{
  "roleId": "xxx"
}
```
roleId: 指定删除的角色唯一标识符，string 类型<br>
接口返回 data ：<br>
```json
{
  "delete": true
}
```
delete: 是否删除成功，boolean 类型<br>
```http request
GET admin/dept
```
作用：获取当前系统内的所有部门信息<br>
请求参数：<br>
```text
page: 页码，int 类型，不填写则默认 1
size: 单页记录数，int 类型，不填写则默认 10
```
接口返回 data ：<br>
```json
{
  "items": [
    {"deptId": "xxx", "deptName": "xxx"}
  ]
}
```
items: 部门列表，array 类型<br>
deptId: 部门唯一标识符，string 类型<br>
deptName: 部门名称，string 类型<br>
```http request
POST admin/dept/add
```
作用：新增部门<br>
请求参数：<br>
```json
{
  "deptName": "xxx"
}
```
deptName: 新增部门名称，string 类型<br>
接口返回 data ：<br>
```json
{
  "add": true
}
```
add: 是否新增成功，boolean 类型<br>
```http request
POST admin/dept/update
```
作用：修改部门信息<br>
请求参数：<br>
```json
{
  "deptId": "xxx",
  "deptName": "xxx"
}
```
deptId: 指定修改的部门唯一标识符，string 类型<br>
deptName: 修改后的部门名称，string 类型<br>
接口返回 data ：<br>
```json
{
  "update": true
}
```
update: 是否更新成功，boolean 类型<br>
```http request
POST admin/dept/delete
```
作用：删除指定部门<br>
请求参数：<br>
```json
{
  "deptId": "xxx"
}
```
deptId: 指定删除的部门唯一标识符，string 类型<br>
接口返回 data ：<br>
```json
{
  "delete": true
}
```
delete: 是否删除成功，boolean 类型<br>

```http request
GET admin/key/sm9
```
作用：查询 SM9 主密钥生命周期记录，不返回主私钥或私钥密文<br>
权限：key:manage<br>
查询参数：<br>
```text
usageType: 主密钥用途，可选 enc、sign，不填写则返回全部
```
接口返回 data ：<br>
```json
{
  "items": [
    {
      "keyId": "sm9-enc-20260528190000000",
      "usageType": "enc",
      "status": "active",
      "wrappingAlg": "CERT-RSA-OAEP-SM4-GCM",
      "wrappingKeyId": "jwt-localhost-20260331",
      "createdAt": "2026-05-28T19:00:00",
      "notBefore": "2026-05-28T19:00:00",
      "notAfter": "2027-05-28T19:00:00",
      "retiredAt": "",
      "revokedAt": ""
    }
  ]
}
```
keyId: SM9 主密钥标识符，string 类型<br>
usageType: 主密钥用途，enc 表示密钥封装，sign 表示签名，string 类型<br>
status: 主密钥状态，active、retired、rotating、revoked，string 类型<br>
wrappingAlg: 主私钥包装算法，string 类型<br>
wrappingKeyId: 包装主私钥所用证书的 key id，string 类型<br>
createdAt/notBefore/notAfter/retiredAt/revokedAt: 生命周期时间，string 类型，可为空字符串<br>

```http request
POST admin/key/sm9/rotate-enc
```
作用：正常轮换 SM9 加密主密钥。后端生成新的 SM9 enc 主密钥，用证书公钥包装主私钥并写入 `sm9_master_key`，再用旧 SM9 主密钥解封每个 `key_envelope.encrypted_dek` 得到 DEK，使用新 SM9 主密钥重新封装 DEK，最后更新 envelope 摘要、文档摘要、SM4 keyId 绑定和签名记录。该接口不返回任何主密钥或 DEK 明文。<br>
权限：key:manage<br>
请求参数：无<br>
接口返回 data ：<br>
```json
{
  "oldKeyId": "sm9-enc-20260528180000000",
  "newKeyId": "sm9-enc-20260528190000000",
  "status": "SUCCESS",
  "rewrappedEnvelopeCount": 12,
  "updatedDocumentCount": 6,
  "resignedDocumentCount": 6
}
```
oldKeyId: 轮换前 active 的 SM9 加密主密钥标识符<br>
newKeyId: 新生成并激活的 SM9 加密主密钥标识符<br>
rewrappedEnvelopeCount: 已重新封装的 envelope 数量<br>
updatedDocumentCount: 摘要/SM4 keyId 绑定已更新的文档数量<br>
resignedDocumentCount: 已重新签名的文档数量<br>
说明：该接口用于正常轮换，SM4 文件密钥和密文文件不变；如果旧 SM9 主密钥已经泄露，应执行更重的吊销流程，即重新生成 SM4 DEK、重新加密文件、重新生成 envelope 和签名。<br>

## 日志审计 API 说明
```http request
GET /audit/logs
```
作用：查询系统所有关键操作日志<br>
请求参数：<br>
```text
page: 页码，int 类型，不填写则默认 1
size: 单页记录数，int 类型，不填写则默认 10
account: 操作人员账户，string 类型，不填写则默认 ""
action: 操作类型，string 类型，不填写则默认 ""
```
接口返回 data ：<br>
```json
{
  "items": [
    {
      "logId": 1,
      "time": "xxx",
      "account": "xxx",
      "action": "xxx",
      "detail": "xxx",
      "status": "xxx",
      "reason": "xxx",
      "prevHash": "xxx",
      "logHash": "xxx"
    }
  ]
}
```
items: 审计日志列表，array 类型<br>
logId: 审计日志 id，long 类型<br>
time: 操作时间，string 类型<br>
account: 操作人员账户，string 类型<br>
action: 操作类型，string 类型<br>
detail: 操作详情，string 类型<br>
status: 操作结果状态，string 类型<br>
reason: 操作失败原因，string 类型<br>
prevHash: 前一条日志 hash，string 类型<br>
logHash: 当前日志 hash，string 类型<br>
```http request
POST /audit/verify
```
作用：验证日志 hash 链<br>
请求参数：<br>
```json
{
  "fromId": 111,
  "toId": 222
}
```
fromId: 起始日志 id，long 类型<br>
toId: 结束日志 id，long 类型<br>
接口返回 data ：<br>
```json
{
  "pass": true,
  "checkedCount": 1111,
  "firstBrokenId": 1111
}
```
pass: 日志 hash 链是否验证通过，boolean 类型<br>
checkedCount: 已检查的日志数量，int 类型<br>
firstBrokenId: 第一条验证失败的日志 id，long 类型<br>
```http request
GET /audit/download
```
作用：导出审计日志<br>
请求参数：<br>
```text
fromId: 起始日志 id
toId: 结束日志 id
```
接口返回 data ：<br>
返回数据流或 json ，失败时会返回 json
