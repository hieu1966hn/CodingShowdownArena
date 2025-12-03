import React, { useEffect, useRef } from 'react';
import { GameState, GameRound, Player } from '../types';
import { Trophy, Timer, Code2, AlertCircle, Zap, User, Star, LogOut } from 'lucide-react';
import { SOUND_EFFECTS } from '../constants';

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

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

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
                ctx.beginPath();
                ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.fill();
                ctx.restore();
            }

            update() {
                this.velocity.x *= 0.98;
                this.velocity.y *= 0.98;
                this.velocity.y += 0.05; // gravity
                this.x += this.velocity.x;
                this.y += this.velocity.y;
                this.alpha -= this.decay;
            }
        }

        const createFirework = (x: number, y: number) => {
            const colors = ['#f43f5e', '#06b6d4', '#8b5cf6', '#eab308', '#22c55e'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            for (let i = 0; i < 50; i++) {
                particles.push(new Particle(x, y, color));
            }
        };

        let animationId: number;
        const animate = () => {
            animationId = requestAnimationFrame(animate);
            ctx.fillStyle = 'rgba(15, 23, 42, 0.2)'; // trail effect
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            if (Math.random() < 0.05) {
                createFirework(Math.random() * canvas.width, Math.random() * canvas.height * 0.5);
            }

            particles.forEach((particle, index) => {
                if (particle.alpha > 0) {
                    particle.update();
                    particle.draw();
                } else {
                    particles.splice(index, 1);
                }
            });
        };

        animate();

        return () => cancelAnimationFrame(animationId);
    }, []);

    return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />;
};

const SpectatorScreen: React.FC<Props> = ({ gameState, onLeave }) => {
  const sortedPlayers = [...gameState.players].sort((a, b) => b.score - a.score);

  // Timer Logic for Display
  const [timeLeft, setTimeLeft] = React.useState(0);
  React.useEffect(() => {
    const interval = setInterval(() => {
      if (gameState.timerEndTime) {
        const remaining = Math.max(0, Math.ceil((gameState.timerEndTime - Date.now()) / 1000));
        setTimeLeft(remaining);
      } else {
        setTimeLeft(0);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [gameState.timerEndTime]);

  // --- PODIUM VIEW (GAME OVER) ---
  if (gameState.round === GameRound.GAME_OVER) {
      const top3 = sortedPlayers.slice(0, 3);
      // Ensure we have 3 spots for the podium logic (even if placeholders)
      const first = top3[0];
      const second = top3[1];
      const third = top3[2];

      return (
          <div className="min-h-screen bg-cyber-dark text-white p-8 flex flex-col items-center justify-center relative overflow-hidden">
              <Fireworks />
              
              <button 
                onClick={onLeave}
                className="absolute top-6 right-6 z-50 p-2 bg-gray-800/50 hover:bg-gray-700 rounded-full text-gray-400 hover:text-white transition-colors"
                title="Exit to Home"
              >
                  <LogOut size={24} />
              </button>

              <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-600 mb-12 relative z-10 animate-bounce-short">
                  CHAMPIONS
              </h1>

              <div className="flex items-end justify-center gap-4 md:gap-8 w-full max-w-5xl relative z-10 h-[500px]">
                  
                  {/* 2nd Place */}
                  {second && (
                      <div className="flex flex-col items-center w-1/3 animate-[slideUp_1s_ease-out_0.5s_both]">
                          <div className="text-center mb-4">
                              <div className="text-2xl md:text-4xl font-bold text-gray-300 mb-2">{second.name}</div>
                              <div className="text-xl text-gray-400 font-mono">{second.score} pts</div>
                          </div>
                          <div className="w-full bg-gradient-to-t from-gray-600 to-gray-400 h-64 rounded-t-lg border-t-4 border-gray-300 shadow-[0_0_30px_rgba(156,163,175,0.4)] flex items-center justify-center text-6xl font-black text-gray-800">
                              2
                          </div>
                      </div>
                  )}

                  {/* 1st Place */}
                  {first && (
                      <div className="flex flex-col items-center w-1/3 animate-[slideUp_1s_ease-out_both] -mt-12 z-20">
                          <Trophy size={80} className="text-yellow-400 mb-4 animate-[spin_3s_linear_infinite]" />
                          <div className="text-center mb-4">
                              <div className="text-4xl md:text-6xl font-black text-yellow-400 mb-2">{first.name}</div>
                              <div className="text-3xl text-yellow-200 font-mono font-bold">{first.score} pts</div>
                          </div>
                          <div className="w-full bg-gradient-to-t from-yellow-600 to-yellow-400 h-96 rounded-t-lg border-t-4 border-yellow-200 shadow-[0_0_50px_rgba(250,204,21,0.6)] flex items-center justify-center text-8xl font-black text-yellow-900">
                              1
                          </div>
                      </div>
                  )}

                  {/* 3rd Place */}
                  {third && (
                      <div className="flex flex-col items-center w-1/3 animate-[slideUp_1s_ease-out_1s_both]">
                          <div className="text-center mb-4">
                              <div className="text-2xl md:text-4xl font-bold text-orange-400 mb-2">{third.name}</div>
                              <div className="text-xl text-orange-300 font-mono">{third.score} pts</div>
                          </div>
                          <div className="w-full bg-gradient-to-t from-orange-700 to-orange-500 h-48 rounded-t-lg border-t-4 border-orange-400 shadow-[0_0_30px_rgba(249,115,22,0.4)] flex items-center justify-center text-6xl font-black text-orange-900">
                              3
                          </div>
                      </div>
                  )}
              </div>
              
              <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl relative z-10">
                   {sortedPlayers.slice(3).map((p, idx) => (
                       <div key={p.id} className="bg-gray-800/80 p-4 rounded-lg flex justify-between items-center border border-gray-700">
                           <span className="text-gray-400 font-mono">#{idx + 4}</span>
                           <span className="font-bold">{p.name}</span>
                           <span className="text-cyber-primary">{p.score}</span>
                       </div>
                   ))}
              </div>
          </div>
      );
  }

  // --- STANDARD GAME VIEW ---
  return (
    <div className="min-h-screen bg-cyber-dark text-white p-8 flex flex-col items-center relative">
      <button 
        onClick={onLeave}
        className="absolute top-4 right-4 p-2 text-gray-700 hover:text-white transition-colors"
        title="Home"
      >
          <LogOut size={20} />
      </button>

      {/* Header */}
      <header className="w-full flex justify-between items-center mb-12 border-b border-cyber-light pb-4">
        <h1 className="text-5xl font-bold font-mono text-transparent bg-clip-text bg-gradient-to-r from-cyber-primary to-cyber-secondary">
          CODING SHOWDOWN
        </h1>
        <div className="text-2xl font-mono text-gray-400">
          {gameState.round === GameRound.LOBBY && "WAITING FOR PLAYERS..."}
          {gameState.round === GameRound.ROUND_1 && "ROUND 1: REFLEX"}
          {gameState.round === GameRound.ROUND_2 && "ROUND 2: OBSTACLE"}
          {gameState.round === GameRound.ROUND_3 && "ROUND 3: FINISH LINE"}
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex w-full gap-8 h-full flex-grow">
        
        {/* Left: Leaderboard */}
        <div className="w-1/3 bg-cyber-light rounded-xl p-6 border border-gray-700 shadow-2xl">
          <h2 className="text-3xl font-bold mb-6 flex items-center gap-3">
            <Trophy className="text-yellow-400" size={32} /> Leaderboard
          </h2>
          <div className="space-y-4">
            {sortedPlayers.map((player, index) => (
              <div 
                key={player.id} 
                className={`p-4 rounded-lg flex justify-between items-center transform transition-all duration-500 ${index === 0 ? 'bg-gradient-to-r from-yellow-900 to-cyber-light border-l-4 border-yellow-400 scale-105' : 'bg-gray-800'}`}
              >
                <div className="flex items-center gap-4">
                  <span className={`font-mono text-2xl font-bold ${index === 0 ? 'text-yellow-400' : 'text-gray-500'}`}>#{index + 1}</span>
                  <div className="flex flex-col">
                      <span className="text-xl font-semibold">{player.name}</span>
                      {gameState.round === GameRound.ROUND_3 && (
                          <div className="flex gap-1 mt-1">
                              {player.round3Pack.map((p, i) => (
                                  <div key={i} className={`w-3 h-3 rounded-full 
                                      ${p.status === 'CORRECT' ? 'bg-green-500' : p.status === 'WRONG' ? 'bg-red-500' : 'bg-gray-600'}`} 
                                  />
                              ))}
                          </div>
                      )}
                  </div>
                  {player.buzzedAt && <span className="text-xs bg-red-500 text-white px-2 py-1 rounded animate-pulse">BUZZ!</span>}
                </div>
                <span className="text-3xl font-mono font-bold text-cyber-primary">{player.score}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Active Game State */}
        <div className="w-2/3 flex flex-col gap-6">
          
          {/* Timer & Message */}
          <div className="h-32 flex items-center justify-between">
            {gameState.message ? (
                <div className="text-4xl font-bold text-cyber-accent animate-bounce-short">
                    {gameState.message}
                </div>
            ) : (
                // R3 Status Display
                gameState.round === GameRound.ROUND_3 && gameState.round3TurnPlayerId ? (
                     <div className="flex items-center gap-4">
                         {gameState.round3Phase === 'MAIN_ANSWER' && <span className="text-blue-400 font-bold text-3xl animate-pulse">ANSWERING...</span>}
                         {gameState.round3Phase === 'STEAL_WINDOW' && <span className="text-red-500 font-bold text-3xl animate-pulse flex items-center gap-2"><Zap/> STEAL CHANCE!</span>}
                     </div>
                ) : null
            )}
            
            {gameState.timerEndTime && (
                 <div className={`text-8xl font-mono font-black ${timeLeft < 5 ? 'text-red-500 animate-pulse-fast' : 'text-white'}`}>
                   {timeLeft}s
                 </div>
            )}
          </div>

          {/* Active Question Display */}
          <div className="flex-grow bg-slate-900 rounded-2xl p-8 border-2 border-cyber-primary shadow-[0_0_20px_rgba(6,182,212,0.3)] flex flex-col justify-center items-center text-center">
             {gameState.round === GameRound.ROUND_3 && gameState.round3TurnPlayerId ? (
                 <div className="mb-8 w-full">
                     <div className="text-2xl text-gray-400 mb-2">Current Turn</div>
                     <h2 className="text-4xl font-bold text-white mb-8 flex items-center justify-center gap-3">
                        <User size={40} className="text-cyber-secondary"/> 
                        {gameState.players.find(p => p.id === gameState.round3TurnPlayerId)?.name}
                     </h2>
                 </div>
             ) : null}

             {!gameState.activeQuestion ? (
                 <div className="text-gray-500 text-2xl animate-pulse">Waiting for host...</div>
             ) : (
                 <>
                    <div className="mb-8">
                        {gameState.activeQuestion.difficulty && (
                             <span className={`px-4 py-2 rounded-full text-sm font-bold mb-4 inline-block
                                ${gameState.activeQuestion.difficulty === 'EASY' ? 'bg-green-900 text-green-300' : 
                                  gameState.activeQuestion.difficulty === 'MEDIUM' ? 'bg-yellow-900 text-yellow-300' : 
                                  'bg-red-900 text-red-300'}`}>
                                {gameState.activeQuestion.difficulty}
                             </span>
                        )}
                        <h2 className="text-5xl font-bold leading-tight mb-8">{gameState.activeQuestion.content}</h2>
                        
                        {gameState.activeQuestion.codeSnippet && (
                            <div className="bg-black p-6 rounded-lg text-left font-mono text-green-400 text-xl overflow-x-auto w-full max-w-2xl mx-auto border border-gray-700">
                                <pre>{gameState.activeQuestion.codeSnippet}</pre>
                            </div>
                        )}
                    </div>
                    <div className="text-cyber-secondary font-mono text-xl mt-4">
                        Points Value: <span className="text-white font-bold text-3xl">{gameState.activeQuestion.points}</span>
                    </div>
                 </>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpectatorScreen;