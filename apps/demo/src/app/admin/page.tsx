'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import './admin.css';

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

export default function AdminPage() {
  const [enrichedRooms, setEnrichedRooms] = useState<EnrichedRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedRoomStatus, setSelectedRoomStatus] = useState<RoomStatus | null>(null);
  const [refreshInterval, setRefreshInterval] = useState(5000);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [manualRoomId, setManualRoomId] = useState<string>('');
  const [manualRoomIds, setManualRoomIds] = useState<string[]>([]);
  const [showCanvas, setShowCanvas] = useState(false);
  
  // 固定的管理员 userId,避免 iframe 重新加载
  const adminUserId = useMemo(() => `admin_${Math.random().toString(36).slice(2, 9)}`, []);

  const API_BASE = process.env.NEXT_PUBLIC_WS_BASE?.replace('wss://', 'https://').replace('ws://', 'http://') || 
                   'https://infinite-canvas-collab-server.buzzbus.workers.dev';
  const TOKEN = process.env.NEXT_PUBLIC_USER_TOKEN || 'user_admin';

  // 获取房间列表并加载实时状态
  const fetchRooms = useCallback(async (silent = false) => {
    try {
      const response = await fetch(`${API_BASE}/admin/rooms`, {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch rooms: ${response.statusText}`);
      }
      
      const data = await response.json();
      const roomList: RoomInfo[] = data.rooms || [];

      const manualIdSet = new Set(manualRoomIds);
      const statusTargetIds = new Set<string>(roomList.map(room => room.id));
      manualRoomIds.forEach(id => statusTargetIds.add(id));

      // 并发获取所有房间的实时状态(包含手动添加的房间)
      const statusPromises = Array.from(statusTargetIds).map(async (roomId) => {
        try {
          const statusResponse = await fetch(`${API_BASE}/admin/rooms/${roomId}`, {
            headers: {
              'Authorization': `Bearer ${TOKEN}`,
            },
          });
          
          if (statusResponse.ok) {
            const status: RoomStatus = await statusResponse.json();
            return {
              roomId,
              status,
              isActive: status.activeConnections > 0,
            };
          }
        } catch (err) {
          console.error(`Failed to fetch status for ${roomId}:`, err);
        }
        return { roomId, status: undefined, isActive: false };
      });
      
      const statuses = await Promise.all(statusPromises);
      const statusById = new Map(statuses.map(item => [item.roomId, item.status]));
      const activeById = new Map(statuses.map(item => [item.roomId, item.isActive]));
      
      // 更新房间状态(只展示在线房间 + 手动添加)
      setEnrichedRooms(prev => {
        const prevById = new Map(prev.map(room => [room.id, room]));
        const next: EnrichedRoom[] = [];

        roomList.forEach(room => {
          const prevRoom = prevById.get(room.id);
          const status = statusById.get(room.id) ?? prevRoom?.status;
          const isActive = status
            ? status.activeConnections > 0
            : (prevRoom?.isActive ?? false);
          const isManual = manualIdSet.has(room.id);

          if (isActive || isManual) {
            next.push({
              ...room,
              status,
              isActive,
              loading: false,
            });
          }
        });

        const includedIds = new Set(next.map(room => room.id));
        manualIdSet.forEach(roomId => {
          if (includedIds.has(roomId)) {
            return;
          }
          const prevRoom = prevById.get(roomId);
          const status = statusById.get(roomId) ?? prevRoom?.status;
          const isActive = status
            ? status.activeConnections > 0
            : (prevRoom?.isActive ?? false);
          next.push({
            id: roomId,
            title: prevRoom?.title ?? roomId,
            latest_seq: prevRoom?.latest_seq ?? status?.seq ?? 0,
            updated_at: prevRoom?.updated_at ?? (status ? new Date(status.lastConnectionAt).toISOString() : new Date().toISOString()),
            status,
            isActive,
            loading: false,
          });
        });

        return next;
      });
      
      setError(null);
    } catch (err) {
      console.error('Error fetching rooms:', err);
      if (!silent) {
        setError(err instanceof Error ? err.message : 'Failed to fetch rooms');
      }
    } finally {
      if (initialLoading) {
        setInitialLoading(false);
      }
    }
  }, [API_BASE, TOKEN, initialLoading, manualRoomIds]);

  // 获取房间详细状态
  const fetchRoomStatus = useCallback(async (roomId: string, silent = false) => {
    if (!silent) {
      setSelectedRoomStatus(null);
    }
    
    try {
      const response = await fetch(`${API_BASE}/admin/rooms/${roomId}`, {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch room status: ${response.statusText}`);
      }
      
      const data = await response.json();
      setSelectedRoomStatus(data);
      
      // 同时更新列表中的状态
      setEnrichedRooms(prev => prev.map(room => 
        room.id === roomId 
          ? { ...room, status: data, isActive: data.activeConnections > 0, loading: false }
          : room
      ));
      
      setError(null);
    } catch (err) {
      console.error('Error fetching room status:', err);
      if (!silent) {
        setError(err instanceof Error ? err.message : 'Failed to fetch room status');
      }
    }
  }, [API_BASE, TOKEN]);

  // 关闭房间
  const handleShutdownRoom = async (roomId: string) => {
    if (!confirm(`确定要关闭房间 ${roomId} 吗？这将断开所有连接。`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/admin/rooms/${roomId}/shutdown`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to shutdown room: ${response.statusText}`);
      }
      
      alert('房间已关闭');
      setSelectedRoomId(null);
      setSelectedRoomStatus(null);
      fetchRooms();
    } catch (err) {
      console.error('Error shutting down room:', err);
      alert(err instanceof Error ? err.message : 'Failed to shutdown room');
    }
  };

  // 踢出用户
  const handleKickUser = async (roomId: string, userId: string) => {
    if (!confirm(`确定要踢出用户 ${userId} 吗？`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/admin/rooms/${roomId}/kick`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to kick user: ${response.statusText}`);
      }
      
      alert('用户已被踢出');
      fetchRoomStatus(roomId);
    } catch (err) {
      console.error('Error kicking user:', err);
      alert(err instanceof Error ? err.message : 'Failed to kick user');
    }
  };

  // 选择房间
  const handleSelectRoom = (roomId: string) => {
    setSelectedRoomId(roomId);
    const room = enrichedRooms.find(r => r.id === roomId);
    if (room?.status) {
      setSelectedRoomStatus(room.status);
    } else {
      fetchRoomStatus(roomId);
    }
  };

  // 手动添加房间监控
  const handleAddRoom = async () => {
    const roomId = manualRoomId.trim();
    if (!roomId) {
      alert('请输入房间ID');
      return;
    }

    // 检查是否已存在
    if (enrichedRooms.some(r => r.id === roomId)) {
      alert('该房间已在列表中');
      setManualRoomIds(prev => (prev.includes(roomId) ? prev : [roomId, ...prev]));
      handleSelectRoom(roomId);
      setManualRoomId('');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/admin/rooms/${roomId}`, {
        headers: {
          'Authorization': `Bearer ${TOKEN}`,
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch room: ${response.statusText}`);
      }
      
      const status: RoomStatus = await response.json();
      
      // 添加到房间列表
      const newRoom: EnrichedRoom = {
        id: roomId,
        title: roomId,
        latest_seq: status.seq,
        updated_at: new Date(status.lastConnectionAt).toISOString(),
        status,
        isActive: status.activeConnections > 0,
        loading: false,
      };
      
      setEnrichedRooms(prev => [newRoom, ...prev]);
      setManualRoomIds(prev => (prev.includes(roomId) ? prev : [roomId, ...prev]));
      setSelectedRoomId(roomId);
      setSelectedRoomStatus(status);
      setManualRoomId('');
      setError(null);
    } catch (err) {
      console.error('Error adding room:', err);
      alert(err instanceof Error ? err.message : 'Failed to add room');
    }
  };

  // 刷新当前房间状态
  const handleRefreshStatus = () => {
    if (selectedRoomId) {
      fetchRoomStatus(selectedRoomId);
    }
  };

  // 初始加载
  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  // 自动刷新(静默模式,无感刷新)
  useEffect(() => {
    if (refreshInterval > 0) {
      const timer = setInterval(() => {
        // 静默刷新房间列表和状态(不影响 iframe)
        fetchRooms(true);
        
        // 如果有选中的房间,静默刷新其详细状态
        if (selectedRoomId) {
          fetchRoomStatus(selectedRoomId, true);
        }
      }, refreshInterval);
      return () => clearInterval(timer);
    }
  }, [refreshInterval, selectedRoomId, fetchRooms, fetchRoomStatus]);

  // 格式化时间
  const formatTime = (timestamp: number | string) => {
    const date = new Date(typeof timestamp === 'string' ? timestamp : timestamp);
    return date.toLocaleString('zh-CN');
  };

  // 格式化持续时间
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}秒`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}分${seconds % 60}秒`;
    return `${Math.floor(seconds / 3600)}小时${Math.floor((seconds % 3600) / 60)}分`;
  };

  return (
    <div className="admin-panel">
      <header className="admin-header">
        <h1>Board 协作画布管控面板</h1>
        <div className="admin-controls">
          <button onClick={() => fetchRooms()} className="btn-refresh">
            刷新列表
          </button>
          <select 
            value={refreshInterval} 
            onChange={e => setRefreshInterval(+e.target.value)}
            className="refresh-select"
          >
            <option value="0">关闭自动刷新</option>
            <option value="5000">5秒自动刷新</option>
            <option value="10000">10秒自动刷新</option>
            <option value="30000">30秒自动刷新</option>
          </select>
        </div>
      </header>

      {error && (
        <div className="error-banner">
          ⚠️ {error}
        </div>
      )}

      <div className="admin-content">
        <aside className="room-list">
          <div className="room-list-header">
            <h2>
              房间列表 ({enrichedRooms.length})
              {enrichedRooms.filter(r => r.isActive).length > 0 && (
                <span className="active-count">
                  {enrichedRooms.filter(r => r.isActive).length} 活跃
                </span>
              )}
            </h2>
            <div className="add-room-form">
              <input
                type="text"
                placeholder="输入房间ID (如: room15)"
                value={manualRoomId}
                onChange={(e) => setManualRoomId(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddRoom()}
                className="room-input"
              />
              <button onClick={handleAddRoom} className="btn-add">
                添加
              </button>
            </div>
          </div>
          
          {initialLoading ? (
            <div className="loading-state">加载中...</div>
          ) : enrichedRooms.length === 0 ? (
            <div className="empty-state">
              <p>暂无房间</p>
              <p className="hint">提示: 输入房间ID手动添加监控</p>
            </div>
          ) : (
            <ul>
              {enrichedRooms.map(room => (
                <li 
                  key={room.id}
                  className={`${selectedRoomId === room.id ? 'selected' : ''} ${room.isActive ? 'active' : ''}`}
                  onClick={() => handleSelectRoom(room.id)}
                >
                  <div className="room-item">
                    <div className="room-header">
                      <div className="room-title-wrapper">
                        {room.isActive && <span className="active-indicator">●</span>}
                        <div className="room-title">{room.title || room.id}</div>
                      </div>
                      {room.loading && <span className="loading-spinner">⟳</span>}
                    </div>
                    <div className="room-meta">
                      {room.status ? (
                        <>
                          <span className={room.status.activeConnections > 0 ? 'status-active' : 'status-idle'}>
                            {room.status.activeConnections} 连接
                          </span>
                          <span>{room.status.nodeCount} 节点</span>
                        </>
                      ) : (
                        <>
                          <span>Seq: {room.latest_seq}</span>
                          <span>{formatTime(room.updated_at)}</span>
                        </>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <main className="room-detail">
          {!selectedRoomId ? (
            <div className="empty-state">请从左侧选择一个房间</div>
          ) : !selectedRoomStatus ? (
            <div className="loading-state">加载房间状态...</div>
          ) : (
            <div className="status-container">
              <div className="status-header">
                <h2>房间详情: {selectedRoomStatus.roomId}</h2>
                <div className="status-actions">
                  <button onClick={handleRefreshStatus} className="btn-refresh">
                    刷新状态
                  </button>
                  <button 
                    onClick={() => handleShutdownRoom(selectedRoomStatus.roomId)} 
                    className="btn-danger"
                  >
                    关闭房间
                  </button>
                </div>
              </div>

              <div className="status-grid">
                <div className="status-card">
                  <h3>基本信息</h3>
                  <dl>
                    <dt>房间ID:</dt>
                    <dd>{selectedRoomStatus.roomId}</dd>
                    <dt>创建时间:</dt>
                    <dd>{formatTime(selectedRoomStatus.createdAt)}</dd>
                    <dt>最后连接:</dt>
                    <dd>{formatTime(selectedRoomStatus.lastConnectionAt)}</dd>
                    <dt>数据来源:</dt>
                    <dd>{selectedRoomStatus.lastStateSource}</dd>
                  </dl>
                </div>

                <div className="status-card">
                  <h3>状态统计</h3>
                  <dl>
                    <dt>活跃连接:</dt>
                    <dd className={selectedRoomStatus.activeConnections > 0 ? 'status-active' : 'status-idle'}>
                      {selectedRoomStatus.activeConnections}
                    </dd>
                    <dt>活跃用户:</dt>
                    <dd>{selectedRoomStatus.activeUsers}</dd>
                    <dt>节点数量:</dt>
                    <dd>{selectedRoomStatus.nodeCount}</dd>
                    <dt>序列号:</dt>
                    <dd>{selectedRoomStatus.seq}</dd>
                    <dt>锁定节点:</dt>
                    <dd>{selectedRoomStatus.lockedNodesCount}</dd>
                    <dt>空闲时长:</dt>
                    <dd className={selectedRoomStatus.idleSeconds > 300 ? 'status-warning' : ''}>
                      {formatDuration(selectedRoomStatus.idleSeconds)}
                    </dd>
                  </dl>
                </div>
              </div>

              <div className="connections-section">
                <h3>连接列表 ({selectedRoomStatus.connections.length})</h3>
                {selectedRoomStatus.connections.length === 0 ? (
                  <div className="empty-state">当前无活跃连接</div>
                ) : (
                  <table className="connections-table">
                    <thead>
                      <tr>
                        <th>用户ID</th>
                        <th>用户名</th>
                        <th>加入时间</th>
                        <th>最后活动</th>
                        <th>空闲时长</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedRoomStatus.connections.map((conn, idx) => (
                        <tr key={idx} className={conn.idleSeconds > 300 ? 'idle-warning' : ''}>
                          <td>{conn.userId}</td>
                          <td>{conn.userName || '-'}</td>
                          <td>{formatTime(conn.joinedAt)}</td>
                          <td>{formatTime(conn.lastActiveAt)}</td>
                          <td className={conn.idleSeconds > 300 ? 'status-warning' : ''}>
                            {formatDuration(conn.idleSeconds)}
                          </td>
                          <td>
                            <button 
                              onClick={() => handleKickUser(selectedRoomStatus.roomId, conn.userId)}
                              className="btn-kick"
                            >
                              踢出
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* 画布预览区域 */}
              {selectedRoomId && (
                <div className="canvas-preview-section">
                  <div className="canvas-preview-header">
                    <h3>画布预览</h3>
                    <button 
                      onClick={() => setShowCanvas(!showCanvas)}
                      className="btn-toggle-canvas"
                    >
                      {showCanvas ? '隐藏画布' : '显示画布'}
                    </button>
                  </div>
                  
                  {showCanvas && (
                    <div className="canvas-preview-container">
                      <iframe
                        key={selectedRoomId}
                        src={`/?canvasId=${selectedRoomId}&adminMode=true&userId=${adminUserId}`}
                        className="canvas-preview-iframe"
                        title={`Canvas Preview: ${selectedRoomId}`}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
