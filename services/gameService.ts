import { useEffect, useState } from "react";
import { STORAGE_KEY, ROUND_3_QUESTIONS } from "../constants";
import { GameState, INITIAL_STATE, GameRound, Player, Question, Difficulty, PackStatus, Round3Phase } from "../types";

// This hook allows different tabs to sync state without a backend server
export const useGameSync = () => {
  const [gameState, setGameState] = useState<GameState>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : INITIAL_STATE;
  });

  // Polling mechanism to ensure state is synced if event is missed
  useEffect(() => {
    const interval = setInterval(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            // Only update if there is a difference to avoid unnecessary re-renders
            setGameState(prev => {
                if (JSON.stringify(prev) !== stored) {
                    return parsed;
                }
                return prev;
            });
        }
    }, 1000); // Check every second

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        setGameState(JSON.parse(e.newValue));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Force manual sync on focus/visibility change
  useEffect(() => {
    const handleFocus = () => {
       const stored = localStorage.getItem(STORAGE_KEY);
       if (stored) setGameState(JSON.parse(stored));
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);
    return () => {
        window.removeEventListener('focus', handleFocus);
        document.removeEventListener('visibilitychange', handleFocus);
    };
  }, []);

  // Helper to update state and broadcast to other tabs
  const updateState = (newState: Partial<GameState> | ((prev: GameState) => Partial<GameState>)) => {
    setGameState((prev) => {
      const updated = typeof newState === 'function' ? { ...prev, ...newState(prev) } : { ...prev, ...newState };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  // Force manual sync
  const forceSync = () => {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
          setGameState(JSON.parse(stored));
      }
  };

  // --- ACTIONS ---

  const joinGame = (name: string) => {
    const newPlayer: Player = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      score: 0,
      isOnline: true,
      round3Pack: [
        { difficulty: 'EASY', status: 'PENDING' },
        { difficulty: 'MEDIUM', status: 'PENDING' },
        { difficulty: 'HARD', status: 'PENDING' }
      ]
    };
    updateState((prev) => ({
      players: [...prev.players, newPlayer]
    }));
    return newPlayer.id;
  };

  const setRound = (round: GameRound) => {
    updateState({ round, message: `Entering ${round}...`, activeQuestion: null, timerEndTime: null, round3Phase: 'IDLE', round3TurnPlayerId: null });
  };

  const setQuestion = (question: Question) => {
    updateState({ activeQuestion: question, buzzerLocked: true, message: null });
  };

  const clearQuestion = () => {
    updateState({ activeQuestion: null });
  };

  const startTimer = (seconds: number) => {
    updateState({ 
      timerEndTime: Date.now() + seconds * 1000,
      buzzerLocked: false // Unlock buzzer when timer starts
    });
  };

  const stopTimer = () => {
    updateState({ timerEndTime: null, buzzerLocked: true });
  };

  const updateScore = (playerId: string, delta: number) => {
    updateState((prev) => ({
      players: prev.players.map(p => {
          if (p.id !== playerId) return p;
          const newScore = p.score + delta;
          // Prevent score from going below zero
          return { ...p, score: newScore < 0 ? 0 : newScore };
      })
    }));
  };

  const buzz = (playerId: string) => {
    // Only first buzz counts
    updateState((prev) => {
      if (!prev.buzzerLocked) {
        // Lock immediately so no one else can buzz
        return {
           buzzerLocked: true,
           players: prev.players.map(p => p.id === playerId ? { ...p, buzzedAt: Date.now() } : p),
           message: `${prev.players.find(p => p.id === playerId)?.name} BUZZED!`
        };
      }
      return {};
    });
  };

  const clearBuzzers = () => {
    updateState((prev) => ({
      buzzerLocked: false,
      players: prev.players.map(p => ({ ...p, buzzedAt: undefined }))
    }));
  };

  const submitRound2 = (playerId: string, code: string) => {
    updateState((prev) => {
        const now = Date.now();
        const timeTaken = prev.round2StartedAt ? (now - prev.round2StartedAt) / 1000 : 0;
        return {
            players: prev.players.map(p => p.id === playerId ? { 
                ...p, 
                submittedRound2: true, 
                round2Time: timeTaken,
                round2Code: code 
            } : p)
        };
    });
  };

  // --- Round 3 Specifics ---
  
  const updatePlayerPack = (playerId: string, packIndex: number, updates: { difficulty?: Difficulty, status?: PackStatus }) => {
    updateState((prev) => ({
        players: prev.players.map(p => {
            if (p.id !== playerId) return p;
            const newPack = [...p.round3Pack];
            newPack[packIndex] = { ...newPack[packIndex], ...updates };
            return { ...p, round3Pack: newPack };
        })
    }));
  };

  const setRound3Turn = (playerId: string) => {
      updateState({ 
          round3TurnPlayerId: playerId, 
          round3Phase: 'IDLE',
          message: null,
          buzzerLocked: true,
          timerEndTime: null,
          activeQuestion: null // Clear previous question when turn changes
      });
  };

  const revealRound3Question = (difficulty: Difficulty) => {
      // Pick a random question from pool
      const pool = ROUND_3_QUESTIONS.filter(q => q.difficulty === difficulty);
      const randomQ = pool[Math.floor(Math.random() * pool.length)];
      
      if (randomQ) {
          updateState({
              activeQuestion: randomQ,
              buzzerLocked: true,
              message: null
          });
      } else {
          // Fallback if no question found
          updateState({
              activeQuestion: {
                  id: `temp-${Date.now()}`,
                  content: `No ${difficulty} questions remaining in pool!`,
                  points: 0,
                  difficulty: difficulty
              }
          });
      }
  };

  const startRound3Timer = (type: 'MAIN' | 'STEAL') => {
      const duration = 15; // 15 seconds for both as per requirement
      updateState((prev) => ({
          round3Phase: type === 'MAIN' ? 'MAIN_ANSWER' : 'STEAL_WINDOW',
          timerEndTime: Date.now() + duration * 1000,
          buzzerLocked: type === 'MAIN', // Locked during main answer (verbal), Unlocked during steal
          // Clear previous buzzes if starting steal phase
          players: type === 'STEAL' ? prev.players.map(p => ({ ...p, buzzedAt: undefined })) : prev.players
      }));
  };

  const endGame = () => {
    updateState({
        round: GameRound.GAME_OVER,
        message: "CONGRATULATIONS!",
        activeQuestion: null,
        timerEndTime: null,
        buzzerLocked: true
    });
  };

  const resetGame = () => {
      updateState(INITIAL_STATE);
  };

  return {
    gameState,
    joinGame,
    setRound,
    setQuestion,
    clearQuestion,
    startTimer,
    stopTimer,
    updateScore,
    buzz,
    clearBuzzers,
    submitRound2,
    resetGame,
    endGame,
    // R3
    updatePlayerPack,
    setRound3Turn,
    revealRound3Question,
    startRound3Timer,
    forceSync,
    // Direct state setter for complex operations if needed
    _rawSetState: updateState 
  };
};