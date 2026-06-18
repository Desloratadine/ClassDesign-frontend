<template>
  <div class="page-container">
    <div class="page-header">
      <h2>密级管理</h2>
      <el-button type="primary" @click="openAdd">新增密级</el-button>
    </div>

    <el-card>
      <el-table :data="items" style="width: 100%" v-loading="loading" stripe>
        <el-table-column label="密级名称" min-width="200">
          <template #default="{ row }">
            <el-tag :color="getSecurityColor(row.level)" effect="dark" size="small" style="border: none">
              {{ row.label }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="level" label="密级值" width="100" align="center" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row.level)">删除</el-button>
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

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑密级' : '新增密级'" width="450px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="密级名称" prop="label">
          <el-input v-model="form.label" placeholder="请输入密级名称" maxlength="10" />
        </el-form-item>
        <el-form-item label="密级值" prop="level">
          <el-input-number v-model="form.level" :min="0" :max="9" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { getSecurityLevels, addSecurityLevel, updateSecurityLevel, deleteSecurityLevel } from '@/api/admin'
import { getSecurityColor } from '@/utils'
import type { SecurityLevel } from '@/types'

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<FormInstance>()
const items = ref<SecurityLevel[]>([])
const page = ref(1)
const size = ref(10)
const total = ref(0)

const form = reactive({
  label: '',
  level: 0,
})

const rules: FormRules = {
  label: [{ required: true, message: '请输入密级名称', trigger: 'blur' }],
  level: [{ required: true, message: '请选择密级值', trigger: 'change' }],
}

async function fetchData() {
  loading.value = true
  try {
    const res = await getSecurityLevels({ page: page.value, size: size.value })
    items.value = res.items
    total.value = res.items.length
  } catch {
    // ignore
  } finally {
    loading.value = false
  }
}

function openAdd() {
  isEdit.value = false
  form.label = ''
  form.level = 0
  dialogVisible.value = true
}

function openEdit(row: SecurityLevel) {
  isEdit.value = true
  form.label = row.label
  form.level = row.level
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    if (isEdit.value) {
      await updateSecurityLevel({ label: form.label, level: form.level })
      ElMessage.success('更新成功')
    } else {
      await addSecurityLevel({ label: form.label, level: form.level })
      ElMessage.success('新增成功')
    }
    dialogVisible.value = false
    fetchData()
  } catch {
    // ignore
  } finally {
    submitting.value = false
  }
}

async function handleDelete(level: number) {
  try {
    await ElMessageBox.confirm(`确定要删除密级 ${level} 吗？`, '确认删除', { type: 'warning' })
    await deleteSecurityLevel(level)
    ElMessage.success('删除成功')
    fetchData()
  } catch (e: any) {
    if (e !== 'cancel') {
      // ignore
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
</style>