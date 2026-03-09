# 点击素材后上方出现工具栏 - 参考文档

把 **node-toolbar-above-REFERENCE.md** 和 **node-toolbar-above-REFERENCE.tsx** 一起复制到你的项目里，然后对 AI 说：

> “请根据 node-toolbar-above-REFERENCE 里的参考，在我产品里实现：点击某个素材/节点后，在该元素**正上方**出现一个横向工具栏（如 Upscale、Remove bg 等），样式和参考里一致；点击空白或取消选中时工具栏消失。”

---

## 效果说明

- **触发**：点击素材（节点）→ 该节点变为选中 → 工具栏出现。
- **位置**：工具栏在素材**正上方**，水平居中，与素材上边缘留一定间距（如 16px）。
- **外观**：白底、圆角、阴影、细边框，内部为横向排列的按钮（如 Upscale、Remove bg）。
- **消失**：点击画布空白或点击其他节点取消选中时，工具栏隐藏。

---

## 实现方式（二选一）

| 方案 | 适用 | 说明 |
|------|------|------|
| **A：用 @xyflow/react** | 画布/节点基于 React Flow | 在自定义节点里用 `<NodeToolbar>`，传 `isVisible={selected}`、`position={Position.Top}`、`offset={16}` 等，库会渲染成 NodeToolbarPortal 并自动定位在节点上方。 |
| **B：不用 React Flow** | 普通列表/画布 | 自己维护「当前选中的素材 id」。在每条素材外层包一层 `relative` 容器，当「当前 id === 该素材 id」时，渲染一个绝对定位的 div，用 `left: 50%` + `transform: translate(-50%, -100%)` + `marginTop: -8px` 之类的方式放在上方，样式类名照抄参考里的即可。 |

---

## 原始代码位置（本项目）

- **文件**：`components/nodes/VideoNode.tsx` 约 141–161 行，`components/nodes/ImageNode.tsx` 约 156–174 行。
- **依赖**：`NodeToolbar`、`Position` 来自 `@xyflow/react`；节点需能拿到 `selected`（React Flow 在点击时传入）。

---

## 给 AI 的简短说明（可复制到 prompt）

「请根据 node-toolbar-above-REFERENCE 实现：点击素材后在素材**正上方**出现横向工具栏（Upscale、Remove bg 等），白底圆角阴影；取消选中时隐藏。若项目用 React Flow，用 NodeToolbar + isVisible={selected} + position={Position.Top} + offset={16}；若不用 React Flow，用绝对定位的 div，selected 时显示，样式见参考里的 className。具体代码和样式见 node-toolbar-above-REFERENCE.tsx。」
