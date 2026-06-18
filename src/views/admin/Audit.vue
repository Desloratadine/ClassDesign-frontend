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
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="size"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          :total="total"
          @size-change="fetchData"
          @current-change="fetchData"
        />
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { CircleCheckFilled, CircleCloseFilled } from '@element-plus/icons-vue'
import { getAuditLogs, verifyAuditChain, downloadAuditLogs } from '@/api/audit'
import type { AuditLog, AuditVerifyResult } from '@/types'

const loading = ref(false)
const items = ref<AuditLog[]>([])
const page = ref(1)
const size = ref(10)
const total = ref(0)
const dateRange = ref<[string, string] | null>(null)

const filters = reactive({
  account: '',
  action: '',
})

const verifyVisible = ref(false)
const verifyResult = ref<AuditVerifyResult | null>(null)

async function fetchData() {
  loading.value = true
  try {
    const fromTime = dateRange.value?.[0]
    const toTime = dateRange.value?.[1]
    const res = await getAuditLogs({
      page: page.value,
      size: size.value,
      account: filters.account || undefined,
      action: filters.action || undefined,
      fromTime,
      toTime,
    })
    items.value = res.items
    total.value = res.items.length
  } catch {
    // ignore
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  page.value = 1
  fetchData()
}

function handleReset() {
  filters.account = ''
  filters.action = ''
  dateRange.value = null
  page.value = 1
  fetchData()
}

async function handleVerifyChain() {
  try {
    verifyResult.value = await verifyAuditChain()
    verifyVisible.value = true
  } catch {
    // ignore
  }
}

async function handleExport() {
  try {
    // 导出全部日志（简化处理）
    const fromId = 1
    const toId = total.value > 0 ? items.value[items.value.length - 1].logId : 1
    const blob = await downloadAuditLogs(fromId, toId)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit_logs_${fromId}_${toId}.csv`
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('导出成功')
  } catch {
    // ignore
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
  margin-top: 16px;
}
</style>