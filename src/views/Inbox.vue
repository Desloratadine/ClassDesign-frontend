<template>
  <div class="page-container">
    <div class="page-header">
      <h2>收件箱</h2>
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
        <el-table-column prop="filename" label="文件名" min-width="250" />
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
        <el-table-column prop="senderAccount" label="发送者" width="150" />
        <el-table-column prop="sentTime" label="发送时间" min-width="180" />
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
import { Search } from '@element-plus/icons-vue'
import { getInboxDocs } from '@/api/documents'
import { getSecurityColor } from '@/utils'
import type { InboxDocItem } from '@/types'

const loading = ref(false)
const items = ref<InboxDocItem[]>([])
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
    const res = await getInboxDocs({ page: page.value, size: size.value, keyword: keyword.value })
    items.value = res.items
    total.value = res.items.length
  } catch {
    // ignore
  } finally {
    loading.value = false
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
</style>