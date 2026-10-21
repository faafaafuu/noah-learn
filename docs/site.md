# Сайт и медиа

Сайт — статический: `site/index.html`, `style.css`, `site.js`, шрифты и медиа.
Сервер NOAH отдаёт его по `/learn/` из папки `NOAH_LEARN_SITE`
(по умолчанию `/opt/noah-learn/site`), приложение — по `/learn/app/`.

## Выложить

```bash
tar -cf - site | ssh germ 'cd /opt/noah-learn && rm -rf site && tar -xf - --no-same-owner && chmod -R a+rX site'
```

Перезапуск не нужен: сервер читает файлы при каждом запросе. Страница идёт с
`Cache-Control: no-cache` — зеркало `m.noahlab.ru` не держит её копию.

## Свой домен

Сервер различает пути, а не домены: чтобы сайт открывался, например, по
`learn.noahlab.ru`, нужна DNS-запись `A → 84.247.166.53` и сертификат, а для
России — ресурс в CDN зеркала. Тогда достаточно отдавать `/learn/` на корне
нового имени.

## Переснять экраны

Экраны снимаются с витрины приложения на подменных данных (монорепозиторий
NOAH, `src/dev/learn.html`, `src/dev/learning.html`):

```bash
node scripts/dev-server.mjs            # в монорепозитории NOAH, порт 5173
node --experimental-websocket tools/capture.mjs            # все сцены
node --experimental-websocket tools/capture.mjs flow       # одна
```

`tools/capture.mjs` запускает Edge без окна, водит его по протоколу отладки и
собирает кадры через ffmpeg: `.png` — экраны, `.mp4` — для сайта, `.webp` —
анимация для README. Сцены — в объекте `SCENES`.

Ролик-пример `site/media/lesson-video.mp4` — настоящий ролик по разделу курса,
пережатый в 720p (`crf 27`).
