# AI Data Analyst

Upload a CSV, ask questions about it in plain English, get answers — with a
chart when one actually helps.

## Stack
- Next.js (App Router) + TypeScript + Tailwind CSS
- Claude API (`@anthropic-ai/sdk`) for the analysis
- Papaparse for CSV parsing (client-side)
- Recharts for chart rendering

## How it works
1. You upload a `.csv` in the browser — parsed entirely client-side, so
   nothing goes to a server until you ask a question.
2. Your question + the CSV text get sent to `/api/analyze`.
3. That route asks Claude to answer the question and, if a chart would help,
   return structured chart data (`bar` or `line`) alongside the answer.
4. The UI renders the answer and chart as a new numbered "ledger" entry.

## Setup

```bash
npm install
cp .env.local.example .env.local
# then edit .env.local and paste in your key
```

Get an API key from https://console.anthropic.com/settings/keys — new
accounts get free credits, and pay-as-you-go pricing after that.

## Run locally

```bash
npm run dev
```

Visit http://localhost:3000, upload a CSV (try any sales/export report), and
ask something like:
- "What were total sales by region?"
- "Which month had the highest revenue?"
- "Summarize the trend over time"

## Deploy

Push to GitHub, then import the repo on Vercel (vercel.com/new).
Add `ANTHROPIC_API_KEY` under Project Settings -> Environment Variables
before your first deploy (or redeploy after adding it).

## Notes
- CSV text sent to the model is capped at ~20,000 characters to keep cost and
  latency predictable on very large files — see `MAX_CSV_CHARS` in
  `app/api/analyze/route.ts` if you want to raise that.
- No auth, no database — this is a single-session tool by design. Add
  Supabase if you want saved history across visits.
