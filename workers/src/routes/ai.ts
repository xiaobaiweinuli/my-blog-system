import { Env, Context, ApiError, SummaryRequest } from '../types';
import { AIService } from '../services/ai';
import { createSuccessResponse, createErrorResponse, parseJSON } from '../utils';
import { getLogger } from '../utils/logger';

/**
 * 生成文章摘要
 */
export async function generateSummary(
  request: Request,
  env: Env,
  ctx: any,
  context: Context,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  const logger = getLogger(env);
  try {
    if (!context.user) {
      throw new ApiError('Authentication required', 401);
    }
    const requestData: SummaryRequest = await parseJSON(request);
    if (!requestData.content) {
      throw new ApiError('Content is required', 400);
    }
    const aiService = new AIService(env.AI);
    const summary = await aiService.generateSummary(requestData);
    const res = createSuccessResponse({
      data: summary,
      usage: {
        promptTokens: Math.floor(requestData.content.length / 4),
        completionTokens: Math.floor(summary.length / 4),
        totalTokens: Math.floor((requestData.content.length + summary.length) / 4),
      },
    });
    const headers = new Headers(res.headers);
    const cors = corsHeaders(request);
    cors.forEach((v: string, k: string) => headers.set(k, v));
    return new Response(res.body, { status: res.status, headers });
  } catch (error) {
    await logger.error('Generate summary error', error instanceof Error ? error : new Error(String(error)));
    const headers = corsHeaders(request);
    return createErrorResponse(error instanceof ApiError ? error : 'Failed to generate summary', 500, undefined, Object.fromEntries(headers.entries()));
  }
}

/**
 * 生成标签建议
 */
export async function generateTags(
  request: Request,
  env: Env,
  ctx: any,
  context: Context,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  const logger = getLogger(env);
  try {
    if (!context.user) {
      throw new ApiError('Authentication required', 401);
    }

    const { title, content } = await parseJSON(request);
    
    if (!title || !content) {
      throw new ApiError('Title and content are required', 400);
    }

    const aiService = new AIService(env.AI);
    const tags = await aiService.generateTags(title, content);

    const res = createSuccessResponse({
      data: tags,
      usage: {
        promptTokens: Math.floor((title.length + content.length) / 4),
        completionTokens: Math.floor(tags.join('').length / 4),
        totalTokens: Math.floor((title.length + content.length + tags.join('').length) / 4),
      },
    });
    const headers = new Headers(res.headers);
    const cors = corsHeaders(request);
    cors.forEach((v: string, k: string) => headers.set(k, v));
    return new Response(res.body, { status: res.status, headers });
  } catch (error) {
    await logger.error('Generate tags error', error instanceof Error ? error : new Error(String(error)));
    const headers = corsHeaders(request);
    return createErrorResponse(error instanceof ApiError ? error : 'Failed to generate tags', 500, undefined, Object.fromEntries(headers.entries()));
  }
}

/**
 * 分析内容质量
 */
export async function analyzeContent(
  request: Request,
  env: Env,
  ctx: any,
  context: Context,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  const logger = getLogger(env);
  try {
    if (!context.user) {
      throw new ApiError('Authentication required', 401);
    }

    const { title, content } = await parseJSON(request);
    
    if (!title || !content) {
      throw new ApiError('Title and content are required', 400);
    }

    const aiService = new AIService(env.AI);
    const analysis = await aiService.analyzeContent(title, content);

    const res = createSuccessResponse({
      data: analysis,
      usage: {
        promptTokens: Math.floor((title.length + content.length) / 4),
        completionTokens: 100, // 估算值
        totalTokens: Math.floor((title.length + content.length) / 4) + 100,
      },
    });
    const headers = new Headers(res.headers);
    const cors = corsHeaders(request);
    cors.forEach((v: string, k: string) => headers.set(k, v));
    return new Response(res.body, { status: res.status, headers });
  } catch (error) {
    await logger.error('Analyze content error', error instanceof Error ? error : new Error(String(error)));
    const headers = corsHeaders(request);
    return createErrorResponse(error instanceof ApiError ? error : 'Failed to analyze content', 500, undefined, Object.fromEntries(headers.entries()));
  }
}

/**
 * 翻译文本
 */
export async function translateText(
  request: Request,
  env: Env,
  ctx: any,
  context: Context,
  corsHeaders: (req: Request) => Headers
): Promise<Response> {
  const logger = getLogger(env);
  try {
    if (!context.user) {
      throw new ApiError('Authentication required', 401);
    }

    // 兼容 content/text、target_lang/targetLanguage
    const body = await parseJSON(request);
    const text = body.text || body.content;
    const targetLanguage = body.targetLanguage || body.target_lang || 'zh';
    
    if (!text) {
      throw new ApiError('Text is required', 400);
    }

    const aiService = new AIService(env.AI);
    const translatedText = await aiService.translateText(text, targetLanguage);

    const res = createSuccessResponse({
      originalText: text,
      translatedText,
      targetLanguage,
      usage: {
        promptTokens: Math.floor(text.length / 4),
        completionTokens: Math.floor(translatedText.length / 4),
        totalTokens: Math.floor((text.length + translatedText.length) / 4),
      },
    });
    const headers = new Headers(res.headers);
    const cors = corsHeaders(request);
    cors.forEach((v: string, k: string) => headers.set(k, v));
    return new Response(res.body, { status: res.status, headers });
  } catch (error) {
    await logger.error('Translate text error', error instanceof Error ? error : new Error(String(error)));
    const headers = corsHeaders(request);
    return createErrorResponse(error instanceof ApiError ? error : 'Failed to translate text', 500, undefined, Object.fromEntries(headers.entries()));
  }
}
