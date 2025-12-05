
import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { GameState, GameRound, Question, Player, Difficulty, PackStatus, QuestionCategory } from '../types';
import { ROUND_1_QUESTIONS, ROUND_2_QUESTIONS, ROUND_3_QUESTIONS } from '../data/questions';
import { SOUND_EFFECTS } from '../config/assets';
import { Play, Check, X, Sparkles, RefreshCw, PlusCircle, MinusCircle, Code, Eye, Timer, User, Zap, Users, Monitor, Trophy, LogOut, Filter, CheckCircle, Pointer, Shuffle, ListOrdered, ChevronDown, ChevronUp, Database, EyeOff } from 'lucide-react';

interface Props {
  gameState: GameState;
  actions: any;
  onLeave: () => void;
}

const TeacherDashboard: React.FC<Props> = ({ gameState, actions, onLeave }) => {
  const [customPrompt, setCustomPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [viewingPlayerCode, setViewingPlayerCode] = useState<Player | null>(null);
  const [showR3Bank, setShowR3Bank] = useState(false);
  
  const [r1Difficulty, setR1Difficulty] = useState<Difficulty | 'ALL'>('ALL');
  const [r2Category, setR2Category] = useState<QuestionCategory>('LOGIC');
  const [r2Difficulty, setR2Difficulty] = useState<Difficulty | 'ALL'>('ALL');

  const playSound = (type: keyof typeof SOUND_EFFECTS) => {
    const audio = new Audio(SOUND_EFFECTS[type]);
    audio.volume = 0.5;
    audio.play().catch(e => console.error("Audio playback failed:", e));
  };

  useEffect(() => {
    const buzzedPlayers = gameState.players.filter(p => p.buzzedAt);
  }, [gameState.players]);

  const generateAIQuestion = async () => {
    if (!process.env.API_KEY) {
        alert("API_KEY not found in environment. Please add it to your .env or metadata.");
        return;
    }
    setAiLoading(true);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: customPrompt || "Generate a tough JavaScript interview question for a junior developer. Keep it short.",
        });
        
        const newQ: Question = {
            id: `ai-${Date.now()}`,
            content: response.text || "Error generating content",
            points: 50,
            difficulty: 'HARD'
        };
        actions.setQuestion(newQ);
    } catch (error) {
        console.error("Gemini Error:", error);
        alert("Failed to generate question via Gemini.");
    } finally {
        setAiLoading(false);
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
                        <button 
                            onClick={() => { actions.updateScore(p.id, -10); playSound('SCORE_DOWN'); }} 
                            className="text-red-400 hover:text-white hover:bg-red-600 p-1 rounded transition-colors"
                        >
                            <MinusCircle size={16}/>
                        </button>
                        <span className="w-8 text-center font-mono font-bold">{p.score}</span>
                        <button 
                            onClick={() => { actions.updateScore(p.id, 10); playSound('SCORE_UP'); }} 
                            className="text-green-400 hover:text-white hover:bg-green-600 p-1 rounded transition-colors"
                        >
                            <PlusCircle size={16}/>
                        </button>
                    </div>
                </div>
            ))}
        </div>
        <div className="flex gap-2 mt-4">
             <button onClick={() => { actions.clearBuzzers(); playSound('SCORE_DOWN'); }} className="px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm">Reset Buzzers</button>
             <button onClick={() => { actions.stopTimer(); playSound('SCORE_DOWN'); }} className="px-3 py-1 bg-red-900 hover:bg-red-700 text-red-100 rounded text-sm">Stop Timer</button>
        </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-cyber-dark text-white p-6 pb-24">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-cyber-primary">Teacher Control Panel</h1>
        <button 
            onClick={onLeave}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition-colors"
        >
            <LogOut size={18} /> Exit
        </button>
      </header>

      <RoundControl />
      <PlayerManager />

      {/* LOBBY VIEW */}
      {gameState.round === GameRound.LOBBY && (
          <div className="bg-slate-800 rounded-xl p-8 border border-gray-700 text-center">
              <Users size={64} className="mx-auto text-cyber-primary mb-4" />
              <h2 className="text-3xl font-bold mb-2">Student Lobby</h2>
              <div className="flex justify-center items-center gap-2 mb-8 text-gray-400">
                  <p>Waiting for contestants to join...</p>
                  <button onClick={() => actions.forceSync()} className="p-1 hover:bg-gray-700 rounded"><RefreshCw size={14}/></button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {gameState.players.length === 0 ? (
                      <div className="col-span-full border-2 border-dashed border-gray-700 rounded-lg p-8 text-gray-500 font-mono">
                          No players connected yet.
                      </div>
                  ) : (
                      gameState.players.map((p, i) => (
                          <div key={p.id} className="bg-slate-700 p-4 rounded-lg flex items-center justify-between border border-cyber-primary animate-bounce-short">
                              <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-cyber-primary text-black flex items-center justify-center font-bold">
                                      {i + 1}
                                  </div>
                                  <span className="font-bold text-lg">{p.name}</span>
                              </div>
                              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">ONLINE</span>
                          </div>
                      ))
                  )}
              </div>

              <div className="mt-12">
                  <button 
                      onClick={() => actions.setRound(GameRound.ROUND_1)}
                      className="px-8 py-4 bg-cyber-primary text-black text-xl font-bold rounded hover:scale-105 transition-transform flex items-center gap-2 mx-auto"
                  >
                      START ROUND 1 <Play size={24} fill="black" />
                  </button>
              </div>
          </div>
      )}

      {/* ROUND 1 VIEW */}
      {gameState.round === GameRound.ROUND_1 && (
          <div className="space-y-4">
               <div className="flex justify-between items-center">
                   <h2 className="text-xl font-bold flex items-center gap-2"><Sparkles className="text-yellow-400"/> Round 1: Reflex Quiz</h2>
                   <div className="text-gray-400 text-sm italic">
                       Used: {gameState.usedQuestionIds.filter(id => ROUND_1_QUESTIONS.some(q => q.id === id)).length} / {ROUND_1_QUESTIONS.length}
                   </div>
               </div>

               {/* STUDENT SELECTION BAR */}
               <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <h3 className="text-gray-300 font-bold mb-3 flex items-center gap-2">
                        <Pointer size={16} /> Select Student to Answer:
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {gameState.players.map(p => (
                            <button
                                key={p.id}
                                onClick={() => actions.setRound1Turn(gameState.round1TurnPlayerId === p.id ? null : p.id)}
                                className={`px-4 py-2 rounded-full font-bold border-2 transition-all ${
                                    gameState.round1TurnPlayerId === p.id 
                                    ? 'bg-cyber-primary text-black border-cyber-primary shadow-[0_0_10px_#06b6d4]' 
                                    : 'bg-transparent border-gray-600 hover:border-gray-400 text-gray-300'
                                }`}
                            >
                                {p.name} {gameState.round1TurnPlayerId === p.id && "(Active)"}
                            </button>
                        ))}
                        <button 
                            onClick={() => actions.setRound1Turn(null)}
                            className="px-4 py-2 rounded-full font-bold border-2 border-transparent hover:bg-gray-700 text-gray-400 text-sm"
                        >
                            Clear Selection
                        </button>
                    </div>
               </div>

               {/* DIFFICULTY FILTER */}
               <div className="flex gap-2 pb-2">
                    <button onClick={() => setR1Difficulty('ALL')} className={`px-4 py-2 rounded-lg font-bold text-sm border transition-colors ${r1Difficulty === 'ALL' ? 'bg-white text-black border-white' : 'bg-gray-800 border-gray-600 text-gray-400'}`}>ALL</button>
                    <button onClick={() => setR1Difficulty('EASY')} className={`px-4 py-2 rounded-lg font-bold text-sm border transition-colors ${r1Difficulty === 'EASY' ? 'bg-green-600 text-white border-green-500' : 'bg-gray-800 border-gray-600 text-gray-400'}`}>EASY</button>
                    <button onClick={() => setR1Difficulty('MEDIUM')} className={`px-4 py-2 rounded-lg font-bold text-sm border transition-colors ${r1Difficulty === 'MEDIUM' ? 'bg-yellow-600 text-white border-yellow-500' : 'bg-gray-800 border-gray-600 text-gray-400'}`}>MEDIUM</button>
                    <button onClick={() => setR1Difficulty('HARD')} className={`px-4 py-2 rounded-lg font-bold text-sm border transition-colors ${r1Difficulty === 'HARD' ? 'bg-red-600 text-white border-red-500' : 'bg-gray-800 border-gray-600 text-gray-400'}`}>HARD</button>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-[500px] overflow-y-auto pr-2">
                   {ROUND_1_QUESTIONS
                    .filter(q => (!gameState.usedQuestionIds.includes(q.id)) && (r1Difficulty === 'ALL' || q.difficulty === r1Difficulty))
                    .map(q => (
                       <button 
                          key={q.id}
                          onClick={() => actions.setQuestion(q)}
                          className={`p-4 rounded text-left border transition-all hover:bg-slate-700 ${gameState.activeQuestion?.id === q.id ? 'border-cyber-primary bg-slate-800 ring-2 ring-cyber-primary' : 'border-gray-600 bg-gray-800'}`}
                       >
                           <div className="flex justify-between items-start mb-1">
                               <div className="font-bold text-lg">{q.content}</div>
                               <span className={`text-xs font-bold px-2 py-0.5 rounded ml-2 whitespace-nowrap ${
                                   q.difficulty === 'EASY' ? 'bg-green-900 text-green-300' : 
                                   q.difficulty === 'MEDIUM' ? 'bg-yellow-900 text-yellow-300' : 
                                   'bg-red-900 text-red-300'
                               }`}>
                                   {q.difficulty}
                               </span>
                           </div>
                           <div className="text-sm text-gray-400">Ans: <span className="text-green-400">{q.answer}</span></div>
                       </button>
                   ))}
               </div>
               
               {gameState.activeQuestion && (
                   <div className="fixed bottom-0 left-0 w-full bg-gray-900 p-4 border-t border-gray-700 flex justify-center gap-4 z-10 shadow-2xl">
                       <button onClick={() => actions.startTimer(5)} className="px-6 py-3 bg-blue-600 rounded font-bold hover:bg-blue-500 flex items-center gap-2">
                           <Timer size={20}/> Start 5s Timer
                       </button>
                       <button 
                           onClick={() => actions.toggleShowAnswer()} 
                           className={`px-6 py-3 rounded font-bold flex items-center gap-2 border ${
                               gameState.showAnswer ? 'bg-green-900 border-green-500 text-green-100' : 'bg-gray-700 border-gray-500 text-gray-300 hover:bg-gray-600'
                           }`}
                       >
                           {gameState.showAnswer ? <EyeOff size={20}/> : <Eye size={20}/>}
                           {gameState.showAnswer ? "Hide Answer" : "Show Answer"}
                       </button>
                       <button onClick={() => actions.clearQuestion()} className="px-6 py-3 bg-gray-600 rounded font-bold hover:bg-gray-500">
                           Clear Question
                       </button>
                   </div>
               )}
          </div>
      )}

      {/* ROUND 2 VIEW */}
      {gameState.round === GameRound.ROUND_2 && (
          <div className="space-y-6">
              <h2 className="text-xl font-bold flex items-center gap-2"><Code className="text-green-400"/> Round 2: Obstacle Run</h2>
              
              <div className="space-y-2">
                  <div className="flex gap-2 overflow-x-auto pb-2">
                      {(['LOGIC', 'SYNTAX', 'ALGO', 'OUTPUT'] as QuestionCategory[]).map(cat => (
                          <button
                            key={cat}
                            onClick={() => setR2Category(cat)}
                            className={`px-4 py-2 rounded-full font-bold text-sm whitespace-nowrap transition-colors ${r2Category === cat ? 'bg-cyber-primary text-black' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
                          >
                              {cat === 'LOGIC' ? 'Tư duy Logic' : cat === 'SYNTAX' ? 'Lỗi Cú pháp' : cat === 'ALGO' ? 'Sắp xếp Thuật toán' : 'Dự đoán Output'}
                          </button>
                      ))}
                  </div>
                  
                  <div className="flex gap-2 border-t border-gray-700 pt-2">
                        <span className="text-sm text-gray-400 flex items-center px-2">Difficulty:</span>
                        <button onClick={() => setR2Difficulty('ALL')} className={`px-3 py-1 rounded text-xs font-bold transition-colors ${r2Difficulty === 'ALL' ? 'bg-white text-black' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>ALL</button>
                        <button onClick={() => setR2Difficulty('EASY')} className={`px-3 py-1 rounded text-xs font-bold transition-colors ${r2Difficulty === 'EASY' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>EASY</button>
                        <button onClick={() => setR2Difficulty('MEDIUM')} className={`px-3 py-1 rounded text-xs font-bold transition-colors ${r2Difficulty === 'MEDIUM' ? 'bg-yellow-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>MEDIUM</button>
                        <button onClick={() => setR2Difficulty('HARD')} className={`px-3 py-1 rounded text-xs font-bold transition-colors ${r2Difficulty === 'HARD' ? 'bg-red-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}>HARD</button>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 max-h-[300px] overflow-y-auto">
                   {ROUND_2_QUESTIONS
                        .filter(q => q.category === r2Category && !gameState.usedQuestionIds.includes(q.id) && (r2Difficulty === 'ALL' || q.difficulty === r2Difficulty))
                        .map((q) => (
                       <button 
                           key={q.id}
                           onClick={() => actions.setQuestion(q)}
                           className={`p-4 border rounded text-left hover:bg-slate-700 transition-colors ${gameState.activeQuestion?.id === q.id ? 'bg-slate-800 border-cyber-primary ring-1 ring-cyber-primary' : 'bg-gray-800 border-gray-600'}`}
                       >
                           <div className="flex justify-between">
                               <h4 className="font-bold text-cyber-primary mb-1">{q.content}</h4>
                               <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded h-fit ${
                                   q.difficulty === 'EASY' ? 'bg-green-900 text-green-300' : 
                                   q.difficulty === 'MEDIUM' ? 'bg-yellow-900 text-yellow-300' : 
                                   'bg-red-900 text-red-300'
                               }`}>
                                   {q.difficulty}
                               </span>
                           </div>
                           <p className="text-xs text-gray-400 truncate font-mono">{q.answer}</p>
                       </button>
                   ))}
              </div>

              {gameState.activeQuestion && (
                  <div className="bg-slate-800 p-6 rounded-xl border border-gray-700 animate-[fadeIn_0.5s]">
                      <div className="flex justify-between items-start mb-4">
                          <h3 className="text-lg font-bold">Current Challenge: {gameState.activeQuestion.content}</h3>
                          <button 
                            onClick={() => actions.startRound2Timer()} 
                            className="px-6 py-2 bg-purple-600 hover:bg-purple-500 rounded font-bold flex items-center gap-2"
                          >
                              <Play size={18}/> START 25s TIMER
                          </button>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-6">
                          <div>
                                <div className="text-gray-400 text-sm mb-1">Problem:</div>
                                <pre className="bg-black p-4 rounded text-sm font-mono text-gray-300 overflow-x-auto h-40 border border-gray-600">
                                    {gameState.activeQuestion.codeSnippet}
                                </pre>
                          </div>
                          <div>
                                <div className="text-gray-400 text-sm mb-1">Answer Key:</div>
                                <pre className="bg-black p-4 rounded text-sm font-mono text-green-400 overflow-x-auto h-40 border border-green-900">
                                    {gameState.activeQuestion.answer}
                                </pre>
                          </div>
                      </div>
                      <div className="mt-4 flex justify-end">
                           <button onClick={actions.clearQuestion} className="text-red-400 text-sm hover:underline">Close/Clear Question</button>
                      </div>
                  </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {gameState.players.map(p => (
                      <div key={p.id} className={`p-4 rounded border ${p.submittedRound2 ? 'border-green-500 bg-green-900/20' : 'border-gray-700 bg-gray-800'}`}>
                          <div className="flex justify-between items-start mb-2">
                              <span className="font-bold text-lg">{p.name}</span>
                              {p.submittedRound2 && <span className="text-green-400 font-mono text-sm">{p.round2Time?.toFixed(2)}s</span>}
                          </div>
                          <div className="text-sm text-gray-400 mb-3">{p.submittedRound2 ? "Submitted!" : "Solving..."}</div>
                          {p.submittedRound2 && (
                              <button 
                                onClick={() => {
                                    setViewingPlayerCode(p);
                                    actions.setViewingPlayer(p.id); // Sync to big screen
                                }}
                                className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm flex items-center justify-center gap-2"
                              >
                                  <Code size={14}/> View Answer
                              </button>
                          )}
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* ROUND 3 VIEW */}
      {gameState.round === GameRound.ROUND_3 && (
          <div className="space-y-8">
              <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold flex items-center gap-2"><Sparkles className="text-cyber-secondary"/> Round 3: Tactical Finish</h2>
                  
                  <div className="flex gap-4 items-center">
                      <button 
                          onClick={() => setShowR3Bank(!showR3Bank)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-bold transition-all border border-gray-600 ${
                              showR3Bank ? 'bg-gray-700 text-white' : 'bg-transparent text-gray-400 hover:text-white'
                          }`}
                      >
                          <Database size={16} /> {showR3Bank ? 'Hide Question Bank' : 'View Question Bank'}
                      </button>

                      <div className="flex bg-gray-800 p-1 rounded-lg border border-gray-700">
                          <button 
                              onClick={() => actions.setRound3SelectionMode('RANDOM')}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-bold transition-all ${
                                  gameState.round3SelectionMode === 'RANDOM' 
                                  ? 'bg-cyber-secondary text-white shadow-sm' 
                                  : 'text-gray-400 hover:text-white'
                              }`}
                          >
                              <Shuffle size={14} /> Random
                          </button>
                          <button 
                              onClick={() => actions.setRound3SelectionMode('SEQUENTIAL')}
                              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-bold transition-all ${
                                  gameState.round3SelectionMode === 'SEQUENTIAL' 
                                  ? 'bg-cyber-secondary text-white shadow-sm' 
                                  : 'text-gray-400 hover:text-white'
                              }`}
                          >
                              <ListOrdered size={14} /> Sequential
                          </button>
                      </div>
                  </div>
              </div>

              {showR3Bank && (
                  <div className="bg-slate-900 border border-gray-700 rounded-lg p-4 animate-[slideDown_0.3s]">
                      <h3 className="text-gray-400 font-bold mb-4 flex items-center gap-2">
                          <Database size={16} /> Question Bank Preview
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-80 overflow-y-auto pr-2 custom-scrollbar">
                          {(['EASY', 'MEDIUM', 'HARD'] as Difficulty[]).map(diff => (
                              <div key={diff} className="space-y-2">
                                  <h4 className={`text-sm font-bold border-b pb-2 mb-2 sticky top-0 bg-slate-900 z-10 ${
                                      diff === 'EASY' ? 'text-green-400 border-green-800' :
                                      diff === 'MEDIUM' ? 'text-yellow-400 border-yellow-800' :
                                      'text-red-400 border-red-800'
                                  }`}>
                                      {diff} QUESTIONS
                                  </h4>
                                  {ROUND_3_QUESTIONS.filter(q => q.difficulty === diff).map(q => {
                                      const isUsed = gameState.usedQuestionIds.includes(q.id);
                                      const isActive = gameState.activeQuestion?.id === q.id;
                                      return (
                                          <div 
                                              key={q.id} 
                                              className={`p-3 rounded text-sm border transition-all cursor-pointer group relative ${
                                                  isActive ? 'bg-blue-900/40 border-blue-500' :
                                                  isUsed ? 'bg-gray-800/50 border-transparent opacity-50' : 
                                                  'bg-gray-800 border-gray-700 hover:border-gray-500'
                                              }`}
                                              onClick={() => actions.setQuestion(q)}
                                          >
                                              <div className="font-bold mb-1 group-hover:text-cyber-primary transition-colors">{q.content}</div>
                                              <div className="text-xs text-gray-500 font-mono">{q.answer}</div>
                                              {isActive && <div className="absolute top-2 right-2 text-blue-400"><Eye size={14}/></div>}
                                          </div>
                                      );
                                  })}
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              <div className="bg-slate-900 border border-cyber-primary rounded-lg p-4 relative">
                  <div className="flex items-center gap-2 mb-2 text-cyber-primary font-bold">
                      <Monitor size={18} /> ACTIVE QUESTION (HOST MONITOR)
                  </div>
                  {gameState.activeQuestion ? (
                      <div className="pr-12">
                          <div className="text-white text-lg font-bold mb-2">{gameState.activeQuestion.content}</div>
                          <div className="text-green-400 font-mono text-sm">Answer: {gameState.activeQuestion.answer}</div>
                          <button 
                             onClick={() => { actions.clearQuestion(); playSound('SCORE_DOWN'); }}
                             className="absolute top-4 right-4 p-2 bg-gray-800 hover:bg-red-900 rounded text-gray-400 hover:text-red-400 transition-colors"
                             title="Clear Question"
                          >
                              <X size={20} />
                          </button>
                      </div>
                  ) : (
                      <div className="text-gray-500 italic">No question currently active on screen.</div>
                  )}
              </div>
              
              <div className="space-y-4">
                  {gameState.players.map(p => (
                      <div key={p.id} className={`bg-gray-800 p-4 rounded-lg border-2 ${gameState.round3TurnPlayerId === p.id ? 'border-cyber-primary shadow-[0_0_15px_rgba(6,182,212,0.3)]' : 'border-gray-700'}`}>
                           <div className="flex justify-between items-center mb-4">
                               <h3 className="text-xl font-bold flex items-center gap-2">
                                   <User size={20}/> {p.name}
                               </h3>
                               
                               {!p.round3PackLocked ? (
                                   <span className="text-yellow-500 text-sm italic flex items-center gap-1">
                                       <RefreshCw size={14} className="animate-spin" /> Selecting Pack...
                                   </span>
                               ) : (
                                   <span className="text-green-500 text-sm flex items-center gap-1">
                                       <CheckCircle size={14}/> Pack Locked
                                   </span>
                               )}

                               {gameState.round3TurnPlayerId === p.id ? (
                                   <div className="text-cyber-primary font-bold animate-pulse">CURRENT TURN</div>
                               ) : (
                                   <button 
                                      onClick={() => actions.setRound3Turn(p.id)}
                                      className="px-4 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm font-bold uppercase disabled:opacity-50"
                                      disabled={!p.round3PackLocked}
                                   >
                                      Start Turn
                                   </button>
                               )}
                           </div>
                           
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                               {p.round3Pack.map((item, idx) => (
                                   <div key={idx} className="bg-black/40 p-3 rounded border border-gray-700 flex flex-col gap-2">
                                       <div className="flex justify-between items-center">
                                           <span className={`text-xs font-bold px-2 py-0.5 rounded ${item.difficulty === 'EASY' ? 'bg-green-900 text-green-300' : item.difficulty === 'MEDIUM' ? 'bg-yellow-900 text-yellow-300' : 'bg-red-900 text-red-300'}`}>
                                               {item.difficulty}
                                           </span>
                                           <button 
                                              onClick={() => actions.revealRound3Question(item.difficulty)}
                                              title="Reveal Question"
                                              className="p-1 hover:bg-gray-700 rounded text-cyber-primary"
                                           >
                                               <Eye size={16}/>
                                           </button>
                                       </div>
                                       
                                       {item.status === 'PENDING' ? (
                                           <div className="flex gap-1 mt-1">
                                                <button 
                                                    onClick={() => {
                                                        actions.updatePlayerPack(p.id, idx, { status: 'CORRECT' });
                                                        actions.updateScore(p.id, item.difficulty === 'EASY' ? 20 : item.difficulty === 'MEDIUM' ? 30 : 40);
                                                        playSound('CORRECT');
                                                    }}
                                                    className="flex-1 bg-green-900/50 hover:bg-green-600 text-green-400 hover:text-white py-2 rounded text-xs font-bold transition-all hover:scale-105 shadow-sm hover:shadow-green-500/50"
                                                >
                                                    CORRECT
                                                </button>
                                                <button 
                                                    onClick={() => {
                                                        actions.updatePlayerPack(p.id, idx, { status: 'WRONG' });
                                                        actions.updateScore(p.id, item.difficulty === 'EASY' ? -10 : item.difficulty === 'MEDIUM' ? -15 : -20);
                                                        playSound('WRONG');
                                                    }}
                                                    className="flex-1 bg-red-900/50 hover:bg-red-600 text-red-400 hover:text-white py-2 rounded text-xs font-bold transition-all hover:scale-105 shadow-sm hover:shadow-red-500/50"
                                                >
                                                    WRONG
                                                </button>
                                           </div>
                                       ) : (
                                           <div className={`text-center font-bold text-sm py-2 rounded shadow-md border ${
                                               item.status === 'CORRECT' 
                                               ? 'bg-green-600 text-white border-green-400 shadow-[0_0_10px_rgba(34,197,94,0.4)]' 
                                               : 'bg-red-600 text-white border-red-400 shadow-[0_0_10px_rgba(239,68,68,0.4)]'
                                           }`}>
                                               {item.status}
                                           </div>
                                       )}
                                   </div>
                               ))}
                           </div>

                           {gameState.round3TurnPlayerId === p.id && (
                               <div className="mt-4 flex gap-2">
                                   <button 
                                      onClick={() => actions.startRound3Timer('MAIN')}
                                      className="flex-1 bg-blue-600 hover:bg-blue-500 py-3 rounded font-bold flex items-center justify-center gap-2"
                                   >
                                       <Timer size={18} /> 15s Answer (Student)
                                   </button>
                                   <button 
                                      onClick={() => actions.startRound3Timer('STEAL')}
                                      className="flex-1 bg-orange-600 hover:bg-orange-500 py-3 rounded font-bold flex items-center justify-center gap-2"
                                   >
                                       <Zap size={18} /> 15s Steal (Others)
                                   </button>
                               </div>
                           )}
                      </div>
                  ))}
              </div>

              <div className="pt-12 pb-12 text-center border-t border-gray-700">
                  <button 
                    onClick={() => {
                        actions.endGame();
                        playSound('VICTORY');
                    }}
                    className="group relative inline-flex items-center justify-center px-8 py-6 text-lg font-black text-white transition-all duration-200 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-full hover:from-yellow-400 hover:to-yellow-500 focus:outline-none focus:ring-4 focus:ring-yellow-500/50 shadow-lg hover:scale-105 hover:shadow-yellow-500/50"
                  >
                      <Trophy className="w-8 h-8 mr-3 text-yellow-100 animate-bounce" />
                      <span>🏆 END GAME & SHOW PODIUM</span>
                  </button>
              </div>
          </div>
      )}

      {viewingPlayerCode && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 w-full max-w-4xl rounded-xl shadow-2xl border border-gray-600 flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-slate-900 rounded-t-xl">
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Code className="text-cyber-primary"/> Answer by {viewingPlayerCode.name}
                    </h3>
                    <button 
                        onClick={() => {
                            setViewingPlayerCode(null);
                            actions.setViewingPlayer(null); // Clear from big screen
                        }} 
                        className="text-gray-400 hover:text-white"
                    >
                        <X size={24}/>
                    </button>
                </div>
                <div className="flex-grow p-6 overflow-auto bg-black">
                    <pre className="text-green-400 font-mono text-sm md:text-base whitespace-pre-wrap">
                        {viewingPlayerCode.round2Code || "// No code submitted"}
                    </pre>
                </div>
                <div className="p-4 border-t border-gray-700 bg-slate-900 rounded-b-xl flex justify-end gap-4">
                     <button 
                         onClick={() => {
                             actions.updateScore(viewingPlayerCode.id, 50);
                             setViewingPlayerCode(null);
                             actions.setViewingPlayer(null);
                             playSound('SCORE_UP');
                         }}
                         className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded font-bold flex items-center gap-2 transition-all hover:scale-105"
                     >
                         <Check size={18}/> Mark Correct (+50)
                     </button>
                     <button 
                         onClick={() => {
                             setViewingPlayerCode(null);
                             actions.setViewingPlayer(null);
                             playSound('WRONG');
                         }}
                         className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded font-bold flex items-center gap-2 transition-all hover:scale-105"
                     >
                         <X size={18}/> Close / Incorrect
                     </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
