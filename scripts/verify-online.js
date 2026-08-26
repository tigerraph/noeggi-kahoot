/* Cloud smoke: Supabase reachability + read paths. Writes are aborted so the live
   leaderboard stays clean — not part of the deploy gate. Run: npm run verify:online */
const puppeteer = require("puppeteer");
const path = require("path");
const sleep = ms => new Promise(r => setTimeout(r, ms));
const MODES = ["23", "10", "⚡10"];
const WRITE = ["POST", "PUT", "PATCH", "DELETE"];
(async () => {
  const b = await puppeteer.launch({ headless: "new" });
  const p = await b.newPage();
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  const errors = [];
  p.on("pageerror", e => errors.push(e.message));
  const aborted = [];
  await p.setRequestInterception(true);
  p.on("request", r => {
    // Only real writes — OPTIONS preflights must pass or the reads die with them.
    if (WRITE.includes(r.method()) && /\/rest\/v1\/(scores|rpc\/player_upsert)/.test(r.url())) {
      aborted.push(r.url().split("/rest/v1/")[1]);
      return r.abort();
    }
    r.continue();
  });
  const url = "file://" + path.resolve(__dirname, "../dist/index.html");
  await p.goto(url, { waitUntil: "load" });
  await sleep(2000);

  const rows = await p.evaluate(() => cloudTop());
  const reachable = Array.isArray(rows);
  const shapeOk = reachable && rows.every(r =>
    typeof r.name === "string" && Number.isFinite(r.score) && MODES.includes(r.mode));
  const sorted = reachable && rows.every((r, i) => i === 0 || rows[i - 1].score >= r.score);

  const get = await p.evaluate(() => rpc("player_get", { tok: "00000000-0000-4000-8000-000000000000" }));
  const byName = await p.evaluate(() => rpc("player_by_name", { pname: "__nobody__" }));
  const byFp = await p.evaluate(() => rpc("player_by_fp", { pfp: "__nofingerprint__" }));
  const rpcOk = Array.isArray(get) && Array.isArray(byName) && Array.isArray(byFp);

  // PGRST205 means the table itself is missing; a permission error means it exists.
  const probe = await p.evaluate(async path => {
    try {
      const r = await fetch(SUPA_URL + "/rest/v1/" + path,
        { headers: { apikey: SUPA_KEY, Authorization: "Bearer " + SUPA_KEY } });
      const txt = await r.text();
      return { status: r.status, code: (txt && txt[0] === "{" ? JSON.parse(txt).code : null) || null };
    } catch (e) { return { status: 0, code: "FETCH" }; }
  }, "feedback?select=id&limit=1");
  const feedbackTable = probe.code !== "PGRST205" && probe.code !== "FETCH";
  const bonusRows = await p.evaluate(() => cloudBonus());
  const bonusTable = Array.isArray(bonusRows);

  // refreshBoard() runs on the start screen: with cloud rows the teaser must carry the 🌍 marker.
  const teaser = await p.$eval("#bestline", e => e.textContent).catch(() => "");
  const boardWired = !reachable || !rows.length || teaser.includes("🌍");

  console.log("board:", reachable ? `${rows.length} rows` : "UNREACHABLE",
    "| shape:", shapeOk, "| sorted:", sorted);
  if (reachable && rows.length) console.log("top:", rows[0]);
  console.log("rpc grants:", { player_get: Array.isArray(get), player_by_name: Array.isArray(byName), player_by_fp: Array.isArray(byFp) });
  if (!rpcOk) console.error("  -> player RPCs missing: apply docs/supabase.sql in the Supabase SQL editor.\n" +
    "     Without them the identity feature (cross-device profile, bonus sync, #p= link) silently no-ops.");
  console.log("tables:", { feedback: feedbackTable, bonus: bonusTable },
    bonusTable ? `| ${bonusRows.length} bonus row(s)` : "");
  if (!feedbackTable || !bonusTable) console.error(
    "  -> feedback/bonus tables missing: apply docs/supabase.sql in the Supabase SQL editor.\n" +
    "     That script also widens the scores mode check to '\uD83D\uDC7E10' — without it arcade runs cannot save.");
  console.log("teaser:", teaser.trim() || "(empty)", "| wired:", boardWired);
  console.log("writes aborted:", aborted.length ? aborted : "none attempted");
  console.log("JS ERRORS:", errors.length ? errors : "none");
  await b.close();
  const ok = reachable && shapeOk && sorted && rpcOk && feedbackTable && bonusTable && boardWired && errors.length === 0;
  if (!ok) { console.error("ASSERTIONS FAILED"); process.exit(1); }
  console.log("ALL PASS");
})().catch(e => { console.error("FAIL:", e.message); process.exit(1); });
