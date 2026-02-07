
import React, { useEffect, useRef, useState } from 'react';
import { GameState, GameRound, Player } from '../types';
import { Trophy, Timer, Code2, AlertCircle, Zap, User, Star, LogOut, Play, Download, Check, CheckCircle, Clock } from 'lucide-react';
import CodeDisplay from './ui/CodeDisplay';
import { SOUND_EFFECTS } from '../config/assets';

interface Props {
    gameState: GameState;
    onLeave: () => void;
}

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
            audio.play().catch(() => { });
        } catch (e) {
            console.warn("Sound play error", e);
        }
    };

    // LOGIC ÂM THANH ĐẾM NGƯỢC - PHÁT MỖI GIÂY TRONG SUỐT QUÁ TRÌNH
    useEffect(() => {
        if (!gameState.timerEndTime) {
            lastPlayedSecond.current = null;
            return;
        }

        const interval = setInterval(() => {
            const now = Date.now();
            const timeLeft = Math.max(0, Math.ceil((gameState.timerEndTime! - now) / 1000));

            // Phát âm thanh TICK mỗi khi giây đếm ngược thay đổi (cho tất cả các giây)
            if (timeLeft > 0 && timeLeft !== lastPlayedSecond.current) {
                lastPlayedSecond.current = timeLeft;
                playSound('TICK', 0.4);
            }

            // Phát âm thanh báo hết giờ khi về 0
            if (timeLeft === 0 && lastPlayedSecond.current !== 0) {
                lastPlayedSecond.current = 0;
                playSound('WRONG');
            }

            setTick(t => t + 1);
        }, 100);

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
    const top3 = sortedPlayers.slice(0, 3);
    const restOfPlayers = sortedPlayers.slice(3);

    const isRound3 = gameState.round === GameRound.ROUND_3;
    const isRound1 = gameState.round === GameRound.ROUND_1;
    const activePlayerId = isRound3 ? gameState.round3TurnPlayerId : (isRound1 ? gameState.round1TurnPlayerId : null);
    const activePlayerName = activePlayerId ? gameState.players.find(p => p.id === activePlayerId)?.name : null;
    const activePlayer = activePlayerId ? gameState.players.find(p => p.id === activePlayerId) : null;

    // Viewing Player for Round 2 Code Review
    const viewingPlayer = gameState.viewingPlayerId ? gameState.players.find(p => p.id === gameState.viewingPlayerId) : null;

    // Determine active stealer
    const stealingPlayer = gameState.activeStealPlayerId ? gameState.players.find(p => p.id === gameState.activeStealPlayerId) : null;

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
                    <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col overflow-hidden">
                        <Fireworks />

                        {/* Header Section */}
                        <div className="pt-8 pb-4 text-center z-20 shrink-0">
                            <h2 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 drop-shadow-2xl tracking-tighter uppercase mb-2 animate-bounce-short">
                                VICTORY
                            </h2>
                            <div className="text-xl md:text-2xl text-yellow-100/50 font-mono tracking-[1em] uppercase">Podium</div>
                        </div>

                        {/* Content Area */}
                        <div className="flex-grow flex w-full max-w-[95%] mx-auto pb-0 gap-8 h-full">

                            {/* PODIUM SECTION - Adjust width based on player count */}
                            <div className={`flex items-end justify-center gap-2 md:gap-4 h-full pb-0 transition-all duration-500 ${restOfPlayers.length > 0 ? 'w-2/3' : 'w-full'}`}>

                                {/* Rank 2 */}
                                <div className="flex-1 max-w-[250px] flex flex-col justify-end h-full animate-in slide-in-from-bottom duration-1000 delay-200">
                                    {top3[1] && (
                                        <div className="flex flex-col items-center w-full h-full justify-end">
                                            <div className="mb-2 text-center">
                                                <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-2 border-4 border-slate-500 shadow-xl">
                                                    <span className="text-xl md:text-2xl font-black text-slate-300">2</span>
                                                </div>
                                                <div className="text-lg md:text-2xl font-bold text-slate-200 truncate max-w-[150px]">{top3[1].name}</div>
                                                <div className="text-md md:text-xl font-mono text-slate-400">{top3[1].score} pts</div>
                                            </div>
                                            <div className="w-full h-[45%] bg-gradient-to-t from-slate-800 to-slate-600 rounded-t-lg border-t-4 md:border-t-8 border-slate-400 shadow-[0_0_40px_rgba(100,116,139,0.3)] relative group flex items-center justify-center">
                                                <div className="text-6xl md:text-8xl font-black text-slate-500/20">2</div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Rank 1 */}
                                <div className="flex-1 max-w-[320px] flex flex-col justify-end h-full z-10 animate-in slide-in-from-bottom duration-1000">
                                    {top3[0] && (
                                        <div className="flex flex-col items-center w-full h-full justify-end">
                                            <div className="mb-4 text-center transform hover:scale-105 transition-transform duration-300">
                                                <Trophy className="w-20 h-20 md:w-32 md:h-32 text-yellow-400 mx-auto mb-2 drop-shadow-[0_0_20px_rgba(250,204,21,0.6)] animate-bounce" />
                                                <div className="text-2xl md:text-5xl font-black text-yellow-300 truncate max-w-[300px] drop-shadow-lg leading-tight p-1">{top3[0].name}</div>
                                                <div className="text-xl md:text-4xl font-mono font-black text-white bg-yellow-600/60 px-6 py-1 rounded-full border border-yellow-400/50 inline-block mt-2 backdrop-blur-sm">{top3[0].score} pts</div>
                                            </div>
                                            <div className="w-full h-[60%] bg-gradient-to-t from-yellow-700 to-yellow-500 rounded-t-lg border-t-4 md:border-t-8 border-yellow-300 shadow-[0_0_80px_rgba(234,179,8,0.5)] relative overflow-hidden group flex items-center justify-center">
                                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                                <div className="absolute bottom-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                                                <div className="text-8xl md:text-[10rem] font-black text-yellow-900/20">1</div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Rank 3 */}
                                <div className="flex-1 max-w-[250px] flex flex-col justify-end h-full animate-in slide-in-from-bottom duration-1000 delay-300">
                                    {top3[2] && (
                                        <div className="flex flex-col items-center w-full h-full justify-end">
                                            <div className="mb-2 text-center">
                                                <div className="w-12 h-12 md:w-16 md:h-16 bg-amber-900 rounded-full flex items-center justify-center mx-auto mb-2 border-4 border-amber-700 shadow-xl">
                                                    <span className="text-xl md:text-2xl font-black text-amber-500">3</span>
                                                </div>
                                                <div className="text-lg md:text-2xl font-bold text-amber-200 truncate max-w-[150px]">{top3[2].name}</div>
                                                <div className="text-md md:text-xl font-mono text-amber-400">{top3[2].score} pts</div>
                                            </div>
                                            <div className="w-full h-[35%] bg-gradient-to-t from-amber-900 to-amber-700 rounded-t-lg border-t-4 md:border-t-8 border-amber-600 shadow-[0_0_40px_rgba(180,83,9,0.3)] relative group flex items-center justify-center">
                                                <div className="text-6xl md:text-8xl font-black text-amber-950/20">3</div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                            </div>

                            {/* SIDEBAR FOR RANK 4+ (Only shows if > 3 players) */}
                            {restOfPlayers.length > 0 && (
                                <div className="w-1/3 h-full pb-8 pl-4 flex flex-col justify-end animate-in slide-in-from-right duration-700 delay-500">
                                    <div className="bg-slate-800/80 rounded-2xl border border-gray-700 p-6 shadow-2xl backdrop-blur-sm max-h-[70vh] flex flex-col">
                                        <h3 className="text-xl font-bold text-gray-400 mb-4 uppercase tracking-widest border-b border-gray-600 pb-2">Class Ranking</h3>
                                        <div className="overflow-y-auto pr-2 space-y-3 custom-scrollbar flex-grow">
                                            {restOfPlayers.map((p, idx) => (
                                                <div key={p.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700 hover:bg-slate-700/50 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded bg-gray-700 flex items-center justify-center font-mono font-bold text-gray-400">#{idx + 4}</div>
                                                        <span className="font-bold text-white truncate max-w-[140px]">{p.name}</span>
                                                    </div>
                                                    <span className="font-mono text-cyber-primary font-bold">{p.score}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="w-full max-w-7xl grid grid-cols-12 gap-8 h-[80vh]">
                        <div className="col-span-8 bg-slate-900/90 rounded-3xl border-2 border-cyber-primary shadow-2xl p-12 flex flex-col relative overflow-hidden">
                            {/* STEAL MODE OVERLAY */}
                            {gameState.round3Phase === 'STEAL_WINDOW' && (
                                <div className="absolute top-0 left-0 w-full bg-red-900/90 py-2 z-20 flex justify-center items-center shadow-2xl border-b-4 border-red-500 animate-pulse">
                                    <h2 className="text-2xl font-black text-white uppercase flex items-center gap-4 tracking-widest">
                                        <Zap size={32} className="text-yellow-400" fill="currentColor" /> STEAL WINDOW OPEN <Zap size={32} className="text-yellow-400" fill="currentColor" />
                                    </h2>
                                </div>
                            )}

                            {/* TIMER: Moved logic inside conditional classes to shift it down during Steal Window */}
                            {gameState.timerEndTime && !viewingPlayer && (
                                <div className={`absolute right-8 flex items-center gap-3 transition-all duration-500 ${gameState.round3Phase === 'STEAL_WINDOW' ? 'top-24 scale-125 z-30' : 'top-8 z-10'}`}>
                                    <Timer size={40} className={`${gameState.round3Phase === 'STEAL_WINDOW' ? 'text-yellow-400' : 'text-red-500'} animate-pulse`} />
                                    <span className={`text-6xl font-mono font-black ${gameState.round3Phase === 'STEAL_WINDOW' ? 'text-yellow-400 drop-shadow-md' : 'text-red-500'}`}>
                                        {Math.max(0, Math.ceil((gameState.timerEndTime - Date.now()) / 1000))}
                                    </span>
                                </div>
                            )}

                            {/* CODE REVIEW MODE (Priority Display) */}
                            {viewingPlayer ? (
                                <div className="flex-grow flex flex-col animate-in zoom-in-95 duration-300">
                                    <div className="flex items-center justify-between gap-4 mb-6 border-b border-gray-700 pb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-16 h-16 bg-yellow-600 rounded-full flex items-center justify-center text-3xl font-black text-black">
                                                {viewingPlayer.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-yellow-500 font-bold uppercase tracking-widest text-sm">Code Review</div>
                                                <div className="text-4xl font-black">{viewingPlayer.name}'s Submission</div>
                                            </div>
                                        </div>

                                        {/* TIME TAKEN DISPLAY */}
                                        {viewingPlayer.round2Time && (
                                            <div className="flex flex-col items-end">
                                                <div className="text-gray-400 text-xs uppercase font-bold mb-1">Time Taken</div>
                                                <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-xl border border-blue-500/30 text-blue-400">
                                                    <Clock size={24} />
                                                    <span className="text-3xl font-mono font-bold text-white">{viewingPlayer.round2Time.toFixed(2)}s</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-grow bg-black rounded-xl p-6 border-2 border-yellow-500/50 shadow-inner overflow-auto">
                                        <pre className="text-green-400 font-mono text-3xl whitespace-pre-wrap">{viewingPlayer.round2Code || "// No code submitted"}</pre>
                                    </div>
                                </div>
                            ) : gameState.activeQuestion ? (
                                <div className="flex-grow flex flex-col justify-center animate-in zoom-in-95 duration-300">
                                    <div className="text-2xl text-cyber-secondary font-black mb-6 uppercase tracking-widest flex items-center gap-2">
                                        <Code2 size={28} />
                                        {gameState.activeQuestion.category || gameState.activeQuestion.difficulty || "CHALLENGE"}
                                        <span className="bg-slate-700 text-white px-3 py-1 rounded text-sm ml-2">
                                            {gameState.round === GameRound.ROUND_1
                                                ? (gameState.players.length >= 10 ? '30' : '15')
                                                : gameState.activeQuestion.points} PTS
                                        </span>
                                    </div>
                                    <h2 className="text-6xl font-bold leading-tight mb-8 drop-shadow-lg whitespace-pre-wrap">
                                        {gameState.activeQuestion.content}
                                    </h2>

                                    {/* QUIZ OPTIONS DISPLAY */}
                                    {gameState.round3Mode === 'QUIZ' && gameState.activeQuestion.options && (
                                        <div className="grid grid-cols-2 gap-6 mb-8">
                                            {gameState.activeQuestion.options.map((opt, idx) => {
                                                const isCorrect = gameState.showAnswer && opt === gameState.activeQuestion?.answer;
                                                // Check if this option was selected by the *current active player* (Turn Player)
                                                // FIX: During STEAL_WINDOW, hide the previous player's wrong selection to clear the board
                                                const isSelected = activePlayer?.round3QuizAnswer === opt && gameState.round3Phase !== 'STEAL_WINDOW';

                                                // Determine opacity/style based on reveal
                                                // If showing ans: dim everything except Correct and Key Wrong selection
                                                const opacityClass = gameState.showAnswer
                                                    ? (isCorrect || isSelected ? 'opacity-100' : 'opacity-30')
                                                    : 'opacity-100';

                                                let bgClass = 'bg-slate-800 border-gray-600';

                                                if (gameState.showAnswer) {
                                                    if (isCorrect) {
                                                        bgClass = 'bg-green-600 border-green-400 scale-105 shadow-[0_0_30px_rgba(34,197,94,0.5)]';
                                                    } else if (isSelected) {
                                                        // WRONG SELECTION -> RED
                                                        bgClass = 'bg-red-600 border-red-400 scale-105 shadow-[0_0_30px_rgba(239,68,68,0.5)]';
                                                    }
                                                } else {
                                                    // Live answering styling
                                                    // Check if in DELAY -> Show WRONG (Red)
                                                    if (gameState.round3Phase === 'SHOW_WRONG_DELAY' && isSelected) {
                                                        bgClass = 'bg-red-600 border-red-400 scale-105 shadow-[0_0_30px_rgba(239,68,68,0.5)]';
                                                    } else if (isSelected) {
                                                        bgClass = 'bg-blue-900 border-blue-400 scale-105 shadow-[0_0_20px_rgba(96,165,250,0.5)] ring-2 ring-blue-500';
                                                    }
                                                }

                                                return (
                                                    <div key={idx} className={`p-6 rounded-2xl border-2 flex items-center gap-4 transition-all duration-500 ${bgClass} ${opacityClass}`}>
                                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-2xl border border-white/20 ${isSelected && !gameState.showAnswer ? 'bg-blue-500 text-white' : 'bg-black/40'}`}>
                                                            {String.fromCharCode(65 + idx)}
                                                        </div>
                                                        <div className="text-2xl font-bold">{opt}</div>
                                                        {isSelected && !gameState.showAnswer && <div className="ml-auto text-xs bg-blue-500 text-white px-2 py-1 rounded animate-pulse">SELECTED</div>}
                                                        {isSelected && gameState.showAnswer && !isCorrect && <div className="ml-auto text-xs bg-red-800 text-white px-2 py-1 rounded font-bold">WRONG</div>}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {gameState.activeQuestion.codeSnippet && (
                                        <div className="mb-4">
                                            <CodeDisplay code={gameState.activeQuestion.codeSnippet} className="text-2xl" />
                                        </div>
                                    )}

                                    {gameState.showAnswer && gameState.activeQuestion.answer && gameState.round3Mode !== 'QUIZ' && (
                                        <div className="mt-4 bg-green-900/40 border-2 border-green-500 p-8 rounded-2xl animate-in slide-in-from-top-4 duration-500">
                                            <div className="text-green-400 text-sm font-black uppercase mb-3 flex items-center gap-2 tracking-tighter">
                                                <Check size={20} /> Correct Answer
                                            </div>
                                            <div className="text-5xl font-black text-white">{gameState.activeQuestion.answer}</div>
                                        </div>
                                    )}

                                    {/* DISPLAY ACTIVE PLAYER (NORMAL OR STEALING) */}
                                    {(activePlayerName || stealingPlayer) && (
                                        <div className={`mt-auto p-6 rounded-2xl flex items-center gap-5 border-2 ${stealingPlayer ? 'bg-red-900/40 border-red-500 animate-pulse' : 'bg-blue-900/20 border-blue-500/50'}`}>
                                            <div className="relative">
                                                <User size={40} className={stealingPlayer ? "text-red-400" : "text-blue-400"} />
                                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-500 rounded-full animate-ping"></div>
                                            </div>
                                            <div className="text-3xl flex-1 flex justify-between items-center">
                                                {stealingPlayer ? (
                                                    <>STEALING: <span className="font-black text-red-400 text-4xl uppercase">{stealingPlayer.name}</span></>
                                                ) : (
                                                    <>Current Turn: <span className="font-black text-blue-400 text-4xl">{activePlayerName}</span></>
                                                )}

                                                {/* Show "ANSWERED" status if in Quiz Mode */}
                                                {gameState.round3Mode === 'QUIZ' && activePlayer && activePlayer.round3QuizAnswer && !gameState.showAnswer && (
                                                    <div className="bg-yellow-500 text-black px-4 py-1 rounded-full text-sm font-black animate-bounce">
                                                        ANSWER SUBMITTED!
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex-grow flex flex-col items-center justify-center opacity-20">
                                    <Gamepad2 size={120} className="mb-6" />
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
                                                {/* SHOW SUBMITTED STATUS FOR ROUND 2 */}
                                                {gameState.round === GameRound.ROUND_2 && p.submittedRound2 && (
                                                    <span className="text-xs text-green-400 font-bold flex items-center gap-1 animate-in zoom-in">
                                                        <CheckCircle size={12} fill="currentColor" className="text-green-900" /> SUBMITTED
                                                    </span>
                                                )}
                                                {activePlayerId === p.id && <span className="text-xs text-blue-400 font-black animate-pulse uppercase tracking-tighter">● Answering</span>}
                                                {gameState.activeStealPlayerId === p.id && <span className="text-xs text-red-500 font-black animate-pulse uppercase tracking-tighter">⚡ STEALING</span>}
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
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="6" x2="10" y1="12" y2="12" /><line x1="8" x2="8" y1="10" y2="14" /><line x1="15" x2="15.01" y1="13" y2="13" /><line x1="18" x2="18.01" y1="11" y2="11" /><rect width="20" height="12" x="2" y="6" rx="2" /></svg>
);

export default SpectatorScreen;
