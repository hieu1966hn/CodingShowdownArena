
import { useEffect, useState } from "react";
import { doc, onSnapshot, setDoc, updateDoc, getDoc, arrayUnion } from "firebase/firestore";
import { signInWithPopup, signOut, onAuthStateChanged, User, signInAnonymously } from "firebase/auth";
import { db, auth, googleProvider } from "../lib/firebase";
import { GameState, INITIAL_STATE, GameRound, Player, Question, Difficulty, PackStatus, Round3Item } from "../types";
import { ROUND_3_QUESTIONS } from "../data/questions";

export const useGameSync = () => {
  const [user, setUser] = useState<User | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [authLoading, setAuthLoading] = useState(true);
  const [roomError, setRoomError] = useState<string | null>(null);
  const [loginError, setLoginError] = useState<string | null>(null);

  // --- Auth Listener ---
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
        setUser(u);
        setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // --- Firestore Room Listener ---
  useEffect(() => {
    if (!roomId) return;

    const unsub = onSnapshot(doc(db, "rooms", roomId), (docSnap) => {
        if (docSnap.exists()) {
            setGameState(docSnap.data() as GameState);
            setRoomError(null);
        } else {
            setRoomError("Room not found!");
        }
    }, (err) => {
        console.error("Firestore Error:", err);
        setRoomError("Error connecting to room.");
    });

    return () => unsub();
  }, [roomId]);

  // --- Auth Actions ---
  const login = async () => {
      setLoginError(null);
      try {
          await signInWithPopup(auth, googleProvider);
      } catch (e: any) {
          console.error("Login failed", e);
          if (e.code === 'auth/unauthorized-domain') {
              setLoginError(`Domain Unauthorized. Please add "${window.location.hostname}" to Firebase Console -> Authentication -> Settings -> Authorized Domains.`);
          } else if (e.code === 'auth/popup-closed-by-user') {
              setLoginError("Sign-in popup was closed.");
          } else {
              setLoginError(e.message || "Login failed.");
          }
      }
  };

  const loginAnonymous = async () => {
      setLoginError(null);
      try {
          await signInAnonymously(auth);
      } catch (e: any) {
          console.error("Anonymous login failed", e);
          if (e.code === 'auth/admin-restricted-operation') {
              setLoginError("Anonymous login is not enabled in Firebase Console.");
          } else {
              setLoginError(e.message || "Guest login failed.");
          }
      }
  };
  
  const logout = async () => {
      await signOut(auth);
      setRoomId(null);
      setGameState(INITIAL_STATE);
  };

  // --- Room Actions ---
  const createRoom = async (classCode: string) => {
      if (!classCode) return false;
      const code = classCode.trim().toUpperCase();
      try {
          // Check if room exists first to avoid accidental wipes
          const ref = doc(db, "rooms", code);
          const snap = await getDoc(ref);
          
          if (snap.exists()) {
              console.log("Room exists, resuming...");
              setRoomId(code);
          } else {
              const newState = { ...INITIAL_STATE, roomId: code };
              await setDoc(ref, newState);
              setRoomId(code);
          }
          return true;
      } catch (e) {
          console.error("Create Room Error", e);
          return false;
      }
  };

  const joinRoom = async (classCode: string) => {
      if (!classCode) return false;
      const code = classCode.trim().toUpperCase();
      const ref = doc(db, "rooms", code);
      const snap = await getDoc(ref);
      if (snap.exists()) {
          setRoomId(code);
          return true;
      } else {
          setRoomError("Class Code not found.");
          return false;
      }
  };

  // --- State Helper ---
  const updateState = async (updater: Partial<GameState> | ((prev: GameState) => Partial<GameState>)) => {
      if (!roomId) return;
      
      const changes = typeof updater === 'function' ? updater(gameState) : updater;
      try {
          await updateDoc(doc(db, "rooms", roomId), changes);
      } catch (e) {
          console.error("Update State Error", e);
      }
  };

  // --- GAME ACTIONS ---

  const joinGame = async (name: string) => {
    if (!roomId || !user) return null;
    
    const existingPlayer = gameState.players.find(p => p.id === user.uid);
    if (existingPlayer) {
        return user.uid;
    }

    const newPlayer: Player = {
      id: user.uid,
      name: name || user.displayName || "Anonymous",
      score: 0,
      isOnline: true,
      round3Pack: [
        { difficulty: 'EASY', status: 'PENDING' },
        { difficulty: 'MEDIUM', status: 'PENDING' },
        { difficulty: 'HARD', status: 'PENDING' }
      ],
      round3PackLocked: false
    };

    await updateDoc(doc(db, "rooms", roomId), {
        players: arrayUnion(newPlayer)
    });
    return newPlayer.id;
  };

  const setRound = (round: GameRound) => {
    updateState({ 
        round, 
        message: `Entering ${round}...`, 
        activeQuestion: null, 
        timerEndTime: null, 
        round3Phase: 'IDLE', 
        round3TurnPlayerId: null, 
        round1TurnPlayerId: null,
        showAnswer: false,
        viewingPlayerId: null
    });
  };

  const setQuestion = (question: Question) => {
    updateState((prev) => {
        const isRound2 = prev.round === GameRound.ROUND_2;
        const updatedPlayers = isRound2 ? prev.players.map(p => ({
            ...p,
            submittedRound2: false,
            round2Code: null, 
            round2Time: null
        })) : prev.players;

        return { 
            activeQuestion: question, 
            buzzerLocked: true, 
            message: null,
            round2StartedAt: null,
            usedQuestionIds: [...prev.usedQuestionIds, question.id],
            players: updatedPlayers,
            showAnswer: false,
            viewingPlayerId: null
        };
    });
  };

  const clearQuestion = () => updateState({ activeQuestion: null, showAnswer: false });

  const startTimer = (seconds: number) => {
    updateState({ 
      timerEndTime: Date.now() + seconds * 1000,
      buzzerLocked: false 
    });
  };

  const startRound2Timer = () => {
      updateState((prev) => {
          let duration = 25; // Default
          if (prev.activeQuestion) {
             switch(prev.activeQuestion.difficulty) {
                 case 'EASY': duration = 20; break;
                 case 'MEDIUM': duration = 60; break;
                 case 'HARD': duration = 120; break;
                 default: duration = 25;
             }
          }
          const now = Date.now();
          return {
              timerEndTime: now + duration * 1000,
              round2StartedAt: now, 
              buzzerLocked: true
          };
      });
  };

  const stopTimer = () => updateState({ timerEndTime: null, buzzerLocked: true });

  const updateScore = (playerId: string, delta: number) => {
    updateState((prev) => ({
      players: prev.players.map(p => {
          if (p.id !== playerId) return p;
          const newScore = p.score + delta;
          return { ...p, score: newScore < 0 ? 0 : newScore };
      })
    }));
  };

  const buzz = (playerId: string) => {
    updateState((prev) => {
      if (!prev.buzzerLocked) {
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
      players: prev.players.map(p => ({ ...p, buzzedAt: null })) 
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

  const setRound1Turn = (playerId: string | null) => updateState({ round1TurnPlayerId: playerId, showAnswer: false });

  const setRound3Pack = (playerId: string, pack: Round3Item[]) => {
      updateState((prev) => ({
          players: prev.players.map(p => p.id === playerId ? {
              ...p,
              round3Pack: pack,
              round3PackLocked: true
          } : p)
      }));
  };

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

  const gradeRound3Question = (playerId: string, packIndex: number, newStatus: PackStatus, scoreDelta: number) => {
      updateState((prev) => ({
          players: prev.players.map(p => {
              if (p.id !== playerId) return p;
              
              const newPack = [...p.round3Pack];
              newPack[packIndex] = { ...newPack[packIndex], status: newStatus };
              
              const newScore = p.score + scoreDelta;

              return { 
                  ...p, 
                  round3Pack: newPack,
                  score: newScore < 0 ? 0 : newScore
              };
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
          activeQuestion: null
      });
  };

  const setRound3SelectionMode = (mode: 'RANDOM' | 'SEQUENTIAL') => {
      updateState({ round3SelectionMode: mode });
  };

  const revealRound3Question = (difficulty: Difficulty) => {
      updateState((prev) => {
        const pool = ROUND_3_QUESTIONS.filter(q => 
            q.difficulty === difficulty && 
            !prev.usedQuestionIds.includes(q.id)
        );

        let selectedQ: Question | undefined;

        if (prev.round3SelectionMode === 'SEQUENTIAL') {
            selectedQ = pool[0];
        } else {
            selectedQ = pool[Math.floor(Math.random() * pool.length)];
        }

        if (selectedQ) {
            return {
                activeQuestion: selectedQ,
                buzzerLocked: true,
                message: null,
                usedQuestionIds: [...prev.usedQuestionIds, selectedQ.id]
            };
        } else {
            return {
                activeQuestion: {
                    id: `temp-${Date.now()}`,
                    content: `No ${difficulty} questions remaining!`,
                    points: 0,
                    difficulty: difficulty
                }
            };
        }
      });
  };

  const startRound3Timer = (type: 'MAIN' | 'STEAL') => {
      updateState((prev) => {
          let duration = 15; // Default/Steal
          if (type === 'MAIN' && prev.activeQuestion) {
               switch(prev.activeQuestion.difficulty) {
                   case 'EASY': duration = 20; break;
                   case 'MEDIUM': duration = 60; break;
                   case 'HARD': duration = 120; break;
                   default: duration = 15;
               }
          }
          
          return {
            round3Phase: type === 'MAIN' ? 'MAIN_ANSWER' : 'STEAL_WINDOW',
            timerEndTime: Date.now() + duration * 1000,
            buzzerLocked: type === 'MAIN',
            players: type === 'STEAL' ? prev.players.map(p => ({ ...p, buzzedAt: null })) : prev.players
          };
      });
  };

  const endGame = async () => {
    await updateState({
        round: GameRound.GAME_OVER,
        message: "CONGRATULATIONS!",
        activeQuestion: null,
        timerEndTime: null,
        buzzerLocked: true
    });

    if (roomId) {
        const archiveId = `${roomId}_${new Date().toISOString().replace(/[:.]/g, '-')}`;
        try {
            await setDoc(doc(db, "history", archiveId), {
                ...gameState,
                archivedAt: new Date(),
                roomId: roomId
            });
            console.log("Game archived successfully:", archiveId);
        } catch (e) {
            console.error("Failed to archive game:", e);
        }
    }
  };

  const resetGame = () => {
      if (roomId) {
        setDoc(doc(db, "rooms", roomId), { ...INITIAL_STATE, roomId });
      }
  };

  const forceSync = () => { };

  const toggleShowAnswer = () => {
      updateState((prev) => ({ showAnswer: !prev.showAnswer }));
  };

  const setViewingPlayer = (playerId: string | null) => {
      updateState((prev) => ({ viewingPlayerId: playerId }));
  };

  return {
    user,
    authLoading,
    login,
    loginAnonymous,
    logout,
    loginError, 
    
    roomId,
    roomError,
    createRoom,
    joinRoom,

    gameState,
    
    // Actions
    setRound,
    setQuestion,
    clearQuestion,
    startTimer,
    startRound2Timer,
    stopTimer,
    updateScore,
    buzz,
    clearBuzzers,
    submitRound2,
    resetGame,
    endGame,
    setRound1Turn,
    setRound3Pack,
    updatePlayerPack,
    gradeRound3Question,
    setRound3Turn,
    setRound3SelectionMode,
    revealRound3Question,
    startRound3Timer,
    joinGame, 
    forceSync,
    toggleShowAnswer,
    setViewingPlayer
  };
};
