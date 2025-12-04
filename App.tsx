
import React, { useState, useEffect } from 'react';
import { useGameSync } from './services/gameService';
import TeacherDashboard from './components/TeacherDashboard';
import StudentView from './components/StudentView';
import SpectatorScreen from './components/SpectatorScreen';
import { Users, Monitor, ShieldCheck, Gamepad2, ExternalLink, Trash2, LogIn, Key, PlayCircle, LogOut, AlertTriangle, Copy, Check, Maximize } from 'lucide-react';

const App: React.FC = () => {
  const gameService = useGameSync();
  const { gameState, user, authLoading, roomId, roomError, loginError } = gameService;

  const [classCodeInput, setClassCodeInput] = useState('');
  const [role, setRole] = useState<'SELECT' | 'TEACHER' | 'STUDENT' | 'SCREEN'>('SELECT');
  const [studentId, setStudentId] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');
  const [copied, setCopied] = useState(false);
  const [currentDomain, setCurrentDomain] = useState<string>('');
  const [inIframe, setInIframe] = useState(false);

  // Detect domain and iframe status on mount
  useEffect(() => {
      // Check if in iframe
      try {
          setInIframe(window.self !== window.top);
      } catch (e) {
          setInIframe(true);
      }

      // Try multiple properties to get the domain
      const hostname = window.location.hostname;
      
      if (hostname && hostname !== 'about:blank' && hostname !== '') {
          setCurrentDomain(hostname);
      } else {
          setCurrentDomain("Click 'Open in New Tab' to see domain");
      }
  }, []);

  const handleCopyDomain = () => {
      if (currentDomain && !currentDomain.includes("Open in New Tab")) {
          navigator.clipboard.writeText(currentDomain);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
      }
  };

  const openNewTab = () => {
      window.open(window.location.href, '_blank');
  };

  // --- Step 1: Auth Loading ---
  if (authLoading) {
    return (
        <div className="min-h-screen bg-cyber-dark flex items-center justify-center text-white">
            <div className="animate-pulse">Loading App Data...</div>
        </div>
    );
  }

  // --- Step 2: Login Screen ---
  if (!user) {
    return (
        <div className="min-h-screen bg-cyber-dark flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-slate-800 p-8 rounded-2xl shadow-2xl border border-gray-700 text-center">
                <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500 mb-6">
                    CODING SHOWDOWN
                </h1>
                <p className="text-gray-400 mb-8">Please sign in to access the arena.</p>
                
                {inIframe && (
                    <div className="bg-yellow-900/50 border border-yellow-500 text-yellow-200 p-4 rounded-lg mb-6 text-sm text-left flex flex-col gap-2">
                         <div className="flex items-center gap-2 font-bold">
                             <AlertTriangle size={18} /> Preview Mode Detected
                         </div>
                         <p>Google Login may be blocked inside this preview window.</p>
                         <button 
                            onClick={openNewTab}
                            className="bg-yellow-600 hover:bg-yellow-500 text-black font-bold py-2 px-4 rounded flex items-center justify-center gap-2 mt-2 transition-transform hover:scale-105"
                         >
                             <Maximize size={18} /> Open in New Tab
                         </button>
                    </div>
                )}
                
                {loginError && (
                    <div className="bg-red-900/50 border border-red-500 text-red-200 p-4 rounded-lg mb-6 text-sm text-left flex gap-3 animate-pulse">
                        <AlertTriangle className="flex-shrink-0 text-red-400" />
                        <div className="break-all">
                            <strong>Login Failed:</strong> {loginError}
                        </div>
                    </div>
                )}

                <button 
                    onClick={gameService.login}
                    className="w-full py-4 bg-white hover:bg-gray-200 text-black font-bold rounded-lg flex items-center justify-center gap-3 transition-transform hover:scale-105"
                >
                    <LogIn /> Sign in with Google
                </button>

                {/* DOMAIN HELPER */}
                <div className="mt-8 pt-6 border-t border-gray-700 text-left">
                    <p className="text-xs text-gray-500 uppercase font-bold mb-2">Authorize this domain:</p>
                    <p className="text-xs text-gray-400 mb-2">
                        1. Go to <a href="https://console.firebase.google.com/" target="_blank" className="text-cyan-400 underline">Firebase Console</a> &gt; Auth &gt; Settings &gt; Authorized Domains.<br/>
                        2. Click "Add Domain" and paste the link below:
                    </p>
                    <div className="bg-black p-3 rounded border border-gray-600 font-mono text-xs text-green-400 break-all flex justify-between items-center group relative min-h-[48px]">
                        <span className={currentDomain.includes("Open") ? "text-yellow-500" : ""}>
                            {currentDomain || "Detecting..."}
                        </span>
                        <button 
                            onClick={handleCopyDomain}
                            className="ml-2 p-2 bg-gray-800 hover:bg-gray-700 rounded text-white transition-colors border border-gray-700"
                            title="Copy to clipboard"
                            disabled={currentDomain.includes("Open")}
                        >
                            {copied ? <Check size={14} className="text-green-500"/> : <Copy size={14}/>}
                        </button>
                    </div>
                    {!inIframe && loginError && loginError.includes("unauthorized-domain") && (
                        <p className="text-xs text-yellow-500 mt-2">
                            * Copy the domain above exactly and add it to Firebase.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
  }

  // --- Step 3: Room Selection (Lobby) ---
  if (!roomId) {
      return (
        <div className="min-h-screen bg-cyber-dark flex items-center justify-center p-4">
            <div className="max-w-lg w-full bg-slate-800 p-8 rounded-2xl shadow-2xl border border-gray-700">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-white">Welcome, {user.displayName}</h2>
                        <p className="text-gray-400 text-sm">Select a class session to begin.</p>
                    </div>
                    <button onClick={gameService.logout} className="text-xs text-red-400 hover:text-red-300">Sign Out</button>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-gray-300 mb-2 font-bold text-sm uppercase">Enter Class Code</label>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={classCodeInput}
                                onChange={(e) => setClassCodeInput(e.target.value.toUpperCase())}
                                placeholder="e.g. CLASS-14"
                                className="flex-grow bg-black text-white px-4 py-3 rounded border border-gray-600 focus:border-cyan-500 focus:outline-none font-mono tracking-widest uppercase"
                            />
                        </div>
                        {roomError && <div className="text-red-500 text-sm mt-2">{roomError}</div>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button 
                            onClick={async () => {
                                const success = await gameService.createRoom(classCodeInput);
                                if (success) setRole('TEACHER');
                            }}
                            disabled={!classCodeInput}
                            className="p-4 bg-purple-900/50 border border-purple-500 hover:bg-purple-900 rounded-xl flex flex-col items-center gap-2 text-purple-200 transition-all hover:scale-105 disabled:opacity-50"
                        >
                            <ShieldCheck size={32} />
                            <span className="font-bold">Create/Host</span>
                            <span className="text-xs opacity-70">For Teachers</span>
                        </button>

                        <button 
                            onClick={async () => {
                                const success = await gameService.joinRoom(classCodeInput);
                                if (success) setRole('SELECT');
                            }}
                            disabled={!classCodeInput}
                            className="p-4 bg-cyan-900/50 border border-cyan-500 hover:bg-cyan-900 rounded-xl flex flex-col items-center gap-2 text-cyan-200 transition-all hover:scale-105 disabled:opacity-50"
                        >
                            <PlayCircle size={32} />
                            <span className="font-bold">Join Class</span>
                            <span className="text-xs opacity-70">For Students/Viewers</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
      );
  }

  // --- Step 4: Role Handlers ---
  const handleBackToLobby = () => {
    // Reloading is the safest way to reset all local state hooks when leaving a room entirely
    window.location.reload();
  };

  const handleJoinAsStudent = async () => {
    if (!tempName.trim()) {
        // Default to Google name if empty
        setTempName(user.displayName || "Student");
    }
    const finalName = tempName.trim() || user.displayName || "Student";
    const id = await gameService.joinGame(finalName);
    if (id) {
        setStudentId(id);
        setRole('STUDENT');
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
      />
    );
  }

  // --- Step 5: Join Role Selection (After entering room code) ---
  return (
    <div className="min-h-screen bg-cyber-dark flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-cyber-light rounded-2xl shadow-2xl overflow-hidden border border-gray-700">
        <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-slate-900">
             <div className="flex items-center gap-3">
                 <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded font-mono text-sm border border-green-500/50">
                     ROOM: {roomId}
                 </div>
             </div>
             <button onClick={handleBackToLobby} className="text-gray-400 hover:text-white flex items-center gap-1 text-sm">
                 <LogOut size={14}/> Exit
             </button>
        </div>

        <div className="p-8 grid md:grid-cols-2 gap-8">
            {/* Student Join */}
            <div className="flex flex-col items-center">
                <Gamepad2 size={48} className="text-rose-500 mb-4" />
                <h2 className="text-xl font-bold text-white mb-4">Join as Student</h2>
                <div className="w-full space-y-3">
                    <input 
                        type="text" 
                        placeholder="Your Name" 
                        defaultValue={user.displayName || ""}
                        className="w-full bg-black text-white px-4 py-2 rounded border border-gray-600 focus:border-rose-500 focus:outline-none"
                        onChange={(e) => setTempName(e.target.value)}
                    />
                    <button 
                        onClick={handleJoinAsStudent}
                        className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 rounded transition-colors"
                    >
                        Enter Arena
                    </button>
                </div>
            </div>

            {/* Spectator Join */}
            <div className="flex flex-col items-center border-l border-gray-700 pl-8">
                <Monitor size={48} className="text-cyan-500 mb-4" />
                <h2 className="text-xl font-bold text-white mb-4">Launch Big Screen</h2>
                <p className="text-gray-400 text-center text-sm mb-6">
                    Use this for the main projector display.
                </p>
                <button 
                    onClick={() => setRole('SCREEN')}
                    className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 rounded transition-colors"
                >
                    Launch Spectator View
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default App;
