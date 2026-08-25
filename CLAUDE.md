# Nöggi-Kahoot — Projektbrief für Claude Code

Hochzeits-Quiz für Martin "Nöggi" & Chloé als eine einzige Offline-HTML-Datei,
deployt auf GitHub Pages (tigerraph.github.io/noeggi-kahoot).

## Struktur
- `src/template.html` — komplettes Spiel (CSS/JS) mit Platzhaltern `__FONT_CSS__`, `__IMG__`, `__DATA__`, `__BUILD__`
- `src/questions.json` — 23 Fragen, trilingual (de/fr/en), `correct` = Index, `img` = Bild-Key
- `assets/webimg_slim/` — 680px-Bilder, die eingebettet werden (34 Stück, inkl. bonus1–7)
- `assets/webimg/` — 880px-Master (nur Quelle für Re-Kompression)
- `scripts/build.py` — bettet Fonts (node_modules/@fontsource), Bilder und Daten ein → `dist/index.html`
- `scripts/verify.js` — Puppeteer-Regressionssuite (Modi, Streaks, Persistenz, Identität, Inhalts-Assertions), läuft bewusst offline
- `scripts/verify-online.js` — Cloud-Smoke gegen Supabase (nur lesend, Writes werden abgebrochen)
- `index.html` im Repo-Root = **Build-Artefakt** für GitHub Pages

## Regeln
1. `index.html` NIE von Hand editieren — immer über `src/` + `npm run build`.
2. Vor jedem Deploy: `npm run verify` muss ALL PASS zeigen. Die Suite klemmt Supabase ab —
   sie darf nie in die produktive Rangliste schreiben und nie vom Board-Inhalt abhängen.
3. `npm run deploy` = build + verify + Artefakt committen + push (Pages served von main root).
4. Build-Stempel unten auf dem Startscreen ("Build TT.MM. · HH:MM") ist die Versionsreferenz.
5. Inhaltsänderungen (Antworten, Texte) nur in `src/questions.json`; UI/Logik in `src/template.html`.
6. Backend: Supabase (Scores + Player-Identität), Schema in `docs/supabase.sql`. Anon-Key steckt bewusst im Client.
   Nach Schema-Änderungen `npm run verify:online` laufen lassen — der Client schluckt Backend-Fehler still.
7. Antworten-Korrekturen kamen von Marco (Quizmaster); Regel: sein als falsch deklarierter Klick = richtige Antwort.

## Befehle
    npm install        # einmalig (Fonts + Puppeteer)
    npm run build      # dist/index.html erzeugen
    npm run verify     # Regressionssuite (offline)
    npm run verify:online  # Cloud-Smoke gegen Supabase (optional, nur lesend)
    npm run deploy     # build + verify + commit + push
