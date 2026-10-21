# API учёбы

Сервер — `noahlab.ru` (код — `platform/server/` в
[монорепозитории NOAH](https://github.com/faafaafuu/asis)). Из России с
мобильного — через зеркало `m.noahlab.ru`: оно пропускает только `GET`, запись
идёт GET-туннелем (`/api/tunnel/*`), к каждому `GET` добавляется метка `_=…`,
чтобы зеркало не держало копию.

**Вход.** Браузер — по cookie сайта (вход через Telegram или Google).
Программа и телефон — заголовком `Authorization: Bearer <ключ площадки>`.
Отмеченное «мост» доступно только аккаунтам, к которым подключён мост к модели
(`NOAH_BRIDGE_USERS`).

Ответы — JSON; ошибка — `{ "error": "текст для человека" }` с кодом 4xx/5xx.

## Курсы и прогресс

| | |
|---|---|
| `GET /api/noa/courses` | Курсы аккаунта целиком (браузер). |
| `GET /api/noa/courses/version` | Отпечаток курсов: меняется, когда курс добавили, дописали или убрали. |
| `POST /api/noa/courses` | Сохранить курс (проверка формата — та же, что у MCP). |
| `DELETE /api/noa/courses/:id` | Удалить курс; другие устройства уберут его у себя. |
| `GET /api/noa/progress`, `PUT /api/noa/progress` | Прогресс в формате `learning.json`; при записи сливается с прогрессом других устройств. |
| `GET /api/app/courses` | Список курсов для устройства: `{ courses: [{ id, size, updated }], removed, part }`. |
| `GET /api/app/courses/:id/part?at=N` | Курс кусками по `part` знаков: канал из России рвёт длинные ответы. |
| `POST /api/app/courses/:id/part` | Курс с устройства в аккаунт, кусками `{ at, text, size }`. |
| `POST /api/app/progress` | Прогресс устройства: отправить свой и получить слитый. |

## Сборка курса — мост

| | |
|---|---|
| `POST /api/noa/builds` | `{ goal, quality: "sonnet" \| "haiku" }` — начать. Одна сборка за раз. |
| `GET /api/noa/builds` | Последние сборки: `status` (`running`, `done`, `failed`, `stopped`), `stage`, `done`/`total` тем, `message`. |
| `POST /api/noa/builds/:id/stop` | Остановить — готовые темы остаются. |
| `POST /api/noa/builds/:id/resume` | Продолжить упавшую или остановленную с последней готовой темы. |
| `POST /api/noa/builds/:id/remove` | Убрать из списка; собранные темы остаются в курсе. |

Сбои модели (перегрузка, лимит, обрыв) сборка пережидает тремя повторами с
паузой 5, 20 и 60 с; отказ входа моста не повторяет и называет словами.

## Ролики — мост

| | |
|---|---|
| `POST /api/noa/videos` | `{ course, topic, section, material, again }` — заказать ролик по разделу (`section` — номер) или по теме (`null`). Готовый отдаётся сразу, если не просили `again`. |
| `GET /api/noa/videos?course=&topic=` | Ролики темы — по одному на раздел, последний. |
| `GET /api/noa/videos/:id` | Ход: `stage` — `script`, `fix`, `queued`, `voice`, `render`, `mux`, `done`. |
| `GET /api/noa/videos/:id/video.mp4`, `…/poster.jpg` | Файл; поддерживает `Range`. |

## Путеводители — сборка через мост, чтение — всем

| | |
|---|---|
| `GET /api/noa/guides` | Карточки: `{ guides: [{ id, title, subtitle, emoji, cover, sections, written, status }], version }`. |
| `GET /api/noa/guides/:id` | Путеводитель целиком. |
| `GET /api/noa/guides/:id/pictures/:file` | Картинка из Википедии. |
| `POST /api/noa/guides` | `{ goal }` — начать; ответ `{ id }`, дальше пишется сам. |
| `POST /api/noa/guides/:id/resume` | `{ wish }` — дописать прерванный или добавить раздел по просьбе. |
| `POST /api/noa/guides/stop` | Остановить идущую сборку. |
| `POST /api/noa/guides/:id/remove` | Удалить вместе с картинками. |
| `POST /api/noa/guides/:id/part` | Путеводитель с устройства кусками `{ at, text, size }`; картинки сервер берёт заново. |

`status`: `building` — пишется, `ready` — готов, `stopped` — прервали (можно
дописать), `failed` — не сложился план.

## Голос

| | |
|---|---|
| `POST /api/noa/tts` | `{ text, voice, rate }` → MP3 голосом Ноа (Silero). 600 фраз в час. |
| `POST /api/noa/stt` | Аудио → текст (faster-whisper) — для браузеров без своего распознавания. |
