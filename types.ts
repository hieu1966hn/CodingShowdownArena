

export enum GameRound {
  LOBBY = 'LOBBY',
  ROUND_1 = 'ROUND_1', // Reflex
  ROUND_2 = 'ROUND_2', // Obstacle
  ROUND_3 = 'ROUND_3', // Finish Line
  GAME_OVER = 'GAME_OVER' // Podium
}

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type PackStatus = 'PENDING' | 'CORRECT' | 'WRONG';

export interface Round3Item {
    difficulty: Difficulty;
    status: PackStatus;
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
}

// Round 2 Categories
export type QuestionCategory = 'LOGIC' | 'SYNTAX' | 'ALGO' | 'OUTPUT' | 'GENERAL';

export interface Question {
  id: string;
  content: string;
  answer?: string;
  codeSnippet?: string; // For Round 2
  difficulty?: Difficulty;
  category?: QuestionCategory; // New field for Round 2 classification
  points: number;
}

export type Round3Phase = 'IDLE' | 'MAIN_ANSWER' | 'STEAL_WINDOW';

export interface GameState {
  roomId?: string; // Added Room ID
  round: GameRound;
  players: Player[];
  activeQuestion: Question | null;
  timerEndTime: number | null; // Null if timer not running
  buzzerLocked: boolean;
  round2StartedAt: number | null;
  message: string | null; // For displaying big alerts/winners
  
  // Tracking used questions to prevent reuse
  usedQuestionIds: string[];

  // Turn Logic
  round1TurnPlayerId: string | null; // Who is answering in Round 1?
  round3TurnPlayerId: string | null; // Whose turn is it in Round 3?
  round3Phase: Round3Phase;

  // Settings
  round3SelectionMode: 'RANDOM' | 'SEQUENTIAL';
}

// Initial State constant
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
  round3Phase: 'IDLE',
  round3SelectionMode: 'RANDOM'
};