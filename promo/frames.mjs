// Кадры ролика из stage.html.
//   node --experimental-websocket frames.mjs sheet <cut> <out-dir> t1,t2,...  — отдельные кадры PNG
//   node --experimental-websocket frames.mjs video <cut> <out.mp4> [fps] [from] [to]  — все кадры в H.264
import { spawn } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const [mode, cut, out, arg4, arg5, arg6] = process.argv.slice(2);
const PROFILE = mkdtempSync(join(tmpdir(), "reel-"));
// Профиль браузера — временный: после работы удаляется (их копилось на гигабайты).
process.on("exit", () => { try { rmSync(PROFILE, { recursive: true, force: true, maxRetries: 5 }); } catch {} });
const EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const PORT = 9353 + Math.floor(Math.random() * 200);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const edge = spawn(EDGE, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${PROFILE}`, "--hide-scrollbars", "--force-device-scale-factor=1", "about:blank"], { stdio: "ignore" });
for (let i = 0; i < 50; i++) { try { await fetch(`http://127.0.0.1:${PORT}/json/version`); break; } catch { await sleep(200); } }
const target = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: "PUT" })).json();
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const wait = new Map();
ws.onmessage = (m) => { const d = JSON.parse(m.data); if (d.id && wait.has(d.id)) { wait.get(d.id)(d); wait.delete(d.id); } };
const send = (method, params = {}) => new Promise((r) => { id += 1; wait.set(id, r); ws.send(JSON.stringify({ id, method, params })); });
const run = async (code) => {
  const r = await send("Runtime.evaluate", { expression: code, awaitPromise: true, returnByValue: true });
  if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description ?? JSON.stringify(r.result.exceptionDetails));
  return r.result?.result?.value;
};
await send("Emulation.setDeviceMetricsOverride", { width: 1080, height: 1920, deviceScaleFactor: 1, mobile: false });
await send("Page.navigate", { url: `http://127.0.0.1:8078/stage.html?cut=${cut}${process.env.Q ?? ""}` });
await sleep(1500);
await run("window.ready"); 
const duration = await run("window.DURATION");
const shot = async (format = "png") => Buffer.from((await send("Page.captureScreenshot", { format, quality: format === "jpeg" ? 94 : undefined, optimizeForSpeed: true })).result.data, "base64");

if (mode === "sheet") {
  mkdirSync(out, { recursive: true });
  for (const t of arg4.split(",").map(Number)) {
    await run(`render(${t}); true`); 
    writeFileSync(join(out, `t${String(t.toFixed(2)).padStart(6, "0")}.png`), await shot());
  }
  console.log("кадров", arg4.split(",").length);
} else {
  const fps = Number(arg4 ?? 30), from = Number(arg5 ?? 0), to = Number(arg6 ?? duration);
  const ff = spawn("ffmpeg", ["-loglevel", "error", "-y", "-f", "image2pipe", "-framerate", String(fps), "-c:v", "mjpeg", "-i", "pipe:0",
    "-c:v", "libx264", "-preset", "medium", "-crf", "15", "-pix_fmt", "yuv420p", "-r", String(fps), out], { stdio: ["pipe", "inherit", "inherit"] });
  const total = Math.round((to - from) * fps);
  const started = Date.now();
  for (let f = 0; f < total; f++) {
    await run(`render(${from + f / fps}); true`);
    const img = await shot("jpeg");
    if (!ff.stdin.write(img)) await new Promise((r) => ff.stdin.once("drain", r));
    if (f % 150 === 0) console.log(`кадр ${f}/${total}, ${((Date.now() - started) / 1000).toFixed(0)} с`);
  }
  ff.stdin.end();
  await new Promise((r) => ff.on("close", r));
  console.log("готово", out, total, "кадров за", ((Date.now() - started) / 1000).toFixed(0), "с");
}
ws.close();
edge.kill();
await new Promise((r) => setTimeout(r, 800));
process.exit(0);
