
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
  round2Time?: number | null; // Time taken
  round2Code?: string | null; // The code submitted by the student
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
  viewingPlayerId: null
};
