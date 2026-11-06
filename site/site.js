// Сайт Qrack: появление блоков при прокрутке, кольцо Ноа (то же, что в
// приложении), искры на фоне, наклон телефона за курсором, свет под
// курсором на карточках, каскад целей, переключатель тем и «Копировать».
// Без движения в настройках системы — всё стоит, тексты видны сразу.

const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
const root = document.documentElement;

/* ── Появление при прокрутке ─────────────────────────────────────────── */

const reveal = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.classList.add("is-in");
      reveal.unobserve(entry.target);
    }
  },
  { threshold: 0.14, rootMargin: "0px 0px -6% 0px" },
);
document.querySelectorAll(".reveal").forEach((node, i) => {
  // Соседи в одной сетке появляются лесенкой.
  node.style.transitionDelay = `${(i % 6) * 70}ms`;
  reveal.observe(node);
});

/* ── Шаги: линия дорастает вместе с прокруткой ───────────────────────── */

const steps = document.querySelector(".steps");
const line = document.querySelector(".steps__line");
function stepLine() {
  if (!steps || !line) return;
  const box = steps.getBoundingClientRect();
  const k = Math.min(1, Math.max(0, (innerHeight * 0.75 - box.top) / (box.height + innerHeight * 0.3)));
  line.style.setProperty("--progress", String(k));
}

/* ── Каскад целей: строки загораются сверху вниз, задачи дня — отмечаются ── */

const cascade = document.querySelector(".cascade");
if (cascade) {
  const rows = [...cascade.querySelectorAll(".cascade__row")];
  new IntersectionObserver(
    ([entry], observer) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      rows.forEach((row, i) => setTimeout(() => row.classList.add("is-lit"), still ? 0 : i * 260));
      // Сначала отмечаются задачи дня, потом — неделя: маленькое тянет большое.
      const order = [5, 3, 4, 2];
      order.forEach((at, i) => setTimeout(() => rows[at]?.classList.add("is-done"), still ? 0 : 1900 + i * 520));
    },
    { threshold: 0.4 },
  ).observe(cascade);
}

/* ── Счётчики на первом экране ───────────────────────────────────────── */

for (const node of document.querySelectorAll("[data-count]")) {
  if (still) continue;
  const to = Number(node.dataset.count);
  const from = performance.now();
  const tick = (now) => {
    const k = Math.min(1, (now - from) / 1400);
    node.textContent = String(Math.round(to * (1 - (1 - k) ** 3)));
    if (k < 1) requestAnimationFrame(tick);
  };
  node.textContent = "0";
  requestAnimationFrame(tick);
}

/* ── Наклон телефона и свет под курсором ─────────────────────────────── */

if (!still && matchMedia("(pointer: fine)").matches) {
  for (const phone of document.querySelectorAll(".tilt")) {
    const host = phone.parentElement;
    host.addEventListener("pointermove", (event) => {
      const box = host.getBoundingClientRect();
      const x = (event.clientX - box.left) / box.width - 0.5;
      const y = (event.clientY - box.top) / box.height - 0.5;
      phone.style.transform = `rotateY(${x * 16}deg) rotateX(${-y * 12}deg) translateZ(0)`;
    });
    host.addEventListener("pointerleave", () => (phone.style.transform = ""));
  }
  for (const card of document.querySelectorAll(".card")) {
    card.addEventListener("pointermove", (event) => {
      const box = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${event.clientX - box.left}px`);
      card.style.setProperty("--my", `${event.clientY - box.top}px`);
    });
  }
}

/* ── Темы: Неон и Классика ───────────────────────────────────────────── */

const shot = document.querySelector(".looks__img");
for (const button of document.querySelectorAll(".look")) {
  button.addEventListener("click", () => {
    const look = button.dataset.look;
    root.dataset.look = look;
    for (const other of document.querySelectorAll(".look")) other.classList.toggle("is-on", other === button);
    if (shot) {
      shot.style.opacity = "0";
      setTimeout(() => {
        shot.src = shot.dataset[look];
        shot.style.opacity = "1";
      }, 250);
    }
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", look === "classic" ? "#f7f6f1" : "#060809");
  });
}

/* ── Копировать адрес MCP ────────────────────────────────────────────── */

for (const button of document.querySelectorAll("[data-copy]")) {
  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(button.dataset.copy);
      button.textContent = "Скопировано";
    } catch {
      button.textContent = "Выделите адрес";
    }
    setTimeout(() => (button.textContent = "Копировать"), 1800);
  });
}

/* ── Кольцо Ноа — как в приложении: дуга «смотрю», зубцы «говорю» ─────── */

const rings = [...document.querySelectorAll("canvas.ring")];
const sky = document.querySelector("canvas.sky");
const started = performance.now();
let mode = "look";
// Каждые несколько секунд кольцо «говорит» — как Ноа, объясняющая урок.
if (!still) setInterval(() => (mode = mode === "look" ? "speak" : "look"), 4200);

function drawRing(canvas, t) {
  const size = canvas.clientWidth;
  if (!size) return;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  if (canvas.width !== Math.round(size * dpr)) {
    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
  }
  const x = canvas.getContext("2d");
  const k = (size * dpr) / 100;
  x.setTransform(k, 0, 0, k, 0, 0);
  x.clearRect(0, 0, 100, 100);
  const classic = root.dataset.look === "classic";
  const col = classic ? ["#2b5bc4", "#14306b", "#2b5bc4"] : mode === "speak" ? ["#ff5ad2", "#b08cff", "#00f0ff"] : ["#00f0ff", "#7c8cf0", "#00f0ff"];
  const lvl = mode === "speak" ? 0.55 + Math.sin(t * 3.1) * 0.22 + Math.sin(t * 7.3) * 0.1 : 0.3 + Math.sin(t * 2.2) * 0.07;
  if (!classic) {
    const g = x.createRadialGradient(50, 50, 2, 50, 50, 48);
    g.addColorStop(0, `${col[0]}30`);
    g.addColorStop(1, "transparent");
    x.fillStyle = g;
    x.beginPath();
    x.arc(50, 50, 48, 0, 6.3);
    x.fill();
  }
  const spikes = mode === "speak" ? 20 : 56;
  const base = 30 + lvl * 5;
  const amp = (mode === "speak" ? 9 : 4) * lvl + 1;
  x.beginPath();
  for (let i = 0; i <= spikes; i++) {
    const a = (i / spikes) * Math.PI * 2;
    const n = mode === "speak" ? Math.sin(a * 5 + t * 3) * 0.6 + Math.sin(a * 3 - t * 1.8) * 0.4 : Math.sin(a * 9 + t * 4) * 0.5 + Math.sin(a * 5 - t * 2.6) * 0.5;
    const r = base + n * amp;
    const px = 50 + Math.cos(a) * r;
    const py = 50 + Math.sin(a) * r;
    if (i) x.lineTo(px, py);
    else x.moveTo(px, py);
  }
  x.closePath();
  const lg = x.createLinearGradient(20, 50, 80, 50);
  lg.addColorStop(0, col[0]);
  lg.addColorStop(0.5, col[1]);
  lg.addColorStop(1, col[2]);
  x.strokeStyle = lg;
  x.lineWidth = 0.9;
  x.shadowColor = classic ? "transparent" : col[0];
  x.shadowBlur = 6;
  x.stroke();
  x.shadowBlur = 0;
  if (mode === "look") {
    x.strokeStyle = `${col[0]}aa`;
    x.lineWidth = 0.6;
    x.beginPath();
    x.arc(50, 50, base + 9, t * 1.4, t * 1.4 + 1.2);
    x.stroke();
  }
}

/* ── Небо: сетка уходит вдаль, искры поднимаются ─────────────────────── */

const sparks = Array.from({ length: 70 }, () => ({ x: Math.random(), y: Math.random(), v: 0.00025 + Math.random() * 0.0007, r: 0.5 + Math.random() * 1.6, p: Math.random() * 6 }));

function drawSky(t) {
  if (!sky || root.dataset.look === "classic") return;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const w = innerWidth;
  const h = innerHeight;
  if (sky.width !== Math.round(w * dpr) || sky.height !== Math.round(h * dpr)) {
    sky.width = Math.round(w * dpr);
    sky.height = Math.round(h * dpr);
  }
  const x = sky.getContext("2d");
  x.setTransform(dpr, 0, 0, dpr, 0, 0);
  x.clearRect(0, 0, w, h);
  // Сетка-пол: линии к горизонту, сдвиг по времени и прокрутке.
  const horizon = h * 0.62;
  const shift = ((t * 22 + scrollY * 0.25) % 40) / 40;
  x.strokeStyle = "rgba(0, 240, 255, 0.07)";
  x.lineWidth = 1;
  for (let i = 0; i < 16; i++) {
    const k = (i + shift) / 16;
    const y = horizon + (h - horizon) * k * k;
    x.beginPath();
    x.moveTo(0, y);
    x.lineTo(w, y);
    x.stroke();
  }
  for (let i = -12; i <= 12; i++) {
    x.beginPath();
    x.moveTo(w / 2 + i * 14, horizon);
    x.lineTo(w / 2 + i * w * 0.12, h);
    x.stroke();
  }
  // Искры.
  for (const s of sparks) {
    s.y -= s.v * 16;
    if (s.y < -0.02) {
      s.y = 1.02;
      s.x = Math.random();
    }
    const glow = 0.35 + Math.sin(t * 2 + s.p) * 0.25;
    x.fillStyle = `rgba(${s.p > 3 ? "255, 90, 210" : "0, 240, 255"}, ${glow})`;
    x.beginPath();
    x.arc(s.x * w, s.y * h, s.r, 0, 6.3);
    x.fill();
  }
}

function frame(now) {
  const t = (now - started) / 1000;
  for (const ring of rings) drawRing(ring, t);
  drawSky(t);
  stepLine();
  if (!still) requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
addEventListener("scroll", () => still && stepLine(), { passive: true });
