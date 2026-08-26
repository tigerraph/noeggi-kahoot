/* What changed since last time: reports, board, live build. Read-only.
   Run: npm run status */
const https = require("https");
const fs = require("fs");
const path = require("path");

const SUPA = "https://opgbezlecbggnqzlvhja.supabase.co";
const KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9wZ2JlemxlY2JnZ25xemx2aGphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1OTczMTYsImV4cCI6MjEwMzE3MzMxNn0.9KVl_dPJnma7sAd6YkH_U0HKpKkpSUnzfU_hwxM4x_4";
const PAGES = "https://tigerraph.github.io/noeggi-kahoot/";

function req(url, opts = {}, body) {
  return new Promise((res, rej) => {
    const r = https.request(url, { timeout: 20000, ...opts }, x => {
      let d = "";
      x.on("data", c => d += c);
      x.on("end", () => res({ status: x.statusCode, body: d }));
    });
    r.on("error", rej);
    r.on("timeout", () => { r.destroy(); rej(new Error("timeout " + url)); });
    if (body) r.write(body);
    r.end();
  });
}
const H = { apikey: KEY, Authorization: "Bearer " + KEY, "Content-Type": "application/json" };
const json = async (p, m = "GET", b) => {
  const r = await req(SUPA + "/rest/v1/" + p, { method: m, headers: H }, b);
  try { return JSON.parse(r.body); } catch (e) { return { error: r.status, body: r.body.slice(0, 200) }; }
};

(async () => {
  const [reports, scores, bonus] = await Promise.all([
    json("rpc/feedback_list", "POST", "{}"),
    json("scores?select=id,name,score,mode,correct,len,created_at&order=created_at.desc"),
    json("bonus?select=name,points,reason")
  ]);

  console.log("MELDUNGEN");
  if (!Array.isArray(reports)) console.log("  nicht lesbar:", JSON.stringify(reports));
  else if (!reports.length) console.log("  keine");
  else reports.forEach(r => console.log(
    `  ${r.created_at.slice(0, 16).replace("T", " ")}  ${r.qid.padEnd(10)} ${JSON.stringify(r.claim)}` +
    `  ${r.name || "(ohne Name)"} [${r.lang}]`));

  console.log("\nSCORES (neueste zuerst)");
  if (!Array.isArray(scores)) console.log("  nicht lesbar:", JSON.stringify(scores));
  else scores.forEach(s => console.log(
    `  ${s.created_at.slice(0, 16).replace("T", " ")}  ${String(s.name).padEnd(10)} ${String(s.score).padStart(6)}` +
    `  ${s.mode.padEnd(5)} ${s.correct}/${s.len}`));

  console.log("\nBONUS");
  if (!Array.isArray(bonus)) console.log("  nicht lesbar:", JSON.stringify(bonus));
  else bonus.forEach(b => console.log(`  ${String(b.name).padEnd(10)} +${b.points}  ${b.reason || ""}`));

  const stamp = s => (s.match(/Build \d\d\.\d\d\. · \d\d:\d\d/) || ["(keiner)"])[0];
  const live = stamp((await req(PAGES + "?cb=" + Date.now())).body);
  const repo = path.resolve(__dirname, "../index.html");
  const local = fs.existsSync(repo) ? stamp(fs.readFileSync(repo, "utf8")) : "(fehlt)";
  console.log("\nBUILD");
  console.log("  live:  ", live);
  console.log("  repo:  ", local, live === local ? "" : "  <-- Pages hinkt nach oder es ist nicht deployt");
})().catch(e => { console.error("FAIL:", e.message); process.exit(1); });
