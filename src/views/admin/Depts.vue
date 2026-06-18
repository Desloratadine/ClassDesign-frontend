<template>
  <div class="page-container">
    <div class="page-header">
      <h2>部门管理</h2>
      <el-button type="primary" @click="openAdd">新增部门</el-button>
    </div>

    <el-card>
      <el-table :data="items" style="width: 100%" v-loading="loading" stripe>
        <el-table-column prop="deptId" label="部门 ID" width="150" />
        <el-table-column prop="deptName" label="部门名称" min-width="300" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row.deptId)">删除</el-button>
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

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑部门' : '新增部门'" width="450px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="部门名称" prop="deptName">
          <el-input v-model="form.deptName" placeholder="请输入部门名称" />
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
import { getDepts, addDept, updateDept, deleteDept } from '@/api/admin'
import type { Dept } from '@/types'

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<FormInstance>()
const items = ref<Dept[]>([])
const page = ref(1)
const size = ref(10)
const total = ref(0)

const form = reactive({
  deptId: '',
  deptName: '',
})

const rules: FormRules = {
  deptName: [{ required: true, message: '请输入部门名称', trigger: 'blur' }],
}

async function fetchData() {
  loading.value = true
  try {
    const res = await getDepts({ page: page.value, size: size.value })
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
  form.deptId = ''
  form.deptName = ''
  dialogVisible.value = true
}

function openEdit(row: Dept) {
  isEdit.value = true
  form.deptId = row.deptId
  form.deptName = row.deptName
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    if (isEdit.value) {
      await updateDept({ deptId: form.deptId, deptName: form.deptName })
      ElMessage.success('更新成功')
    } else {
      await addDept({ deptName: form.deptName })
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

async function handleDelete(deptId: string) {
  try {
    await ElMessageBox.confirm(`确定要删除部门 ${deptId} 吗？`, '确认删除', { type: 'warning' })
    await deleteDept(deptId)
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