// Снимки экранов приложения для ролика на вымышленных данных:
// node --experimental-websocket cap.mjs <out-dir> <promo-fixtures.json>
// Витрина получает подменённые курсы через перехват запросов (Fetch), сам
// репозиторий не меняется.
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [OUT, FIXTURES] = process.argv.slice(2);
const ONLY = process.argv[4] ? process.argv[4].split(",") : null;
const REPO = "C:/Users/manda/StudioProjects/asis/src";
mkdirSync(OUT, { recursive: true });
const promo = JSON.parse(readFileSync(FIXTURES, "utf8"));

// Подмены текстов: заготовки витрины про Docker и Kubernetes — на нейтральные.
function mockJs() {
  return readFileSync(`${REPO}/dev/learn-mock.js`, "utf8")
    .replace("Kubernetes в проде", "Испанский к лету")
    .replace('courseId: "k8s"', 'courseId: "es"')
    .replace("Пишу тему 4 из 9", "Пишу тему 4 из 9: «В кафе»")
    .replace("Сегодня по плану тема Docker: урок прочитан наполовину, две карточки ждут повторения.", "Сегодня по плану томаты черри: урок прочитан наполовину, четыре карточки ждут повторения.");
}
function learningHtml() {
  const html = readFileSync(`${REPO}/dev/learning.html`, "utf8");
  const start = html.indexOf("const courses = [");
  const end = html.indexOf("globalThis.__TAURI__");
  return html.slice(0, start) + `const courses = ${JSON.stringify(promo.overview)};\n      ` + html.slice(end);
}
const SWAP = [
  [/dev\/learn-fixtures\.json/, () => JSON.stringify(promo), "application/json"],
  [/dev\/learn-mock\.js/, mockJs, "text/javascript"],
  [/dev\/learning\.html/, learningHtml, "text/html"],
];

const PROFILE = mkdtempSync(join(tmpdir(), "reel-"));
// Профиль браузера — временный: после работы удаляется (их копилось на гигабайты).
process.on("exit", () => { try { rmSync(PROFILE, { recursive: true, force: true, maxRetries: 5 }); } catch {} });
const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const PORT = 9351;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const edge = spawn(EDGE, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE}`, "--hide-scrollbars", "about:blank"], { stdio: "ignore" });
for (let i = 0; i < 50; i++) {
  try { await fetch(`http://127.0.0.1:${PORT}/json/version`); break; } catch { await sleep(200); }
}

async function tab() {
  const target = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: "PUT" })).json();
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0;
  const wait = new Map();
  const send = (method, params = {}) => new Promise((r) => { id += 1; wait.set(id, r); ws.send(JSON.stringify({ id, method, params })); });
  ws.onmessage = (m) => {
    const d = JSON.parse(m.data);
    if (d.id && wait.has(d.id)) { wait.get(d.id)(d); wait.delete(d.id); return; }
    if (d.method === "Fetch.requestPaused") {
      const { requestId, request } = d.params;
      const swap = SWAP.find(([re]) => re.test(request.url));
      if (!swap) { send("Fetch.continueRequest", { requestId }); return; }
      send("Fetch.fulfillRequest", {
        requestId, responseCode: 200,
        responseHeaders: [{ name: "Content-Type", value: `${swap[2]}; charset=utf-8` }, { name: "Cache-Control", value: "no-store" }],
        body: Buffer.from(swap[1](), "utf8").toString("base64"),
      });
    }
  };
  await send("Fetch.enable", { patterns: [{ urlPattern: "*learn-fixtures.json*" }, { urlPattern: "*learn-mock.js*" }, { urlPattern: "*dev/learning.html*" }] });
  await send("Network.setCacheDisabled", { cacheDisabled: true });
  const run = async (code) => {
    const r = await send("Runtime.evaluate", { expression: `(async () => { ${code} })()`, awaitPromise: true, returnByValue: true });
    return r.result?.result?.value ?? r.result?.exceptionDetails?.exception?.description ?? null;
  };
  const shot = async (name) => {
    const s = await send("Page.captureScreenshot", { format: "png" });
    writeFileSync(join(OUT, `${name}.png`), Buffer.from(s.result.data, "base64"));
    console.log("снят", name);
  };
  return { send, run, shot };
}

const go = (step) => `const { nav } = await import('/js/learn-app/core.js'); ${step}; await new Promise(r => setTimeout(r, 1800));`;
const PHONE = [
  ["home", "", ""],
  ["home-courses", "", "const c=[...document.querySelectorAll('.content')].pop(); c.scrollTop = 520; await new Promise(r => setTimeout(r, 400));"],
  ["build", "?build=1", ""],
  ["course", "", go("nav.push('course', { course: 'garden' })")],
  ["topic", "", go("nav.push('topic', { course: 'garden', topic: 'tomatoes' })")],
  ["lesson", "", go("nav.push('lesson', { course: 'garden', topic: 'tomatoes' })")],
  ["lesson-stars", "", go("nav.push('lesson', { course: 'stars', topic: 'life' })")],
  ["check", "", go("nav.push('check', { course: 'garden', scope: 'tomatoes' })")],
  ["check-right", "", go("nav.push('check', { course: 'garden', scope: 'tomatoes' })") +
    "const opts=[...document.querySelectorAll('button')].filter(b=>/6–8 часов/.test(b.textContent)); opts[0]?.click(); await new Promise(r=>setTimeout(r,500)); const next=[...document.querySelectorAll('button')].find(b=>/Провер|Ответ/.test(b.textContent)); next?.click(); await new Promise(r=>setTimeout(r,2200));"],
  ["review", "", go("nav.push('review', {})")],
  ["interview", "", go("nav.push('interview', { course: 'travel', topic: 'airport' })")],
  ["guide", "", go("nav.push('guide', { id: 'g1' })")],
  ["profile", "", go("nav.push('profile', {})")],
];

if (!ONLY || ONLY.includes("phone")) {
  const phone = await tab();
  await phone.send("Emulation.setDeviceMetricsOverride", { width: 390, height: 844, deviceScaleFactor: 3, mobile: true });
  for (const [name, query, step] of PHONE) {
    await phone.send("Page.navigate", { url: `http://localhost:5173/dev/learn.html${query}` });
    await sleep(2400);
    if (step) {
      const res = await phone.run(step + " return 'ok'");
      if (res !== "ok") console.log(name, res);
    }
    await phone.shot(`phone-${name}`);
  }
}

if (!ONLY || ONLY.includes("desk")) {
  const desk = await tab();
  await desk.send("Emulation.setDeviceMetricsOverride", { width: 1280, height: 800, deviceScaleFactor: 2, mobile: false });
  for (const [name, url] of [
    ["desk-learning", "http://localhost:5173/dev/learning.html"],
    ["desk-popups", "http://localhost:5173/dev/popups.html"],
  ]) {
    await desk.send("Page.navigate", { url });
    await sleep(2800);
    await desk.shot(name);
  }
}
edge.kill();
await new Promise((r) => setTimeout(r, 800));
process.exit(0);
