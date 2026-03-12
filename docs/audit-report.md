# Interface Quality Audit Report

**Scope**: Widget UI (packages/widget) — canvas, nodes, panels, toolbars, modals.  
**Reference**: AGENTS.md design context, frontend-design skill (anti-patterns), WCAG 2.1.  
**Date**: 2025-03-12.

---

## Anti-Patterns Verdict

**Verdict: Partial pass with notable tells.**

The UI is **minimal and tool-oriented** (aligned with AGENTS.md: 极简、偏向工具感) and avoids many AI slop patterns (no hero metrics, no card grids, no glassmorphism). Some specific tells remain:

| Tell | Location | Notes |
|------|----------|--------|
| **Gradient accents on UI** | `CollaborativeCanvas.tsx` ~2714, ~3722 | Teal/cyan gradient on "Re-enter Session" button; purple/blue/pink/amber gradient on AI placeholder prompt area. AGENTS.md says "avoid bright gradients, neon accents"; these are decorative. |
| **Gradient text / colored backgrounds** | Same | Placeholder prompt box uses `linear-gradient(135deg, #5857FD, #8b5cf6)` etc. by type — reads as "gradient for impact" (frontend-design DON'T). |
| **Overused font** | Multiple | **Inter** used in toolbars, panels, modals. Frontend-design: "DON'T use Inter, Roboto, Arial." Outfit used once (ImmersiveModal title); rest is Inter. |
| **Pure black/white** | Various | `#000000`, `#ffffff` in backgrounds and text. Frontend-design: "always tint; pure black/white never appears in nature." |
| **Gray on colored background** | CollaborativeCanvas Re-enter button | `color: '#e2e8f0'` on gradient — can read as washed-out; skill suggests shade of background instead. |

**Positive**: No bounce/elastic easing, no nested cards, no sparklines, modals used sparingly (Product Photography, Immersive). Canvas-first layout and dark-only theme are consistent.

---

## Executive Summary

| Metric | Count |
|--------|--------|
| **Critical** | 0 |
| **High** | 4 |
| **Medium** | 8 |
| **Low** | 6 |

**Top issues**: (1) Touch targets below 44px in toolbars, (2) Hard-coded colors instead of design tokens across 20+ files, (3) Gradient accents conflicting with brand "avoid AI slop", (4) Form inputs without accessible labels.

**Overall**: Usable and coherent for a creation tool; accessibility and theming need systematic passes. No WCAG A blockers found; several AA/AAA and best-practice gaps.

**Recommended next steps**: Run `/normalize` for tokens and consistency; run `/harden` for labels and edge cases; then address touch targets and gradients in high-traffic components.

---

## Detailed Findings by Severity

### Critical Issues

*None.* No issues that block core functionality or violate WCAG A.

---

### High-Severity Issues

#### H1. Touch targets below 44px (Accessibility / Responsive)

- **Location**: `BottomToolbar.tsx` (ToolbarButton 28×28); `CanvasPanel.tsx` tab buttons (height 24); `QuickActionToolbar` / `styles.css` (min-width 30px, height 30px); various 32×32 icon buttons in CollaborativeCanvas.
- **Description**: Interactive controls are 28–32px; AGENTS.md and WCAG 2.5.5 (Level AAA) recommend ≥44×44px for touch.
- **Impact**: Touch and motor users may mis-tap or need multiple attempts; worse on mobile.
- **Recommendation**: Increase toolbar/icon button size to at least 44px, or add transparent hit area (e.g. min-width/min-height 44px with visual icon centered).
- **Suggested command**: `/adapt` or manual pass on BottomToolbar, CanvasPanel, QuickActionToolbar, CanvasControls.

#### H2. Widespread hard-coded colors (Theming)

- **Location**: 20+ files using `#hex`, `rgb()`, `rgba()` in inline styles (e.g. `CollaborativeCanvas.tsx`, `ProductPhotographyModal.tsx`, `CanvasPanel.tsx`, `ImmersiveModal.tsx`, `BottomToolbar.tsx`, node components).
- **Description**: AGENTS.md requires "design tokens (OKLCH/CSS vars) … no hard-coded hex in new UI." Token set exists in `styles.css` (e.g. `--tc-node-toolbar-*`) but most components use raw hex/rgba.
- **Impact**: Theming and future light/dark or brand changes require large, error-prone edits; inconsistency risk.
- **Recommendation**: Introduce CSS custom properties for background, surface, border, text, accent and replace inline colors with `var(--token)`.
- **Suggested command**: `/normalize` to align with design system.

#### H3. Decorative gradient accents (Anti-pattern / Theming)

- **Location**: `CollaborativeCanvas.tsx` — "Re-enter Session" button (~2714): `linear-gradient(135deg, rgba(94,234,212,0.2), rgba(56,189,248,0.25))`; AI placeholder prompt area (~3722): type-based gradients (purple, teal, amber, pink).
- **Description**: AGENTS.md: "Avoid bright gradients, neon accents, 'AI slop' palettes." Frontend-design: "DON'T use gradient text for impact."
- **Impact**: Undermines "沉稳、专业、暗色"; reads as generic AI aesthetic.
- **Recommendation**: Replace with solid surfaces and single accent color from tokens; reserve gradient only if explicitly part of brand.
- **Suggested command**: `/normalize` or `/quieter` to tone down.

#### H4. Form inputs without accessible labels (Accessibility)

- **Location**: Inpaint brush size `input type="range"` in CollaborativeCanvas (~3459) — no `aria-label` or visible label; multiple `textarea`s (TextToImagePanel, ProductPhotographyModal, CollaborativeCanvas AI/inpaint) have only `placeholder`, no `<label>` or `aria-label`.
- **Description**: WCAG 3.3.2 (Labels or Instructions): inputs need programmatic or visible labels. Placeholder is not a substitute.
- **Impact**: Screen reader users may not know purpose of control; errors and required state unclear.
- **Recommendation**: Add `aria-label` or associate with a visible `<label>` (including for brush size); ensure required/error states are announced.
- **Suggested command**: `/harden` for form resilience and a11y.

---

### Medium-Severity Issues

#### M1. Empty `alt` on meaningful image (Accessibility)

- **Location**: `CollaborativeCanvas.tsx` ~4300: `<img ... alt="">` for layer/list thumbnail.
- **Description**: Empty alt is correct only for purely decorative images. If the image conveys content (e.g. node preview), it needs a short description.
- **Impact**: Screen reader users get no information about the thumbnail content.
- **Recommendation**: Use `alt=""` only if image is decorative; otherwise e.g. `alt="Node thumbnail"` or node-type-specific description.
- **Suggested command**: `/harden` or manual fix.

#### M2. Animating `width` (Performance)

- **Location**: `VideoNode.tsx` ~534: progress bar uses `transition: 'width 0.2s ease-out'`.
- **Description**: Frontend-design skill: "DON'T animate layout properties (width, height) — use transform and opacity only." Animating width triggers layout.
- **Impact**: Can cause jank on low-end devices or when many nodes visible.
- **Recommendation**: Implement progress with `transform: scaleX(progress)` on a fixed-width element (or clip-path) so only transform is animated.
- **Suggested command**: `/optimize`.

#### M3. `role="button"` without keyboard activation (Accessibility)

- **Location**: `CanvasControls.tsx` ~163, `BottomToolbar.tsx` ~257: `role="button"` and `tabIndex={0}` with `onKeyDown` for Enter only.
- **Description**: Space should also activate for consistency with native buttons; some specs expect Space for button role.
- **Impact**: Keyboard users who use Space may find behavior inconsistent.
- **Recommendation**: Add `onKeyDown` handler for Space (preventDefault + invoke action), or use `<button>` and style as needed.
- **Suggested command**: `/harden`.

#### M4. Inter used as primary UI font (Anti-pattern)

- **Location**: BottomToolbar, CanvasPanel, ImmersiveModal, KeyboardShortcutsModal, CollaborativeCanvas, AdvancedModal — `fontFamily: 'Inter, -apple-system, sans-serif'`.
- **Description**: Frontend-design: "DON'T use overused fonts — Inter, Roboto, Arial."
- **Impact**: Visual genericness; AGENTS.md references Lovart, Tabnow, Jimeng, Kittl — opportunity for more distinctive type.
- **Recommendation**: Consider a second font (e.g. Outfit or a neutral grotesque) for UI; keep system fallback.
- **Suggested command**: Design decision; optional `/normalize` if design system defines fonts.

#### M5. No explicit focus order / landmarks in large canvas (Accessibility)

- **Location**: CollaborativeCanvas — sidebar, canvas, toolbars, modals; no `main`, `nav`, or `aria-label` on regions.
- **Description**: Landmarks and region labels improve navigation for assistive tech.
- **Impact**: Screen reader users may have to tab through many elements to understand structure.
- **Recommendation**: Add `role="main"` and `aria-label` for canvas; `role="navigation"` and labels for toolbar/sidebar where appropriate.
- **Suggested command**: `/harden` or accessibility pass.

#### M6. Inpaint toolbar contrast (Accessibility)

- **Location**: CollaborativeCanvas inpaint mask toolbar — button and divider colors.
- **Description**: Verify foreground/background contrast ≥4.5:1 for text and ≥3:1 for UI components (WCAG AA).
- **Impact**: Low contrast can affect readability and usability.
- **Recommendation**: Measure with dev tools; if below thresholds, switch to token-based colors that meet contrast.
- **Suggested command**: `/audit` (contrast) then `/normalize` or `/colorize` if needed.

#### M7. Easing and motion (Motion)

- **Location**: `MediaSkeleton.tsx`: `ease-in-out`; `AudioNode.tsx`: `ease-in-out`; `VideoNode.tsx`: `ease-out`. Most transitions use `ease`.
- **Description**: Frontend-design prefers "exponential easing (ease-out-quart/quint/expo) for natural deceleration"; "DON'T use bounce or elastic."
- **Impact**: Minor; motion is acceptable but could feel more intentional with consistent easing.
- **Recommendation**: Standardize on ease-out for entrances/exits; avoid bounce/elastic.
- **Suggested command**: Optional `/animate` pass.

#### M8. Fixed/min widths that may not adapt (Responsive)

- **Location**: CanvasPanel DEFAULT_PANEL_WIDTH 520; ProductPhotographyModal maxWidth 1400; TextToImagePanel width 480; various `minWidth: 220`, `180`, etc. in context menus.
- **Description**: AGENTS.md doesn’t require mobile-first widget; embedding context may have narrow viewports.
- **Impact**: Panels or menus could overflow or feel cramped on small viewports.
- **Recommendation**: Use `min()`/`max()` or container queries where panels are used in narrow layouts; ensure critical actions remain reachable.
- **Suggested command**: `/adapt`.

---

### Low-Severity Issues

#### L1. Duplicate token definitions (Theming)

- **Location**: `styles.css` and `QuickActionToolbar.module.css` both define `--tc-node-toolbar-*` with slightly different values (e.g. border, shadow).
- **Description**: Risk of drift and inconsistency between toolbars.
- **Recommendation**: Single source of truth (e.g. styles.css or shared tokens file); modules import or extend.
- **Suggested command**: `/normalize` or `/extract`.

#### L2. Inline styles for complex panels (Maintainability)

- **Location**: ProductPhotographyModal, ImmersiveModal, CanvasPanel — large blocks of inline style objects.
- **Description**: Harder to theme and scan; tokens and classes improve maintainability.
- **Recommendation**: Move to CSS modules or styled tokens; keep inline only for dynamic values.
- **Suggested command**: Optional refactor; `/extract` for patterns.

#### L3. `fontFamily: 'inherit'` in places (Theming)

- **Location**: TextToImagePanel, CollaborativeCanvas textareas, AdvancedModal.
- **Description**: Inherit is fine but combined with Inter elsewhere can be inconsistent if parent changes.
- **Recommendation**: Document when inherit is intentional; otherwise use token or design system font.
- **Suggested command**: Optional `/normalize`.

#### L4. Video progress bar glow (Anti-pattern)

- **Location**: VideoNode progress bar: `boxShadow: '0 0 6px rgba(0, 255, 200, 0.6)'`, bright teal.
- **Description**: Slight "glow on dark" tell; AGENTS.md cautions neon accents.
- **Recommendation**: Softer highlight or token-based accent.
- **Suggested command**: `/quieter` or `/normalize`.

#### L5. Skeleton animation (Performance)

- **Location**: MediaSkeleton gradient shift and shimmer — multiple animations.
- **Description**: Generally acceptable; ensure `prefers-reduced-motion` is respected (already in styles.css).
- **Recommendation**: No change required; keep reduced-motion override.
- **Suggested command**: None.

#### L6. Context menu items without aria-labels (Accessibility)

- **Location**: CollaborativeCanvas context menu (e.g. clone, layer order, delete) — buttons with text content but no `aria-label` for icon-only or redundant cases.
- **Description**: When icon + text, often not critical; if any icon-only, need labels.
- **Impact**: Minor for current implementation; important if menus add icon-only actions.
- **Recommendation**: Audit context menu items; add `aria-label` where needed for icon-only.
- **Suggested command**: `/harden`.

---

## Patterns & Systemic Issues

1. **Hard-coded colors** — 20+ components use hex/rgba instead of design tokens; token system exists but is underused. Recommend project-wide token adoption.
2. **Touch targets** — Recurrent 28–32px controls; 44px minimum should be applied to all primary toolbar and panel actions.
3. **Focus visibility** — Good: `.tc-node-toolbar-button:focus-visible`, `.tc-canvas-control-button:focus-visible`, `.tc-textarea-input:focus-visible` in styles.css. Gaps: some inline-styled buttons in CollaborativeCanvas/panels may not get focus ring; ensure no `outline: none` without :focus-visible replacement.
4. **Inter everywhere** — Single font family for almost all UI; opportunity to align with design direction (e.g. one display, one body) per AGENTS.md.
5. **Gradient usage** — Concentrated in CollaborativeCanvas (Re-enter button, AI placeholder); rest of app is more restrained. Fixing these two areas would align with "avoid AI slop."

---

## Positive Findings

- **Reduced motion**: `@media (prefers-reduced-motion: reduce)` in styles.css short-circuits animations and transitions; good practice.
- **Semantic buttons**: Most actions use `<button type="button">`; ToolbarButton and CanvasControls use `aria-label`.
- **Focus-visible**: Global focus styles use `:focus-visible` and outline; avoids focus-on-click only.
- **Canvas-first layout**: Full-viewport canvas with minimal chrome matches AGENTS.md; no hero metrics or card clutter.
- **Dark theme consistency**: Single dark theme applied; no mixed light/dark that would need token switching.
- **Escape and outside-click**: Modals (ImmersiveModal, CanvasPanel) close on Escape and outside click; ProductPhotography flow is clear.
- **No layout thrashing**: No obvious read/write layout loops; animations mostly transform/opacity except VideoNode progress (noted in M2).

---

## Recommendations by Priority

1. **Immediate**  
   - None (no critical blockers).

2. **Short-term**  
   - H2: Introduce and use design tokens; replace hard-coded colors in high-visibility components (toolbars, panels, modals).  
   - H4: Add labels/aria-labels to range input and key textareas.  
   - H3: Replace gradient accents in CollaborativeCanvas with solid token-based colors.

3. **Medium-term**  
   - H1: Increase touch targets to ≥44px (or equivalent hit area) in BottomToolbar, CanvasPanel, QuickActionToolbar, CanvasControls.  
   - M2: Rework VideoNode progress bar to animate transform instead of width.  
   - M1, M3, M5: Empty alt fix, button keyboard behavior, landmarks/region labels.

4. **Long-term**  
   - M4: Consider non-Inter font for UI to match references.  
   - M6–M8, L1–L6: Contrast check, responsive panel widths, token consolidation, optional motion and extraction passes.

---

## Suggested Commands for Fixes

| Command | Use for |
|--------|---------|
| **/normalize** | Theming: tokens (H2), gradient reduction (H3), font/token consistency (M4, L1–L3). |
| **/harden** | A11y: form labels (H4), empty alt (M1), role=button keyboard (M3), landmarks (M5), context menu labels (L6). |
| **/adapt** | Touch targets (H1), responsive widths (M8). |
| **/optimize** | VideoNode width animation (M2). |
| **/quieter** | Tone down gradients/glow (H3, L4) if not using normalize. |
| **/extract** | Token/pattern consolidation (L1, L2). |
| **/animate** | Optional: consistent easing (M7). |

---

*Audit performed per `.agents/skills/audit` and frontend-design skill. Do not fix in audit; use the suggested commands or manual changes to address findings.*
