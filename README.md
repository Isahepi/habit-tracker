# Habit Tracker

A personal daily/weekly/yearly habit tracker built with React + Vite. Data is
saved in your browser's `localStorage`, so it stays on whatever device you use
it from — no account or backend needed.

## Run it locally

```bash
npm install
npm run dev
```

Then open the URL it prints (something like `http://localhost:5173/habit-tracker/`).

## Customize your habits

Your schedule lives in `habitsFor()` in `src/App.jsx`. Each entry is:

```js
{ id: "gym", label: "Morning gym", time: "Early AM" }
```

Add, remove, or edit entries there to match your routine.

## Deploy to GitHub Pages

1. Create a new **public** repo on GitHub named `habit-tracker` (if you use a
   different name, update `base` in `vite.config.js` to match).
2. Push this project to it:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<your-username>/habit-tracker.git
   git push -u origin main
   ```
3. On GitHub: **Settings → Pages → Source → GitHub Actions**.
4. The included workflow (`.github/workflows/deploy.yml`) builds and deploys
   automatically on every push to `main`. Your site will be live at:
   `https://<your-username>.github.io/habit-tracker/`
