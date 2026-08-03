/** 单个目标的投递结果（与后端 SendResult.results 项结构一致） */
export interface SendResultItem {
  success: boolean;
  skipped?: boolean;
  skipReason?: string;
  messageId?: string;
  errorMessage?: string;
  rawResponse?: unknown;
}
