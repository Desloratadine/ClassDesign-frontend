<template>
  <div class="welcome-page">
    <el-result icon="success" title="登录成功" :sub-title="`当前角色：${userStore.userInfo?.role ?? '未知'}`">
      <template #extra>
        <p class="user-info-text">
          欢迎回来，{{ userStore.userInfo?.username }}
        </p>
      </template>
    </el-result>
  </div>
</template>

<script setup lang="ts">
import { useUserStore } from '@/store/user'

const userStore = useUserStore()
</script>

<style scoped>
.welcome-page {
  display: flex;
  justify-content: center;
  align-items: center;
  height: calc(100vh - 120px);
}
.user-info-text {
  color: #909399;
  font-size: 14px;
}
</style>