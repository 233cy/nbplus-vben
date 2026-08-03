import React, { useState, useMemo } from 'react';
import { 
  Shield, Save, Users, Layers, ChevronDown, ChevronRight, 
  Search, Check, MinusSquare, Package, Info, Sliders, CheckCircle2, AlertCircle
} from 'lucide-react';

// 完整解析用户提供的 JSON 菜单数据 (保持原始 ID)
const rawMenuData = [
  {
    "id": "929441819569164288",
    "parentId": null,
    "type": 1,
    "title": "测试页面",
    "name": "demo",
    "path": "/demo",
    "status": 1,
    "children": [
      {
        "id": "929441986137559040",
        "parentId": "929441819569164288",
        "type": 2,
        "title": "整体测试",
        "name": "index",
        "path": "index",
        "status": 1
      }
    ]
  },
  {
    "id": "1909901000000000001",
    "parentId": null,
    "type": 1,
    "title": "系统管理",
    "name": "AdmSysMgt",
    "path": "/adm/sys/mgt",
    "status": 1,
    "children": [
      {
        "id": "897508243272802304",
        "parentId": "1909901000000000001",
        "type": 2,
        "title": "字典管理",
        "name": "AdmSysDict",
        "path": "dict",
        "status": 1
      },
      {
        "id": "1909901000000000002",
        "parentId": "1909901000000000001",
        "type": 2,
        "title": "系统参数",
        "name": "AdmSysConfig",
        "path": "config",
        "status": 1
      },
      {
        "id": "1909901000000000003",
        "parentId": "1909901000000000001",
        "type": 2,
        "title": "人机验证",
        "name": "AdmSysCaptchaDriver",
        "path": "captcha-driver",
        "status": 1
      },
      {
        "id": "928449345438064640",
        "parentId": "1909901000000000001",
        "type": 2,
        "title": "文件管理",
        "name": "AdmSysFile",
        "path": "file",
        "status": 1,
        "children": [
          {"id": "928449345488396288", "parentId": "928449345438064640", "type": 3, "title": "查询", "permission": "adm:sys:file:list"},
          {"id": "928449345488396289", "parentId": "928449345438064640", "type": 3, "title": "详情", "permission": "adm:sys:file:detail"},
          {"id": "928449345488396290", "parentId": "928449345438064640", "type": 3, "title": "删除", "permission": "adm:sys:file:delete"},
          {"id": "928449345488396291", "parentId": "928449345438064640", "type": 3, "title": "批量删除", "permission": "adm:sys:file:batchDelete"},
          {"id": "928449345488396292", "parentId": "928449345438064640", "type": 3, "title": "迁移", "permission": "adm:sys:file:move"},
          {"id": "928449345488396293", "parentId": "928449345438064640", "type": 3, "title": "批量迁移", "permission": "adm:sys:file:batchMove"}
        ]
      },
      {
        "id": "928449345446453248",
        "parentId": "1909901000000000001",
        "type": 2,
        "title": "存储配置",
        "name": "AdmSysStorage",
        "path": "storage",
        "status": 1,
        "children": [
          {"id": "928449345488396294", "parentId": "928449345446453248", "type": 3, "title": "查询", "permission": "adm:sys:storage:list"},
          {"id": "928449345488396295", "parentId": "928449345446453248", "type": 3, "title": "详情", "permission": "adm:sys:storage:detail"},
          {"id": "928449345488396296", "parentId": "928449345446453248", "type": 3, "title": "新增", "permission": "adm:sys:storage:create"},
          {"id": "928449345488396297", "parentId": "928449345446453248", "type": 3, "title": "编辑", "permission": "adm:sys:storage:update"},
          {"id": "928449345488396298", "parentId": "928449345446453248", "type": 3, "title": "删除", "permission": "adm:sys:storage:delete"},
          {"id": "928449345488396299", "parentId": "928449345446453248", "type": 3, "title": "批量删除", "permission": "adm:sys:storage:batchDelete"},
          {"id": "928449345488396300", "parentId": "928449345446453248", "type": 3, "title": "切换状态", "permission": "adm:sys:storage:toggle"},
          {"id": "928449345488396301", "parentId": "928449345446453248", "type": 3, "title": "设为默认", "permission": "adm:sys:storage:setDefault"}
        ]
      }
    ]
  },
  {
    "id": "928009320862691328",
    "parentId": null,
    "type": 1,
    "title": "组织管理",
    "name": "AdmSysOrg",
    "path": "/adm/sys/org",
    "status": 1,
    "children": [
      {
        "id": "907578921578090496",
        "parentId": "928009320862691328",
        "type": 2,
        "title": "用户管理",
        "name": "AdmSysUser",
        "path": "user",
        "status": 1,
        "children": [
          {"id": "907578921729085440", "parentId": "907578921578090496", "type": 3, "title": "查询", "permission": "adm:sys:user:list"},
          {"id": "907578921808777216", "parentId": "907578921578090496", "type": 3, "title": "详情", "permission": "adm:sys:user:detail"},
          {"id": "907578921888468992", "parentId": "907578921578090496", "type": 3, "title": "新增", "permission": "adm:sys:user:create"},
          {"id": "907578921963966464", "parentId": "907578921578090496", "type": 3, "title": "编辑", "permission": "adm:sys:user:update"},
          {"id": "907578922052046848", "parentId": "907578921578090496", "type": 3, "title": "删除", "permission": "adm:sys:user:delete"},
          {"id": "907578922135932928", "parentId": "907578921578090496", "type": 3, "title": "批量删除", "permission": "adm:sys:user:batchDelete"},
          {"id": "90757892228207616", "parentId": "907578921578090496", "type": 3, "title": "批量修改", "permission": "adm:sys:user:batchUpdate"}
        ]
      },
      {
        "id": "927607256109993984",
        "parentId": "928009320862691328",
        "type": 2,
        "title": "职务管理",
        "name": "AdmSysPost",
        "path": "post",
        "status": 1,
        "children": [
          {"id": "927607256151937024", "parentId": "927607256109993984", "type": 3, "title": "查询", "permission": "adm:sys:post:list"},
          {"id": "927607256151937025", "parentId": "927607256109993984", "type": 3, "title": "详情", "permission": "adm:sys:post:detail"},
          {"id": "927607256151937026", "parentId": "927607256109993984", "type": 3, "title": "新增", "permission": "adm:sys:post:create"},
          {"id": "927607256151937027", "parentId": "927607256109993984", "type": 3, "title": "编辑", "permission": "adm:sys:post:update"},
          {"id": "927607256151937028", "parentId": "927607256109993984", "type": 3, "title": "删除", "permission": "adm:sys:post:delete"},
          {"id": "927607256151937029", "parentId": "927607256109993984", "type": 3, "title": "批量删除", "permission": "adm:sys:post:batchDelete"},
          {"id": "927607256151937030", "parentId": "927607256109993984", "type": 3, "title": "批量修改", "permission": "adm:sys:post:batchUpdate"},
          {"id": "928009320808165376", "parentId": "927607256109993984", "type": 3, "title": "行内编辑", "permission": "adm:sys:post:inlineUpdate"}
        ]
      },
      {
        "id": "1909901000000000005",
        "parentId": "928009320862691328",
        "type": 2,
        "title": "部门管理",
        "name": "AdmSysDept",
        "path": "dept",
        "status": 1
      }
    ]
  },
  {
    "id": "928009320862691329",
    "parentId": null,
    "type": 1,
    "title": "权限管理",
    "name": "AdmSysAuth",
    "path": "/adm/sys/auth",
    "status": 1,
    "children": [
      {
        "id": "928009320862691330",
        "parentId": "928009320862691329",
        "type": 2,
        "title": "角色管理",
        "name": "AdmSysRole",
        "path": "role",
        "status": 1,
        "children": [
          {"id": "928013275609030656", "parentId": "928009320862691330", "type": 3, "title": "查询", "permission": "adm:sys:role:list"},
          {"id": "928013275617419264", "parentId": "928009320862691330", "type": 3, "title": "详情", "permission": "adm:sys:role:detail"},
          {"id": "928013275617419265", "parentId": "928009320862691330", "type": 3, "title": "新增", "permission": "adm:sys:role:create"},
          {"id": "928013275617419266", "parentId": "928009320862691330", "type": 3, "title": "编辑", "permission": "adm:sys:role:update"},
          {"id": "928013275617419267", "parentId": "928009320862691330", "type": 3, "title": "删除", "permission": "adm:sys:role:delete"},
          {"id": "928013275617419268", "parentId": "928009320862691330", "type": 3, "title": "批量删除", "permission": "adm:sys:role:batchDelete"},
          {"id": "928013275617419269", "parentId": "928009320862691330", "type": 3, "title": "批量修改", "permission": "adm:sys:role:batchUpdate"},
          {"id": "928013275617419270", "parentId": "928009320862691330", "type": 3, "title": "分配菜单权限", "permission": "adm:sys:role:assignMenus"},
          {"id": "928013275617419271", "parentId": "928009320862691330", "type": 3, "title": "分配数据权限", "permission": "adm:sys:role:assignDataScope"}
        ]
      },
      {
        "id": "1909901000000000004",
        "parentId": "928009320862691329",
        "type": 2,
        "title": "菜单管理",
        "name": "AdmSysMenu",
        "path": "menu",
        "status": 1
      }
    ]
  },
  {
    "id": "896917472538697728",
    "parentId": null,
    "type": 1,
    "title": "开发管理",
    "name": "DevManage",
    "path": "/dev",
    "status": 1,
    "children": [
      {
        "id": "896937506317246464",
        "parentId": "896917472538697728",
        "type": 2,
        "title": "CURD管理",
        "name": "DevCurd",
        "path": "curd",
        "status": 1
      }
    ]
  }
];

const mockRoles = [
  { id: '1', name: '超级管理员', code: 'SUPER_ADMIN', desc: '系统内最高管理权限', permissions: ['all'] },
  { id: '2', name: '系统维护专员', code: 'SYS_MAINTAINER', desc: '负责系统参数与存储配置', permissions: ['1909901000000000001', '1909901000000000002', '928449345446453248'] },
  { id: '3', name: 'HR/组织人事', code: 'HR_MANAGER', desc: '管理部门、职务及用户数据', permissions: ['928009320862691328', '907578921578090496'] }
];

const mockPermissionPacks = [
  { id: 'pack_1', name: '基础常用包', desc: '包含全局的字典查询和测试页面', permissions: ['929441819569164288', '929441986137559040', '897508243272802304'] },
  { id: 'pack_2', name: '文件完全管理包', desc: '提供完整的文件管理上传、查询、迁移和删除能力', permissions: ['1909901000000000001', '928449345438064640', '928449345488396288', '928449345488396289', '928449345488396290', '928449345488396291'] }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('direct'); 
  const [currentRoleId, setCurrentRoleId] = useState('2'); 
  const [checkedKeys, setCheckedKeys] = useState(mockRoles[1].permissions); 
  const [selectedPacks, setSelectedPacks] = useState(['pack_1']);
  const [searchTerm, setSearchTerm] = useState('');
  const [collapsedGroupIds, setCollapsedGroupIds] = useState([]);
  const [toastMsg, setToastMsg] = useState(null);

  // 扁平化权限表用于快速级联匹配
  const { allPermissionsMap, allNodeIds } = useMemo(() => {
    const map = {};
    const ids = [];
    const traverse = (node) => {
      map[node.id] = node;
      ids.push(node.id);
      if (node.children) node.children.forEach(traverse);
    };
    rawMenuData.forEach(traverse);
    return { allPermissionsMap: map, allNodeIds: ids };
  }, []);

  const showToast = (message, type = 'success') => {
    setToastMsg({ text: message, type });
    setTimeout(() => setToastMsg(null), 3000);
  };

  const currentRole = useMemo(() => {
    return mockRoles.find(r => r.id === currentRoleId) || mockRoles[0];
  }, [currentRoleId]);

  const handleSelectRole = (roleId) => {
    setCurrentRoleId(roleId);
    const role = mockRoles.find(r => r.id === roleId);
    setCheckedKeys(role.permissions);
    showToast(`成功载入 ${role.name} 的授权数据`);
  };

  const getDescendantIds = (node) => {
    let result = [];
    const traverse = (n) => {
      result.push(n.id);
      if (n.children) n.children.forEach(traverse);
    };
    if (node.children) node.children.forEach(traverse);
    return result;
  };

  const getAncestorIds = (targetId) => {
    const path = [];
    const findPath = (nodes, currentPath) => {
      for (let node of nodes) {
        if (node.id === targetId) {
          path.push(...currentPath);
          return true;
        }
        if (node.children) {
          if (findPath(node.children, [...currentPath, node.id])) return true;
        }
      }
      return false;
    };
    findPath(rawMenuData, []);
    return path;
  };

  const handleCheckChange = (node, isChecked) => {
    if (activeTab === 'pack') return;
    let nextChecked = [...checkedKeys];
    const descendantIds = getDescendantIds(node);
    const targetIds = [node.id, ...descendantIds];

    if (isChecked) {
      targetIds.forEach(id => {
        if (!nextChecked.includes(id)) nextChecked.push(id);
      });
      const ancestorIds = getAncestorIds(node.id);
      ancestorIds.forEach(pId => {
        if (!nextChecked.includes(pId)) nextChecked.push(pId);
      });
    } else {
      nextChecked = nextChecked.filter(id => !targetIds.includes(id));
      const checkParentStatus = (nId) => {
        const ancestors = getAncestorIds(nId);
        for (let i = ancestors.length - 1; i >= 0; i--) {
          const pId = ancestors[i];
          const parentNode = allPermissionsMap[pId];
          if (parentNode && parentNode.children) {
            const hasCheckedSibling = parentNode.children.some(child => nextChecked.includes(child.id));
            if (!hasCheckedSibling) nextChecked = nextChecked.filter(id => id !== pId);
          }
        }
      };
      checkParentStatus(node.id);
    }
    setCheckedKeys(nextChecked);
  };

  const getNodeCheckState = (node) => {
    if (checkedKeys.includes(node.id)) {
      if (node.children && node.children.length > 0) {
        const descendantIds = getDescendantIds(node);
        const allSelected = descendantIds.every(id => checkedKeys.includes(id));
        return allSelected ? 2 : 1;
      }
      return 2;
    } else {
      if (node.children && node.children.length > 0) {
        const descendantIds = getDescendantIds(node);
        const hasAnySelected = descendantIds.some(id => checkedKeys.includes(id));
        return hasAnySelected ? 1 : 0;
      }
      return 0;
    }
  };

  const handlePackToggle = (packId) => {
    let nextPacks = [...selectedPacks];
    if (nextPacks.includes(packId)) {
      nextPacks = nextPacks.filter(id => id !== packId);
    } else {
      nextPacks.push(packId);
    }
    setSelectedPacks(nextPacks);

    const mergedPerms = new Set();
    nextPacks.forEach(pId => {
      const pack = mockPermissionPacks.find(p => p.id === pId);
      if (pack) pack.permissions.forEach(permId => mergedPerms.add(permId));
    });
    setCheckedKeys(Array.from(mergedPerms));
  };

  const filteredData = useMemo(() => {
    if (!searchTerm) return rawMenuData;
    const filter = (nodes) => {
      return nodes.reduce((acc, node) => {
        const isMatch = node.title.toLowerCase().includes(searchTerm.toLowerCase());
        let childrenFiltered = [];
        if (node.children) childrenFiltered = filter(node.children);
        if (isMatch || childrenFiltered.length > 0) {
          acc.push({ ...node, children: childrenFiltered.length > 0 ? childrenFiltered : node.children });
        }
        return acc;
      }, []);
    };
    return filter(rawMenuData);
  }, [searchTerm]);

  return (
    <div className="p-6 bg-slate-50 min-h-screen text-slate-800 font-sans">
      {toastMsg && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg border transition-all duration-300 ${
          toastMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'
        }`}>
          {toastMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-amber-600" />}
          <span className="text-sm font-medium">{toastMsg.text}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/20 p-2.5 rounded-xl border border-blue-400/30">
              <Shield className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold">后台管理权限矩阵分配</h1>
              <p className="text-xs text-slate-400">支持直接细粒度菜单勾选与高内聚权限包快速指派</p>
            </div>
          </div>

          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => setActiveTab('direct')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                activeTab === 'direct' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" /> 直接菜单分配
            </button>
            <button
              onClick={() => {
                setActiveTab('pack');
                handlePackToggle(selectedPacks[0] || 'pack_1');
              }}
              className={`px-4 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all ${
                activeTab === 'pack' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Package className="w-3.5 h-3.5" /> 权限包分配模式
            </button>
          </div>
        </div>

        {/* Tip bar */}
        <div className="bg-blue-50/70 border-b border-blue-100 px-6 py-3 flex items-center gap-2 text-xs text-blue-800">
          <Info className="w-4 h-4 text-blue-500 shrink-0" />
          <span>
            {activeTab === 'direct' 
              ? '当前为【直接菜单授权】。支持针对具体模块和页面、按钮进行点击，并开启父子联动高亮。' 
              : '当前为【权限包授权】。通过给角色分配“包”快捷同步，此时树形图为包内权限预览态（置灰只读）。'}
          </span>
        </div>

        <div className="flex flex-col lg:flex-row min-h-[500px]">
          {/* Left panel */}
          <div className="w-full lg:w-80 border-r border-slate-150 p-5 bg-slate-50/50 flex flex-col gap-5">
            <div className="bg-white p-4 rounded-xl border shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">正在操作的角色</span>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-500" /> {currentRole.name}
              </h3>
              <p className="text-xs text-slate-500 mt-1">{currentRole.desc}</p>
            </div>

            {activeTab === 'direct' ? (
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">切换其他角色</span>
                {mockRoles.map(role => (
                  <button
                    key={role.id}
                    onClick={() => handleSelectRole(role.id)}
                    className={`w-full p-3 rounded-lg text-left border text-xs flex items-center justify-between transition-all ${
                      currentRoleId === role.id ? 'bg-slate-900 border-slate-900 text-white shadow-sm' : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>{role.name}</span>
                    <span className="text-[10px] opacity-75">{role.code}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">可选预置权限包</span>
                {mockPermissionPacks.map(pack => {
                  const isChecked = selectedPacks.includes(pack.id);
                  return (
                    <div
                      key={pack.id}
                      onClick={() => handlePackToggle(pack.id)}
                      className={`p-3.5 rounded-xl cursor-pointer border text-xs transition-all ${
                        isChecked ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isChecked ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'}`}>
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 block">{pack.name}</span>
                          <p className="text-[10px] text-slate-500 mt-1 leading-normal">{pack.desc}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Panel (Tree) */}
          <div className="flex-1 p-6 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-xl border">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="搜索菜单或权限点..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="text-xs text-slate-500 font-medium">
                已选中 <span className="text-blue-600 font-bold font-mono text-sm">{checkedKeys.length}</span> 个权限节点
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto max-h-[60vh] pr-2">
              {filteredData.map(level1 => {
                const isCollapsed = collapsedGroupIds.includes(level1.id);
                const lvl1State = getNodeCheckState(level1);

                return (
                  <div key={level1.id} className="border rounded-xl bg-white overflow-hidden shadow-sm">
                    {/* Level 1 Folder */}
                    <div className="flex items-center justify-between p-3 bg-slate-100/50 border-b">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            if (isCollapsed) setCollapsedGroupIds(collapsedGroupIds.filter(id => id !== level1.id));
                            else setCollapsedGroupIds([...collapsedGroupIds, level1.id]);
                          }}
                          className="p-1 rounded hover:bg-slate-200 text-slate-500"
                        >
                          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        <button
                          disabled={activeTab === 'pack'}
                          onClick={() => handleCheckChange(level1, lvl1State !== 2)}
                          className={`w-4 h-4 rounded flex items-center justify-center transition-all ${
                            lvl1State === 2 ? 'bg-blue-600 text-white' : lvl1State === 1 ? 'bg-blue-400 text-white' : 'border border-slate-300 bg-white'
                          }`}
                        >
                          {lvl1State === 2 && <Check className="w-3 h-3 stroke-[3]" />}
                          {lvl1State === 1 && <MinusSquare className="w-3 h-3 stroke-[3]" />}
                        </button>
                        <span className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-slate-400" /> {level1.title}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">ID: {level1.id}</span>
                    </div>

                    {/* Level 2 & 3 Items */}
                    {!isCollapsed && level1.children && (
                      <div className="p-4 space-y-4 divide-y divide-slate-100">
                        {level1.children.map(level2 => {
                          const lvl2State = getNodeCheckState(level2);
                          const hasButtons = level2.children && level2.children.length > 0;

                          return (
                            <div key={level2.id} className="pt-3 first:pt-0">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-2.5">
                                  <button
                                    disabled={activeTab === 'pack'}
                                    onClick={() => handleCheckChange(level2, lvl2State !== 2)}
                                    className={`w-4 h-4 rounded flex items-center justify-center transition-all ${
                                      lvl2State === 2 ? 'bg-blue-600 text-white' : lvl2State === 1 ? 'bg-blue-400 text-white' : 'border border-slate-300 bg-white'
                                    }`}
                                  >
                                    {lvl2State === 2 && <Check className="w-3 h-3 stroke-[3]" />}
                                    {lvl2State === 1 && <MinusSquare className="w-3 h-3 stroke-[3]" />}
                                  </button>
                                  <span className="text-xs font-semibold text-slate-800">{level2.title}</span>
                                </div>
                                <span className="text-[10px] text-slate-400 font-mono">ID: {level2.id}</span>
                              </div>

                              {/* Level 3 Horizontal Grid */}
                              {hasButtons && (
                                <div className="mt-2.5 ml-6 bg-slate-50 rounded-xl border p-3">
                                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                    {level2.children.map(level3 => {
                                      const isBtnChecked = checkedKeys.includes(level3.id);
                                      return (
                                        <div
                                          key={level3.id}
                                          onClick={() => handleCheckChange(level3, !isBtnChecked)}
                                          className={`p-2 rounded-lg border flex items-center gap-2 select-none transition-all ${
                                            activeTab !== 'pack' ? 'cursor-pointer' : 'cursor-not-allowed'
                                          } ${isBtnChecked ? 'bg-white border-blue-200 text-blue-700 shadow-sm' : 'bg-white/50 border-slate-200 text-slate-600'}`}
                                        >
                                          <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border shrink-0 ${isBtnChecked ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'}`}>
                                            {isBtnChecked && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                                          </div>
                                          <span className="text-[11px] font-medium truncate">{level3.title}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="border-t pt-4 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">操作用户: 管理员</span>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleSelectRole(currentRoleId)}
                  className="px-4 py-2 text-xs border border-slate-300 hover:bg-slate-50 bg-white rounded-xl text-slate-700 transition-all"
                >
                  重置分配
                </button>
                <button
                  onClick={() => showToast(`权限配置保存成功！关联 ${checkedKeys.length} 个权限节点。`)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl text-xs font-semibold shadow-md flex items-center gap-1.5 transition-all"
                >
                  <Save className="w-4 h-4" /> 确认保存
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}