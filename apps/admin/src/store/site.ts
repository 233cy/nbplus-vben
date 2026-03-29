import { preferencesManager } from '@vben/preferences';

import { acceptHMRUpdate, defineStore } from 'pinia';

import { getPublicConfigApi } from '#/api/core/config';

interface SiteState {
  /** 版权信息 */
  copyright: string;
  /** 网站LOGO */
  logo: string;
  /** 站点名称全名 */
  name: string;
}

export const useSiteStore = defineStore('site', {
  actions: {
    async fetchPublicConfig() {
      try {
        const items = await getPublicConfigApi();
        const map: Record<string, string> = {};
        for (const item of items) {
          map[item.key] = item.value;
        }
        if (map['site.name']) {
          this.name = map['site.name'] as string;
          document.title = map['site.name'] as string;
        }
        if (map['site.logo']) {
          this.logo = map['site.logo'] as string;
        }
        if (map['site.copyright']) {
          this.copyright = map['site.copyright'] as string;
        }
        preferencesManager.updatePreferences({
          app: { name: map['site.name'] as string },
          logo: { source: map['site.logo'] as string, sourceDark: map['site.logo'] as string },
          copyright: {
            /* 公司名 */
            companyName: this.copyright,
            /** 版权公司名链接 */
            companySiteLink: 'blog.233cy.com',
            /* 日期 */
            date: String(new Date().getFullYear()),
            /** 版权是否可见 */
            enable: true,
            /** 备案号 */
            icp: '',
            /** 备案号链接 */
            icpLink: '',
          },
        });
      } catch {
        // 静默失败，保留默认值
      }
    },
  },
  state: (): SiteState => ({
    copyright: `Copyright © ${new Date().getFullYear()} 233cy · nbplus · MIT License`,
    logo: '',
    name: '',
  }),
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSiteStore, import.meta.hot));
}
