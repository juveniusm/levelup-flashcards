# CLAUDE.md — LevelUp Flashcards

Next.js 16 (App Router) + React 19 + Prisma 5 (Postgres) + next-auth v4 flashcards app.
Production site: **levelupflash.com**.

## ✅ Status: security pass (S1–S18) and refactor pass (R1–R7) are COMPLETE
Everything in the two handoffs below has shipped to `origin/main` (= production). Treat both
documents as **background and history, not a task list**:

- `../REFACTOR_HANDOFF.md` — the refactor brief (R1–R7). All items done; still the best record of
  what changed and, importantly, what was deliberately left alone.
- `../SECURITY_REFACTOR_HANDOFF.md` — original security/audit brief (background).

(Both live in the parent folder, one level above this repo:
`G:\My Drive\1. Projects\Atria\ANTIGRAVITY FLASHCARDS\`.)

Shipped since those briefs were written (commits `8a657ad`, `1758da1`): Google accounts can no
longer be overwritten via the signup form, Google now links to an existing email instead of
dead-ending on `OAuthAccountNotLinked`, OAuth users get first/last name on their first sign-in
plus a prompt for the username/university the signup form would have collected, and OAuth
failures land on the app's own pages rather than next-auth's default error page.

## 📋 Open backlog — none of it started, several need the USER's decision first
- **Schema/migration items.** `@@unique([deck_seq])` and `@@unique([deck_id, card_seq])` are the
  only real fix for the sequence races; the transactions added in R5 narrow the window but cannot
  close it. Needs a migration path set up first (see the migration note in the refactor handoff).
- **Per-user vs global sequence numbering.** `deck_seq`/`folder_seq` are user-facing display IDs
  (a deck shows as `007`; card labels are deck-seq + card-seq, `0070042`), so the R5 brief's
  suggestion to make them per-user would make two users' decks collide. Left global deliberately.
- **Bulk-import `card_seq` race** (`decks/[deckId]/cards/bulk/route.ts`). Closing it means holding
  a transaction across up to four `createMany` batches, past Prisma's 5s default timeout.
- **Logger abstraction.** `console.*` is scattered across routes; replacing it is its own pass.
- **`as any` on the full-text `search` clauses** (`cards/search/route.ts`). Probably unnecessary
  now that `fullTextSearch` is enabled, but unverifiable without a generated Prisma client here.

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

## Don'ts (deliberate decisions — confirmed; leave as-is)
S6 (auth enumeration), S10 (unverified-account overwrite), and S14 (shared-admin folder visibility
in `folderService.fetchFolders`) are **intentional** and confirmed — leave them. Card mutations are
**admin-only by design** (create / bulk-import / edit / delete / bulk-delete) — do not revert that.
See `../REFACTOR_HANDOFF.md` for the full list and the already-verified non-issues.
