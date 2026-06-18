<template>
  <div class="page-container">
    <div class="page-header">
      <h2>审计日志</h2>
      <div>
        <el-button type="primary" @click="handleVerifyChain">验证日志链</el-button>
        <el-button @click="handleExport">导出日志</el-button>
      </div>
    </div>

    <!-- 筛选条件 -->
    <el-card class="mb-20">
      <el-form :inline="true" :model="filters">
        <el-form-item label="账户">
          <el-input v-model="filters.account" placeholder="输入账户" clearable />
        </el-form-item>
        <el-form-item label="操作类型">
          <el-input v-model="filters.action" placeholder="输入操作类型" clearable />
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DDTHH:mm:ss"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card>
      <el-table :data="items" style="width: 100%" v-loading="loading" stripe>
        <el-table-column prop="logId" label="ID" width="70" />
        <el-table-column prop="account" label="账户" width="120" />
        <el-table-column prop="action" label="操作类型" width="150" />
        <el-table-column prop="detail" label="操作描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100" />
        <el-table-column prop="time" label="操作时间" width="180" />
        <el-table-column label="链式哈希" min-width="200">
          <template #default="{ row }">
            <span class="hash-value">{{ row.logHash }}</span>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrap">
        <span class="page-info">第 {{ page }} 页</span>
        <div class="page-btns">
          <el-button size="small" :disabled="page <= 1" @click="goPrev">
            <el-icon><ArrowLeft /></el-icon>
          </el-button>
          <el-button size="small" :disabled="!hasMore" @click="goNext">
            <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 验证结果弹窗 -->
    <el-dialog v-model="verifyVisible" title="日志链验证结果" width="450px">
      <div v-if="verifyResult" style="text-align: center">
        <el-icon
          :color="verifyResult.pass ? '#67c23a' : '#f56c6c'"
          :size="48"
        >
          <CircleCheckFilled v-if="verifyResult.pass" />
          <CircleCloseFilled v-else />
        </el-icon>
        <h3 :style="{ color: verifyResult.pass ? '#67c23a' : '#f56c6c', marginTop: '16px' }">
          {{ verifyResult.pass ? '哈希链验证通过' : '哈希链验证失败' }}
        </h3>
        <el-descriptions :column="1" border style="margin-top: 16px">
          <el-descriptions-item label="已检查日志数">{{ verifyResult.checkedCount }}</el-descriptions-item>
          <el-descriptions-item v-if="!verifyResult.pass" label="断链位置">
            <span style="color: #f56c6c">日志 ID: {{ verifyResult.firstBrokenId }}</span>
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>

    <!-- 导出参数弹窗 -->
    <el-dialog v-model="exportVisible" title="导出日志" width="400px">
      <el-form :model="exportForm" label-width="80px">
        <el-form-item label="起始 ID">
          <el-input-number v-model="exportForm.fromId" :min="1" :max="exportMaxLogId" style="width: 100%" />
        </el-form-item>
        <el-form-item label="结束 ID">
          <el-input-number v-model="exportForm.toId" :min="exportForm.fromId" :max="exportMaxLogId" style="width: 100%" />
        </el-form-item>
        <el-form-item>
          <span class="text-muted">范围：1 ~ {{ exportMaxLogId }}</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="exportVisible = false">取消</el-button>
        <el-button type="primary" :loading="exporting" @click="confirmExport">导出</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { CircleCheckFilled, CircleCloseFilled, ArrowLeft, ArrowRight } from '@element-plus/icons-vue'
import { getAuditLogs, verifyAuditChain, downloadAuditLogs } from '@/api/audit'
import type { AuditLog, AuditVerifyResult } from '@/types'

const loading = ref(false)
const items = ref<AuditLog[]>([])
const page = ref(1)
const size = ref(10)
const hasMore = ref(true)
const dateRange = ref<[string, string] | null>(null)

const filters = reactive({
  account: '',
  action: '',
})

const verifyVisible = ref(false)
const verifyResult = ref<AuditVerifyResult | null>(null)

// 导出
const exportVisible = ref(false)
const exporting = ref(false)
const exportMaxLogId = ref(1)
const exportForm = reactive({
  fromId: 1,
  toId: 1,
})

/** 翻页时保存当前页码，以便 API 返回空时回退 */
let prevPageOnFetch = 1

async function fetchData() {
  loading.value = true
  try {
    const fromTime = dateRange.value?.[0]
    const toTime = dateRange.value?.[1]
    prevPageOnFetch = page.value
    const res = await getAuditLogs({
      page: page.value,
      size: size.value,
      account: filters.account || undefined,
      action: filters.action || undefined,
      fromTime,
      toTime,
    })
    if (res.items.length === 0) {
      // 后端返回空 → 已到最后一页，回退页码并禁用下一页
      page.value = Math.max(1, prevPageOnFetch - 1)
      hasMore.value = false
      // items 保持上一页数据不变，无需重新请求
    } else {
      items.value = res.items
      hasMore.value = true
    }
  } catch {
    // ignore
  } finally {
    loading.value = false
  }
}

function goPrev() {
  if (page.value <= 1) return
  page.value--
  // 上翻时恢复 hasMore（该页数据之前已成功加载过）
  hasMore.value = true
  fetchData()
}

function goNext() {
  if (!hasMore.value) return
  page.value++
  fetchData()
}

function handleSearch() {
  page.value = 1
  hasMore.value = true
  fetchData()
}

function handleReset() {
  filters.account = ''
  filters.action = ''
  dateRange.value = null
  page.value = 1
  hasMore.value = true
  fetchData()
}

async function handleVerifyChain() {
  try {
    // 先获取最新一条日志，确定验证范围
    const latestRes = await getAuditLogs({ page: 1, size: 1 })
    if (latestRes.items.length === 0) {
      ElMessage.warning('暂无日志可验证')
      return
    }
    const maxLogId = latestRes.items[0].logId
    verifyResult.value = await verifyAuditChain(1, maxLogId)
    verifyVisible.value = true
  } catch {
    // ignore
  }
}

async function handleExport() {
  try {
    // 获取最新一条日志的 ID 作为最大范围
    const latestRes = await getAuditLogs({ page: 1, size: 1 })
    if (latestRes.items.length === 0) {
      ElMessage.warning('暂无日志可导出')
      return
    }
    exportMaxLogId.value = latestRes.items[0].logId
    exportForm.fromId = 1
    exportForm.toId = exportMaxLogId.value
    exportVisible.value = true
  } catch {
    // ignore
  }
}

async function confirmExport() {
  if (exportForm.fromId < 1 || exportForm.toId > exportMaxLogId.value || exportForm.fromId > exportForm.toId) {
    ElMessage.warning('参数无效')
    return
  }
  exporting.value = true
  try {
    const blob = await downloadAuditLogs(exportForm.fromId, exportForm.toId)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit_logs_${exportForm.fromId}_${exportForm.toId}.csv`
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
    exportVisible.value = false
  } catch {
    // ignore
  } finally {
    exporting.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.mb-20 {
  margin-bottom: 20px;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-top: 16px;
  gap: 12px;
}

.page-info {
  font-size: 13px;
  color: #909399;
}

.page-btns {
  display: flex;
  gap: 8px;
}

.text-muted {
  font-size: 12px;
  color: #909399;
}
</style>