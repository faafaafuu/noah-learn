// Разделы одной страницы: главная, «Попробовать» (живое демо: программа на
// ПК, мобильное приложение, онлайн) и библиотека — как устроен Qrack.
//
// Адреса: #/ — главная, #/try/pc|mobile|web, #/library/<статья>.
// Обычные якоря (#mcp, #goals) открывают главную и листают к блоку.

const views = [...document.querySelectorAll("[data-view]")];
const navLinks = [...document.querySelectorAll("[data-nav]")];
const TITLE = "Qrack — крякнись: учись так, чтобы понял";

function show(name) {
  for (const view of views) view.hidden = view.dataset.view !== name;
  for (const link of navLinks) link.classList.toggle("is-on", link.dataset.nav === name);
}

/* ── Попробовать ─────────────────────────────────────────────────────── */

const device = document.querySelector(".device");
const fit = document.querySelector(".device-fit");
const DEVICES = { pc: "ПК", mobile: "Мобильный", web: "Онлайн" };
/** Окно программы — в натуральную величину, на узком экране — уменьшенным. */
const WINDOW = { width: 1000, height: 700 };

function fitWindow() {
  if (device.dataset.device !== "pc") {
    device.style.transform = "";
    fit.style.height = "";
    return;
  }
  const scale = Math.min(1, fit.clientWidth / WINDOW.width);
  device.style.transform = scale < 1 ? `scale(${scale})` : "";
  fit.style.height = `${Math.round(WINDOW.height * scale)}px`;
}
addEventListener("resize", fitWindow);

function tryOn(kind) {
  if (!DEVICES[kind]) kind = "pc";
  // Демо грузится только когда его открыли. Программа на ПК — свой вид;
  // мобильный и онлайн — одни экраны, переключение не сбрасывает, куда зашёл.
  const wanted = kind === "pc" ? "desk" : "app";
  for (const frame of document.querySelectorAll(".device__screen")) {
    const on = frame.dataset.screen === wanted;
    frame.hidden = !on;
    if (on && !frame.src) frame.src = frame.dataset.src;
  }
  device.dataset.device = kind;
  requestAnimationFrame(fitWindow);
  for (const tab of document.querySelectorAll(".try__tabs [data-device]")) {
    const on = tab.dataset.device === kind;
    tab.classList.toggle("is-on", on);
    tab.setAttribute("aria-selected", String(on));
  }
  for (const about of document.querySelectorAll(".try__about [data-for]")) about.classList.toggle("is-on", about.dataset.for === kind);
  document.title = `Попробовать · ${DEVICES[kind]} — Qrack`;
}

/* ── Библиотека ──────────────────────────────────────────────────────── */

const nav = document.querySelector(".library__nav");
const doc = document.querySelector(".library__doc");
const search = document.querySelector(".library__search");
let index = null;
const texts = new Map();

const escape = (text) => text.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/** Строка Markdown: `код`, **жирный**, [ссылка](адрес). */
function inline(text) {
  const parts = text.split(/(`[^`]+`)/);
  return parts
    .map((part) => {
      if (/^`[^`]+`$/.test(part)) return `<code>${escape(part.slice(1, -1))}</code>`;
      return escape(part)
        .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
        .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label, href) => {
          const outside = /^https?:/.test(href);
          return `<a href="${href}"${outside ? ' target="_blank" rel="noopener"' : ""}>${label}</a>`;
        });
    })
    .join("");
}

/** Небольшой Markdown статей: заголовки, абзацы, списки, таблицы, код. */
function markdown(source) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i += 1;
      continue;
    }
    if (line.startsWith("```")) {
      const code = [];
      for (i += 1; i < lines.length && !lines[i].startsWith("```"); i += 1) code.push(lines[i]);
      i += 1;
      out.push(`<pre><code>${escape(code.join("\n"))}</code></pre>`);
      continue;
    }
    const head = /^(#{1,3}) (.+)$/.exec(line);
    if (head) {
      out.push(`<h${head[1].length}>${inline(head[2])}</h${head[1].length}>`);
      i += 1;
      continue;
    }
    if (line.startsWith("|")) {
      const rows = [];
      for (; i < lines.length && lines[i].startsWith("|"); i += 1) rows.push(lines[i]);
      const cells = (row) => row.replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim());
      const [first, , ...rest] = rows;
      const titles = cells(first);
      const thead = titles.some(Boolean) ? `<thead><tr>${titles.map((c) => `<th>${inline(c)}</th>`).join("")}</tr></thead>` : "";
      const tbody = rest.map((row) => `<tr>${cells(row).map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("");
      out.push(`<div class="table"><table>${thead}<tbody>${tbody}</tbody></table></div>`);
      continue;
    }
    const bullet = /^(\s*)(-|\d+\.) /;
    if (bullet.test(line)) {
      const ordered = /^\s*\d+\./.test(line);
      const items = [];
      for (; i < lines.length && (bullet.test(lines[i]) || (lines[i].startsWith("  ") && lines[i].trim())); i += 1) {
        if (bullet.test(lines[i])) items.push(lines[i].replace(bullet, ""));
        else items[items.length - 1] += ` ${lines[i].trim()}`;
      }
      const tag = ordered ? "ol" : "ul";
      out.push(`<${tag}>${items.map((item) => `<li>${inline(item)}</li>`).join("")}</${tag}>`);
      continue;
    }
    const para = [];
    for (; i < lines.length && lines[i].trim() && !/^(#{1,3} |```|\||\s*(-|\d+\.) )/.test(lines[i]); i += 1) para.push(lines[i].trim());
    out.push(`<p>${inline(para.join(" "))}</p>`);
  }
  return out.join("\n");
}

async function loadIndex() {
  if (index) return index;
  const reply = await fetch("library/index.json");
  index = await reply.json();
  let group = "";
  const parts = [];
  for (const item of index) {
    if (item.group !== group) {
      group = item.group;
      parts.push(`<p class="library__group">${escape(group)}</p>`);
    }
    parts.push(`<a href="#/library/${item.slug}" data-slug="${item.slug}">${escape(item.title)}</a>`);
  }
  nav.innerHTML = parts.join("");
  return index;
}

async function article(slug) {
  if (!texts.has(slug)) {
    const reply = await fetch(`library/${slug}.md`);
    if (!reply.ok) throw new Error("нет статьи");
    texts.set(slug, await reply.text());
  }
  return texts.get(slug);
}

async function read(slug) {
  try {
    const list = await loadIndex();
    const at = Math.max(0, list.findIndex((item) => item.slug === slug));
    const item = list[at];
    doc.innerHTML = markdown(await article(item.slug));
    const prev = list[at - 1];
    const next = list[at + 1];
    doc.insertAdjacentHTML(
      "beforeend",
      `<nav class="library__pager">${prev ? `<a href="#/library/${prev.slug}"><span>← назад</span>${escape(prev.title)}</a>` : ""}${next ? `<a href="#/library/${next.slug}"><span>дальше →</span>${escape(next.title)}</a>` : ""}</nav>`,
    );
    for (const link of nav.querySelectorAll("a")) link.classList.toggle("is-on", link.dataset.slug === item.slug);
    document.title = `${item.title} · Библиотека Qrack`;
  } catch {
    doc.innerHTML = "<h1>Не открылось</h1><p>Статья не загрузилась — проверь связь и обнови страницу.</p>";
  }
}

// Поиск по названиям и тексту статей: тексты подгружаются при первом вводе.
search?.addEventListener("input", async () => {
  const query = search.value.trim().toLowerCase();
  const list = await loadIndex();
  if (query) await Promise.all(list.map((item) => article(item.slug).catch(() => "")));
  for (const link of nav.querySelectorAll("a")) {
    const text = `${link.textContent} ${texts.get(link.dataset.slug) ?? ""}`.toLowerCase();
    link.hidden = Boolean(query) && !text.includes(query);
  }
  for (const group of nav.querySelectorAll(".library__group")) {
    let node = group.nextElementSibling;
    let any = false;
    for (; node && !node.classList.contains("library__group"); node = node.nextElementSibling) any ||= !node.hidden;
    group.hidden = !any;
  }
});

/* ── Маршруты ────────────────────────────────────────────────────────── */

let current = "";
function route() {
  const hash = location.hash;
  const [name = "", sub = ""] = hash.startsWith("#/") ? hash.slice(2).split("/") : [];
  const view = ["try", "library"].includes(name) ? name : "home";
  const changed = view !== current;
  show(view);
  current = view;
  if (view === "try") tryOn(sub);
  if (view === "library") read(sub || "about");
  if (view === "home") {
    document.title = TITLE;
    const target = !hash.startsWith("#/") && hash.length > 1 ? document.getElementById(hash.slice(1)) : null;
    if (target) {
      requestAnimationFrame(() => target.scrollIntoView({ behavior: changed ? "auto" : "smooth" }));
      return;
    }
  }
  if (changed || view === "library") scrollTo({ top: 0, behavior: "auto" });
}

addEventListener("hashchange", route);
route();
