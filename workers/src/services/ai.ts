import { SummaryRequest, ApiError } from '../types';
import { stripHtml, truncateText } from '@/utils';

/**
 * AI 服务类
 */
export class AIService {
  private ai: any;

  constructor(ai: any) {
    this.ai = ai;
  }

  /**
   * 生成文章摘要
   */
  async generateSummary(request: SummaryRequest): Promise<string> {
    const { content, maxLength = 100000 } = request;
    if (!content || content.trim().length === 0) {
      throw new ApiError('Content cannot be empty', 400);
    }
    // 自动适配 prompt
    const prompt = this.isEnglishText(content)
      ? `Summarize the following text in less than ${maxLength} words:\n${content}`
      : `请用不超过${maxLength}字的中文总结以下内容：\n${content}`;
    try {
      const response = await this.ai.run('@cf/meta/llama-3.1-8b-instruct-fast', {
        prompt,
        max_tokens: maxLength,
      });
      let summary = response?.response || '';
      if (summary.length > maxLength) summary = summary.slice(0, maxLength);
      return summary;
    } catch (error) {
      return this.generateSimpleSummary(content, maxLength);
    }
  }

  /**
   * 从大模型输出中解析标签，去除前缀、换行、序号等，仅保留标签
   */
  private parseTagsFromLLMOutput(output: string): string[] {
    // 去掉前缀和换行
    let text = output.replace(/^[^:：]*[:：]/, '').replace(/\n/g, ' ').trim();
    // 先尝试逗号分割
    let tags = text.split(/,|，/).map((t: string) => t.replace(/^[0-9.\s]+/, '').replace(/[<>【】]/g, '').trim()).filter(Boolean);
    // 如果分割后少于2个，尝试用数字序号分割
    if (tags.length < 2) {
      tags = text.split(/[0-9]+[.、]/).map((t: string) => t.replace(/[<>【】]/g, '').trim()).filter(Boolean);
    }
    // 只保留前5个
    return tags.slice(0, 5);
  }

  /**
   * 生成标签建议（llama-3.1-8b-instruct-fast）
   */
  async generateTags(title: string, content: string): Promise<string[]> {
    const text = `${title}\n\n${stripHtml(content)}`;
    const prompt = this.isEnglishText(text)
      ? `Generate 5 topic tags for the following content, separated by commas:\n${text}`
      : `请为以下内容生成5个主题标签，用逗号分隔：\n${text}`;
    try {
      const response = await this.ai.run('@cf/meta/llama-3.1-8b-instruct-fast', {
        prompt,
        max_tokens: 60,
      });
      let tagsText = response?.response || '';
      let tags = this.parseTagsFromLLMOutput(tagsText);
      if (tags.length === 0) tags = this.extractKeywords(text);
      return tags;
    } catch (error) {
      return this.extractKeywords(text);
    }
  }

  /**
   * 内容质量分析（用大模型生成优点和建议，异常时本地分析）
   */
  async analyzeContent(title: string, content: string): Promise<{
    score: number;
    readabilityScore: number;
    sentimentScore: number;
    suggestions: string[];
    strengths: string[];
  }> {
    try {
      const text = stripHtml(content);
      // 构造 prompt
      const prompt = this.isEnglishText(text)
        ? `Please analyze the following article and give 2-3 strengths and 2-3 suggestions for improvement. Return strengths and suggestions as two comma-separated lists.\nTitle: ${title}\nContent: ${text}`
        : `请分析以下文章内容，分别给出2-3条优点和2-3条改进建议。优点和建议请分别用逗号分隔。\n标题：${title}\n内容：${text}`;
      const response = await this.ai.run('@cf/meta/llama-3.1-8b-instruct-fast', {
        prompt,
        max_tokens: 200,
      });
      let output = response?.response || '';
      // 解析优点和建议
      let strengths: string[] = [];
      let suggestions: string[] = [];
      // 尝试用“优点/strengths/建议/suggestions”分割
      if (/优点[:：]/.test(output) && /建议[:：]/.test(output)) {
        const parts = output.split(/建议[:：]/);
        strengths = parts[0].replace(/优点[:：]/, '').split(/,|，/).map((s: string) => s.trim()).filter(Boolean);
        suggestions = (parts[1] || '').split(/,|，/).map((s: string) => s.trim()).filter(Boolean);
      } else if (/Strengths[:：]/i.test(output) && /Suggestions[:：]/i.test(output)) {
        const parts = output.split(/Suggestions[:：]/i);
        strengths = parts[0].replace(/Strengths[:：]/i, '').split(/,|，/).map((s: string) => s.trim()).filter(Boolean);
        suggestions = (parts[1] || '').split(/,|，/).map((s: string) => s.trim()).filter(Boolean);
      } else {
        // fallback: 直接用逗号分割前半为优点，后半为建议
        const arr = output.split(/\n|\r|。/).map((s: string) => s.trim()).filter(Boolean);
        strengths = arr.slice(0, 2);
        suggestions = arr.slice(2, 5);
      }
      // 其它分数仍用本地逻辑
      const wordCount = text.split(/\s+/).length;
      const sentenceCount = text.split(/[.!?。！？]/).length;
      const avgSentenceLength = wordCount / sentenceCount;
      let readabilityScore = 80;
      if (avgSentenceLength > 25) readabilityScore -= 10;
      if (avgSentenceLength > 40) readabilityScore -= 20;
      if (wordCount < 100) readabilityScore -= 15;
      let sentimentScore = 50;
      // 英文内容可用AI情感分析
      if (this.isEnglishText(text)) {
        try {
          const sentimentResponse = await this.ai.run('@cf/huggingface/distilbert-sst-2-int8', {
            text: truncateText(text, 500),
          });
          if (sentimentResponse && sentimentResponse.label) {
            sentimentScore = sentimentResponse.label === 'POSITIVE' ? 75 : 25;
          }
        } catch {}
      }
      const score = Math.round((readabilityScore + sentimentScore) / 2);
      return {
        score: Math.max(0, Math.min(100, score)),
        readabilityScore: Math.max(0, Math.min(100, readabilityScore)),
        sentimentScore: Math.max(0, Math.min(100, sentimentScore)),
        suggestions,
        strengths,
      };
    } catch (error) {
      // fallback: 本地分析
      const text = stripHtml(content);
      const wordCount = text.split(/\s+/).length;
      const sentenceCount = text.split(/[.!?。！？]/).length;
      const avgSentenceLength = wordCount / sentenceCount;
      let readabilityScore = 80;
      if (avgSentenceLength > 25) readabilityScore -= 10;
      if (avgSentenceLength > 40) readabilityScore -= 20;
      if (wordCount < 100) readabilityScore -= 15;
      let sentimentScore = 50;
      const suggestions: string[] = [];
      const strengths: string[] = [];
      if (wordCount < 300) {
        suggestions.push('内容较短，建议增加更多详细信息');
      } else if (wordCount > 2000) {
        strengths.push('内容详实丰富');
      } else {
        strengths.push('内容长度适中');
      }
      if (avgSentenceLength > 30) {
        suggestions.push('句子较长，建议分解为更短的句子');
      } else {
        strengths.push('句子长度合适，易于阅读');
      }
      if (title.length < 10) {
        suggestions.push('标题较短，建议增加描述性词汇');
      } else if (title.length > 60) {
        suggestions.push('标题较长，建议简化');
      } else {
        strengths.push('标题长度适中');
      }
      const score = Math.round((readabilityScore + sentimentScore) / 2);
      return {
        score: Math.max(0, Math.min(100, score)),
        readabilityScore: Math.max(0, Math.min(100, readabilityScore)),
        sentimentScore: Math.max(0, Math.min(100, sentimentScore)),
        suggestions,
        strengths,
      };
    }
  }

  /**
   * 翻译文本（简化版）
   */
  async translateText(text: string, targetLanguage: string = 'zh'): Promise<string> {
    try {
      // 注意：这里需要使用支持翻译的模型
      // Cloudflare Workers AI 可能需要不同的模型
      const response = await this.ai.run('@cf/meta/m2m100-1.2b', {
        text,
        source_lang: 'en',
        target_lang: targetLanguage,
      });

      return response.translated_text || text;
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    }
  }

  /**
   * 检测文本语言
   */
  private isEnglishText(text: string): boolean {
    // 简单的英文检测：如果大部分字符是 ASCII 字符，认为是英文
    const asciiCount = text.split('').filter(char => char.charCodeAt(0) < 128).length;
    return asciiCount / text.length > 0.8;
  }

  /**
   * 简单的中文翻译（备用方案）
   */
  private async translateToChineseSimple(text: string): Promise<string | null> {
    try {
      return await this.translateText(text, 'zh');
    } catch {
      return null;
    }
  }

  /**
   * 生成简单摘要（备用方案）
   */
  private generateSimpleSummary(content: string, maxLength: number): string {
    const cleanContent = stripHtml(content);
    const sentences = cleanContent.split(/[.!?。！？]/).filter(s => s.trim().length > 10);
    
    if (sentences.length === 0) {
      return '这篇文章探讨了相关主题，提供了有价值的见解和分析。';
    }
    
    // 选择前几个句子作为摘要
    let summary = '';
    for (const sentence of sentences.slice(0, 3)) {
      if (summary.length + sentence.length > maxLength) break;
      summary += sentence.trim() + '。';
    }
    
    if (!summary) {
      summary = sentences[0].trim() + '。';
    }
    
    return summary.length > maxLength 
      ? truncateText(summary, maxLength - 3) + '...'
      : summary;
  }

  /**
   * 提取关键词（备用方案）
   */
  private extractKeywords(text: string): string[] {
    const cleanText = stripHtml(text).toLowerCase();
    
    // 常见的技术关键词
    const techKeywords = [
      'javascript', 'typescript', 'react', 'vue', 'angular', 'nodejs',
      'python', 'java', 'golang', 'rust', 'docker', 'kubernetes',
      'aws', 'azure', 'gcp', 'mongodb', 'postgresql', 'redis',
      '前端', '后端', '全栈', '开发', '编程', '算法', '数据结构',
      '机器学习', '人工智能', 'ai', '深度学习', '数据分析'
    ];
    
    const foundKeywords: string[] = [];
    
    for (const keyword of techKeywords) {
      if (cleanText.includes(keyword) && foundKeywords.length < 5) {
        foundKeywords.push(keyword);
      }
    }
    
    // 如果没有找到技术关键词，返回通用标签
    if (foundKeywords.length === 0) {
      return ['技术', '分享'];
    }
    
    return foundKeywords;
  }
}
