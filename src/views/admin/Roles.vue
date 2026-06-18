<template>
  <div class="page-container">
    <div class="page-header">
      <h2>角色管理</h2>
      <el-button type="primary" @click="openAdd">新增角色</el-button>
    </div>

    <el-card>
      <el-table :data="items" style="width: 100%" v-loading="loading" stripe>
        <el-table-column prop="roleId" label="角色 ID" width="120" />
        <el-table-column prop="roleName" label="角色名称" width="200" />
        <el-table-column prop="privileges" label="权限值" width="150" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row.roleId)">删除</el-button>
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

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑角色' : '新增角色'" width="450px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model="form.roleName" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="权限值" prop="privileges">
          <el-input v-model="form.privileges" placeholder="请输入权限值，如 doc:receive doc:download" />
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
import { getRoles, addRole, updateRole, deleteRole } from '@/api/admin'
import type { Role } from '@/types'

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<FormInstance>()
const items = ref<Role[]>([])
const page = ref(1)
const size = ref(10)
const total = ref(0)

const form = reactive({
  roleId: '',
  roleName: '',
  privileges: '',
})

const rules: FormRules = {
  roleName: [{ required: true, message: '请输入角色名称', trigger: 'blur' }],
  privileges: [{ required: true, message: '请输入权限值', trigger: 'blur' }],
}

async function fetchData() {
  loading.value = true
  try {
    const res = await getRoles({ page: page.value, size: size.value })
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
  form.roleId = ''
  form.roleName = ''
  form.privileges = ''
  dialogVisible.value = true
}

function openEdit(row: Role) {
  isEdit.value = true
  form.roleId = row.roleId
  form.roleName = row.roleName
  form.privileges = row.privileges || ''
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    if (isEdit.value) {
      await updateRole({ roleId: form.roleId, roleName: form.roleName, privileges: form.privileges })
      ElMessage.success('更新成功')
    } else {
      await addRole({ roleName: form.roleName, privileges: form.privileges })
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

async function handleDelete(roleId: string) {
  try {
    await ElMessageBox.confirm(`确定要删除角色 ${roleId} 吗？`, '确认删除', { type: 'warning' })
    await deleteRole(roleId)
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