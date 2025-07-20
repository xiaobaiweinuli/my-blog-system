// 邮箱验证邮件参数组装工具
export function buildVerificationEmailOptions({
  subject,
  html,
  from,
  verifyUrl,
  successRedirectUrl,
  failRedirectUrl,
  showSupportContact,
  expireMinutes,
  supportEmail,
  brandName,
  greeting,
  instruction,
  footer,
  buttonText
}: {
  subject?: string;
  html?: string;
  from?: string;
  verifyUrl?: string;
  successRedirectUrl?: string;
  failRedirectUrl?: string;
  showSupportContact?: boolean;
  expireMinutes?: number;
  supportEmail?: string;
  brandName?: string;
  greeting?: string;
  instruction?: string;
  footer?: string;
  buttonText?: string;
}) {
  return {
    subject,
    html,
    from,
    verifyUrl,
    successRedirectUrl,
    failRedirectUrl,
    showSupportContact,
    expireMinutes,
    supportEmail,
    brandName,
    greeting,
    instruction,
    footer,
    buttonText
  };
} 