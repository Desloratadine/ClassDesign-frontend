<template>
  <div class="page-container">
    <div class="page-header">
      <h2>已发送文档</h2>
    </div>

    <el-card>
      <div class="card-header">
        <el-input
          v-model="keyword"
          placeholder="搜索文件名..."
          clearable
          style="width: 300px"
          @input="onSearch"
          @clear="onSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
      </div>

      <el-table :data="items" style="width: 100%; margin-top: 16px" v-loading="loading" stripe>
        <el-table-column prop="docTimestamp" label="文档时间戳" min-width="180">
          <template #default="{ row }">
            <el-link type="primary" @click="$router.push(`/document/${row.docTimestamp}`)">
              {{ row.docTimestamp }}
            </el-link>
          </template>
        </el-table-column>
        <el-table-column prop="filename" label="文件名" min-width="200" />
        <el-table-column label="允许部门" min-width="150">
          <template #default="{ row }">
            <el-tag v-for="d in row.dept" :key="d" size="small" class="mr-4">{{ d }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="允许角色" min-width="150">
          <template #default="{ row }">
            <el-tag v-for="r in row.role" :key="r" size="small" type="warning" class="mr-4">{{ r }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="密级" width="80" align="center">
          <template #default="{ row }">
            <el-tag
              :color="getSecurityColor(row.security)"
              effect="dark"
              size="small"
              style="border: none"
            >
              {{ row.security }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sentTime" label="发送时间" min-width="180" />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link type="danger" size="small" @click="handleDelete(row)">
              删除
            </el-button>
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { getSentDocs, deleteDocument } from '@/api/documents'
import { getSecurityColor } from '@/utils'
import type { SentDocItem } from '@/types'

const loading = ref(false)
const items = ref<SentDocItem[]>([])
const keyword = ref('')
const page = ref(1)
const size = ref(10)
const total = ref(0)

let searchTimer: ReturnType<typeof setTimeout>

function onSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    fetchData()
  }, 300)
}

async function fetchData() {
  loading.value = true
  try {
    const res = await getSentDocs({ page: page.value, size: size.value, keyword: keyword.value })
    items.value = res.items
    total.value = res.items.length // 后端未返回 total，先按当前页长度
  } catch {
    // ignore
  } finally {
    loading.value = false
  }
}

async function handleDelete(row: SentDocItem) {
  try {
    await ElMessageBox.confirm(
      `确定要删除文档「${row.filename}」吗？此操作将物理删除文档记录和密文文件，不可恢复。`,
      '确认删除',
      { type: 'warning', confirmButtonText: '确定删除', cancelButtonText: '取消' }
    )
    await deleteDocument(row.docTimestamp)
    ElMessage.success('删除成功')
    fetchData()
  } catch (e: any) {
    if (e !== 'cancel') {
      // error handled by interceptor
    }
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.mr-4 {
  margin-right: 4px;
}
</style>