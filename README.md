<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1uH2fHvQIHHBlV1JQgaWzJTTok3xCOj2c

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Recent Updates (Scoring & Logic)
- **Round 1**: Dynamic Points (30/15 depending on players).
- **Round 2**: Strict Deadline, Speed Bonuses (+30/+20/+10).
- **Round 3**: Timeout No Penalty, Steal Penalty, Fixed Point Values (40/60/80).

## Deployment Note
When deploying to Vercel/Linux, ensure the ambiguous `types/` directory is **NOT** present to avoid circular dependency errors with `types.ts`. The project root `types.ts` is the single source of truth.
