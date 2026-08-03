import type { InjectionKey } from 'vue';

import type { ApproverNode, BranchNode, CcNode, FlowDef, FlowNode, NodeType } from '../data';

import { inject, provide, reactive } from 'vue';

import { message, Modal } from 'ant-design-vue';

import { getApprovalFlowDetailApi, saveApprovalFlowApi } from '#/api/sys/approvalFlow';
import { $t } from '#/locales';

import {
  createBranch,
  createInitiatorScope,
  NODE_TYPES,
  normalizeNode,
  normalizeScope,
  validateFlow,
} from '../data';

/** 抽屉编辑目标：审批人节点、抄送节点或某个分支列 */
export interface ApproverTarget {
  kind: 'approver';
  node: ApproverNode;
}

export interface CcTarget {
  kind: 'cc';
  node: CcNode;
}

export interface BranchTarget {
  kind: 'branch';
  branchNode: BranchNode;
  index: number;
}

export type DrawerTarget = ApproverTarget | BranchTarget | CcTarget;

/** 节点插槽的属主对象：根插槽挂在 FlowDef.root，子插槽挂在 node.childNode */
export interface SlotOwner {
  childNode?: FlowNode | null;
  root?: FlowNode | null;
}

/**
 * 审批流程设计器控制器：reactive 编辑态 + 节点树操作 + 加载/保存。
 * 编辑态即提交态：所有组件直接双向修改同一棵 reactive 节点树。
 */
export function useFlowDesigner() {
  const state = reactive({
    /** 流程 id（编辑态），新建为空 */
    id: '',
    bizType: '',
    name: '',
    remark: '',
    loading: false,
    saving: false,
    flowDef: { fields: [], root: null } as FlowDef,
    /** 发起人范围（flow 级，随保存提交） */
    initiatorScope: createInitiatorScope(),
    drawerTarget: null as DrawerTarget | null,
    fieldsEditorOpen: false,
    /** 发起人范围抽屉开关 */
    scopeDrawerOpen: false,
  });

  // ---------------- 节点树操作 ----------------

  /** 在指定插槽插入节点：按 NODE_TYPES 注册表创建，新节点接管该位置原有的后续节点 */
  function insertInto(owner: SlotOwner, key: 'childNode' | 'root', type: NodeType) {
    const node = NODE_TYPES[type].create();
    node.childNode = owner[key] ?? null;
    owner[key] = node;
  }

  /** 删除节点（确认后执行）：后续节点自动上移；若抽屉在编辑树内节点则直接关闭 */
  function removeNode(owner: SlotOwner, key: 'childNode' | 'root') {
    const node = owner[key];
    if (!node) return;
    const fallback =
      node.type === 'branch'
        ? $t('approval.designer.branchNode')
        : node.type === 'cc'
          ? $t('approval.designer.cc')
          : $t('approval.designer.approver');
    const name = node.type === 'branch' ? fallback : node.name || fallback;
    Modal.confirm({
      title: $t('common.confirmDelete'),
      content: $t('approval.designer.deleteNodeConfirm', {
        name: name || $t('approval.designer.approver'),
      }),
      okText: $t('common.confirm'),
      okButtonProps: { danger: true },
      cancelText: $t('common.cancel'),
      onOk: () => {
        owner[key] = node.childNode;
        state.drawerTarget = null;
      },
    });
  }

  /** 重排分支列优先级：priority 与列顺序一致（从 1 开始） */
  function syncPriority(branchNode: BranchNode) {
    branchNode.branches.forEach((b, i) => {
      b.priority = i + 1;
    });
  }

  /** 添加分支列：插入到默认分支之前，保持默认分支在最右 */
  function addBranch(branchNode: BranchNode) {
    const branch = createBranch('');
    const defaultIndex = branchNode.branches.findIndex(b => b.conditionGroups.length === 0);
    if (defaultIndex === -1) {
      branchNode.branches.push(branch);
    } else {
      branchNode.branches.splice(defaultIndex, 0, branch);
    }
    syncPriority(branchNode);
  }

  /** 删除分支列（确认后执行）：至少保留 2 列 */
  function removeBranch(branchNode: BranchNode, index: number) {
    if (branchNode.branches.length <= 2) {
      message.warning($t('approval.designer.branchMinTip'));
      return;
    }
    const branch = branchNode.branches[index];
    Modal.confirm({
      title: $t('common.confirmDelete'),
      content: $t('common.confirmDeleteContent', {
        name: branch?.name || $t('approval.designer.branchNode'),
      }),
      okText: $t('common.confirm'),
      okButtonProps: { danger: true },
      cancelText: $t('common.cancel'),
      onOk: () => {
        branchNode.branches.splice(index, 1);
        syncPriority(branchNode);
        syncDrawerIndexAfterRemove(branchNode, index);
      },
    });
  }

  /** 左移/右移分支列（dir -1 左移，1 右移），同步 priority 与抽屉索引 */
  function moveBranch(branchNode: BranchNode, index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= branchNode.branches.length) return;
    const [branch] = branchNode.branches.splice(index, 1);
    if (!branch) return;
    branchNode.branches.splice(target, 0, branch);
    syncPriority(branchNode);
    const drawer = state.drawerTarget;
    if (drawer?.kind === 'branch' && drawer.branchNode === branchNode) {
      if (drawer.index === index) drawer.index = target;
      else if (drawer.index === target) drawer.index = index;
    }
  }

  /** 删除分支列后修正抽屉正在编辑的列索引 */
  function syncDrawerIndexAfterRemove(branchNode: BranchNode, removedIndex: number) {
    const drawer = state.drawerTarget;
    if (drawer?.kind !== 'branch' || drawer.branchNode !== branchNode) return;
    if (drawer.index === removedIndex) state.drawerTarget = null;
    else if (drawer.index > removedIndex) drawer.index -= 1;
  }

  // ---------------- 抽屉 ----------------

  function openApproverConfig(node: ApproverNode) {
    state.drawerTarget = { kind: 'approver', node };
  }

  function openCcConfig(node: CcNode) {
    state.drawerTarget = { kind: 'cc', node };
  }

  function openBranchConfig(branchNode: BranchNode, index: number) {
    state.drawerTarget = { kind: 'branch', branchNode, index };
  }

  function closeDrawer() {
    state.drawerTarget = null;
  }

  // ---------------- 加载 / 保存 ----------------

  /** 打开页面：有 id 回显详情（nodes 即 root、fields 即 fields），无则按 bizType 新建空流程 */
  async function load(id?: string, bizType?: string) {
    if (!id) {
      state.bizType = bizType ?? '';
      return;
    }
    state.loading = true;
    try {
      const res: any = await getApprovalFlowDetailApi(id);
      state.id = res?.id ?? id;
      state.bizType = res?.bizType ?? '';
      state.name = res?.name ?? '';
      state.remark = res?.remark ?? '';
      state.flowDef.fields = Array.isArray(res?.fields) ? res.fields : [];
      state.flowDef.root = normalizeNode(res?.nodes ?? null);
      state.initiatorScope = normalizeScope(res?.initiatorScope);
    } finally {
      state.loading = false;
    }
  }

  /** 保存：本地校验通过后提交（nodes 提交 root 对象），新建成功后回写 id */
  async function save(): Promise<boolean> {
    const errors = validateFlow(state.flowDef, state.name, state.bizType, $t);
    if (errors.length > 0) {
      message.warning(errors[0]);
      return false;
    }
    state.saving = true;
    try {
      // 深拷贝去响应式后提交，字段名与冻结契约保持一致
      const payload = JSON.parse(
        JSON.stringify({
          ...(state.id ? { id: state.id } : {}),
          bizType: state.bizType.trim(),
          name: state.name.trim(),
          fields: state.flowDef.fields,
          nodes: state.flowDef.root,
          initiatorScope: state.initiatorScope,
          status: 1,
          remark: state.remark,
        }),
      );
      const res: any = await saveApprovalFlowApi(payload);
      if (res?.id) state.id = res.id;
      message.success($t('approval.designer.saveSuccess'));
      return true;
    } finally {
      state.saving = false;
    }
  }

  return {
    state,
    insertInto,
    removeNode,
    addBranch,
    removeBranch,
    moveBranch,
    openApproverConfig,
    openCcConfig,
    openBranchConfig,
    closeDrawer,
    load,
    save,
  };
}

export type FlowDesigner = ReturnType<typeof useFlowDesigner>;

const DESIGNER_KEY: InjectionKey<FlowDesigner> = Symbol('approval-flow-designer');

/** 页面入口调用：创建并 provide 设计器控制器 */
export function provideFlowDesigner(): FlowDesigner {
  const designer = useFlowDesigner();
  provide(DESIGNER_KEY, designer);
  return designer;
}

/** 画布/抽屉子组件调用：注入设计器控制器 */
export function useFlowDesignerContext(): FlowDesigner {
  const designer = inject(DESIGNER_KEY);
  if (!designer) {
    throw new Error('useFlowDesignerContext 必须在 provideFlowDesigner 之后的子组件中使用');
  }
  return designer;
}
