'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Image,
  Video,
  AudioLines,
  ScanFace,
  Frame,
  ChevronRight,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SubItem {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  subItems?: SubItem[];
}

interface AppSidebarProps {
  activeItem?: string;
  onItemClick?: (id: string) => void;
  logoUrl?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const NAV_ITEMS: NavItem[] = [
  {
    id: 'board',
    label: 'Board',
    icon: <Frame className="h-[18px] w-[18px]" />,
  },
  {
    id: 'image',
    label: 'Image',
    icon: <Image className="h-[18px] w-[18px]" />,
    subItems: [
      { id: 'text-to-image', label: 'Text to Image', icon: <Image className="h-[18px] w-[18px]" /> },
      { id: 'image-edit', label: 'Image Edit', icon: <Image className="h-[18px] w-[18px]" /> },
      { id: 'product-photo', label: 'Product Photo', icon: <Image className="h-[18px] w-[18px]" /> },
    ],
  },
  {
    id: 'video',
    label: 'Video',
    icon: <Video className="h-[18px] w-[18px]" />,
    subItems: [
      { id: 'text-to-video', label: 'Text to Video', icon: <Video className="h-[18px] w-[18px]" /> },
      { id: 'image-to-video', label: 'Image to Video', icon: <Video className="h-[18px] w-[18px]" /> },
      { id: 'video-edit', label: 'Video Edit', icon: <Video className="h-[18px] w-[18px]" /> },
    ],
  },
  {
    id: 'avatar',
    label: 'Avatar',
    icon: <ScanFace className="h-[18px] w-[18px]" />,
    subItems: [
      { id: 'avatar-create', label: 'Create Avatar', icon: <ScanFace className="h-[18px] w-[18px]" /> },
      { id: 'avatar-video', label: 'Avatar Video', icon: <ScanFace className="h-[18px] w-[18px]" /> },
    ],
  },
  {
    id: 'audio',
    label: 'Audio',
    icon: <AudioLines className="h-[18px] w-[18px]" />,
    subItems: [
      { id: 'text-to-speech', label: 'Text to Speech', icon: <AudioLines className="h-[18px] w-[18px]" /> },
      { id: 'voice-clone', label: 'Voice Clone', icon: <AudioLines className="h-[18px] w-[18px]" /> },
    ],
  },
];

// ─── Separator ────────────────────────────────────────────────────────────────

const Separator = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="40"
    height="1"
    viewBox="0 0 40 1"
    fill="none"
    className="mx-auto"
  >
    <path d="M0 0.25H40" stroke="url(#sidebar-sep)" strokeWidth="0.5" />
    <defs>
      <linearGradient id="sidebar-sep" x1="0" y1="0.75" x2="40" y2="0.75" gradientUnits="userSpaceOnUse">
        <stop stopColor="white" stopOpacity="0" />
        <stop offset="0.5" stopColor="white" stopOpacity="0.15" />
        <stop offset="1" stopColor="white" stopOpacity="0" />
      </linearGradient>
    </defs>
  </svg>
);

// ─── Logo ─────────────────────────────────────────────────────────────────────

const DefaultLogo = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 210 210" fill="none">
    <path
      d="M162 0C188.51 0 210 21.4905 210 48V162C210 188.51 188.51 210 162 210H48C21.4903 210 0 188.51 0 162V48C0.000166991 21.4905 21.4904 0 48 0H162ZM161.586 69.124C161.556 69.1758 134.717 116.108 128.961 116.008C123.202 115.907 110.372 90.457 110.372 90.457C110.28 90.6044 84.343 131.966 79.5771 132.879C74.8031 133.799 74.6333 114.812 66.125 114.416C57.6174 114.013 36.9155 152.357 36.9111 152.365L46.6514 168.272L70.5635 132.722C70.5732 132.751 76.9933 152.315 89.2393 153.278C101.495 154.242 119.117 120.336 119.117 120.336C119.117 120.336 130.48 143.758 138.443 146.644C146.396 149.531 176.822 95.2796 176.911 95.1211L161.586 69.124ZM77.7305 36.3477C77.7303 52.0516 65.3453 64.9004 50.209 64.9004C65.3454 64.9004 77.7305 77.7491 77.7305 93.4531C77.7305 77.7491 90.1145 64.9004 105.251 64.9004C90.1146 64.9004 77.7306 52.0516 77.7305 36.3477Z"
      fill="white"
    />
  </svg>
);

// ─── AppSidebar ───────────────────────────────────────────────────────────────

export function AppSidebar({ activeItem, onItemClick, logoUrl }: AppSidebarProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [subMenuPos, setSubMenuPos] = useState<{ top: number; left: number } | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const subMenuRef = useRef<HTMLDivElement | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  const cancelClose = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimerRef.current = setTimeout(() => {
      setExpandedId(null);
      closeTimerRef.current = null;
    }, 120);
  }, [cancelClose]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (!navRef.current?.contains(target) && !subMenuRef.current?.contains(target)) {
        setTimeout(() => setExpandedId(null), 0);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => () => { if (closeTimerRef.current) clearTimeout(closeTimerRef.current); }, []);

  const handleNavItemEnter = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>, item: NavItem) => {
      cancelClose();
      if (!item.subItems?.length) {
        setExpandedId(null);
        return;
      }
      const rect = e.currentTarget.getBoundingClientRect();
      const sidebar = e.currentTarget.closest('aside');
      const left = sidebar ? sidebar.getBoundingClientRect().right + 4 : rect.right + 4;
      setSubMenuPos({ top: rect.top, left });
      setExpandedId(item.id);
    },
    [cancelClose]
  );

  return (
    <aside
      style={{ width: 64, minWidth: 64 }}
      className="flex h-full flex-col border-r border-white/5 bg-[#232326] flex-shrink-0"
    >
      {/* Logo */}
      <div className="flex h-14 flex-shrink-0 items-center justify-center">
        {logoUrl ? (
          <img src={logoUrl} alt="Logo" className="h-7 w-7 object-contain" />
        ) : (
          <DefaultLogo />
        )}
      </div>

      {/* Separator below logo */}
      <div className="mb-1 flex justify-center">
        <Separator />
      </div>

      {/* Nav */}
      <nav ref={navRef} className="flex flex-1 flex-col gap-0.5 overflow-y-auto overflow-x-hidden px-2 py-1">
        {NAV_ITEMS.map((item) => {
          const isActive = activeItem === item.id;
          const isExpanded = expandedId === item.id;
          const hasSubItems = !!item.subItems?.length;

          return (
            <div key={item.id} className="relative">
              <button
                onMouseEnter={(e) => handleNavItemEnter(e, item)}
                onMouseLeave={hasSubItems ? scheduleClose : undefined}
                onClick={() => {
                  if (!hasSubItems) onItemClick?.(item.id);
                }}
                aria-label={item.label}
                aria-expanded={isExpanded}
                className={[
                  'group relative flex w-full flex-col items-center gap-1 rounded-lg px-1 py-2 transition-colors duration-150',
                  isActive
                    ? 'bg-[#3E3E47] text-white'
                    : 'text-[#A3A3A3] hover:bg-white/5 hover:text-white',
                ].join(' ')}
              >
                <span className={isActive ? 'text-white' : 'text-[#A3A3A3] group-hover:text-white'}>
                  {item.icon}
                </span>
                <span className="text-[11px] leading-[14px] tracking-normal text-[#D4D4D4]">
                  {item.label}
                </span>
                {hasSubItems && (
                  <ChevronRight
                    className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-40 transition-opacity"
                    size={10}
                  />
                )}
              </button>

              {/* Submenu via Portal */}
              {isExpanded && subMenuPos && hasSubItems &&
                createPortal(
                  <div
                    ref={(node) => { subMenuRef.current = node; }}
                    style={{
                      position: 'fixed',
                      top: subMenuPos.top,
                      left: subMenuPos.left,
                      zIndex: 1050,
                      minWidth: 192,
                      backgroundColor: '#252525',
                    }}
                    className="rounded-lg border border-white/10 px-2 py-2 shadow-xl"
                    onMouseEnter={cancelClose}
                    onMouseLeave={scheduleClose}
                  >
                    {item.subItems!.map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => {
                          onItemClick?.(sub.id);
                          setExpandedId(null);
                        }}
                        className={[
                          'flex w-full items-center gap-2 whitespace-nowrap rounded-lg px-2 h-10',
                          'text-[14px] font-normal leading-[20px] transition-colors duration-100',
                          activeItem === sub.id
                            ? 'bg-[#3E3E47] text-white'
                            : 'text-[#D4D4D4] hover:bg-white/5 hover:text-white',
                        ].join(' ')}
                      >
                        <span className="text-[#A3A3A3]">{sub.icon}</span>
                        <span>{sub.label}</span>
                      </button>
                    ))}
                  </div>,
                  document.body
                )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
