# noeggi-kahoot

Wedding quiz for Martin «Nöggi» & Chloé: one offline HTML file on GitHub Pages
(https://tigerraph.github.io/noeggi-kahoot/). Build, verify and deploy: see `package.json`.

## Backend: one project, two schemas, never crossed

Since 18.09.2026 the quiz shares a Supabase project with the Democracy Matters quiz
(dm-quiz, `bvglvdcndhqrvpnghrkp`): the free plan allows two active projects.

| | Wedding quiz | DM quiz |
|---|---|---|
| Schema | `noeggi` | `public` (tables `dm_*`) |
| Tables | `scores`, `players`, `feedback`, `bonus` | `dm_players`, `dm_answers`, `dm_stars`, … |
| Functions | `noeggi.player_get/upsert/by_fp/by_name`, `noeggi.feedback_list` | `public.dm_*` |
| Roles | `anon` only: select+insert on scores, insert on feedback, select on bonus, the five functions. `authenticated` has no access to the schema | `anon` + logged-in admins (`dm_admins`) |
| Auth | not used | email + password (My DM) |
| Storage | none | none |

- The client picks its schema per request (`Accept-Profile` / `Content-Profile: noeggi`, what
  supabase-js calls `db: { schema: 'noeggi' }`), via `SUPA_H` in `src/template.html`. The API
  exposes `noeggi` (Project Settings → API → Exposed schemas).
- **Never cross:** CI (`.github/workflows/check.yml` → `scripts/check-schema.sh`) fails if the
  quiz's code references DM's schema or tables, uses another profile, or sends a REST call
  without `SUPA_H`. The DM repo has the mirror check.
- Auth is shared per project. The quiz does not use it; if it ever does, gate it with its own
  membership table in `noeggi`, never with DM accounts.
- Schema and the move: `docs/move-to-dm-quiz-export.sql`. History of the old project:
  `docs/supabase.sql`.
