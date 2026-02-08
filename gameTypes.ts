
export enum GameRound {
  LOBBY = 'LOBBY',
  ROUND_1 = 'ROUND_1', // Reflex
  ROUND_2 = 'ROUND_2', // Obstacle
  ROUND_3 = 'ROUND_3', // Finish Line
  GAME_OVER = 'GAME_OVER' // Podium
}

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type PackStatus = 'PENDING' | 'CORRECT' | 'WRONG' | 'SKIP';

export interface Round3Item {
  difficulty: Difficulty;
  status: PackStatus;
  questionMode?: 'ORAL' | 'QUIZ'; // Track which mode was used for this specific question
}

export interface Player {
  id: string;
  name: string;
  score: number;
  isOnline: boolean;
  buzzedAt?: number | null; // Timestamp for round 3
  submittedRound2?: boolean;
  round2Time?: number | null; // Time taken in seconds (float)
  round2Code?: string | null; // The code submitted by the student
  round2Correct?: boolean; // NEW: Track if the submission was marked correct
  round2Score?: number; // NEW: Track specific score for R2 (Base + Bonus) to allow recalc
  round2Submissions?: Array<{
    questionId: string;
    code: string;
    time: number;
    isCorrect?: boolean;
    points?: number;
  }>; // NEW: Track all 5 question submissions
  // Round 3 Specifics
  round3Pack: Round3Item[];
  round3PackLocked?: boolean; // Has the student locked in their choices?
  round3QuizAnswer?: string | null; // Selected answer (content string)
}

// Round 2 Categories - Đã thêm DEBUG và LIST để khớp với dữ liệu câu hỏi
export type QuestionCategory = 'LOGIC' | 'SYNTAX' | 'ALGO' | 'OUTPUT' | 'GENERAL' | 'DEBUG' | 'LIST';

export interface Question {
  id: string;
  content: string;
  answer?: string;
  options?: string[]; // NEW: For Multiple Choice (Round 3 Quiz Mode)
  codeSnippet?: string; // For Round 2
  difficulty?: Difficulty;
  category?: QuestionCategory; // Phân loại cho Vòng 2
  points: number;
}

export type Round3Phase = 'IDLE' | 'MAIN_ANSWER' | 'STEAL_WINDOW' | 'SHOW_WRONG_DELAY';
export type Round3Mode = 'ORAL' | 'QUIZ'; // NEW: Mode selection

// NEW: Checkpoint System for Reset Level feature
export interface PlayerCheckpoint {
  playerId: string;
  playerName: string;
  score: number;
  round1Score?: number;
  round2Score?: number;
  round3Score?: number;
  // Preserve player-specific data
  round2Submissions?: Player['round2Submissions'];
  round3Pack?: Round3Item[];
  round3PackLocked?: boolean;
}

export interface Checkpoints {
  round1?: PlayerCheckpoint[]; // Saved after Round 1 completes
  round2?: PlayerCheckpoint[]; // Saved after Round 2 completes
  round3?: PlayerCheckpoint[]; // Saved after Round 3 completes
}

export interface GameState {
  roomId?: string;
  round: GameRound;
  players: Player[];
  activeQuestion: Question | null;
  timerEndTime: number | null;
  buzzerLocked: boolean;
  round2StartedAt: number | null;
  message: string | null;
  usedQuestionIds: string[];
  round1TurnPlayerId: string | null;
  round3TurnPlayerId: string | null;
  activeStealPlayerId: string | null; // Track who is currently stealing
  round3Phase: Round3Phase;
  round3Mode: Round3Mode; // NEW: Track current mode
  round3SelectionMode: 'RANDOM' | 'SEQUENTIAL';
  showAnswer: boolean;
  viewingPlayerId: string | null;
  stealTimerPausedRemaining?: number | null; // NEW: When buzz happens, we pause timer and store remaining ms
  round2CurrentQuestion: number; // NEW: Track which question (0-4) is currently active in Round 2
  round2Questions: string[]; // NEW: Array of 5 question IDs for Round 2
  checkpoints?: Checkpoints; // NEW: Checkpoint system for Reset Level
}

export const INITIAL_STATE: GameState = {
  round: GameRound.LOBBY,
  players: [],
  activeQuestion: null,
  timerEndTime: null,
  buzzerLocked: true,
  round2StartedAt: null,
  message: "Welcome to Coding Showdown!",
  usedQuestionIds: [],
  round1TurnPlayerId: null,
  round3TurnPlayerId: null,
  activeStealPlayerId: null,
  round3Phase: 'IDLE',
  round3Mode: 'ORAL', // Default to Oral
  round3SelectionMode: 'RANDOM',
  showAnswer: false,
  viewingPlayerId: null,
  stealTimerPausedRemaining: null,
  round2CurrentQuestion: 0,
  round2Questions: [],
  checkpoints: {} // Initialize empty checkpoints
};
