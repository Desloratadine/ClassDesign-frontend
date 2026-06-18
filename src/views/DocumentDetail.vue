<template>
  <div class="page-container">
    <div class="page-header">
      <el-button text @click="$router.back()">
        <el-icon><ArrowLeft /></el-icon> 返回
      </el-button>
      <h2>文档详情</h2>
    </div>

    <div v-loading="loading">
      <!-- 基本信息 -->
      <el-card class="detail-section">
        <template #header>
          <div class="card-header">
            <span>基本信息</span>
            <el-tag
              :color="getStatusColor(detail.status)"
              effect="dark"
              size="small"
              style="border: none"
            >
              {{ getStatusText(detail.status) }}
            </el-tag>
          </div>
        </template>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="文档时间戳">
            <span class="hash-value">{{ detail.docTimestamp }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="文件名">{{ detail.filename }}</el-descriptions-item>
          <el-descriptions-item label="文件大小">{{ formatFileSize(detail.size) }}</el-descriptions-item>
          <el-descriptions-item label="发送者">{{ detail.senderAccount }}</el-descriptions-item>
          <el-descriptions-item label="发送时间">{{ detail.sentTime }}</el-descriptions-item>
          <el-descriptions-item label="密级">
            <el-tag
              :color="getSecurityColor(detail.security)"
              effect="dark"
              size="small"
              style="border: none"
            >
              {{ detail.security }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="允许部门">
            <el-tag v-for="d in detail.dept" :key="d" size="small" class="mr-4">{{ d }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="允许角色">
            <el-tag v-for="r in detail.role" :key="r" size="small" type="warning" class="mr-4">{{ r }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="接收者">
            <el-tag v-for="a in detail.receiverAccounts" :key="a" size="small" type="info" class="mr-4">{{ a }}</el-tag>
            <span v-if="detail.receiverAccounts.length === 0" style="color: #909399">不指定固定接收者</span>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 摘要信息 -->
      <el-card class="detail-section">
        <template #header><span>摘要信息</span></template>
        <el-descriptions :column="1" border>
          <el-descriptions-item label="明文 SM3">
            <span class="hash-value">{{ detail.digest.plainSm3 }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="密文 SM3">
            <span class="hash-value">{{ detail.digest.cipherSm3 }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="元数据 SM3">
            <span class="hash-value">{{ detail.digest.metaSm3 }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="策略 SM3">
            <span class="hash-value">{{ detail.digest.policySm3 }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="密钥封装集合 SM3">
            <span class="hash-value">{{ detail.digest.envelopeSetSm3 }}</span>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 签名信息 -->
      <el-card class="detail-section">
        <template #header><span>签名信息</span></template>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="签名 ID">
            <span class="hash-value">{{ detail.signature.sigId }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="算法">{{ detail.signature.alg }}</el-descriptions-item>
          <el-descriptions-item label="密钥 ID">
            <span class="hash-value">{{ detail.signature.keyId }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="被签名摘要">
            <span class="hash-value">{{ detail.signature.signedDigest }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="时间戳">{{ detail.signature.timestamp }}</el-descriptions-item>
          <el-descriptions-item label="随机数">
            <span class="hash-value">{{ detail.signature.nonce }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="SM9 签名值" :span="2">
            <span class="hash-value">{{ detail.signature.signature }}</span>
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 操作区 -->
      <el-card>
        <template #header><span>操作</span></template>
        <div class="action-buttons">
          <el-button type="primary" :loading="verifying" @click="handleVerify">
            <el-icon><Checked /></el-icon> 验证文档
          </el-button>
          <el-button
            type="success"
            :loading="downloading"
            :disabled="detail.status !== 'active'"
            @click="handleDownload"
          >
            <el-icon><Download /></el-icon> 下载文档
          </el-button>

          <!-- 发送者专用操作 -->
          <template v-if="isSender">
            <el-divider direction="vertical" />
            <el-button
              v-if="detail.status !== 'active'"
              type="primary"
              @click="handleChangeStatus('active')"
            >
              恢复为活跃
            </el-button>
            <el-button
              v-if="detail.status === 'active'"
              type="warning"
              @click="handleChangeStatus('revoked')"
            >
              撤销
            </el-button>
            <el-button
              v-if="detail.status === 'active' || detail.status === 'revoked'"
              type="danger"
              @click="handleChangeStatus('deleted')"
            >
              软删除
            </el-button>
            <el-button type="danger" plain @click="handleHardDelete">
              硬删除
            </el-button>
          </template>
        </div>
      </el-card>

      <!-- 验证结果弹窗 -->
      <el-dialog v-model="verifyVisible" title="文档验证结果" width="500px">
        <div v-if="verifyResult" class="verify-list">
          <div class="verify-item" v-for="item in verifyItems" :key="item.key">
            <el-icon v-if="item.value" color="#67c23a" :size="20"><CircleCheckFilled /></el-icon>
            <el-icon v-else color="#f56c6c" :size="20"><CircleCloseFilled /></el-icon>
            <span class="label">{{ item.label }}</span>
          </div>
          <el-divider />
          <div class="verify-result-total">
            <el-icon
              :color="verifyResult.pass ? '#67c23a' : '#f56c6c'"
              :size="28"
            >
              <CircleCheckFilled v-if="verifyResult.pass" />
              <CircleCloseFilled v-else />
            </el-icon>
            <span :style="{ color: verifyResult.pass ? '#67c23a' : '#f56c6c', fontSize: '18px', fontWeight: 'bold' }">
              {{ verifyResult.pass ? '验证全部通过' : '验证未通过' }}
            </span>
          </div>
        </div>
      </el-dialog>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import {
  ArrowLeft, Checked, Download, CircleCheckFilled, CircleCloseFilled,
} from '@element-plus/icons-vue'
import {
  getDocumentDetail,
  verifyDocument,
  downloadDocument,
  updateDocumentStatus,
  deleteDocument,
} from '@/api/documents'
import { useAuthStore } from '@/stores/auth'
import { getSecurityColor, getStatusText, getStatusColor, formatFileSize } from '@/utils'
import type { DocumentDetail, VerifyResult } from '@/types'

const route = useRoute()
const authStore = useAuthStore()
const loading = ref(false)
const verifying = ref(false)
const downloading = ref(false)
const verifyVisible = ref(false)
const detail = ref<DocumentDetail>({
  docTimestamp: '',
  filename: '',
  size: 0,
  sentTime: '',
  status: 'active',
  senderAccount: '',
  security: 0,
  dept: [],
  role: [],
  receiverAccounts: [],
  digest: { plainSm3: '', cipherSm3: '', metaSm3: '', policySm3: '', envelopeSetSm3: '' },
  signature: { sigId: '', alg: '', keyId: '', signedDigest: '', timestamp: '', nonce: '', signature: '' },
})
const verifyResult = ref<VerifyResult | null>(null)

const isSender = computed(() => {
  return authStore.user?.account === detail.value.senderAccount
})

const verifyItems = computed(() => {
  if (!verifyResult.value) return []
  return [
    { key: 'plainSm3', label: '明文摘要校验', value: verifyResult.value.plainSm3 },
    { key: 'metaSm3', label: '元数据摘要校验', value: verifyResult.value.metaSm3 },
    { key: 'policySm3', label: '策略摘要校验', value: verifyResult.value.policySm3 },
    { key: 'cipherSm3', label: '密文摘要校验', value: verifyResult.value.cipherSm3 },
    { key: 'envelopeSetSm3', label: '密钥封装集合摘要校验', value: verifyResult.value.envelopeSetSm3 },
    { key: 'senderSignature', label: '发送者签名校验', value: verifyResult.value.senderSignature },
    { key: 'timestamp', label: '时间戳校验', value: verifyResult.value.timestamp },
    { key: 'nonce', label: '随机数校验', value: verifyResult.value.nonce },
    { key: 'receiverEnvelope', label: '接收者密钥封装校验', value: verifyResult.value.receiverEnvelope },
  ]
})

async function fetchDetail() {
  loading.value = true
  try {
    detail.value = await getDocumentDetail(route.params.docTimestamp as string)
  } catch {
    // ignore
  } finally {
    loading.value = false
  }
}

async function handleVerify() {
  verifying.value = true
  try {
    verifyResult.value = await verifyDocument(detail.value.docTimestamp)
    verifyVisible.value = true
  } catch {
    // ignore
  } finally {
    verifying.value = false
  }
}

async function handleDownload() {
  downloading.value = true
  try {
    const blob = await downloadDocument(detail.value.docTimestamp)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = detail.value.filename
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('下载成功')
  } catch {
    // ignore
  } finally {
    downloading.value = false
  }
}

async function handleChangeStatus(status: 'active' | 'revoked' | 'deleted') {
  const labels: Record<string, string> = { active: '恢复为活跃', revoked: '撤销', deleted: '软删除' }
  try {
    await ElMessageBox.confirm(
      `确定要${labels[status]}文档「${detail.value.filename}」吗？`,
      '确认操作',
      { type: 'warning' }
    )
    await updateDocumentStatus({ docTimestamp: detail.value.docTimestamp, status })
    ElMessage.success('操作成功')
    fetchDetail()
  } catch (e: any) {
    if (e !== 'cancel') {
      // ignore
    }
  }
}

async function handleHardDelete() {
  try {
    await ElMessageBox.confirm(
      `确定要物理删除文档「${detail.value.filename}」吗？此操作不可恢复，将同时删除密文文件。`,
      '确认硬删除',
      { type: 'error', confirmButtonText: '确定删除', cancelButtonText: '取消' }
    )
    await deleteDocument(detail.value.docTimestamp)
    ElMessage.success('删除成功')
    window.history.back()
  } catch (e: any) {
    if (e !== 'cancel') {
      // ignore
    }
  }
}

onMounted(() => {
  fetchDetail()
})
</script>

<style scoped>
.action-buttons {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.verify-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.verify-result-total {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 12px 0;
}

.mr-4 {
  margin-right: 4px;
}
</style>