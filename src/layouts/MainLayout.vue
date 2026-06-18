<template>
  <el-container class="main-layout">
    <el-aside :width="isCollapse ? '64px' : '220px'" class="sidebar">
      <div class="logo" @click="goHome">
        <el-icon :size="24"><Lock /></el-icon>
        <span v-show="!isCollapse" class="logo-text">文档安全系统</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        :collapse="isCollapse"
        background-color="#1a365d"
        text-color="#bfcbd9"
        active-text-color="#409eff"
      >
        <el-menu-item index="/home">
          <el-icon><HomeFilled /></el-icon>
          <span>首页</span>
        </el-menu-item>
        <el-menu-item v-if="authStore.hasPrivilege('file:upload')" index="/upload">
          <el-icon><Upload /></el-icon>
          <span>文档上传</span>
        </el-menu-item>
        <el-menu-item v-if="authStore.hasPrivilege('transfer:read')" index="/sent">
          <el-icon><Promotion /></el-icon>
          <span>已发送</span>
        </el-menu-item>
        <el-menu-item v-if="authStore.hasPrivilege('doc:receive')" index="/inbox">
          <el-icon><Message /></el-icon>
          <span>收件箱</span>
        </el-menu-item>

        <el-sub-menu v-if="hasAdminAccess" index="admin">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>管理后台</span>
          </template>
          <el-menu-item v-if="authStore.hasPrivilege('user:manage')" index="/admin/users">用户管理</el-menu-item>
          <el-menu-item v-if="authStore.hasPrivilege('role:manage')" index="/admin/roles">角色管理</el-menu-item>
          <el-menu-item v-if="authStore.hasPrivilege('dept:manage')" index="/admin/depts">部门管理</el-menu-item>
          <el-menu-item v-if="authStore.hasPrivilege('key:manage')" index="/admin/sm9">SM9 密钥</el-menu-item>
          <el-menu-item v-if="authStore.hasPrivilege('audit:hash:verify') || authStore.hasPrivilege('audit:report:export')" index="/admin/audit">审计日志</el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-button
            text
            @click="isCollapse = !isCollapse"
          >
            <el-icon :size="20"><Fold v-if="!isCollapse" /><Expand v-else /></el-icon>
          </el-button>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/home' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="pageTitle">{{ pageTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-tag :color="securityColor" effect="dark" size="small" style="border: none">
            密级 {{ authStore.user?.security }}
          </el-tag>
          <el-dropdown trigger="click">
            <span class="user-info">
              <el-icon><UserFilled /></el-icon>
              {{ authStore.user?.username }}
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item disabled>
                  账户: {{ authStore.user?.account }}
                </el-dropdown-item>
                <el-dropdown-item disabled>
                  角色: {{ authStore.user?.roleId || authStore.user?.role }}
                </el-dropdown-item>
                <el-dropdown-item disabled>
                  部门: {{ authStore.user?.deptId || authStore.user?.dept }}
                </el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">
                  <span style="color: #f56c6c">退出登录</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import {
  Lock, HomeFilled, Upload, Promotion, Message, Setting,
  Fold, Expand, UserFilled, ArrowDown,
} from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { getSecurityColor } from '@/utils'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const isCollapse = ref(false)

const activeMenu = computed(() => route.path)
const pageTitle = computed(() => route.meta.title as string | undefined)
const securityColor = computed(() => getSecurityColor(authStore.user?.security ?? 0))
const hasAdminAccess = computed(() => {
  if (authStore.isAdmin()) return true
  const adminPrivileges = ['user:manage', 'role:manage', 'dept:manage', 'key:manage', 'audit:hash:verify', 'audit:report:export']
  return adminPrivileges.some(p => authStore.hasPrivilege(p))
})

function goHome() {
  router.push('/home')
}

async function handleLogout() {
  await ElMessageBox.confirm('确定要退出登录吗？', '提示', { type: 'warning' })
  await authStore.logout()
  router.push('/login')
}

onMounted(() => {
  authStore.loadUserFromCache()
  if (!authStore.user) {
    authStore.fetchUser().catch(() => {
      router.push('/login')
    })
  }
})
</script>

<style scoped>
.main-layout {
  height: 100vh;
}

.sidebar {
  background-color: #1a365d;
  overflow: hidden;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 60px;
  color: #fff;
  cursor: pointer;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo-text {
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  padding: 0 20px;
  height: 60px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: #303133;
  font-size: 14px;
}

.main-content {
  background: #f0f2f5;
  overflow-y: auto;
}
</style>