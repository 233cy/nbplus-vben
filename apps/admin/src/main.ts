import { initPreferences } from '@vben/preferences';
import { setTimezoneHandler } from '@vben/stores';
import { getSystemTimezone, unmountGlobalLoading } from '@vben/utils';

import { overridesPreferences } from './preferences';

/**
 * 应用初始化完成之后再进行页面加载渲染
 */
async function initApplication() {
  // name用于指定项目唯一标识
  // 用于区分不同项目的偏好设置以及存储数据的key前缀以及其他一些需要隔离的数据
  const env = import.meta.env.PROD ? 'prod' : 'dev';
  const appVersion = import.meta.env.VITE_APP_VERSION;
  const namespace = `${import.meta.env.VITE_APP_NAMESPACE}-${appVersion}-${env}`;

  // app偏好设置初始化
  await initPreferences({
    namespace,
    overrides: overridesPreferences,
  });

  // 当前关闭手动时区切换，默认强制使用系统时区。
  // 如需恢复时区切换功能，将 getTimezone 改为调用后端接口即可；
  // setTimezone 预留用于后续持久化用户选择。
  setTimezoneHandler({
    getTimezone: async () => getSystemTimezone(),
    setTimezone: async () => {
      // 预留接口，当前不实现持久化
    },
  });

  // 启动应用并挂载
  // vue应用主要逻辑及视图
  const { bootstrap } = await import('./bootstrap');
  await bootstrap(namespace);

  // 移除并销毁loading
  unmountGlobalLoading();
}

initApplication();
