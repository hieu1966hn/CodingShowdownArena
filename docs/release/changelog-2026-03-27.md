# Changelog 2026-03-27

Release tag:
- `release-2026-03-27-main-stable`

Branch source:
- `fix/game-flow-sync`

Merged to:
- `main`

## Summary

This release stabilizes the gameplay flow across Round 1, Round 2, and Round 3, with the main focus on scoring correctness, safer teacher control flow, and more predictable handling for live classroom sessions.

## Changes

### Round 1

- Changed one-touch recommendation to pick a random unused question.
- Removed the previous tendency to over-suggest harder questions.

### Round 2

- Fixed early auto-advance so the round no longer jumps too soon.
- Fixed re-grade behavior so score rollback/recalculation is correct.
- Fixed `Show Answer` in teacher view.
- Fixed progress display so completed packs no longer show `Question 6 / 5`.
- Replacing the current Round 2 question now resets its timer correctly.

### Round 3

- Fixed scoring flow for oral/manual grading.
- Locked grading to the active pack slot only.
- Unified skip behavior with steal flow expectations.
- Fixed steal wrong-answer penalty handling.
- Fixed steal timeout penalty handling.
- Prevented the same stealer from being accepted repeatedly in the same steal window.
- Prevented teacher double-click / duplicate grading in steal flow.
- Stopped auto-carrying the previous player's mode into the next student's turn.
- Next student now allows fresh mode selection before starting.

### Stability and reset behavior

- Improved reset/backtrack cleanup for round-specific state.
- Preserved core gameplay structure while tightening edge-case handling.

## Validation

- `npm test -- --run`: passed
- `npm run build`: passed

## Known follow-up

- Production bundle size is still larger than the Vite warning threshold.
- Admin security should still be verified at Firestore rules level before broad public rollout.
