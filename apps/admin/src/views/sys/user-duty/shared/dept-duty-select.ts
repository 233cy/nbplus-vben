/**
 * 部门+职务联动选择的值契约（dept-duty-select.vue 的 v-model 结构）.
 */
export interface DeptDutyValue {
  deptId: string;
  deptName?: string;
  /** 单选：职务ID */
  dutyId?: string;
  dutyName?: string;
  /** 多选：职务ID数组 */
  dutyIds?: string[];
  dutyNames?: string[];
}
