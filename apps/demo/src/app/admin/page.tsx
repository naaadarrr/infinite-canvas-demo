'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from '@/components/ui/resizable';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  RefreshCw,
  Power,
  UserX,
  Eye,
  EyeOff,
  Monitor,
  Activity,
  Lock,
  Clock,
  PanelLeftClose,
  PanelLeft,
  TrendingUp,
  TrendingDown,
  Search,
  Layers,
  Maximize2,
  Minimize2,
  LogOut,
  User,
  Loader2,
} from 'lucide-react';

/* ────────────────────────────────────
   Types
   ──────────────────────────────────── */
interface RoomInfo {
  id: string;
  title: string;
  latest_seq: number;
  updated_at: string;
}

interface RoomStatus {
  roomId: string;
  createdAt: number;
  lastConnectionAt: number;
  activeConnections: number;
  activeUsers: number;
  nodeCount: number;
  seq: number;
  lockedNodesCount: number;
  presenceCount: number;
  lastStateSource: string;
  idleSeconds: number;
  connections: Array<{
    userId: string;
    userName?: string;
    joinedAt: number;
    lastActiveAt: number;
    idleSeconds: number;
  }>;
}

interface EnrichedRoom extends RoomInfo {
  status?: RoomStatus;
  isActive: boolean;
  loading: boolean;
}

interface UserInfo {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  loginAt: number;
}

/* ────────────────────────────────────
   Page Component
   ──────────────────────────────────── */
export default function AdminPage() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [enrichedRooms, setEnrichedRooms] = useState<EnrichedRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedRoomStatus, setSelectedRoomStatus] =
    useState<RoomStatus | null>(null);
  const [refreshInterval, setRefreshInterval] = useState(5000);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [manualRoomId, setManualRoomId] = useState('');
  const [manualRoomIds, setManualRoomIds] = useState<string[]>([]);
  const [showCanvas, setShowCanvas] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [connectionsOpen, setConnectionsOpen] = useState(true);

  const adminUserId = useMemo(
    () => `admin_${Math.random().toString(36).slice(2, 9)}`,
    [],
  );

  const API_BASE =
    process.env.NEXT_PUBLIC_WS_BASE
      ?.replace('wss://', 'https://')
      .replace('ws://', 'http://') ||
    'https://infinite-canvas-collab-worker.topviewai.app';
  const TOKEN = process.env.NEXT_PUBLIC_USER_TOKEN || 'user_admin';

  /* ── 身份验证 ── */
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/admin/auth/me');
        if (!res.ok) {
          router.push('/admin/login');
          return;
        }
        const data = await res.json();
        setUserInfo(data.user);
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/admin/login');
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  /* ── 退出登录 ── */
  const handleLogout = async () => {
    if (!confirm('确定要退出登录吗？')) return;
    try {
      await fetch('/admin/auth/logout', { method: 'POST' });
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  /* ── data fetching (unchanged logic) ── */
  const fetchRooms = useCallback(
    async (silent = false) => {
      try {
        const res = await fetch(`${API_BASE}/admin/rooms`, {
          headers: { Authorization: `Bearer ${TOKEN}` },
        });
        if (!res.ok) throw new Error(`Failed: ${res.statusText}`);
        const data = await res.json();
        const roomList: RoomInfo[] = data.rooms || [];
        const manualIdSet = new Set(manualRoomIds);
        const ids = new Set<string>(roomList.map((r) => r.id));
        manualRoomIds.forEach((id) => ids.add(id));
        const statuses = await Promise.all(
          Array.from(ids).map(async (roomId) => {
            try {
              const r = await fetch(`${API_BASE}/admin/rooms/${roomId}`, {
                headers: { Authorization: `Bearer ${TOKEN}` },
              });
              if (r.ok) {
                const s: RoomStatus = await r.json();
                return { roomId, status: s, isActive: s.activeConnections > 0 };
              }
            } catch {}
            return { roomId, status: undefined, isActive: false };
          }),
        );
        const statusById = new Map(statuses.map((i) => [i.roomId, i.status]));
        setEnrichedRooms((prev) => {
          const prevById = new Map(prev.map((r) => [r.id, r]));
          const next: EnrichedRoom[] = [];
          roomList.forEach((room) => {
            const p = prevById.get(room.id);
            const status = statusById.get(room.id) ?? p?.status;
            const isActive = status
              ? status.activeConnections > 0
              : (p?.isActive ?? false);
            if (isActive || manualIdSet.has(room.id))
              next.push({ ...room, status, isActive, loading: false });
          });
          const included = new Set(next.map((r) => r.id));
          manualIdSet.forEach((roomId) => {
            if (included.has(roomId)) return;
            const p = prevById.get(roomId);
            const status = statusById.get(roomId) ?? p?.status;
            const isActive = status
              ? status.activeConnections > 0
              : (p?.isActive ?? false);
            next.push({
              id: roomId,
              title: p?.title ?? roomId,
              latest_seq: p?.latest_seq ?? status?.seq ?? 0,
              updated_at:
                p?.updated_at ??
                (status
                  ? new Date(status.lastConnectionAt).toISOString()
                  : new Date().toISOString()),
              status,
              isActive,
              loading: false,
            });
          });
          return next;
        });
        setError(null);
      } catch (err) {
        if (!silent)
          setError(err instanceof Error ? err.message : 'Failed to fetch');
      } finally {
        if (initialLoading) setInitialLoading(false);
      }
    },
    [API_BASE, TOKEN, initialLoading, manualRoomIds],
  );

  const fetchRoomStatus = useCallback(
    async (roomId: string, silent = false) => {
      if (!silent) setSelectedRoomStatus(null);
      try {
        const r = await fetch(`${API_BASE}/admin/rooms/${roomId}`, {
          headers: { Authorization: `Bearer ${TOKEN}` },
        });
        if (!r.ok) throw new Error('Failed');
        const data: RoomStatus = await r.json();
        setSelectedRoomStatus(data);
        setEnrichedRooms((prev) =>
          prev.map((room) =>
            room.id === roomId
              ? {
                  ...room,
                  status: data,
                  isActive: data.activeConnections > 0,
                  loading: false,
                }
              : room,
          ),
        );
        setError(null);
      } catch (err) {
        if (!silent)
          setError(err instanceof Error ? err.message : 'Failed');
      }
    },
    [API_BASE, TOKEN],
  );

  const handleShutdownRoom = async (roomId: string) => {
    if (!confirm(`确定要关闭房间 ${roomId} 吗？`)) return;
    try {
      const r = await fetch(`${API_BASE}/admin/rooms/${roomId}/shutdown`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${TOKEN}` },
      });
      if (!r.ok) throw new Error('Failed');
      alert('房间已关闭');
      setSelectedRoomId(null);
      setSelectedRoomStatus(null);
      fetchRooms();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleKickUser = async (roomId: string, userId: string) => {
    if (!confirm(`确定要踢出用户 ${userId} 吗？`)) return;
    try {
      const r = await fetch(`${API_BASE}/admin/rooms/${roomId}/kick`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      if (!r.ok) throw new Error('Failed');
      alert('用户已被踢出');
      fetchRoomStatus(roomId);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  };

  const handleSelectRoom = (roomId: string) => {
    setSelectedRoomId(roomId);
    const room = enrichedRooms.find((r) => r.id === roomId);
    if (room?.status) setSelectedRoomStatus(room.status);
    else fetchRoomStatus(roomId);
  };

  const handleAddRoom = async () => {
    const roomId = manualRoomId.trim();
    if (!roomId) return;
    if (enrichedRooms.some((r) => r.id === roomId)) {
      setManualRoomIds((p) => (p.includes(roomId) ? p : [roomId, ...p]));
      handleSelectRoom(roomId);
      setManualRoomId('');
      return;
    }
    try {
      const r = await fetch(`${API_BASE}/admin/rooms/${roomId}`, {
        headers: { Authorization: `Bearer ${TOKEN}` },
      });
      if (!r.ok) throw new Error('Failed');
      const status: RoomStatus = await r.json();
      setEnrichedRooms((p) => [
        {
          id: roomId,
          title: roomId,
          latest_seq: status.seq,
          updated_at: new Date(status.lastConnectionAt).toISOString(),
          status,
          isActive: status.activeConnections > 0,
          loading: false,
        },
        ...p,
      ]);
      setManualRoomIds((p) => (p.includes(roomId) ? p : [roomId, ...p]));
      setSelectedRoomId(roomId);
      setSelectedRoomStatus(status);
      setManualRoomId('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed');
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  useEffect(() => {
    if (refreshInterval <= 0) return;
    const t = setInterval(() => {
      fetchRooms(true);
      if (selectedRoomId) fetchRoomStatus(selectedRoomId, true);
    }, refreshInterval);
    return () => clearInterval(t);
  }, [refreshInterval, selectedRoomId, fetchRooms, fetchRoomStatus]);

  const fmt = (ts: number | string) =>
    new Date(typeof ts === 'string' ? ts : ts).toLocaleString('zh-CN');
  const fmtDur = (s: number) => {
    if (s < 60) return `${s}秒`;
    if (s < 3600) return `${Math.floor(s / 60)}分${s % 60}秒`;
    return `${Math.floor(s / 3600)}时${Math.floor((s % 3600) / 60)}分`;
  };

  const activeCount = enrichedRooms.filter((r) => r.isActive).length;
  const allCollapsed = !detailsOpen && !connectionsOpen;

  /* ── 加载状态 ── */
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">验证登录状态...</p>
        </div>
      </div>
    );
  }

  /* ── render ── */
  return (
    <div className="flex h-screen overflow-hidden leading-relaxed">
      <ResizablePanelGroup orientation="horizontal">
        {/* ╔══════════════════════════════════╗
            ║  SIDEBAR                         ║
            ╚══════════════════════════════════╝ */}
        {!sidebarCollapsed && (
          <>
            <ResizablePanel
              id="sidebar"
              defaultSize="20%"
              minSize="14%"
              maxSize="40%"
              collapsible
              collapsedSize="0%"
            >
              <aside className="h-full bg-sidebar border-r border-sidebar-border flex flex-col leading-relaxed">
                {/* ── brand ── */}
                <div className="h-16 flex items-center gap-3 px-5 border-b border-sidebar-border shrink-0">
                  <div className="relative h-9 w-9 overflow-hidden rounded-lg ring-1 ring-black/5 shrink-0">
                    <Image
                      src="/Gemini_Generated_infinity_Image_aa0lzhaa0lzhaa0l.png"
                      alt="Board Admin Logo"
                      fill
                      sizes="36px"
                      className="object-cover"
                      priority
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold leading-relaxed truncate">
                      Board Admin
                    </div>
                    <div className="text-xs text-muted-foreground leading-relaxed mt-2 truncate">
                      协作画布管控
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 shrink-0 gap-0 text-muted-foreground hover:text-foreground"
                    onClick={() => setSidebarCollapsed(true)}
                  >
                    <PanelLeftClose className="h-4 w-4" />
                  </Button>
                </div>

                {/* ── search ── */}
                <div className="px-5 py-5 space-y-6 border-b border-sidebar-border shrink-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider leading-relaxed">
                      房间
                    </span>
                    <div className="flex items-center gap-4">
                      {activeCount > 0 && (
                        <Badge
                          variant="success"
                          className="text-xs px-4 py-1.5 h-auto font-medium leading-relaxed"
                        >
                          {activeCount} 活跃
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground/60 tabular-nums font-medium leading-relaxed">
                        {enrichedRooms.length}
                      </span>
                    </div>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                    <input
                      type="text"
                      placeholder="输入房间 ID 回车添加"
                      value={manualRoomId}
                      onChange={(e) => setManualRoomId(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAddRoom()}
                      className="w-full h-11 rounded-lg border border-input bg-background pl-11 pr-4 text-sm leading-relaxed placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-shadow"
                    />
                  </div>
                </div>

                {/* ── room list ── */}
                <ScrollArea className="flex-1">
                  {initialLoading ? (
                    <div className="flex items-center justify-center py-14 px-5 text-sm text-muted-foreground leading-relaxed">
                      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                      <span>加载中…</span>
                    </div>
                  ) : enrichedRooms.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-14 px-5 text-center">
                      <Layers className="h-10 w-10 text-muted-foreground/20 mb-6" />
                      <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                        暂无活跃房间
                      </p>
                      <p className="text-xs text-muted-foreground/60 mt-4 leading-relaxed">
                        输入房间 ID 回车添加监控
                      </p>
                    </div>
                  ) : (
                    <div className="p-5 space-y-6">
                      {enrichedRooms.map((room) => (
                        <button
                          key={room.id}
                          type="button"
                          className={`group w-full text-left rounded-lg px-4 py-4 leading-relaxed transition-all duration-150 cursor-pointer ${
                            selectedRoomId === room.id
                              ? 'bg-sidebar-accent shadow-sm'
                              : 'hover:bg-sidebar-accent/60'
                          }`}
                          onClick={() => handleSelectRoom(room.id)}
                        >
                          <div className="flex items-center gap-4 mb-3">
                            {room.isActive ? (
                              <span className="relative flex h-2 w-2 shrink-0">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                              </span>
                            ) : (
                              <span className="h-2 w-2 rounded-full bg-muted-foreground/20 shrink-0" />
                            )}
                            <span className="text-sm font-medium truncate flex-1 leading-relaxed">
                              {room.title || room.id}
                            </span>
                          </div>
                          <div className="flex min-w-0 items-center gap-4 pl-4 text-xs text-muted-foreground/70 leading-relaxed">
                            {room.status ? (
                              <>
                                <span
                                  className={
                                    room.isActive
                                      ? 'text-emerald-600 font-medium min-w-0 truncate'
                                      : 'min-w-0 truncate'
                                  }
                                >
                                  {room.status.activeConnections} 连接
                                </span>
                                <span className="shrink-0 text-muted-foreground/30">
                                  ·
                                </span>
                                <span className="min-w-0 truncate">
                                  {room.status.nodeCount} 节点
                                </span>
                              </>
                            ) : (
                              <span className="min-w-0 truncate">
                                Seq: {room.latest_seq}
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </aside>
            </ResizablePanel>
            <ResizableHandle withHandle />
          </>
        )}

        {/* ╔══════════════════════════════════╗
            ║  MAIN CONTENT                    ║
            ╚══════════════════════════════════╝ */}
        <ResizablePanel
          id="main"
          defaultSize={sidebarCollapsed ? '100%' : '80%'}
          minSize="60%"
        >
          <div className="h-full flex flex-col min-w-0 bg-background leading-relaxed">
            {/* ── Top bar ── */}
            <header className="h-16 flex items-center gap-5 px-5 border-b border-border/60 bg-card shrink-0">
              {sidebarCollapsed && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 gap-0 text-muted-foreground hover:text-foreground"
                  onClick={() => setSidebarCollapsed(false)}
                >
                  <PanelLeft className="h-5 w-5" />
                </Button>
              )}
              <h1 className="min-w-0 truncate text-base font-semibold tracking-tight">
                {selectedRoomId ? '房间详情' : 'Dashboard'}
              </h1>

              <div className="ml-auto flex items-center gap-4">
                {/* User Info */}
                {userInfo && (
                  <>
                    <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-muted/50">
                      {userInfo.avatar ? (
                        <img
                          src={userInfo.avatar}
                          alt={userInfo.name}
                          className="h-8 w-8 rounded-full"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                      )}
                      <div className="flex flex-col">
                        <span className="text-sm font-medium leading-none">
                          {userInfo.name}
                        </span>
                        <span className="text-xs text-muted-foreground leading-none mt-1">
                          {userInfo.email}
                        </span>
                      </div>
                    </div>

                    <div className="h-5 w-px bg-border/50" />
                  </>
                )}

                <Button
                  variant="ghost"
                  className="h-auto min-h-10 px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground gap-4 leading-relaxed"
                  onClick={() => fetchRooms()}
                >
                  <RefreshCw className="h-4 w-4" />
                  <span>刷新</span>
                </Button>

                <div className="h-5 w-px bg-border/50" />

                <select
                  title="自动刷新间隔"
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(+e.target.value)}
                  className="h-11 rounded-lg border border-input bg-background px-5 text-sm text-muted-foreground leading-relaxed cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring/20 transition-shadow"
                >
                  <option value="0">关闭自动刷新</option>
                  <option value="5000">5 秒刷新</option>
                  <option value="10000">10 秒刷新</option>
                  <option value="30000">30 秒刷新</option>
                </select>

                {selectedRoomId && selectedRoomStatus && (
                  <>
                    <div className="h-5 w-px bg-border/50" />
                    <Button
                      variant="destructive"
                      className="h-auto min-h-10 px-4 py-2.5 text-sm gap-4 leading-relaxed"
                      onClick={() =>
                        handleShutdownRoom(selectedRoomStatus.roomId)
                      }
                    >
                      <Power className="h-4 w-4" />
                      <span>关闭房间</span>
                    </Button>
                  </>
                )}

                <div className="h-5 w-px bg-border/50" />

                {/* Logout Button */}
                <Button
                  variant="ghost"
                  className="h-auto min-h-10 px-4 py-2.5 text-sm text-muted-foreground hover:text-destructive gap-4 leading-relaxed"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4" />
                  <span>退出</span>
                </Button>
              </div>
            </header>

            {/* ── Error banner ── */}
            {error && (
              <div className="mx-5 mt-5 mb-2 rounded-lg border border-destructive/20 bg-destructive/5 px-5 py-4 text-sm text-destructive leading-relaxed">
                {error}
              </div>
            )}

            {/* ── Body ── */}
            <ScrollArea className="flex-1">
              {!selectedRoomId ? (
                /* empty state */
                <div className="flex flex-col items-center justify-center h-full min-h-[480px] gap-8 px-5">
                  <Monitor className="h-14 w-14 text-muted-foreground/15" />
                  <p className="text-sm text-muted-foreground/70 font-medium leading-relaxed">
                    从左侧选择一个房间查看详情
                  </p>
                </div>
              ) : !selectedRoomStatus ? (
                /* loading */
                <div className="flex items-center justify-center h-full min-h-[480px] text-sm text-muted-foreground/70 leading-relaxed px-5">
                  <RefreshCw className="h-5 w-5 animate-spin mr-4" />
                  <span className="font-medium">加载房间状态…</span>
                </div>
              ) : (
                /* room detail */
                <div className="w-full min-w-0 p-5 space-y-6">
                  {/* ── 4‑up Metric Cards ── */}
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                      title="活跃连接"
                      value={selectedRoomStatus.activeConnections}
                      foot={`${selectedRoomStatus.activeUsers} 个活跃用户`}
                      trend={
                        selectedRoomStatus.activeConnections > 0
                          ? 'up'
                          : undefined
                      }
                      trendLabel={
                        selectedRoomStatus.activeConnections > 0
                          ? '在线'
                          : undefined
                      }
                      icon={
                        <Activity className="h-4 w-4 text-muted-foreground/50" />
                      }
                    />
                    <MetricCard
                      title="节点数量"
                      value={selectedRoomStatus.nodeCount}
                      foot={`序列号 #${selectedRoomStatus.seq}`}
                      icon={
                        <Layers className="h-4 w-4 text-muted-foreground/50" />
                      }
                    />
                    <MetricCard
                      title="锁定节点"
                      value={selectedRoomStatus.lockedNodesCount}
                      foot="当前被锁定的节点"
                      icon={
                        <Lock className="h-4 w-4 text-muted-foreground/50" />
                      }
                    />
                    <MetricCard
                      title="空闲时长"
                      value={fmtDur(selectedRoomStatus.idleSeconds)}
                      foot={
                        selectedRoomStatus.idleSeconds > 300
                          ? '超过 5 分钟未活动'
                          : '活动中'
                      }
                      trend={
                        selectedRoomStatus.idleSeconds > 300
                          ? 'down'
                          : undefined
                      }
                      trendLabel={
                        selectedRoomStatus.idleSeconds > 300
                          ? '需关注'
                          : undefined
                      }
                      icon={
                        <Clock className="h-4 w-4 text-muted-foreground/50" />
                      }
                    />
                  </div>

                  {/* ── Room Info (collapsible) ── */}
                  <Collapsible
                    open={detailsOpen}
                    onOpenChange={setDetailsOpen}
                  >
                    <Card className="p-6">
                      <CardHeader className="cursor-pointer select-none p-0">
                        <CollapsibleTrigger
                          className="w-full rounded-lg px-4 py-2.5 hover:bg-muted/20 hover:no-underline [&>svg]:text-muted-foreground/80"
                        >
                          <div className="flex w-full min-w-0 items-center justify-between gap-3">
                            <span className="min-w-0 truncate text-base font-semibold leading-relaxed">
                              房间信息
                            </span>
                            <Badge
                              variant="outline"
                              className="max-w-[45%] font-mono text-xs h-auto px-3.5 py-1.5 shrink-0 leading-relaxed truncate"
                            >
                              {selectedRoomStatus.lastStateSource}
                            </Badge>
                          </div>
                        </CollapsibleTrigger>
                      </CardHeader>
                      <CollapsibleContent>
                        <CardContent className="p-0 pt-4">
                          <div className="grid gap-x-6 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
                            <DetailItem
                              label="房间 ID"
                              value={selectedRoomStatus.roomId}
                              mono
                            />
                            <DetailItem
                              label="创建时间"
                              value={fmt(selectedRoomStatus.createdAt)}
                            />
                            <DetailItem
                              label="最后连接"
                              value={fmt(
                                selectedRoomStatus.lastConnectionAt,
                              )}
                            />
                            <DetailItem
                              label="数据来源"
                              value={selectedRoomStatus.lastStateSource}
                            />
                          </div>
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>

                  {/* ── Connections (collapsible) ── */}
                  <Collapsible
                    open={connectionsOpen}
                    onOpenChange={setConnectionsOpen}
                  >
                    <Card className="p-6">
                      <CardHeader className="cursor-pointer select-none p-0">
                        <CollapsibleTrigger
                          className="w-full rounded-lg px-4 py-2.5 hover:bg-muted/20 hover:no-underline [&>svg]:text-muted-foreground/80"
                        >
                          <div className="flex w-full min-w-0 items-center justify-between gap-3">
                            <span className="min-w-0 truncate text-base font-semibold leading-relaxed">
                              在线用户
                            </span>
                            <Badge
                              variant="secondary"
                              className="text-xs h-auto px-3.5 py-1.5 font-medium shrink-0 leading-relaxed"
                            >
                              {selectedRoomStatus.connections.length}
                            </Badge>
                          </div>
                        </CollapsibleTrigger>
                      </CardHeader>
                      <CollapsibleContent>
                        <CardContent className="p-0 pt-4">
                          {selectedRoomStatus.connections.length === 0 ? (
                            <div className="text-center py-12 text-sm text-muted-foreground/70 leading-relaxed">
                              当前无在线用户
                            </div>
                          ) : (
                            <div className="rounded-lg border border-border/60 overflow-hidden">
                              <table className="w-full text-sm leading-relaxed">
                                <thead>
                                  <tr className="bg-muted/30 border-b border-border/40">
                                    <th className="text-left py-4 px-5 font-medium text-muted-foreground text-xs uppercase tracking-wider leading-relaxed">
                                      用户
                                    </th>
                                    <th className="text-left py-4 px-5 font-medium text-muted-foreground text-xs uppercase tracking-wider leading-relaxed">
                                      加入时间
                                    </th>
                                    <th className="text-left py-4 px-5 font-medium text-muted-foreground text-xs uppercase tracking-wider leading-relaxed">
                                      最后活动
                                    </th>
                                    <th className="text-left py-4 px-5 font-medium text-muted-foreground text-xs uppercase tracking-wider leading-relaxed">
                                      空闲
                                    </th>
                                    <th className="w-32 py-4 px-5" />
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-border/40">
                                  {selectedRoomStatus.connections.map(
                                    (conn, i) => (
                                      <tr
                                        key={i}
                                        className="hover:bg-muted/20 transition-colors"
                                      >
                                        <td className="py-4 px-5">
                                          <div className="max-w-[260px] truncate font-medium text-sm leading-relaxed">
                                            {conn.userName || conn.userId}
                                          </div>
                                          {conn.userName && (
                                            <div className="max-w-[260px] truncate text-xs text-muted-foreground/60 font-mono mt-3 leading-relaxed">
                                              {conn.userId}
                                            </div>
                                          )}
                                        </td>
                                        <td className="py-4 px-5 text-xs text-muted-foreground leading-relaxed">
                                          {fmt(conn.joinedAt)}
                                        </td>
                                        <td className="py-4 px-5 text-xs text-muted-foreground leading-relaxed">
                                          {fmt(conn.lastActiveAt)}
                                        </td>
                                        <td className="py-4 px-5">
                                          <Badge
                                            variant={
                                              conn.idleSeconds > 300
                                                ? 'warning'
                                                : 'secondary'
                                            }
                                            className="text-xs h-auto px-4 py-1.5 leading-relaxed"
                                          >
                                            {fmtDur(conn.idleSeconds)}
                                          </Badge>
                                        </td>
                                        <td className="py-4 px-5 text-right">
                                          <Button
                                            variant="ghost"
                                            className="h-auto min-h-10 px-4 py-2.5 text-sm text-destructive hover:text-destructive hover:bg-destructive/10 gap-4 leading-relaxed"
                                            onClick={() =>
                                              handleKickUser(
                                                selectedRoomStatus.roomId,
                                                conn.userId,
                                              )
                                            }
                                          >
                                            <UserX className="h-3.5 w-3.5" />
                                            <span>踢出</span>
                                          </Button>
                                        </td>
                                      </tr>
                                    ),
                                  )}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </CardContent>
                      </CollapsibleContent>
                    </Card>
                  </Collapsible>

                  {/* ── Canvas Preview ── */}
                  {selectedRoomId && (
                    <Card className="p-6">
                      <CardHeader className="p-0">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base font-semibold mb-3 leading-relaxed">
                              画布预览
                            </CardTitle>
                            <CardDescription className="text-sm leading-relaxed">
                              实时预览当前画布内容
                            </CardDescription>
                          </div>
                          <div className="flex items-center gap-4 shrink-0 ml-4">
                            {showCanvas && (
                              <Button
                                variant="ghost"
                                className="h-auto min-h-10 px-4 py-2.5 text-sm text-muted-foreground gap-4 leading-relaxed"
                                onClick={() => {
                                  const shouldExpand = allCollapsed;
                                  setDetailsOpen(shouldExpand);
                                  setConnectionsOpen(shouldExpand);
                                }}
                              >
                                {allCollapsed ? (
                                  <Minimize2 className="h-4 w-4" />
                                ) : (
                                  <Maximize2 className="h-4 w-4" />
                                )}
                                <span>{allCollapsed ? '还原' : '最大化'}</span>
                              </Button>
                            )}
                            <Button
                              variant={showCanvas ? 'secondary' : 'default'}
                              className="h-auto min-h-10 px-4 py-2.5 text-sm gap-4 leading-relaxed"
                              onClick={() => setShowCanvas(!showCanvas)}
                            >
                              {showCanvas ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                              <span>{showCanvas ? '隐藏画布' : '显示画布'}</span>
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      {showCanvas && (
                        <CardContent className="p-0 pt-4">
                          <div
                            className="w-full rounded-lg border border-border/60 overflow-hidden bg-muted/10"
                            style={{
                              height: allCollapsed
                                ? 'calc(100vh - 300px)'
                                : 'max(440px, calc(100vh - 760px))',
                            }}
                          >
                            <iframe
                              key={selectedRoomId}
                              src={`/?canvasId=${selectedRoomId}&adminMode=true&userId=${adminUserId}`}
                              className="w-full h-full border-0"
                              title={`Canvas Preview: ${selectedRoomId}`}
                            />
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  )}
                </div>
              )}
            </ScrollArea>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}

/* ════════════════════════════════════
   Sub‑components
   ════════════════════════════════════ */

/** Dashboard‑style metric card (matches shadcn/ui examples/dashboard) */
function MetricCard({
  title,
  value,
  foot,
  trend,
  trendLabel,
  icon,
}: {
  title: string;
  value: string | number;
  foot: string;
  trend?: 'up' | 'down';
  trendLabel?: string;
  icon: React.ReactNode;
}) {
  return (
    <Card className="overflow-hidden p-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-0">
        <CardTitle className="text-sm font-medium text-muted-foreground leading-relaxed">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent className="p-0 pt-4">
        <div className="text-3xl font-bold tracking-tight tabular-nums leading-none mb-2">
          {value}
        </div>
        <div className="flex items-center gap-4 mt-2">
          {trend && (
            <span
              className={`inline-flex items-center gap-4 text-xs font-medium leading-relaxed ${
                trend === 'up' ? 'text-emerald-600' : 'text-amber-600'
              }`}
            >
              {trend === 'up' ? (
                <TrendingUp className="h-3.5 w-3.5" />
              ) : (
                <TrendingDown className="h-3.5 w-3.5" />
              )}
              {trendLabel}
            </span>
          )}
          <span className="text-xs text-muted-foreground/70 leading-relaxed">
            {foot}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

/** Detail key‑value item */
function DetailItem({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0 space-y-2">
      <div className="truncate text-xs font-medium text-muted-foreground/70 uppercase tracking-wider leading-relaxed">
        {label}
      </div>
      <div
        className={`text-sm font-medium leading-relaxed truncate ${
          mono ? 'font-mono text-xs' : ''
        }`}
      >
        {value}
      </div>
    </div>
  );
}
