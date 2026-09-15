# Academy Manager — Day 1 Scaffold

This is the Day 1 build from the roadmap: a working Next.js + Tailwind
app, wired up to be an installable PWA, ready to connect to Supabase
starting Day 2.

## Run it locally (in VS Code)

1. Open this folder in VS Code.
2. Open the terminal (`` Ctrl+` ``) and run:
   ```
   npm install
   npm run dev
   ```
3. Open http://localhost:3000 — you should see the "Academy Manager"
   placeholder page.

## Put it on GitHub

```
git init
git add .
git commit -m "Day 1: project scaffold"
```
Then create a new **private** repo on GitHub and follow the "push an
existing repository" instructions it gives you.

## Deploy to Vercel

1. Go to vercel.com, sign in with GitHub.
2. Click "New Project", pick this repo, click Deploy.
3. No settings need to change for Day 1 — Vercel auto-detects Next.js.
4. You'll get a live `.vercel.app` URL. That's your Day 1 "done."

## Day 2 preview

Tomorrow you'll create a Supabase project, run a SQL script Claude
gives you to create the database tables, and copy two values (URL +
anon key) into a `.env.local` file (copy `.env.local.example` to
`.env.local` and fill it in — that file is already git-ignored so
your keys never get committed).
