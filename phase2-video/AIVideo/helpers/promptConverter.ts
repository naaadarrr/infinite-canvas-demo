/**
 * Prompt 转换工具
 * 统一处理 prompt 文本中 @Image/@Video 标签与 <<<Image>>>/<<<Video>>> 占位符之间的转换
 *
 * 格式说明：
 * - UI 格式：@Image1, @Image2, @Video1, @Video2 等（用于 contentEditable 显示）
 * - API 格式：<<<Image1>>>, <<<Image2>>>, <<<Video1>>>, <<<Video2>>> 等（用于 API 提交）
 * - 旧格式兼容：<<<image_1>>>, <<<video_1>>> 等（兼容旧数据）
 */

/**
 * 将 API 格式的占位符转换为 UI 格式的标签
 * 用于从 API 数据或旧格式数据初始化 UI 显示
 *
 * @param prompt - 包含 <<<ImageX>>> 或 <<<image_X>>> 格式的 prompt
 * @returns 转换为 @ImageX 格式的 prompt
 *
 * @example
 * normalizePromptToUI("<<<Image1>>> test <<<image_2>>>")
 * // => "@Image1 test @Image2"
 */
export function normalizePromptToUI(prompt: string): string {
  if (!prompt) return '';

  return (
    prompt
      // 转换 <<<ImageX>>> 为 @ImageX
      .replace(/<<<Image(\d+)>>>/g, (_, id) => `@Image${id}`)
      // 转换 <<<image_X>>> 为 @ImageX（兼容旧格式）
      .replace(/<<<image_(\d+)>>>/gi, (_, id) => `@Image${id}`)
      // 转换 <<<VideoX>>> 为 @VideoX
      .replace(/<<<Video(\d+)>>>/g, (_, id) => `@Video${id}`)
      // 转换 <<<video_X>>> 为 @VideoX（兼容旧格式）
      .replace(/<<<video_(\d+)>>>/gi, (_, id) => `@Video${id}`)
      // 兼容旧格式 <<<video_X>>>（无数字）转为 @Video1
      .replace(/<<<video_\d*>>>/gi, '@Video1')
  );
}

/**
 * 将 UI 格式的标签转换为 API 格式的占位符
 * 用于提交到 API 时转换
 *
 * @param prompt - 包含 @ImageX 或 @VideoX 格式的 prompt
 * @returns 转换为 <<<ImageX>>> 格式的 prompt
 *
 * @example
 * normalizePromptToAPI("@Image1 test @Image2")
 * // => "<<<Image1>>> test <<<Image2>>>"
 */
export function normalizePromptToAPI(prompt: string): string {
  if (!prompt) return '';

  return (
    prompt
      // 转换 @ImageX 为 <<<ImageX>>>
      .replace(/@Image(\d+)/g, (_, id) => `<<<Image${id}>>>`)
      // 转换 @VideoX 为 <<<VideoX>>>
      .replace(/@Video(\d+)/g, (_, id) => `<<<Video${id}>>>`)
      // 兼容 @Video（无数字）转为 <<<Video1>>>
      .replace(/@Video\b/g, '<<<Video1>>>')
  );
}

/**
 * 检查 prompt 中是否包含图片标签
 *
 * @param prompt - 要检查的 prompt
 * @returns 是否包含图片标签
 */
export function hasImageTags(prompt: string): boolean {
  return /@Image\d+/.test(prompt) || /<<<Image\d+>>>/.test(prompt);
}

/**
 * 检查 prompt 中是否包含视频标签
 *
 * @param prompt - 要检查的 prompt
 * @returns 是否包含视频标签
 */
export function hasVideoTags(prompt: string): boolean {
  return /@Video\d*/.test(prompt) || /<<<Video\d*>>>/.test(prompt);
}

/**
 * 从 prompt 中提取所有图片索引
 *
 * @param prompt - 要解析的 prompt
 * @returns 图片索引数组（从 1 开始）
 *
 * @example
 * extractImageIndices("@Image1 test @Image3")
 * // => [1, 3]
 */
export function extractImageIndices(prompt: string): number[] {
  const matches = prompt.matchAll(/(?:@Image|<<<Image)(\d+)(?:>>>)?/g);
  const indices = Array.from(matches, (match) => parseInt(match[1], 10));
  return [...new Set(indices)].sort((a, b) => a - b);
}

/**
 * 从 prompt 中提取所有视频索引
 *
 * @param prompt - 要解析的 prompt
 * @returns 视频索引数组（从 1 开始）
 *
 * @example
 * extractVideoIndices("@Video1 test @Video2")
 * // => [1, 2]
 */
export function extractVideoIndices(prompt: string): number[] {
  const matches = prompt.matchAll(/(?:@Video|<<<Video)(\d*)(?:>>>)?/g);
  const indices = Array.from(matches, (match) => {
    const index = match[1];
    // 如果没有数字，默认为 1
    return index ? parseInt(index, 10) : 1;
  });
  return [...new Set(indices)].sort((a, b) => a - b);
}

/**
 * 重新编号 prompt 中的图片标签
 * 用于图片删除后重新编号
 *
 * @param prompt - 原始 prompt
 * @param deletedIndex - 被删除的图片索引（从 1 开始）
 * @returns 重新编号后的 prompt
 *
 * @example
 * renumberImageTags("@Image1 @Image2 @Image3", 2)
 * // => "@Image1 @Image2"（原来的 Image3 变成 Image2）
 */
export function renumberImageTags(
  prompt: string,
  deletedIndex: number
): string {
  let result = prompt;

  // 先删除被删除的标签
  result = result.replace(new RegExp(`@Image${deletedIndex}\\b`, 'g'), '');
  result = result.replace(new RegExp(`<<<Image${deletedIndex}>>>`, 'g'), '');

  // 重新编号后面的标签
  const maxIndex = Math.max(...extractImageIndices(result), 0);
  for (let i = deletedIndex + 1; i <= maxIndex; i++) {
    const newIndex = i - 1;
    result = result.replace(
      new RegExp(`@Image${i}\\b`, 'g'),
      `@Image${newIndex}`
    );
    result = result.replace(
      new RegExp(`<<<Image${i}>>>`, 'g'),
      `<<<Image${newIndex}>>>`
    );
  }

  // 清理多余空格
  result = result.replace(/\s+/g, ' ').trim();

  return result;
}

/**
 * 重新编号 prompt 中的视频标签
 * 用于视频删除后重新编号
 *
 * @param prompt - 原始 prompt
 * @param deletedIndex - 被删除的视频索引（从 1 开始）
 * @returns 重新编号后的 prompt
 */
export function renumberVideoTags(
  prompt: string,
  deletedIndex: number
): string {
  let result = prompt;

  // 先删除被删除的标签
  result = result.replace(new RegExp(`@Video${deletedIndex}\\b`, 'g'), '');
  result = result.replace(new RegExp(`<<<Video${deletedIndex}>>>`, 'g'), '');

  // 重新编号后面的标签
  const maxIndex = Math.max(...extractVideoIndices(result), 0);
  for (let i = deletedIndex + 1; i <= maxIndex; i++) {
    const newIndex = i - 1;
    result = result.replace(
      new RegExp(`@Video${i}\\b`, 'g'),
      `@Video${newIndex}`
    );
    result = result.replace(
      new RegExp(`<<<Video${i}>>>`, 'g'),
      `<<<Video${newIndex}>>>`
    );
  }

  // 清理多余空格
  result = result.replace(/\s+/g, ' ').trim();

  return result;
}
