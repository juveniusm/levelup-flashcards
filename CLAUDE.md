# CLAUDE.md — LevelUp Flashcards

Next.js 16 (App Router) + React 19 + Prisma 5 (Postgres) + next-auth v4 flashcards app.
Production site: **levelupflash.com**.

## 👉 Active task: refactor pass (R1–R7) — READ THE HANDOFF FIRST
A security audit + fixes (S1–S18) are **done and deployed**. The current task is a
**behavior-preserving refactor / code-quality pass (R1–R7)**. Before doing anything, read:

- **`../REFACTOR_HANDOFF.md`** — the refactor brief (R1–R7 in detail, what to do, what NOT to touch).
- `../SECURITY_REFACTOR_HANDOFF.md` — original security/audit brief (background).

(Both live in the parent folder, one level above this repo:
`G:\My Drive\1. Projects\Atria\ANTIGRAVITY FLASHCARDS\`.)

## ⚠️ Critical environment constraints
- **Do NOT run `npm install`** or write `node_modules`. This is a **Google Drive (`G:`) path** —
  npm fails with `EBADF` and the local `node_modules` is already broken. Don't try to "fix" it.
- **Do NOT add npm dependencies** without explicit user approval (`zod`, `xstate`, etc. are already
  installed).
- **You CANNOT build / typecheck / lint / run locally, and there is no test suite.** Reason
  carefully; verify changes on the **Vercel preview deployment** of your branch.
- Windows + PowerShell; the repo path has spaces — quote it; use `git -C "<repo>" …` not `cd`.

## ⚠️ Git & deploy
- `origin/main` = **PRODUCTION = levelupflash.com**. **Do NOT push to `main`** without explicit
  user approval — the user controls every deploy. Pushing any other branch triggers a Vercel
  **preview** (how you verify).
- **Local `main` is STALE.** Always `git -C "<repo>" fetch origin` and **branch off `origin/main`**
  (current production tip), e.g. `git checkout -b refactor/code-quality origin/main`.
- A **cream/gold UI overhaul is live** on production — do not undo styling while refactoring.
- Only commit/push when asked; stage `src` (and intentionally-changed config) only.

## Layout (quick map)
- Auth/trust: `src/lib/auth.ts`, `src/middleware.ts`, `src/lib/auth-utils.ts`,
  `src/lib/deck-access.ts`, `src/types/next-auth.d.ts` (session typing **already augmented**).
- API: `src/app/api/**/route.ts` (~23 routes; middleware does **not** match `/api/*`, so each route
  self-guards).
- Services: `src/lib/services/{user,deck,folder,stats}Service.ts`.
- Shared helpers (reuse these): `src/lib/timezone.ts` (`normalizeTimezone`),
  `src/lib/url-safety.ts` (`isSafeImageUrl`), `src/lib/rate-limit.ts`.
- Study UI/state: `src/app/components/study/*`, `src/machines/classicModeMachine.ts` (xstate),
  `src/hooks/*`. Offline/PWA: `dexie`, `@serwist/next` (`src/app/sw.ts`).

## Don'ts (deliberate decisions — confirm before changing)
S6 (auth enumeration), S10 (unverified-account overwrite), S14 (shared-admin folder visibility),
and the card create-vs-edit permission policy are **intentional / product decisions** — leave them
unless the user explicitly says otherwise. See `../REFACTOR_HANDOFF.md` for the full list and the
already-verified non-issues.
