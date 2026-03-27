import { GameState, PackStatus } from '../gameTypes';

export const calculateGradeRound1 = (prev: GameState, playerId: string, isCorrect: boolean): Partial<GameState> | null => {
    const playerCount = prev.players.length;
    const maxQuestions = playerCount >= 10 ? 5 : 10;
    const points = playerCount >= 10 ? 30 : 15;
    const currentAsked = prev.round1QuestionsAsked[playerId] || 0;
    const newAsked = currentAsked + 1;

    // Update the counter
    const updatedAsked = { ...prev.round1QuestionsAsked, [playerId]: newAsked };

    // Update score if correct
    const updatedPlayers = prev.players.map(p => {
        if (p.id !== playerId) return p;
        if (!isCorrect) return p;
        return { ...p, score: p.score + points };
    });

    // Auto-clear activeQuestion + if student reached quota, clear turn
    const shouldClearTurn = newAsked >= maxQuestions;

    return {
        players: updatedPlayers,
        round1QuestionsAsked: updatedAsked,
        // Auto-clear question after grading
        activeQuestion: null,
        showAnswer: false,
        timerEndTime: null,
        buzzerLocked: true,
        ...(shouldClearTurn ? { round1TurnPlayerId: null } : {})
    };
};

export const calculateGradeRound2Question = (prev: GameState, playerId: string, isCorrect: boolean): Partial<GameState> | null => {
    const currentQuestionId = prev.round2Questions[prev.round2CurrentQuestion];
    if (!currentQuestionId) return null;

    const BASE_POINTS = 30;
    const SPEED_BONUSES = [6, 4, 2]; // Top 1, 2, 3

    const targetPlayer = prev.players.find(p => p.id === playerId);
    const targetSubmission = (targetPlayer?.round2Submissions || []).find(
        s => s.questionId === currentQuestionId
    );
    if (!targetSubmission) return null;

    // Recompute the whole question so re-grading also fixes bonus ranks and score totals.
    const flaggedPlayers = prev.players.map(p => {
        if (p.id !== playerId) return p;
        return {
            ...p,
            round2Submissions: (p.round2Submissions || []).map(s =>
                s.questionId === currentQuestionId ? { ...s, isCorrect } : s
            )
        };
    });

    const correctSubmissions: Array<{ playerId: string; time: number }> = [];
    flaggedPlayers.forEach(p => {
        const sub = (p.round2Submissions || []).find(
            s => s.questionId === currentQuestionId && s.isCorrect
        );
        if (sub) correctSubmissions.push({ playerId: p.id, time: sub.time });
    });
    correctSubmissions.sort((a, b) => a.time - b.time);

    const updatedPlayers = flaggedPlayers.map((player, index) => {
        const previousPlayer = prev.players[index];
        const previousSubmission = (previousPlayer.round2Submissions || []).find(
            s => s.questionId === currentQuestionId
        );
        const currentSubmission = (player.round2Submissions || []).find(
            s => s.questionId === currentQuestionId
        );

        const previousPoints = previousSubmission?.points || 0;
        let nextPoints: number | undefined;

        if (currentSubmission?.isCorrect) {
            const rank = correctSubmissions.findIndex(cs => cs.playerId === player.id);
            const bonus = rank >= 0 && rank < 3 ? SPEED_BONUSES[rank] : 0;
            nextPoints = BASE_POINTS + bonus;
        }

        const scoreDelta = (nextPoints || 0) - previousPoints;
        return {
            ...player,
            round2Submissions: (player.round2Submissions || []).map(s => {
                if (s.questionId !== currentQuestionId) return s;

                const { points: _oldPoints, ...rest } = s;
                return {
                    ...rest,
                    ...(nextPoints !== undefined ? { points: nextPoints } : {})
                };
            }),
            score: Math.max(0, player.score + scoreDelta)
        };
    });

    return { players: updatedPlayers };
};

export const calculateGradeRound3Question = (prev: GameState, playerId: string, packIndex: number, newStatus: PackStatus, scoreDelta: number, now: number = Date.now()): Partial<GameState> | null => {
    const updatedPlayers = prev.players.map(p => {
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
    });

    const currentPlayer = updatedPlayers.find(p => p.id === playerId);

    if (newStatus === 'WRONG' || newStatus === 'SKIP') {
        return {
            players: updatedPlayers,
            showAnswer: false,
            round3Phase: 'SHOW_WRONG_DELAY',
            buzzerLocked: true,
            timerEndTime: now + 5000,
            message: newStatus === 'SKIP'
                ? `⏭️ Question skipped. Steal window opening...`
                : `❌ Wrong answer! Steal window opening...`
        };
    }

    const allQuestionsAnswered = currentPlayer?.round3Pack.every(item => item.status !== 'PENDING');
    if (allQuestionsAnswered) {
        return {
            players: updatedPlayers,
            round3TurnPlayerId: null,
            round3Phase: 'IDLE',
            activeQuestion: null,
            round3ActivePackIndex: null,
            timerEndTime: null,
            message: `🎉 ${currentPlayer?.name} completed all questions!`
        };
    }

    return {
        players: updatedPlayers,
        round3Phase: 'IDLE',
        activeQuestion: null,
        round3ActivePackIndex: null,
        timerEndTime: null
    };
};

export const calculateActivateSteal = (prev: GameState, playerId: string, now: number = Date.now()): Partial<GameState> => {
    // Resume Timer if it was paused
    let newEndTime = prev.timerEndTime;
    if (prev.stealTimerPausedRemaining !== null && prev.stealTimerPausedRemaining !== undefined) {
        newEndTime = now + prev.stealTimerPausedRemaining;
    } else if (!prev.timerEndTime) {
        // Fallback if somehow no time stored
        newEndTime = now + 10000;
    }

    return {
        activeStealPlayerId: playerId,
        buzzerLocked: true, // Lock others out
        timerEndTime: newEndTime,
        stealTimerPausedRemaining: null // Clear paused state
    };
};

export const calculateResolveSteal = (prev: GameState, stealerId: string, isCorrect: boolean, points: number): Partial<GameState> => {
    // Update score for stealer
    let updatedPlayers = prev.players.map(p => {
        if (p.id === stealerId) {
            // CORRECT: +points, WRONG: -points (SAME VALUE!)
            const scoreDelta = isCorrect ? points : -points;
            const newScore = p.score + scoreDelta;
            // Use a negative sentinel to mark "already attempted this steal window"
            // without keeping the player visible in the current queue.
            return { ...p, score: Math.max(0, newScore), buzzedAt: isCorrect ? p.buzzedAt : -1 };
        }
        return p;
    });

    if (isCorrect) {
        // Steal Correct: clear the current question
        updatedPlayers = updatedPlayers.map(p => ({ ...p, buzzedAt: null }));

        // Check if the ORIGINAL turn player still has pending questions
        const originalPlayerId = prev.round3TurnPlayerId;
        const originalPlayer = updatedPlayers.find(p => p.id === originalPlayerId);
        const hasPendingLeft = originalPlayer?.round3Pack.some(item => item.status === 'PENDING') ?? false;

        return {
            players: updatedPlayers,
            activeQuestion: null,
            round3ActivePackIndex: null,
            timerEndTime: null,
            buzzerLocked: true,
            round3Phase: 'IDLE',
            activeStealPlayerId: null,
            // Keep original player's turn if they still have PENDING questions.
            // C1 useEffect will auto-reveal their next question.
            // Only null out the turn if all their questions are done (→ C4 advances to next player).
            round3TurnPlayerId: hasPendingLeft ? originalPlayerId : null
        };
    } else {
        // Steal Wrong: Continue the steal window, unlock buzzers for OTHERS
        return {
            players: updatedPlayers,
            activeStealPlayerId: null, // Deselect this player
            buzzerLocked: false // Re-open for others
        };
    }
};

export const calculateStealTimeoutPenalty = (prev: GameState, stealerId: string, points: number): Partial<GameState> => {
    const updatedPlayers = prev.players
        .map(p => p.id === stealerId
            ? { ...p, score: Math.max(0, p.score - points) }
            : p)
        .map(p => ({ ...p, buzzedAt: null }));

    const originalPlayerId = prev.round3TurnPlayerId;
    const originalPlayer = updatedPlayers.find(p => p.id === originalPlayerId);
    const hasPendingLeft = originalPlayer?.round3Pack.some(item => item.status === 'PENDING') ?? false;

    return {
        players: updatedPlayers,
        round3Phase: 'IDLE',
        round3TurnPlayerId: hasPendingLeft ? originalPlayerId : null,
        activeStealPlayerId: null,
        buzzerLocked: true,
        timerEndTime: null,
        activeQuestion: null,
        round3ActivePackIndex: null,
        showAnswer: false,
        stealTimerPausedRemaining: null,
        message: '⏱️ Steal timeout. Penalty applied.'
    };
};
