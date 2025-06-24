import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { z } from 'zod';

/**
 * Parse markdown content with frontmatter
 * @param content Markdown content with YAML frontmatter
 * @returns Object containing frontmatter and markdown content
 */
export function parseMarkdown<T = Record<string, any>>(content: string): { frontmatter: T; content: string } {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { frontmatter: {} as T, content };
  }

  const yamlContent = match[1];
  const markdownContent = content.slice(match[0].length);

  try {
    const frontmatter = parseYaml(yamlContent) as T;
    return { frontmatter, content: markdownContent };
  } catch (error) {
    console.error('Error parsing YAML frontmatter:', error);
    return { frontmatter: {} as T, content };
  }
}

/**
 * Stringify markdown content with frontmatter
 * @param frontmatter Frontmatter object
 * @param content Markdown content
 * @returns String with YAML frontmatter and markdown content
 */
export function stringifyMarkdown(frontmatter: Record<string, any>, content: string): string {
  const yamlContent = stringifyYaml(frontmatter, {
    sortMapEntries: true,
    lineWidth: 0
  }).trim();

  return `---\n${yamlContent}\n---\n\n${content}`;
}

/**
 * Validate frontmatter against a Zod schema
 * @param data Frontmatter data to validate
 * @param schema Zod schema to validate against
 * @returns Validated frontmatter data
 */
export function validateFrontmatter<T>(
  data: unknown,
  schema: z.ZodSchema<T>
): T {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    throw new Error(`Invalid frontmatter: ${result.error.message}`);
  }
  
  return result.data;
}

/**
 * Parse and validate markdown content with frontmatter
 * @param content Markdown content with YAML frontmatter
 * @param schema Zod schema for frontmatter validation
 * @returns Object containing validated frontmatter and markdown content
 */
export function parseAndValidateMarkdown<T>(
  content: string,
  schema: z.ZodSchema<T>
): { frontmatter: T; content: string } {
  const { frontmatter, content: markdownContent } = parseMarkdown<T>(content);
  const validatedFrontmatter = validateFrontmatter(frontmatter, schema);
  return { frontmatter: validatedFrontmatter, content: markdownContent };
}
