<script setup lang="ts">
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';

import { Page } from '@vben/common-ui';
import { IconifyIcon } from '@vben/icons';

import { Button, Input, Spin } from 'ant-design-vue';

import { useAccess } from '#/composables/use-access';
import { $t } from '#/locales';

import FieldsEditor from './components/fields-editor.vue';
import NodeChain from './components/node-chain.vue';
import NodeConfigDrawer from './components/node-config-drawer.vue';
import ScopeDrawer from './components/scope-drawer.vue';
import { provideFlowDesigner } from './composables/useFlowDesigner';
import { scopeSummary } from './data';

import './designer.css';

/**
 * 审批流程设计器（钉钉风格链式节点卡片）
 * 进入方式：/approval/flow-designer?id=xxx（编辑）或 ?bizType=xxx（新建）
 */
const route = useRoute();
const designer = provideFlowDesigner();

/** 保存按钮权限 */
const canSave = useAccess().hasAccessByCodes(['adm:approval:flow:update']);

onMounted(() => {
  designer.load(route.query.id as string | undefined, route.query.bizType as string | undefined);
});
</script>

<template>
  <Page auto-content-height>
    <div class="flow-designer">
      <!-- 顶部工具条 -->
      <div class="designer-toolbar">
        <div class="toolbar-left">
          <span class="toolbar-title">
            <IconifyIcon icon="lucide:workflow" class="size-4" />
            {{ $t('approval.designer.pageTitle') }}
          </span>
          <Input
            v-model:value="designer.state.name"
            :placeholder="$t('approval.designer.flowNamePlaceholder')"
            class="w-52"
            :maxlength="50"
          />
          <Input
            v-model:value="designer.state.bizType"
            :disabled="!!designer.state.id"
            :placeholder="$t('approval.designer.bizTypePlaceholder')"
            class="w-40"
            :maxlength="50"
          />
        </div>
        <div class="toolbar-right">
          <Button @click="designer.state.fieldsEditorOpen = true">
            <IconifyIcon icon="lucide:list-plus" class="size-4" />
            {{ $t('approval.designer.fieldsEdit') }}
          </Button>
          <Button
            v-if="canSave"
            type="primary"
            :loading="designer.state.saving"
            @click="designer.save()"
          >
            {{ $t('approval.designer.save') }}
          </Button>
        </div>
      </div>

      <!-- 中央链式画布：发起人 → 节点树 → 结束 -->
      <div class="designer-canvas">
        <Spin :spinning="designer.state.loading">
          <div class="canvas-inner">
            <div class="flow-card starter-card" @click="designer.state.scopeDrawerOpen = true">
              <div class="flow-card-header">
                <span class="flow-card-title">
                  <IconifyIcon icon="lucide:circle-play" class="size-3.5" />
                  {{ $t('approval.designer.starter') }}
                </span>
              </div>
              <div class="flow-card-body">
                <div class="summary">{{ scopeSummary(designer.state.initiatorScope, $t) }}</div>
              </div>
            </div>
            <NodeChain :owner="designer.state.flowDef" slot-key="root" />
            <div class="chain-line"></div>
            <div class="end-card">{{ $t('approval.designer.end') }}</div>
          </div>
        </Spin>
      </div>
    </div>

    <!-- 右侧配置抽屉 + fields 声明编辑 + 发起人范围 -->
    <NodeConfigDrawer />
    <FieldsEditor />
    <ScopeDrawer />
  </Page>
</template>
