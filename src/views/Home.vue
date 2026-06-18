<template>
  <div class="page-container">
    <div class="page-header">
      <h2>欢迎使用文档安全传输系统</h2>
    </div>

    <el-card>
      <template #header>
        <span>系统说明</span>
      </template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="加密算法">SM4-GCM 对称加密</el-descriptions-item>
        <el-descriptions-item label="哈希算法">SM3 密码杂凑</el-descriptions-item>
        <el-descriptions-item label="密钥封装">SM9 标识密码算法</el-descriptions-item>
        <el-descriptions-item label="数字签名">SM9 签名算法</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <el-card class="mt-20">
      <template #header>
        <span>用户信息</span>
      </template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="当前用户">{{ authStore.user?.username }}</el-descriptions-item>
        <el-descriptions-item label="账户">{{ authStore.user?.account }}</el-descriptions-item>
        <el-descriptions-item label="密级">
          <el-tag :color="getSecurityColor(authStore.user?.security ?? 0)" effect="dark" size="small" style="border: none">
            {{ authStore.user?.security }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="部门">{{ authStore.user?.dept }}</el-descriptions-item>
        <el-descriptions-item label="角色">{{ authStore.user?.roleId }}</el-descriptions-item>
        <el-descriptions-item label="权限">
          <div class="privileges-tags">
            <el-tag v-for="perm in privilegeList" :key="perm" size="small" type="info" effect="plain">{{ perm }}</el-tag>
            <span v-if="privilegeList.length === 0" class="text-muted">无特殊权限</span>
          </div>
        </el-descriptions-item>
      </el-descriptions>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { getSecurityColor } from '@/utils'

const authStore = useAuthStore()

/** 当前用户拥有的所有权限列表 */
const privilegeList = computed(() => {
  const p = authStore.user?.privileges
  if (!p || !p.trim()) return [] as string[]
  return p.trim().split(/\s+/)
})
</script>

<style scoped>
.mt-20 {
  margin-top: 20px;
}

.privileges-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.text-muted {
  color: #909399;
  font-size: 13px;
}
</style>