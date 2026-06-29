import type { ConfigApi } from '#/api/sys/config';

import { ref } from 'vue';

import { getConfigGroupsApi } from '#/api/sys/config';

/**
 * 配置分组加载与当前选中分组.
 */
export function useConfigGroups() {
  const groups = ref<ConfigApi.GroupItem[]>([]);
  const activeGroup = ref('');

  function groupsLabel(item: ConfigApi.GroupItem): string {
    return item.groupsLabel || item.groups;
  }

  async function loadGroups() {
    groups.value = await getConfigGroupsApi();
    if (groups.value.length > 0 && !activeGroup.value) {
      activeGroup.value = groups.value[0]?.groups ?? '';
    }
  }

  return {
    groups,
    activeGroup,
    groupsLabel,
    loadGroups,
  };
}
