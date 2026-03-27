# Production Deploy Checklist

Branch deploy:
- `main`

Release tag:
- `release-2026-03-27-main-stable`

Target stack:
- Frontend deploy: Vercel
- Database/Auth hosting: Firebase Firestore

## 1. Pre-deploy

- Pull latest `main`.
- Confirm local branch is clean: `git status`.
- Confirm release tag points to the intended commit.
- Confirm Firebase project and Vercel project are the production ones, not staging/test.
- Confirm `.env` / Vercel Environment Variables are present and correct.
- Confirm Google/Firebase Auth authorized domains include production domain.
- Confirm Firestore indexes are deployed if the production project is new.

## 2. Validation before deploy

- Run `npm install` if dependencies changed.
- Run `npm test -- --run`.
- Run `npm run build`.
- Open app locally and smoke test:
  - Login / join room
  - Create room
  - Student join room
  - Round 1 score update
  - Round 2 submit / grade / next question
  - Round 3 oral / quiz / steal
  - Game over ranking

## 3. Firebase checks

- Confirm Firestore rules are correct for production.
- Confirm TTL / cleanup behavior is acceptable for free tier usage.
- Confirm indexes file matches deployed project if using a fresh Firebase project.
- Confirm anonymous auth or Google auth settings match production requirement.

## 4. Vercel checks

- Confirm production environment variables are set.
- Confirm the production branch is `main`.
- Confirm build command is `npm run build`.
- Confirm output settings match current Vite deploy setup.
- Confirm production domain is attached and SSL is active.

## 5. Post-deploy smoke test

- Open production URL.
- Create a fresh room code.
- Join with at least 2 clients.
- Run one quick pass:
  - R1 correct / wrong
  - R2 show answer
  - R2 complete 5 questions without `6/5`
  - R3 oral scoring
  - R3 steal wrong / timeout penalty
  - R3 next student can re-select mode

## 6. Rollback

- If production issue is critical:
  - Redeploy previous known-good commit on Vercel, or
  - Reset deploy target to the previous release tag/commit.
- Known fallback baseline:
  - local tag `moc-mac-dinh-2026-03-27`

## 7. Notes

- Current build passes, but bundle size warning still exists for the main JS chunk.
- This warning is not a release blocker, but should be optimized in a later pass.
