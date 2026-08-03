/**
 * 审批流程设计器：能力注册表、数据结构、工厂函数、卡片摘要与本地校验纯函数
 *
 * 能力域边界（与后端 Domain 同构）：审批人规则 / 节点类型 / 条件算子均注册化，
 * 新增一条审批人规则 = 在 APPROVER_RULES 注册一条 + 一个 panels/ 面板组件。
 *
 * 数据 schema 与后端冻结契约一致：
 * 流程定义整体为 `{ fields: FieldDef[], root: Node }`，保存时以 `nodes: root` 提交。
 */
import type { Component } from 'vue';

import DutyPanel from './components/panels/duty-panel.vue';
import SelfSelectPanel from './components/panels/self-select-panel.vue';
import SupervisorPanel from './components/panels/supervisor-panel.vue';
import UsersPanel from './components/panels/users-panel.vue';

/** 条件字段定义（供分支条件构建器使用） */
export interface FieldDef {
  name: string;
  label: string;
  type: 'enum' | 'number' | 'string';
  /** type 为 enum 时的可选值 */
  options?: string[];
}

/** 条件操作符 */
export type CondOp = '!=' | '<' | '<=' | '=' | '>' | '>=' | 'contains' | 'in';

/** 条件算子注册表（与后端 OperatorRegistry 同构，保持 v1 算子不变） */
export const COND_OPS: CondOp[] = ['=', '!=', '>', '>=', '<', '<=', 'in', 'contains'];

/** 单个条件 */
export interface Cond {
  field: string;
  op: CondOp;
  value: any;
}

/** 分支：conditionGroups 组内 and、组间 or；空数组 = 默认分支 */
export interface Branch {
  name: string;
  priority: number;
  conditionGroups: Cond[][];
  childNode: FlowNode | null;
}

/**
 * 审批人类型。
 * users / supervisor / self_select / duty 为 v2 注册规则；
 * role / post 为 v1 存量类型，后端保留兼容，设计器不展示、仅回显不崩。
 */
export type ApproverType = 'duty' | 'post' | 'role' | 'self_select' | 'supervisor' | 'users';

/** 通过方式：any 或签 / all 会签 / quorum 最少 N 人通过（达标数封顶节点审批人数） */
export type ApprovalMode = 'all' | 'any' | 'quorum';

/** 审批人节点 */
export interface ApproverNode {
  type: 'approver';
  name: string;
  approverType: ApproverType;
  /**
   * 按 approverType 冻结的参数结构：
   * users → { userIds: string[] }；duty → { dutyIds: string[] }；
   * supervisor → {}；self_select → { multiple: boolean }；
   * 存量 role → { roleCode: string }、post → { postId: string }（仅回显）
   */
  param: Record<string, any>;
  approvalMode: ApprovalMode;
  quorumCount: null | number;
  /** 通知模板：设计器不提供编辑，工厂函数固定默认 approval_todo */
  notifyTemplate: string;
  childNode: FlowNode | null;
}

/** 抄送节点：不产生任务，推进到该节点即通知并自动晋级 */
export interface CcNode {
  type: 'cc';
  name: string;
  /** 指定抄送人 */
  ccUserIds: string[];
  /** 是否允许发起人提交时自选抄送人 */
  allowSelfSelect: boolean;
  childNode: FlowNode | null;
}

/** 条件分支节点 */
export interface BranchNode {
  type: 'branch';
  branches: Branch[];
  childNode: FlowNode | null;
}

export type FlowNode = ApproverNode | BranchNode | CcNode;

/** 流程定义 */
export interface FlowDef {
  fields: FieldDef[];
  root: FlowNode | null;
}

/** 发起人范围（flow 级）：all 或全空 = 所有人，否则各类取并集 */
export interface InitiatorScope {
  all: boolean;
  userIds: string[];
  /** 角色 code 数组（角色选择器以 code 为值） */
  roleCodes: string[];
  dutyIds: string[];
  /** 部门 id 数组，含子部门 */
  deptIds: string[];
}

/** 翻译函数签名（与 $t 一致），保持 data.ts 不依赖运行时 i18n 实例 */
export type Translate = (key: string, params?: Record<string, any>) => string;

/** 各字段类型允许的操作符 */
export const FIELD_TYPE_OPS: Record<FieldDef['type'], CondOp[]> = {
  number: ['=', '!=', '>', '>=', '<', '<='],
  string: ['=', '!=', 'contains'],
  enum: ['=', 'in'],
};

/** 默认通知模板（仅工厂函数使用，设计器不暴露编辑入口） */
export const DEFAULT_NOTIFY_TEMPLATE = 'approval_todo';

/* ============================================================
   能力注册表
   ============================================================ */

/** 审批人规则注册项 */
export interface ApproverRuleDef {
  /** 规则名语言包 key */
  labelKey: string;
  /** 默认参数工厂（切换类型时整体重置 param） */
  defaultParam: () => Record<string, any>;
  /** 参数面板组件（props: { node: ApproverNode }，直接双向编辑 reactive 节点） */
  panel: Component;
}

/**
 * 审批人规则注册表：key = approverType。
 * 新增规则 = 注册一条 + 一个 panels/ 面板组件；存量 role/post 不在此注册。
 */
export const APPROVER_RULES: Record<string, ApproverRuleDef> = {
  users: {
    labelKey: 'approval.designer.config.typeUsers',
    defaultParam: () => ({ userIds: [] }),
    panel: UsersPanel,
  },
  supervisor: {
    labelKey: 'approval.designer.config.typeSupervisor',
    defaultParam: () => ({}),
    panel: SupervisorPanel,
  },
  self_select: {
    labelKey: 'approval.designer.config.typeSelfSelect',
    defaultParam: () => ({ multiple: false }),
    panel: SelfSelectPanel,
  },
  duty: {
    labelKey: 'approval.designer.config.typeDuty',
    defaultParam: () => ({ dutyIds: [] }),
    panel: DutyPanel,
  },
};

/** 节点类型注册项 */
export interface NodeTypeDef {
  /** 插入菜单项语言包 key */
  labelKey: string;
  /** 插入菜单项图标 */
  icon: string;
  /** 新节点工厂 */
  create: () => FlowNode;
}

export type NodeType = 'approver' | 'branch' | 'cc';

/** 节点类型注册表：新增节点类型 = 注册一项 + 一个卡片组件 */
export const NODE_TYPES: Record<NodeType, NodeTypeDef> = {
  approver: {
    labelKey: 'approval.designer.addApprover',
    icon: 'lucide:user-check',
    create: () => createApproverNode(),
  },
  branch: {
    labelKey: 'approval.designer.addBranch',
    icon: 'lucide:git-branch',
    create: () => createBranchNode(),
  },
  cc: {
    labelKey: 'approval.designer.addCc',
    icon: 'lucide:send',
    create: () => createCcNode(),
  },
};

/** 抄送节点默认值 */
export const CC_DEFAULTS = {
  name: '',
  ccUserIds: [] as string[],
  allowSelfSelect: false,
};

/* ============================================================
   工厂函数
   ============================================================ */

/** 按审批人类型生成默认 param：优先注册表，存量类型保留 v1 结构（切换类型时整体重置） */
export function defaultParam(type: ApproverType): Record<string, any> {
  const rule = APPROVER_RULES[type];
  if (rule) return rule.defaultParam();
  switch (type) {
    case 'post': {
      return { postId: '' };
    }
    case 'role': {
      return { roleCode: '' };
    }
    default: {
      return {};
    }
  }
}

/** 新建空条件 */
export function createCond(): Cond {
  return { field: '', op: '=', value: undefined };
}

/** 新建审批人节点 */
export function createApproverNode(): ApproverNode {
  return {
    type: 'approver',
    name: '',
    approverType: 'users',
    param: defaultParam('users'),
    approvalMode: 'any',
    quorumCount: null,
    notifyTemplate: DEFAULT_NOTIFY_TEMPLATE,
    childNode: null,
  };
}

/** 新建抄送节点 */
export function createCcNode(): CcNode {
  return {
    type: 'cc',
    ...CC_DEFAULTS,
    ccUserIds: [],
    childNode: null,
  };
}

/** 新建分支列：isDefault 为默认分支（空条件组） */
export function createBranch(name: string, isDefault = false): Branch {
  return {
    name,
    priority: 0,
    conditionGroups: isDefault ? [] : [[createCond()]],
    childNode: null,
  };
}

/** 新建条件分支节点：默认一列条件分支 + 一列默认分支 */
export function createBranchNode(): BranchNode {
  return {
    type: 'branch',
    branches: [createBranch(''), createBranch('', true)],
    childNode: null,
  };
}

/** 新建发起人范围（默认所有人） */
export function createInitiatorScope(): InitiatorScope {
  return { all: true, userIds: [], roleCodes: [], dutyIds: [], deptIds: [] };
}

/* ============================================================
   遍历 / 回显规范化
   ============================================================ */

/** 递归遍历节点树 */
export function walkNodes(node: FlowNode | null, cb: (n: FlowNode) => void): void {
  if (!node) return;
  cb(node);
  if (node.type === 'approver' || node.type === 'cc') {
    walkNodes(node.childNode, cb);
  } else {
    node.branches.forEach(b => walkNodes(b.childNode, cb));
    walkNodes(node.childNode, cb);
  }
}

/** 审批人 param 回显规范化：存量 self_select 的 min/max 折算为 multiple */
function normalizeApproverParam(approverType: ApproverType, raw: any): Record<string, any> {
  const param = raw && typeof raw === 'object' ? { ...raw } : defaultParam(approverType);
  if (approverType === 'self_select' && !('multiple' in param)) {
    param.multiple = (param.max ?? 1) > 1;
    delete param.min;
    delete param.max;
  }
  return param;
}

/** 回显规范化：补齐缺省字段，保证编辑态对象结构完整（存量 role/post/cc 均不崩） */
export function normalizeNode(node: any): FlowNode | null {
  if (!node || typeof node !== 'object') return null;
  if (node.type === 'approver') {
    const approverType: ApproverType = node.approverType ?? 'users';
    return {
      type: 'approver',
      name: node.name ?? '',
      approverType,
      param: normalizeApproverParam(approverType, node.param),
      approvalMode: node.approvalMode ?? 'any',
      quorumCount: node.quorumCount ?? null,
      notifyTemplate: node.notifyTemplate ?? DEFAULT_NOTIFY_TEMPLATE,
      childNode: normalizeNode(node.childNode),
    };
  }
  if (node.type === 'cc') {
    return {
      type: 'cc',
      name: node.name ?? '',
      ccUserIds: Array.isArray(node.ccUserIds) ? node.ccUserIds : [],
      allowSelfSelect: Boolean(node.allowSelfSelect),
      childNode: normalizeNode(node.childNode),
    };
  }
  if (node.type === 'branch') {
    return {
      type: 'branch',
      branches: Array.isArray(node.branches)
        ? node.branches.map((b: any, i: number) => ({
            name: b.name ?? '',
            priority: b.priority ?? i + 1,
            conditionGroups: Array.isArray(b.conditionGroups) ? b.conditionGroups : [],
            childNode: normalizeNode(b.childNode),
          }))
        : [],
      childNode: normalizeNode(node.childNode),
    };
  }
  return null;
}

/** 发起人范围回显规范化：缺省/全空 = 所有人 */
export function normalizeScope(raw: any): InitiatorScope {
  const scope = createInitiatorScope();
  if (!raw || typeof raw !== 'object') return scope;
  scope.userIds = Array.isArray(raw.userIds) ? raw.userIds : [];
  scope.roleCodes = Array.isArray(raw.roleCodes) ? raw.roleCodes : [];
  scope.dutyIds = Array.isArray(raw.dutyIds) ? raw.dutyIds : [];
  scope.deptIds = Array.isArray(raw.deptIds) ? raw.deptIds : [];
  if (typeof raw.all === 'boolean') {
    scope.all = raw.all;
  } else {
    scope.all =
      scope.userIds.length === 0 &&
      scope.roleCodes.length === 0 &&
      scope.dutyIds.length === 0 &&
      scope.deptIds.length === 0;
  }
  return scope;
}

/* ============================================================
   卡片摘要
   ============================================================ */

/** 操作符展示：in/contains 走语言包，比较符直接显示符号 */
export function opText(op: CondOp, t: Translate): string {
  return op === 'in' || op === 'contains' ? t(`approval.designer.op.${op}`) : op;
}

/** 单条件摘要：字段显示名 操作符 值 */
export function condText(cond: Cond, fields: FieldDef[], t: Translate): string {
  const field = fields.find(f => f.name === cond.field);
  const label = field?.label || cond.field || '?';
  const value = Array.isArray(cond.value) ? cond.value.join(' / ') : (cond.value ?? '');
  return `${label} ${opText(cond.op, t)} ${value}`;
}

/** 分支条件摘要：组内「且」、组间「或」；默认分支返回提示文案 */
export function branchSummary(branch: Branch, fields: FieldDef[], t: Translate): string {
  if (branch.conditionGroups.length === 0) {
    return t('approval.designer.defaultBranchTip');
  }
  const text = branch.conditionGroups
    .map(group => group.map(c => condText(c, fields, t)).join(` ${t('approval.designer.and')} `))
    .filter(Boolean)
    .join(` ${t('approval.designer.or')} `);
  return text || t('approval.designer.summary.emptyCondition');
}

/** 审批人规则摘要：注册类型按规则展示，存量类型直接显示原始类型名 */
export function approverSummary(node: ApproverNode, t: Translate): string {
  const p = node.param ?? {};
  switch (node.approverType) {
    case 'duty': {
      const count = Array.isArray(p.dutyIds) ? p.dutyIds.length : 0;
      return count > 0
        ? t('approval.designer.summary.dutyCount', { count })
        : t('approval.designer.summary.emptyApprover');
    }
    case 'self_select': {
      return p.multiple
        ? t('approval.designer.summary.selfSelectMulti')
        : t('approval.designer.summary.selfSelectSingle');
    }
    case 'supervisor': {
      return t('approval.designer.summary.supervisor');
    }
    case 'users': {
      const count = Array.isArray(p.userIds) ? p.userIds.length : 0;
      return count > 0
        ? t('approval.designer.summary.usersCount', { count })
        : t('approval.designer.summary.emptyApprover');
    }
    default: {
      // 存量 role/post 等未注册类型：回显原始类型名，不崩
      return t('approval.designer.summary.legacyType', { type: node.approverType });
    }
  }
}

/** 抄送节点摘要 */
export function ccSummary(node: CcNode, t: Translate): string {
  const parts: string[] = [];
  const count = Array.isArray(node.ccUserIds) ? node.ccUserIds.length : 0;
  if (count > 0) parts.push(t('approval.designer.summary.usersCount', { count }));
  if (node.allowSelfSelect) parts.push(t('approval.designer.summary.ccSelfSelect'));
  return parts.join(' + ') || t('approval.designer.summary.ccEmpty');
}

/** 发起人范围摘要 */
export function scopeSummary(scope: InitiatorScope, t: Translate): string {
  if (scope.all) return t('approval.designer.starterAll');
  const parts: string[] = [];
  if (scope.userIds.length > 0) parts.push(t('approval.designer.scope.summaryUsers', { count: scope.userIds.length }));
  if (scope.roleCodes.length > 0) parts.push(t('approval.designer.scope.summaryRoles', { count: scope.roleCodes.length }));
  if (scope.dutyIds.length > 0) parts.push(t('approval.designer.scope.summaryDuties', { count: scope.dutyIds.length }));
  if (scope.deptIds.length > 0) parts.push(t('approval.designer.scope.summaryDepts', { count: scope.deptIds.length }));
  return parts.join('、') || t('approval.designer.starterAll');
}

/** 通过方式摘要 */
export function approvalModeText(node: ApproverNode, t: Translate): string {
  if (node.approvalMode === 'all') return t('approval.designer.summary.modeAll');
  if (node.approvalMode === 'quorum') {
    return t('approval.designer.summary.modeQuorum', { count: node.quorumCount ?? 1 });
  }
  return t('approval.designer.summary.modeAny');
}

/* ============================================================
   保存前本地校验
   ============================================================ */

/** 条件是否填写完整（值允许 0/false，不允许空串/空数组/null/undefined） */
function isCondIncomplete(cond: Cond): boolean {
  if (!cond.field) return true;
  const v = cond.value;
  if (v === undefined || v === null || v === '') return true;
  return Array.isArray(v) && v.length === 0;
}

/**
 * 保存前本地校验，返回错误文案数组（空数组 = 通过）：
 * 流程名/bizType 必填、至少一个审批人节点、注册的审批人规则参数完整
 * （存量未注册类型跳过参数校验）、抄送节点至少有指定人或允许自选、
 * 分支至少 2 列且至多一个默认分支、非默认分支条件填写完整。
 */
export function validateFlow(flow: FlowDef, name: string, bizType: string, t: Translate): string[] {
  const errors: string[] = [];
  if (!name?.trim()) errors.push(t('approval.designer.validate.flowNameRequired'));
  if (!bizType?.trim()) errors.push(t('approval.designer.validate.bizTypeRequired'));

  let approverCount = 0;
  walkNodes(flow.root, node => {
    if (node.type === 'approver') {
      approverCount += 1;
      const label = node.name || t('approval.designer.approver');
      if (!node.name?.trim()) errors.push(t('approval.designer.validate.nameRequired'));

      // 注册的规则校验参数完整；存量未注册类型（role/post）跳过参数校验
      if (APPROVER_RULES[node.approverType]) {
        if (node.approverType === 'users') {
          if (!Array.isArray(node.param?.userIds) || node.param.userIds.length === 0) {
            errors.push(t('approval.designer.validate.usersRequired', { name: label }));
          }
        } else if (node.approverType === 'duty') {
          if (!Array.isArray(node.param?.dutyIds) || node.param.dutyIds.length === 0) {
            errors.push(t('approval.designer.validate.dutyRequired', { name: label }));
          }
        }
      }

      if (node.approvalMode === 'quorum' && !(node.quorumCount !== null && node.quorumCount >= 1)) {
        errors.push(t('approval.designer.validate.quorumRequired', { name: label }));
      }
      return;
    }

    if (node.type === 'cc') {
      if (!node.allowSelfSelect && (!Array.isArray(node.ccUserIds) || node.ccUserIds.length === 0)) {
        const label = node.name || t('approval.designer.cc');
        errors.push(t('approval.designer.validate.ccRequired', { name: label }));
      }
      return;
    }

    // 分支节点校验
    if (node.branches.length < 2) errors.push(t('approval.designer.validate.branchMin'));
    const defaultCount = node.branches.filter(b => b.conditionGroups.length === 0).length;
    if (defaultCount > 1) errors.push(t('approval.designer.validate.branchDefaultMax'));
    node.branches.forEach(b => {
      if (b.conditionGroups.length === 0) return; // 默认分支无条件
      const incomplete = b.conditionGroups.some(
        group => group.length === 0 || group.some(c => isCondIncomplete(c)),
      );
      if (incomplete) {
        const branchLabel = b.name || t('approval.designer.branchNode');
        errors.push(t('approval.designer.validate.branchCondIncomplete', { name: branchLabel }));
      }
    });
  });

  if (approverCount === 0) errors.push(t('approval.designer.validate.noApprover'));
  return errors;
}
