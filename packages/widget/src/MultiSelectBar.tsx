import React, { useState, useRef, useEffect } from 'react';
import {
  Download,
  Copy,
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
  ChevronUp,
  LayoutGrid,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { MultiSelectInfo } from './hooks/useMultiSelectActions';

import { ShortcutBadge } from './components/ShortcutBadge';

interface MultiSelectBarProps {
  info: MultiSelectInfo;
  onBatchGroup: () => void;
  onBatchCopy: () => void;
  onBatchDownload: () => void;
  onBatchLock: () => void;
  onBatchUnlock: () => void;
  onBatchHide: () => void;
  onBatchShow: () => void;
  onBatchBringToFront: () => void;
  onBatchSendToBack: () => void;
  onBatchExport: (format: 'png' | 'jpg' | 'svg') => void;
  onAlign: (direction: AlignDirection) => void;
  onDistribute: (axis: 'horizontal' | 'vertical') => void;
  onAutoArrange: () => void;
}

export type AlignDirection = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom';

/* 统一为实色背景（与 ToolbarItemWithMenu 一致），不再使用背景透明和模糊 */
const S = {
  bar: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    height: 40,
    padding: '0 8px',
    boxSizing: 'border-box' as const,
    borderRadius: 8,
    background: '#252525',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
    pointerEvents: 'auto' as const,
    userSelect: 'none' as const,
    whiteSpace: 'nowrap' as const,
  },
  divider: {
    width: 1,
    height: 24,
    background: 'rgba(255, 255, 255, 0.1)',
    margin: '0 2px',
    flexShrink: 0,
  },
  action: {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
  },
  btn: (hovered: boolean, iconOnly?: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    minWidth: 30,
    height: 30,
    padding: iconOnly ? '8px' : '8px 10px',
    border: 'none',
    borderRadius: 6,
    background: hovered ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
    color: hovered ? '#fff' : 'rgba(255, 255, 255, 0.95)',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    transition: 'background-color 0.12s ease, color 0.12s ease',
  }),
  btnDanger: (hovered: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    minWidth: 30,
    height: 30,
    padding: '8px',
    border: 'none',
    borderRadius: 6,
    background: hovered ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
    color: hovered ? '#f87171' : 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
    transition: 'background 100ms ease, color 100ms ease',
  }),
  icon: { width: 16, height: 16, flexShrink: 0 } as React.CSSProperties,
  chevron: { width: 12, height: 12, flexShrink: 0, opacity: 0.5 } as React.CSSProperties,
  popover: {
    position: 'absolute' as const,
    bottom: 'calc(100% + 8px)',
    left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: 4,
    background: '#252525',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
    zIndex: 60,
    whiteSpace: 'nowrap' as const,
  },
  popoverBtn: (hovered: boolean, active?: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    border: 'none',
    borderRadius: 4,
    background: hovered || active ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
    color: 'rgba(255, 255, 255, 0.95)',
    cursor: 'pointer',
    transition: 'background-color 0.12s ease, color 0.12s ease',
    flexShrink: 0,
    position: 'relative' as const,
  }),
  popoverDivider: {
    width: 1,
    height: 24,
    background: 'rgba(255,255,255,0.08)',
    margin: '0 2px',
    flexShrink: 0,
  },
  tooltip: {
    position: 'absolute' as const,
    bottom: 'calc(100% + 8px)',
    left: '50%',
    transform: 'translateX(-50%)',
    pointerEvents: 'none' as const,
    zIndex: 60,
  },
  tooltipLabel: {
    background: '#252525',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 6,
    padding: '5px 8px',
    fontSize: 11,
    fontWeight: 500,
    color: '#fff',
    whiteSpace: 'nowrap' as const,
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    display: 'flex',
    alignItems: 'center',
  },
  tooltipArrow: {
    display: 'none',
  },
  moreMenu: {
    position: 'absolute' as const,
    bottom: 'calc(100% + 8px)',
    right: 0,
    minWidth: 180,
    padding: 4,
    background: '#252525',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
    zIndex: 60,
  },
  moreItem: (hovered: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    height: 34,
    padding: '0 10px',
    border: 'none',
    borderRadius: 6,
    background: hovered ? 'rgba(255,255,255,0.05)' : 'transparent',
    color: hovered ? '#fff' : 'rgba(255,255,255,0.7)',
    fontSize: 12,
    fontWeight: 400,
    textAlign: 'left' as const,
    cursor: 'pointer',
    transition: 'background 80ms ease, color 80ms ease',
    boxSizing: 'border-box' as const,
  }),
  moreShortcut: {
    marginLeft: 'auto',
    fontSize: 10,
    color: 'rgba(255,255,255,0.25)',
    letterSpacing: '0.02em',
  } as React.CSSProperties,
  moreMenuDivider: {
    height: 1,
    background: 'rgba(255,255,255,0.06)',
    margin: '3px 4px',
  },
};

const TOOLBAR_OFFSET = 12;
const SELECTION_RECT_SELECTOR = '.react-flow__nodesselection-rect';

/** Group action icon: dashed square (placeholder/grouping). */
function GroupIcon({ style }: { style?: React.CSSProperties }) {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      style={{ flexShrink: 0, ...style }}
    >
      <rect
        x="1.5"
        y="1.5"
        width="13"
        height="13"
        rx="0.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeDasharray="2 2"
      />
    </svg>
  );
}

const HANDLE_SIZE = 8;
const HANDLE_HALF = HANDLE_SIZE / 2;

/**
 * Renders 4 corner handles around the multi-select bounding box.
 * Uses rAF to track `.react-flow__nodesselection-rect` position in screen space,
 * identical to how MultiSelectToolbar tracks it.
 */
export function MultiSelectCornerHandles({
  visible,
}: {
  visible: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (visible) setMounted(true);
    else setMounted(false);
  }, [visible]);

  useEffect(() => {
    if (!visible || !mounted || !containerRef.current) return;
    let rafId: number;
    const update = () => {
      const sel = document.querySelector(SELECTION_RECT_SELECTOR) as HTMLElement | null;
      const container = containerRef.current;
      const parent = container?.offsetParent as HTMLElement | null;
      if (sel && container && parent) {
        const parentRect = parent.getBoundingClientRect();
        const rect = sel.getBoundingClientRect();
        container.style.left = `${rect.left - parentRect.left}px`;
        container.style.top = `${rect.top - parentRect.top}px`;
        container.style.width = `${rect.width}px`;
        container.style.height = `${rect.height}px`;
      }
      rafId = requestAnimationFrame(update);
    };
    rafId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafId);
  }, [visible, mounted]);

  if (!mounted) return null;

  return (
    <div
      ref={containerRef}
      className="tc-multiselect-handles"
      style={{ position: 'absolute', pointerEvents: 'none', zIndex: 5 }}
    >
      {(['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const).map((corner) => {
        const cursorStyle = (corner === 'top-left' || corner === 'bottom-right') ? 'nwse-resize' : 'nesw-resize';
        return (
          <div
            key={corner}
            style={{
              position: 'absolute',
              left: corner.includes('left') ? -HANDLE_HALF : 'auto',
              right: corner.includes('right') ? -HANDLE_HALF : 'auto',
              top: corner.includes('top') ? -HANDLE_HALF : 'auto',
              bottom: corner.includes('bottom') ? -HANDLE_HALF : 'auto',
              width: HANDLE_SIZE,
              height: HANDLE_SIZE,
              background: '#fff',
              border: '1px solid #7781FF',
              boxSizing: 'border-box',
              cursor: cursorStyle,
              pointerEvents: 'none',
            }}
          />
        );
      })}
    </div>
  );
}

export function MultiSelectToolbar(
  props: Omit<MultiSelectBarProps, 'info'> & {
    info: MultiSelectBarProps['info'] | null;
    viewport: { x: number; y: number; zoom: number };
  }
) {
  const { info, viewport, ...handlers } = props;
  const visible = info !== null;
  const [mounted, setMounted] = useState(false);
  const [exiting, setExiting] = useState(false);
  const lastInfoRef = useRef<MultiSelectBarProps['info'] | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const wrapperRef = useRef<HTMLDivElement>(null);

  if (info) lastInfoRef.current = info;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      setExiting(false);
      if (timerRef.current) clearTimeout(timerRef.current);
    } else if (mounted) {
      setExiting(true);
      timerRef.current = setTimeout(() => {
        setMounted(false);
        setExiting(false);
      }, 120);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [visible, mounted]);

  // Smooth follow: position toolbar from selection rect in DOM so it tracks during drag/pan/zoom
  useEffect(() => {
    if (!visible || !mounted || !wrapperRef.current) return;
    let rafId: number;
    const update = () => {
      const sel = document.querySelector(SELECTION_RECT_SELECTOR) as HTMLElement | null;
      const wrapper = wrapperRef.current;
      const parent = wrapper?.offsetParent as HTMLElement | null;
      if (sel && wrapper && parent) {
        const parentRect = parent.getBoundingClientRect();
        const rect = sel.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2 - parentRect.left;
        const showBelow = rect.top < 120;
        const anchorY = showBelow
          ? rect.bottom + TOOLBAR_OFFSET - parentRect.top
          : rect.top - TOOLBAR_OFFSET - parentRect.top;
        wrapper.style.left = `${centerX}px`;
        wrapper.style.top = `${anchorY}px`;
        wrapper.style.transform = showBelow ? 'translateX(-50%)' : 'translateX(-50%) translateY(-100%)';
      }
      rafId = requestAnimationFrame(update);
    };
    rafId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(rafId);
  }, [visible, mounted]);

  const currentInfo = visible ? info : lastInfoRef.current;
  if (!mounted || !currentInfo) return null;

  const { nodes } = currentInfo;
  if (nodes.length < 2) return null;

  // Fallback position from viewport + nodes (used before first rAF and for initial layout)
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const n of nodes) {
    const nx = n.position.x;
    const ny = n.position.y;
    if (nx < minX) minX = nx;
    if (ny < minY) minY = ny;
    if (nx + n.size.width > maxX) maxX = nx + n.size.width;
    if (ny + n.size.height > maxY) maxY = ny + n.size.height;
  }
  const { x: vx, y: vy, zoom } = viewport;
  const screenTop = minY * zoom + vy;
  const screenLeft = minX * zoom + vx;
  const screenRight = maxX * zoom + vx;
  const screenCenterX = (screenLeft + screenRight) / 2;
  const showBelow = screenTop < 120;
  const screenBottom = maxY * zoom + vy;
  const anchorY = showBelow ? screenBottom + TOOLBAR_OFFSET : screenTop - TOOLBAR_OFFSET;

  return (
    <div
      ref={wrapperRef}
      style={{
        position: 'absolute',
        left: screenCenterX,
        top: anchorY,
        transform: showBelow ? 'translateX(-50%)' : 'translateX(-50%) translateY(-100%)',
        zIndex: 50,
        pointerEvents: 'none',
        opacity: exiting ? 0 : 1,
        transition: 'opacity 120ms ease',
      }}
    >
      <div
        style={S.bar}
        onPointerDownCapture={(e) => e.stopPropagation()}
        onMouseDownCapture={(e) => e.stopPropagation()}
      >
        <BarContent info={currentInfo} {...handlers} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bar content: Download | Copy | Group | Align (icon) | Distribute (icon)
// ---------------------------------------------------------------------------

function BarContent({
  info,
  onBatchGroup, onBatchCopy, onBatchDownload,
  onAlign, onDistribute, onAutoArrange,
}: MultiSelectBarProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [openPopover, setOpenPopover] = useState<'align' | 'distribute' | null>(null);
  const [activeAlign, setActiveAlign] = useState<AlignDirection | null>(null);
  const [activeDistribute, setActiveDistribute] = useState<'horizontal' | 'vertical' | 'auto' | null>(null);
  const alignRef = useRef<HTMLDivElement>(null);
  const distributeRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setOpenPopover(null); }, [info?.count]);

  useEffect(() => {
    if (!openPopover) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (openPopover === 'align' && alignRef.current && !alignRef.current.contains(target)) setOpenPopover(null);
      if (openPopover === 'distribute' && distributeRef.current && !distributeRef.current.contains(target)) setOpenPopover(null);
    };
    document.addEventListener('pointerdown', handleClick);
    return () => document.removeEventListener('pointerdown', handleClick);
  }, [openPopover]);

  return (
    <>
      <ActionBtn id="group" label="Group" shortcutKeys={['⌘', 'G']} iconNode={<GroupIcon style={S.icon} />} onClick={onBatchGroup} hoveredId={hoveredId} setHoveredId={setHoveredId} />
      <ActionBtn id="download" label="Download" Icon={Download} onClick={onBatchDownload} hoveredId={hoveredId} setHoveredId={setHoveredId} />
      <ActionBtn id="copy" label="Copy" shortcutKeys={['⌘', 'C']} Icon={Copy} onClick={onBatchCopy} hoveredId={hoveredId} setHoveredId={setHoveredId} />

      <div ref={alignRef} style={{ ...S.action, position: 'relative' }}>
        <PopoverTriggerIconOnly
          id="align"
          ariaLabel="Align"
          Icon={AlignCenterVertical}
          isOpen={openPopover === 'align'}
          hoveredId={hoveredId}
          setHoveredId={setHoveredId}
          onToggle={() => setOpenPopover((cur) => (cur === 'align' ? null : 'align'))}
        />
        {openPopover === 'align' && (
          <div style={S.popover}>
            <PopoverBtn title="Align Left" active={activeAlign === 'left' || (!activeAlign)} onClick={() => { onAlign('left'); setActiveAlign('left'); setOpenPopover(null); }}><AlignStartVertical size={15} /></PopoverBtn>
            <PopoverBtn title="Align Center" active={activeAlign === 'center'} onClick={() => { onAlign('center'); setActiveAlign('center'); setOpenPopover(null); }}><AlignCenterVertical size={15} /></PopoverBtn>
            <PopoverBtn title="Align Right" active={activeAlign === 'right'} onClick={() => { onAlign('right'); setActiveAlign('right'); setOpenPopover(null); }}><AlignEndVertical size={15} /></PopoverBtn>
            <div style={S.popoverDivider} />
            <PopoverBtn title="Align Top" active={activeAlign === 'top'} onClick={() => { onAlign('top'); setActiveAlign('top'); setOpenPopover(null); }}><AlignStartHorizontal size={15} /></PopoverBtn>
            <PopoverBtn title="Align Middle" active={activeAlign === 'middle'} onClick={() => { onAlign('middle'); setActiveAlign('middle'); setOpenPopover(null); }}><AlignCenterHorizontal size={15} /></PopoverBtn>
            <PopoverBtn title="Align Bottom" active={activeAlign === 'bottom'} onClick={() => { onAlign('bottom'); setActiveAlign('bottom'); setOpenPopover(null); }}><AlignEndHorizontal size={15} /></PopoverBtn>
          </div>
        )}
      </div>

      {/* ── Arrange group: Horizontal Space | Vertical Space | Auto Arrange ── */}
      <div style={S.divider} />
      <div ref={distributeRef} style={{ ...S.action, position: 'relative' }}>
        <PopoverTriggerIconOnly
          id="distribute"
          ariaLabel="Distribute"
          Icon={HSpaceIcon}
          isOpen={openPopover === 'distribute'}
          hoveredId={hoveredId}
          setHoveredId={setHoveredId}
          onToggle={() => setOpenPopover((cur) => (cur === 'distribute' ? null : 'distribute'))}
        />
        {openPopover === 'distribute' && (
          <div style={S.popover}>
            <PopoverBtn title="Horizontal Space" active={activeDistribute === 'horizontal' || (!activeDistribute)} onClick={() => { onDistribute('horizontal'); setActiveDistribute('horizontal'); setOpenPopover(null); }}><HSpaceIcon /></PopoverBtn>
            <PopoverBtn title="Vertical Space" active={activeDistribute === 'vertical'} onClick={() => { onDistribute('vertical'); setActiveDistribute('vertical'); setOpenPopover(null); }}><VSpaceIcon /></PopoverBtn>
            <PopoverBtn title="Auto Arrange" active={activeDistribute === 'auto'} onClick={() => { onAutoArrange(); setActiveDistribute('auto'); setOpenPopover(null); }}><LayoutGrid size={15} /></PopoverBtn>
          </div>
        )}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Arrange button — icon-only with tooltip (Horizontal Space / Vertical Space / Auto Arrange)
// ---------------------------------------------------------------------------

function ArrangeBtn({
  id, ariaLabel, shortcutKeys, children, onClick, hoveredId, setHoveredId,
}: {
  id: string; ariaLabel: string; shortcutKeys?: string[]; children: React.ReactNode;
  onClick: () => void;
  hoveredId: string | null; setHoveredId: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  const hovered = hoveredId === id;
  return (
    <div
      style={{ ...S.action, position: 'relative' }}
      onMouseEnter={() => setHoveredId(id)}
      onMouseLeave={() => setHoveredId((c) => (c === id ? null : c))}
    >
      <button
        type="button"
        aria-label={ariaLabel}
        onClick={onClick}
        style={{
          ...S.btn(hovered),
          width: 32,
          padding: 0,
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {children}
      </button>
      {hovered && (
        <div style={{ ...S.tooltip, bottom: 'calc(100% + 8px)' }}>
          <div style={S.tooltipLabel}>
            <span>{ariaLabel}</span>
            {shortcutKeys && <ShortcutBadge keys={shortcutKeys} />}
          </div>
        </div>
      )}
    </div>
  );
}

// Horizontal spacing icon (two vertical bars with arrows pointing outward)
function HSpaceIcon({ style }: { style?: React.CSSProperties }) {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ flexShrink: 0, ...style }}>
      <rect x="3.5" y="2.5" width="1" height="10" rx="0.5" fill="currentColor" opacity="0.4" />
      <rect x="10.5" y="2.5" width="1" height="10" rx="0.5" fill="currentColor" opacity="0.4" />
      <rect x="6.5" y="5.5" width="2" height="4" rx="1" fill="currentColor" />
    </svg>
  );
}

// Vertical spacing icon (two horizontal bars with arrows pointing outward)
function VSpaceIcon({ style }: { style?: React.CSSProperties }) {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ flexShrink: 0, ...style }}>
      <rect x="2.5" y="3.5" width="10" height="1" rx="0.5" fill="currentColor" opacity="0.4" />
      <rect x="2.5" y="10.5" width="10" height="1" rx="0.5" fill="currentColor" opacity="0.4" />
      <rect x="5.5" y="6.5" width="4" height="2" rx="1" fill="currentColor" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Popover trigger button (icon only + chevron)
// ---------------------------------------------------------------------------

function PopoverTriggerIconOnly({ id, ariaLabel, Icon, isOpen, hoveredId, setHoveredId, onToggle }: {
  id: string; ariaLabel: string; Icon: LucideIcon | React.ComponentType<{ style?: React.CSSProperties }>; isOpen: boolean;
  hoveredId: string | null; setHoveredId: React.Dispatch<React.SetStateAction<string | null>>;
  onToggle: () => void;
}) {
  const hovered = hoveredId === id;
  return (
    <div style={S.action} onMouseEnter={() => setHoveredId(id)} onMouseLeave={() => setHoveredId((c) => (c === id ? null : c))}>
      <button type="button" style={{ ...S.btn(hovered || isOpen), width: 'fit-content', paddingLeft: 8, paddingRight: 8, paddingTop: 0, paddingBottom: 0, justifyContent: 'center' }} onClick={onToggle} aria-label={ariaLabel}>
        <Icon style={S.icon} />
        <ChevronUp style={{ ...S.chevron, transform: isOpen ? 'none' : 'rotate(180deg)', transition: 'transform 150ms ease' }} />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Popover icon-only button (used inside Align / Distribute popovers)
// ---------------------------------------------------------------------------

function PopoverBtn({
  title,
  onClick,
  active,
  children,
}: {
  title: string;
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div style={{ position: 'relative', flexShrink: 0 }} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <button
        type="button"
        style={S.popoverBtn(hovered, active)}
        onClick={onClick}
      >
        {children}
      </button>
      {hovered && (
        <div style={{ ...S.tooltip, bottom: 'calc(100% + 8px)' }}>
          <div style={S.tooltipLabel}>{title}</div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// More menu item
// ---------------------------------------------------------------------------

function MoreItem({ label, shortcut, Icon, onClick }: { label: string; shortcut?: string; Icon: LucideIcon; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      type="button"
      style={S.moreItem(hovered)}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Icon size={14} style={{ opacity: 0.5 }} />{label}
      {shortcut && <span style={S.moreShortcut}>{shortcut}</span>}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Primary action button (icon + label)
// ---------------------------------------------------------------------------

function ActionBtn({
  id,
  label,
  shortcutKeys,
  Icon,
  iconNode,
  onClick,
  danger = false,
  hoveredId,
  setHoveredId,
  iconOnly = false,
}: {
  id: string;
  label: string;
  shortcutKeys?: string[];
  Icon?: LucideIcon;
  iconNode?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  hoveredId: string | null;
  setHoveredId: React.Dispatch<React.SetStateAction<string | null>>;
  iconOnly?: boolean;
}) {
  const hovered = hoveredId === id;
  const icon = iconNode ?? (Icon != null ? <Icon style={S.icon} /> : null);
  return (
    <div style={S.action} onMouseEnter={() => setHoveredId(id)} onMouseLeave={() => setHoveredId((c) => (c === id ? null : c))}>
      <button type="button" style={danger ? S.btnDanger(hovered) : S.btn(hovered, iconOnly)} onClick={onClick} aria-label={label}>
        {icon}
        {!iconOnly && <span>{label}</span>}
      </button>
      {hovered && iconOnly && (
        <div style={{ ...S.tooltip, bottom: 'calc(100% + 8px)' }}>
          <div style={S.tooltipLabel}>
            <span>{label}</span>
            {shortcutKeys && <ShortcutBadge keys={shortcutKeys} />}
          </div>
        </div>
      )}
    </div>
  );
}
