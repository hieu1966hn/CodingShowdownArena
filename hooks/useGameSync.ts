import { useEffect, useState } from "react";
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";
import "firebase/compat/auth";
import { db, auth, googleProvider } from "../lib/firebase";
import { GameState, GameRound, Player, Question, Difficulty, PackStatus, Round3Item, Round3Mode, Round3Phase, INITIAL_STATE, PlayerCheckpoint, Checkpoints } from "../gameTypes";
import { ROUND_2_QUESTIONS, ROUND_3_QUESTIONS } from "../data/questions";
import { calculateGradeRound1, calculateGradeRound2Question, calculateGradeRound3Question, calculateActivateSteal, calculateResolveSteal } from "../lib/gameScoring";
import { logger } from "../lib/logger";

const CACHE_KEY = "csa_session_cache";

export const useGameSync = () => {
    const [user, setUser] = useState<firebase.User | null>(null);
    const [roomId, setRoomId] = useState<string | null>(() => {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) return JSON.parse(cached).roomId || null;
        } catch (e) {}
        return null;
    });
    const [gameState, setGameState] = useState<GameState>(() => {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                const parsed = JSON.parse(cached);
                if (parsed.gameState) return parsed.gameState;
            }
        } catch (e) {}
        return INITIAL_STATE;
    });
    const [authLoading, setAuthLoading] = useState(true);
    const [roomError, setRoomError] = useState<string | null>(null);
    const [loginError, setLoginError] = useState<string | null>(null);
    const [isOffline, setIsOffline] = useState(false);

    // --- Persist state ---
    useEffect(() => {
        if (roomId && gameState !== INITIAL_STATE) {
            try {
                localStorage.setItem(CACHE_KEY, JSON.stringify({ roomId, gameState }));
            } catch (e) {}
        }
    }, [roomId, gameState]);


    // --- Auth Listener ---
    useEffect(() => {
        const unsub = auth.onAuthStateChanged((u) => {
            setUser(u);
            setAuthLoading(false);
        });
        return () => unsub();
    }, []);

    // --- Firestore Room Listener with Auto-Reconnect ---
    useEffect(() => {
        if (!roomId) return;

        let retryCount = 0;
        const MAX_RETRIES = 5;
        const RETRY_DELAY_MS = 3000;
        let currentUnsub: (() => void) | null = null;
        let retryTimer: ReturnType<typeof setTimeout> | null = null;
        let isMounted = true;

        const subscribe = () => {
            if (!isMounted) return;

            currentUnsub = db.collection("rooms").doc(roomId).onSnapshot(
                (docSnap) => {
                    if (!isMounted) return;
                    retryCount = 0; // Reset on successful update
                    setIsOffline(false);
                    if (docSnap.exists) {
                        setGameState(docSnap.data() as GameState);
                        setRoomError(null);
                    } else {
                        setRoomError("Room not found!");
                        localStorage.removeItem(CACHE_KEY);
                    }
                },
                (err) => {
                    if (!isMounted) return;
                    logger.error("subscribe_room", err, { roomId });
                    setIsOffline(true);
                    if (retryCount < MAX_RETRIES) {
                        retryCount++;
                        setRoomError(`⚡ Mất kết nối. Đang thử lại... (${retryCount}/${MAX_RETRIES})`);
                        retryTimer = setTimeout(() => {
                            if (currentUnsub) { currentUnsub(); currentUnsub = null; }
                            subscribe();
                        }, RETRY_DELAY_MS * retryCount);
                    } else {
                        setRoomError("❌ Mất kết nối. Vui lòng tải lại trang.");
                    }
                }
            );
        };

        subscribe();

        return () => {
            isMounted = false;
            if (retryTimer) clearTimeout(retryTimer);
            if (currentUnsub) currentUnsub();
        };
    }, [roomId]);

    // --- Auth Actions ---
    const login = async () => {
        setLoginError(null);
        try {
            await auth.signInWithPopup(googleProvider);
            logger.info("auth_login_success", "User logged in with Google popup");
        } catch (e: any) {
            logger.error("auth_login_failed", e);
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
            logger.info("auth_anon_success", "User logged in anonymously");
        } catch (e: any) {
            logger.error("auth_anon_failed", e);
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
        localStorage.removeItem(CACHE_KEY);
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
                const now = new Date();
                const expiresAt = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000); // 60 days TTL
                const newState = {
                    ...INITIAL_STATE,
                    roomId: code,
                    createdAt: firebase.firestore.Timestamp.fromDate(now),
                    expiresAt: firebase.firestore.Timestamp.fromDate(expiresAt),
                };
                await ref.set(newState);
                setRoomId(code);
            }
            return true;
        } catch (e) {
            logger.error("create_room_error", e, { classCode });
            setRoomError("Failed to create room: " + (e as Error).message);
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
            logger.error("update_state_error", e, { roomId, changes });
            setRoomError("Network error: State update failed. " + (e as Error).message);
            // We do not throw because these updates are often fire-and-forget in React handlers
        }
    };

    // --- GAME ACTIONS ---

    const joinGame = async (name: string) => {
        if (!roomId || !user) return null;

        const existingPlayer = gameState.players.find(p => p.id === user.uid);
        if (existingPlayer) {
            return user.uid;
        }

        if (gameState.round === GameRound.GAME_OVER) {
            throw new Error("GAME_OVER");
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
            round2Submissions: [],
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
        updateState((prev) => {
            // AUTO-SAVE CHECKPOINT before transitioning
            let updatedCheckpoints = { ...prev.checkpoints };

            // Save checkpoint when LEAVING a round (entering next round)
            if (prev.round === GameRound.ROUND_1 && round === GameRound.ROUND_2) {
                // Completed Round 1 → Save Checkpoint 1
                updatedCheckpoints.round1 = prev.players.map(p => ({
                    playerId: p.id,
                    playerName: p.name,
                    score: p.score,
                    round1Score: p.score, // R1 score only
                    round2Submissions: p.round2Submissions || [],
                    round3Pack: p.round3Pack || [
                        { difficulty: 'EASY', status: 'PENDING' },
                        { difficulty: 'MEDIUM', status: 'PENDING' },
                        { difficulty: 'HARD', status: 'PENDING' }
                    ],
                    round3PackLocked: p.round3PackLocked ?? false
                }));
            } else if (prev.round === GameRound.ROUND_2 && round === GameRound.ROUND_3) {
                // Completed Round 2 → Save Checkpoint 2
                updatedCheckpoints.round2 = prev.players.map(p => ({
                    playerId: p.id,
                    playerName: p.name,
                    score: p.score,
                    round1Score: updatedCheckpoints.round1?.find(cp => cp.playerId === p.id)?.round1Score || 0,
                    round2Score: p.score - (updatedCheckpoints.round1?.find(cp => cp.playerId === p.id)?.round1Score || 0),
                    round2Submissions: p.round2Submissions || [],
                    round3Pack: p.round3Pack || [
                        { difficulty: 'EASY', status: 'PENDING' },
                        { difficulty: 'MEDIUM', status: 'PENDING' },
                        { difficulty: 'HARD', status: 'PENDING' }
                    ],
                    round3PackLocked: p.round3PackLocked ?? false
                }));
            } else if (prev.round === GameRound.ROUND_3 && round === GameRound.GAME_OVER) {
                // Completed Round 3 → Save Checkpoint 3
                const r1Score = updatedCheckpoints.round1?.find(cp => cp.playerId === prev.players[0]?.id)?.round1Score || 0;
                const r2Score = updatedCheckpoints.round2?.find(cp => cp.playerId === prev.players[0]?.id)?.round2Score || 0;

                updatedCheckpoints.round3 = prev.players.map(p => {
                    const playerR1 = updatedCheckpoints.round1?.find(cp => cp.playerId === p.id)?.round1Score || 0;
                    const playerR2 = updatedCheckpoints.round2?.find(cp => cp.playerId === p.id)?.round2Score || 0;

                    return {
                        playerId: p.id,
                        playerName: p.name,
                        score: p.score,
                        round1Score: playerR1,
                        round2Score: playerR2,
                        round3Score: p.score - playerR1 - playerR2,
                        round2Submissions: p.round2Submissions || [],
                        round3Pack: p.round3Pack || [
                            { difficulty: 'EASY', status: 'PENDING' },
                            { difficulty: 'MEDIUM', status: 'PENDING' },
                            { difficulty: 'HARD', status: 'PENDING' }
                        ],
                        round3PackLocked: p.round3PackLocked ?? false
                    };
                });
            }

            // AUTO-INIT ROUND 2 if entering Round 2 with no questions
            // Dùng ?.length ?? 0 để tránh crash nếu round2Questions undefined (document Firestore cũ)
            let round2AutoInit: Record<string, unknown> = {};
            if (round === GameRound.ROUND_2 && (prev.round2Questions?.length ?? 0) === 0) {
                const availableQuestions = ROUND_2_QUESTIONS.filter(q => !(prev.usedQuestionIds || []).includes(q.id));
                // Fisher-Yates shuffle để đảm bảo ngẫu nhiên thật sự
                const pool = [...availableQuestions];
                for (let i = pool.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [pool[i], pool[j]] = [pool[j], pool[i]];
                }
                const selected = pool.slice(0, 5);

                round2AutoInit = {
                    round2Questions: selected.map(q => q.id),
                    round2CurrentQuestion: 0,
                    activeQuestion: selected[0] || null,
                    usedQuestionIds: [...(prev.usedQuestionIds || []), ...selected.map(q => q.id)],
                    message: `📢 Entering ${round}... (5 questions initialized)`,
                    // Reset all player submissions for fresh start
                    players: prev.players.map(p => ({
                        ...p,
                        round2Submissions: []
                    }))
                };
            }

            // Xây base state trước, rồi spread round2AutoInit SAU CÙNG
            // để round2AutoInit.activeQuestion ghi đè activeQuestion: null đúng cách
            const baseState = {
                round,
                message: `📢 Entering ${round}...`,
                activeQuestion: null,
                timerEndTime: null,
                buzzerLocked: true,
                round3Phase: 'IDLE' as Round3Phase,
                round3TurnPlayerId: null,
                activeStealPlayerId: null,
                round1TurnPlayerId: null,
                showAnswer: false,
                viewingPlayerId: null,
                round3Mode: 'ORAL' as Round3Mode,
                checkpoints: updatedCheckpoints,
                usedQuestionIds: round === GameRound.LOBBY ? [] : (prev.usedQuestionIds || []),
            };

            return { ...baseState, ...round2AutoInit };
        });
    };

    const setQuestion = (question: Question) => {
        updateState((prev) => {
            const isRound1 = prev.round === GameRound.ROUND_1;
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

            // Phase1-A2: Auto-start 5s timer for R1
            const r1AutoTimer = isRound1 ? {
                timerEndTime: Date.now() + 5000,
                buzzerLocked: false
            } : {};

            return {
                activeQuestion: question,
                buzzerLocked: true,
                message: null,
                round2StartedAt: null,
                usedQuestionIds: [...prev.usedQuestionIds, question.id],
                players: updatedPlayers,
                showAnswer: false,
                viewingPlayerId: null,
                activeStealPlayerId: null,
                ...r1AutoTimer
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

    const gradeRound1 = (playerId: string, isCorrect: boolean) => {
        updateState((prev) => {
            const updates = calculateGradeRound1(prev, playerId, isCorrect);
            return updates || {};
        });
    };

    // Phase1-B1: Confirm R2 review — teacher approved the 5-question set
    const confirmRound2Review = () => {
        updateState((prev) => {
            if (prev.round2Questions.length === 0) return {};

            // Start timer for the first question immediately
            const firstQ = ROUND_2_QUESTIONS.find(q => q.id === prev.round2Questions[0]);
            let duration = 25;
            if (firstQ) {
                switch (firstQ.difficulty) {
                    case 'EASY': duration = 20; break;
                    case 'MEDIUM': duration = 60; break;
                    case 'HARD': duration = 120; break;
                    default: duration = 25;
                }
            }
            const now = Date.now();
            return {
                round2Reviewed: true,
                timerEndTime: now + duration * 1000,
                round2StartedAt: now,
                buzzerLocked: true
            };
        });
    };

    const buzz = (playerId: string) => {
        updateState((prev) => {
            // Logic Hardening: Only allow filling 'buzzedAt' if explicitly unlocked
            if (!prev.buzzerLocked && prev.activeQuestion) {
                // If STEAL WINDOW, allow multiple buzzers & pause timer
                if (prev.round3Phase === 'STEAL_WINDOW') {
                    // Check if user already buzzed
                    const userAlreadyBuzzed = prev.players.find(p => p.id === playerId)?.buzzedAt;
                    if (userAlreadyBuzzed) return {}; // Prevent spamming by same user

                    const updates: Partial<GameState> = {
                        players: prev.players.map(p => p.id === playerId ? { ...p, buzzedAt: Date.now() } : p),
                        message: `${prev.players.find(p => p.id === playerId)?.name} WANTS TO STEAL!`
                    };

                    // PAUSE TIMER ON FIRST BUZZ? Or every buzz?
                    // We only pause if timer is currently running.
                    if (prev.timerEndTime) {
                        const remaining = Math.max(0, prev.timerEndTime - Date.now());
                        updates.timerEndTime = null;
                        updates.stealTimerPausedRemaining = remaining;
                    }

                    return updates;
                }

                // Initial Round 3 Buzz (Main Answer) - Single buzzer only
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
            // STRICT DEADLINE CHECK
            if (prev.timerEndTime && Date.now() > prev.timerEndTime) {
                console.warn(`Player ${playerId} submitted late! Rejected.`);
                return {};
            }

            const now = Date.now();
            const timeTaken = prev.round2StartedAt ? (now - prev.round2StartedAt) / 1000 : 0;
            const currentQuestionId = prev.round2Questions[prev.round2CurrentQuestion] || 'unknown';

            return {
                players: prev.players.map(p => {
                    if (p.id !== playerId) return p;

                    const submissions = p.round2Submissions || [];
                    // Check if already submitted for this question
                    const alreadySubmitted = submissions.some(s => s.questionId === currentQuestionId);
                    if (alreadySubmitted) return p; // Prevent duplicate submission

                    return {
                        ...p,
                        round2Submissions: [
                            ...submissions,
                            {
                                questionId: currentQuestionId,
                                code,
                                time: timeTaken
                            }
                        ]
                    };
                })
            };
        });
    };

    const gradeRound2Question = (playerId: string, isCorrect: boolean) => {
        updateState((prev) => {
            const updates = calculateGradeRound2Question(prev, playerId, isCorrect);
            return updates || {};
        });
    };

    // Keep old gradeRound2 for backward compatibility (deprecated)
    const gradeRound2 = (playerId: string, isCorrect: boolean, basePoints: number) => {
        // Redirect to new function
        gradeRound2Question(playerId, isCorrect);
    };

    const setRound1Turn = (playerId: string | null) => updateState({ round1TurnPlayerId: playerId, showAnswer: false, activeQuestion: null, timerEndTime: null });

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
        updateState((prev) => {
            const updates = calculateGradeRound3Question(prev, playerId, packIndex, newStatus, scoreDelta);
            return updates || {};
        });
    };

    // --- NEW STEAL LOGIC ---

    const activateSteal = (playerId: string) => {
        updateState((prev) => {
            const updates = calculateActivateSteal(prev, playerId);
            return updates || {};
        });
    };

    const cancelStealPhase = () => {
        updateState((prev) => ({
            round3Phase: 'IDLE',
            activeStealPlayerId: null,
            buzzerLocked: true,
            timerEndTime: null,
            activeQuestion: null,
            showAnswer: false,
            stealTimerPausedRemaining: null,
            players: prev.players.map(p => ({ ...p, buzzedAt: null }))
        }));
    };

    const resolveSteal = (stealerId: string, isCorrect: boolean, points: number) => {
        updateState((prev) => {
            const updates = calculateResolveSteal(prev, stealerId, isCorrect, points);
            return updates || {};
        });
    };

    const setRound3Turn = (playerId: string | null) => {
        updateState((prev) => {
            const baseReset = {
                round3TurnPlayerId: playerId,
                round3Phase: 'IDLE' as Round3Phase,
                activeStealPlayerId: null,
                message: null,
                buzzerLocked: true,
                timerEndTime: null,
                activeQuestion: null,
                showAnswer: false,
                stealTimerPausedRemaining: null,
                players: prev.players.map(p => ({ ...p, buzzedAt: null }))
            };

            // null → just reset, no auto-reveal
            if (!playerId) return baseReset;

            // Find the first PENDING pack item for this player
            const player = prev.players.find(p => p.id === playerId);
            const nextPending = player?.round3Pack.find(item => item.status === 'PENDING');

            if (!nextPending) return baseReset; // no pending questions, just set turn

            // Auto-reveal: pick a question of the right difficulty
            const difficulty = nextPending.difficulty;
            let pool = ROUND_3_QUESTIONS.filter(q =>
                q.difficulty === difficulty &&
                !prev.usedQuestionIds.includes(q.id)
            );
            // Pool recycling: when all questions of this difficulty have been used,
            // fall back to the full difficulty pool (no "no questions remaining" crash)
            if (pool.length === 0) {
                pool = ROUND_3_QUESTIONS.filter(q => q.difficulty === difficulty);
            }

            const selectedQ = prev.round3SelectionMode === 'SEQUENTIAL'
                ? pool[0]
                : pool[Math.floor(Math.random() * pool.length)];

            if (!selectedQ) return baseReset; // truly no questions exist for this difficulty

            // Build finalQ without undefined fields (Firestore rejects undefined)
            const hasOptions = Array.isArray(selectedQ.options) && selectedQ.options.length > 0;
            const finalQ: Question = {
                id: selectedQ.id,
                content: selectedQ.content,
                answer: selectedQ.answer,
                difficulty: selectedQ.difficulty,
                points: selectedQ.points,
                ...(hasOptions ? { options: [...selectedQ.options!] } : {}),
                ...(selectedQ.category ? { category: selectedQ.category } : {}),
            };

            // Fisher-Yates shuffle options
            if (finalQ.options) {
                const opts = finalQ.options;
                for (let i = opts.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [opts[i], opts[j]] = [opts[j], opts[i]];
                }
                finalQ.options = opts;
            }

            // Timer duration based on difficulty
            let timerDuration = 15;
            switch (difficulty) {
                case 'EASY':   timerDuration = 20;  break;
                case 'MEDIUM': timerDuration = 60;  break;
                case 'HARD':   timerDuration = 120; break;
            }

            return {
                ...baseReset,
                round3TurnPlayerId: playerId,
                activeQuestion: finalQ,
                round3Phase: 'MAIN_ANSWER' as Round3Phase,
                timerEndTime: Date.now() + timerDuration * 1000,
                usedQuestionIds: [...prev.usedQuestionIds, selectedQ.id],
                players: prev.players.map(p => ({
                    ...p,
                    buzzedAt: null,
                    round3QuizAnswer: p.id === playerId ? null : p.round3QuizAnswer
                })),
                showAnswer: false
            };
        });
    };


    const setRound3Mode = (mode: Round3Mode) => {
        updateState((prev) => {
            // Mode lock while a question flow is active.
            if (prev.activeQuestion || prev.round3Phase !== 'IDLE' || prev.round3TurnPlayerId) {
                return {};
            }
            return { round3Mode: mode };
        });
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
            // NEW SCORING: EASY=40, MEDIUM=60, HARD=80
            const points = difficulty === 'EASY' ? 40 : difficulty === 'MEDIUM' ? 60 : 80;

            // Find which pack item corresponds to difficulty (simplified assumption: first PENDING item of that difficulty)
            const packIndex = currentPlayer.round3Pack.findIndex(item => item.difficulty === difficulty && item.status === 'PENDING');

            // TIMEOUT check: If no answer selected, scoreDelta is 0 (No penalty)
            let scoreDelta = 0;
            let status: PackStatus = 'SKIP';

            if (!currentPlayer.round3QuizAnswer) {
                // Timeout / No Answer
                scoreDelta = 0;
                status = 'SKIP';
            } else {
                // Answered: CORRECT = +points, WRONG = -points (SAME VALUE!)
                if (isCorrect) {
                    scoreDelta = points;
                    status = 'CORRECT';
                } else {
                    scoreDelta = -points; // -40, -60, or -80
                    status = 'WRONG';
                }
            }

            // Allow score update even if packIndex is -1 (Extra questions)
            let updatedPlayers = prev.players.map(p => {
                if (p.id !== prev.round3TurnPlayerId) return p;

                let newPack = [...p.round3Pack];
                // Only update pack status if we found a pending slot
                if (packIndex !== -1) {
                    newPack[packIndex] = {
                        ...newPack[packIndex],
                        status: status,
                        questionMode: prev.round3Mode
                    };
                }

                const newScore = p.score + scoreDelta;
                return { ...p, round3Pack: newPack, score: Math.max(0, newScore) };
            });

            if (isCorrect) {
                // Correct answer should close current question immediately
                // so Round 3 auto-flow can reveal the next pending question.
                updatedPlayers = updatedPlayers.map(p => ({ ...p, buzzedAt: null }));

                return {
                    players: updatedPlayers,
                    showAnswer: true,
                    buzzerLocked: false,
                    round3Phase: 'IDLE',
                    activeQuestion: null,
                    timerEndTime: null,
                    message: '✅ Chính xác! Tự chuyển sang câu tiếp theo...'
                };
            } else {
                // WRONG ANSWER -> DELAY 3s BEFORE STEAL
                // We do NOT show correct answer yet.
                return {
                    players: updatedPlayers,
                    showAnswer: false, // Keep correct answer hidden
                    round3Phase: 'SHOW_WRONG_DELAY',
                    buzzerLocked: true, // Keep locked during delay
                    timerEndTime: Date.now() + 5000 // 5s delay
                };
            }
        });
    };

    const startStealPhase = () => {
        updateState((prev) => ({
            round3Phase: 'STEAL_WINDOW',
            buzzerLocked: false,
            timerEndTime: Date.now() + 15000, // 15s for stealing
            message: "STEAL WINDOW OPEN!",
            activeStealPlayerId: null,
            stealTimerPausedRemaining: null,
            players: prev.players.map(p => ({ ...p, buzzedAt: p.id === prev.round3TurnPlayerId ? p.buzzedAt : null }))
        }));
    };

    const setRound3SelectionMode = (mode: 'RANDOM' | 'SEQUENTIAL') => {
        updateState({ round3SelectionMode: mode });
    };

    const revealRound3Question = (difficulty: Difficulty) => {
        updateState((prev) => {
            let pool = ROUND_3_QUESTIONS.filter(q =>
                q.difficulty === difficulty &&
                !prev.usedQuestionIds.includes(q.id)
            );
            // Pool recycling: when all questions of this difficulty have been used,
            // fall back to the full difficulty pool instead of showing an error
            if (pool.length === 0) {
                pool = ROUND_3_QUESTIONS.filter(q => q.difficulty === difficulty);
            }

            let selectedQ: Question | undefined;

            if (prev.round3SelectionMode === 'SEQUENTIAL') {
                selectedQ = pool[0];
            } else {
                selectedQ = pool[Math.floor(Math.random() * pool.length)];
            }

            if (selectedQ) {
                // Deep copy to avoid mutating original ROUND_3_QUESTIONS source data
                // IMPORTANT: exclude `options` entirely when undefined — Firestore rejects undefined fields
                const hasOptions = Array.isArray(selectedQ.options) && selectedQ.options.length > 0;
                const finalQ: Question = {
                    id: selectedQ.id,
                    content: selectedQ.content,
                    answer: selectedQ.answer,
                    difficulty: selectedQ.difficulty,
                    points: selectedQ.points,
                    ...(hasOptions ? { options: [...selectedQ.options!] } : {}),
                    ...(selectedQ.category ? { category: selectedQ.category } : {}),
                };

                // Fisher-Yates shuffle — đảm bảo xáo trộn đều, không bias
                if (finalQ.options) {
                    const opts = finalQ.options;
                    for (let i = opts.length - 1; i > 0; i--) {
                        const j = Math.floor(Math.random() * (i + 1));
                        [opts[i], opts[j]] = [opts[j], opts[i]];
                    }
                    finalQ.options = opts;
                }
                // answer vẫn là text gốc => grading so sánh text đúng dù options đã bị xáo

                // Compute timer duration based on difficulty — done atomically here
                // to avoid the stale-closure bug where a separate C2 useEffect read
                // null activeQuestion and always defaulted to 15s.
                let timerDuration = 15;
                switch (difficulty) {
                    case 'EASY':   timerDuration = 20;  break;
                    case 'MEDIUM': timerDuration = 60;  break;
                    case 'HARD':   timerDuration = 120; break;
                }

                return {
                    activeQuestion: finalQ,
                    // Auto-start timer atomically with reveal
                    round3Phase: 'MAIN_ANSWER' as Round3Phase,
                    timerEndTime: Date.now() + timerDuration * 1000,
                    buzzerLocked: true,
                    message: null,
                    usedQuestionIds: [...prev.usedQuestionIds, selectedQ.id],
                    players: prev.players.map(p => ({ ...p, round3QuizAnswer: null })),
                    showAnswer: false
                };
            } else {
                // Truly no questions exist for this difficulty in the database
                return {};
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
                logger.info("room_archived", "Successfully archived ended room", { roomId });
            } catch (e) {
                logger.error("archive_game_error", e, { roomId });
            }
        }

        // Auto-delete anonymous accounts of players in this room
        // Only the CURRENT user can delete their own account (Firebase client-side limitation)
        // So we delete the current user's account if they are anonymous
        try {
            const currentUser = auth.currentUser;
            if (currentUser && currentUser.isAnonymous) {
                await currentUser.delete();
                console.log("Anonymous user account deleted after game end:", currentUser.uid);
            }
        } catch (e) {
            // Non-critical: silently ignore if deletion fails
            console.warn("Could not delete anonymous user account:", e);
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
                        { difficulty: 'EASY' as Difficulty, status: 'PENDING' as PackStatus },
                        { difficulty: 'MEDIUM' as Difficulty, status: 'PENDING' as PackStatus },
                        { difficulty: 'HARD' as Difficulty, status: 'PENDING' as PackStatus }
                    ],
                    round3QuizAnswer: null
                })),
                usedQuestionIds: []
            });
        }
    };

    // NEW: Reset Level Functions - Restore from checkpoints
    const resetToRound1 = () => {
        if (!gameState.checkpoints?.round1) {
            alert('No checkpoint found for Round 1!');
            return;
        }

        updateState((prev) => {
            const checkpoint = prev.checkpoints?.round1;
            if (!checkpoint) return {};

            // Restore players from checkpoint
            const restoredPlayers = prev.players.map(p => {
                const cp = checkpoint.find(c => c.playerId === p.id);
                if (!cp) return p; // Keep current if no checkpoint

                return {
                    ...p,
                    score: cp.round1Score || 0,
                    round2Submissions: [],
                    round3Pack: [
                        { difficulty: 'EASY' as Difficulty, status: 'PENDING' as PackStatus },
                        { difficulty: 'MEDIUM' as Difficulty, status: 'PENDING' as PackStatus },
                        { difficulty: 'HARD' as Difficulty, status: 'PENDING' as PackStatus }
                    ],
                    round3PackLocked: false,
                    round3QuizAnswer: null
                };
            });

            return {
                round: GameRound.ROUND_1,
                players: restoredPlayers,
                activeQuestion: null,
                timerEndTime: null,
                buzzerLocked: true,
                round3Phase: 'IDLE',
                round3TurnPlayerId: null,
                activeStealPlayerId: null,
                round1TurnPlayerId: null,
                showAnswer: false,
                message: '🔄 Reset to Round 1 checkpoint',
                round2CurrentQuestion: 0,
                round2Questions: []
            };
        });
    };

    const resetToRound2 = () => {
        if (!gameState.checkpoints?.round2) {
            alert('No checkpoint found for Round 2!');
            return;
        }

        updateState((prev) => {
            const checkpoint = prev.checkpoints?.round2;
            if (!checkpoint) return {};

            // Restore players from checkpoint
            const restoredPlayers = prev.players.map(p => {
                const cp = checkpoint.find(c => c.playerId === p.id);
                if (!cp) return p;

                return {
                    ...p,
                    score: (cp.round1Score || 0) + (cp.round2Score || 0),
                    round2Submissions: cp.round2Submissions || [],
                    round3Pack: [
                        { difficulty: 'EASY' as Difficulty, status: 'PENDING' as PackStatus },
                        { difficulty: 'MEDIUM' as Difficulty, status: 'PENDING' as PackStatus },
                        { difficulty: 'HARD' as Difficulty, status: 'PENDING' as PackStatus }
                    ],
                    round3PackLocked: false,
                    round3QuizAnswer: null
                };
            });

            return {
                round: GameRound.ROUND_2,
                players: restoredPlayers,
                activeQuestion: null,
                timerEndTime: null,
                buzzerLocked: true,
                round3Phase: 'IDLE',
                round3TurnPlayerId: null,
                activeStealPlayerId: null,
                round1TurnPlayerId: null,
                showAnswer: false,
                message: '🔄 Reset to Round 2 checkpoint',
                round2CurrentQuestion: 0,
                round2Questions: []
            };
        });
    };

    const resetToRound3 = () => {
        if (!gameState.checkpoints?.round3) {
            alert('No checkpoint found for Round 3!');
            return;
        }

        updateState((prev) => {
            const checkpoint = prev.checkpoints?.round3;
            if (!checkpoint) return {};

            // Restore players from checkpoint
            const restoredPlayers = prev.players.map(p => {
                const cp = checkpoint.find(c => c.playerId === p.id);
                if (!cp) return p;

                return {
                    ...p,
                    score: (cp.round1Score || 0) + (cp.round2Score || 0) + (cp.round3Score || 0),
                    round2Submissions: cp.round2Submissions || [],
                    round3Pack: cp.round3Pack || [
                        { difficulty: 'EASY' as Difficulty, status: 'PENDING' as PackStatus },
                        { difficulty: 'MEDIUM' as Difficulty, status: 'PENDING' as PackStatus },
                        { difficulty: 'HARD' as Difficulty, status: 'PENDING' as PackStatus }
                    ],
                    round3PackLocked: cp.round3PackLocked || false,
                    round3QuizAnswer: null
                };
            });

            return {
                round: GameRound.ROUND_3,
                players: restoredPlayers,
                activeQuestion: null,
                timerEndTime: null,
                buzzerLocked: true,
                round3Phase: 'IDLE',
                round3TurnPlayerId: null,
                activeStealPlayerId: null,
                round1TurnPlayerId: null,
                showAnswer: false,
                message: '🔄 Reset to Round 3 checkpoint'
            };
        });
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

    // NEW: Round 2 Multi-Question Management
    const initRound2Questions = () => {
        updateState((prev) => {
            // Select 5 random questions from Round 2 pool
            const availableQuestions = ROUND_2_QUESTIONS.filter(q => !prev.usedQuestionIds.includes(q.id));
            const shuffled = [...availableQuestions].sort(() => Math.random() - 0.5);
            const selected = shuffled.slice(0, 5);

            return {
                round2Questions: selected.map(q => q.id),
                round2CurrentQuestion: 0,
                activeQuestion: selected[0] || null,
                usedQuestionIds: [...prev.usedQuestionIds, ...selected.map(q => q.id)],
                // Reset all player submissions
                players: prev.players.map(p => ({
                    ...p,
                    round2Submissions: []
                }))
            };
        });
    };

    const nextRound2Question = () => {
        updateState((prev) => {
            const nextIndex = prev.round2CurrentQuestion + 1;
            if (nextIndex >= 5 || nextIndex >= prev.round2Questions.length) {
                // All 5 questions done
                return {
                    round2CurrentQuestion: nextIndex,
                    activeQuestion: null,
                    timerEndTime: null,
                    message: "Round 2 Complete!"
                };
            }

            // Load next question
            const nextQuestionId = prev.round2Questions[nextIndex];
            const nextQuestion = ROUND_2_QUESTIONS.find(q => q.id === nextQuestionId);

            // Phase1-B1: Auto-start timer for next question
            let duration = 25;
            if (nextQuestion) {
                switch (nextQuestion.difficulty) {
                    case 'EASY': duration = 20; break;
                    case 'MEDIUM': duration = 60; break;
                    case 'HARD': duration = 120; break;
                    default: duration = 25;
                }
            }
            const now = Date.now();

            return {
                round2CurrentQuestion: nextIndex,
                activeQuestion: nextQuestion || null,
                round2StartedAt: now,
                timerEndTime: now + duration * 1000,
                showAnswer: false,
                viewingPlayerId: null
            };
        });
    };

    const replaceRound2QuestionAt = (targetIndex: number, newQuestion: Question) => {
        updateState((prev) => {
            if (targetIndex < 0 || targetIndex >= prev.round2Questions.length) return {};

            const newQuestions = [...prev.round2Questions];
            const oldQuestionId = newQuestions[targetIndex];

            // Prevent duplicate question IDs inside the 5-question set
            if (newQuestions.includes(newQuestion.id) && oldQuestionId !== newQuestion.id) {
                return {};
            }

            // Replace question at selected slot
            newQuestions[targetIndex] = newQuestion.id;

            // Update usedQuestionIds: remove old, add new
            const updatedUsedIds = prev.usedQuestionIds.filter(id => id !== oldQuestionId);
            if (!updatedUsedIds.includes(newQuestion.id)) {
                updatedUsedIds.push(newQuestion.id);
            }

            // Remove submissions for OLD question from all players (if any)
            const updatedPlayers = prev.players.map(p => ({
                ...p,
                round2Submissions: (p.round2Submissions || []).filter(
                    sub => sub.questionId !== oldQuestionId
                )
            }));

            // If replacing current active question, also switch activeQuestion immediately
            const shouldSwapActive = targetIndex === prev.round2CurrentQuestion;

            return {
                round2Questions: newQuestions,
                activeQuestion: shouldSwapActive ? newQuestion : prev.activeQuestion,
                usedQuestionIds: updatedUsedIds,
                players: updatedPlayers,
                showAnswer: shouldSwapActive ? false : prev.showAnswer,
                viewingPlayerId: shouldSwapActive ? null : prev.viewingPlayerId
            };
        });
    };

    // Backward-compatible wrapper: replace current question
    const replaceRound2Question = (newQuestion: Question) => {
        replaceRound2QuestionAt(gameState.round2CurrentQuestion, newQuestion);
    };


    return {
        user,
        authLoading,
        login,
        loginAnonymous,
        logout,
        loginError,

        isOffline,

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
        gradeRound1,
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
        kickPlayer,
        gradeRound2,
        gradeRound2Question,
        initRound2Questions,
        confirmRound2Review,
        nextRound2Question,
        replaceRound2Question,
        replaceRound2QuestionAt,
        // NEW: Reset Level functions
        resetToRound1,
        resetToRound2,
        resetToRound3
    };
};