
import React, { useState, useEffect, useRef } from 'react';
import { GameState, GameRound, Player, Difficulty } from '../types';
import { Code, Send, Bell, Mic, LogOut, CheckCircle, Zap } from 'lucide-react';
import { SOUND_EFFECTS } from '../config/assets';

interface Props {
  gameState: GameState;
  playerId: string;
  onBuzz: () => void;
  onSubmitRound2: (code: string) => void;
  onSetRound3Pack?: (pack: any[]) => void;
  onLeave: () => void;
  onSubmitQuizAnswer?: (answer: string) => void;
}

const StudentView: React.FC<Props> = ({ gameState, playerId, onBuzz, onSubmitRound2, onSetRound3Pack, onLeave, onSubmitQuizAnswer }) => {
  const me = gameState.players.find(p => p.id === playerId);
  const [codeAnswer, setCodeAnswer] = useState('');
  const [packSelection, setPackSelection] = useState<Difficulty[]>(['EASY', 'MEDIUM', 'HARD']);
  const lastPlayedSecond = useRef<number | null>(null);

  const playSound = (type: keyof typeof SOUND_EFFECTS, volume = 0.5) => {
    try {
        const audio = new Audio(SOUND_EFFECTS[type]);
        audio.volume = volume;
        audio.play().catch(e => console.error("Audio playback failed:", e));
    } catch (e) {
        console.warn("Audio error", e);
    }
  };

  // LOGIC ÂM THANH ĐẾM NGƯỢC - ĐỒNG BỘ MỖI GIÂY
  useEffect(() => {
    if (!gameState.timerEndTime) {
        lastPlayedSecond.current = null;
        return;
    }

    const interval = setInterval(() => {
        const now = Date.now();
        const timeLeft = Math.max(0, Math.ceil((gameState.timerEndTime! - now) / 1000));
        
        // Phát TICK cho mỗi giây trôi qua
        if (timeLeft > 0 && timeLeft !== lastPlayedSecond.current) {
            lastPlayedSecond.current = timeLeft;
            playSound('TICK', 0.3);
        }
        
        // Phát tiếng chuông báo khi hết giờ
        if (timeLeft === 0 && lastPlayedSecond.current !== 0) {
            lastPlayedSecond.current = 0;
            playSound('WRONG', 0.4);
        }
    }, 100);
    
    return () => clearInterval(interval);
  }, [gameState.timerEndTime]);

  if (!me) return <div className="text-white p-10">Error: Player not found. Please refresh.</div>;

  const isRound2 = gameState.round === GameRound.ROUND_2;
  const isRound3 = gameState.round === GameRound.ROUND_3;

  const handlePackChange = (index: number, value: Difficulty) => {
      const newPack = [...packSelection];
      newPack[index] = value;
      setPackSelection(newPack);
  };

  const submitPack = () => {
      if (onSetRound3Pack) {
          const packItems = packSelection.map(diff => ({ difficulty: diff, status: 'PENDING' }));
          onSetRound3Pack(packItems);
          playSound('SCORE_UP');
      }
  };

  return (
    <div className="min-h-screen bg-cyber-dark text-white p-4 flex flex-col">
      <div className="flex justify-between items-center bg-cyber-light p-4 rounded-lg mb-6 shadow-lg border border-gray-700">
        <div>
           <h2 className="text-xl font-bold text-cyber-primary truncate max-w-[150px]">{me.name}</h2>
           <span className="text-sm text-gray-400">Player</span>
        </div>
        <div className="flex items-center gap-4">
            <div className="text-3xl font-mono font-bold">{me.score} <span className="text-sm text-gray-500">pts</span></div>
            <button onClick={onLeave} className="p-2 bg-red-900/50 hover:bg-red-600 rounded-full text-red-200 hover:text-white transition-colors">
                <LogOut size={20} />
            </button>
        </div>
      </div>

      <div className="flex-grow flex flex-col justify-center items-center">
        {!gameState.activeQuestion && !isRound2 && !isRound3 && (
             <div className="text-center animate-pulse">
                <Code size={64} className="mx-auto text-gray-600 mb-4" />
                <h3 className="text-2xl text-gray-400">Eyes on the big screen!</h3>
                <p className="text-gray-600">Waiting for next challenge...</p>
             </div>
        )}

        {isRound2 && gameState.activeQuestion && !me.submittedRound2 && (
            <div className="w-full max-w-2xl space-y-4">
                <div className="bg-slate-800 p-4 rounded border border-cyber-primary">
                    <h3 className="font-bold text-lg mb-2">Debug/Arrange this:</h3>
                    <pre className="text-green-400 text-sm overflow-x-auto whitespace-pre-wrap">
                        {gameState.activeQuestion.codeSnippet}
                    </pre>
                </div>
                <textarea 
                    className="w-full h-40 bg-black text-green-400 font-mono p-4 rounded border border-gray-600 focus:border-cyber-primary focus:outline-none"
                    placeholder="Type your fixed code here..."
                    value={codeAnswer}
                    onChange={(e) => setCodeAnswer(e.target.value)}
                />
                <button 
                    onClick={() => {
                        onSubmitRound2(codeAnswer);
                        setCodeAnswer('');
                        playSound('SUBMIT');
                    }}
                    className="w-full bg-cyber-primary hover:bg-cyan-600 text-black font-bold py-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                    <Send size={20} /> SUBMIT CODE
                </button>
            </div>
        )}

        {isRound2 && me.submittedRound2 && (
             <div className="text-center">
                <div className="text-green-500 text-4xl mb-2">✔ Submitted</div>
                <p>Wait for results...</p>
             </div>
        )}

        {isRound3 && (
            <div className="w-full max-w-md">
                 {!me.round3PackLocked ? (
                     <div className="bg-slate-800 p-6 rounded-xl border border-cyber-primary">
                         <h2 className="text-2xl font-bold mb-4 text-center">Choose Your Challenge</h2>
                         <p className="text-gray-400 text-center mb-6 text-sm">Select 3 difficulty levels for your turn.</p>
                         <div className="space-y-4 mb-8">
                             {[0, 1, 2].map((idx) => (
                                 <div key={idx} className="flex items-center gap-4">
                                     <span className="font-bold text-gray-500">Q{idx+1}</span>
                                     <select 
                                        value={packSelection[idx]}
                                        onChange={(e) => handlePackChange(idx, e.target.value as Difficulty)}
                                        className="flex-grow bg-black border border-gray-600 rounded p-3 text-white focus:border-cyber-primary focus:outline-none"
                                     >
                                         <option value="EASY">EASY (20pts)</option>
                                         <option value="MEDIUM">MEDIUM (30pts)</option>
                                         <option value="HARD">HARD (40pts)</option>
                                     </select>
                                 </div>
                             ))}
                         </div>
                         <button onClick={submitPack} className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-bold py-4 rounded-lg shadow-lg transform transition-all active:scale-95">
                             LOCK IN SELECTION
                         </button>
                     </div>
                 ) : (
                     <>
                        {/* STEAL MODE UI */}
                        {gameState.activeStealPlayerId === me.id ? (
                            <div className="text-center w-full">
                                <div className="bg-red-900/50 p-6 rounded-full inline-block mb-4 animate-pulse border-4 border-red-500">
                                    <Zap size={64} className="text-yellow-400" fill="currentColor"/>
                                </div>
                                <h2 className="text-4xl font-black text-red-500 mb-6 uppercase">YOUR TURN TO STEAL!</h2>
                                
                                {/* If Quiz Mode and Stealing, show disabled options (Steal is Verbal/Manual grading) */}
                                {gameState.round3Mode === 'QUIZ' && gameState.activeQuestion?.options ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        {gameState.activeQuestion.options.map((opt, idx) => (
                                            <button
                                                key={idx}
                                                disabled={true} 
                                                className="p-4 bg-gray-800 rounded border border-gray-600 text-left opacity-50 cursor-not-allowed"
                                            >
                                                <span className="font-bold mr-2 text-gray-400">{String.fromCharCode(65+idx)}.</span>
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xl">Answer carefully!</p>
                                )}
                            </div>
                        ) : gameState.round3TurnPlayerId === me.id ? (
                            /* MAIN TURN UI */
                            <div className="text-center w-full">
                                {gameState.round3Mode === 'QUIZ' && gameState.activeQuestion?.options ? (
                                    <>
                                        <div className="mb-4">
                                            <h2 className="text-2xl font-bold text-purple-400 mb-2">Quiz Time!</h2>
                                            <p className="text-gray-400">Select the correct answer on screen.</p>
                                        </div>
                                        {me.round3QuizAnswer ? (
                                            <div className="p-6 bg-blue-900/30 border border-blue-500 rounded-xl">
                                                <div className="text-blue-300 font-bold mb-2">You selected:</div>
                                                <div className="text-2xl font-black">{me.round3QuizAnswer}</div>
                                                <div className="mt-4 text-sm text-gray-400 animate-pulse">Waiting for result...</div>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 gap-4">
                                                {gameState.activeQuestion.options.map((opt, idx) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => onSubmitQuizAnswer && onSubmitQuizAnswer(opt)}
                                                        className="p-6 bg-slate-800 hover:bg-purple-900 border border-gray-600 hover:border-purple-500 rounded-xl text-left transition-all active:scale-95 flex items-center gap-4"
                                                    >
                                                        <div className="w-8 h-8 rounded-full bg-black/40 flex items-center justify-center font-bold text-sm border border-white/20">
                                                            {String.fromCharCode(65+idx)}
                                                        </div>
                                                        <span className="font-bold text-lg">{opt}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    /* ORAL MODE */
                                    <>
                                        <div className="bg-blue-900/50 p-6 rounded-full inline-block mb-4 animate-pulse">
                                            <Mic size={64} className="text-blue-300" />
                                        </div>
                                        <h2 className="text-3xl font-bold text-blue-400 mb-2">YOUR TURN!</h2>
                                        <p className="text-xl">Answer the question verbally.</p>
                                    </>
                                )}
                                
                                <div className="mt-8 flex justify-center gap-2">
                                    {me.round3Pack.map((item, idx) => (
                                        <div key={idx} className={`w-3 h-3 rounded-full ${item.status === 'PENDING' ? 'bg-gray-600' : item.status === 'CORRECT' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                    ))}
                                </div>
                                {gameState.round3Phase === 'MAIN_ANSWER' && (
                                    <div className="mt-4 text-yellow-400 font-mono text-2xl">Time is ticking...</div>
                                )}
                            </div>
                        ) : (
                            /* IDLE / WAITING / BUZZER UI */
                            <>
                                {gameState.round3Phase === 'STEAL_WINDOW' ? (
                                    <button 
                                        disabled={gameState.buzzerLocked || !!me.buzzedAt}
                                        onMouseDown={onBuzz}
                                        onTouchStart={onBuzz} 
                                        className={`w-full aspect-square rounded-full flex flex-col items-center justify-center border-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-all transform active:scale-95
                                            ${me.buzzedAt ? 'bg-yellow-500 border-yellow-700' : 
                                            gameState.buzzerLocked ? 'bg-gray-700 border-gray-800 cursor-not-allowed grayscale' : 
                                            'bg-red-600 border-red-800 hover:bg-red-500 hover:shadow-[0_0_30px_rgba(244,63,94,0.6)] cursor-pointer'}
                                        `}
                                    >
                                        <Bell size={64} className="text-white mb-2" />
                                        <span className="text-3xl font-black text-white uppercase tracking-widest">
                                            {me.buzzedAt ? 'BUZZED!' : 'STEAL!'}
                                        </span>
                                    </button>
                                ) : (
                                    <div className="text-center text-gray-500">
                                        {gameState.round3TurnPlayerId ? (
                                            <div className="flex flex-col items-center">
                                                <div className="text-2xl text-white mb-2">
                                                    {gameState.players.find(p => p.id === gameState.round3TurnPlayerId)?.name} is answering...
                                                </div>
                                                <div className="text-sm">Get ready to steal if they fail!</div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center gap-4">
                                                <CheckCircle size={48} className="text-green-500"/>
                                                <div className="text-xl text-white">Selection Locked!</div>
                                                <p>Waiting for teacher to start turns...</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                     </>
                 )}
            </div>
        )}
      </div>
    </div>
  );
};

export default StudentView;
