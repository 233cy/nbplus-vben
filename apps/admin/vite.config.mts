import { defineApplicationConfig } from '@vben/vite-config';

import AutoImport from 'unplugin-auto-import/vite';
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers';
import Components from 'unplugin-vue-components/vite';

export default defineApplicationConfig(async () => {
  return {
    application: {},
    vite: {
      plugins: [
        // 自动导入 API（可选）
        AutoImport({
          dts: 'src/types/auto-imports.d.ts',
          resolvers: [AntDesignVueResolver()],
        }),

        // 自动按需加载 Antd 组件
        Components({
          dts: 'src/types/components.d.ts', // <-- 让 WebStorm 自动补全 (重要)
          resolvers: [
            // Antd 自动按需
            AntDesignVueResolver({
              importStyle: 'less',
            }),
          ],
          // ⭐⭐ 自动扫描你的组件库 ⭐⭐
          dirs: ['src/components'], // <-- 根目录要改成你的结构
          extensions: ['vue'],
          deep: true,
        }),
      ],
      css: {
        preprocessorOptions: {
          less: {
            javascriptEnabled: true,
          },
        },
      },
      server: {
        port: 2300,
        allowedHosts: ['nbplus.233cy.com', '10.8.0.9'],
        // proxy: {
        //   '/api': {
        //     changeOrigin: true,
        //     rewrite: (path) => path.replace(/^\/api/, ''),
        //     // mock代理目标地址
        //     target: 'https://nbplus.233cy.com:2333/api',
        //     ws: true,
        //   },
        // },
      },
    },
  };
});
