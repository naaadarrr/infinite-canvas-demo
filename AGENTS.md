# Agent & Design Context

This file provides project context for AI agents and design decisions. The **Design Context** section is maintained by `/teach-impeccable` and guides frontend and UX work.

---

## Design Context

*Persistent design guidelines for @tc/infinite. Updated by /teach-impeccable from user input.*

### Users
- **Primary**: **创作者 (Creators)** — people who use the infinite canvas to create and arrange assets (image, video, audio, text). The product is a **creation tool** for making content on the canvas.
- **Secondary**: Developers embedding the widget; internal operators using **Board Admin** (协作画布管理后台), authenticated via 飞书 (Lark).
- **Context**: Full-viewport canvas, minimal chrome; real-time collaboration and presence; optional admin flows.
- **Job to be done**: Create, arrange, and manage media nodes; pan/zoom; collaborate; feel **efficient, professional, and smooth** (高效、专业、丝滑).

### Brand Personality
- **Three words**: **沉稳、专业、暗色** — calm/steadfast, professional, dark.
- **References** (aim for this feel): Lovart, Tabnow, Jimeng, Kittl — minimal, tool-like, creator-focused UIs.
- **Voice**: Efficient and professional; no playful or decorative clutter. Tool-first, not marketing-first.

### Aesthetic Direction
- **Style**: **极简、偏向工具感** — minimal, tool-oriented. No decorative excess; every element should serve creation or navigation.
- **Theme**: **仅深色 (dark only)**. No light mode requirement; all UI is dark (canvas, panels, controls).
- **Colors**: Dark backgrounds; neutrals and subtle borders; accent only where needed (selection, actions, states). Avoid bright gradients, neon accents, or “AI slop” palettes (e.g. purple-to-blue, cyan-on-dark).
- **Tech**: Tailwind 4, Next.js 15, OKLCH tokens where possible; widget to align with same dark token system over time.

### Design Principles
1. **Canvas-first**: Full viewport for creation; controls (zoom, fit, toolbar) secondary and unobtrusive.
2. **Efficient & smooth**: Interactions feel immediate (optimistic UI, clear feedback); no unnecessary steps or modals.
3. **Professional & minimal**: No decorative cards, hero metrics, or template fluff; tool-like density and clarity.
4. **Dark-only, token-based**: Single dark theme; use design tokens (OKLCH/CSS vars) for background, surface, border, text, accent — no hard-coded hex in new UI.
5. **Collaboration clarity**: Presence, lock states, and selection must be obvious and reliable.
6. **Bilingual**: Support Chinese and English in labels, errors, and admin copy.
7. **Accessibility**: Meet standard expectations — focus visible, sufficient contrast, touch targets ≥44px where possible, respect `prefers-reduced-motion`. No need for extra certification unless required later.

---

*Last updated by /teach-impeccable (user answers: creators, 高效专业丝滑, 沉稳专业暗色, refs Lovart/Tabnow/Jimeng/Kittl, 极简工具感, 仅深色, 正常无障碍).*
