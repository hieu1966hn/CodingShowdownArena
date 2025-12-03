import React, { useState } from 'react';
import { GameState, GameRound, Player } from '../types';
import { Code, Send, Bell, Mic, LogOut } from 'lucide-react';

interface Props {
  gameState: GameState;
  playerId: string;
  onBuzz: () => void;
  onSubmitRound2: (code: string) => void;
  onLeave: () => void;
}

const StudentView: React.FC<Props> = ({ gameState, playerId, onBuzz, onSubmitRound2, onLeave }) => {
  const me = gameState.players.find(p => p.id === playerId);
  const [codeAnswer, setCodeAnswer] = useState('');

  if (!me) return <div className="text-white p-10">Error: Player not found. Please refresh.</div>;

  const isRound2 = gameState.round === GameRound.ROUND_2;
  const isRound3 = gameState.round === GameRound.ROUND_3;

  return (
    <div className="min-h-screen bg-cyber-dark text-white p-4 flex flex-col">
      {/* Top Bar */}
      <div className="flex justify-between items-center bg-cyber-light p-4 rounded-lg mb-6 shadow-lg border border-gray-700">
        <div>
           <h2 className="text-xl font-bold text-cyber-primary">{me.name}</h2>
           <span className="text-sm text-gray-400">Player</span>
        </div>
        <div className="flex items-center gap-4">
            <div className="text-3xl font-mono font-bold">{me.score} <span className="text-sm text-gray-500">pts</span></div>
            <button 
                onClick={onLeave}
                className="p-2 bg-red-900/50 hover:bg-red-600 rounded-full text-red-200 hover:text-white transition-colors"
                title="Leave Game"
            >
                <LogOut size={20} />
            </button>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-grow flex flex-col justify-center items-center">
        
        {/* LOBBY / IDLE */}
        {!gameState.activeQuestion && !isRound2 && !isRound3 && (
             <div className="text-center animate-pulse">
                <Code size={64} className="mx-auto text-gray-600 mb-4" />
                <h3 className="text-2xl text-gray-400">Eyes on the big screen!</h3>
                <p className="text-gray-600">Waiting for next challenge...</p>
             </div>
        )}

        {/* ROUND 2: CODING */}
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
                    }}
                    className="w-full bg-cyber-primary hover:bg-cyan-600 text-black font-bold py-4 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                    <Send size={20} /> SUBMIT CODE
                </button>
            </div>
        )}

        {/* ROUND 2: SUBMITTED */}
        {isRound2 && me.submittedRound2 && (
             <div className="text-center">
                <div className="text-green-500 text-4xl mb-2">✔ Submitted</div>
                <p>Wait for results...</p>
             </div>
        )}

        {/* ROUND 3: TACTICAL FINISH */}
        {isRound3 && (
            <div className="w-full max-w-md">
                 {/* Logic for Round 3 */}
                 {gameState.round3TurnPlayerId === me.id ? (
                     // IT IS MY TURN
                     <div className="text-center">
                         <div className="bg-blue-900/50 p-6 rounded-full inline-block mb-4 animate-pulse">
                            <Mic size={64} className="text-blue-300" />
                         </div>
                         <h2 className="text-3xl font-bold text-blue-400 mb-2">YOUR TURN!</h2>
                         <p className="text-xl">Answer the question verbally.</p>
                         {gameState.round3Phase === 'MAIN_ANSWER' && (
                             <div className="mt-4 text-yellow-400 font-mono text-2xl">Time is ticking...</div>
                         )}
                     </div>
                 ) : (
                     // NOT MY TURN
                     <>
                        {gameState.round3Phase === 'STEAL_WINDOW' ? (
                             // STEAL PHASE - SHOW BUZZER
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
                            // LISTENING PHASE
                            <div className="text-center text-gray-500">
                                {gameState.round3TurnPlayerId ? (
                                    <div className="flex flex-col items-center">
                                        <div className="text-2xl text-white mb-2">
                                            {gameState.players.find(p => p.id === gameState.round3TurnPlayerId)?.name} is answering...
                                        </div>
                                        <div className="text-sm">Get ready to steal if they fail!</div>
                                    </div>
                                ) : (
                                    "Waiting for turn selection..."
                                )}
                            </div>
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