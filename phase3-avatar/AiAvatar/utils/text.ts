/**
 * AiAvatar 文本处理工具函数
 * 去除文本中的标签，返回纯文本长度
 */

import type { PronRule } from '@/server/api/services/tts/type';

const PAUSE_TAG_REGEX = /<break time="(\d+\.?\d*)s" \/>/g;

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 去除标签后的纯文本长度
 * 去除 `<break time="...s" />` 和 `[pron:...|...]` 标签
 * 对于发音标签，使用替换文本（newStr）计算长度，而不是原文本（oldStr）
 * @param text 原始文本
 * @returns 纯文本长度（使用替换文本计算）
 */
export const getPlainTextLength = (text: string): number => {
  const PRON_TAG_REGEX = /\[pron:([^\|]+)\|([^\]]+)\]/g;
  // 使用 $2（替换文本）而不是 $1（原文本）来计算字符数（兼容旧的带标签输入）
  return text.replace(PAUSE_TAG_REGEX, '').replace(PRON_TAG_REGEX, '$2').trim()
    .length;
};

/**
 * 计费口径下的字符数（AiAvatar：`ttsText` 已为纯文本，`pronRules` 独立存储）
 *
 * 规则：
 * - 不计入 pause 标签
 * - 对于发音规则：将 text 中的 oldStr 替换为 newStr 后再计数（按 newStr 计费）
 */
export function getBillableTextLength({
  text,
  pronRules
}: {
  text: string;
  pronRules?: PronRule[];
}): number {
  if (!text) return 0;

  const noPauseText = text.replace(PAUSE_TAG_REGEX, '').trim();
  if (!pronRules || pronRules.length === 0) return noPauseText.length;

  const oldToNew = new Map<string, string>();
  for (const rule of pronRules) {
    const oldStr = rule?.oldStr?.trim();
    const newStr = rule?.newStr?.trim();
    if (!oldStr || !newStr) continue;
    // 同 oldStr 多条规则时：以最后一次为准
    oldToNew.set(oldStr, newStr);
  }

  if (oldToNew.size === 0) return noPauseText.length;

  const oldStrs = Array.from(oldToNew.keys()).sort(
    (a, b) => b.length - a.length
  );
  const unionRegex = new RegExp(oldStrs.map(escapeRegExp).join('|'), 'g');

  const billableText = noPauseText.replace(unionRegex, (matched) => {
    return oldToNew.get(matched) ?? matched;
  });

  return billableText.length;
}
