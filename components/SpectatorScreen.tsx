
import React, { useEffect, useRef, useState } from 'react';
import { GameState, GameRound, Player } from '../types';
import { Trophy, Timer, Code2, AlertCircle, Zap, User, Star, LogOut, Play, Download, Check } from 'lucide-react';
import { SOUND_EFFECTS } from '../config/assets';

interface Props {
  gameState: GameState;
  onLeave: () => void;
}

// Fireworks Component
const Fireworks: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const setSize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        setSize();
        window.addEventListener('resize', setSize);

        let particles: Particle[] = [];
        
        class Particle {
            x: number;
            y: number;
            color: string;
            velocity: { x: number; y: number };
            alpha: number;
            decay: number;

            constructor(x: number, y: number, color: string) {
                this.x = x;
                this.y = y;
                this.color = color;
                const angle = Math.random() * Math.PI * 2;
                const speed = Math.random() * 5 + 2;
                this.velocity = {
                    x: Math.cos(angle) * speed,
                    y: Math.sin(angle) * speed
                };
                this.alpha = 1;
                this.decay = Math.random() * 0.015 + 0.005;
            }

            draw() {
                if (!ctx) return;
                ctx.save();
                ctx.globalAlpha = this.alpha;
                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            update() {
                this.x += this.velocity.x;
                this.y += this.velocity.y;
                this.velocity.y += 0.05; // gravity
                this.alpha -= this.decay;
            }
        }

        const createFirework = () => {
             const x = Math.random() * canvas.width;
             const y = Math.random() * canvas.height / 2;
             const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#00ffff', '#ff00ff'];
             const color = colors[Math.floor(Math.random() * colors.length)];
             for (let i = 0; i < 50; i++) {
                 particles.push(new Particle(x, y, color));
             }
        };

        const interval = setInterval(createFirework, 800);

        let animationFrameId: number;
        const animate = () => {
            animationFrameId = requestAnimationFrame(animate);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach((p, index) => {
                p.update();
                p.draw();
                if (p.alpha <= 0) particles.splice(index, 1);
            });
        };

        animate();

        return () => {
            clearInterval(interval);
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', setSize);
        };
    }, []);

    return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50" />;
};

const SpectatorScreen: React.FC<Props> = ({ gameState, onLeave }) => {
    const [, setTick] = useState(0);
    
    // Play tick sound logic
    useEffect(() => {
        if (gameState.timerEndTime) {
            const interval = setInterval(() => {
                const now = Date.now();
                const timeLeft = Math.ceil((gameState.timerEndTime! - now) / 1000);
                if (timeLeft > 0 && timeLeft <= 5) {
                    const audio = new Audio(SOUND_EFFECTS.TICK);
                    audio.volume = 0.3;
                    audio.play().catch(() => {});
                }
                setTick(t => t + 1);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [gameState.timerEndTime]);

    const sortedPlayers = [...gameState.players].sort((a, b) => b.score - a.score);
    const leader = sortedPlayers[0];

    const isRound3 = gameState.round === GameRound.ROUND_3;
    const isRound1 = gameState.round === GameRound.ROUND_1;

    const activePlayerId = isRound3 ? gameState.round3TurnPlayerId : (isRound1 ? gameState.round1TurnPlayerId : null);
    const activePlayerName = activePlayerId ? gameState.players.find(p => p.id === activePlayerId)?.name : null;
    const viewingPlayer = gameState.viewingPlayerId ? gameState.players.find(p => p.id === gameState.viewingPlayerId) : null;

    const handleDownloadCSV = () => {
        const headers = ["Rank", "Name", "Total Score", "Round 2 Time (s)", "Round 3 Correct"];
        const rows = sortedPlayers.map((p, i) => {
            const r3Correct = p.round3Pack.filter(item => item.status === 'CORRECT').length;
            return [
                i + 1,
                `"${p.name}"`, 
                p.score,
                p.submittedRound2 && p.round2Time ? p.round2Time.toFixed(2) : "N/A",
                `${r3Correct}/3`
            ].join(",");
        });

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `CodingShowdown_Results_${gameState.roomId || 'Session'}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

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
                         <div className="text-sm text-gray-400">CURRENT LEADER</div>
                         <div className="text-2xl font-bold text-yellow-400 flex items-center justify-end gap-2">
                             <Trophy size={20} /> {leader ? leader.name : "-"}
                         </div>
                     </div>
                     <div className="bg-slate-800 px-6 py-2 rounded-lg border border-gray-600">
                         <div className="text-xs text-gray-400 uppercase">Current Round</div>
                         <div className="text-xl font-bold text-cyber-primary">
                             {gameState.round === GameRound.LOBBY ? 'LOBBY' : 
                              gameState.round === GameRound.ROUND_1 ? 'REFLEX' :
                              gameState.round === GameRound.ROUND_2 ? 'OBSTACLE' : 
                              gameState.round === GameRound.ROUND_3 ? 'FINISH LINE' : 'GAME OVER'}
                         </div>
                     </div>
                     <button onClick={onLeave} className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
                         <LogOut size={20} />
                     </button>
                 </div>
            </div>

            <div className="flex-grow flex items-center justify-center z-10 relative">
                
                {gameState.round === GameRound.LOBBY && (
                    <div className="w-full max-w-6xl text-center">
                         <h2 className="text-6xl font-black text-white mb-12 animate-pulse">WAITING FOR PLAYERS...</h2>
                         <div className="grid grid-cols-4 gap-8">
                             {gameState.players.map((p, i) => (
                                 <div key={p.id} className="bg-slate-800/80 backdrop-blur border-2 border-cyber-primary rounded-xl p-6 flex flex-col items-center transform transition-all hover:scale-110">
                                     <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-3xl font-bold text-black mb-4 shadow-[0_0_20px_rgba(6,182,212,0.5)]">
                                         {p.name.charAt(0).toUpperCase()}
                                     </div>
                                     <div className="text-2xl font-bold">{p.name}</div>
                                     <div className="text-green-400 text-sm font-mono mt-2">CONNECTED</div>
                                 </div>
                             ))}
                         </div>
                    </div>
                )}

                {gameState.round === GameRound.GAME_OVER && (
                    <div className="text-center w-full relative">
                        <Fireworks />
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="mb-6 relative animate-[bounce_2s_infinite]">
                                <div className="absolute inset-0 bg-yellow-500 blur-3xl opacity-30 rounded-full"></div>
                                <Trophy size={100} className="text-yellow-400 relative z-10 drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]" />
                            </div>

                            <h2 className="text-7xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-yellow-600 mb-6 drop-shadow-2xl tracking-tight">
                                WINNERS PODIUM
                            </h2>

                            <button 
                                onClick={handleDownloadCSV}
                                className="mb-12 flex items-center gap-2 px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-full border border-gray-600 transition-all hover:scale-105 group"
                            >
                                <Download size={20} className="text-cyan-400 group-hover:text-white" />
                                <span className="text-gray-300 group-hover:text-white font-bold">Download Results (CSV)</span>
                            </button>
                            
                            <div className="flex justify-center items-end gap-8 h-96">
                                {sortedPlayers[1] && (
                                    <div className="flex flex-col items-center w-64 animate-[slideUp_1s_ease-out_0.2s_backwards]">
                                        <div className="mb-4 text-center">
                                            <div className="text-3xl font-bold text-gray-300">{sortedPlayers[1].name}</div>
                                            <div className="text-xl text-gray-400">{sortedPlayers[1].score} pts</div>
                                        </div>
                                        <div className="h-48 w-full bg-slate-600 rounded-t-lg border-t-4 border-gray-400 flex items-center justify-center text-6xl font-black text-gray-400 shadow-2xl relative">
                                            2
                                            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent"></div>
                                        </div>
                                    </div>
                                )}

                                {sortedPlayers[0] && (
                                    <div className="flex flex-col items-center w-80 z-20 animate-[slideUp_1s_ease-out]">
                                        <div className="mb-4 text-center">
                                            <div className="text-5xl font-bold text-yellow-300">{sortedPlayers[0].name}</div>
                                            <div className="text-2xl text-yellow-500 font-bold">{sortedPlayers[0].score} pts</div>
                                        </div>
                                        <div className="h-64 w-full bg-yellow-600 rounded-t-lg border-t-4 border-yellow-300 flex items-center justify-center text-8xl font-black text-yellow-100 shadow-[0_0_50px_rgba(234,179,8,0.5)] relative">
                                            1
                                            <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent"></div>
                                        </div>
                                    </div>
                                )}

                                {sortedPlayers[2] && (
                                    <div className="flex flex-col items-center w-64 animate-[slideUp_1s_ease-out_0.4s_backwards]">
                                        <div className="mb-4 text-center">
                                            <div className="text-3xl font-bold text-amber-700">{sortedPlayers[2].name}</div>
                                            <div className="text-xl text-amber-800">{sortedPlayers[2].score} pts</div>
                                        </div>
                                        <div className="h-32 w-full bg-amber-900 rounded-t-lg border-t-4 border-amber-700 flex items-center justify-center text-6xl font-black text-amber-700 shadow-2xl relative">
                                            3
                                            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent"></div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {gameState.round !== GameRound.LOBBY && gameState.round !== GameRound.GAME_OVER && (
                    <div className="w-full max-w-7xl grid grid-cols-12 gap-8 h-[80vh]">
                        <div className="col-span-8 bg-slate-900/90 rounded-3xl border-2 border-cyber-primary shadow-[0_0_40px_rgba(6,182,212,0.2)] p-12 flex flex-col relative overflow-hidden">
                             <div className="absolute top-0 right-0 w-64 h-64 bg-cyber-primary/10 rounded-full filter blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                             
                             {gameState.message && (
                                 <div className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-8 backdrop-blur-sm animate-[fadeIn_0.3s]">
                                     <h2 className="text-6xl font-black text-white text-center leading-tight drop-shadow-xl border-4 border-white p-12 rounded-xl bg-cyber-primary/20">
                                        {gameState.message}
                                     </h2>
                                 </div>
                             )}

                             {gameState.timerEndTime && (
                                 <div className="absolute top-8 right-8 flex items-center gap-2">
                                     <Timer size={32} className="text-red-500 animate-pulse" />
                                     <span className="text-5xl font-mono font-bold text-red-500">
                                        {Math.max(0, Math.ceil((gameState.timerEndTime - Date.now()) / 1000))}s
                                     </span>
                                 </div>
                             )}

                             {gameState.activeQuestion ? (
                                 <div className="flex-grow flex flex-col justify-center">
                                     <div className="text-2xl text-cyber-secondary font-bold mb-6 uppercase tracking-widest flex items-center gap-2">
                                         <Code2 /> 
                                         {/* Hide Difficulty for Round 1 */}
                                         {gameState.round === GameRound.ROUND_1 
                                            ? "REFLEX QUESTION" 
                                            : (gameState.activeQuestion.category || gameState.activeQuestion.difficulty || "QUESTION")} 
                                         <span className="bg-slate-700 text-white px-3 py-1 rounded text-sm">{gameState.activeQuestion.points} PTS</span>
                                     </div>
                                     <h2 className="text-6xl font-bold leading-tight mb-8">
                                         {gameState.activeQuestion.content}
                                     </h2>
                                     {gameState.activeQuestion.codeSnippet && (
                                         <pre className="bg-black p-6 rounded-xl border border-gray-700 text-green-400 font-mono text-2xl overflow-x-auto shadow-inner">
                                             {gameState.activeQuestion.codeSnippet}
                                         </pre>
                                     )}
                                     
                                     {/* Reveal Answer Overlay */}
                                     {gameState.showAnswer && gameState.activeQuestion.answer && (
                                         <div className="mt-6 bg-green-900/30 border border-green-500 p-6 rounded-xl animate-[slideUp_0.3s]">
                                             <div className="text-green-400 text-sm font-bold uppercase mb-2 flex items-center gap-2">
                                                 <Check size={18}/> Correct Answer
                                             </div>
                                             <div className="text-4xl font-bold text-white">{gameState.activeQuestion.answer}</div>
                                         </div>
                                     )}

                                     {activePlayerName && (
                                         <div className="mt-8 p-6 bg-blue-900/20 border border-blue-500/50 rounded-xl flex items-center gap-4 animate-[fadeIn_0.5s]">
                                             <div className="relative">
                                                 <User size={32} className="text-blue-400" />
                                                 <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></span>
                                             </div>
                                             <div className="text-2xl">
                                                 Current Turn: <span className="font-bold text-blue-400 text-3xl">{activePlayerName}</span>
                                             </div>
                                         </div>
                                     )}
                                 </div>
                             ) : (
                                 <div className="flex-grow flex flex-col items-center justify-center opacity-30">
                                     <div className="text-9xl mb-4">?</div>
                                     <div className="text-2xl">WAITING FOR NEXT CHALLENGE</div>
                                 </div>
                             )}
                        </div>

                        <div className="col-span-4 bg-slate-800/80 rounded-3xl border border-gray-700 p-6 overflow-hidden flex flex-col">
                             <h3 className="text-xl font-bold text-gray-400 mb-6 flex items-center gap-2">
                                 <Star className="text-yellow-500" /> LIVE RANKINGS
                             </h3>
                             <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                                 {sortedPlayers.map((p, index) => (
                                     <div key={p.id} className={`p-4 rounded-xl flex items-center justify-between border-2 transition-all duration-500 ${index === 0 ? 'bg-yellow-900/20 border-yellow-500 scale-105 shadow-lg mb-4' : 'bg-slate-700/50 border-transparent'}`}>
                                         <div className="flex items-center gap-3">
                                             <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${index === 0 ? 'bg-yellow-500 text-black' : 'bg-gray-600 text-white'}`}>
                                                 {index + 1}
                                             </div>
                                             <div>
                                                 <div className="font-bold text-lg leading-none">{p.name}</div>
                                                 {gameState.round === GameRound.ROUND_2 && p.submittedRound2 && (
                                                     <span className="text-xs text-green-400 font-mono">✔ CODE SUBMITTED</span>
                                                 )}
                                                 {activePlayerId === p.id && (
                                                     <span className="text-xs text-blue-400 font-mono animate-pulse">● ANSWERING</span>
                                                 )}
                                             </div>
                                         </div>
                                         <div className="text-2xl font-mono font-bold">{p.score}</div>
                                     </div>
                                 ))}
                             </div>
                        </div>
                    </div>
                )}

                {/* MODAL: View Student Code (Round 2) */}
                {viewingPlayer && (
                    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-8 animate-[fadeIn_0.3s]">
                        <div className="bg-slate-800 w-full max-w-5xl rounded-2xl shadow-2xl border-2 border-cyber-primary overflow-hidden">
                            <div className="p-6 bg-slate-900 border-b border-gray-700 flex justify-between items-center">
                                <h2 className="text-3xl font-bold text-white flex items-center gap-3">
                                    <Code2 size={32} className="text-cyber-primary"/> 
                                    Solution by <span className="text-cyber-primary">{viewingPlayer.name}</span>
                                </h2>
                            </div>
                            <div className="p-8 bg-black overflow-auto max-h-[70vh]">
                                <pre className="text-green-400 font-mono text-2xl whitespace-pre-wrap leading-relaxed">
                                    {viewingPlayer.round2Code || "// No code submitted"}
                                </pre>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SpectatorScreen;
