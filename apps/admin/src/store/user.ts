import { acceptHMRUpdate, defineStore } from 'pinia';

/** 用户角色（后端 /admin/profile/info 返回） */
export interface AdminRoleItem {
  id: string;
  name: string;
}

/** 用户任职（主职在前）：部门 + 职务 + 是否主职（1主 2兼），fullDeptName 为部门树完整路径名 */
export interface AdminOrgItem {
  deptId: string;
  deptName: string;
  fullDeptName: string;
  dutyId: string;
  dutyName: string;
  isMain: number;
}

interface AdminUserState {
  email: string;
  orgs: AdminOrgItem[];
  permissions: string[];
  phone: string;
  roles: AdminRoleItem[];
}

/**
 * admin 业务扩展的用户信息
 * 框架基础字段由 @vben/stores 的 useUserStore 管理
 */
export const useAdminUserStore = defineStore('admin-user', {
  actions: {
    setAdminUserInfo(info: Partial<AdminUserState>) {
      this.email = info.email ?? '';
      this.phone = info.phone ?? '';
      this.permissions = info.permissions ?? [];
      this.roles = info.roles ?? [];
      this.orgs = info.orgs ?? [];
    },
    $reset() {
      this.email = '';
      this.phone = '';
      this.permissions = [];
      this.roles = [];
      this.orgs = [];
    },
  },
  state: (): AdminUserState => ({
    email: '',
    orgs: [],
    permissions: [],
    phone: '',
    roles: [],
  }),
});

const hot = import.meta.hot;
if (hot) {
  hot.accept(acceptHMRUpdate(useAdminUserStore, hot));
}
