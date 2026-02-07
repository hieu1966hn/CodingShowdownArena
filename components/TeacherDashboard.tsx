
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { GameState, GameRound, Question, Player, Difficulty, PackStatus, QuestionCategory } from '../gameTypes';
import { ROUND_1_QUESTIONS, ROUND_2_QUESTIONS, ROUND_3_QUESTIONS } from '../data/questions';
import { SOUND_EFFECTS } from '../config/assets';
import { Play, Check, X, Sparkles, RefreshCw, PlusCircle, MinusCircle, Code, Eye, Timer, User, Zap, Users, Monitor, Trophy, LogOut, Filter, CheckCircle, Pointer, Shuffle, ListOrdered, ChevronDown, ChevronUp, Database, EyeOff, XCircle, BookOpen, Terminal, Trash2, Clock, ThumbsUp, ThumbsDown, Hand, MessageSquare, LayoutGrid, SkipForward, UserX } from 'lucide-react';

interface Props {
    gameState: GameState;
    actions: any;
    onLeave: () => void;
}

const TeacherDashboard: React.FC<Props> = ({ gameState, actions, onLeave }) => {
    const [customPrompt, setCustomPrompt] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [showR3Bank, setShowR3Bank] = useState(false);
    const [r2Category, setR2Category] = useState<QuestionCategory | 'ALL'>('ALL');
    const [r1Filter, setR1Filter] = useState<Difficulty | 'ALL'>('ALL');
    const [isGraded, setIsGraded] = useState(false); // NEW: Track if current Q has been graded

    const playSound = (type: keyof typeof SOUND_EFFECTS) => {
        try {
            const audio = new Audio(SOUND_EFFECTS[type]);
            audio.volume = 1.0;
            audio.currentTime = 0;
            audio.play().catch(error => console.warn(`Sound play failed:`, error));
        } catch (e) {
            console.error("Audio error:", e);
        }
    };

    // Reset graded status when question changes
    useEffect(() => {
        setIsGraded(false);
    }, [gameState.activeQuestion?.id]);

    const getDynamicTimerDuration = (difficulty?: Difficulty) => {
        switch (difficulty) {
            case 'EASY': return 20;
            case 'MEDIUM': return 60;
            case 'HARD': return 120;
            default: return 25;
        }
    };

    const isReadOnly = gameState.round === GameRound.GAME_OVER;

    const RoundControl = () => (
        <div className="grid grid-cols-4 gap-4 mb-8">
            <button disabled={isReadOnly} onClick={() => actions.setRound(GameRound.LOBBY)} className={`p-3 rounded font-bold transition-all hover:scale-105 disabled:opacity-50 disabled:grayscale ${gameState.round === GameRound.LOBBY ? 'bg-cyber-primary text-black' : 'bg-gray-700'}`}>LOBBY</button>
            <button disabled={isReadOnly} onClick={() => actions.setRound(GameRound.ROUND_1)} className={`p-3 rounded font-bold transition-all hover:scale-105 disabled:opacity-50 disabled:grayscale ${gameState.round === GameRound.ROUND_1 ? 'bg-cyber-primary text-black' : 'bg-gray-700'}`}>R1: REFLEX</button>
            <button disabled={isReadOnly} onClick={() => actions.setRound(GameRound.ROUND_2)} className={`p-3 rounded font-bold transition-all hover:scale-105 disabled:opacity-50 disabled:grayscale ${gameState.round === GameRound.ROUND_2 ? 'bg-cyber-primary text-black' : 'bg-gray-700'}`}>R2: OBSTACLE</button>
            <button disabled={isReadOnly} onClick={() => actions.setRound(GameRound.ROUND_3)} className={`p-3 rounded font-bold transition-all hover:scale-105 disabled:opacity-50 disabled:grayscale ${gameState.round === GameRound.ROUND_3 ? 'bg-cyber-primary text-black' : 'bg-gray-700'}`}>R3: FINISH</button>
        </div>
    );

    const PlayerManager = () => (
        <div className="bg-gray-800 p-4 rounded-lg mb-6 shadow-lg">
            <div className="flex justify-between items-center mb-2">
                <h3 className="text-gray-400 font-bold">Live Score Adjustment</h3>
                <button
                    onClick={() => { if (window.confirm("Reset all scores and question progress?")) actions.resetGame(); }}
                    className="text-xs flex items-center gap-1 text-red-400 hover:text-red-300 transition-colors bg-red-900/20 px-2 py-1 rounded"
                >
                    <Trash2 size={12} /> Reset Session
                </button>
            </div>
            {isReadOnly && <div className="bg-red-900/30 border border-red-500 text-red-200 p-2 mb-4 rounded text-center font-bold text-sm uppercase tracking-widest">⚠️ SESSION ENDED - READ ONLY MODE</div>}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {gameState.players.map(p => (
                    <div key={p.id} className={`p-2 rounded border flex justify-between items-center transition-colors ${p.buzzedAt ? 'bg-yellow-900/50 border-yellow-500 animate-pulse' : 'border-gray-600 bg-gray-700/50'}`}>
                        <div className="flex items-center gap-2 overflow-hidden">
                            {gameState.round === GameRound.LOBBY && !isReadOnly && (
                                <button
                                    onClick={() => {
                                        if (window.confirm(`Bạn có chắc muốn mời học viên "${p.name}" ra khỏi phòng?`)) {
                                            actions.kickPlayer(p.id);
                                        }
                                    }}
                                    className="text-red-500 hover:text-red-300 hover:bg-red-900/40 rounded p-1 transition-colors"
                                    title="Mời ra khỏi phòng"
                                >
                                    <UserX size={14} />
                                </button>
                            )}
                            <span className="truncate w-24 font-bold" title={p.name}>{p.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            {!isReadOnly && <button onClick={() => { playSound('SCORE_DOWN'); actions.updateScore(p.id, -10); }} className="text-red-400 p-1"><MinusCircle size={16} /></button>}
                            <span className="w-8 text-center font-mono font-bold">{p.score}</span>
                            {!isReadOnly && <button onClick={() => { playSound('SCORE_UP'); actions.updateScore(p.id, 10); }} className="text-green-400 p-1"><PlusCircle size={16} /></button>}
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex gap-2 mt-4">
                {!isReadOnly && (
                    <>
                        <button onClick={() => actions.clearBuzzers()} className="px-3 py-1 bg-gray-600 rounded text-sm">Reset Buzzers</button>
                        <button onClick={() => actions.stopTimer()} className="px-3 py-1 bg-red-900 rounded text-sm">Stop Timer</button>
                    </>
                )}
            </div>
        </div>
    );

    // Helper to find the viewing player
    const viewingPlayer = gameState.viewingPlayerId
        ? gameState.players.find(p => p.id === gameState.viewingPlayerId)
        : null;

    // --- AUTO-GRADE TIMER MONITOR ---
    // --- AUTO-GRADE TIMER MONITOR ---
    useEffect(() => {
        const checkTimer = () => {
            const now = Date.now();

            // 1. Auto-grade when Main Answer Timer runs out
            if (gameState.round === GameRound.ROUND_3 &&
                gameState.round3Mode === 'QUIZ' &&
                gameState.round3Phase === 'MAIN_ANSWER' &&
                gameState.timerEndTime &&
                !gameState.showAnswer) {

                if (now >= gameState.timerEndTime + 500) {
                    console.log("Time's up! Auto-grading quiz...");
                    playSound('WRONG');
                    actions.autoGradeQuiz();
                }
            }

            // 2. Auto-transition from Delay to Steal
            if (gameState.round === GameRound.ROUND_3 &&
                gameState.round3Phase === 'SHOW_WRONG_DELAY' &&
                gameState.timerEndTime) {

                if (now >= gameState.timerEndTime) {
                    console.log("Delay over. Starting Steal Phase...");
                    actions.startStealPhase();
                }
            }
        };

        const interval = setInterval(checkTimer, 500);
        return () => clearInterval(interval);
    }, [gameState.round, gameState.round3Mode, gameState.round3Phase, gameState.timerEndTime, gameState.showAnswer]);


    return (
        <div className="min-h-screen bg-cyber-dark text-white p-6 pb-24">
            <header className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-cyber-primary">Teacher Control Panel</h1>
                <div className="flex items-center gap-4">
                    <div className="text-xs font-mono text-gray-500">ROOM ID: <span className="text-cyber-primary">{gameState.roomId}</span></div>
                    <button onClick={onLeave} className="flex items-center gap-2 px-4 py-2 bg-red-600 rounded"><LogOut size={18} /> Exit</button>
                </div>
            </header>

            <RoundControl />
            <PlayerManager />

            {/* ROUND 1 VIEW */}
            {gameState.round === GameRound.ROUND_1 && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold flex items-center gap-2"><Sparkles className="text-yellow-400" /> Round 1: Reflex Quiz</h2>
                        <span className="text-xs text-gray-500">Used: {gameState.usedQuestionIds.filter(id => id.startsWith('r1')).length} / {ROUND_1_QUESTIONS.length}</span>
                        <span className={`text-xs font-bold px-2 py-1 rounded border ${gameState.players.length >= 10 ? 'bg-green-900/30 text-green-400 border-green-700' : 'bg-blue-900/30 text-blue-400 border-blue-700'}`}>
                            Val: {gameState.players.length >= 10 ? '30pts' : '15pts'}/q
                        </span>
                    </div>

                    <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 mb-4">
                        <h3 className="text-gray-300 font-bold mb-3">Select Student for Turn:</h3>
                        <div className="flex flex-wrap gap-2">
                            {gameState.players.map(p => (
                                <button key={p.id} onClick={() => actions.setRound1Turn(gameState.round1TurnPlayerId === p.id ? null : p.id)} className={`px-4 py-2 rounded-full font-bold border-2 ${gameState.round1TurnPlayerId === p.id ? 'bg-cyber-primary text-black border-cyber-primary' : 'border-gray-600 text-gray-300'}`}>{p.name}</button>
                            ))}
                        </div>
                    </div>

                    {/* DIFFICULTY FILTER */}
                    <div className="flex items-center gap-2 mb-2 bg-slate-900/50 p-2 rounded-lg border border-gray-700">
                        <span className="text-sm font-bold text-gray-400 flex items-center gap-2 mr-2"><Filter size={16} /> Filter:</span>
                        <button
                            onClick={() => setR1Filter('ALL')}
                            className={`px-3 py-1 rounded text-xs font-bold transition-colors ${r1Filter === 'ALL' ? 'bg-gray-200 text-black' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                        >ALL</button>
                        <button
                            onClick={() => setR1Filter('EASY')}
                            className={`px-3 py-1 rounded text-xs font-bold transition-colors ${r1Filter === 'EASY' ? 'bg-green-600 text-white' : 'bg-green-900/30 text-green-500 border border-green-900 hover:bg-green-900/50'}`}
                        >EASY</button>
                        <button
                            onClick={() => setR1Filter('MEDIUM')}
                            className={`px-3 py-1 rounded text-xs font-bold transition-colors ${r1Filter === 'MEDIUM' ? 'bg-yellow-600 text-white' : 'bg-yellow-900/30 text-yellow-500 border border-yellow-900 hover:bg-yellow-900/50'}`}
                        >MEDIUM</button>
                        <button
                            onClick={() => setR1Filter('HARD')}
                            className={`px-3 py-1 rounded text-xs font-bold transition-colors ${r1Filter === 'HARD' ? 'bg-red-600 text-white' : 'bg-red-900/30 text-red-500 border border-red-900 hover:bg-red-900/50'}`}
                        >HARD</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                        {ROUND_1_QUESTIONS
                            .filter(q => r1Filter === 'ALL' || q.difficulty === r1Filter)
                            .map(q => {
                                const isUsed = gameState.usedQuestionIds.includes(q.id);
                                return (
                                    <button
                                        key={q.id}
                                        onClick={() => actions.setQuestion(q)}
                                        className={`p-4 rounded text-left border relative transition-all ${gameState.activeQuestion?.id === q.id ? 'border-cyber-primary bg-slate-800' : isUsed ? 'border-gray-800 bg-gray-900 opacity-50 grayscale' : 'border-gray-600 bg-gray-800'}`}
                                    >
                                        {isUsed && <span className="absolute top-2 right-2 text-[10px] font-black bg-gray-700 text-gray-300 px-1 rounded">USED</span>}

                                        {/* DIFFICULTY BADGE FOR TEACHER */}
                                        <div className="flex items-center mb-1">
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded mr-2 ${q.difficulty === 'EASY' ? 'bg-green-900 text-green-300 border border-green-700' :
                                                q.difficulty === 'MEDIUM' ? 'bg-yellow-900 text-yellow-300 border border-yellow-700' :
                                                    'bg-red-900 text-red-300 border border-red-700'
                                                }`}>
                                                {q.difficulty || 'EASY'}
                                            </span>
                                            <span className="text-[10px] text-gray-500">
                                                {gameState.players.length >= 10 ? '30' : '15'}pts (Dynamic)
                                            </span>
                                        </div>

                                        <div className="font-bold mb-1 line-clamp-2">{q.content}</div>
                                        <div className="text-xs text-green-400 font-mono truncate">{q.answer}</div>
                                    </button>
                                );
                            })}
                    </div>
                    {gameState.activeQuestion && (
                        <div className="fixed bottom-0 left-0 w-full bg-gray-900 p-4 border-t border-gray-700 flex justify-between gap-4 z-50 shadow-2xl items-center">
                            <div className="flex gap-2">
                                <button onClick={() => actions.startTimer(5)} className="px-6 py-3 bg-blue-600 rounded font-bold shadow-lg hover:bg-blue-500">Start 5s Timer</button>
                                <button onClick={() => actions.toggleShowAnswer()} className={`px-6 py-3 rounded font-bold border ${gameState.showAnswer ? 'bg-green-600 border-green-400' : 'bg-gray-700 border-gray-600'}`}>
                                    {gameState.showAnswer ? "Hide Answer" : "Show Answer"}
                                </button>
                            </div>

                            {/* Grading Buttons for Active Student */}
                            {gameState.round1TurnPlayerId && (
                                <div className="flex gap-4 items-center bg-gray-800 px-4 py-2 rounded-lg border border-yellow-600">
                                    <span className="text-yellow-500 font-bold uppercase text-sm">
                                        {gameState.players.find(p => p.id === gameState.round1TurnPlayerId)?.name}
                                    </span>
                                    <button
                                        disabled={isGraded}
                                        onClick={() => {
                                            if (isGraded) return;
                                            setIsGraded(true);
                                            playSound('CORRECT');
                                            // Dynamic Point Calculation
                                            // If players >= 10: 30pts (needs 5 correct to reach 150)
                                            // If players < 10: 15pts (needs 10 correct to reach 150)
                                            const playerCount = gameState.players.length;
                                            const points = playerCount >= 10 ? 30 : 15;

                                            actions.updateScore(gameState.round1TurnPlayerId, points);
                                        }}
                                        className={`px-4 py-2 rounded font-bold flex items-center gap-2 ${isGraded ? 'bg-gray-600 cursor-not-allowed opacity-50' : 'bg-green-600 hover:bg-green-500'}`}
                                    >
                                        <ThumbsUp size={16} /> Correct (+{gameState.players.length >= 10 ? 30 : 15})
                                    </button>
                                    <button
                                        onClick={() => {
                                            playSound('WRONG');
                                            // Wrong answer gives 0 points
                                        }}
                                        className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded font-bold flex items-center gap-2"
                                    >
                                        <ThumbsDown size={16} /> Wrong (0)
                                    </button>
                                </div>
                            )}

                            <button onClick={() => actions.clearQuestion()} className="px-6 py-3 bg-gray-600 rounded font-bold">Clear Question</button>
                        </div>
                    )}
                </div>
            )}

            {/* ROUND 2 VIEW */}
            {gameState.round === GameRound.ROUND_2 && (
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <h2 className="text-xl font-bold flex items-center gap-2"><Terminal className="text-cyber-primary" /> Round 2: Obstacle - Debugging</h2>
                            {/* QUESTION PROGRESS */}
                            {gameState.round2Questions.length > 0 && (
                                <div className="bg-cyber-primary/20 border border-cyber-primary px-4 py-2 rounded-lg">
                                    <span className="text-cyber-primary font-black text-lg">
                                        Question {gameState.round2CurrentQuestion + 1} / 5
                                    </span>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-4">
                            {/* INIT BUTTON */}
                            {gameState.round2Questions.length === 0 && (
                                <button
                                    onClick={() => actions.initRound2Questions()}
                                    className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded font-bold flex items-center gap-2"
                                >
                                    <Play size={18} /> Initialize 5 Questions
                                </button>
                            )}
                            <span className="text-xs text-gray-500">Total: {ROUND_2_QUESTIONS.length} Questions</span>
                            <div className="flex gap-2">
                                {(['ALL', 'LOGIC', 'SYNTAX', 'ALGO', 'OUTPUT', 'DEBUG', 'LIST'] as const).map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setR2Category(cat)}
                                        className={`px-3 py-1 rounded text-xs font-bold ${r2Category === cat ? 'bg-cyber-primary text-black' : 'bg-gray-700 text-gray-300'}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[650px] overflow-y-auto pr-2 custom-scrollbar p-2 bg-slate-900/30 rounded-xl">
                        {ROUND_2_QUESTIONS
                            .filter(q => (r2Category === 'ALL' || q.category === r2Category))
                            .map(q => {
                                const isUsed = gameState.usedQuestionIds.includes(q.id);
                                const isInCurrentSet = gameState.round2Questions.includes(q.id);
                                return (
                                    <button
                                        key={q.id}
                                        onClick={() => {
                                            // If 5 questions initialized, replace current question
                                            if (gameState.round2Questions.length > 0) {
                                                actions.replaceRound2Question(q);
                                            } else {
                                                // Otherwise, just set as active question (old behavior)
                                                actions.setQuestion(q);
                                            }
                                        }}
                                        className={`p-4 rounded text-left border relative transition-all ${gameState.activeQuestion?.id === q.id
                                                ? 'border-cyber-primary bg-slate-800 shadow-[0_0_15px_rgba(6,182,212,0.3)] scale-105 z-10'
                                                : isInCurrentSet
                                                    ? 'border-yellow-500 bg-yellow-900/20'
                                                    : isUsed
                                                        ? 'border-gray-800 bg-gray-900 opacity-40 grayscale'
                                                        : 'border-gray-600 bg-gray-800 hover:border-cyber-primary'
                                            }`}
                                    >
                                        {isUsed && <span className="absolute top-2 right-2 text-[10px] font-black bg-gray-700 text-gray-300 px-1 rounded">USED</span>}
                                        {isInCurrentSet && !isUsed && <span className="absolute top-2 right-2 text-[10px] font-black bg-yellow-600 text-black px-1 rounded">IN SET</span>}
                                        <div className="flex justify-between mb-2">
                                            <span className="text-[10px] bg-cyber-primary/20 text-cyber-primary px-2 py-0.5 rounded uppercase font-black">{q.category}</span>
                                            <span className="text-[10px] text-gray-500 font-mono">{q.points}pts</span>
                                        </div>
                                        <div className="font-bold text-sm mb-2 h-10 overflow-hidden line-clamp-2">{q.content}</div>
                                        {/* Use Pre tag for code formatting */}
                                        <pre className="text-[10px] bg-black/60 p-2 rounded text-green-500 font-mono truncate border border-gray-700 whitespace-pre-wrap">
                                            {q.codeSnippet}
                                        </pre>
                                    </button>
                                );
                            })}
                    </div>

                    {gameState.activeQuestion && (
                        <div className="bg-slate-900 border border-cyber-primary p-6 rounded-xl shadow-2xl">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <h3 className="text-cyber-primary font-black uppercase text-sm mb-1">Active Challenge</h3>
                                    <p className="text-xl font-bold mb-4">{gameState.activeQuestion.content}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => actions.startRound2Timer()} className="px-4 py-2 bg-blue-600 rounded font-bold flex items-center gap-2 hover:bg-blue-500"><Timer size={18} /> Start Round Timer</button>
                                    <button onClick={() => actions.toggleShowAnswer()} className="px-4 py-2 bg-gray-700 rounded font-bold">{gameState.showAnswer ? "Hide Answer" : "Show Answer"}</button>
                                    {/* NEXT QUESTION BUTTON */}
                                    {gameState.round2CurrentQuestion < 4 && (
                                        <button
                                            onClick={() => {
                                                actions.nextRound2Question();
                                                playSound('CORRECT');
                                            }}
                                            className="px-4 py-2 bg-green-600 hover:bg-green-500 rounded font-bold flex items-center gap-2"
                                        >
                                            <SkipForward size={18} /> Next Question
                                        </button>
                                    )}
                                    <button onClick={() => actions.clearQuestion()} className="px-4 py-2 bg-red-900 rounded font-bold"><X size={18} /></button>
                                </div>
                            </div>

                            {/* Active Code Display */}
                            {gameState.activeQuestion.codeSnippet && (
                                <div className="bg-black/80 p-4 rounded-lg border border-gray-600 mb-6 font-mono text-green-400 whitespace-pre-wrap">
                                    {gameState.activeQuestion.codeSnippet}
                                </div>
                            )}

                            {/* Viewing Player Code Section */}
                            {viewingPlayer && (
                                <div className="mb-6 animate-in fade-in slide-in-from-top-4 duration-300 relative">
                                    <div className="bg-black border-2 border-yellow-500 rounded-lg overflow-hidden">
                                        <div className="bg-yellow-900/40 p-2 border-b border-yellow-500/50 flex justify-between items-center px-4">
                                            <div className="font-bold text-yellow-500 flex items-center gap-4">
                                                <span className="flex items-center gap-2"><Code size={16} /> Submission by: <span className="text-white text-lg">{viewingPlayer.name}</span></span>

                                                {/* TIME TAKEN DISPLAY */}
                                                {(() => {
                                                    const currentQuestionId = gameState.round2Questions[gameState.round2CurrentQuestion];
                                                    const submission = viewingPlayer.round2Submissions?.find(s => s.questionId === currentQuestionId);
                                                    return submission?.time && (
                                                        <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-yellow-500/30">
                                                            <Clock size={14} className="text-blue-400" />
                                                            <span className="text-blue-400 font-mono text-sm">
                                                                Time: <span className="font-bold text-white">{submission.time.toFixed(2)}s</span>
                                                            </span>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                            <button onClick={() => actions.setViewingPlayer(null)} className="text-gray-400 hover:text-white"><X size={18} /></button>
                                        </div>

                                        <div className="p-4 bg-slate-900/50 overflow-x-auto min-h-[100px]">
                                            <pre className="text-green-400 font-mono text-lg whitespace-pre-wrap">
                                                {(() => {
                                                    const currentQuestionId = gameState.round2Questions[gameState.round2CurrentQuestion];
                                                    const submission = viewingPlayer.round2Submissions?.find(s => s.questionId === currentQuestionId);
                                                    return submission?.code || "// No code submitted for this question";
                                                })()}
                                            </pre>
                                        </div>

                                        {/* GRADING BUTTONS */}
                                        <div className="p-3 bg-slate-900 border-t border-gray-700 flex gap-3 justify-end">
                                            <button
                                                onClick={() => {
                                                    actions.setViewingPlayer(null);
                                                    playSound('SCORE_DOWN'); // Sound for wrong/dismiss
                                                }}
                                                className="px-6 py-2 bg-red-900/50 border border-red-500 hover:bg-red-900 text-red-200 rounded font-bold flex items-center gap-2 transition-all"
                                            >
                                                <ThumbsDown size={18} /> WRONG (Dismiss)
                                            </button>
                                            <button
                                                onClick={() => {
                                                    // NEW: Use gradeRound2Question for per-question grading
                                                    actions.gradeRound2Question(viewingPlayer.id, true);

                                                    playSound('CORRECT');
                                                    actions.setViewingPlayer(null);
                                                }}
                                                className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded font-bold flex items-center gap-2 shadow-lg hover:shadow-green-500/20 transition-all"
                                            >
                                                <ThumbsUp size={18} /> CORRECT (+30pts + Bonus)
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                                {gameState.players.map(p => {
                                    const currentQuestionId = gameState.round2Questions[gameState.round2CurrentQuestion];
                                    const submission = p.round2Submissions?.find(s => s.questionId === currentQuestionId);
                                    const hasSubmitted = !!submission;
                                    const isCorrect = submission?.isCorrect === true;

                                    return (
                                        <div key={p.id} className={`p-3 rounded-lg border-2 transition-all flex flex-col gap-2 ${isCorrect ? 'opacity-40 grayscale border-green-800 bg-green-950/20' : hasSubmitted ? 'border-green-500 bg-green-900/20' : 'border-gray-700 bg-gray-800/50'} ${gameState.viewingPlayerId === p.id ? 'ring-2 ring-yellow-400 scale-105 opacity-100 grayscale-0' : ''}`}>
                                            <div className="flex justify-between items-center">
                                                <span className="font-bold truncate max-w-[80px]">{p.name}</span>
                                                {isCorrect ? <CheckCircle size={16} className="text-green-600" /> : hasSubmitted ? <CheckCircle size={16} className="text-green-500" /> : <RefreshCw size={16} className="text-gray-600 animate-spin" />}
                                            </div>

                                            {/* TIME DISPLAY ON CARD */}
                                            {submission?.time && (
                                                <div className="text-xs bg-black/40 rounded px-2 py-1 text-center font-mono text-blue-300 border border-blue-900/50">
                                                    ⏱ {submission.time.toFixed(2)}s
                                                </div>
                                            )}

                                            {/* POINTS DISPLAY */}
                                            {submission?.points && (
                                                <div className="text-xs bg-green-900/40 rounded px-2 py-1 text-center font-bold text-green-400 border border-green-700/50">
                                                    +{submission.points} pts
                                                </div>
                                            )}

                                            {hasSubmitted && (
                                                <button
                                                    onClick={() => actions.setViewingPlayer(p.id === gameState.viewingPlayerId ? null : p.id)}
                                                    className={`w-full py-1 text-[10px] font-bold rounded transition-colors ${gameState.viewingPlayerId === p.id ? 'bg-yellow-500 text-black' : 'bg-cyber-primary/20 text-cyber-primary hover:bg-cyber-primary/40'}`}
                                                >
                                                    {gameState.viewingPlayerId === p.id ? 'CLOSE' : 'VIEW CODE'}
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ROUND 3 VIEW */}
            {gameState.round === GameRound.ROUND_3 && (
                <div className="space-y-8">
                    <div className="flex justify-between items-center bg-slate-800 p-4 rounded-xl border border-gray-700">
                        <div className="flex items-center gap-6">
                            <h2 className="text-xl font-bold flex items-center gap-2"><Sparkles className="text-cyber-secondary" /> Round 3: Tactical Finish</h2>

                            {/* MODE SWITCHER */}
                            <div className="flex bg-gray-900 rounded-lg p-1 border border-gray-700">
                                <button
                                    onClick={() => actions.setRound3Mode('ORAL')}
                                    className={`px-4 py-2 rounded-md font-bold text-sm flex items-center gap-2 transition-all ${gameState.round3Mode === 'ORAL' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                >
                                    <MessageSquare size={16} /> Vấn Đáp
                                </button>
                                <button
                                    onClick={() => actions.setRound3Mode('QUIZ')}
                                    className={`px-4 py-2 rounded-md font-bold text-sm flex items-center gap-2 transition-all ${gameState.round3Mode === 'QUIZ' ? 'bg-purple-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                >
                                    <LayoutGrid size={16} /> Trắc Nghiệm
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-500">Used: {gameState.usedQuestionIds.filter(id => id.startsWith('r3')).length} / {ROUND_3_QUESTIONS.length}</span>
                            <button
                                onClick={() => setShowR3Bank(!showR3Bank)}
                                className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all ${showR3Bank ? 'bg-cyber-secondary text-white' : 'bg-gray-700 text-gray-300'}`}
                            >
                                <BookOpen size={18} /> {showR3Bank ? "Close Bank" : "Open Question Bank"}
                            </button>
                        </div>
                    </div>

                    {showR3Bank && (
                        <div className="bg-slate-800 border-2 border-cyber-secondary rounded-xl p-6 animate-in slide-in-from-top duration-300 shadow-2xl">
                            <div className="flex gap-4 mb-6">
                                {(['EASY', 'MEDIUM', 'HARD'] as const).map(diff => (
                                    <div key={diff} className="flex-1">
                                        <h4 className={`text-xs font-black mb-3 uppercase tracking-widest ${diff === 'EASY' ? 'text-green-400' : diff === 'MEDIUM' ? 'text-yellow-400' : 'text-red-400'}`}>{diff} Bank</h4>
                                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                            {ROUND_3_QUESTIONS.filter(q => q.difficulty === diff).map(q => {
                                                const isUsed = gameState.usedQuestionIds.includes(q.id);
                                                return (
                                                    <button
                                                        key={q.id}
                                                        onClick={() => actions.setQuestion(q)}
                                                        className={`w-full p-2 text-left text-[10px] rounded border transition-colors ${gameState.activeQuestion?.id === q.id ? 'bg-cyber-secondary/30 border-cyber-secondary' : isUsed ? 'bg-gray-900 border-gray-800 opacity-40 grayscale' : 'bg-black/30 border-gray-700 hover:bg-black/60'}`}
                                                    >
                                                        {isUsed && <span className="mr-1 text-[8px] font-black bg-gray-700 text-gray-300 px-1 rounded">USED</span>}
                                                        {q.content}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ACTIVE QUESTION MONITOR */}
                    <div className="bg-slate-900 border border-cyber-primary rounded-xl p-6 shadow-xl relative overflow-hidden min-h-[300px]">

                        {/* STEAL MODE OVERLAY FOR TEACHER */}
                        {gameState.round3Phase === 'STEAL_WINDOW' && (
                            <div className="absolute top-0 right-0 w-1/2 h-full bg-slate-900/95 border-l-4 border-red-600 p-6 z-20 flex flex-col shadow-[-10px_0_30px_rgba(0,0,0,0.5)]">
                                <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-3">
                                    <h3 className="text-xl font-black text-red-500 flex items-center gap-2 uppercase tracking-wider animate-pulse"><Zap size={24} /> STEAL QUEUE</h3>
                                    <div className="flex gap-2">
                                        <button onClick={() => actions.clearBuzzers()} className="px-3 py-1 bg-gray-800 hover:bg-red-900 text-gray-300 hover:text-white rounded text-xs font-bold transition-colors">Clear All</button>
                                        <button onClick={() => actions.cancelStealPhase()} className="px-3 py-1 bg-red-900 hover:bg-red-800 text-white rounded text-xs font-bold transition-colors border border-red-500 flex items-center gap-1"><X size={14} /> CLOSE</button>
                                    </div>
                                </div>

                                {gameState.activeStealPlayerId ? (
                                    <div className="flex-1 flex flex-col justify-center animate-in slide-in-from-right duration-300">
                                        <div className="text-center mb-6">
                                            <div className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-2">Currently Stealing</div>
                                            <div className="text-4xl font-black text-white bg-red-900/30 py-4 rounded-xl border border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                                                {gameState.players.find(p => p.id === gameState.activeStealPlayerId)?.name}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <button
                                                onClick={() => {
                                                    const pts = gameState.activeQuestion?.points || 0;
                                                    playSound('CORRECT');
                                                    actions.resolveSteal(gameState.activeStealPlayerId, true, pts);
                                                }}
                                                className="py-6 bg-green-600 hover:bg-green-500 rounded-xl flex flex-col items-center justify-center gap-2 font-black text-lg shadow-lg hover:scale-105 transition-all group"
                                            >
                                                <ThumbsUp size={32} className="group-hover:animate-bounce" /> CORRECT
                                            </button>
                                            <button
                                                onClick={() => {
                                                    const pts = gameState.activeQuestion?.points || 0;
                                                    playSound('WRONG');
                                                    actions.resolveSteal(gameState.activeStealPlayerId, false, pts);
                                                }}
                                                className="py-6 bg-red-600 hover:bg-red-500 rounded-xl flex flex-col items-center justify-center gap-2 font-black text-lg shadow-lg hover:scale-105 transition-all group"
                                            >
                                                <ThumbsDown size={32} className="group-hover:animate-bounce" /> WRONG
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                        {gameState.players.filter(p => p.buzzedAt).length > 0 ? (
                                            gameState.players.filter(p => p.buzzedAt).sort((a, b) => (a.buzzedAt || 0) - (b.buzzedAt || 0)).map((p, idx) => (
                                                <button
                                                    key={p.id}
                                                    onClick={() => actions.activateSteal(p.id)}
                                                    className="w-full p-4 bg-slate-800 hover:bg-slate-700 border-l-4 border-l-transparent hover:border-l-red-500 rounded-r-lg flex justify-between items-center group transition-all"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <span className={`w-8 h-8 flex items-center justify-center rounded-full font-bold ${idx === 0 ? 'bg-red-500 text-white animate-pulse' : 'bg-gray-700 text-gray-400'}`}>
                                                            {idx + 1}
                                                        </span>
                                                        <span className="font-bold text-lg text-white group-hover:text-red-400 transition-colors">{p.name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs text-gray-500 group-hover:text-white">
                                                        <span>Accept</span>
                                                        <Hand size={20} className="transform group-hover:rotate-12 transition-transform" />
                                                    </div>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
                                                <Zap size={48} className="mb-4" />
                                                <p className="text-center font-bold italic">Waiting for buzzers...</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="flex items-center justify-between mb-4 border-b border-gray-700 pb-3">
                            <div className="flex items-center gap-2 text-cyber-primary font-bold uppercase tracking-widest text-sm">
                                <Monitor size={18} /> Question Monitor
                            </div>
                            {gameState.activeQuestion && (
                                <div className="flex gap-2">
                                    {/* QUICK MODE TOGGLE FOR ACTIVE QUESTION */}
                                    <div className="flex mr-2 bg-black/40 rounded p-1 border border-gray-700">
                                        <button
                                            onClick={() => actions.setRound3Mode('ORAL')}
                                            className={`px-3 py-1 rounded text-xs font-bold ${gameState.round3Mode === 'ORAL' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-white'}`}
                                        >ORAL</button>
                                        <button
                                            onClick={() => actions.setRound3Mode('QUIZ')}
                                            className={`px-3 py-1 rounded text-xs font-bold ${gameState.round3Mode === 'QUIZ' ? 'bg-purple-600 text-white' : 'text-gray-500 hover:text-white'}`}
                                        >QUIZ</button>
                                    </div>

                                    {gameState.round3Mode === 'QUIZ' ? (
                                        <button
                                            onClick={() => {
                                                if (!gameState.showAnswer) playSound('CORRECT');
                                                actions.autoGradeQuiz();
                                            }}
                                            className={`px-4 py-2 rounded-lg flex items-center gap-2 font-bold transition-all shadow-md ${gameState.showAnswer ? 'bg-gray-600 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500 text-white animate-pulse'}`}
                                            disabled={gameState.showAnswer}
                                        >
                                            <CheckCircle size={18} /> Check Answer & Auto-Grade
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => actions.toggleShowAnswer()}
                                            className={`px-4 py-2 rounded-lg flex items-center gap-2 font-bold transition-all shadow-md ${gameState.showAnswer ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                                        >
                                            {gameState.showAnswer ? <EyeOff size={18} /> : <Eye size={18} />}
                                            {gameState.showAnswer ? "Hide Answer" : "Show Answer"}
                                        </button>
                                    )}

                                    <button onClick={() => actions.clearQuestion()} className="p-2 bg-gray-800 text-red-400 hover:bg-red-900 rounded-lg"><XCircle size={20} /></button>
                                </div>
                            )}
                        </div>
                        {gameState.activeQuestion ? (
                            <div className="animate-in fade-in duration-300">
                                <div className="text-white text-2xl font-bold mb-3 leading-tight w-2/3">{gameState.activeQuestion.content}</div>

                                {/* Options Grid for Teacher View in Quiz Mode */}
                                {gameState.round3Mode === 'QUIZ' && gameState.activeQuestion.options && (
                                    <div className="grid grid-cols-2 gap-4 mt-4 w-3/4">
                                        {gameState.activeQuestion.options.map((opt, idx) => (
                                            <div key={idx} className={`p-3 rounded border ${gameState.showAnswer && opt === gameState.activeQuestion?.answer ? 'bg-green-900 border-green-500' : 'bg-slate-800 border-gray-600'}`}>
                                                <span className="font-bold mr-2 text-gray-400">{String.fromCharCode(65 + idx)}.</span>
                                                {opt}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="inline-flex items-center gap-2 bg-black/40 px-4 py-2 rounded-lg border border-green-500/30 mt-4">
                                    <span className="text-green-400 font-mono text-sm uppercase font-bold">Đáp án:</span>
                                    <span className="text-white font-bold">{gameState.activeQuestion.answer}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="text-gray-500 italic text-center py-6">Chọn gói câu hỏi từ danh sách học sinh phía dưới hoặc Ngân hàng để bắt đầu.</div>
                        )}
                    </div>

                    <div className="space-y-4">
                        {gameState.players.map(p => (
                            <div key={p.id} className={`bg-gray-800 p-5 rounded-xl border-2 transition-all ${gameState.round3TurnPlayerId === p.id ? 'border-cyber-primary bg-slate-800' : 'border-gray-700 opacity-80'}`}>
                                <div className="flex justify-between items-center mb-5">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-cyber-primary">{p.name.charAt(0)}</div>
                                        <div className="flex flex-col">
                                            <h3 className="text-xl font-bold">{p.name}</h3>
                                            {/* Show student selection status in Quiz Mode */}
                                            {gameState.round3Mode === 'QUIZ' && gameState.round3TurnPlayerId === p.id && (
                                                <div className="text-xs font-mono">
                                                    Status: {p.round3QuizAnswer ? <span className="text-green-400">ANSWERED</span> : <span className="text-yellow-400 animate-pulse">THINKING...</span>}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {gameState.round3TurnPlayerId === p.id ? (
                                        <span className="text-cyber-primary font-black animate-pulse flex items-center gap-2"><Zap size={18} /> CURRENT TURN</span>
                                    ) : (
                                        <button onClick={() => actions.setRound3Turn(p.id)} className="px-5 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-bold disabled:opacity-30" disabled={!p.round3PackLocked}>Mở lượt trả lời</button>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {p.round3Pack.map((item, idx) => {
                                        const points = item.difficulty === 'EASY' ? 20 : item.difficulty === 'MEDIUM' ? 30 : 40;
                                        const penalty = item.difficulty === 'EASY' ? -10 : item.difficulty === 'MEDIUM' ? -15 : -20;

                                        let statusIcon = null;
                                        if (item.status === 'CORRECT') statusIcon = <CheckCircle size={14} />;
                                        else if (item.status === 'WRONG') statusIcon = <XCircle size={14} />;
                                        else if (item.status === 'SKIP') statusIcon = <SkipForward size={14} />;

                                        return (
                                            <div key={idx} className="bg-black/30 p-4 rounded-xl border border-gray-700 flex flex-col gap-4 relative overflow-hidden">
                                                <div className="flex justify-between items-center">
                                                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${item.difficulty === 'EASY' ? 'bg-green-900/40 text-green-400' : item.difficulty === 'MEDIUM' ? 'bg-yellow-900/40 text-yellow-400' : 'bg-red-900/40 text-red-400'}`}>{item.difficulty}</span>

                                                    {/* STATUS BADGE for History */}
                                                    {item.status !== 'PENDING' && (
                                                        <div className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-bold flex items-center gap-1
                                                   ${item.status === 'CORRECT' ? 'bg-green-600 text-white' :
                                                                item.status === 'WRONG' ? 'bg-red-600 text-white' : 'bg-gray-600 text-gray-300'}`}>
                                                            {item.status} {statusIcon}
                                                        </div>
                                                    )}

                                                    {item.status === 'PENDING' && (
                                                        <button onClick={() => actions.revealRound3Question(item.difficulty)} className="p-1.5 text-cyber-primary hover:bg-slate-700 rounded-lg transition-colors" title="Hiện câu hỏi"><Eye size={20} /></button>
                                                    )}
                                                </div>

                                                {/* Mode Indicator History */}
                                                {item.questionMode && (
                                                    <div className="text-[10px] text-gray-500 font-mono mt-1">
                                                        MODE: {item.questionMode}
                                                    </div>
                                                )}

                                                {/* Manual Grading Buttons */}
                                                {gameState.activeQuestion && gameState.round3TurnPlayerId === p.id && item.status === 'PENDING' && (
                                                    <div className="grid grid-cols-3 gap-1 mt-2">
                                                        <button
                                                            onClick={() => {
                                                                playSound('CORRECT');
                                                                let delta = points;
                                                                actions.gradeRound3Question(p.id, idx, 'CORRECT', delta);
                                                            }}
                                                            className="py-2 bg-green-900/50 hover:bg-green-600 border border-green-700 text-green-200 hover:text-white rounded text-[10px] font-bold"
                                                        >CORRECT</button>
                                                        <button
                                                            onClick={() => {
                                                                playSound('WRONG');
                                                                let delta = penalty;
                                                                actions.gradeRound3Question(p.id, idx, 'WRONG', delta);
                                                            }}
                                                            className="py-2 bg-red-900/50 hover:bg-red-600 border border-red-700 text-red-200 hover:text-white rounded text-[10px] font-bold"
                                                        >WRONG</button>
                                                        <button
                                                            onClick={() => {
                                                                actions.gradeRound3Question(p.id, idx, 'SKIP', 0);
                                                            }}
                                                            className="py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 text-gray-300 hover:text-white rounded text-[10px] font-bold"
                                                        >SKIP</button>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {gameState.round3TurnPlayerId === p.id && (
                                    <div className="mt-5 flex gap-3">
                                        <button onClick={() => actions.startRound3Timer('MAIN')} className="flex-1 bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all"><Timer size={18} /> {getDynamicTimerDuration(gameState.activeQuestion?.difficulty)}s Answer</button>
                                        <button onClick={() => actions.startRound3Timer('STEAL')} className="flex-1 bg-orange-600 hover:bg-orange-500 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all"><Zap size={18} /> 15s Steal</button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="pt-12 text-center">
                        <button onClick={() => { playSound('VICTORY'); actions.endGame(); }} className="px-12 py-6 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full font-black text-2xl hover:scale-105 transition-all shadow-[0_0_40px_rgba(234,179,8,0.3)]">🏆 KẾT THÚC & VINH DANH</button>
                    </div>
                </div>
            )}

            {/* GAME OVER VIEW */}
            {gameState.round === GameRound.GAME_OVER && (
                <div className="flex flex-col items-center justify-center min-h-[50vh] animate-in zoom-in duration-500">
                    <Trophy size={100} className="text-yellow-400 mb-6 drop-shadow-[0_0_30px_rgba(250,204,21,0.5)] animate-bounce" />
                    <h2 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600 mb-8 uppercase tracking-tighter">
                        Competition Finished
                    </h2>
                    <div className="bg-gray-800 p-8 rounded-2xl border border-yellow-500/30 shadow-2xl max-w-2xl w-full">
                        <h3 className="text-2xl font-bold mb-6 text-center text-white border-b border-gray-700 pb-4">FINAL LEADERBOARD</h3>
                        <div className="space-y-4">
                            {gameState.players
                                .sort((a, b) => b.score - a.score)
                                .slice(0, 5)
                                .map((p, index) => (
                                    <div key={p.id} className={`flex items-center justify-between p-4 rounded-xl border ${index === 0 ? 'bg-yellow-900/20 border-yellow-500' : index === 1 ? 'bg-slate-700 border-gray-400' : index === 2 ? 'bg-orange-900/20 border-orange-500' : 'bg-gray-800 border-gray-700'}`}>
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xl 
                                                ${index === 0 ? 'bg-yellow-500 text-black shadow-[0_0_15px_rgba(234,179,8,0.8)]' :
                                                    index === 1 ? 'bg-gray-400 text-black' :
                                                        index === 2 ? 'bg-orange-500 text-black' : 'bg-gray-700 text-gray-400'}`}>
                                                {index + 1}
                                            </div>
                                            <span className={`text-xl font-bold ${index === 0 ? 'text-yellow-400' : 'text-white'}`}>{p.name}</span>
                                        </div>
                                        <div className="font-mono font-black text-2xl text-white">
                                            {p.score} <span className="text-sm text-gray-500">pts</span>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeacherDashboard;
