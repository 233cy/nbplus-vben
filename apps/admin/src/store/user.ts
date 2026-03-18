import { acceptHMRUpdate, defineStore } from 'pinia';

interface AdminUserState {
  email: string;
  permissions: string[];
  phone: string;
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
    },
    $reset() {
      this.email = '';
      this.phone = '';
      this.permissions = [];
    },
  },
  state: (): AdminUserState => ({
    email: '',
    permissions: [],
    phone: '',
  }),
});

const hot = import.meta.hot;
if (hot) {
  hot.accept(acceptHMRUpdate(useAdminUserStore, hot));
}
