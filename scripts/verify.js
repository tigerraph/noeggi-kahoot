/* Full regression: modes, bonuses, persistence, records, identity, content. Run: npm run verify */
const puppeteer = require("puppeteer");
const path = require("path");
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const b = await puppeteer.launch({ headless: "new" });
  const p = await b.newPage();
  await p.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
  // Offline by design: a non-empty live board makes recListHtml() render cloud
  // rows instead of local records, and every run would insert a junk score.
  await p.setRequestInterception(true);
  p.on("request", r => r.url().includes("supabase.co") ? r.abort() : r.continue());
  const errors = [];
  p.on("pageerror", e => errors.push(e.message));
  const url = "file://" + path.resolve(__dirname, "../dist/index.html");
  await p.goto(url, { waitUntil: "load" });

  async function play(startSel, pickFn) {
    await p.click(startSel);
    let rounds = 0, bonus = 0;
    while (true) {
      await p.waitForSelector(".grid .tile:not([disabled])");
      rounds++;
      const c = await p.$eval("#grid", g => g.dataset.correct);
      await p.click(`.grid .tile[data-oi="${pickFn(rounds - 1, +c)}"]`);
      await p.waitForSelector("#next");
      await p.click("#next"); await sleep(110);
      if (await p.$(".bonus")) { bonus++; await p.click(".bonus #next"); await sleep(110); }
      if (await p.$(".end")) break;
    }
    await sleep(200);
    return { rounds, bonus,
      gal: await p.$$eval(".gal .polaroid", e => e.length),
      lock: await p.$$eval(".gal .locked", e => e.length) };
  }

  const r1 = await play("#startbtn", (i, c) => c);
  await p.type("#pname", "Rafa");
  await p.click("#savebtn"); await sleep(200);
  const savedLabel = await p.$eval("#savebtn", e => e.textContent);
  const listHas = (await p.$eval("#reclist", e => e.textContent)).includes("Rafa");
  const chips = await p.$$("#chips .chip");
  await chips[3].click(); await sleep(150);
  const zero = (await p.$eval("#reclist", e => e.textContent)).includes("–");
  await chips[2].click(); await sleep(150);
  const ten = (await p.$eval("#reclist", e => e.textContent)).includes("Rafa");
  await chips[0].click(); await sleep(150);
  await p.click("#again"); await sleep(200);
  const r2 = await play("#startall", (i, c) => c);

  const plink = await p.$(".plink") !== null;
  const tok1 = await p.evaluate(() => localStorage.getItem("nk_ptoken"));
  await p.click(".gal .polaroid[data-k]"); await sleep(250);
  const lb1 = await p.$(".lightbox") !== null;
  if (lb1) await p.click(".lightbox");
  await sleep(250);
  const lb2 = await p.$(".lightbox") === null;

  const f1 = await p.evaluate(() => computeFp());
  const f2 = await p.evaluate(() => computeFp());
  const fpOk = f1.length > 8 && f1 === f2;
  await p.click("#again"); await sleep(250);
  const hello1 = (await p.$eval(".hello", e => e.textContent).catch(() => "")).includes("Rafa");
  await p.click("#notyou"); await sleep(250);
  const hello2 = await p.$(".hello") === null;
  const nameCleared = await p.evaluate(() => JSON.parse(localStorage.getItem("nk_name") || '""')) === "";

  await p.goto(url, { waitUntil: "load" }); await sleep(300);
  const teaser = await p.$(".best") !== null;
  await p.goto("about:blank");
  await p.goto(url + "#p=11112222-3333-4444-5555-666677778888", { waitUntil: "load" }); await sleep(400);
  const adopted = (await p.evaluate(() => localStorage.getItem("nk_ptoken"))).includes("1111");
  await p.goto(url, { waitUntil: "load" }); await sleep(300);

  await p.click("#startblitz");
  await p.waitForSelector(".grid .tile:not([disabled])");
  const w0 = await p.$eval("#tbar", e => parseFloat(e.style.width));
  await sleep(1600);
  const w1 = await p.$eval("#tbar", e => parseFloat(e.style.width));

  // arcade stays locked until the full bonus gallery is collected
  await p.goto(url, { waitUntil: "load" }); await sleep(250);
  const arcLocked = (await p.$("#startarcade")) === null && (await p.$(".lockhint")) !== null;
  // easter egg: tapping all three start-screen polaroids opens arcade as well
  const fans = await p.$$(".fan .polaroid");
  await fans[0].click(); await fans[1].click(); await sleep(120);
  const eggPartial = (await p.$("#startarcade")) === null && (await p.$$(".fan .polaroid.egg")).length === 2;
  await (await p.$$(".fan .polaroid"))[2].click(); await sleep(350);
  const eggOpen = (await p.$("#startarcade")) !== null;
  await p.evaluate(() => localStorage.removeItem("nk_arc"));
  await p.goto(url, { waitUntil: "load" }); await sleep(250);
  const eggLockedAgain = (await p.$("#startarcade")) === null;

  await p.evaluate(ks => localStorage.setItem("nk_bonus", JSON.stringify(ks)),
    ["bonus1","bonus2","bonus3","bonus4","bonus5","bonus6","bonus7"]);
  await p.goto(url, { waitUntil: "load" }); await sleep(250);
  const arcOpen = (await p.$("#startarcade")) !== null;
  await p.click("#startarcade");
  await p.waitForSelector(".grid .tile:not([disabled])");
  const arcSkin = await p.$eval("body", e => e.classList.contains("arcade") && !e.classList.contains("retro"));
  const arcTime = await p.evaluate(() => TIME);
  const arcLen = await p.evaluate(() => round.length);
  const arcMode = await p.evaluate(() => gameMode);

  // answering must hand off on its own after ~3s, no click
  const ac = await p.$eval("#grid", g => g.dataset.correct);
  await p.click(`.grid .tile[data-oi="${ac}"]`);
  await p.waitForSelector("#next");
  const autoLbl = await p.$eval("#next", e => e.textContent);
  await p.waitForSelector(".grid .tile:not([disabled])", { timeout: 9000 });
  const autoAdvanced = (await p.evaluate(() => qi)) === 1;

  // the dispute row opens, freezes the auto-advance, and fails visibly while offline
  const ac2 = await p.$eval("#grid", g => g.dataset.correct);
  await p.click(`.grid .tile[data-oi="${ac2}"]`);
  await p.waitForSelector("#fbask");
  await p.click("#fbask");
  await p.waitForSelector("#fbtxt");
  await p.type("#fbtxt", "Sidney");
  await p.click("#fbsend");
  await p.waitForSelector(".fbmsg");
  await sleep(3600);
  const fbMsg = await p.$eval(".fbmsg", e => e.textContent).catch(() => "");
  const fbHeld = (await p.evaluate(() => qi)) === 1 && fbMsg.length > 3 && !fbMsg.includes("\u2026");

  const mb = await p.evaluate(() => mergeBonus(
    [{ name:"Luki", score:13379, mode:"23" }, { name:"Rafa", score:11452, mode:"10" }],
    [{ name:"luki", points:1000 }, { name:"Franky", points:1000 }]
  ).map(r => [r.name, r.score, r.mode, r.bonus || 0]));
  const bonusOk = JSON.stringify(mb) === JSON.stringify(
    [["Luki",14379,"23",1000], ["Rafa",11452,"10",0], ["Franky",1000,"\uD83C\uDF81",1000]]);

  const pick = async id => await p.evaluate(qid => { const q = QUESTIONS.find(x => x.id === qid);
    return { de: q.de.o[q.correct], fr: q.fr.o[q.correct], en: q.en.o[q.correct] }; }, id);
  const q1998 = await pick("conf1998");
  const qNb = await pick("neighbor");
  const contentOk = q1998.de.includes("in einem") && q1998.en.includes("at once") &&
                    qNb.de === "Sidney" && qNb.fr === "Sidney" && qNb.en === "Sidney";

  console.log("quick:", r1, "| full:", r2);
  console.log("save:", savedLabel, listHas, "| chips:", zero, ten, "| lightbox:", lb1, lb2);
  console.log("identity:", { plink, token: !!tok1, adopted, fpOk, hello1, hello2, nameCleared, teaser });
  console.log("content conf1998:", q1998.de, "| neighbor:", qNb.de, "|", contentOk);
  console.log("blitz bar:", w0.toFixed(1), "->", w1.toFixed(1));
  console.log("arcade:", { arcLocked, arcOpen, arcSkin, arcTime, arcLen, arcMode, autoAdvanced });
  console.log("egg:", { eggPartial, eggOpen, eggLockedAgain });
  console.log("auto label:", autoLbl.trim(), "| dispute:", fbHeld, JSON.stringify(fbMsg.trim()));
  console.log("bonus merge:", JSON.stringify(mb), "|", bonusOk);
  console.log("JS ERRORS:", errors.length ? errors : "none");
  await b.close();
  const ok = r1.rounds === 10 && r1.bonus === 3 && r1.gal === 3 && r1.lock === 4 &&
             r2.rounds === 23 && r2.bonus === 4 && r2.gal === 7 && r2.lock === 0 &&
             savedLabel.includes("\u2713") && listHas && zero && ten && lb1 && lb2 &&
             plink && tok1 && adopted && fpOk && hello1 && hello2 && nameCleared && teaser &&
             (w0 - w1) > 12 && contentOk &&
             arcLocked && eggPartial && eggOpen && eggLockedAgain &&
             arcOpen && arcSkin && arcTime === 5000 && arcLen === 23 &&
             arcMode === "\uD83D\uDC7E23" && /\d/.test(autoLbl) && autoAdvanced && fbHeld && bonusOk &&
             errors.length === 0;
  if (!ok) { console.error("ASSERTIONS FAILED"); process.exit(1); }
  console.log("ALL PASS");
})().catch(e => { console.error("FAIL:", e.message); process.exit(1); });
