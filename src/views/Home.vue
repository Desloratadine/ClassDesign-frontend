<template>
  <div class="page-container">
    <div class="page-header">
      <h2>欢迎使用文档安全传输系统</h2>
    </div>

    <el-row :gutter="20">
      <el-col :span="8">
        <el-card shadow="hover" @click="$router.push('/upload')" class="home-card">
          <div class="card-icon" style="background: #ecf5ff; color: #409eff">
            <el-icon :size="32"><Upload /></el-icon>
          </div>
          <div class="card-info">
            <h3>文档上传</h3>
            <p>加密上传文档，配置访问策略</p>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" @click="$router.push('/sent')" class="home-card">
          <div class="card-icon" style="background: #f0f9eb; color: #67c23a">
            <el-icon :size="32"><Promotion /></el-icon>
          </div>
          <div class="card-info">
            <h3>已发送</h3>
            <p>管理已发送的文档</p>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover" @click="$router.push('/inbox')" class="home-card">
          <div class="card-icon" style="background: #fdf6ec; color: #e6a23c">
            <el-icon :size="32"><Message /></el-icon>
          </div>
          <div class="card-info">
            <h3>收件箱</h3>
            <p>查看收到的加密文档</p>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="mt-20">
      <template #header>
        <span>系统说明</span>
      </template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="加密算法">SM4-GCM 对称加密</el-descriptions-item>
        <el-descriptions-item label="哈希算法">SM3 密码杂凑</el-descriptions-item>
        <el-descriptions-item label="密钥封装">SM9 标识密码算法</el-descriptions-item>
        <el-descriptions-item label="数字签名">SM9 签名算法</el-descriptions-item>
        <el-descriptions-item label="当前用户">{{ authStore.user?.username }}</el-descriptions-item>
        <el-descriptions-item label="账户">{{ authStore.user?.account }}</el-descriptions-item>
        <el-descriptions-item label="密级">
          <el-tag :color="getSecurityColor(authStore.user?.security ?? 0)" effect="dark" size="small" style="border: none">
            {{ authStore.user?.security }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="部门">{{ authStore.user?.dept }}</el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { Upload, Promotion, Message } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { getSecurityColor } from '@/utils'

const authStore = useAuthStore()
</script>

<style scoped>
.home-card {
  cursor: pointer;
  transition: transform 0.2s;
}

.home-card:hover {
  transform: translateY(-4px);
}

.home-card :deep(.el-card__body) {
  display: flex;
  align-items: center;
  gap: 16px;
}

.card-icon {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-info h3 {
  font-size: 16px;
  margin-bottom: 4px;
  color: #303133;
}

.card-info p {
  font-size: 13px;
  color: #909399;
}

.mt-20 {
  margin-top: 20px;
}
</style>