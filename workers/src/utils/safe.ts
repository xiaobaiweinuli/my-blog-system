import xss from 'xss';
import { Filter } from 'bad-words';
import { ApiError } from '../types';

// 敏感词过滤器初始化（支持自定义扩展）
const filter = new Filter();
filter.addWords('法轮功', '台独', '习近平', '共产党', '暴力', '恐怖', '淫秽', '裸聊', '诈骗', '辱华', '反动');
export function containsSensitiveWords(text: string): boolean {
  return filter.isProfane(text);
}
export function strongSanitizeHtml(input: string): string {
  return xss(input, {
    whiteList: {
      a: ['href', 'title', 'target', 'rel'],
      b: [], i: [], u: [], p: [], br: [], ul: [], ol: [], li: [], strong: [], em: [], span: ['style', 'class'], div: ['style', 'class'],
    },
    stripIgnoreTag: true,
    stripIgnoreTagBody: ['script', 'style', 'iframe', 'object', 'embed'],
    css: false,
  });
}

export function validateEmailOptions({ subject, html, from, verifyUrl }: { subject?: string; html?: string; from?: string; verifyUrl?: string; }) {
  if (subject && (typeof subject !== 'string' || subject.length > 100)) {
    throw new ApiError('邮件标题无效，必须为100字符以内的字符串', 400);
  }
  if (subject && containsSensitiveWords(subject)) {
    throw new ApiError('邮件标题包含敏感词', 400);
  }
  if (html && (typeof html !== 'string' || html.length > 5000)) {
    throw new ApiError('邮件内容无效，必须为5000字符以内的字符串', 400);
  }
  if (html && containsSensitiveWords(html)) {
    throw new ApiError('邮件内容包含敏感词', 400);
  }
  if (from && (typeof from !== 'string' || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(from))) {
    throw new ApiError('发件人邮箱格式无效', 400);
  }
  if (verifyUrl && (typeof verifyUrl !== 'string' || !/^https?:\/\//.test(verifyUrl) || verifyUrl.length > 300)) {
    throw new ApiError('验证链接无效，必须为 http(s):// 开头且不超过300字符', 400);
  }
}

export function requireFields(obj: any, fields: string[]) {
  for (const field of fields) {
    if (!obj[field]) throw new ApiError(`${field} 不能为空`, 400);
  }
}

export function isValidEmail(email: string) {
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
} 