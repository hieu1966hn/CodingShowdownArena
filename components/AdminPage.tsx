import React, { useEffect, useState } from 'react';
import { db, auth } from '../lib/firebase';
import {
    Trash2, RefreshCw, LogOut, Shield, Database, Clock,
    Users, ChevronDown, ChevronUp, AlertTriangle, CheckCircle,
    XCircle, Search, Filter, Home, Archive
} from 'lucide-react';

// ============================================================
// 🔐 THAY BẰNG UID GOOGLE CỦA BẠN
// Cách lấy: Mở DevTools > Console > gõ: firebase.auth().currentUser.uid
// ============================================================
const ADMIN_UID = "T9nE9HbLRCTrBFURZ6dG6jdJPQK2";


// ============================================================

interface RoomDoc {
    id: string;
    createdAt?: any;
    expiresAt?: any;
    round?: string;
    players?: any[];
    message?: string;
    [key: string]: any;
}

interface HistoryDoc {
    id: string;
    archivedAt?: any;
    roomId?: string;
    round?: string;
    players?: any[];
    [key: string]: any;
}

type TabType = 'rooms' | 'history';

const AdminPage: React.FC<{ onLeave: () => void }> = ({ onLeave }) => {
    const [currentUser] = useState(auth.currentUser);
    const [rooms, setRooms] = useState<RoomDoc[]>([]);
    const [history, setHistory] = useState<HistoryDoc[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<TabType>('rooms');
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<{ ids: string[]; collection: string } | null>(null);

    // ── Auth Guard ──────────────────────────────────────────
    const isAdmin = currentUser?.uid === ADMIN_UID;

    // ── Fetch Data ──────────────────────────────────────────
    const fetchRooms = async () => {
        setLoading(true);
        try {
            const snap = await db.collection('rooms').get();
            const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as RoomDoc));
            docs.sort((a, b) => {
                const ta = a.createdAt?.toMillis?.() || 0;
                const tb = b.createdAt?.toMillis?.() || 0;
                return tb - ta;
            });
            setRooms(docs);
        } catch (e) {
            showStatus('error', 'Không thể tải danh sách rooms');
        }
        setLoading(false);
    };

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const snap = await db.collection('history').get();
            const docs = snap.docs.map(d => ({ id: d.id, ...d.data() } as HistoryDoc));
            docs.sort((a, b) => {
                const ta = a.archivedAt?.toMillis?.() || 0;
                const tb = b.archivedAt?.toMillis?.() || 0;
                return tb - ta;
            });
            setHistory(docs);
        } catch (e) {
            showStatus('error', 'Không thể tải history');
        }
        setLoading(false);
    };

    useEffect(() => {
        if (!isAdmin) return;
        fetchRooms();
        fetchHistory();
    }, [isAdmin]);

    // ── Helpers ─────────────────────────────────────────────
    const showStatus = (type: 'success' | 'error' | 'info', text: string) => {
        setStatusMsg({ type, text });
        setTimeout(() => setStatusMsg(null), 4000);
    };

    const formatDate = (ts: any) => {
        if (!ts) return '—';
        try {
            const d = ts.toDate ? ts.toDate() : new Date(ts);
            return d.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
        } catch { return '—'; }
    };

    const getDaysUntilExpiry = (ts: any) => {
        if (!ts) return null;
        try {
            const expiry = ts.toDate ? ts.toDate() : new Date(ts);
            const diff = Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            return diff;
        } catch { return null; }
    };

    // ── Delete Operations ────────────────────────────────────
    const deleteItems = async (ids: string[], collection: string) => {
        setConfirmDelete(null);
        showStatus('info', `Đang xóa ${ids.length} mục...`);
        let success = 0;
        let fail = 0;
        for (const id of ids) {
            try {
                await db.collection(collection).doc(id).delete();
                success++;
            } catch {
                fail++;
            }
        }
        if (collection === 'rooms') {
            setRooms(prev => prev.filter(r => !ids.includes(r.id)));
        } else {
            setHistory(prev => prev.filter(h => !ids.includes(h.id)));
        }
        setSelectedIds(new Set());
        if (fail === 0) {
            showStatus('success', `✅ Đã xóa ${success} mục thành công`);
        } else {
            showStatus('error', `⚠️ Xóa ${success} thành công, ${fail} thất bại`);
        }
    };

    const handleDelete = (ids: string[], collection: string) => {
        setConfirmDelete({ ids, collection });
    };

    // ── Selection ────────────────────────────────────────────
    const toggleSelect = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleSelectAll = (items: Array<{ id: string }>) => {
        const allIds = items.map(i => i.id);
        const allSelected = allIds.every(id => selectedIds.has(id));
        if (allSelected) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(allIds));
        }
    };

    // ── Filter ───────────────────────────────────────────────
    const filteredRooms = rooms.filter(r =>
        r.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const filteredHistory = history.filter(h =>
        h.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (h.roomId || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    // ── Expired Rooms ────────────────────────────────────────
    const expiredRooms = rooms.filter(r => {
        const days = getDaysUntilExpiry(r.expiresAt);
        return days !== null && days <= 0;
    });

    const deleteExpiredRooms = () => {
        if (expiredRooms.length === 0) {
            showStatus('info', 'Không có room hết hạn nào');
            return;
        }
        handleDelete(expiredRooms.map(r => r.id), 'rooms');
    };

    // ── Render: Not Admin ────────────────────────────────────
    if (!isAdmin) {
        return (
            <div className="min-h-screen bg-cyber-dark flex items-center justify-center text-white">
                <div className="text-center space-y-4 p-8">
                    <Shield size={64} className="text-red-500 mx-auto" />
                    <h1 className="text-3xl font-black text-red-400">ACCESS DENIED</h1>
                    <p className="text-gray-400 font-mono text-sm">Bạn không có quyền truy cập trang này.</p>
                    <button
                        onClick={onLeave}
                        className="mt-4 px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold transition-all"
                    >
                        ← Quay lại
                    </button>
                </div>
            </div>
        );
    }

    // ── Render: Admin Panel ──────────────────────────────────
    return (
        <div className="min-h-screen bg-cyber-dark text-white">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-gray-800 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-900/60 rounded-xl flex items-center justify-center border border-purple-500/50">
                            <Shield size={20} className="text-purple-400" />
                        </div>
                        <div>
                            <h1 className="text-lg font-black text-white tracking-tight">ADMIN PANEL</h1>
                            <p className="text-xs text-gray-500 font-mono">CodingShowdownArena</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 font-mono hidden md:block">
                            {currentUser?.email}
                        </span>
                        <button
                            onClick={onLeave}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm font-bold transition-all"
                        >
                            <Home size={16} /> Home
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-6 space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard icon={<Database size={20} />} label="Tổng Rooms" value={rooms.length} color="cyan" />
                    <StatCard icon={<Archive size={20} />} label="Tổng History" value={history.length} color="purple" />
                    <StatCard
                        icon={<Users size={20} />}
                        label="Rooms Active"
                        value={rooms.filter(r => r.round && r.round !== 'GAME_OVER').length}
                        color="green"
                    />
                    <div
                        onClick={deleteExpiredRooms}
                        className={`rounded-xl p-4 border cursor-pointer transition-all ${
                            expiredRooms.length > 0
                                ? 'bg-red-900/30 border-red-700 hover:bg-red-800/40'
                                : 'bg-gray-900/30 border-gray-800'
                        }`}
                    >
                        <div className={`flex items-center gap-2 mb-2 ${
                            expiredRooms.length > 0 ? 'text-red-400' : 'text-gray-600'
                        }`}>
                            <Trash2 size={20} />
                            <span className="text-xs font-mono text-gray-400">Rooms Hết Hạn</span>
                        </div>
                        <div className={`text-3xl font-black ${
                            expiredRooms.length > 0 ? 'text-red-400' : 'text-gray-600'
                        }`}>{expiredRooms.length}</div>
                        {expiredRooms.length > 0 && (
                            <div className="text-xs text-red-400/70 mt-1 font-mono">Click để xóa</div>
                        )}
                    </div>
                </div>

                {/* Status message */}
                {statusMsg && (
                    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border font-mono text-sm ${
                        statusMsg.type === 'success' ? 'bg-green-900/40 border-green-500/50 text-green-300' :
                        statusMsg.type === 'error' ? 'bg-red-900/40 border-red-500/50 text-red-300' :
                        'bg-blue-900/40 border-blue-500/50 text-blue-300'
                    }`}>
                        {statusMsg.type === 'success' ? <CheckCircle size={16} /> :
                         statusMsg.type === 'error' ? <XCircle size={16} /> :
                         <RefreshCw size={16} className="animate-spin" />}
                        {statusMsg.text}
                    </div>
                )}

                {/* Tabs + Search + Actions */}
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                    <div className="flex bg-gray-900 rounded-xl p-1 border border-gray-800">
                        <TabButton label={`Rooms (${rooms.length})`} active={activeTab === 'rooms'} onClick={() => { setActiveTab('rooms'); setSelectedIds(new Set()); }} />
                        <TabButton label={`History (${history.length})`} active={activeTab === 'history'} onClick={() => { setActiveTab('history'); setSelectedIds(new Set()); }} />
                    </div>

                    <div className="flex gap-3 flex-wrap">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="pl-9 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-xl text-sm font-mono focus:border-cyan-500 focus:outline-none w-48"
                            />
                        </div>
                        <button
                            onClick={() => { activeTab === 'rooms' ? fetchRooms() : fetchHistory(); }}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-xl text-sm font-bold transition-all"
                        >
                            <RefreshCw size={16} /> Refresh
                        </button>
                        {selectedIds.size > 0 && (
                            <button
                                onClick={() => handleDelete(Array.from(selectedIds), activeTab === 'rooms' ? 'rooms' : 'history')}
                                className="flex items-center gap-2 px-4 py-2 bg-red-800 hover:bg-red-700 rounded-xl text-sm font-bold transition-all border border-red-600"
                            >
                                <Trash2 size={16} /> Xóa {selectedIds.size} mục
                            </button>
                        )}
                    </div>
                </div>

                {/* Table */}
                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <RefreshCw size={32} className="animate-spin text-cyan-500" />
                    </div>
                ) : activeTab === 'rooms' ? (
                    <RoomsTable
                        rooms={filteredRooms}
                        selectedIds={selectedIds}
                        expandedId={expandedId}
                        onToggleSelect={toggleSelect}
                        onToggleSelectAll={() => toggleSelectAll(filteredRooms)}
                        onExpand={setExpandedId}
                        onDelete={(id) => handleDelete([id], 'rooms')}
                        formatDate={formatDate}
                        getDaysUntilExpiry={getDaysUntilExpiry}
                    />
                ) : (
                    <HistoryTable
                        history={filteredHistory}
                        selectedIds={selectedIds}
                        expandedId={expandedId}
                        onToggleSelect={toggleSelect}
                        onToggleSelectAll={() => toggleSelectAll(filteredHistory)}
                        onExpand={setExpandedId}
                        onDelete={(id) => handleDelete([id], 'history')}
                        formatDate={formatDate}
                    />
                )}
            </div>

            {/* Confirm Delete Modal */}
            {confirmDelete && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-900 border border-red-500/50 rounded-2xl p-6 max-w-sm w-full shadow-[0_0_40px_rgba(239,68,68,0.2)]">
                        <div className="flex items-center gap-3 mb-4">
                            <AlertTriangle size={24} className="text-red-400" />
                            <h3 className="text-lg font-black text-white">Xác nhận xóa</h3>
                        </div>
                        <p className="text-gray-300 mb-2">
                            Bạn sắp xóa <span className="text-red-400 font-bold">{confirmDelete.ids.length} mục</span> khỏi collection <span className="text-yellow-400 font-mono">/{confirmDelete.collection}</span>.
                        </p>
                        <p className="text-gray-500 text-sm mb-6 font-mono">Hành động này không thể hoàn tác.</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmDelete(null)}
                                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold transition-all"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={() => deleteItems(confirmDelete.ids, confirmDelete.collection)}
                                className="flex-1 py-3 bg-red-700 hover:bg-red-600 rounded-xl font-bold transition-all text-white"
                            >
                                Xóa
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ── Sub-components ──────────────────────────────────────────

const StatCard: React.FC<{ icon: React.ReactNode; label: string; value: number; color: string }> = ({ icon, label, value, color }) => {
    const colorMap: Record<string, string> = {
        cyan: 'text-cyan-400 bg-cyan-900/30 border-cyan-800',
        purple: 'text-purple-400 bg-purple-900/30 border-purple-800',
        amber: 'text-amber-400 bg-amber-900/30 border-amber-800',
        green: 'text-green-400 bg-green-900/30 border-green-800',
    };
    return (
        <div className={`rounded-xl p-4 border ${colorMap[color]}`}>
            <div className={`flex items-center gap-2 mb-2 ${colorMap[color].split(' ')[0]}`}>{icon}<span className="text-xs font-mono text-gray-400">{label}</span></div>
            <div className="text-3xl font-black text-white">{value}</div>
        </div>
    );
};

const TabButton: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${active ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'}`}
    >
        {label}
    </button>
);

const RoomsTable: React.FC<{
    rooms: RoomDoc[];
    selectedIds: Set<string>;
    expandedId: string | null;
    onToggleSelect: (id: string) => void;
    onToggleSelectAll: () => void;
    onExpand: (id: string | null) => void;
    onDelete: (id: string) => void;
    formatDate: (ts: any) => string;
    getDaysUntilExpiry: (ts: any) => number | null;
}> = ({ rooms, selectedIds, expandedId, onToggleSelect, onToggleSelectAll, onExpand, onDelete, formatDate, getDaysUntilExpiry }) => {
    if (rooms.length === 0) return <EmptyState label="Không có room nào" />;
    return (
        <div className="bg-gray-900/60 rounded-2xl border border-gray-800 overflow-hidden">
            {/* Select All Header */}
            <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-800 bg-black/30">
                <input
                    type="checkbox"
                    checked={rooms.length > 0 && rooms.every(r => selectedIds.has(r.id))}
                    onChange={onToggleSelectAll}
                    className="w-4 h-4 accent-cyan-500"
                />
                <span className="text-xs text-gray-500 font-mono">{rooms.length} rooms</span>
            </div>
            {rooms.map(room => {
                const daysLeft = getDaysUntilExpiry(room.expiresAt);
                const isExpired = daysLeft !== null && daysLeft <= 0;
                const isExpiringSoon = daysLeft !== null && daysLeft > 0 && daysLeft <= 7;
                return (
                    <div key={room.id} className={`border-b border-gray-800/50 last:border-0 transition-colors ${selectedIds.has(room.id) ? 'bg-cyan-900/10' : 'hover:bg-gray-800/30'}`}>
                        <div className="flex items-center gap-3 px-4 py-3">
                            <input
                                type="checkbox"
                                checked={selectedIds.has(room.id)}
                                onChange={() => onToggleSelect(room.id)}
                                className="w-4 h-4 accent-cyan-500 flex-shrink-0"
                            />
                            <button
                                className="flex-1 flex items-center gap-3 text-left"
                                onClick={() => onExpand(expandedId === room.id ? null : room.id)}
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-bold font-mono text-white">{room.id}</span>
                                        <RoundBadge round={room.round} />
                                        {isExpired && <span className="text-xs bg-red-900/50 text-red-400 px-2 py-0.5 rounded font-mono border border-red-800">EXPIRED</span>}
                                        {isExpiringSoon && <span className="text-xs bg-amber-900/50 text-amber-400 px-2 py-0.5 rounded font-mono border border-amber-800">~{daysLeft}d left</span>}
                                    </div>
                                    <div className="text-xs text-gray-500 font-mono mt-0.5 flex gap-3">
                                        <span>Tạo: {formatDate(room.createdAt)}</span>
                                        <span>Hết hạn: {formatDate(room.expiresAt)}</span>
                                        <span>Players: {room.players?.length ?? 0}</span>
                                    </div>
                                </div>
                                {expandedId === room.id ? <ChevronUp size={16} className="text-gray-500 flex-shrink-0" /> : <ChevronDown size={16} className="text-gray-500 flex-shrink-0" />}
                            </button>
                            <button
                                onClick={() => onDelete(room.id)}
                                className="p-2 bg-red-900/30 hover:bg-red-700/40 rounded-lg text-red-400 transition-all flex-shrink-0"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                        {expandedId === room.id && (
                            <div className="px-4 pb-4 pl-11">
                                <div className="bg-black/40 rounded-xl p-4 font-mono text-xs text-gray-400 border border-gray-700 max-h-48 overflow-y-auto">
                                    <div className="text-gray-300 mb-2 font-bold">Players ({room.players?.length ?? 0}):</div>
                                    {(room.players || []).map((p: any, i: number) => (
                                        <div key={i} className="flex gap-3 text-gray-400 py-0.5">
                                            <span className="text-cyan-400">{p.name || '(no name)'}</span>
                                            <span>Score: {p.score ?? 0}</span>
                                            <span className={p.isOnline ? 'text-green-400' : 'text-gray-600'}>
                                                {p.isOnline ? '● online' : '○ offline'}
                                            </span>
                                        </div>
                                    ))}
                                    {(room.players?.length ?? 0) === 0 && <span className="text-gray-600">Không có player nào</span>}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

const HistoryTable: React.FC<{
    history: HistoryDoc[];
    selectedIds: Set<string>;
    expandedId: string | null;
    onToggleSelect: (id: string) => void;
    onToggleSelectAll: () => void;
    onExpand: (id: string | null) => void;
    onDelete: (id: string) => void;
    formatDate: (ts: any) => string;
}> = ({ history, selectedIds, expandedId, onToggleSelect, onToggleSelectAll, onExpand, onDelete, formatDate }) => {
    if (history.length === 0) return <EmptyState label="Không có history nào" />;
    return (
        <div className="bg-gray-900/60 rounded-2xl border border-gray-800 overflow-hidden">
            <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-800 bg-black/30">
                <input
                    type="checkbox"
                    checked={history.length > 0 && history.every(h => selectedIds.has(h.id))}
                    onChange={onToggleSelectAll}
                    className="w-4 h-4 accent-purple-500"
                />
                <span className="text-xs text-gray-500 font-mono">{history.length} records</span>
            </div>
            {history.map(h => (
                <div key={h.id} className={`border-b border-gray-800/50 last:border-0 transition-colors ${selectedIds.has(h.id) ? 'bg-purple-900/10' : 'hover:bg-gray-800/30'}`}>
                    <div className="flex items-center gap-3 px-4 py-3">
                        <input
                            type="checkbox"
                            checked={selectedIds.has(h.id)}
                            onChange={() => onToggleSelect(h.id)}
                            className="w-4 h-4 accent-purple-500 flex-shrink-0"
                        />
                        <button
                            className="flex-1 flex items-center gap-3 text-left"
                            onClick={() => onExpand(expandedId === h.id ? null : h.id)}
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold font-mono text-white text-sm truncate max-w-xs">{h.id}</span>
                                    {h.roomId && <span className="text-xs bg-purple-900/40 text-purple-400 px-2 py-0.5 rounded font-mono border border-purple-800">Room: {h.roomId}</span>}
                                </div>
                                <div className="text-xs text-gray-500 font-mono mt-0.5">
                                    Lưu lúc: {formatDate(h.archivedAt)} · Players: {h.players?.length ?? 0}
                                </div>
                            </div>
                            {expandedId === h.id ? <ChevronUp size={16} className="text-gray-500 flex-shrink-0" /> : <ChevronDown size={16} className="text-gray-500 flex-shrink-0" />}
                        </button>
                        <button
                            onClick={() => onDelete(h.id)}
                            className="p-2 bg-red-900/30 hover:bg-red-700/40 rounded-lg text-red-400 transition-all flex-shrink-0"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                    {expandedId === h.id && (
                        <div className="px-4 pb-4 pl-11">
                            <div className="bg-black/40 rounded-xl p-4 font-mono text-xs text-gray-400 border border-gray-700 max-h-48 overflow-y-auto">
                                <div className="text-gray-300 mb-2 font-bold">Kết quả ({h.players?.length ?? 0} players):</div>
                                {(h.players || [])
                                    .sort((a: any, b: any) => (b.score ?? 0) - (a.score ?? 0))
                                    .map((p: any, i: number) => (
                                        <div key={i} className="flex gap-3 text-gray-400 py-0.5">
                                            <span className="text-yellow-400 font-bold w-6">#{i + 1}</span>
                                            <span className="text-purple-300">{p.name || '(no name)'}</span>
                                            <span className="text-white font-bold">{p.score ?? 0} pts</span>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

const RoundBadge: React.FC<{ round?: string }> = ({ round }) => {
    if (!round) return null;
    const map: Record<string, string> = {
        LOBBY: 'bg-gray-800 text-gray-400',
        ROUND_1: 'bg-blue-900/50 text-blue-400',
        ROUND_2: 'bg-indigo-900/50 text-indigo-400',
        ROUND_3: 'bg-purple-900/50 text-purple-400',
        GAME_OVER: 'bg-green-900/50 text-green-400',
    };
    return (
        <span className={`text-xs px-2 py-0.5 rounded font-mono border ${map[round] || 'bg-gray-800 text-gray-400'} border-current/30`}>
            {round.replace('_', ' ')}
        </span>
    );
};

const EmptyState: React.FC<{ label: string }> = ({ label }) => (
    <div className="flex flex-col items-center justify-center py-20 text-gray-600">
        <Database size={40} className="mb-3 opacity-50" />
        <p className="font-mono text-sm">{label}</p>
    </div>
);

export default AdminPage;
