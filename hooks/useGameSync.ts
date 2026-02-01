import { useEffect, useState } from "react";
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import "firebase/compat/auth";
import { db, auth, googleProvider } from "../lib/firebase";
import { GameState, INITIAL_STATE, GameRound, Player, Question, Difficulty, PackStatus, Round3Item, Round3Mode } from "../types";
import { ROUND_3_QUESTIONS } from "../data/questions";

export const useGameSync = () => {
    const [user, setUser] = useState<firebase.User | null>(null);
    const [roomId, setRoomId] = useState<string | null>(null);
    const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
    const [authLoading, setAuthLoading] = useState(true);
    const [roomError, setRoomError] = useState<string | null>(null);
    const [loginError, setLoginError] = useState<string | null>(null);

    // --- Auth Listener ---
    useEffect(() => {
        const unsub = auth.onAuthStateChanged((u) => {
            setUser(u);
            setAuthLoading(false);
        });
        return () => unsub();
    }, []);

    // --- Firestore Room Listener ---
    useEffect(() => {
        if (!roomId) return;

        const unsub = db.collection("rooms").doc(roomId).onSnapshot((docSnap) => {
            if (docSnap.exists) {
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
            await auth.signInWithPopup(googleProvider);
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
            await auth.signInAnonymously();
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
        await auth.signOut();
        setRoomId(null);
        setGameState(INITIAL_STATE);
    };

    // --- Room Actions ---
    const createRoom = async (classCode: string) => {
        if (!classCode) return false;
        const code = classCode.trim().toUpperCase();
        try {
            const ref = db.collection("rooms").doc(code);
            const snap = await ref.get();

            if (snap.exists) {
                console.log("Room exists, resuming...");
                setRoomId(code);
            } else {
                const newState = { ...INITIAL_STATE, roomId: code };
                await ref.set(newState);
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
        const ref = db.collection("rooms").doc(code);
        const snap = await ref.get();
        if (snap.exists) {
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
            await db.collection("rooms").doc(roomId).update(changes);
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

        // Only allow new joins if in LOBBY
        if (gameState.round !== GameRound.LOBBY) {
            throw new Error("GAME_LOCKED");
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
            round3PackLocked: false,
            round3QuizAnswer: null
        };

        await db.collection("rooms").doc(roomId).update({
            players: firebase.firestore.FieldValue.arrayUnion(newPlayer)
        });
        return newPlayer.id;
    };

    const kickPlayer = async (playerId: string) => {
        if (!roomId) return;
        const playerToRemove = gameState.players.find(p => p.id === playerId);
        if (playerToRemove) {
            await db.collection("rooms").doc(roomId).update({
                players: firebase.firestore.FieldValue.arrayRemove(playerToRemove)
            });
        }
    };

    const setRound = (round: GameRound) => {
        updateState((prev) => ({
            round,
            message: `📢 Entering ${round}...`,
            activeQuestion: null,
            timerEndTime: null,
            buzzerLocked: true,
            round3Phase: 'IDLE',
            round3TurnPlayerId: null,
            activeStealPlayerId: null, // Reset steal
            round1TurnPlayerId: null,
            showAnswer: false,
            viewingPlayerId: null,
            round3Mode: 'ORAL', // Reset mode to ORAL default
            // Clear any round-specific temporary states
            usedQuestionIds: round === GameRound.LOBBY ? [] : prev.usedQuestionIds // Optional: Reset questions if going back to Lobby? No, easier to keep.
        }));
    };

    const setQuestion = (question: Question) => {
        updateState((prev) => {
            const isRound2 = prev.round === GameRound.ROUND_2;
            const updatedPlayers = isRound2 ? prev.players.map(p => ({
                ...p,
                submittedRound2: false,
                round2Code: null,
                round2Time: null
            })) : prev.players.map(p => ({
                ...p,
                round3QuizAnswer: null // Reset quiz answer for new question
            }));

            return {
                activeQuestion: question,
                buzzerLocked: true,
                message: null,
                round2StartedAt: null,
                usedQuestionIds: [...prev.usedQuestionIds, question.id],
                players: updatedPlayers,
                showAnswer: false,
                viewingPlayerId: null,
                activeStealPlayerId: null
            };
        });
    };

    const clearQuestion = () => updateState({ activeQuestion: null, showAnswer: false, activeStealPlayerId: null });

    const startTimer = (seconds: number) => {
        updateState({
            timerEndTime: Date.now() + seconds * 1000,
            buzzerLocked: false
        });
    };

    const startRound2Timer = () => {
        updateState((prev) => {
            let duration = 25;
            if (prev.activeQuestion) {
                switch (prev.activeQuestion.difficulty) {
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
            // Logic Hardening: Only allow filling 'buzzedAt' if explicitly unlocked
            if (!prev.buzzerLocked && prev.activeQuestion) {
                // Double check if anyone else has buzzed in the optimistic state
                const alreadyBuzzed = prev.players.some(p => p.buzzedAt !== null && p.buzzedAt !== undefined);
                if (alreadyBuzzed) return {};

                return {
                    buzzerLocked: true, // Optimistically lock immediately
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
                // Store which mode was used for this question
                newPack[packIndex] = {
                    ...newPack[packIndex],
                    status: newStatus,
                    questionMode: prev.round3Mode // Capture current mode
                };

                const newScore = p.score + scoreDelta;

                return {
                    ...p,
                    round3Pack: newPack,
                    score: newScore < 0 ? 0 : newScore
                };
            })
        }));
    };

    // --- NEW STEAL LOGIC ---

    const activateSteal = (playerId: string) => {
        // Set the active stealer and pause buzzing for others
        updateState({
            activeStealPlayerId: playerId,
            buzzerLocked: true
        });
    };

    const cancelStealPhase = () => {
        updateState({
            round3Phase: 'IDLE',
            activeStealPlayerId: null,
            buzzerLocked: true,
            timerEndTime: null
        });
    };

    const resolveSteal = (stealerId: string, isCorrect: boolean, points: number) => {
        updateState((prev) => {
            // Update score for stealer
            const updatedPlayers = prev.players.map(p => {
                if (p.id === stealerId) {
                    const newScore = p.score + (isCorrect ? points : -points);
                    // If WRONG, remove buzzer so they can't spam, but allow others to buzz
                    return { ...p, score: Math.max(0, newScore), buzzedAt: isCorrect ? p.buzzedAt : null };
                }
                return p;
            });

            if (isCorrect) {
                // Steal Correct: End the turn
                return {
                    players: updatedPlayers,
                    activeQuestion: null,
                    timerEndTime: null,
                    buzzerLocked: true,
                    round3Phase: 'IDLE',
                    activeStealPlayerId: null,
                    round3TurnPlayerId: null
                };
            } else {
                // Steal Wrong: Continue the steal window, unlock buzzers for OTHERS
                return {
                    players: updatedPlayers,
                    activeStealPlayerId: null, // Deselect this player
                    buzzerLocked: false // Re-open for others
                };
            }
        });
    };

    const setRound3Turn = (playerId: string) => {
        updateState({
            round3TurnPlayerId: playerId,
            round3Phase: 'IDLE',
            activeStealPlayerId: null,
            message: null,
            buzzerLocked: true,
            timerEndTime: null,
            activeQuestion: null
        });
    };

    const setRound3Mode = (mode: Round3Mode) => {
        updateState({ round3Mode: mode });
    };

    const submitQuizAnswer = (playerId: string, answer: string) => {
        updateState((prev) => ({
            players: prev.players.map(p => p.id === playerId ? { ...p, round3QuizAnswer: answer } : p)
        }));
    };

    const autoGradeQuiz = () => {
        updateState((prev) => {
            if (!prev.activeQuestion || !prev.round3TurnPlayerId) return { showAnswer: true };

            const currentPlayer = prev.players.find(p => p.id === prev.round3TurnPlayerId);
            if (!currentPlayer) return { showAnswer: true };

            const isCorrect = currentPlayer.round3QuizAnswer === prev.activeQuestion.answer;
            const difficulty = prev.activeQuestion.difficulty || 'EASY';
            const points = difficulty === 'EASY' ? 20 : difficulty === 'MEDIUM' ? 30 : 40;
            const penalty = difficulty === 'EASY' ? -10 : difficulty === 'MEDIUM' ? -15 : -20;

            // Find which pack item corresponds to difficulty (simplified assumption: first PENDING item of that difficulty)
            const packIndex = currentPlayer.round3Pack.findIndex(item => item.difficulty === difficulty && item.status === 'PENDING');

            const scoreDelta = isCorrect ? points : penalty;

            // Allow score update even if packIndex is -1 (Extra questions)
            const updatedPlayers = prev.players.map(p => {
                if (p.id !== prev.round3TurnPlayerId) return p;

                let newPack = [...p.round3Pack];
                // Only update pack status if we found a pending slot
                if (packIndex !== -1) {
                    newPack[packIndex] = {
                        ...newPack[packIndex],
                        status: isCorrect ? 'CORRECT' : 'WRONG',
                        questionMode: prev.round3Mode
                    };
                }

                const newScore = p.score + scoreDelta;
                return { ...p, round3Pack: newPack, score: Math.max(0, newScore) };
            });

            if (isCorrect) {
                return {
                    players: updatedPlayers,
                    showAnswer: true,
                    buzzerLocked: true, // No stealing needed
                    round3Phase: 'IDLE' // End turn
                };
            } else {
                // WRONG ANSWER -> DELAY 3s BEFORE STEAL
                // We do NOT show correct answer yet.
                return {
                    players: updatedPlayers,
                    showAnswer: false, // Keep correct answer hidden
                    round3Phase: 'SHOW_WRONG_DELAY',
                    buzzerLocked: true, // Keep locked during delay
                    timerEndTime: Date.now() + 3000 // 3s delay
                };
            }
        });
    };

    const startStealPhase = () => {
        updateState({
            round3Phase: 'STEAL_WINDOW',
            buzzerLocked: false,
            timerEndTime: Date.now() + 15000, // 15s for stealing
            message: "STEAL WINDOW OPEN!"
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
                // Ensure options are shuffled if they exist
                const finalQ = { ...selectedQ };
                if (finalQ.options) {
                    // Simple shuffle
                    finalQ.options = [...finalQ.options].sort(() => Math.random() - 0.5);
                }

                return {
                    activeQuestion: finalQ,
                    buzzerLocked: true,
                    message: null,
                    usedQuestionIds: [...prev.usedQuestionIds, selectedQ.id],
                    players: prev.players.map(p => ({ ...p, round3QuizAnswer: null })), // Reset quiz answers
                    showAnswer: false
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
            let duration = 15;
            if (type === 'MAIN' && prev.activeQuestion) {
                switch (prev.activeQuestion.difficulty) {
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
                await db.collection("history").doc(archiveId).set({
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
            // Khôi phục usedQuestionIds về rỗng khi reset game
            db.collection("rooms").doc(roomId).set({
                ...INITIAL_STATE,
                roomId,
                players: gameState.players.map(p => ({
                    ...p,
                    score: 0,
                    submittedRound2: false,
                    round3PackLocked: false,
                    round3Pack: [
                        { difficulty: 'EASY', status: 'PENDING' },
                        { difficulty: 'MEDIUM', status: 'PENDING' },
                        { difficulty: 'HARD', status: 'PENDING' }
                    ],
                    round3QuizAnswer: null
                })),
                usedQuestionIds: []
            });
        }
    };

    const forceSync = () => { };

    const toggleShowAnswer = () => {
        updateState((prev) => {
            // If in QUIZ mode and answer is being revealed, trigger auto-grade logic
            if (prev.round3Mode === 'QUIZ' && !prev.showAnswer && prev.activeQuestion) {
                // Logic needs to be handled via autoGradeQuiz if we want the "automatic" behavior
                // But toggleShowAnswer is simple toggle. 
                // Let's modify TeacherDashboard to call autoGradeQuiz instead of toggleShowAnswer in Quiz Mode.
                return { showAnswer: !prev.showAnswer };
            }
            return { showAnswer: !prev.showAnswer };
        });
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
        setViewingPlayer,
        activateSteal,
        resolveSteal,
        cancelStealPhase,
        setRound3Mode,
        submitQuizAnswer,
        autoGradeQuiz,
        startStealPhase,
        kickPlayer
    };
};