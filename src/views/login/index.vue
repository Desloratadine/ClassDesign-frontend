<template>
  <div class="login-page">
    <div class="login-card">
      <h2 class="login-title">文档安全传输系统</h2>

      <!-- 登录错误提示 -->
      <el-alert
        v-if="loginError"
        :title="loginError"
        type="error"
        show-icon
        closable
        class="login-error-alert"
        @close="loginError = ''"
      />

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
        @keyup.enter="handleLogin"
      >
        <el-form-item label="账户" prop="account">
          <el-input
            v-model="form.account"
            placeholder="请输入8位数字账户"
            maxlength="8"
            @input="loginError = ''"
          />
        </el-form-item>
        <el-form-item label="密码" prop="passwd">
          <el-input
            v-model="form.passwd"
            type="password"
            show-password
            placeholder="请输入密码"
            @input="loginError = ''"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" class="login-btn" @click="handleLogin">
            {{ loading ? '登录中...' : '登录' }}
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { loginApi } from '@/api/auth'
import { useUserStore } from '@/store/user'

const router = useRouter()
const userStore = useUserStore()

const formRef = ref<FormInstance>()
const loading = ref(false)
const loginError = ref('')

const form = reactive({
  account: '',
  passwd: ''
})

const rules: FormRules = {
  account: [
    { required: true, message: '请输入账户', trigger: 'blur' },
    { pattern: /^\d{8}$/, message: '账户必须为8位数字', trigger: 'blur' }
  ],
  passwd: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

/** 登录错误提示文案映射 */
const loginErrorMessages: Record<string, string> = {
  UNAUTHORIZED: '账户或密码错误',
  VALIDATION_ERROR: '参数格式不正确',
  NOT_FOUND: '账户不存在',
  FORBIDDEN: '账户已被禁用',
  SERVER_ERROR: '服务异常，请稍后重试'
}

function getLoginErrorMessage(reason: string): string {
  return loginErrorMessages[reason] || reason || '登录失败，请重试'
}

async function handleLogin() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  loginError.value = ''
  try {
    // 前端使用 SM3 对密码进行摘要处理
    const passwdHash = await sm3(form.passwd)
    const res = await loginApi({ account: form.account, passwd: passwdHash })
    const data = (res as any).data
    userStore.setToken(data.token)
    userStore.setUserInfo(data)
    ElMessage.success('登录成功')

    // 根据角色跳转到不同页面
    if (data.role === 'admin') {
      router.push('/admin/dashboard')
    } else {
      router.push('/documents/inbox')
    }
  } catch (err: any) {
    // 从错误中提取 reason 字段
    const reason = err?.reason || err?.message || ''
    loginError.value = getLoginErrorMessage(reason)
    // ElMessage.error 已在拦截器中统一处理，此处不重复提示
  } finally {
    loading.value = false
  }
}

// SM3 哈希（简易实现，生产环境建议使用 sm-crypto 库）
async function sm3(input: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(input)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}
</script>

<style scoped>
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-card {
  width: 400px;
  padding: 40px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.login-title {
  text-align: center;
  margin-bottom: 30px;
  color: #303133;
  font-size: 22px;
}

.login-btn {
  width: 100%;
}

.login-error-alert {
  margin-bottom: 20px;
}
</style>