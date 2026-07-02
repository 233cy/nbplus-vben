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

  /* 验证码 */
  /** 验证码校验失败 */
  CAPTCHA_CHECK_FAILED = 20_101,
  /** 验证码类型不合法 */
  CAPTCHA_TYPE_INVALID = 20_100,

  /** 部门编码自动生成失败，请手动填写 */
  DEPT_CODE_GENERATE_FAILED = 40_403,
  /* 部门管理 */
  /** 该部门存在子部门，请先删除子部门 */
  DEPT_HAS_CHILDREN = 40_400,
  /** 该部门下存在用户，无法删除 */
  DEPT_HAS_USERS = 40_401,
  /** 上级部门选择无效，不能选择自身或不存在的部门 */
  DEPT_PARENT_INVALID = 40_402,
  /* 字典管理 */
  /** 字典编码已存在 */
  DICT_CODE_EXISTS = 40_300,

  /** 字典项存在子项，不可删除 */
  DICT_ITEM_HAS_CHILDREN = 40_301,

  /* 菜单管理 */
  /** 存在子节点，不可删除 */
  MENU_HAS_CHILDREN = 40_100,
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

  /* 职务管理 */
  /** 职务编码已存在 */
  POST_CODE_EXISTS = 40_500,

  /** 职务编码自动生成失败，请手动填写 */
  POST_CODE_GENERATE_FAILED = 40_501,
  /** 该联系方式尚未绑定 */
  PROFILE_CONTACT_NOT_BOUND = 30_021,
  /* 个人中心 */
  /** 旧密码不正确 */
  PROFILE_OLD_PASSWORD_WRONG = 30_020,

  /** 角色编码已存在 */
  ROLE_CODE_EXISTS = 40_601,
  /* 角色管理 */
  /** 角色编码不能为空 */
  ROLE_CODE_REQUIRED = 40_600,
  /** 角色不存在或已删除 */
  ROLE_NOT_FOUND = 40_602,

  /* 安全防护 - 防爆破 */
  /** 登录频率超限，触发限流 */
  SAFE_LOGIN_THROTTLE = 20_200,

  /** MFA 渠道未开启 */
  SAFE_MFA_CHANNEL_OFF = 20_211,
  /** MFA 验证码已失效（错误次数超限） */
  SAFE_MFA_CODE_EXPIRED = 20_215,
  /** MFA 验证码无效 */
  SAFE_MFA_CODE_INVALID = 20_213,
  /* 安全防护 - MFA 多因素认证 */
  SAFE_MFA_REQUIRED = 20_210,
  /** MFA 验证码发送失败 */
  SAFE_MFA_SEND_FAILED = 20_212,
  /** 账号已绑定 TOTP，需完成 TOTP 二步验证 */
  SAFE_TOTP_REQUIRED = 20_214,

  /* 存储配置 / 文件管理 */
  /** 存储桶未配置 */
  STORAGE_BUCKET_NOT_CONFIGURED = 20_056,
}
