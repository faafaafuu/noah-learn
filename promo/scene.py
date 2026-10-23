"""Ролик о проекте NOAH: как он устроен — неоновыми схемами и настоящими
экранами приложения. Собирается тем же конвейером, что ролики к урокам
(noah_kit, озвучка Silero, рендер кусками)."""
from noah_kit import *

OKC = OK


def blob(color, radius):
    """Мягкое цветное пятно фона: круги одного цвета, к центру гуще."""
    group = VGroup(*[
        Circle(radius=radius * (1 - i * 0.17), stroke_width=0, fill_color=color, fill_opacity=0.055)
        for i in range(5)
    ])
    group.backdrop = True
    group.set_z_index(-10)
    return group


def device(path, height, color=CY, radius=0.3):
    """Экран приложения в светящейся рамке."""
    pic = ImageMobject(path)
    pic.set_height(height)
    frame = RoundedRectangle(corner_radius=radius, width=pic.width + 0.18, height=pic.height + 0.18,
                             stroke_color=color, stroke_width=3, fill_color=BG, fill_opacity=1)
    return Group(glow(frame, color, 5, 20), frame, pic.move_to(frame))


def label(text, color=MG, size=22):
    return Text(text.upper(), font=MONO, font_size=size, color=color)


def big(number, note, color):
    value = Text(number, font=HEAD, weight=BOLD, font_size=80, color=color)
    line = Line(LEFT * 1.3, RIGHT * 1.3, color=color, stroke_width=4)
    words = fit(Text(note, font=MONO, font_size=22, color=MU), 3.8)
    group = VGroup(value, line, words).arrange(DOWN, buff=0.25)
    return VGroup(glow(line, color, 4, 14).move_to(line), group)


class Video(NoahScene):
    def sweep(self, *extra, rt=0.6):
        """Убрать сцену, кроме фона и субтитра; заодно сыграть `extra`."""
        gone = [m for m in self.mobjects if m is not self.caption and not getattr(m, "backdrop", False)]
        self.lit = None
        self.go(*[FadeOut(m) for m in gone], *extra, rt=rt)

    def construct(self):
        # Фон: три пятна — бирюза, пурпур, золото; между сценами плывут.
        cyan, magenta, gold = blob(CY, 3.4), blob(MG, 3.0), blob(GOLD, 2.4)
        cyan.move_to(LEFT * 5 + UP * 2)
        magenta.move_to(RIGHT * 5 + DOWN * 1.5)
        gold.move_to(RIGHT * 1 + UP * 3.6)
        self.go(FadeIn(cyan), FadeIn(magenta), FadeIn(gold), rt=1.2)

        # 0 — заставка
        title = self.intro("голос · учёба · ии", "NOAH", "помощник на компьютере и курс под твою цель")
        self.go(*self.say("Голосовой помощник и учёба с ИИ"), rt=0.8)
        self.hold(0)

        # 1 — голос: микрофон → распознавание → имя
        self.sweep(cyan.animate.move_to(LEFT * 2 + DOWN * 2.5), magenta.animate.move_to(RIGHT * 4 + UP * 2.5))
        mic = card("Микрофон", "слушает фразу", "mic", CY, "вход").move_to(LEFT * 4.7 + UP * 0.6)
        stt = card("Распознавание", "на компьютере", "cpu", MG, "whisper").move_to(UP * 0.6)
        name = card("Имя", "«Ноа, …»", "noa", GOLD, "зов").move_to(RIGHT * 4.7 + UP * 0.6)
        w1 = wire(mic[1].get_right(), stt[1].get_left(), color=CY, step=1)
        w2 = wire(stt[1].get_right(), name[1].get_left(), color=MG, step=2)
        self.go(FadeIn(mic, shift=UP * 0.3), rt=0.5)
        self.go(FadeIn(w1), FadeIn(stt, shift=UP * 0.3), rt=0.7)
        self.go(FadeIn(w2), FadeIn(name, shift=UP * 0.3), rt=0.7)
        self.go(*self.say("Речь → текст прямо на компьютере"), rt=0.6)
        self.send(w1, ["звук"], CY)
        self.send(w2, ["«Ноа, открой обучение»"], GOLD)
        self.hold(1)

        # 2 — быстрые команды или модель
        self.sweep(gold.animate.move_to(LEFT * 5 + DOWN * 3), cyan.animate.move_to(LEFT * 4 + UP * 3))
        said = card("Фраза", "что сказали", "chat", CY, "текст").move_to(UP * 2.0)
        quick = card("Быстрые команды", "мгновенно, без сети", "check", OKC, "правила", w=3.6).move_to(LEFT * 3.8 + DOWN * 1.2)
        model = card("Модель", "разбор намерения", "sparkline", MG, "llm", w=3.6).move_to(RIGHT * 3.8 + DOWN * 1.2)
        wq = wire(said[1].get_bottom() + LEFT * 0.6, quick[1].get_top(), color=OKC)
        wm = wire(said[1].get_bottom() + RIGHT * 0.6, model[1].get_top(), color=MG)
        self.go(FadeIn(said, shift=DOWN * 0.3), rt=0.5)
        self.go(FadeIn(wq), FadeIn(quick), FadeIn(wm), FadeIn(model), rt=0.9)
        self.go(*self.say("Частое — правилами, остальное — модели"), rt=0.6)
        self.send(wq, ["открой · громче · найди"], OKC)
        self.send(wm, ['{"action": "open"}'], MG)
        self.hold(2)

        # 3 — мозги на выбор
        self.sweep(magenta.animate.move_to(ORIGIN + DOWN * 0.5).scale(1.15))
        hub = card("Ноа", "выбирает модель", "noa", CY, "мозг", w=3.2).move_to(DOWN * 1.1)
        own = card("Ollama", "своя модель", "cpu", OKC, "локально").move_to(LEFT * 4.8 + UP * 1.9)
        cloud = card("OpenRouter", "облако по ключу", "cloud", GOLD, "ключ").move_to(UP * 2.3)
        claude = card("Claude", "через мост", "link", MG, "подписка").move_to(RIGHT * 4.8 + UP * 1.9)
        links = [
            wire(own[1].get_bottom(), hub[1].get_left() + UP * 0.3, color=OKC),
            wire(cloud[1].get_bottom(), hub[1].get_top(), color=GOLD),
            wire(claude[1].get_bottom(), hub[1].get_right() + UP * 0.3, color=MG),
        ]
        self.go(FadeIn(hub, scale=0.9), rt=0.5)
        self.go(*[FadeIn(c, shift=DOWN * 0.3) for c in (own, cloud, claude)], *[FadeIn(w) for w in links], rt=0.9)
        self.go(*self.say("Не ответила одна — включается запасная"), rt=0.6)
        self.go(Indicate(claude, color=MG), rt=0.8)
        self.go(Indicate(own, color=OKC), rt=0.8)
        self.hold(3)

        # 4 — текст для голоса
        self.sweep(magenta.animate.move_to(RIGHT * 5 + DOWN * 2).scale(1 / 1.15), gold.animate.move_to(LEFT * 1 + UP * 3))
        raw = packet("порт 443 · kubectl", GOLD).scale(1.3).move_to(LEFT * 4.2 + UP * 0.8)
        spoken = packet("порт четыреста сорок три · кубкатл", OKC).scale(1.1).move_to(RIGHT * 2.2 + UP * 0.8)
        arrow = wire(raw.get_right(), spoken.get_left(), color=CY)
        voice = card("Голос", "Ксения, Silero", "speaker", CY, "речь").move_to(RIGHT * 2.2 + DOWN * 1.7)
        self.go(FadeIn(raw, scale=0.8), rt=0.5)
        self.go(FadeIn(arrow), rt=0.5)
        self.go(FadeIn(spoken, scale=0.8), rt=0.6)
        self.go(FadeIn(voice, shift=UP * 0.3), rt=0.5)
        self.go(*self.say("Числа и термины — словами"), rt=0.6)
        self.go(Indicate(voice[4], color=CY, scale_factor=1.15), rt=0.9)
        self.hold(4)

        # 5 — сборка курса
        self.sweep(cyan.animate.move_to(RIGHT * 3 + UP * 2.8), gold.animate.move_to(LEFT * 5 + DOWN * 2.6))
        steps = [("Цель", "словами", "target", CY), ("План", "темы", "tasks", MG), ("Урок", "разделами", "learn", GOLD),
                 ("Понятия", "карточки", "cards", OKC), ("Экзамен", "задачи", "check", CY)]
        cards = [card(t, s, i, c, f"шаг {n + 1}", w=2.35, h=1.6).move_to(RIGHT * (n - 2) * 2.75 + UP * 0.9) for n, (t, s, i, c) in enumerate(steps)]
        joins = [wire(cards[n][1].get_right(), cards[n + 1][1].get_left(), color=MU) for n in range(4)]
        for n, item in enumerate(cards):
            self.go(FadeIn(item, shift=RIGHT * 0.3), *([FadeIn(joins[n - 1])] if n else []), rt=0.45)
        loop = CurvedArrow(cards[4][1].get_bottom() + DOWN * 0.1, cards[2][1].get_bottom() + DOWN * 0.1, angle=-PI / 2.2, color=MG, stroke_width=5)
        note = Text("проверка → модель исправляет", font=MONO, font_size=22, color=MG).next_to(loop, DOWN, buff=0.15)
        self.go(Create(loop), FadeIn(glow(loop, MG, 3, 12)), FadeIn(note), rt=0.9)
        self.go(*self.say("Курс по цели — тема за темой"), rt=0.6)
        self.hold(5)

        # 6 — компьютер
        self.sweep(cyan.animate.move_to(LEFT * 4 + UP * 1.5).scale(1.2), magenta.animate.move_to(RIGHT * 4.5 + DOWN * 1))
        desk = device("shots/desktop-home.png", 5.2, CY).move_to(UP * 0.35)
        tag = label("компьютер", CY).next_to(desk, UP, buff=0.18)
        self.go(FadeIn(desk, scale=0.85), FadeIn(tag), rt=1.0)
        self.go(*self.say("Окно учёбы на компьютере"), rt=0.6)
        self.go(desk.animate.scale(1.04), rt=1.4)
        self.hold(6)

        # 7 — телефон
        self.sweep(cyan.animate.move_to(LEFT * 5 + DOWN * 2).scale(1 / 1.2), gold.animate.move_to(RIGHT * 2 + UP * 3.2))
        shots = ["phone-home", "phone-course", "phone-lesson", "phone-review"]
        colors = [CY, MG, GOLD, OKC]
        phones = [device(f"shots/{s}.png", 5.3, c, 0.35).move_to(RIGHT * (n - 1.5) * 3.05 + UP * 0.25) for n, (s, c) in enumerate(zip(shots, colors))]
        for n, phone in enumerate(phones):
            phone.rotate((n - 1.5) * 0.035)
            self.go(FadeIn(phone, shift=UP * 0.5), rt=0.45)
        self.go(*self.say("Телефон: курс, урок, повторение"), rt=0.6)
        self.hold(7)

        # 8 — ролики: кадр урока и рендер в четыре потока
        self.sweep(magenta.animate.move_to(LEFT * 3 + UP * 2.5), gold.animate.move_to(RIGHT * 5 + DOWN * 2.8))
        shot = device("shots/lesson-video.jpg", 3.3, MG, 0.18).move_to(LEFT * 3.4 + UP * 0.5)
        box = zone("сервер · docker", 5.4, 3.7, CY).move_to(RIGHT * 3.7 + UP * 0.5)
        bars = []
        for n in range(4):
            rail = RoundedRectangle(corner_radius=0.06, width=4.2, height=0.34, stroke_color=CY, stroke_width=1.2, fill_opacity=0)
            rail.move_to(box[0].get_center() + DOWN * (n - 1.2) * 0.62 + DOWN * 0.15)
            fill = RoundedRectangle(corner_radius=0.06, width=4.2, height=0.34, stroke_width=0, fill_color=[CY, MG, GOLD, OKC][n], fill_opacity=0.75)
            fill.move_to(rail)
            fill.stretch(0.02, 0, about_edge=LEFT)
            name_ = Text(f"поток {n + 1}", font=MONO, font_size=16, color=TX).move_to(rail)
            bars.append((rail, fill, name_))
        self.go(FadeIn(shot, scale=0.9), FadeIn(box), rt=0.8)
        self.go(*[FadeIn(r) for r, _, _ in bars], *[FadeIn(f) for _, f, _ in bars], *[FadeIn(t) for _, _, t in bars], rt=0.5)
        self.go(*self.say("Ролик рендерится в четыре потока"), rt=0.6)
        self.go(*[f.animate.stretch(50, 0, about_edge=LEFT) for _, f, _ in bars], rt=2.4)
        self.hold(8)

        # 9 — аудиодрама
        self.sweep(cyan.animate.move_to(UP * 2.8), magenta.animate.move_to(LEFT * 5 + DOWN * 2.4))
        cast = [("Костя", "джун · паникует", "alert", MG, "«Всё упало!»"), ("Лена", "объясняет", "chat", CY, "«Смотрим логи.»"),
                ("Палыч", "ворчит", "flame", GOLD, "«Не трогай прод.»")]
        people = []
        for n, (who, about, ic, color, line) in enumerate(cast):
            person = card(who, about, ic, color, f"голос {n + 1}").move_to(RIGHT * (n - 1) * 4.5 + DOWN * 0.9)
            bubble = packet(line, color).scale(1.15).next_to(person, UP, buff=0.35)
            people.append((person, bubble))
        self.go(*[FadeIn(p, shift=UP * 0.3) for p, _ in people], rt=0.8)
        self.go(*self.say("Урок — история на три голоса"), rt=0.6)
        for person, bubble in people:
            self.go(FadeIn(bubble, scale=0.7), Indicate(person[1], color=bubble[1].get_color()), rt=0.7)
        self.hold(9)

        # 10 — сервер и Россия
        self.sweep(cyan.animate.move_to(LEFT * 5 + UP * 1), gold.animate.move_to(RIGHT * 4 + UP * 3))
        clients = [card(t, s, i, c, "клиент", w=2.7, h=1.3).move_to(LEFT * 5.4 + UP * y)
                   for (t, s, i, c), y in zip([("Компьютер", "программа", "window", CY), ("Телефон", "iPhone", "noa", MG), ("Браузер", "сайт", "globe", GOLD)], [1.9, 0.3, -1.3])]
        cdn = card("Кэш в Москве", "CDN-зеркало", "cloud", GOLD, "сеть", w=2.9).move_to(LEFT * 1.4 + UP * 0.3)
        server = zone("сервер", 4.6, 4.4, MG).move_to(RIGHT * 4.3 + UP * 0.3)
        services = VGroup(*[packet(t, c) for t, c in [("сайт · аккаунты", CY), ("мост к модели", MG), ("рендер роликов", GOLD), ("голос", OKC)]])
        services.arrange(DOWN, buff=0.25).move_to(server[0].get_center() + DOWN * 0.15)
        ins = [wire(c[1].get_right(), cdn[1].get_left(), color=MU) for c in clients]
        out = wire(cdn[1].get_right(), server[0].get_left(), color=GOLD)
        self.go(*[FadeIn(c, shift=RIGHT * 0.3) for c in clients], rt=0.6)
        self.go(*[FadeIn(w) for w in ins], FadeIn(cdn), rt=0.6)
        self.go(FadeIn(out), FadeIn(server), *[FadeIn(s, shift=LEFT * 0.2) for s in services], rt=0.8)
        self.go(*self.say("Длинные ответы — через кэш в Москве"), rt=0.6)
        self.send(out, ["курс · 300 КБ"], GOLD)
        self.hold(10)

        # 11 — цифры
        self.sweep(magenta.animate.move_to(RIGHT * 4 + DOWN * 2), cyan.animate.move_to(LEFT * 4 + UP * 2.5))
        numbers = VGroup(big("1583", "фразы в тестах команд", CY), big("600", "токенов вместо 16 000", MG), big("2 мин", "сборка ролика", GOLD))
        numbers.arrange(RIGHT, buff=0.9).move_to(UP * 0.5)
        for item in numbers:
            self.go(FadeIn(item, shift=UP * 0.4), rt=0.6)
        self.go(*self.say("Проверено на реальных журналах"), rt=0.6)
        self.hold(11)

        # 12 — финал
        self.sweep(cyan.animate.move_to(LEFT * 3 + UP * 1).scale(1.3), magenta.animate.move_to(RIGHT * 3 + DOWN * 0.5).scale(1.3),
                   gold.animate.move_to(UP * 2.8))
        self.intro("noahlab.ru/learn", "NOAH", "голос · схема · история")
        self.go(*self.say("Учиться через голос, схему и историю"), rt=0.6)
        self.hold(12)
