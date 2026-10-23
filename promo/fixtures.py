"""Вымышленные курсы для рекламного ролика: витрина приложения на них,
без настоящих данных владельца. python -X utf8 fixtures.py out.json"""
import json
import sys


def card(tid, title, status="new", read=False, section=0, step="", exam=None, total=8, mature=0, summary=""):
    return {"id": tid, "title": title, "status": status, "read": read, "section": section, "step": step,
            "examBest": exam, "mistakes": 0, "conceptsTotal": total, "conceptsMature": mature,
            "tasksDone": 0, "tasksTotal": 3, "summary": summary}


def course(cid, title, description, percent, current, topics, streak=0, due=0, total=40):
    return {"id": cid, "title": title, "description": description, "percent": percent, "current": current,
            "topicPass": 70, "finalPass": 75, "finalUnlocked": False, "finalBest": None,
            "mastery": {"total": total, "new": total // 2, "learning": total // 4, "young": total // 8, "mature": total // 8, "due": due, "newLeft": 10},
            "focus": {"today": 25, "week": 140, "streak": streak, "sessionsToday": 1},
            "topics": topics}


overview = [
    course("garden", "Огород на балконе", "Свет, грунт, полив и урожай: томаты, зелень и клубника на подоконнике и балконе.", 38, "tomatoes", [
        card("light", "Свет и место", "done", True, exam=92, mature=6),
        card("soil", "Грунт и горшки", "done", True, exam=88, mature=5),
        card("tomatoes", "Томаты черри", "reading", False, 1, "lesson", summary="Сорта для балкона, посадка, пасынкование и первые плоды."),
        card("water", "Полив без ошибок"),
        card("pests", "Вредители без химии"),
        card("harvest", "Урожай и свои семена"),
    ], streak=12, due=9, total=46),
    course("travel", "Английский для путешествий", "Аэропорт, отель, кафе и дорога: фразы, которые выручают в поездке.", 24, "airport", [
        card("airport", "В аэропорту", "reading", False, 0, "lesson"),
        card("hotel", "Заселение в отель"),
        card("cafe", "В кафе и ресторане"),
        card("directions", "Как спросить дорогу"),
        card("smalltalk", "Small talk без паники"),
    ], due=6),
    course("pharma", "Антибиотики: повторение к аттестации", "Классы, спектр действия, резистентность и взаимодействия — коротко и по делу.", 61, "resistance", [
        card("classes", "Классы антибиотиков", "done", True, exam=90, mature=7),
        card("spectrum", "Спектр действия", "done", True, exam=84, mature=6),
        card("resistance", "Резистентность", "reading", False, 2, "lesson"),
        card("dosing", "Дозирование и курсы"),
        card("interactions", "Взаимодействия"),
    ], due=12),
    course("stars", "Почему светят звёзды", "Для любопытных от 8 лет: Солнце, жизнь звезды и созвездия над головой.", 50, "life", [
        card("sun", "Солнце — тоже звезда", "done", True, exam=100, mature=4),
        card("life", "Как живёт звезда", "reading", False, 1, "lesson"),
        card("constellations", "Созвездия"),
    ]),
    course("python", "Python с нуля", "Переменные, циклы, функции и файлы — до первой полезной программы.", 30, "loops", [
        card("vars", "Переменные и типы", "done", True, exam=86, mature=5),
        card("loops", "Циклы", "reading", False, 0, "lesson"),
        card("functions", "Функции"),
        card("files", "Работа с файлами"),
    ]),
    course("calculus", "Матанализ к сессии", "Пределы, производные и интегралы — с разбором типовых задач.", 12, "limits", [
        card("limits", "Пределы", "reading", False, 0, "lesson"),
        card("derivatives", "Производные"),
        card("integrals", "Интегралы"),
    ]),
]

TOMATO_LESSON = """# Томаты черри на балконе

Черри — самые благодарные томаты для балкона: компактный куст, ранний урожай и сладкие плоды гроздьями.

## Где им хорошо

- **6–8 часов солнца** в день — лучше южная или восточная сторона.
- Тепло: днём +22…+26 °C, ночью не ниже +15 °C.
- Ветер и сквозняк сушат листья — защитите куст от порывов.

## Посадка

- Горшок от **10 литров** на куст: корням нужно место.
- Грунт рыхлый, с перлитом; на дно — дренаж.
- Рассаду заглубляют до первых листьев — стебель даст новые корни.

## Пасынкование и подвязка

- **Пасынки** — побеги в пазухах листьев. Их удаляют, пока они короче 5 см.
- Высокие сорта ведут в 1–2 стебля и подвязывают к опоре.
- Нижние листья под первой кистью убирают — меньше болезней.

## Полив и подкормка

- Поливают под корень, утром, тёплой водой.
- Лучше реже и обильно, чем часто и понемногу.
- С началом цветения — подкормка калием раз в 10–14 дней.
"""

STARS_LESSON = """# Как живёт звезда

У звёзд, как у людей, есть детство, взрослая жизнь и старость. Только длится она миллиарды лет.

## Рождение

- Звезда рождается в огромном облаке газа и пыли — **туманности**.
- Гравитация стягивает газ в шар, он сжимается и нагревается.
- Когда в центре становится миллионы градусов, загорается «ядерная печка».

## Взрослая жизнь

- Внутри звезды водород превращается в гелий — так рождаются свет и тепло.
- Наше Солнце — взрослая звезда. Ему около 4,6 миллиарда лет.

## Старость

- Звёзды вроде Солнца раздуваются в **красного гиганта**, а потом остывают.
- Самые большие звёзды взрываются — это **сверхновая**.
"""

AIRPORT_LESSON = """# В аэропорту

Пять фраз закрывают почти всё: регистрация, багаж, досмотр, выход на посадку.

## Регистрация

- *I'd like to check in, please.* — Я хочу зарегистрироваться.
- *Window or aisle?* — У окна или у прохода?

## Багаж

- *How many bags are you checking?* — Сколько мест багажа сдаёте?
- *Carry-on* — ручная кладь.

## Посадка

- *Where is gate 12?* — Где выход 12?
- *Boarding starts at 9:40.* — Посадка начинается в 9:40.
"""


def concept(cid, term, definition, mnemonic="", pitfall=""):
    return {"id": cid, "term": term, "definition": definition, "mnemonic": mnemonic, "pitfall": pitfall,
            "analogy": "", "example": "", "related": []}


def question(qid, concept_id, q, options):
    return {"answer": None, "concept": concept_id, "explain": "", "id": qid, "kind": "choice",
            "options": options, "points": [], "q": q, "reference": ""}


def view(cid, tid, title, summary, lesson, concepts, cheatsheet):
    return {"topic": {"id": tid, "title": title, "summary": summary, "lesson": lesson, "concepts": concepts,
                      "aliases": [], "cards": [], "exam": [], "tasks": [], "cheatsheet": cheatsheet},
            "scores": {}, "mistakes": [], "cheatsheet": cheatsheet}


tomato_concepts = [
    concept("pasynok", "Пасынок", "Побег в пазухе листа. Отнимает силы у плодов — его удаляют, пока он короче 5 см.", "Пасынок — лишний рот за столом"),
    concept("sun-hours", "Часы солнца", "Томатам нужно 6–8 часов прямого солнца в день, иначе цветы осыпаются.", "Меньше шести — меньше плодов"),
    concept("pot-volume", "Объём горшка", "От 10 литров на куст: в тесном горшке корни перегреваются и пересыхают."),
    concept("potassium", "Подкормка калием", "С цветения калий раз в 10–14 дней — плоды слаще и крупнее.", "Калий — для вкуса"),
]
star_concepts = [
    concept("nebula", "Туманность", "Облако газа и пыли, в котором рождаются звёзды.", "Колыбель звёзд"),
    concept("fusion", "Термоядерная реакция", "Водород превращается в гелий, и выделяются свет и тепло.", "Ядерная печка"),
    concept("supernova", "Сверхновая", "Взрыв огромной звезды в конце жизни — ярче целой галактики."),
]
airport_concepts = [
    concept("check-in", "Check in", "Зарегистрироваться на рейс.", "Отметиться у стойки"),
    concept("carry-on", "Carry-on", "Ручная кладь — сумка, которую берёте в салон."),
    concept("gate", "Gate", "Выход на посадку — номер пишут на табло и в посадочном."),
]

topics = {
    "garden/tomatoes": view("garden", "tomatoes", "Томаты черри", "Сорта для балкона, посадка, пасынкование и первые плоды.", TOMATO_LESSON, tomato_concepts,
                            "## Томаты черри — на одном листе\n\n- **6–8 часов солнца**, ночью не ниже +15 °C\n- Горшок **от 10 л**, рыхлый грунт и дренаж\n- Пасынки — убрать, пока короче 5 см\n- Полив утром под корень, калий с цветения"),
    "stars/life": view("stars", "life", "Как живёт звезда", "Рождение в туманности, взрослая жизнь и старость звезды.", STARS_LESSON, star_concepts,
                       "## Жизнь звезды\n\n- Рождается в **туманности**\n- Светит, превращая водород в гелий\n- Стареет: красный гигант или **сверхновая**"),
    "travel/airport": view("travel", "airport", "В аэропорту", "Регистрация, багаж, досмотр и посадка.", AIRPORT_LESSON, airport_concepts,
                           "## Аэропорт\n\n- *Check in* — регистрация\n- *Carry-on* — ручная кладь\n- *Gate* — выход на посадку"),
}

exams = {
    "garden/tomatoes": {"pass": 70, "scope": "tomatoes", "title": "Мини-экзамен: Томаты черри", "questions": [
        question("tom-e1", "sun-hours", "Сколько часов прямого солнца нужно томатам на балконе?", ["2–3 часа", "6–8 часов", "Круглые сутки", "Солнце не важно"]),
        question("tom-e2", "pasynok", "Что делают с пасынками томата?", ["Удаляют, пока они короче 5 см", "Оставляют — больше листьев, больше плодов", "Подвязывают отдельно", "Поливают отдельно"]),
        question("tom-e3", "pot-volume", "Какой горшок нужен одному кусту черри?", ["0,5 литра", "От 10 литров", "Подойдёт любой стакан", "Только стеклянный"]),
        question("tom-e4", "potassium", "Что дают томатам с начала цветения?", ["Соль", "Калийную подкормку", "Холодную воду", "Ничего"]),
    ]},
    "pharma/resistance": {"pass": 70, "scope": "resistance", "title": "Мини-экзамен: Резистентность", "questions": [
        question("ph-e1", "beta-lactamase", "Как бактерии чаще всего защищаются от пенициллинов?", ["Вырабатывают бета-лактамазы", "Меняют цвет", "Ускоряют деление", "Уходят в спячку"]),
    ]},
    "stars/life": {"pass": 70, "scope": "life", "title": "Мини-экзамен: Как живёт звезда", "questions": [
        question("st-e1", "nebula", "Где рождаются звёзды?", ["В туманностях из газа и пыли", "В чёрных дырах", "На Луне", "В атмосфере Земли"]),
    ]},
}
answers = {
    "tom-e1": {"answer": 1, "explain": "Меньше шести часов солнца — цветы осыпаются, а плодов почти нет.", "reference": ""},
    "tom-e2": {"answer": 0, "explain": "Пасынок отнимает силы у плодов; маленький удаляется без вреда для куста.", "reference": ""},
    "tom-e3": {"answer": 1, "explain": "В тесном горшке корни перегреваются и пересыхают.", "reference": ""},
    "tom-e4": {"answer": 1, "explain": "Калий отвечает за вкус и размер плодов.", "reference": ""},
    "ph-e1": {"answer": 0, "explain": "Бета-лактамазы разрушают бета-лактамное кольцо — поэтому есть защищённые пенициллины.", "reference": ""},
    "st-e1": {"answer": 0, "explain": "Гравитация стягивает газ туманности в горячий шар — так загорается звезда.", "reference": ""},
}


def review(key, topic, topic_title, front, back, mnemonic="", level="learning", fresh=False):
    return {"key": key, "topic": topic, "topicTitle": topic_title, "concept": key, "front": front, "back": back,
            "mnemonic": mnemonic, "analogy": "", "example": "", "pitfall": "", "level": level, "fresh": fresh}


garden_cards = [
    review("g1", "tomatoes", "Томаты черри", "Зачем удалять пасынки томата?", "Пасынок отнимает силы у плодов. Убирают, пока он короче 5 см.", "Пасынок — лишний рот за столом"),
    review("g2", "light", "Свет и место", "Какая сторона балкона лучше для томатов?", "Южная или восточная: 6–8 часов прямого солнца.", "Солнце — главная еда"),
    review("g3", "soil", "Грунт и горшки", "Зачем в грунт добавляют перлит?", "Чтобы грунт оставался рыхлым и дышал, а вода не застаивалась."),
    review("g4", "tomatoes", "Томаты черри", "Когда начинать подкормку калием?", "С началом цветения, раз в 10–14 дней.", "Калий — для вкуса"),
]
reviews = {
    "garden": garden_cards, "garden/tomatoes": garden_cards[:2] + garden_cards[3:],
    "travel": [review("t1", "airport", "В аэропорту", "Как сказать «у прохода»?", "Aisle seat.", "Aisle — «айл», проход")],
    "pharma": [review("p1", "resistance", "Резистентность", "Что разрушают бета-лактамазы?", "Бета-лактамное кольцо пенициллинов и цефалоспоринов.")],
    "stars": [review("s1", "life", "Как живёт звезда", "Что такое сверхновая?", "Взрыв огромной звезды в конце жизни.", "Звезда уходит с фейерверком")],
}

json.dump({"overview": overview, "topics": topics, "exams": exams, "reviews": reviews, "maps": {}, "answers": answers},
          open(sys.argv[1], "w", encoding="utf-8"), ensure_ascii=False)
print("ok")
