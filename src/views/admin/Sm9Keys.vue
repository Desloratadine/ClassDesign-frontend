<template>
  <div class="page-container">
    <div class="page-header">
      <h2>SM9 密钥管理</h2>
    </div>

    <el-card>
      <template #header>
        <div class="card-header">
          <span>SM9 主密钥</span>
          <el-button type="primary" size="small" :loading="rotating" @click="handleRotate">
            轮换加密主密钥
          </el-button>
        </div>
      </template>
      <el-table :data="masterKeys" style="width: 100%" v-loading="loading" stripe>
        <el-table-column prop="keyId" label="密钥 ID" min-width="220" show-overflow-tooltip />
        <el-table-column prop="usageType" label="用途" width="80">
          <template #default="{ row }">
            <el-tag size="small" :type="row.usageType === 'enc' ? 'primary' : 'success'">
              {{ row.usageType === 'enc' ? '加密' : '签名' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag
              size="small"
              :type="row.status === 'active' ? 'success' : row.status === 'retired' ? 'warning' : 'danger'"
            >
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="wrappingAlg" label="包装算法" min-width="180" />
        <el-table-column prop="createdAt" label="创建时间" min-width="180" />
        <el-table-column prop="notBefore" label="生效时间" min-width="180" />
        <el-table-column prop="notAfter" label="过期时间" min-width="180" />
        <el-table-column prop="retiredAt" label="退役时间" min-width="180">
          <template #default="{ row }">
            {{ row.retiredAt || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="revokedAt" label="吊销时间" min-width="180">
          <template #default="{ row }">
            {{ row.revokedAt || '-' }}
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-if="!loading && masterKeys.length === 0" description="暂无 SM9 主密钥" />
    </el-card>

    <!-- 轮换结果弹窗 -->
    <el-dialog v-model="rotateVisible" title="密钥轮换结果" width="500px">
      <el-descriptions v-if="rotateResult" :column="1" border>
        <el-descriptions-item label="旧密钥 ID">
          <span class="hash-value">{{ rotateResult.oldKeyId }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="新密钥 ID">
          <span class="hash-value">{{ rotateResult.newKeyId }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="rotateResult.status === 'SUCCESS' ? 'success' : 'danger'" size="small">
            {{ rotateResult.status }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="已重新封装">{{ rotateResult.rewrappedEnvelopeCount }} 个 key_envelope</el-descriptions-item>
        <el-descriptions-item label="已更新文档">{{ rotateResult.updatedDocumentCount }} 个</el-descriptions-item>
        <el-descriptions-item label="已重新签名">{{ rotateResult.resignedDocumentCount }} 个</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button type="primary" @click="rotateVisible = false">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { getSm9MasterKeys, rotateSm9EncKey } from '@/api/admin'
import type { Sm9MasterKey, Sm9RotateResult } from '@/types'

const loading = ref(false)
const rotating = ref(false)
const masterKeys = ref<Sm9MasterKey[]>([])
const rotateVisible = ref(false)
const rotateResult = ref<Sm9RotateResult | null>(null)

async function fetchData() {
  loading.value = true
  try {
    masterKeys.value = await getSm9MasterKeys()
  } catch {
    // ignore
  } finally {
    loading.value = false
  }
}

async function handleRotate() {
  try {
    await ElMessageBox.confirm(
      '轮换 SM9 加密主密钥将重新封装所有已存在的 key_envelope 和签名，继续？',
      '确认轮换',
      { type: 'warning' }
    )
    rotating.value = true
    rotateResult.value = await rotateSm9EncKey()
    rotateVisible.value = true
    ElMessage.success('主密钥轮换成功')
    fetchData()
  } catch (e: any) {
    if (e !== 'cancel') {
      // ignore
    }
  } finally {
    rotating.value = false
  }
}

onMounted(() => {
  fetchData()
})
</script>