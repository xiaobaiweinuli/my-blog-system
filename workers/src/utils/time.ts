export function getBeijingTimeISOString(date?: Date) {
  date = date || new Date();
  // 直接用中国时区格式化，去除斜杠，保证格式为 yyyy-MM-dd HH:mm:ss
  return date.toLocaleString('zh-CN', { hour12: false, timeZone: 'Asia/Shanghai' })
    .replace(/\//g, '-')
    .replace(/年|月/g, '-').replace('日', '') // 兼容不同环境
    .replace(/\b(\d{1,2})\b/g, (m) => m.padStart(2, '0'));
} 