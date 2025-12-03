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
  buzzedAt?: number; // Timestamp for round 3
  submittedRound2?: boolean;
  round2Time?: number; // Time taken
  round2Code?: string; // The code submitted by the student
  // Round 3 Specifics
  round3Pack: Round3Item[]; 
}

export interface Question {
  id: string;
  content: string;
  answer?: string;
  codeSnippet?: string; // For Round 2
  difficulty?: Difficulty;
  points: number;
}

export type Round3Phase = 'IDLE' | 'MAIN_ANSWER' | 'STEAL_WINDOW';

export interface GameState {
  round: GameRound;
  players: Player[];
  activeQuestion: Question | null;
  timerEndTime: number | null; // Null if timer not running
  buzzerLocked: boolean;
  round2StartedAt: number | null;
  message: string | null; // For displaying big alerts/winners
  
  // Round 3 State
  round3TurnPlayerId: string | null; // Whose turn is it?
  round3Phase: Round3Phase;
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
  round3TurnPlayerId: null,
  round3Phase: 'IDLE'
};