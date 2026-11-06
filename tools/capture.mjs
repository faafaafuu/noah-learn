// Снимки и анимации приложения для сайта и README — с настоящих экранов.
//
// Edge без окна, команды по протоколу отладки (CDP), кадры — в ffmpeg.
// Экраны берутся с витрины репозитория NOAH (src/dev/learn.html и
// src/dev/learning.html на подменных данных): её поднимает
// scripts/dev-server.mjs на порту 5173.
//
// Запуск: node --experimental-websocket tools/capture.mjs [имя сцены…]
// Без имён — все сцены. Готовое — в site/media/.

import { spawn, execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "..", "site", "media");
const BASE = process.env.SHOWCASE ?? "http://localhost:5173";
const EDGE = process.env.EDGE ?? "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe";
const PORT = 9333;
const PHONE = { width: 390, height: 844, deviceScaleFactor: 2, mobile: true };
const DESKTOP = { width: 1280, height: 800, deviceScaleFactor: 1.5, mobile: false };

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

/** Соединение с вкладкой: send(метод, параметры) → ответ. */
async function connect(url) {
  const socket = new WebSocket(url);
  await new Promise((ready, fail) => {
    socket.onopen = ready;
    socket.onerror = fail;
  });
  let next = 0;
  const waiting = new Map();
  socket.onmessage = (message) => {
    const data = JSON.parse(message.data);
    if (data.id && waiting.has(data.id)) {
      const { done, fail } = waiting.get(data.id);
      waiting.delete(data.id);
      if (data.error) fail(new Error(data.error.message));
      else done(data.result);
    }
  };
  const send = (method, params = {}) =>
    new Promise((done, fail) => {
      next += 1;
      waiting.set(next, { done, fail });
      socket.send(JSON.stringify({ id: next, method, params }));
    });
  return { send, close: () => socket.close() };
}

async function browser() {
  const profile = mkdtempSync(join(tmpdir(), "noah-capture-"));
  const edge = spawn(EDGE, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, "--hide-scrollbars", "--mute-audio", "about:blank"], {
    stdio: "ignore",
  });
  for (let i = 0; i < 50; i++) {
    try {
      await fetch(`http://127.0.0.1:${PORT}/json/version`);
      break;
    } catch {
      await sleep(200);
    }
  }
  return {
    async page(metrics) {
      const target = await (await fetch(`http://127.0.0.1:${PORT}/json/new?about:blank`, { method: "PUT" })).json();
      const tab = await connect(target.webSocketDebuggerUrl);
      await tab.send("Page.enable");
      await tab.send("Runtime.enable");
      await tab.send("Emulation.setDeviceMetricsOverride", metrics);
      if (metrics.mobile) await tab.send("Emulation.setTouchEmulationEnabled", { enabled: true });
      await tab.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: "dark" }, { name: "prefers-reduced-motion", value: "no-preference" }] });
      return {
        async open(path) {
          await tab.send("Page.navigate", { url: `${BASE}${path}` });
          await sleep(2500);
        },
        /** JS на странице; ждёт промис. */
        async run(code) {
          const result = await tab.send("Runtime.evaluate", { expression: `(async () => { ${code} })()`, awaitPromise: true, returnByValue: true });
          if (result.exceptionDetails) throw new Error(`${code.slice(0, 80)}: ${result.exceptionDetails.exception?.description ?? result.exceptionDetails.text}`);
          return result.result?.value;
        },
        async shot(file) {
          const { data } = await tab.send("Page.captureScreenshot", { format: "png" });
          writeFileSync(file, Buffer.from(data, "base64"));
        },
        close: () => tab.close(),
      };
    },
    close() {
      edge.kill();
      try {
        rmSync(profile, { recursive: true, force: true });
      } catch {
        /* Edge ещё держит папку — уберёт система */
      }
    },
  };
}

/**
 * Запись: шаги сцены, между ними кадры с частотой `fps`. Шаг — функция или
 * пауза в мс. Готовое — mp4 (для сайта) и webp (для README).
 */
async function record(page, name, steps, { fps = 12, width } = {}) {
  const frames = mkdtempSync(join(tmpdir(), `noah-${name}-`));
  let n = 0;
  const frame = async () => page.shot(join(frames, `${String(n++).padStart(4, "0")}.png`));
  for (const step of steps) {
    if (typeof step === "number") {
      for (let left = step; left > 0; left -= 1000 / fps) await frame();
    } else {
      await step();
      await frame();
    }
  }
  const input = ["-framerate", String(fps), "-i", join(frames, "%04d.png")];
  const scale = width ? `scale=${width}:-2:flags=lanczos` : "null";
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", ...input, "-vf", `${scale},format=yuv420p`, "-c:v", "libx264", "-crf", "24", "-movflags", "+faststart", join(OUT, `${name}.mp4`)]);
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", ...input, "-vf", scale, "-c:v", "libwebp_anim", "-q:v", "70", "-loop", "0", join(OUT, `${name}.webp`)]);
  rmSync(frames, { recursive: true, force: true });
  console.log(`${name}: ${n} кадров`);
}

/** Плавная прокрутка текущего экрана телефона на `by` пикселей за `ms`. */
const scrollBy = (page, by, ms, fps = 12) => {
  const steps = Math.max(1, Math.round((ms / 1000) * fps));
  return Array.from({ length: steps }, () => () => page.run(`[...document.querySelectorAll(".content")].pop()?.scrollBy(0, ${by / steps})`));
};

const nav = (call) => `const { nav } = await import("/js/learn-app/core.js"); ${call}; await new Promise((r) => setTimeout(r, 700));`;

const SCENES = {
  async phone(b) {
    const page = await b.page(PHONE);
    await page.open("/dev/learn.html");
    await page.shot(join(OUT, "phone-home.png"));
    const course = await page.run(`return (await (await fetch("/dev/learn-fixtures.json")).json()).overview?.[0]?.id ?? "devops"`);
    await page.run(nav(`nav.push("course", { course: ${JSON.stringify(course)} })`));
    await page.shot(join(OUT, "phone-course.png"));
    const topic = await page.run(`return (await (await fetch("/dev/learn-fixtures.json")).json()).overview?.[0]?.current ?? null`);
    if (topic) {
      await page.run(nav(`nav.push("lesson", { course: ${JSON.stringify(course)}, topic: ${JSON.stringify(topic)} })`));
      await sleep(800);
      await page.shot(join(OUT, "phone-lesson.png"));
    }
    await page.run(nav(`nav.tab("review", true)`));
    await sleep(800);
    await page.shot(join(OUT, "phone-review.png"));
    await page.close();
  },

  async flow(b) {
    const page = await b.page(PHONE);
    await page.open("/dev/learn.html");
    const course = await page.run(`return (await (await fetch("/dev/learn-fixtures.json")).json()).overview?.[0]?.id ?? "devops"`);
    const topic = await page.run(`return (await (await fetch("/dev/learn-fixtures.json")).json()).overview?.[0]?.current ?? null`);
    await record(
      page,
      "flow",
      [
        1500,
        () => page.run(nav(`nav.push("course", { course: ${JSON.stringify(course)} })`)),
        1500,
        ...scrollBy(page, 420, 1200),
        1000,
        () => page.run(nav(`nav.push("lesson", { course: ${JSON.stringify(course)}, topic: ${JSON.stringify(topic)} })`)),
        1500,
        ...scrollBy(page, 600, 2000),
        1500,
      ],
      { width: 390 },
    );
    await page.close();
  },

  async guide(b) {
    const page = await b.page(PHONE);
    await page.open("/dev/learn.html");
    const id = await page.run(`return (await (await import("/js/bridge.js")).tauri()?.invoke("guides_list"))?.[1]?.id ?? null`).catch(() => null);
    if (!id) return console.log("guide: путеводителей на витрине нет");
    await page.run(nav(`nav.push("guide", { id: ${JSON.stringify(id)} })`));
    await sleep(1500);
    await page.shot(join(OUT, "phone-guide.png"));
    await page.close();
  },

  // Qrack для сайта: главная с целями дня, вкладка «Цели», обзор курса и
  // классическая тема. Цели ставятся тем же кодом, что в приложении.
  async qrack(b) {
    const page = await b.page(PHONE);
    await page.open("/dev/learn.html");
    await page.run(`localStorage.clear(); localStorage.setItem("learn.look", '"neon"');`);
    await page.open("/dev/learn.html");
    await page.run(`
      const g = await import("/js/learn-app/goals.js");
      const ideas = g.suggestDay();
      ideas.forEach((idea) => g.goals.save(idea));
      const week = g.goals.save({ period: "week", start: g.periodStart("week"), kind: "topics", course: ideas[0]?.course ?? "devops", target: 2, title: "Пройти 2 темы за неделю", by: "ai" });
      g.goals.save({ period: "month", start: g.periodStart("month"), kind: "course", course: ideas[0]?.course ?? "devops", title: "Дойти до Kubernetes", by: "noa" });
      const first = g.goals.all().find((x) => x.period === "day" && x.kind === "focus");
      if (first) g.goals.save({ ...first, done: true, doneAt: Date.now() });
    `);
    await page.open("/dev/learn.html");
    await sleep(800);
    await page.shot(join(OUT, "qrack-home.png"));
    await page.run(nav(`nav.tab("goals")`));
    await sleep(900);
    await page.shot(join(OUT, "qrack-goals.png"));
    const course = await page.run(`return (await (await fetch("/dev/learn-fixtures.json")).json()).overview?.[0]?.id ?? "devops"`);
    await page.run(nav(`nav.tab("courses"); nav.push("course", { course: ${JSON.stringify(course)} })`));
    await sleep(900);
    await page.shot(join(OUT, "qrack-course.png"));
    await page.run(`localStorage.setItem("learn.look", '"classic"');`);
    await page.open("/dev/learn.html");
    await sleep(800);
    await page.shot(join(OUT, "qrack-classic.png"));
    await page.close();
  },

  async desktop(b) {
    const page = await b.page(DESKTOP);
    await page.open("/dev/learning.html");
    await page.shot(join(OUT, "desktop-home.png"));
    await page.close();
  },
};

mkdirSync(OUT, { recursive: true });
const wanted = process.argv.slice(2);
const b = await browser();
try {
  for (const [name, scene] of Object.entries(SCENES)) {
    if (wanted.length && !wanted.includes(name)) continue;
    await scene(b);
    console.log(`${name}: готово`);
  }
} finally {
  b.close();
}
