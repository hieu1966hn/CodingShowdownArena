
import React, { useState, useEffect } from 'react';
import { useGameSync } from './hooks/useGameSync';
import TeacherDashboard from './components/TeacherDashboard';
import StudentView from './components/StudentView';
import SpectatorScreen from './components/SpectatorScreen';
import { Users, Monitor, ShieldCheck, Gamepad2, ExternalLink, Trash2, LogIn, Key, PlayCircle, LogOut, AlertTriangle, Copy, Check, Maximize, User, GraduationCap } from 'lucide-react';

const App: React.FC = () => {
    const gameService = useGameSync();
    const { gameState, user, authLoading, roomId, roomError, loginError } = gameService;

    const [classCodeInput, setClassCodeInput] = useState('');
    const [role, setRole] = useState<'SELECT' | 'TEACHER' | 'STUDENT' | 'SCREEN'>('SELECT');
    const [studentId, setStudentId] = useState<string | null>(null);
    const [tempName, setTempName] = useState('');
    const [inIframe, setInIframe] = useState(false);

    // UX State
    const [isTeacherMode, setIsTeacherMode] = useState(false);
    // Default: Teacher options are HIDDEN. Only shown if ?mode=Teacher
    const [allowTeacherAccess, setAllowTeacherAccess] = useState(false);

    // Detect iframe and URL params on mount
    useEffect(() => {
        // Check if in iframe
        try {
            setInIframe(window.self !== window.top);
        } catch (e) {
            setInIframe(true);
        }

        // Check URL for mode=Teacher (Case insensitive)
        const params = new URLSearchParams(window.location.search);
        const mode = params.get('mode');
        if (mode && mode.toLowerCase() === 'teacher') {
            setAllowTeacherAccess(true);
        }
    }, []);

    const openNewTab = () => {
        window.open(window.location.href, '_blank');
    };

    // --- Step 1: Auth Loading ---
    if (authLoading) {
        return (
            <div className="min-h-screen bg-cyber-dark flex flex-col items-center justify-center text-white space-y-4">
                <div className="w-16 h-16 border-4 border-cyber-accent border-t-transparent rounded-full animate-spin"></div>
                <div className="text-xl font-mono text-cyber-accent animate-pulse">INITIALIZING SYSTEM...</div>
            </div>
        );
    }

    // --- Step 2: Login Screen ---
    if (!user) {
        return (
            <div className="min-h-screen bg-cyber-dark flex items-center justify-center p-4 relative overflow-hidden">
                {/* Background Effects */}
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyber-accent rounded-full blur-3xl mix-blend-screen animate-pulse"></div>
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyber-neon rounded-full blur-3xl mix-blend-screen animate-pulse" style={{ animationDelay: '2s' }}></div>
                </div>

                <div className="max-w-md w-full bg-cyber-light/80 backdrop-blur-xl p-8 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.2)] border border-white/10 text-center relative z-10">
                    <div className="mb-8">
                        <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyber-accent to-cyber-neon mb-2 tracking-tighter filter drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]">
                            CODING<br />SHOWDOWN
                        </h1>
                        <div className="h-1 w-32 bg-gradient-to-r from-cyber-accent to-cyber-neon mx-auto rounded-full"></div>
                    </div>

                    {inIframe && (
                        <div className="bg-blue-900/40 border border-blue-500/50 text-blue-200 p-4 rounded-lg mb-6 text-sm text-left flex flex-col gap-2 backdrop-blur-sm">
                            <div className="flex items-center gap-2 font-bold text-cyber-accent">
                                <Maximize size={18} /> Recommended
                            </div>
                            <p>For the best experience, open the Arena in a new tab.</p>
                            <button
                                onClick={openNewTab}
                                className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded flex items-center justify-center gap-2 mt-2 transition-all hover:scale-105 shadow-lg shadow-blue-900/50"
                            >
                                Open in New Tab
                            </button>
                        </div>
                    )}

                    {loginError && (
                        <div className="bg-red-900/60 border border-red-500 text-white p-4 rounded-lg mb-6 text-sm text-left animate-bounce-subtle backdrop-blur-md">
                            <div className="flex gap-2 items-start mb-2">
                                <AlertTriangle className="flex-shrink-0 text-red-400" size={20} />
                                <strong className="text-lg">Access Denied</strong>
                            </div>
                            <div className="break-words mb-2 opacity-90 text-xs font-mono bg-black/50 p-2 rounded border border-red-500/30">
                                {loginError}
                            </div>
                        </div>
                    )}

                    <p className="text-gray-400 mb-8 font-mono text-sm">AUTHENTICATION REQUIRED</p>

                    <div className="space-y-4 mb-4">
                        <button
                            onClick={gameService.login}
                            className="w-full py-4 bg-white hover:bg-gray-100 text-black font-bold rounded-xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-95 shadow-xl"
                        >
                            <LogIn className="text-cyber-dark" />
                            <span>Sign in with Google</span>
                        </button>

                        <div className="relative flex py-2 items-center">
                            <div className="flex-grow border-t border-gray-700"></div>
                            <span className="flex-shrink-0 mx-4 text-gray-600 text-xs font-mono">OR CONTINUE AS</span>
                            <div className="flex-grow border-t border-gray-700"></div>
                        </div>

                        <button
                            onClick={gameService.loginAnonymous}
                            className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white font-bold rounded-xl flex items-center justify-center gap-3 transition-all hover:scale-[1.02] border border-gray-700 hover:border-gray-500"
                        >
                            <User size={20} /> Guest Access
                        </button>
                    </div>
                    <p className="text-[10px] text-gray-600 font-mono">SYSTEM V.2.0.26</p>
                </div>
            </div>
        );
    }

    // --- Step 3: Room Selection (Lobby) ---
    if (!roomId) {
        return (
            <div className="min-h-screen bg-cyber-dark flex items-center justify-center p-4 relative">
                <div className="max-w-lg w-full bg-cyber-light/90 backdrop-blur-xl p-8 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.5)] border border-gray-700">
                    <div className="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
                        <div>
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                Welcome, <span className="text-cyber-accent">{user.isAnonymous ? 'Guest' : user.displayName}</span>
                            </h2>
                            <p className="text-gray-400 text-xs font-mono mt-1">NO ACTIVE SESSION</p>
                        </div>
                        <button onClick={gameService.logout} className="px-3 py-1 bg-red-900/30 text-red-400 border border-red-900 rounded hover:bg-red-900/50 text-xs transition-colors">
                            DISCONNECT
                        </button>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-gray-400 mb-2 font-bold text-xs font-mono tracking-widest uppercase ml-1">Input Access Code</label>
                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyber-accent to-cyber-neon rounded-lg blur opacity-30 group-hover:opacity-100 transition duration-200"></div>
                                <input
                                    type="text"
                                    value={classCodeInput}
                                    onChange={(e) => setClassCodeInput(e.target.value.toUpperCase())}
                                    placeholder="CLASS-XX"
                                    className="relative w-full bg-black text-white px-6 py-4 rounded-lg border border-gray-700 focus:border-cyber-accent focus:outline-none font-mono text-xl tracking-[0.2em] text-center uppercase placeholder-gray-800"
                                />
                            </div>
                            {roomError && <div className="text-red-500 text-sm mt-3 font-mono text-center bg-red-900/20 p-2 rounded border border-red-900/50">{roomError}</div>}
                        </div>

                        <div className="grid grid-cols-1 gap-4 pt-4">
                            {isTeacherMode ? (
                                <button
                                    onClick={async () => {
                                        const success = await gameService.createRoom(classCodeInput);
                                        if (success) setRole('TEACHER');
                                    }}
                                    disabled={!classCodeInput}
                                    className="w-full p-4 bg-gradient-to-br from-purple-900/80 to-indigo-900/80 border border-purple-500/50 hover:border-purple-400 rounded-xl flex flex-row items-center justify-between group transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                                >
                                    <div className="flex flex-col items-start text-left">
                                        <span className="font-bold text-white group-hover:text-purple-300">HOST SESSION</span>
                                        <span className="text-xs text-purple-400">Manage Game & Questions</span>
                                    </div>
                                    <ShieldCheck size={28} className="text-purple-500 group-hover:text-purple-300 transition-colors" />
                                </button>
                            ) : (
                                <button
                                    onClick={async () => {
                                        const success = await gameService.joinRoom(classCodeInput);
                                        if (success) setRole('SELECT');
                                    }}
                                    disabled={!classCodeInput}
                                    className="w-full p-4 bg-gradient-to-br from-cyan-900/80 to-blue-900/80 border border-cyan-500/50 hover:border-cyan-400 rounded-xl flex flex-row items-center justify-between group transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                                >
                                    <div className="flex flex-col items-start text-left">
                                        <span className="font-bold text-white group-hover:text-cyan-300">JOIN CLASS</span>
                                        <span className="text-xs text-cyan-400">Student & Spectator Access</span>
                                    </div>
                                    <PlayCircle size={28} className="text-cyan-500 group-hover:text-cyan-300 transition-colors" />
                                </button>
                            )}

                            {allowTeacherAccess && (
                                <button
                                    onClick={() => setIsTeacherMode(!isTeacherMode)}
                                    className="text-[10px] text-gray-600 hover:text-gray-400 uppercase tracking-widest text-center mt-2 font-mono"
                                >
                                    {isTeacherMode ? "[ Switch to Student View ]" : "[ Teacher Access ]"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- Step 4: Role Handlers ---
    const handleBackToLobby = () => {
        window.location.reload();
    };

    const handleJoinAsStudent = async () => {
        if (!tempName.trim()) {
            setTempName(user.displayName || "Student");
        }
        const finalName = tempName.trim() || user.displayName || "Student";
        try {
            const id = await gameService.joinGame(finalName);
            if (id) {
                setStudentId(id);
                setRole('STUDENT');
            }
        } catch (e: any) {
            if (e.message === 'GAME_LOCKED') {
                alert("❌ PHÒNG CHƠI ĐÃ KHÓA!\nGiáo viên đã bắt đầu trò chơi. Bạn không thể tham gia lúc này.");
            } else if (e.message === 'GAME_OVER') {
                alert("❌ CUỘC THI ĐÃ KẾT THÚC!\nVui lòng chọn chế độ 'LAUNCH DISPLAY' để xem tổng kết.");
            } else {
                console.error("Join Failed:", e);
                alert("Lỗi khi tham gia phòng: " + e.message);
            }
        }
    };

    if (role === 'TEACHER') {
        return <TeacherDashboard gameState={gameState} actions={gameService} onLeave={handleBackToLobby} />;
    }

    if (role === 'SCREEN') {
        return <SpectatorScreen gameState={gameState} onLeave={handleBackToLobby} />;
    }

    if (role === 'STUDENT' && studentId) {
        return (
            <StudentView
                gameState={gameState}
                playerId={studentId}
                onBuzz={() => gameService.buzz(studentId)}
                onSubmitRound2={(code) => gameService.submitRound2(studentId, code)}
                onSetRound3Pack={(pack) => gameService.setRound3Pack(studentId, pack)}
                onLeave={handleBackToLobby}
                onSubmitQuizAnswer={(answer) => gameService.submitQuizAnswer(studentId, answer)}
            />
        );
    }

    // --- Step 5: Join Role Selection (After entering room code) ---
    return (
        <div className="min-h-screen bg-cyber-dark flex items-center justify-center p-4">
            <div className="max-w-2xl w-full bg-cyber-light rounded-2xl shadow-2xl overflow-hidden border border-gray-700 relative">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-black/40">
                    <div className="flex items-center gap-3">
                        <div className="bg-cyber-accent/10 text-cyber-accent px-3 py-1 rounded font-mono text-sm border border-cyber-accent/50 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-cyber-accent animate-pulse"></div>
                            ROOM: <span className="font-bold">{roomId}</span>
                        </div>
                    </div>
                    <button onClick={handleBackToLobby} className="text-gray-500 hover:text-white flex items-center gap-1 text-xs uppercase tracking-wider font-bold transition-colors">
                        <LogOut size={14} /> Exit
                    </button>
                </div>

                <div className="p-8 grid md:grid-cols-2 gap-8 relative z-10">
                    {/* Student Join */}
                    <div className="flex flex-col items-center group">
                        <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-rose-500/20 transition-colors border border-rose-500/30">
                            <Gamepad2 size={40} className="text-rose-500" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">Student</h2>
                        <p className="text-gray-500 text-center text-xs mb-6 h-8">Join the arena and compete.</p>

                        <div className="w-full space-y-3">
                            <input
                                type="text"
                                placeholder="ENTER YOUR NAME"
                                defaultValue={user.displayName || ""}
                                className="w-full bg-black text-white px-4 py-3 rounded-lg border border-gray-700 focus:border-rose-500 focus:outline-none text-center font-bold placeholder-gray-700"
                                onChange={(e) => setTempName(e.target.value)}
                            />
                            <button
                                onClick={handleJoinAsStudent}
                                className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 rounded-lg transition-all hover:scale-105 shadow-lg shadow-rose-900/40"
                            >
                                ENTER ARENA
                            </button>
                        </div>
                    </div>

                    {/* Spectator Join */}
                    <div className="flex flex-col items-center border-l border-gray-700 pl-8 group">
                        <div className="w-20 h-20 bg-cyan-500/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-cyan-500/20 transition-colors border border-cyan-500/30">
                            <Monitor size={40} className="text-cyan-500" />
                        </div>
                        <h2 className="text-xl font-bold text-white mb-2">Spectator</h2>
                        <p className="text-gray-500 text-center text-xs mb-6 h-8">Launch the big screen display.</p>

                        <div className="w-full space-y-3 mt-auto">
                            <div className="h-[50px] flex items-center justify-center opacity-50 text-xs text-gray-600 font-mono">
                                DISPLAY MODE
                            </div>
                            <button
                                onClick={() => setRole('SCREEN')}
                                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-lg transition-all hover:scale-105 shadow-lg shadow-cyan-900/40"
                            >
                                LAUNCH DISPLAY
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default App;
