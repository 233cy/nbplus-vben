/**
 * 业务错误码枚举
 * 与后端约定，统一在此维护
 */
export enum BizCode {
  /* 认证授权 */
  /** 登录失败（账号或密码错误） */
  AUTH_LOGIN_FAILED = 30_000,
  /** Token 无效或已过期 */
  AUTH_TOKEN_INVALID = 30_002,
  /** 账号已被禁用 */
  AUTH_USER_DISABLED = 30_001,
  /** 用户不存在 */
  AUTH_USER_NOT_FOUND = 30_003,

  /** 验证码校验失败 */
  CAPTCHA_CHECK_FAILED = 20_101,
  /* 验证码 */
  /** 验证码类型不合法 */
  CAPTCHA_TYPE_INVALID = 20_100,

  /* OSS 文件 */
  /** 获取访问链接失败 */
  OSS_ACCESS_LINK = 20_000,
  /** 文件路径非法 */
  OSS_FILE_PATH = 20_002,
  /** 签名被篡改 */
  OSS_SIGNATURE_TAMPERED = 20_001,
  /** 文件传输异常 */
  OSS_TRANSFER_ERROR = 20_003,
  /** 上传内容不是文件 */
  OSS_UPLOAD_NOT_FILE = 20_004,

  /* 安全防护 - 防爆破 */
  /** 登录频率超限，触发限流 */
  SAFE_LOGIN_THROTTLE = 20_200,

  /** MFA 渠道未开启 */
  SAFE_MFA_CHANNEL_OFF = 20_211,
  /** MFA 验证码无效或已过期 */
  SAFE_MFA_CODE_INVALID = 20_213,
  /* 安全防护 - MFA 多因素认证 */
  /** 需要 MFA 验证 */
  SAFE_MFA_REQUIRED = 20_210,
  /** MFA 验证码发送失败 */
  SAFE_MFA_SEND_FAILED = 20_212,
}
