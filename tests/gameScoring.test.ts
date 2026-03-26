import { describe, it, expect } from 'vitest';
import {
    calculateGradeRound1,
    calculateGradeRound2Question,
    calculateGradeRound3Question,
    calculateActivateSteal,
    calculateResolveSteal,
} from '../lib/gameScoring';
import { GameState, Player, INITIAL_STATE } from '../gameTypes';

const mockPlayer: Player = {
    id: 'p1',
    name: 'Player 1',
    score: 100,
    isOnline: true,
    round2Submissions: [],
    round3Pack: [
        { difficulty: 'EASY', status: 'PENDING' },
        { difficulty: 'MEDIUM', status: 'PENDING' },
        { difficulty: 'HARD', status: 'PENDING' }
    ],
    round3PackLocked: false,
};

const mockPlayer2: Player = {
    ...mockPlayer,
    id: 'p2',
    name: 'Player 2',
    score: 50,
};

const defaultState: GameState = {
    ...INITIAL_STATE,
    roomId: 'test-room',
    players: [mockPlayer, mockPlayer2],
    round1TurnPlayerId: 'p1',
    round1QuestionsAsked: { p1: 4 },
    round2CurrentQuestion: 0,
    round2Questions: ['q1', 'q2'],
    round3Phase: 'IDLE',
    round3Mode: 'QUIZ',
};

describe('gameScoring', () => {
    describe('calculateGradeRound1', () => {
        it('should award 15 points to correct player when < 10 players and keep turn if quota not reached', () => {
            const state = calculateGradeRound1(defaultState, 'p1', true);

            expect(state?.players?.[0].score).toBe(115);
            expect(state?.round1QuestionsAsked?.p1).toBe(5);
            expect(state?.round1TurnPlayerId).toBeUndefined();
            expect(state?.activeQuestion).toBeNull();
            expect(state?.buzzerLocked).toBe(true);
        });

        it('should clear turn when quota reached for rooms under 10 players', () => {
            const modifiedState = { ...defaultState, round1QuestionsAsked: { p1: 9 } };
            const state = calculateGradeRound1(modifiedState, 'p1', false);

            expect(state?.players?.[0].score).toBe(100);
            expect(state?.round1QuestionsAsked?.p1).toBe(10);
            expect(state?.round1TurnPlayerId).toBeNull();
        });

        it('should award 30 points and clear turn at quota for rooms with 10 or more players', () => {
            const extraPlayers = Array.from({ length: 8 }, (_, index) => ({
                ...mockPlayer,
                id: `extra-${index}`,
                name: `Extra ${index}`,
                score: 0,
            }));

            const crowdedState: GameState = {
                ...defaultState,
                players: [mockPlayer, mockPlayer2, ...extraPlayers],
                round1QuestionsAsked: { p1: 4 },
            };

            const state = calculateGradeRound1(crowdedState, 'p1', true);

            expect(state?.players?.[0].score).toBe(130);
            expect(state?.round1QuestionsAsked?.p1).toBe(5);
            expect(state?.round1TurnPlayerId).toBeNull();
        });
    });

    describe('calculateGradeRound2Question', () => {
        it('should calculate points including speed bonus', () => {
            const modifiedState: GameState = {
                ...defaultState,
                players: [
                    { ...mockPlayer, round2Submissions: [{ questionId: 'q1', code: 'console.log("A")', time: 1000 }] },
                    { ...mockPlayer2, round2Submissions: [{ questionId: 'q1', code: 'console.log("A")', time: 2000 }] }
                ]
            };

            const state = calculateGradeRound2Question(modifiedState, 'p1', true);

            expect(state?.players?.[0].score).toBe(136);
            expect(state?.players?.[0].round2Submissions[0].points).toBe(36);
        });

        it('should not award points for wrong answers', () => {
            const modifiedState: GameState = {
                ...defaultState,
                players: [
                    { ...mockPlayer, round2Submissions: [{ questionId: 'q1', code: 'console.log("A")', time: 1000 }] },
                ]
            };

            const state = calculateGradeRound2Question(modifiedState, 'p1', false);

            expect(state?.players?.[0].score).toBe(100);
            expect(state?.players?.[0].round2Submissions[0].isCorrect).toBe(false);
            expect(state?.players?.[0].round2Submissions[0].points).toBeUndefined();
        });

        it('should skip duplicate grading and only update correctness flag if points already exist', () => {
            const modifiedState: GameState = {
                ...defaultState,
                players: [
                    {
                        ...mockPlayer,
                        score: 136,
                        round2Submissions: [{ questionId: 'q1', code: 'console.log("A")', time: 1000, points: 36, isCorrect: true }]
                    },
                    mockPlayer2,
                ]
            };

            const state = calculateGradeRound2Question(modifiedState, 'p1', false);

            expect(state?.players?.[0].score).toBe(136);
            expect(state?.players?.[0].round2Submissions[0].points).toBe(36);
            expect(state?.players?.[0].round2Submissions[0].isCorrect).toBe(false);
        });

        it('should return null when current round 2 question is missing', () => {
            const modifiedState: GameState = {
                ...defaultState,
                round2Questions: [],
                round2CurrentQuestion: 0,
            };

            const state = calculateGradeRound2Question(modifiedState, 'p1', true);

            expect(state).toBeNull();
        });
    });

    describe('calculateGradeRound3Question', () => {
        it('should handle CORRECT answer and progress', () => {
            const state = calculateGradeRound3Question(defaultState, 'p1', 0, 'CORRECT', 20, 1000);
            expect(state?.players?.[0].score).toBe(120);
            expect(state?.players?.[0].round3Pack[0].status).toBe('CORRECT');
            expect(state?.players?.[0].round3Pack[0].questionMode).toBe('QUIZ');
            expect(state?.round3Phase).toBe('IDLE');
            expect(state?.activeQuestion).toBeNull();
        });

        it('should handle WRONG answer and enter steal delay', () => {
            const state = calculateGradeRound3Question(defaultState, 'p1', 0, 'WRONG', -10, 1000);
            expect(state?.players?.[0].score).toBe(90);
            expect(state?.players?.[0].round3Pack[0].status).toBe('WRONG');
            expect(state?.round3Phase).toBe('SHOW_WRONG_DELAY');
            expect(state?.timerEndTime).toBe(6000);
            expect(state?.buzzerLocked).toBe(true);
        });

        it('should clamp score to zero when round 3 penalty would go negative', () => {
            const modifiedState: GameState = {
                ...defaultState,
                players: [{ ...mockPlayer, score: 5 }, mockPlayer2],
            };

            const state = calculateGradeRound3Question(modifiedState, 'p1', 0, 'WRONG', -10, 1000);

            expect(state?.players?.[0].score).toBe(0);
        });

        it('should complete turn when all questions are answered', () => {
            const modifiedState: GameState = {
                ...defaultState,
                players: [
                    {
                        ...mockPlayer,
                        round3Pack: [
                            { difficulty: 'EASY', status: 'CORRECT' },
                            { difficulty: 'MEDIUM', status: 'WRONG' },
                            { difficulty: 'HARD', status: 'PENDING' }
                        ]
                    }
                ]
            };

            const state = calculateGradeRound3Question(modifiedState, 'p1', 2, 'CORRECT', 40, 1000);
            expect(state?.round3TurnPlayerId).toBeNull();
            expect(state?.round3Phase).toBe('IDLE');
            expect(state?.message).toContain('completed all questions');
        });
    });

    describe('calculateActivateSteal', () => {
        it('should lock buzzers and set active steal player using paused timer', () => {
            const modifiedState: GameState = {
                ...defaultState,
                stealTimerPausedRemaining: 3000,
                timerEndTime: 50000
            };
            const state = calculateActivateSteal(modifiedState, 'p2', 1000);
            expect(state.activeStealPlayerId).toBe('p2');
            expect(state.buzzerLocked).toBe(true);
            expect(state.timerEndTime).toBe(4000);
            expect(state.stealTimerPausedRemaining).toBeNull();
        });

        it('should fall back to a new 10 second timer when no timer state exists', () => {
            const modifiedState: GameState = {
                ...defaultState,
                stealTimerPausedRemaining: null,
                timerEndTime: null,
            };

            const state = calculateActivateSteal(modifiedState, 'p2', 1000);

            expect(state.timerEndTime).toBe(11000);
            expect(state.activeStealPlayerId).toBe('p2');
        });
    });

    describe('calculateResolveSteal', () => {
        it('should award points on correct steal and clear buzzers', () => {
            const modifiedState: GameState = {
                ...defaultState,
                players: [
                    { ...mockPlayer, buzzedAt: 123 },
                    { ...mockPlayer2, buzzedAt: 456 },
                ]
            };

            const state = calculateResolveSteal(modifiedState, 'p2', true, 25);
            expect(state.players?.[1].score).toBe(75);
            expect(state.players?.every(player => player.buzzedAt === null)).toBe(true);
            expect(state.round3Phase).toBe('IDLE');
            expect(state.activeStealPlayerId).toBeNull();
            expect(state.round3TurnPlayerId).toBeNull();
        });

        it('should penalize points on wrong steal and keep window open', () => {
            const state = calculateResolveSteal(defaultState, 'p2', false, 25);
            expect(state.players?.[1].score).toBe(25);
            expect(state.activeStealPlayerId).toBeNull();
            expect(state.buzzerLocked).toBe(false);
        });

        it('should never let steal penalty reduce score below zero', () => {
            const modifiedState: GameState = {
                ...defaultState,
                players: [mockPlayer, { ...mockPlayer2, score: 10 }],
            };

            const state = calculateResolveSteal(modifiedState, 'p2', false, 25);

            expect(state.players?.[1].score).toBe(0);
        });
    });
});
