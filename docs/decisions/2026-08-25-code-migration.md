# 2026-08-25 · Migration des Nöggi-Kahoot zu Claude Code

- Repo-Root `index.html` bleibt das committete Build-Artefakt (GitHub Pages, Branch main / root).
- Quelle der Wahrheit: `src/template.html` + `src/questions.json` + `assets/webimg_slim/`; Root-`index.html` wird nie von Hand editiert.
- Pipeline: `npm run build` (Python-Assembler) → `npm run verify` (Puppeteer-Suite, muss ALL PASS liefern) → `npm run deploy` (commit + push).
- Versionsreferenz: Build-Stempel auf dem Startscreen; jede Live-Prüfung vergleicht gegen diesen Stempel.
- Chat-Rolle ab jetzt: Inhalt & Entscheidungen (Antworten, Texte, Feature-Scope); Umsetzung & Deploy in Code.
- Backend-Schema versioniert in `docs/supabase.sql` (idempotent, jederzeit re-runnbar).
- Nachtrag: `npm run verify` läuft offline (Supabase per Request-Interception abgeklemmt). Grund: `refreshBoard()`
  auf dem Startscreen lässt `recListHtml()` das Cloud-Board statt der lokalen Records rendern, sobald die
  `scores`-Tabelle nicht leer ist — der Test war dadurch vom DB-Inhalt abhängig und schrieb bei jedem Lauf
  eine Junk-Zeile in die produktive Rangliste. Cloud-Pfade deckt neu `npm run verify:online` ab (opt-in, nur lesend).
