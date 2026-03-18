# AI Avatar 试听收费方案改动

> 日期：2026-01-19
> 分支：feature/AI-avatar-tts-free-trial

## 需求背景

### 问题 1：免费试听被滥用

原本的试听逻辑存在漏洞，部分用户会钻空子盗刷试听 API 接口，造成服务成本损失。需要通过限制每日免费试听额度来防止滥用。

### 问题 2：时长上限增加导致试听成本上升

Avatar 4 模型的时长上限已从 120 秒增加到 180 秒，意味着单次试听生成的音频可能会很长。继续提供无限量免费试听将导致成本不可控，因此需要引入试听收费机制。

---

## 需求概述

1. **试听触发方式调整**：不再自动触发试听，改成需要用户手动点击触发试听音频合成
2. **免费试听额度**：每人每日 1200 字符的免费试听额度，用完后每次试听收取 0.1 credits
3. **积分预估显示**：当用户采用文字输入脚本时，Generate 按钮上的积分根据字符数预估（每 15 字符 = 0.1 credits），价格前带 ≈ 符号，info 提示价格仅供参考
4. **付费用户时长上限提升**：pro/business 用户的视频时长上限从 120 秒提升到 180 秒，字符数限制相应调整

---

## 改动文件

| 文件路径                      | 改动类型 |
| ----------------------------- | -------- |
| `AvatarScript.tsx`            | 修改     |
| `index.tsx`                   | 修改     |
| `../../index.tsx` (ToolPanel) | 修改     |

---

## 详细改动

### 1. AvatarScript.tsx

#### 1.1 付费用户时长上限提升

**改动前**：

```typescript
const USER_LIMITS = {
  free: {
    maxCharacters: 450,
    maxSeconds: 30,
    hardLimit: Math.floor(450 * 1.5)
  },
  premium: {
    maxCharacters: 1800,
    maxSeconds: 120,
    hardLimit: Math.floor(1800 * 1.5)
  }
};
```

**改动后**：

```typescript
const USER_LIMITS = {
  free: {
    maxCharacters: 450,
    maxSeconds: 30,
    hardLimit: Math.floor(450 * 1.5)
  },
  premium: {
    maxCharacters: 2700,
    maxSeconds: 180,
    hardLimit: Math.floor(2700 * 1.5)
  }
};
```

#### 1.2 移除自动触发试听逻辑

**改动前**：当脚本内容变化时，会自动触发试听音频生成（3 秒 debounce 后）

**改动后**：脚本内容变化时只清除已有的试听音频，不再自动触发新的试听

```typescript
// 改动前
useEffect(() => {
  if (prevScriptTextRef.current !== scriptText) {
    // 清除已有的试听音频
    // ...

    // 在文字输入模式下，自动触发试听
    if (scriptMode === ScriptMode.Text) {
      // 设置 3 秒 debounce，3秒内没有新变更才真正发起试听
      autoPreviewDebounceRef.current = setTimeout(() => {
        triggerAutoPreview();
      }, 3000);
    }
  }
}, [scriptText, hasPreviewAudio, scriptMode]);

// 改动后
useEffect(() => {
  if (prevScriptTextRef.current !== scriptText) {
    // 只清除已有的试听音频，不再自动触发
    if (hasPreviewAudio) {
      setHasPreviewAudio(false);
      // ...
    }
  }
}, [scriptText, hasPreviewAudio]);
```

#### 1.3 新增 TTS 试听配额接口

```typescript
/** TTS 试听配额信息 */
export interface TtsPreviewQuota {
  /** 每日免费字符额度 */
  dailyFreeCharacters: number;
  /** 今日已使用的字符数 */
  usedCharactersToday: number;
  /** 超出免费额度后每次试听的费用 */
  costPerPreview: number;
}

/** 默认 TTS 试听配额配置 */
export const DEFAULT_TTS_PREVIEW_QUOTA: TtsPreviewQuota = {
  dailyFreeCharacters: 1200,
  usedCharactersToday: 0,
  costPerPreview: 0.1
};
```

#### 1.4 新增 Props

```typescript
interface AvatarScriptProps {
  // ... 原有 props
  /** TTS 试听配额信息 */
  ttsPreviewQuota?: TtsPreviewQuota;
  /** 当试听生成时的回调，返回消耗的字符数 */
  onPreviewGenerate?: (characterCount: number) => void;
}
```

#### 1.5 更新试听按钮 Tooltip

显示剩余免费字符数和超出后的费用：

```tsx
{
  freeCharactersRemaining > 0 ? (
    <>
      <div>
        <span className='text-green-400'>{freeCharactersRemaining}</span> free
        characters left today.
      </div>
      <div>
        Each additional preview: {ttsPreviewQuota.costPerPreview} credit.
      </div>
    </>
  ) : (
    <div>
      Each preview:{' '}
      <span className='text-amber-400'>{ttsPreviewQuota.costPerPreview}</span>{' '}
      credit.
    </div>
  );
}
```

---

### 2. index.tsx (AiAvatar)

#### 2.1 新增辅助函数

```typescript
/** 去除标签后的纯文本长度 */
const getPlainTextLength = (text: string): number => {
  const PAUSE_TAG_REGEX = /<break time="(\d+\.?\d*)s" \/>/g;
  const PRON_TAG_REGEX = /\[pron:([^\|]+)\|([^\]]+)\]/g;
  return text.replace(PAUSE_TAG_REGEX, '').replace(PRON_TAG_REGEX, '$1').trim()
    .length;
};
```

#### 2.2 新增状态

```typescript
// TTS 试听配额状态（Mock: 后续从 API 获取）
const [ttsPreviewQuota, setTtsPreviewQuota] = useState<TtsPreviewQuota>(
  DEFAULT_TTS_PREVIEW_QUOTA
);
```

#### 2.3 修改积分预估逻辑

**改动前**：Text 模式下必须有试听音频时长才能计算积分

**改动后**：

- **Import 模式**：使用上传音频的时长精确计算
- **Text 模式**：
  - 有试听音频时长 → 精确计算
  - 无试听音频时长 → 根据字符数预估（每 15 字符 = 0.1 credits）

```typescript
useEffect(() => {
  let credits: number | undefined;
  let isEstimated = false; // 是否为预估值

  if (scriptMode === ScriptMode.Import && audioRange && model) {
    // Import 模式：精确计算
    const duration = audioRange.end - audioRange.start;
    credits = duration * model.creditsPerSecond;
    isEstimated = false;
  } else if (scriptMode === ScriptMode.Text && model) {
    const charCount = getPlainTextLength(scriptText);
    if (charCount > 0) {
      if (previewDuration) {
        // 已有试听音频时长，精确计算
        credits = previewDuration * model.creditsPerSecond;
        isEstimated = false;
      } else {
        // 无试听音频，根据字符数预估（每15字符=0.1credits）
        credits = Math.ceil(charCount / 15) * 0.1;
        isEstimated = true;
      }
    }
  }

  onValueChange('estimatedCredits', credits);
  onValueChange('isEstimatedCredits', isEstimated);
}, [scriptMode, audioRange, previewDuration, formValues.modelId, scriptText]);
```

#### 2.4 新增回调处理

```typescript
// 处理试听生成（更新已使用字符数）
const handlePreviewGenerate = (characterCount: number) => {
  setTtsPreviewQuota((prev) => ({
    ...prev,
    usedCharactersToday: prev.usedCharactersToday + characterCount
  }));
  // TODO: 调用 API 记录字符消耗
};
```

---

### 3. ToolPanel/index.tsx

#### 3.1 更新 Generate 按钮显示

**改动前**：直接显示积分数值

**改动后**：

- 预估值时显示 `≈` 符号（如 `≈0.2`）
- 精确值时正常显示（如 `0.2`）

```typescript
const isEstimated = formValues.isEstimatedCredits === true;
const totalCost = hasCredits
  ? formatCredits(formValues.estimatedCredits as number)
  : '--';
const displayCost = isEstimated ? `≈${totalCost}` : totalCost;
```

#### 3.2 更新 Info Tooltip

**改动前**：只显示"X credits per second"

**改动后**：

- 预估值时：_"Estimated cost. Actual price is based on generated audio duration (X credits/sec)."_
- 精确值时：_"X credits per second"_

```tsx
<span className='...tooltip...'>
  {isEstimated ? (
    <>
      Estimated cost. Actual price is based on generated audio duration (
      {creditsPerSecond} credits/sec).
    </>
  ) : (
    <>{creditsPerSecond} credits per second</>
  )}
</span>
```

---

## 数据流

```
用户输入脚本文字
       ↓
AvatarScript 组件
  - 显示剩余免费字符数
  - 用户点击试听按钮
       ↓
onPreviewGenerate 回调
  - 更新 usedCharactersToday
  - TODO: 调用 API 记录消耗
       ↓
AiAvatar 组件
  - 计算 estimatedCredits
  - 设置 isEstimatedCredits 标志
       ↓
ToolPanel Generate 按钮
  - 显示 ≈ 符号（预估值）
  - 显示对应的 info 提示
```

---

## 用户限制配置

| 用户类型                 | 字符数上限 | 时长上限 | 硬限制（可超出） |
| ------------------------ | ---------- | -------- | ---------------- |
| 免费用户                 | 450        | 30 秒    | 675              |
| 付费用户（pro/business） | 2700       | 180 秒   | 4050             |

> 计算规则：约 15 字符/秒，硬限制为字符上限的 1.5 倍

---

## 待办事项

- [ ] 接入 `queryVideoAvatarTtsFreeCharacterCredits` API 获取真实的免费字符配额
- [ ] 实现试听消耗的 API 调用
- [ ] 处理免费额度用完后的付费逻辑

---

## 测试要点

1. **试听触发**：确认脚本变化时不再自动触发试听，只有点击按钮才触发
2. **免费额度显示**：确认 hover 试听按钮时正确显示剩余免费字符数
3. **积分预估**：确认 Text 模式下输入文字后 Generate 按钮显示 `≈` 符号
4. **精确计算**：确认点击试听生成音频后，积分变为精确值（无 `≈` 符号）
5. **Info 提示**：确认预估值和精确值时 info 提示内容不同
6. **付费用户限制**：确认 pro/business 用户显示 2700 字符 / 180 秒上限
7. **免费用户限制**：确认免费用户仍显示 450 字符 / 30 秒上限
