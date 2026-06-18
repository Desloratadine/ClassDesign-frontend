<template>
  <div class="page-container">
    <div class="page-header">
      <h2>用户管理</h2>
      <el-button type="primary" @click="openAdd">新增用户</el-button>
    </div>

    <el-card>
      <div class="card-header">
        <el-input
          v-model="searchAccount"
          placeholder="搜索账户..."
          clearable
          style="width: 200px"
          @input="onSearch"
          @clear="onSearch"
        >
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
      </div>

      <el-table :data="items" style="width: 100%; margin-top: 16px" v-loading="loading" stripe>
        <el-table-column prop="account" label="账户" width="120" />
        <el-table-column prop="username" label="用户名" width="150" />
        <el-table-column label="密级" width="80" align="center">
          <template #default="{ row }">
            <el-tag :color="getSecurityColor(row.security)" effect="dark" size="small" style="border: none">
              {{ row.security }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="role" label="角色" width="100" />
        <el-table-column prop="dept" label="部门" width="100" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row.account)">删除</el-button>
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

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑用户' : '新增用户'" width="500px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="账户" v-if="isEdit">
          <el-input v-model="form.account" disabled />
        </el-form-item>
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="密码" prop="passwd">
          <el-input
            v-model="form.passwd"
            type="password"
            show-password
            placeholder="请输入密码"
          />
        </el-form-item>
        <el-form-item label="部门" prop="dept">
          <el-select v-model="form.dept" placeholder="选择部门" style="width: 100%">
            <el-option v-for="d in deptOptions" :key="d.deptId" :label="d.deptName" :value="d.deptId" />
          </el-select>
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="form.role" placeholder="选择角色" style="width: 100%">
            <el-option v-for="r in roleOptions" :key="r.roleId" :label="r.roleName" :value="r.roleId" />
          </el-select>
        </el-form-item>
        <el-form-item label="密级" prop="security">
          <el-select v-model="form.security" placeholder="选择密级" style="width: 100%">
            <el-option v-for="s in securityOptions" :key="s.level" :label="`${s.label} (${s.level})`" :value="s.level" />
          </el-select>
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
import { Search } from '@element-plus/icons-vue'
import { getUsers, addUser, updateUser, deleteUser } from '@/api/admin'
import { getUploadOptions } from '@/api/documents'
import { sm3Hash, getSecurityColor } from '@/utils'
import type { AdminUser, Dept, Role, SecurityLevel } from '@/types'

const loading = ref(false)
const submitting = ref(false)
const dialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<FormInstance>()
const items = ref<AdminUser[]>([])
const searchAccount = ref('')
const page = ref(1)
const size = ref(10)
const total = ref(0)

const deptOptions = ref<Dept[]>([])
const roleOptions = ref<Role[]>([])
const securityOptions = ref<SecurityLevel[]>([])

const form = reactive({
  account: '',
  username: '',
  passwd: '',
  role: '',
  dept: '',
  security: null as number | null,
})

const rules: FormRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  passwd: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }],
  dept: [{ required: true, message: '请选择部门', trigger: 'change' }],
  security: [{ required: true, message: '请选择密级', trigger: 'change' }],
}

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
    const res = await getUsers({ page: page.value, size: size.value, account: searchAccount.value })
    items.value = res.items
    total.value = res.items.length
  } catch {
    // ignore
  } finally {
    loading.value = false
  }
}

async function loadOptions() {
  try {
    const opts = await getUploadOptions()
    deptOptions.value = opts.dept
    roleOptions.value = opts.role
    securityOptions.value = opts.security
  } catch {
    // ignore
  }
}

function openAdd() {
  isEdit.value = false
  form.account = ''
  form.username = ''
  form.passwd = ''
  form.role = ''
  form.dept = ''
  form.security = null
  dialogVisible.value = true
}

function openEdit(row: AdminUser) {
  isEdit.value = true
  form.account = row.account
  form.username = ''
  form.passwd = ''
  form.role = ''
  form.dept = ''
  form.security = null
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  submitting.value = true
  try {
    if (isEdit.value) {
      await updateUser({
        account: form.account,
        username: form.username,
        passwd: sm3Hash(form.passwd),
        role: form.role,
        dept: form.dept,
        security: form.security ?? 0,
      })
      ElMessage.success('更新成功')
    } else {
      const result = await addUser({
        username: form.username,
        passwd: sm3Hash(form.passwd),
        role: form.role,
        dept: form.dept,
        security: form.security ?? 0,
      })
      ElMessage.success(`新增成功，账户: ${result.account}`)
    }
    dialogVisible.value = false
    fetchData()
  } catch {
    // ignore
  } finally {
    submitting.value = false
  }
}

async function handleDelete(account: string) {
  try {
    await ElMessageBox.confirm(`确定要删除用户 ${account} 吗？`, '确认删除', { type: 'warning' })
    await deleteUser(account)
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
  loadOptions()
})
</script>

<style scoped>
.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>