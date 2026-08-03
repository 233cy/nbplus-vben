import { preferencesManager } from '@vben/preferences';

import { acceptHMRUpdate, defineStore } from 'pinia';

import { getPublicConfigApi } from '#/api/sys/config';

interface SiteState {
  /** 全量配置 map，key => value */
  config: Record<string, string>;
  /** 版权信息（快捷字段） */
  copyright: string;
  /** 网站LOGO（快捷字段） */
  logo: string;
  /** 站点名称（快捷字段） */
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

        // 存全量 map
        this.config = map;

        // 快捷字段同步
        if (map['site.name']) {
          this.name = map['site.name'];
          document.title = map['site.name'];
        }
        if (map['site.logo']) {
          this.logo = map['site.logo'];
        }
        if (map['site.copyright']) {
          this.copyright = map['site.copyright'];
        }

        preferencesManager.updatePreferences({
          app: { name: map['site.name'] },
          logo: { source: map['site.logo'], sourceDark: map['site.logo'] },
          copyright: {
            companyName: this.copyright,
            companySiteLink: 'blog.233cy.com',
            date: String(new Date().getFullYear()),
            enable: true,
            icp: '',
            icpLink: '',
          },
        });
      } catch {
        // 静默失败，保留默认值
      }
    },
  },
  getters: {
    /**
     * 通用取值，无需每次改 store
     * @example siteStore.get('page.sizes', '10,20,50,100')
     */
    get:
      state =>
      (key: string, defaultValue = '') =>
        state.config[key] ?? defaultValue,
  },
  state: (): SiteState => ({
    config: {},
    copyright: `Copyright © ${new Date().getFullYear()} 233cy · nbplus · MIT License`,
    logo: '',
    name: '',
  }),
});

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useSiteStore, import.meta.hot));
}
