<template>
  <el-container class="layout-container">
    <el-header class="layout-header">
      <div class="header-left">
        <span class="system-title">文档安全传输系统</span>
      </div>
      <div class="header-right">
        <span v-if="userStore.userInfo" class="user-info">
          {{ userStore.userInfo.username }} ({{ userStore.userInfo.account }})
        </span>
        <el-button type="danger" size="small" @click="handleLogout">退出登录</el-button>
      </div>
    </el-header>
    <el-container class="layout-body">
      <el-aside width="220px" class="layout-aside">
        <el-menu
          :router="true"
          :default-active="route.path"
          class="sidebar-menu"
        >
          <el-menu-item-group title="文件传输">
            <el-menu-item index="/documents/upload">
              <el-icon><Upload /></el-icon>
              <span>上传文档</span>
            </el-menu-item>
            <el-menu-item index="/documents/sent">
              <el-icon><Message /></el-icon>
              <span>已发送</span>
            </el-menu-item>
            <el-menu-item index="/documents/inbox">
              <el-icon><FolderOpened /></el-icon>
              <span>收件箱</span>
            </el-menu-item>
          </el-menu-item-group>
        </el-menu>
      </el-aside>
      <el-main class="layout-main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import { logoutApi } from '@/api/auth'
import { Upload, FolderOpened, Message } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

async function handleLogout() {
  try {
    await logoutApi()
  } catch {
    // ignore logout error
  }
  userStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.layout-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #409eff;
  color: #fff;
  padding: 0 20px;
}

.system-title {
  font-size: 18px;
  font-weight: bold;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-info {
  font-size: 14px;
}

.layout-body {
  height: calc(100vh - 60px);
}

.layout-aside {
  background: #f5f7fa;
  border-right: 1px solid #e4e7ed;
}

.sidebar-menu {
  border-right: none;
}

.layout-main {
  background: #fff;
  padding: 20px;
}
</style>