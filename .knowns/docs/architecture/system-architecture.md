---
title: System Architecture
description: Tài liệu lưu trữ kiến trúc và hiện trạng hệ thống Coding Showdown Arena
createdAt: '2026-03-20T07:41:59.621Z'
updatedAt: '2026-03-20T07:41:59.621Z'
tags:
  - architecture
  - system
  - documentation
  - firebase
---

# Coding Showdown Arena - Kiến Trúc Hệ Thống

## Tổng Quan

**Coding Showdown Arena** là ứng dụng game quiz lập trình real-time dành cho giáo dục, cho phép giáo viên tổ chức cuộc thi lập trình với nhiều vòng thi.

### Thông Tin Triển Khai
- **Repo**: `coding-showdown-arena`
- **Firebase Project**: `codingshowdownarena-da2ce`
- **Hosting**: Firebase Hosting
- **AI Studio**: https://ai.studio.apps/drive/1uH2fHvQIHHBlV1JQgaWzJTTok3xCOj2c

---

## Kiến Trúc Kỹ Thuật

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend Framework | React 19 + TypeScript |
| Build Tool | Vite 6 |
| Styling | Tailwind CSS 3 |
| Animation | Framer Motion 12 |
| Icons | Lucide React |
| Backend | Firebase (Firestore + Auth) |
| Auth Providers | Google OAuth + Anonymous |

### Cấu Trúc Thư Mục

```
/
├── App.tsx                  # Entry point + Router logic
├── index.tsx                # React DOM entry
│
├── hooks/
│   └── useGameSync.ts       # Core state management (Firebase sync)
│
├── components/
│   ├── TeacherDashboard.tsx # Game control panel (giáo viên)
│   ├── StudentView.tsx       # Player interface (học sinh)
│   ├── SpectatorScreen.tsx  # Public display (màn hình lớn)
│   ├── AdminPage.tsx         # Settings (?admin route)
│   └── ui/
│       └── CodeDisplay.tsx   # Shared UI component
│
├── services/
│   └── gameService.ts       # Legacy service (deprecated)
│
├── lib/
│   └── firebase.ts          # Firebase initialization
│
├── data/
│   └── questions.ts         # Question banks (R1, R2, R3)
│
├── gameTypes.ts             # TypeScript interfaces
├── constants.ts             # Game constants
├── config/assets.ts         # Asset configuration
│
└── firebase.ts              # Firebase config (legacy)
```

---

## Mô Hình Dữ Liệu

### Firestore Collections

#### 1. `rooms/{roomId}`
Game state document - real-time synchronized giữa tất cả clients.

```typescript
interface GameState {
  roomId: string;
  round: GameRound;           // LOBBY | ROUND_1 | ROUND_2 | ROUND_3 | GAME_OVER
  players: Player[];
  activeQuestion: Question | null;
  timerEndTime: number | null;
  buzzerLocked: boolean;
  message: string | null;
  usedQuestionIds: string[];
  
  // Round 1
  round1TurnPlayerId: string | null;
  round1QuestionsAsked: Record<string, number>;
  
  // Round 2
  round2StartedAt: number | null;
  round2CurrentQuestion: number;
  round2Questions: string[];
  round2Reviewed: boolean;
  
  // Round 3
  round3TurnPlayerId: string | null;
  round3Phase: Round3Phase;   // IDLE | MAIN_ANSWER | STEAL_WINDOW | SHOW_WRONG_DELAY
  round3Mode: Round3Mode;     // ORAL | QUIZ
  round3SelectionMode: 'RANDOM' | 'SEQUENTIAL';
  activeStealPlayerId: string | null;
  stealTimerPausedRemaining: number | null;
  showAnswer: boolean;
  viewingPlayerId: string | null;
  
  // Checkpoint System
  checkpoints: {
    round1?: PlayerCheckpoint[];
    round2?: PlayerCheckpoint[];
    round3?: PlayerCheckpoint[];
  };
  
  // Timestamps
  createdAt?: Timestamp;
  expiresAt?: Timestamp;
}
```

#### 2. `history/{archiveId}`
Archived game records.

```typescript
{
  ...GameState,
  archivedAt: Timestamp,
  roomId: string
}
```

### Core Types

```typescript
enum GameRound {
  LOBBY = 'LOBBY',
  ROUND_1 = 'ROUND_1',  // Reflex Quiz
  ROUND_2 = 'ROUND_2',  // Debug/Obstacle
  ROUND_3 = 'ROUND_3',  // Tactical Finish
  GAME_OVER = 'GAME_OVER'
}

interface Player {
  id: string;              // Firebase Auth UID
  name: string;
  score: number;
  isOnline: boolean;
  buzzedAt: number | null;
  
  // Round 2
  round2Submissions: Array<{
    questionId: string;
    code: string;
    time: number;
    isCorrect?: boolean;
    points?: number;
  }>;
  
  // Round 3
  round3Pack: Round3Item[];  // EASY/MEDIUM/HARD
  round3PackLocked: boolean;
  round3QuizAnswer: string | null;
}

type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
type PackStatus = 'PENDING' | 'CORRECT' | 'WRONG' | 'SKIP';
type Round3Phase = 'IDLE' | 'MAIN_ANSWER' | 'STEAL_WINDOW' | 'SHOW_WRONG_DELAY';
type Round3Mode = 'ORAL' | 'QUIZ';
```

---

## Luồng Game

### Tổng Quan

```
┌─────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌───────────┐
│  LOBBY  │───▶│ ROUND_1  │───▶│ ROUND_2  │───▶│ ROUND_3  │───▶│ GAME_OVER │
│         │    │  Reflex  │    │ Obstacle │    │  Finish  │    │           │
└─────────┘    └──────────┘    └──────────┘    └──────────┘    └───────────┘
```

### Round 1: Reflex Quiz (Khởi Động)
- Giáo viên chọn học sinh trả lời
- Hỏi đáp nhanh (vấn đáp)
- Điểm: 30 điểm (lớp ≥10 hs) hoặc 15 điểm (<10 hs)
- Auto-save checkpoint khi chuyển sang Round 2

### Round 2: Obstacle (Vượt Chướng Ngại Vật)
- 5 câu hỏi debug code
- Học sinh submit code trong thời gian giới hạn
- Giáo viên chấm điểm
- Base 30 điểm + speed bonus (top 1: +6, top 2: +4, top 3: +2)
- Auto-save checkpoint khi chuyển sang Round 3

### Round 3: Tactical Finish (Về Đích)
- Mỗi học sinh chọn pack 3 câu (EASY/MEDIUM/HARD)
- Chế độ ORAL: trả lời miệng
- Chế độ QUIZ: bấm đáp án trên điện thoại
- Điểm: EASY=40, MEDIUM=60, HARD=80 (±)
- Steal mechanism: Sau câu sai → 15s cướp câu
- Auto-save checkpoint khi kết thúc

### Game Over
- Lưu archive vào `history` collection
- Xóa anonymous accounts của người chơi
- Hiển thị bảng xếp hạng

---

## Tính Năng Đặc Biệt

### Checkpoint System
Tự động lưu trạng thái sau mỗi vòng, cho phép:
- `resetToRound1()` - Reset về checkpoint Round 1
- `resetToRound2()` - Reset về checkpoint Round 2
- `resetToRound3()` - Reset về checkpoint Round 3

### Real-time Sync
- Firebase `onSnapshot` với auto-reconnect (5 retries, 3s delay)
- Tất cả clients đồng bộ instant qua Firestore

### Authentication
- Google OAuth (production)
- Anonymous login (guest access)
- Room-based session management

### Scoring Rules
| Round | Correct | Wrong | Notes |
|-------|---------|-------|-------|
| R1 | +30/+15 | 0 | Dynamic by class size |
| R2 | +30 + bonus | 0 | Speed bonuses |
| R3 (EASY) | +40 | -40 | Steal available |
| R3 (MEDIUM) | +60 | -60 | Steal available |
| R3 (HARD) | +80 | -80 | Steal available |

---

## Cơ Chế Hoạt Động

### Real-time State Management

```
┌──────────────┐         ┌───────────────┐         ┌──────────────┐
│   Teacher    │◄───────►│   Firestore   │◄───────►│   Student    │
│  Dashboard   │         │   rooms/{id}   │         │    View      │
└──────────────┘         └───────────────┘         └──────────────┘
       │                          ▲                        │
       │                          │                        │
       └──────────────────────────┼────────────────────────┘
                                  │
                         ┌───────────────┐
                         │ SpectatorScreen│
                         └───────────────┘
```

### User Roles
1. **Teacher**: Full game control (start, pause, score)
2. **Student**: Join game, buzz, submit answers
3. **Spectator**: Read-only view (big screen display)
4. **Admin**: Settings page (?admin route)

### Routes/Views
| URL | Role | Description |
|-----|------|-------------|
| `/` | Auto | Login → Room Selection → Role Selection |
| `/?mode=Teacher` | Teacher | Enable teacher access option |
| `/?admin` | Admin | Admin settings page |

---

## Cơ Sở Dữ Liệu Câu Hỏi

### Round 1: 110 câu (Reflex)
- EASY/MEDIUM/HARD
- Kiến thức Python cơ bản
- Vấn đáp miệng

### Round 2: 20 câu (Obstacle)
- Categories: LOGIC, SYNTAX, ALGO, OUTPUT, GENERAL, DEBUG, LIST
- Debug code, predict output
- Submit code text

### Round 3: 80 câu (Finish)
- EASY: 30 câu
- MEDIUM: 30 câu  
- HARD: 20 câu
- Multiple choice (4 options) + code input

---

## Deployment Notes

### Lưu Ý Quan Trọng
Khi deploy lên Vercel/Linux:
- **KHÔNG** để `types/` directory trong project để tránh circular dependency với `types.ts` ở root
- `gameTypes.ts` là single source of truth

### Environment Variables
- `GEMINI_API_KEY` - Gemini API key (nếu sử dụng AI features)

---

## Điểm Cần Cải Thiện (TODO)

1. **Error Handling**: Cải thiện error boundaries
2. **Offline Support**: Cache local state khi mất kết nối
3. **Performance**: Virtualized lists cho nhiều players
4. **Testing**: Thêm unit tests cho game logic
5. **Accessibility**: Cải thiện ARIA labels

---

## Related Docs
- @doc/luong-hoat-dong - Chi tiết từng vòng thi
