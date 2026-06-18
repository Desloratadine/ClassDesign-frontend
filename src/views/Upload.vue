<template>
  <div class="page-container">
    <div class="page-header">
      <h2>文档上传</h2>
    </div>

    <el-card>
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        label-position="right"
      >
        <!-- 文件选择 -->
        <el-form-item label="选择文件" prop="file">
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :limit="1"
            :on-change="handleFileChange"
            :on-remove="handleFileRemove"
            :before-upload="() => false"
            drag
            accept="*"
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或<em>点击上传</em>
            </div>
          </el-upload>
        </el-form-item>

        <!-- 接收者选择 -->
        <el-form-item label="接收者">
          <el-select
            v-model="form.receiverAccounts"
            multiple
            filterable
            placeholder="选择接收者（留空则不指定固定接收者）"
            style="width: 100%"
            @change="onReceiverChange"
          >
            <el-option
              v-for="user in options.users"
              :key="user.account"
              :label="`${user.username} (${user.account}) - ${user.deptId} - 密级${user.security}`"
              :value="user.account"
            />
          </el-select>
        </el-form-item>

        <!-- 部门策略 -->
        <el-form-item label="允许部门" prop="dept">
          <el-select
            v-model="form.dept"
            multiple
            placeholder="选择允许访问的部门"
            style="width: 100%"
          >
            <el-option
              v-for="d in availableDepts"
              :key="d.deptId"
              :label="d.deptName"
              :value="d.deptId"
            />
          </el-select>
        </el-form-item>

        <!-- 角色策略 -->
        <el-form-item label="允许角色" prop="role">
          <el-select
            v-model="form.role"
            multiple
            placeholder="选择允许访问的角色"
            style="width: 100%"
          >
            <el-option
              v-for="r in availableRoles"
              :key="r.roleId"
              :label="r.roleName"
              :value="r.roleId"
            />
          </el-select>
        </el-form-item>

        <!-- 密级 -->
        <el-form-item label="文档密级" prop="security">
          <el-select
            v-model="form.security"
            placeholder="选择文档密级"
            style="width: 200px"
          >
            <el-option
              v-for="s in availableSecurity"
              :key="s.level"
              :label="`${s.label} (${s.level})`"
              :value="s.level"
            />
          </el-select>
          <span v-if="maxSecurity > 0" class="hint-text">
            接收者中最低密级为 {{ maxSecurity }}，密级不能超过此值
          </span>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            :loading="uploading"
            :disabled="!selectedFile"
            size="large"
            @click="handleUpload"
          >
            上传并加密
          </el-button>
          <el-button @click="resetForm" :disabled="uploading">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 上传进度 -->
      <div v-if="uploading" class="progress-wrap">
        <el-progress :percentage="progress" :stroke-width="20" :text-inside="true" />
      </div>
    </el-card>

    <!-- 上传结果 -->
    <el-card v-if="uploadResult" class="mt-20">
      <template #header>
        <span>上传结果</span>
      </template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="文档时间戳">
          <span class="hash-value">{{ uploadResult.docTimestamp }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="文件名">{{ uploadResult.filename }}</el-descriptions-item>
        <el-descriptions-item label="明文 SM3">
          <span class="hash-value">{{ uploadResult.digest.plainSm3 }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="密文 SM3">
          <span class="hash-value">{{ uploadResult.digest.cipherSm3 }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="元数据 SM3">
          <span class="hash-value">{{ uploadResult.digest.metaSm3 }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="策略 SM3">
          <span class="hash-value">{{ uploadResult.digest.policySm3 }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="密钥封装集合 SM3">
          <span class="hash-value">{{ uploadResult.digest.envelopeSetSm3 }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="签名 ID">
          <span class="hash-value">{{ uploadResult.signatureId }}</span>
        </el-descriptions-item>
      </el-descriptions>
      <div class="mt-20">
        <el-button type="primary" @click="$router.push(`/document/${uploadResult.docTimestamp}`)">
          查看详情
        </el-button>
        <el-button @click="resetResult">继续上传</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules, UploadFile, UploadInstance } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'
import { getUploadOptions, uploadDocument } from '@/api/documents'
import type { UploadOptions, UploadResponse } from '@/types'

const formRef = ref<FormInstance>()
const uploadRef = ref<UploadInstance>()
const options = ref<UploadOptions>({ dept: [], role: [], security: [], users: [] })
const selectedFile = ref<File | null>(null)
const uploading = ref(false)
const progress = ref(0)
const uploadResult = ref<UploadResponse | null>(null)

const form = reactive({
  dept: [] as string[],
  role: [] as string[],
  security: null as number | null,
  receiverAccounts: [] as string[],
})

const maxSecurity = ref(0)

// 当选择了接收者时，限制可选部门/角色/密级
const availableDepts = computed(() => {
  if (form.receiverAccounts.length === 0) return options.value.dept
  const allowedIds = new Set<string>()
  form.receiverAccounts.forEach((acc) => {
    const user = options.value.users.find((u) => u.account === acc)
    if (user) allowedIds.add(user.deptId)
  })
  return options.value.dept.filter((d) => allowedIds.has(d.deptId))
})

const availableRoles = computed(() => {
  if (form.receiverAccounts.length === 0) return options.value.role
  const allowedIds = new Set<string>()
  form.receiverAccounts.forEach((acc) => {
    const user = options.value.users.find((u) => u.account === acc)
    if (user) allowedIds.add(user.roleId)
  })
  return options.value.role.filter((r) => allowedIds.has(r.roleId))
})

const availableSecurity = computed(() => {
  if (form.receiverAccounts.length === 0 || maxSecurity.value === 0)
    return options.value.security
  return options.value.security.filter((s) => s.level <= maxSecurity.value)
})

const rules: FormRules = {
  dept: [
    {
      validator: (_rule, _value, callback) => {
        if (form.receiverAccounts.length === 0 && form.dept.length === 0) {
          callback(new Error('请选择至少一个允许部门'))
        } else {
          callback()
        }
      },
      trigger: 'change',
    },
  ],
  role: [
    {
      validator: (_rule, _value, callback) => {
        if (form.receiverAccounts.length === 0 && form.role.length === 0) {
          callback(new Error('请选择至少一个允许角色'))
        } else {
          callback()
        }
      },
      trigger: 'change',
    },
  ],
  security: [
    {
      validator: (_rule, _value, callback) => {
        if (form.receiverAccounts.length === 0 && form.security === null) {
          callback(new Error('请选择文档密级'))
        } else if (form.security !== null && maxSecurity.value > 0 && form.security > maxSecurity.value) {
          callback(new Error(`密级不能超过接收者最低密级 ${maxSecurity.value}`))
        } else {
          callback()
        }
      },
      trigger: 'change',
    },
  ],
}

function onReceiverChange() {
  if (form.receiverAccounts.length > 0) {
    const selectedUsers = form.receiverAccounts
      .map((acc) => options.value.users.find((u) => u.account === acc))
      .filter(Boolean)

    // 计算最低密级
    const levels = selectedUsers.map((u) => u!.security)
    maxSecurity.value = levels.length > 0 ? Math.min(...levels) : 0

    // 自动填充接收者对应的部门和角色
    const deptIds = new Set(selectedUsers.map((u) => u!.deptId).filter(Boolean))
    form.dept = [...deptIds] as string[]

    const roleIds = new Set(selectedUsers.map((u) => u!.roleId).filter(Boolean))
    form.role = [...roleIds] as string[]

    // 自动设置密级为最低密级
    form.security = maxSecurity.value

    if (form.security !== null && form.security > maxSecurity.value) {
      form.security = null
    }
  } else {
    maxSecurity.value = 0
  }
}

function handleFileChange(file: UploadFile) {
  selectedFile.value = file.raw ?? null
}

function handleFileRemove() {
  selectedFile.value = null
}

async function handleUpload() {
  if (!selectedFile.value) {
    ElMessage.warning('请选择文件')
    return
  }

  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  uploading.value = true
  progress.value = 0
  try {
    const result = await uploadDocument(
      selectedFile.value,
      {
        dept: form.dept,
        role: form.role,
        security: form.security ?? 0,
        receiverAccounts: form.receiverAccounts,
      },
      (p) => {
        progress.value = p
      }
    )
    uploadResult.value = result
    ElMessage.success('上传成功')
  } catch (e: any) {
    console.error('上传失败，详细错误:', e)
    console.error('错误响应:', e?.response?.data)
    ElMessage.error(e?.response?.data?.reason || e?.message || '请求失败')
  } finally {
    uploading.value = false
  }
}

function resetForm() {
  formRef.value?.resetFields()
  uploadRef.value?.clearFiles()
  selectedFile.value = null
  form.dept = []
  form.role = []
  form.security = null
  form.receiverAccounts = []
  maxSecurity.value = 0
}

function resetResult() {
  uploadResult.value = null
  resetForm()
}

onMounted(async () => {
  try {
    options.value = await getUploadOptions()
  } catch {
    // ignore
  }
})
</script>

<style scoped>
.progress-wrap {
  margin-top: 20px;
}

.hint-text {
  font-size: 12px;
  color: #e6a23c;
  margin-left: 12px;
}

.mt-20 {
  margin-top: 20px;
}
</style>