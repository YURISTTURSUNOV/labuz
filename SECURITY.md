# Xavfsizlik yozuvi (LabUz prototip)

Bu sayt statik: server yöq, öquvçi ma'lumoti qurilmadan çiqmaydi.

- Ism va sinf kodi faqat öquvçining brauzerida (localStorage) saqlanadi. Hech qayerga yuborilmaydi.
- Tashqi kutubxona, şrift, reklama va kuzatuv yöq. Sahifa Content-Security-Policy bilan çeklangan: faqat özining skripti işlaydi.
- Brauzer xotirasidan va BroadcastChannel dan kelgan hodisalar shakli va uzunligi bo'yiça tekşiriladi, sahifaga textContent orqali çiqariladi.
- AI server ulansa (LABUZ_AI_ENDPOINT): faqat https, CORS faqat LABUZ_ORIGINS dagi manzillar uçun, sörov hajmi va tezligi çeklangan, API kalit faqat serverda (muhit özgaruvçisi).

## Ma'lum çeklovlar
- GitHub Pages javob sarlavhalarini özgartirişga ruxsat bermaydi, şuning uçun frame-ancestors (clickjacking himoyasi) yöq. Sahifada maxfiy amal yöq, xavf past.
- username.github.io dagi barça sahifa bitta origin. Bir akkauntdagi boşqa sayt LabUz ning localStorage ini öqiy oladi. Haqiqiy öquvçilar uçun alohida domen yoki alohida akkaunt ishlatilsin.
- Imtihon rejimi brauzer tomonida. Tajribali öquvçi uni aylanib öta oladi. Jiddiy baholaş uçun server kerak.
- Ism va sinf kodi demo uçun. Haqiqiy hisoblar qöşilganda bolalar ma'lumotiga oid qonun talablari hisobga olinadi.
