
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { GameState, GameRound, Question, Player, Difficulty, PackStatus, QuestionCategory } from '../types';
import { ROUND_1_QUESTIONS, ROUND_2_QUESTIONS, ROUND_3_QUESTIONS } from '../data/questions';
import { SOUND_EFFECTS } from '../config/assets';
import { Play, Check, X, Sparkles, RefreshCw, PlusCircle, MinusCircle, Code, Eye, Timer, User, Zap, Users, Monitor, Trophy, LogOut, Filter, CheckCircle, Pointer, Shuffle, ListOrdered, ChevronDown, ChevronUp, Database, EyeOff, XCircle } from 'lucide-react';

interface Props {
  gameState: GameState;
  actions: any;
  onLeave: () => void;
}

const TeacherDashboard: React.FC<Props> = ({ gameState, actions, onLeave }) => {
  const [customPrompt, setCustomPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [showR3Bank, setShowR3Bank] = useState(false);
  
  // Hàm phát âm thanh cải tiến để đảm bảo hoạt động ngay lập tức
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

  const getDynamicTimerDuration = (difficulty?: Difficulty) => {
      switch(difficulty) {
          case 'EASY': return 20;
          case 'MEDIUM': return 60;
          case 'HARD': return 120;
          default: return 25;
      }
  };

  const RoundControl = () => (
    <div className="grid grid-cols-4 gap-4 mb-8">
        <button onClick={() => actions.setRound(GameRound.LOBBY)} className={`p-3 rounded font-bold transition-all hover:scale-105 ${gameState.round === GameRound.LOBBY ? 'bg-cyber-primary text-black' : 'bg-gray-700'}`}>LOBBY</button>
        <button onClick={() => actions.setRound(GameRound.ROUND_1)} className={`p-3 rounded font-bold transition-all hover:scale-105 ${gameState.round === GameRound.ROUND_1 ? 'bg-cyber-primary text-black' : 'bg-gray-700'}`}>R1: REFLEX</button>
        <button onClick={() => actions.setRound(GameRound.ROUND_2)} className={`p-3 rounded font-bold transition-all hover:scale-105 ${gameState.round === GameRound.ROUND_2 ? 'bg-cyber-primary text-black' : 'bg-gray-700'}`}>R2: OBSTACLE</button>
        <button onClick={() => actions.setRound(GameRound.ROUND_3)} className={`p-3 rounded font-bold transition-all hover:scale-105 ${gameState.round === GameRound.ROUND_3 ? 'bg-cyber-primary text-black' : 'bg-gray-700'}`}>R3: FINISH</button>
    </div>
  );

  const PlayerManager = () => (
    <div className="bg-gray-800 p-4 rounded-lg mb-6 shadow-lg">
        <h3 className="text-gray-400 font-bold mb-2">Live Score Adjustment</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {gameState.players.map(p => (
                <div key={p.id} className={`p-2 rounded border flex justify-between items-center transition-colors ${p.buzzedAt ? 'bg-yellow-900/50 border-yellow-500 animate-pulse' : 'border-gray-600 bg-gray-700/50'}`}>
                    <span className="truncate w-20 font-bold">{p.name}</span>
                    <div className="flex items-center gap-1">
                        <button onClick={() => { playSound('SCORE_DOWN'); actions.updateScore(p.id, -10); }} className="text-red-400 p-1"><MinusCircle size={16}/></button>
                        <span className="w-8 text-center font-mono font-bold">{p.score}</span>
                        <button onClick={() => { playSound('SCORE_UP'); actions.updateScore(p.id, 10); }} className="text-green-400 p-1"><PlusCircle size={16}/></button>
                    </div>
                </div>
            ))}
        </div>
        <div className="flex gap-2 mt-4">
             <button onClick={() => actions.clearBuzzers()} className="px-3 py-1 bg-gray-600 rounded text-sm">Reset Buzzers</button>
             <button onClick={() => actions.stopTimer()} className="px-3 py-1 bg-red-900 rounded text-sm">Stop Timer</button>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-cyber-dark text-white p-6 pb-24">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-cyber-primary">Teacher Control Panel</h1>
        <button onClick={onLeave} className="flex items-center gap-2 px-4 py-2 bg-red-600 rounded"><LogOut size={18} /> Exit</button>
      </header>

      <RoundControl />
      <PlayerManager />

      {/* ROUND 1 VIEW */}
      {gameState.round === GameRound.ROUND_1 && (
          <div className="space-y-4">
               <div className="flex justify-between items-center">
                   <h2 className="text-xl font-bold flex items-center gap-2"><Sparkles className="text-yellow-400"/> Round 1: Reflex Quiz</h2>
               </div>
               <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 mb-4">
                    <h3 className="text-gray-300 font-bold mb-3">Select Student for Turn:</h3>
                    <div className="flex flex-wrap gap-2">
                        {gameState.players.map(p => (
                            <button key={p.id} onClick={() => actions.setRound1Turn(gameState.round1TurnPlayerId === p.id ? null : p.id)} className={`px-4 py-2 rounded-full font-bold border-2 ${gameState.round1TurnPlayerId === p.id ? 'bg-cyber-primary text-black border-cyber-primary' : 'border-gray-600 text-gray-300'}`}>{p.name}</button>
                        ))}
                    </div>
               </div>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                   {ROUND_1_QUESTIONS.filter(q => !gameState.usedQuestionIds.includes(q.id)).map(q => (
                       <button key={q.id} onClick={() => actions.setQuestion(q)} className={`p-4 rounded text-left border ${gameState.activeQuestion?.id === q.id ? 'border-cyber-primary bg-slate-800' : 'border-gray-600 bg-gray-800'}`}>
                           <div className="font-bold mb-1">{q.content}</div>
                           <div className="text-xs text-green-400">{q.answer}</div>
                       </button>
                   ))}
               </div>
               {gameState.activeQuestion && (
                   <div className="fixed bottom-0 left-0 w-full bg-gray-900 p-4 border-t border-gray-700 flex justify-center gap-4 z-50 shadow-2xl">
                       <button onClick={() => actions.startTimer(5)} className="px-6 py-3 bg-blue-600 rounded font-bold shadow-lg hover:bg-blue-500">Start 5s Timer</button>
                       <button onClick={() => actions.toggleShowAnswer()} className={`px-6 py-3 rounded font-bold border ${gameState.showAnswer ? 'bg-green-600 border-green-400' : 'bg-gray-700 border-gray-600'}`}>
                           {gameState.showAnswer ? "Hide Answer" : "Show Answer"}
                       </button>
                       <button onClick={() => actions.clearQuestion()} className="px-6 py-3 bg-gray-600 rounded font-bold">Clear Question</button>
                   </div>
               )}
          </div>
      )}

      {/* ROUND 3 VIEW */}
      {gameState.round === GameRound.ROUND_3 && (
          <div className="space-y-8">
              <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold flex items-center gap-2"><Sparkles className="text-cyber-secondary"/> Round 3: Tactical Finish</h2>
                  <button onClick={() => setShowR3Bank(!showR3Bank)} className="px-3 py-1.5 bg-gray-700 rounded text-sm">Question Bank</button>
              </div>

              {/* BẢNG ĐIỀU KHIỂN CÂU HỎI ĐANG CHẠY (BỔ SUNG SHOW ANSWER) */}
              <div className="bg-slate-900 border border-cyber-primary rounded-xl p-6 shadow-xl">
                  <div className="flex items-center justify-between mb-4 border-b border-gray-700 pb-3">
                      <div className="flex items-center gap-2 text-cyber-primary font-bold uppercase tracking-widest text-sm">
                          <Monitor size={18} /> Question Monitor
                      </div>
                      {gameState.activeQuestion && (
                          <div className="flex gap-2">
                              <button 
                                  onClick={() => actions.toggleShowAnswer()} 
                                  className={`px-4 py-2 rounded-lg flex items-center gap-2 font-bold transition-all shadow-md ${gameState.showAnswer ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                              >
                                  {gameState.showAnswer ? <EyeOff size={18}/> : <Eye size={18}/>}
                                  {gameState.showAnswer ? "Hide Answer" : "Show Answer"}
                              </button>
                              <button onClick={() => actions.clearQuestion()} className="p-2 bg-gray-800 text-red-400 hover:bg-red-900 rounded-lg"><XCircle size={20}/></button>
                          </div>
                      )}
                  </div>
                  {gameState.activeQuestion ? (
                      <div className="animate-in fade-in duration-300">
                          <div className="text-white text-2xl font-bold mb-3 leading-tight">{gameState.activeQuestion.content}</div>
                          <div className="inline-flex items-center gap-2 bg-black/40 px-4 py-2 rounded-lg border border-green-500/30">
                              <span className="text-green-400 font-mono text-sm uppercase font-bold">Đáp án:</span>
                              <span className="text-white font-bold">{gameState.activeQuestion.answer}</span>
                          </div>
                      </div>
                  ) : (
                      <div className="text-gray-500 italic text-center py-6">Chọn gói câu hỏi từ danh sách học sinh phía dưới để bắt đầu.</div>
                  )}
              </div>
              
              <div className="space-y-4">
                  {gameState.players.map(p => (
                      <div key={p.id} className={`bg-gray-800 p-5 rounded-xl border-2 transition-all ${gameState.round3TurnPlayerId === p.id ? 'border-cyber-primary bg-slate-800' : 'border-gray-700 opacity-80'}`}>
                           <div className="flex justify-between items-center mb-5">
                               <div className="flex items-center gap-3">
                                   <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-cyber-primary">{p.name.charAt(0)}</div>
                                   <h3 className="text-xl font-bold">{p.name}</h3>
                               </div>
                               {gameState.round3TurnPlayerId === p.id ? (
                                   <span className="text-cyber-primary font-black animate-pulse flex items-center gap-2"><Zap size={18}/> CURRENT TURN</span>
                               ) : (
                                   <button onClick={() => actions.setRound3Turn(p.id)} className="px-5 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-bold disabled:opacity-30" disabled={!p.round3PackLocked}>Mở lượt trả lời</button>
                               )}
                           </div>
                           
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                               {p.round3Pack.map((item, idx) => {
                                   const points = item.difficulty === 'EASY' ? 20 : item.difficulty === 'MEDIUM' ? 30 : 40;
                                   const penalty = item.difficulty === 'EASY' ? -10 : item.difficulty === 'MEDIUM' ? -15 : -20;
                                   return (
                                   <div key={idx} className="bg-black/30 p-4 rounded-xl border border-gray-700 flex flex-col gap-4">
                                       <div className="flex justify-between items-center">
                                           <span className={`text-xs font-bold px-3 py-1 rounded-full ${item.difficulty === 'EASY' ? 'bg-green-900/40 text-green-400' : item.difficulty === 'MEDIUM' ? 'bg-yellow-900/40 text-yellow-400' : 'bg-red-900/40 text-red-400'}`}>{item.difficulty}</span>
                                           <button onClick={() => actions.revealRound3Question(item.difficulty)} className="p-1.5 text-cyber-primary hover:bg-slate-700 rounded-lg transition-colors" title="Hiện câu hỏi"><Eye size={20}/></button>
                                       </div>
                                       <div className="grid grid-cols-2 gap-2">
                                            <button 
                                                onClick={() => {
                                                    playSound('CORRECT');
                                                    let delta = (item.status === 'PENDING') ? points : (item.status === 'WRONG' ? points - penalty : 0);
                                                    actions.gradeRound3Question(p.id, idx, 'CORRECT', delta);
                                                }}
                                                className={`py-3 rounded-lg text-xs font-bold border transition-all ${item.status === 'CORRECT' ? 'bg-green-600 border-white text-white scale-105 shadow-lg' : 'bg-slate-800 border-gray-600 text-gray-500'}`}
                                            >CORRECT</button>
                                            <button 
                                                onClick={() => {
                                                    playSound('WRONG');
                                                    let delta = (item.status === 'PENDING') ? penalty : (item.status === 'CORRECT' ? penalty - points : 0);
                                                    actions.gradeRound3Question(p.id, idx, 'WRONG', delta);
                                                }}
                                                className={`py-3 rounded-lg text-xs font-bold border transition-all ${item.status === 'WRONG' ? 'bg-red-600 border-white text-white scale-105 shadow-lg' : 'bg-slate-800 border-gray-600 text-gray-500'}`}
                                            >WRONG</button>
                                       </div>
                                   </div>
                               );})}
                           </div>

                           {gameState.round3TurnPlayerId === p.id && (
                               <div className="mt-5 flex gap-3">
                                   <button onClick={() => actions.startRound3Timer('MAIN')} className="flex-1 bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all"><Timer size={18}/> {getDynamicTimerDuration(gameState.activeQuestion?.difficulty)}s Answer</button>
                                   <button onClick={() => actions.startRound3Timer('STEAL')} className="flex-1 bg-orange-600 hover:bg-orange-500 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all"><Zap size={18}/> 15s Steal</button>
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
    </div>
  );
};

export default TeacherDashboard;
