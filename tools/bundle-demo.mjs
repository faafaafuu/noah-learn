// Живая демо-версия Qrack для сайта: те же экраны и код, что в приложении,
// на подменных командах и выдуманных курсах (?demo=1). Своих курсов, целей и
// ключей здесь нет — только src/dev/learn-demo.json из монорепозитория NOAH.
//
// Запуск: node tools/bundle-demo.mjs   (ASIS=путь к монорепозиторию, по
// умолчанию ../asis). Готовое — в site/demo/, страница — site/demo/index.html.

import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = join(process.env.ASIS ?? join(HERE, "..", "..", "asis"), "src");
const OUT = join(HERE, "..", "site", "demo");

if (!existsSync(join(SRC, "learn.html"))) throw new Error(`нет монорепозитория NOAH: ${SRC}`);
rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, "dev"), { recursive: true });

// Код и оформление — без тестов.
const skip = (path) => /\.test\.m?js$/.test(path) || /[\\/]__\w+__[\\/]?/.test(path);
for (const dir of ["js", "styles", "assets", "vendor/xterm"]) {
  cpSync(join(SRC, dir), join(OUT, dir), { recursive: true, filter: (path) => !skip(path) });
}

// Подменные команды. Только выдуманные данные: файл с выгрузкой настоящих
// курсов (learn-fixtures.json) сюда не попадает никогда.
const mock = readFileSync(join(SRC, "dev", "learn-mock.js"), "utf8")
  // Демо-режим всегда: выдуманные курсы и путеводители без адреса с ?demo=1.
  .replace("const params = new URLSearchParams(location.search);", 'const params = new URLSearchParams(location.search);\n  params.set("demo", "1");')
  .replace('import("/dev/guides-mock.js")', 'import("./guides-mock.js")')
  .replace('fetch(params.get("demo") ? "dev/learn-demo.json" : "dev/learn-fixtures.json")', 'fetch("dev/learn-demo.json")');
if (mock.includes('"dev/learn-fixtures.json"') || mock.includes('"/dev/')) throw new Error("подмена ссылается на настоящие данные или абсолютный путь");
writeFileSync(join(OUT, "dev", "learn-mock.js"), mock);
for (const file of ["learn-demo.json", "guides-mock.js", "drama-mock.js"]) cpSync(join(SRC, "dev", file), join(OUT, "dev", file));

// Страница — как learn.html, но с подменой и без <base>: на сервере base-uri запрещён.
const page = readFileSync(join(SRC, "learn.html"), "utf8");
const links = [...page.matchAll(/<link rel="stylesheet" href="\.\/([^"]+)" \/>/g)].map((m) => `    <link rel="stylesheet" href="${m[1]}" />`);
writeFileSync(
  join(OUT, "index.html"),
  `<!doctype html>
<html lang="ru" data-theme="neon" data-scale="phone" data-app="learn">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover" />
    <meta name="color-scheme" content="dark" />
    <meta name="robots" content="noindex" />
    <title>Qrack — демо</title>
    <!-- Демо-версия: собрана tools/bundle-demo.mjs из монорепозитория NOAH.
         Не править руками — пересобрать. -->
${links.join("\n")}
    <script src="dev/learn-mock.js"></script>
  </head>
  <body>
    <main class="app"></main>
    <script type="module" src="js/learn-app/main.js"></script>
  </body>
</html>
`,
);
// Окно для Windows — свой вид: заголовок окна, боковое меню, курсы сеткой
// (learning.html по макету окна 1000 × 700). Те же подменные команды.
const desk = readFileSync(join(SRC, "learning.html"), "utf8")
  .replace(/\r\n/g, "\n")
  .replaceAll('href="./', 'href="')
  .replaceAll('src="./', 'src="')
  .replace("<title>Обучение — NOAH</title>", '<title>Qrack для Windows — демо</title>\n    <meta name="robots" content="noindex" />')
  .replace('<script src="js/window-errors.js"></script>', '<script src="js/window-errors.js"></script>\n    <script src="dev/learn-mock.js"></script>')
  .replace('data-el="appVersion">NOAH</span>', 'data-el="appVersion">QRACK</span>')
  .replaceAll("окна обучения", "окна Qrack");
if (!desk.includes("dev/learn-mock.js") || !desk.includes("QRACK")) throw new Error("learning.html изменился — поправить сборку окна");
writeFileSync(join(OUT, "desktop.html"), desk);
console.log("демо собрано:", OUT);
