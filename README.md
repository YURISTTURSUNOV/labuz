# LabUz prototipi (Faza 0)

Nazariyani amalda kashf qildiradigan platforma yadrosi. v2: oqim jumboq (taxmin) → missiyalar → kashfiyot → kitobdagi rasmiy gap. 4 fan, 4 shablon, 3 rejim (Sarguzasht, Özing qil, Imtihon), XP va effektlar, öqituvçi paneli demosi.

## Ishga tushiriş

dist/index.html faylini brauzerda oçing. Server kerak emas.

Kod bilan ishlaş uçun:

    npm install
    node build.mjs      # dist/index.html ni qayta yig'adi

## Tuzilma

    src/content.js        kartalar (fan, mavzu, nazariy gap, qadamlar). AI shu faylni töldiradi.
    src/engine.js         qadamlar mashinasi, 3 rejim, deklarativ tekşiruv
    src/fx.js             XP, konfetti, ovoz
    src/ai.js             ishora: AI endpoint yoki deterministik zaxira
    src/templates/*.js    shablonlar: graph, circuit, cell3d, wordparts
    src/teacher.js        öqituvçi paneli (demo: BroadcastChannel)
    server/app.py         AI ishora serveri (FastAPI + Claude API), sinalmagan

## Yangi karta qöşiş

content.js dagi CARDS ga bitta obyekt qöşiladi. Shablon mavjud bölsa, kod yozmasdan çiqadi:

    { id, subject, grade, verified:false, source:null, emoji, topic, template, params, vars,
      hook:{ q, options:[...], correct, why },        // boşlanğiç jumboq: öquvçi avval taxmin qiladi
      claims:[kitobdagi rasmiy gap],                  // oxirida körsatiladi
      discovery:'oddiy tilda kashfiyot', explore:[...],
      steps:[ { emoji, text, hint, focus, check:[[var, amal, qiymat]] } yoki { emoji, text, hint, ask:{kind,label,correct} } ] }

check amallari: ==  !=  >  <  >=  <=. Hammasi bir vaqtda bajarilişi kerak.

## Yangi shablon qöşiş

src/templates/ ga fayl: mount(el, params, {onState, ctx}) funksiyasi {getState, setFocus, destroy} qaytaradi.
onState har özgarişda joriy holat obyektini beradi. main.js dagi TEMPLATES ga ulanadi.

## Hali yöq narsalar

- Haqiqiy server, hisoblar, jonli panel (WebSocket)
- Darslik bilan tekşirilgan kontent (hozirgi sinf va mavzular namuna)
- Ingliz tili, tarix, geografiya, kimyo shablonlari
- 1–4-sinf uçun alohida interfeys (ovozli, katta tugmalar)

## v3 yangiliklari
- Yangi shablon `timeline` (ingliz tili: Past / Present / Future Simple) va 5-karta `eng-vaqtlar`.
- Motivatsiya: har karada eng yaxshi yulduzlar, kunlik seriya (🔥), 40 soniyalik yumshoq eslatma, 2 xatodan keyin avtomatik maslahat.
- `prefers-reduced-motion` hurmat qilinadi (konfetti va animatsiyalar öçadi).
- Öqituvçi panelida "Qiyinlik xaritasi": sinf eng köp qiynalgan 5 missiya.
- v2 nusxasi: LabUz-v2.html (zaxira).

## Joylaş (GitHub Pages)
Tayyor sayt `docs/index.html` da. Repo Settings, Pages, Source: "Deploy from a branch", Branch: main, Folder: /docs.
Qayta qurish: `npm install && node build.mjs` (docs/ va dist/ yangilanadi).
AI server ulaş: `LABUZ_AI_ENDPOINT=https://server.uz/api/hint node build.mjs` (CSP avtomatik yangilanadi).
