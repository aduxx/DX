export enum DocType {
  NOTICE = '通知',
  ANNOUNCEMENT = '公告',
  OPINION = '意见',
  DECISION = '决定',
  REPORT = '报告',
  REQUEST = '请示',
  APPROVAL = '批复',
  MINUTES = '纪要',
  LETTER = '函'
}

export enum UrgencyLevel {
  NONE = '',
  URGENT = '急件',
  EXTRA_URGENT = '特急'
}

export enum SecrecyLevel {
  NONE = '',
  SECRET = '秘密',
  CONFIDENTIAL = '机密',
  TOP_SECRET = '绝密'
}

export interface DocData {
  issuer: string; // 发文机关 (e.g., XX市人民政府)
  docType: DocType; // 文种 (e.g., 通知)
  docNumber: string; // 发文字号 (e.g., X府发〔2024〕1号)
  secrecy: SecrecyLevel;
  urgency: UrgencyLevel;
  recipient: string; // 主送机关
  title: string; // 标题
  content: string; // 正文
  signer: string; // 落款单位/人
  date: string; // 成文日期 (YYYY-MM-DD format for storage, converted to Chinese for display)
}
