import React, { useEffect, useRef, useState } from 'react';
import { GameState, GameRound, Player } from '../types';
import { Trophy, Timer, Code2, AlertCircle, Zap, User, Star, LogOut, Play, Download, Check } from 'lucide-react';
import { SOUND_EFFECTS } from '../config/assets';

interface Props {
  gameState: GameState;
  onLeave: () => void;
}

// Add React namespace prefix fix
const Fireworks: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        const setSize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
        setSize();
        window.addEventListener('resize', setSize);
        let particles: any[] = [];
        class Particle {
            x: number; y: number; color: string; velocity: { x: number; y: number }; alpha: number; decay: number;
            constructor(x: number, y: number, color: string) {
                this.x = x; this.y = y; this.color = color;
                const angle = Math.random() * Math.PI * 2; const speed = Math.random() * 5 + 2;
                this.velocity = { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed };
                this.alpha = 1; this.decay = Math.random() * 0.015 + 0.005;
            }
            draw() {
                if (!ctx) return; ctx.save(); ctx.globalAlpha = this.alpha; ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(this.x, this.y, 3, 0, Math.PI * 2); ctx.fill(); ctx.restore();
            }
            update() { this.x += this.velocity.x; this.y += this.velocity.y; this.velocity.y += 0.05; this.alpha -= this.decay; }
        }
        const createFirework = () => {
             const x = Math.random() * canvas.width; const y = Math.random() * canvas.height / 2;
             const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff', '#ff00ff'];
             const color = colors[Math.floor(Math.random() * colors.length)];
             for (let i = 0; i < 50; i++) particles.push(new Particle(x, y, color));
        };
        const interval = setInterval(createFirework, 800);
        let animationFrameId: number;
        const animate = () => {
            animationFrameId = requestAnimationFrame(animate); ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach((p, index) => { p.update(); p.draw(); if (p.alpha <= 0) particles.splice(index, 1); });
        };
        animate();
        return () => { clearInterval(interval); cancelAnimationFrame(animationFrameId); window.removeEventListener('resize', setSize); };
    }, []);
    return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50" />;
};

// Add React namespace prefix fix
const SpectatorScreen: React.FC<Props> = ({ gameState, onLeave }) => {
    const [, setTick] = useState(0);
    const prevRound = useRef<GameRound>(GameRound.LOBBY);
    const prevBuzzedCount = useRef(0);
    const prevScores = useRef<Record<string, number>>({});
    const lastPlayedSecond = useRef<number | null>(null);
    
    const playSound = (type: keyof typeof SOUND_EFFECTS, volume = 0.9) => {
        try {
            const audio = new Audio(SOUND_EFFECTS[type]);
            audio.volume = volume;
            audio.play().catch(() => {});
        } catch (e) {
            console.warn("Sound play error", e);
        }
    };

    // LOGIC ÂM THANH ĐẾM NGƯỢC (ĐÃ TỐI ƯU)
    useEffect(() => {
        if (!gameState.timerEndTime) {
            lastPlayedSecond.current = null;
            return;
        }

        const interval = setInterval(() => {
            const now = Date.now();
            const timeLeft = Math.max(0, Math.ceil((gameState.timerEndTime! - now) / 1000));
            
            // Chỉ phát âm thanh khi giây thay đổi và nằm trong 10 giây cuối
            if (timeLeft <= 10 && timeLeft > 0 && timeLeft !== lastPlayedSecond.current) {
                lastPlayedSecond.current = timeLeft;
                playSound('TICK', 0.5); // Giảm âm lượng một chút cho tiếng tick
            }
            
            // Phát âm thanh báo hết giờ
            if (timeLeft === 0 && lastPlayedSecond.current !== 0) {
                lastPlayedSecond.current = 0;
                playSound('WRONG'); 
            }
            
            setTick(t => t + 1);
        }, 100); // Kiểm tra mỗi 100ms để đảm bảo độ chính xác
        
        return () => clearInterval(interval);
    }, [gameState.timerEndTime]);

    useEffect(() => {
        if (gameState.round !== prevRound.current) {
            if (gameState.round !== GameRound.LOBBY) playSound('ROUND_START');
            prevRound.current = gameState.round;
        }
    }, [gameState.round]);

    useEffect(() => {
        const currentBuzzedCount = gameState.players.filter(p => p.buzzedAt).length;
        if (currentBuzzedCount > prevBuzzedCount.current) playSound('BUZZ');
        prevBuzzedCount.current = currentBuzzedCount;
    }, [gameState.players]);

    useEffect(() => {
        gameState.players.forEach(p => {
            const oldScore = prevScores.current[p.id] ?? 0;
            if (p.score > oldScore) playSound('SCORE_UP');
            else if (p.score < oldScore) playSound('SCORE_DOWN');
            prevScores.current[p.id] = p.score;
        });
    }, [gameState.players]);

    const sortedPlayers = [...gameState.players].sort((a, b) => b.score - a.score);
    const leader = sortedPlayers[0];
    const isRound3 = gameState.round === GameRound.ROUND_3;
    const isRound1 = gameState.round === GameRound.ROUND_1;
    const activePlayerId = isRound3 ? gameState.round3TurnPlayerId : (isRound1 ? gameState.round1TurnPlayerId : null);
    const activePlayerName = activePlayerId ? gameState.players.find(p => p.id === activePlayerId)?.name : null;

    return (
        <div className="min-h-screen bg-cyber-dark text-white p-6 flex flex-col relative overflow-hidden">
            <div className="flex justify-between items-center z-10 mb-8 border-b border-gray-700 pb-4">
                 <div>
                     <h1 className="text-4xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
                         CODING SHOWDOWN
                     </h1>
                     <div className="text-xl text-gray-400 font-mono flex items-center gap-2">
                         <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse"></span>
                         LIVE SPECTATOR
                     </div>
                 </div>
                 <div className="flex items-center gap-6">
                     <div className="text-right">
                         <div className="text-xs text-gray-400 uppercase tracking-widest">Leading</div>
                         <div className="text-2xl font-bold text-yellow-400 flex items-center justify-end gap-2">
                             <Trophy size={20} /> {leader ? leader.name : "-"}
                         </div>
                     </div>
                     <div className="bg-slate-800 px-6 py-2 rounded-xl border border-gray-600 shadow-lg">
                         <div className="text-[10px] text-gray-400 uppercase font-black">Current Round</div>
                         <div className="text-xl font-black text-cyber-primary">
                             {gameState.round === GameRound.LOBBY ? 'LOBBY' : 
                              gameState.round === GameRound.ROUND_1 ? 'REFLEX' :
                              gameState.round === GameRound.ROUND_2 ? 'OBSTACLE' : 
                              gameState.round === GameRound.ROUND_3 ? 'FINISH LINE' : 'GAME OVER'}
                         </div>
                     </div>
                     <button onClick={onLeave} className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 text-gray-400 transition-colors"><LogOut size={20} /></button>
                 </div>
            </div>

            <div className="flex-grow flex items-center justify-center z-10 relative">
                {gameState.round === GameRound.GAME_OVER ? (
                    <div className="text-center w-full relative">
                        <Fireworks />
                        <h2 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-yellow-600 mb-12 drop-shadow-2xl">PODIUM</h2>
                        <div className="flex justify-center items-end gap-8 h-96">
                             {sortedPlayers[1] && <div className="flex flex-col items-center w-64 animate-in slide-in-from-bottom duration-1000 delay-200"><div className="mb-4 text-center"><div className="text-3xl font-bold">{sortedPlayers[1].name}</div></div><div className="h-48 w-full bg-slate-600 rounded-t-lg border-t-4 border-gray-400 flex items-center justify-center text-6xl font-black">2</div></div>}
                             {sortedPlayers[0] && <div className="flex flex-col items-center w-80 z-20 animate-in slide-in-from-bottom duration-1000"><div className="mb-4 text-center"><div className="text-5xl font-bold text-yellow-300">{sortedPlayers[0].name}</div></div><div className="h-64 w-full bg-yellow-600 rounded-t-lg border-t-4 border-yellow-300 flex items-center justify-center text-8xl font-black">1</div></div>}
                             {sortedPlayers[2] && <div className="flex flex-col items-center w-64 animate-in slide-in-from-bottom duration-1000 delay-400"><div className="mb-4 text-center"><div className="text-3xl font-bold">{sortedPlayers[2].name}</div></div><div className="h-32 w-full bg-amber-900 rounded-t-lg border-t-4 border-amber-700 flex items-center justify-center text-6xl font-black">3</div></div>}
                        </div>
                    </div>
                ) : (
                    <div className="w-full max-w-7xl grid grid-cols-12 gap-8 h-[80vh]">
                        <div className="col-span-8 bg-slate-900/90 rounded-3xl border-2 border-cyber-primary shadow-2xl p-12 flex flex-col relative overflow-hidden">
                             {gameState.timerEndTime && (
                                 <div className="absolute top-8 right-8 flex items-center gap-3">
                                     <Timer size={40} className="text-red-500 animate-pulse" />
                                     <span className="text-6xl font-mono font-black text-red-500">
                                        {Math.max(0, Math.ceil((gameState.timerEndTime - Date.now()) / 1000))}
                                     </span>
                                 </div>
                             )}

                             {gameState.activeQuestion ? (
                                 <div className="flex-grow flex flex-col justify-center animate-in zoom-in-95 duration-300">
                                     <div className="text-2xl text-cyber-secondary font-black mb-6 uppercase tracking-widest flex items-center gap-2">
                                         <Code2 size={28}/> 
                                         {gameState.activeQuestion.category || gameState.activeQuestion.difficulty || "CHALLENGE"} 
                                         <span className="bg-slate-700 text-white px-3 py-1 rounded text-sm ml-2">{gameState.activeQuestion.points} PTS</span>
                                     </div>
                                     <h2 className="text-6xl font-bold leading-tight mb-8 drop-shadow-lg whitespace-pre-wrap">
                                         {gameState.activeQuestion.content}
                                     </h2>
                                     {gameState.activeQuestion.codeSnippet && (
                                         <pre className="bg-black/60 p-8 rounded-2xl border border-gray-700 text-green-400 font-mono text-3xl overflow-x-auto shadow-inner whitespace-pre-wrap mb-4">
                                             {gameState.activeQuestion.codeSnippet}
                                         </pre>
                                     )}
                                     
                                     {gameState.showAnswer && gameState.activeQuestion.answer && (
                                         <div className="mt-4 bg-green-900/40 border-2 border-green-500 p-8 rounded-2xl animate-in slide-in-from-top-4 duration-500">
                                             <div className="text-green-400 text-sm font-black uppercase mb-3 flex items-center gap-2 tracking-tighter">
                                                 <Check size={20}/> Correct Answer
                                             </div>
                                             <div className="text-5xl font-black text-white">{gameState.activeQuestion.answer}</div>
                                         </div>
                                     )}

                                     {activePlayerName && (
                                         <div className="mt-auto p-6 bg-blue-900/20 border border-blue-500/50 rounded-2xl flex items-center gap-5">
                                             <div className="relative">
                                                 <User size={40} className="text-blue-400" />
                                                 <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping"></div>
                                             </div>
                                             <div className="text-3xl">
                                                 Current Turn: <span className="font-black text-blue-400 text-4xl">{activePlayerName}</span>
                                             </div>
                                         </div>
                                     )}
                                 </div>
                             ) : (
                                 <div className="flex-grow flex flex-col items-center justify-center opacity-20">
                                     <Gamepad2 size={120} className="mb-6"/>
                                     <div className="text-3xl font-black tracking-widest uppercase">Ready for Next Challenge</div>
                                 </div>
                             )}
                        </div>

                        <div className="col-span-4 bg-slate-800/80 rounded-3xl border border-gray-700 p-8 overflow-hidden flex flex-col shadow-xl">
                             <h3 className="text-xl font-black text-gray-500 mb-8 flex items-center gap-3 tracking-widest uppercase">
                                 <Star className="text-yellow-500" fill="currentColor" /> Live Rankings
                             </h3>
                             <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
                                 {sortedPlayers.map((p, index) => (
                                     <div key={p.id} className={`p-5 rounded-2xl flex items-center justify-between border-2 transition-all duration-500 ${index === 0 ? 'bg-yellow-900/30 border-yellow-500 scale-105 shadow-yellow-500/10' : 'bg-slate-700/50 border-transparent'}`}>
                                         <div className="flex items-center gap-4">
                                             <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-lg ${index === 0 ? 'bg-yellow-500 text-black' : 'bg-gray-600 text-white'}`}>
                                                 {index + 1}
                                             </div>
                                             <div>
                                                 <div className="font-bold text-xl leading-none mb-1 truncate max-w-[120px]">{p.name}</div>
                                                 {activePlayerId === p.id && <span className="text-xs text-blue-400 font-black animate-pulse uppercase tracking-tighter">● Answering</span>}
                                             </div>
                                         </div>
                                         <div className="text-3xl font-mono font-black text-cyber-primary">{p.score}</div>
                                     </div>
                                 ))}
                             </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const Gamepad2 = ({ size, className }: { size: number, className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="6" x2="10" y1="12" y2="12"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="15" x2="15.01" y1="13" y2="13"/><line x1="18" x2="18.01" y1="11" y2="11"/><rect width="20" height="12" x="2" y="6" rx="2"/></svg>
);

export default SpectatorScreen;