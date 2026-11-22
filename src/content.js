// Kontent modeli v2: fan -> karta -> hook (taxmin) -> missiyalar -> kashfiyot -> kitobdagi rasmiy gap.
// Nazariy gap ENDI OXIRIDA: öquvçi avval taxmin qiladi va özi sinab körib, keyin qoidani kashf qiladi.
// Diqqat: sinf va mavzu namuna. verified:false = darslik bilan hali tekşirilmagan.

export const SUBJECTS = {
  matematika: { name: 'Matematika', color: '#2F6FED', icon: '∑' },
  fizika: { name: 'Fizika', color: '#E4572E', icon: '⚡' },
  biologiya: { name: 'Biologiya', color: '#1F9D55', icon: '🧬' },
  onatili: { name: 'Ona tili', color: '#8E5BD6', icon: 'Aa' },
  ingliz: { name: 'Ingliz tili', color: '#0E9AA7', icon: 'En' },
};

export const SOON = ['Tarix', 'Geografiya', 'Informatika', 'Kimyo', 'Tabiiy fan (1–4-sinf)'];

export const CARDS = [
  {
    id: 'fiz-om-qonuni', subject: 'fizika', grade: 8, verified: false, source: null, emoji: '💡',
    topic: 'Om qonuni',
    template: 'circuit', params: { maxI: 3 }, vars: { U: 'U', R: 'R', I: 'I' },
    hook: {
      q: 'Chiroq xira yonyapti. Batareyani kuçliroqiga almaştirsang, chiroq nima böladi?',
      options: ['Yorqinroq yonadi', 'Xiraroq bölib qoladi', 'Özgarmaydi'], correct: 0,
      why: 'Kuçlaniş oşsa, tok kuçi ham oşadi va chiroq yorqinroq yonadi.',
    },
    claims: ['Zanjir bölagi uçun tok kuçi kuçlaniş (U) ga töğri proporsional, qarşilik (R) ga teskari proporsional: I = U / R.'],
    discovery: 'Tok kuçi = kuçlaniş ÷ qarşilik. Batareya kuçli bölsa tok oşadi, qarşilik katta bölsa tok kamayadi. Buni Om qonuni deb ataydilar.',
    explore: ['U ni oşirib, chiroq va elektronlar tezligini kuzating.', 'R ni kamaytiring: tok qanday özgaradi?'],
    steps: [
      { emoji: '💡', text: 'Chiroqni töliq yoqing, lekin kuydirmang! Ampermetr 2,5 dan 3 A gaçha körsatsin.', hint: 'U ni oşiring, R ni kamaytiring. Chiroq 100% ga yaqin bölsin, himoya ishlamasin.', focus: 'U', check: [['I', '>=', 2.5], ['I', '<=', 3]] },
      { emoji: '💥', text: 'Endi qasddan kuydirib köring! Tok kuçini 3 A dan oşiring.', hint: 'Kuçlanişni oşiring, qarşilikni kamaytiring.', focus: 'R', check: [['I', '>', 3]] },
      { emoji: '🔧', text: 'Qaytadan sozlang: U = 6 V, R = 3 Ω.', hint: 'Slayderlarni 6 va 3 ga qöying.', focus: 'U', check: [['U', '==', 6], ['R', '==', 3]] },
      { emoji: '🧮', text: 'Ampermetr necha amper körsatyapti?', hint: '6 ni 3 ga böling.', ask: { kind: 'number', label: 'I =', unit: 'A', correct: 2 } },
      { emoji: '🎚️', text: 'Qarşilikni 2 baravar oşiring: R = 6 Ω, U özgarmasin.', hint: 'R slayderini 6 ga qöying.', focus: 'R', check: [['U', '==', 6], ['R', '==', 6]] },
      { emoji: '🔍', text: 'Tok kuçi qanday özgardi?', hint: '6 ni 6 ga böling, oldingi natija bilan solişturing.', ask: { kind: 'choice', options: ['2 baravar kamaydi', '2 baravar oşdi', 'Özgarmadi'], correct: 0 } },
    ],
  },
  {
    id: 'mat-chiziqli-funksiya', subject: 'matematika', grade: 7, verified: false, source: null, emoji: '🚕',
    topic: 'Çiziqli funksiya',
    template: 'graph',
    params: {
      view: { x: [-1, 7], y: [-2, 18] }, tick: { x: 1, y: 2 },
      ranges: { k: [0, 5, 0.5], b: [0, 10, 1], x: [0, 6, 1] }, init: { k: 1, b: 0, x: 3 },
      labels: { k: 'Har km narxi (ming söm)', b: 'Çaqiruv puli (ming söm)', x: 'Masofa (km)' },
      xlabel: 'km', ylabel: 'ming söm', marker: '🚕', pointFmt: '{x} km yürsa, narx {y} ming söm',
    },
    vars: { k: 'k', b: 'b', x: 'x' },
    hook: {
      q: 'Taksi: çaqiruv puli 3 ming söm, har kilometri 2 ming söm. 5 km yürsang, qancha tölaysan?',
      options: ['10 ming söm', '13 ming söm', '15 ming söm'], correct: 1,
      why: '3 + 2·5 = 13. Aynan şu hisob çiziqli funksiya: y = kx + b.',
    },
    claims: ['y = kx + b funksiyaning grafigi töğri çiziqdir. k – çiziqning oğiş koeffitsienti, b esa çiziqning Oy öqini kesib ötiş nuqtasi.'],
    discovery: 'y = kx + b da k – har bir kilometr (qadam) uçun qancha qöşilişi, b – boşlanğiç qiymat. Grafikda k çiziqning tikligi, b esa çiziq Oy öqini kesadigan nuqta.',
    explore: ['k ni 0 ga yaqinlaştiring: çiziq qanday bölib qoladi?', 'b ni özgartirsangiz çiziq qayerga siljiydi?', 'Taksi (🚕) ni x slayderi bilan yürgizing.'],
    steps: [
      { emoji: '🚕', text: 'Taksi tarifini sozlang: çaqiruv puli 3, har km 2 ming söm.', hint: 'b – çaqiruv puli (boşlanğiç tölov), k – har kilometr narxi.', focus: 'b', check: [['k', '==', 2], ['b', '==', 3]] },
      { emoji: '🧮', text: 'Taksi 5 km yürdi. Necha ming söm töladi?', hint: 'x slayderini 5 ga qöying va 🚕 turgan nuqtaga qarang.', focus: 'x', ask: { kind: 'number', label: 'Narx =', unit: 'ming söm', correct: 13 } },
      { emoji: '🧑‍🤝‍🧑', text: 'Döstingning taksisida çaqiruv puli yöq, lekin har km 3 ming söm. Sozlang.', hint: 'b = 0, k = 3.', focus: 'k', check: [['k', '==', 3], ['b', '==', 0]] },
      { emoji: '🔍', text: '10 km yürsang, qaysi taksi arzon: çaqiruv pulsiz (3x) yoki pullisi (2x + 3)?', hint: 'Ikkalasini 10 km uçun hisoblab köring: 3·10 va 2·10 + 3.', ask: { kind: 'choice', options: ['Çaqiruv pulsiz (3x)', 'Çaqiruv pullisi (2x + 3)', 'Bir xil'], correct: 1 } },
    ],
  },
  {
    id: 'bio-hujayra', subject: 'biologiya', grade: 7, verified: false, source: null, emoji: '🧬',
    topic: 'Hayvon hujayrasining tuzilişi',
    template: 'cell3d', params: {}, vars: {},
    hook: {
      q: 'Hujayra – tiriklikning eng kiçik “şahari”. Yugurganda mushaklaring energiyani hujayraning qaysi qismida oladi?',
      options: ['Yadro', 'Mitoxondriya', 'Ribosoma'], correct: 1,
      why: 'Mitoxondriya hujayraning “elektr stansiyasi”: energiya (ATF) şu yerda hosil böladi.',
    },
    claims: ['Hayvon hujayrasi membrana, yadro, mitoxondriya, ribosoma va Goldji apparati kabi organoidlardan taşkil topgan. Har bir organoidning öz vazifasi bor.'],
    discovery: 'Hujayra şaharga öxşaydi: yadro – boşqaruv markazi, mitoxondriya – elektr stansiya, ribosoma – oqsil fabrikasi, Goldji apparati – pochta bölimi, membrana esa şahar çegarasi.',
    explore: ['Hujayrani aylantirib, har bir organoidni bosing.', 'Qaysi organoidlar köp? Qaysilari bitta?'],
    steps: [
      { emoji: '🏢', text: 'Hujayraning boşqaruv markazini toping! Irsiy ma’lumot (DNK) şu yerda saqlanadi.', hint: 'Hujayra markazidagi eng katta sharsimon qism.', check: [['selected', '==', 'yadro']] },
      { emoji: '🧠', text: 'Yadro bu “şahar”da qanday vazifani bajaradi?', hint: 'DNK qayerda saqlanadi?', ask: { kind: 'choice', options: ['Elektr stansiyasi', 'Boşqaruv markazi (irsiy ma’lumot)', 'Pochta bölimi'], correct: 1 } },
      { emoji: '⚡', text: 'Elektr stansiyani toping! Energiya şu yerda hosil böladi.', hint: 'Töq sariq, çöziq kapsulalarni qidiring.', check: [['selected', '==', 'mitoxondriya']] },
      { emoji: '🏭', text: 'Oqsil fabrikasini toping! U mayda zarraçalardan iborat.', hint: 'Kiçik binafşa nuqtalar.', check: [['selected', '==', 'ribosoma']] },
      { emoji: '📦', text: 'Pochta bölimini toping! U moddalarni qadoqlab çiqaradi.', hint: 'Bir-birining ustiga qatlangan yassi disklar.', check: [['selected', '==', 'goldji']] },
    ],
  },
  {
    id: 'ona-soz-tarkibi', subject: 'onatili', grade: 5, verified: false, source: null, emoji: '🧩',
    topic: 'Söz tarkibi',
    template: 'wordparts',
    params: {
      word: 'kitoblarimizdan',
      roles: ['ildiz', 'koplik', 'egalik', 'chiqish', 'qaratqich', 'jonalish'],
      roleLabels: { ildiz: 'Ildiz', koplik: 'Köplik qöşimçasi', egalik: 'Egalik qöşimçasi', chiqish: 'Çiqiş kelişigi', qaratqich: 'Qaratqiç kelişigi', jonalish: 'Jönaliş kelişigi' },
    },
    vars: {},
    hook: {
      q: '“kitoblarimizdan” – bitta söz, lekin u LEGO kabi yiğilgan. Nechta bölakdan?',
      options: ['2 ta', '3 ta', '4 ta'], correct: 2,
      why: 'kitob + lar + imiz + dan: 4 ta bölak.',
    },
    claims: ['Söz ildiz va qöşimçalardan taşkil topadi. Şakl yasovçi qöşimçalar (köplik, egalik, kelişik) söz ildiziga ketma-ket qöşiladi.'],
    discovery: 'Söz = ildiz + qöşimçalar. Qöşimçalar ketma-ket yopişadi: avval köplik, keyin egalik, oxirida kelişik.',
    explore: ['Harflar orasidagi çiziqni bosib, söz bölaklarini ajrating.', 'Har bir bölakning rolini tanlab köring.'],
    steps: [
      { emoji: '✂️', text: 'Sözni LEGO bölaklarga ajrating! Harflar orasidagi çiziqni bosing.', hint: 'Avval ildizni toping: söz nimani bildiradi? Qolgani qöşimçalar.', check: [['parts', '==', 'kitob|lar|imiz|dan']] },
      { emoji: '🏷️', text: 'Har bir bölakka vazifa bering: kim nima qiladi?', hint: 'Tartib: ildiz, köplik, egalik, kelişik.', check: [['roles', '==', 'ildiz|koplik|egalik|chiqish']] },
      { emoji: '🔍', text: '“-dan” qaysi kelişikni bildiradi?', hint: '“Kimdan? Nimadan?” savollariga javob.', ask: { kind: 'choice', options: ['Qaratqiç', 'Çiqiş', 'Jönaliş'], correct: 1 } },
      { emoji: '👥', text: '“-imiz” nimani bildiradi?', hint: '“Bizning kitoblar”: kimga tegişli?', ask: { kind: 'choice', options: ['Köplik', 'Egalik (biz)', 'Kelişik'], correct: 1 } },
    ],
  },
  {
    id: 'eng-vaqtlar', subject: 'ingliz', grade: 5, verified: false, source: null, emoji: '⏳',
    topic: 'Fe\u2019l vaqtlari: Past, Present, Future',
    template: 'timeline', params: {}, vars: {},
    hook: {
      q: '“She plays football” – bu har kuni qilinadigan ish. Kecha haqida gapirsak, fe\u2019l nima böladi?',
      options: ['plays özgarmaydi', 'played', 'will play'], correct: 1,
      why: 'Kecha haqida gapirganda fe\u2019l Past Simple şakliga ötadi: play → played.',
    },
    claims: ['Ingliz tilida fe\u2019l vaqtga qarab şaklini özgartiradi: Past Simple (played, went), Present Simple (plays, goes) va Future Simple (will play, will go).'],
    discovery: 'Vaqt çiziği fe\u2019lni özgartiradi: kecha – past şakl (played), har kuni – oddiy şakl (plays), ertaga – will + fe\u2019l. Ba\u2019zi fe\u2019llar (go) qoidaga böysunmaydi: went.',
    explore: ['Vaqtni özgartirib, fe\u2019l şakli qanday almaşishini kuzating.', 'play va go fe\u2019llarini solişturing.'],
    steps: [
      { emoji: '⏪', text: 'Vaqtni “Kecha” ga qöying. Gapdagi fe\u2019l qanday özgardi?', hint: '“Kecha” tugmasini bosing.', focus: 'time', check: [['time', '==', 'past']] },
      { emoji: '🔍', text: 'She ___ football yesterday.', hint: 'Kecha haqida gap: fe\u2019l past şaklda.', ask: { kind: 'choice', options: ['plays', 'played', 'will play'], correct: 1 } },
      { emoji: '⏩', text: 'Endi “Ertaga” ni tanlang.', hint: '“Ertaga” tugmasini bosing.', focus: 'time', check: [['time', '==', 'future']] },
      { emoji: '🔍', text: 'She ___ football tomorrow.', hint: 'Kelajak uçun fe\u2019l oldiga nima qöyiladi?', ask: { kind: 'choice', options: ['will play', 'played', 'plays'], correct: 0 } },
      { emoji: '🧩', text: 'Fe\u2019lni “go” ga almaştiring va vaqtni “Kecha” ga qöying. Nima özgardi?', hint: 'go – notöğri fe\u2019l, unga -ed qöşilmaydi.', focus: 'verb', check: [['verb', '==', 'go'], ['time', '==', 'past']] },
      { emoji: '🏫', text: 'She ___ to school yesterday.', hint: 'Notöğri fe\u2019l: özining maxsus past şakli bor.', ask: { kind: 'choice', options: ['goed', 'went', 'gone'], correct: 1 } },
    ],
  },
];

export const byId = id => CARDS.find(c => c.id === id);
export const nextOf = id => CARDS[(CARDS.findIndex(c => c.id === id) + 1) % CARDS.length];
