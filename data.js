/* ============================================================
   TEKIPAKI — LAPISAN DATA (PLACEHOLDER)
   ------------------------------------------------------------
   Semua fungsi di bawah ini SAAT INI menyimpan data di
   localStorage (artinya baru tersimpan per-browser, belum
   sinkron antar perangkat).

   Saat siap pakai backend sungguhan (Google Sheets / Firebase /
   Supabase / dll), yang perlu diubah CUKUP isi fungsi-fungsi di
   bagian "STORE API" ini saja (idealnya jadi `async function`
   yang memanggil API). Kode di siswa.html dan guru.html tidak
   perlu diubah karena semuanya memanggil lewat objek TekiStore.
   ============================================================ */

const STORAGE_KEY = "tekipaki_students_v1";
const PASS_SCORE = 70;          // nilai minimal supaya unit/kanji/paket dianggap lulus
const UNIT_DEADLINE_DAYS = 7;   // (level non-paket, mis. N3) setiap unit harus selesai dalam 1 minggu

/* ---------------------------------------------------------
   ATURAN PAKET MINGGUAN (dipakai untuk level yang punya data
   Kanji, misalnya N5, N4): setiap minggu siswa dapat 1 PAKET berisi
   3 unit Bunpou + 12 Kanji, dengan 1 deadline gabungan. Paket
   dianggap lulus kalau SEMUA unit Bunpou di paket itu lulus DAN
   kuis Kanji-nya lulus. Paket berikutnya baru terbuka setelah
   paket sekarang lulus. Ini juga yang membuat unit TERKUNCI
   kuncinya kalau unit/paket sebelumnya belum diselesaikan
   (lihat getWeekStates & getUnitStates di bagian STORE API).
--------------------------------------------------------- */
const WEEK_DEADLINE_DAYS = 7;   // deadline 1 paket mingguan (bunpou + kanji)
const BUNPOU_PER_WEEK = 3;      // target unit bunpou baru / minggu
const KANJI_PER_WEEK = 12;      // target kanji hafalan baru / minggu
const FINAL_EXAM_PASS_SCORE = 70; // nilai minimal ujian akhir level supaya naik level

/* ---------------------------------------------------------
   LATIHAN PER UNIT: setiap unit sekarang punya 20 SOAL LATIHAN
   (10 soal Tata Bahasa + 10 soal Kanji), campuran Pilihan Ganda
   dan Esai. Lihat buildUnitQuiz() di bagian bawah file ini.
   Soal esai TIDAK dikoreksi otomatis oleh sistem — begitu siswa
   menekan "Kumpulkan Jawaban", kunci jawabannya langsung
   ditampilkan dan siswa menandai sendiri jawabannya benar/salah.
--------------------------------------------------------- */
const GRAMMAR_Q_PER_UNIT = 10;
const KANJI_Q_PER_UNIT = 10;

// Berapa hari 1 level harus tuntas total, dihitung sejak siswa mulai level
// tsb (student.levelStartedAt). Level yang belum diisi di sini dianggap
// belum punya batas waktu keseluruhan (hanya deadline per unit/paket).
const LEVEL_DURATION_DAYS = {
  N5: 90,   // N5 harus selesai dalam 3 bulan
  N4: 90,   // N4 harus selesai dalam 3 bulan = 15 minggu
};

// Kode akses guru/admin — ganti / tambahkan sesuai kebutuhan
const TEACHER_CODES = ["GURU2026", "ADMINTP"];
function isValidTeacherCode(code){ return TEACHER_CODES.includes((code || "").trim().toUpperCase()); }

/* ---------------------------------------------------------
   1. STRUKTUR LEVEL & UNIT
   ------------------------------------------------------------
   LEVEL_ORDER menentukan urutan level dari paling dasar ke
   paling mahir. Status tiap level (selesai/aktif/terkunci)
   TIDAK lagi disimpan di sini secara global — status itu
   dihitung PER SISWA lewat TekiStore.getLevelStates(student),
   berdasarkan field `student.level` (level yang sedang aktif
   dijalani siswa itu).

   UNITS_BY_LEVEL menyimpan materi & latihan Bunpou untuk tiap
   level. KANJI_BY_LEVEL menyimpan daftar Kanji hafalan tiap
   level. Level yang array-nya kosong [] berarti "materi belum
   tersedia" dan akan ditampilkan sebagai demikian di siswa.html.

   Field `materialUrl` (opsional) di tiap unit Bunpou adalah
   link ke materi lengkap di website/tempat lain — kalau diisi,
   akan muncul tombol "Buka Materi ↗" yang membuka link tsb di
   tab baru.
--------------------------------------------------------- */
const LEVEL_ORDER = ["N5", "N4", "N3", "N2", "N1"];

const LEVEL_META = [
  { id: "N5", title: "Dasar Bahasa Jepang" },
  { id: "N4", title: "Pemahaman dasar" },
  { id: "N3", title: "Tata bahasa tingkat menengah" },
  { id: "N2", title: "Tingkat menengah atas" },
  { id: "N1", title: "Tingkat mahir" },
];

const UNITS_N3 = [
  {
    id: "n3u1",
    order: 1,
    grammar: "〜代わりに",
    reading: "~kawari ni",
    meaning: "sebagai ganti ~／alih-alih ~／sebagai imbalan atas ~",
    explanation: [
      "〜代わりに berasal dari kata benda 代わり (pengganti).",
      "Digunakan untuk menyatakan pengganti atau kontras antara dua tindakan / hal."
    ],
    pattern: [
      "[Kata Benda] ＋ の代わりに ＝ sebagai ganti ~",
      "[Kata Kerja bentuk kamus] ＋ 代わりに ＝ alih-alih ~"
    ],
    examples: [
      { jp: "今日は先生の代わりに、私が授業をします。", reading: "きょうはせんせいのかわりに、わたしがじゅぎょうをします。", meaning: "Hari ini, sebagai ganti guru, saya yang akan mengajar." },
      { jp: "彼は謝る代わりに、プレゼントを送ってきた。", reading: "かれはあやまるかわりに、プレゼントをおくってきた。", meaning: "Alih-alih meminta maaf, dia malah mengirimkan hadiah." }
    ],
    quiz: [
      { id: "q1", words: ["今日は先生の代わりに、", "私が", "授業をします"], answer: ["今日は先生の代わりに、", "私が", "授業をします"] },
      { id: "q2", words: ["彼は謝る代わりに、", "プレゼントを", "送ってきた"], answer: ["彼は謝る代わりに、", "プレゼントを", "送ってきた"] }
    ]
  },
  {
    id: "n3u2",
    order: 2,
    grammar: "〜抜きで",
    reading: "~nuki de",
    meaning: "tanpa ~／mengesampingkan ~",
    explanation: [
      "〜抜きで berasal dari kata kerja 抜く (mencabut/menghilangkan).",
      "Dipakai untuk menyatakan sesuatu dilakukan tanpa unsur tertentu yang biasanya ada."
    ],
    pattern: [
      "[Kata Benda] ＋ 抜きで ＝ tanpa ~",
      "[Kata Benda] ＋ 抜きの ＋ [Kata Benda] ＝ ~ tanpa ~ (sebagai frasa)"
    ],
    examples: [
      { jp: "冗談抜きで、この計画は難しいと思う。", reading: "じょうだんぬきで、このけいかくはむずかしいとおもう。", meaning: "Bukan bercanda, saya pikir rencana ini sulit." },
      { jp: "今日は朝ご飯抜きで学校に来た。", reading: "きょうはあさごはんぬきでがっこうにきた。", meaning: "Hari ini saya ke sekolah tanpa sarapan." }
    ],
    quiz: [
      { id: "q1", words: ["冗談抜きで、", "この計画は", "難しいと思う"], answer: ["冗談抜きで、", "この計画は", "難しいと思う"] },
      { id: "q2", words: ["今日は", "朝ご飯抜きで", "学校に来た"], answer: ["今日は", "朝ご飯抜きで", "学校に来た"] }
    ]
  },
  {
    id: "n3u3",
    order: 3,
    grammar: "〜たびに",
    reading: "~tabi ni",
    meaning: "setiap kali melakukan ~",
    explanation: [
      "〜たびに berasal dari kata benda 度 (kali/setiap kesempatan).",
      "Menyatakan sesuatu yang selalu terjadi setiap kali suatu peristiwa berlangsung."
    ],
    pattern: [
      "[Kata Kerja bentuk kamus] ＋ たびに ＝ setiap kali ~",
      "[Kata Benda] ＋ のたびに ＝ setiap kali ~"
    ],
    examples: [
      { jp: "彼女に会うたびに、元気をもらう。", reading: "かのじょにあうたびに、げんきをもらう。", meaning: "Setiap kali bertemu dengannya, saya mendapat semangat." },
      { jp: "旅行のたびに、写真をたくさん撮る。", reading: "りょこうのたびに、しゃしんをたくさんとる。", meaning: "Setiap kali bepergian, saya mengambil banyak foto." }
    ],
    quiz: [
      { id: "q1", words: ["彼女に会うたびに、", "元気を", "もらう"], answer: ["彼女に会うたびに、", "元気を", "もらう"] },
      { id: "q2", words: ["旅行のたびに、", "写真を", "たくさん撮る"], answer: ["旅行のたびに、", "写真を", "たくさん撮る"] }
    ]
  },
  {
    id: "n3u4",
    order: 4,
    grammar: "〜さえ",
    reading: "~sae",
    meaning: "bahkan ~／bahkan ~ pun",
    explanation: [
      "〜さえ dipakai untuk menekankan hal ekstrem sebagai contoh dari suatu keadaan.",
      "Menyiratkan bahwa hal lain yang lebih ringan pun otomatis berlaku."
    ],
    pattern: [
      "[Kata Benda] ＋ さえ ＝ bahkan ~",
      "[Kata Kerja bentuk -te] ＋ さえいれば ＝ asalkan ~ saja"
    ],
    examples: [
      { jp: "疲れて、水を飲む力さえなかった。", reading: "つかれて、みずをのむちからさえなかった。", meaning: "Saya sangat lelah, bahkan untuk minum air pun tidak ada tenaga." },
      { jp: "彼は自分の名前さえ書けなかった。", reading: "かれはじぶんのなまえさえかけなかった。", meaning: "Dia bahkan tidak bisa menulis namanya sendiri." }
    ],
    quiz: [
      { id: "q1", words: ["疲れて、", "水を飲む力さえ", "なかった"], answer: ["疲れて、", "水を飲む力さえ", "なかった"] },
      { id: "q2", words: ["彼は", "自分の名前さえ", "書けなかった"], answer: ["彼は", "自分の名前さえ", "書けなかった"] }
    ]
  },
  {
    id: "n3u5",
    order: 5,
    grammar: "〜わけではない",
    reading: "~wake dewa nai",
    meaning: "bukan berarti ~／tidak sepenuhnya berarti ~",
    explanation: [
      "Dipakai untuk menyangkal kesimpulan yang mungkin diambil orang lain secara berlebihan.",
      "Sering muncul untuk mengoreksi asumsi, bukan menyangkal fakta secara total."
    ],
    pattern: [
      "[Kata Kerja/Kata Sifat bentuk biasa] ＋ わけではない ＝ bukan berarti ~",
      "[Kata Benda] ＋ というわけではない ＝ bukan berarti ~"
    ],
    examples: [
      { jp: "嫌いなわけではないが、あまり食べたくない。", reading: "きらいなわけではないが、あまりたべたくない。", meaning: "Bukan berarti tidak suka, hanya saja tidak terlalu ingin makan." },
      { jp: "全部わかるわけではないけど、大体理解できた。", reading: "ぜんぶわかるわけではないけど、だいたいりかいできた。", meaning: "Bukan berarti mengerti semuanya, tapi secara garis besar saya paham." }
    ],
    quiz: [
      { id: "q1", words: ["嫌いなわけではないが、", "あまり", "食べたくない"], answer: ["嫌いなわけではないが、", "あまり", "食べたくない"] },
      { id: "q2", words: ["全部わかるわけではないけど、", "大体", "理解できた"], answer: ["全部わかるわけではないけど、", "大体", "理解できた"] }
    ]
  }
];

/* ---------------------------------------------------------
   UNITS_N5 — CONTOH / SAMPEL (2 minggu pertama = 6 unit).
   ------------------------------------------------------------
   ⚠️ INI BARU CONTOH supaya sistem paket mingguan bisa langsung
   dicoba. Untuk cakupan N5 penuh (kira-kira 12–13 minggu / ~36–39
   unit selama 3 bulan), tambahkan unit lagi dengan pola yang
   SAMA PERSIS seperti di bawah (id unik, order berurut, lalu isi
   explanation/pattern/examples/quiz). Urutan array = urutan buka
   unit, dan tiap 3 unit berturutan otomatis jadi 1 paket mingguan.

   `materialUrl`: ganti dengan link materi asli di website Anda —
   kalau diisi, akan muncul tombol "Buka Materi ↗" di daftar unit
   dan di halaman unit.
--------------------------------------------------------- */
const UNITS_N5 = [
  {
    id: "n5u1",
    order: 1,
    grammar: "〜は〜です",
    reading: "~wa ~desu",
    meaning: "A adalah B (pola kalimat paling dasar)",
    materialUrl: "https://tekipaki.example.com/materi/n5/unit-1", // TODO: ganti link asli
    explanation: [
      "です berfungsi sebagai kata kerja bantu untuk menyatakan 'adalah' pada akhir kalimat.",
      "は menandai topik kalimat (dibaca 'wa', bukan 'ha')."
    ],
    pattern: [
      "[Topik] ＋ は ＋ [Keterangan] ＋ です ＝ [Topik] adalah [Keterangan]"
    ],
    examples: [
      { jp: "私は学生です。", reading: "わたしはがくせいです。", meaning: "Saya adalah pelajar." },
      { jp: "これは本です。", reading: "これはほんです。", meaning: "Ini adalah buku." }
    ],
    quiz: [
      { id: "q1", words: ["私は", "学生です"], answer: ["私は", "学生です"] },
      { id: "q2", words: ["これは", "本です"], answer: ["これは", "本です"] }
    ]
  },
  {
    id: "n5u2",
    order: 2,
    grammar: "〜を〜ます",
    reading: "~o ~masu",
    meaning: "melakukan sesuatu terhadap objek",
    materialUrl: "https://tekipaki.example.com/materi/n5/unit-2", // TODO: ganti link asli
    explanation: [
      "を menandai objek dari kata kerja.",
      "ます adalah akhiran kata kerja bentuk sopan untuk waktu sekarang/akan datang."
    ],
    pattern: [
      "[Objek] ＋ を ＋ [Kata Kerja]ます ＝ melakukan [Kata Kerja] terhadap [Objek]"
    ],
    examples: [
      { jp: "ご飯を食べます。", reading: "ごはんをたべます。", meaning: "Makan nasi." },
      { jp: "本を読みます。", reading: "ほんをよみます。", meaning: "Membaca buku." }
    ],
    quiz: [
      { id: "q1", words: ["ご飯を", "食べます"], answer: ["ご飯を", "食べます"] },
      { id: "q2", words: ["本を", "読みます"], answer: ["本を", "読みます"] }
    ]
  },
  {
    id: "n5u3",
    order: 3,
    grammar: "〜に行きます",
    reading: "~ni ikimasu",
    meaning: "pergi ke ~",
    materialUrl: "https://tekipaki.example.com/materi/n5/unit-3", // TODO: ganti link asli
    explanation: [
      "に menandai tujuan/arah tempat pada kata kerja pergerakan seperti 行きます (pergi).",
      "Pola ini dipakai untuk menyatakan tujuan perjalanan sehari-hari."
    ],
    pattern: [
      "[Tempat] ＋ に ＋ 行きます ＝ pergi ke [Tempat]"
    ],
    examples: [
      { jp: "学校に行きます。", reading: "がっこうにいきます。", meaning: "Pergi ke sekolah." },
      { jp: "日本に行きます。", reading: "にほんにいきます。", meaning: "Pergi ke Jepang." }
    ],
    quiz: [
      { id: "q1", words: ["学校に", "行きます"], answer: ["学校に", "行きます"] },
      { id: "q2", words: ["日本に", "行きます"], answer: ["日本に", "行きます"] }
    ]
  },
  {
    id: "n5u4",
    order: 4,
    grammar: "〜があります／います",
    reading: "~ga arimasu / imasu",
    meaning: "ada ~ (benda mati / makhluk hidup)",
    materialUrl: "https://tekipaki.example.com/materi/n5/unit-4", // TODO: ganti link asli
    explanation: [
      "あります dipakai untuk benda mati/tak bergerak, います untuk manusia/hewan (makhluk hidup).",
      "が menandai subjek yang keberadaannya sedang dinyatakan."
    ],
    pattern: [
      "[Benda mati] ＋ が ＋ あります ＝ ada [Benda]",
      "[Makhluk hidup] ＋ が ＋ います ＝ ada [Makhluk hidup]"
    ],
    examples: [
      { jp: "机の上に本があります。", reading: "つくえのうえにほんがあります。", meaning: "Ada buku di atas meja." },
      { jp: "教室に学生がいます。", reading: "きょうしつにがくせいがいます。", meaning: "Ada murid di kelas." }
    ],
    quiz: [
      { id: "q1", words: ["机の上に", "本が", "あります"], answer: ["机の上に", "本が", "あります"] },
      { id: "q2", words: ["教室に", "学生が", "います"], answer: ["教室に", "学生が", "います"] }
    ]
  },
  {
    id: "n5u5",
    order: 5,
    grammar: "〜てください",
    reading: "~te kudasai",
    meaning: "tolong lakukan ~",
    materialUrl: "https://tekipaki.example.com/materi/n5/unit-5", // TODO: ganti link asli
    explanation: [
      "Dibentuk dari kata kerja bentuk -te ditambah ください.",
      "Dipakai untuk meminta atau menyuruh seseorang melakukan sesuatu secara sopan."
    ],
    pattern: [
      "[Kata Kerja bentuk -te] ＋ ください ＝ tolong ~"
    ],
    examples: [
      { jp: "ここに座ってください。", reading: "ここにすわってください。", meaning: "Tolong duduk di sini." },
      { jp: "名前を書いてください。", reading: "なまえをかいてください。", meaning: "Tolong tulis namanya." }
    ],
    quiz: [
      { id: "q1", words: ["ここに", "座って", "ください"], answer: ["ここに", "座って", "ください"] },
      { id: "q2", words: ["名前を", "書いて", "ください"], answer: ["名前を", "書いて", "ください"] }
    ]
  },
  {
    id: "n5u6",
    order: 6,
    grammar: "〜たいです",
    reading: "~tai desu",
    meaning: "ingin melakukan ~",
    materialUrl: "https://tekipaki.example.com/materi/n5/unit-6", // TODO: ganti link asli
    explanation: [
      "Dibentuk dari kata kerja bentuk ます (buang ます) ditambah たい.",
      "Menyatakan keinginan pembicara untuk melakukan suatu tindakan."
    ],
    pattern: [
      "[Kata Kerja bentuk ます tanpa ます] ＋ たいです ＝ ingin ~"
    ],
    examples: [
      { jp: "日本に行きたいです。", reading: "にほんにいきたいです。", meaning: "Saya ingin pergi ke Jepang." },
      { jp: "水を飲みたいです。", reading: "みずをのみたいです。", meaning: "Saya ingin minum air." }
    ],
    quiz: [
      { id: "q1", words: ["日本に", "行きたいです"], answer: ["日本に", "行きたいです"] },
      { id: "q2", words: ["水を", "飲みたいです"], answer: ["水を", "飲みたいです"] }
    ]
  }
];

/* ---------------------------------------------------------
   UNITS_N4 — 18 unit pertama (6 minggu pertama x 3 Bunpou/minggu),
   sesuai dengan halaman-halaman "Tata Bahasa N4" yang sudah ada di
   website (materitatabahasa.html → link tatabahasan4_xxx.html).
   ------------------------------------------------------------
   ⚠️ Ini adalah 18 dari total 45 pola tata bahasa N4 yang sudah
   ada di web Anda (lihat daftar lengkap `grammarList` di
   materitatabahasa.html). Supaya target "3 bulan / 15 minggu"
   tercapai penuh, tambahkan 27 unit sisanya (n4u19 s.d. n4u45)
   dengan pola yang SAMA PERSIS seperti contoh di bawah:
   { id, order, grammar, reading, meaning, materialUrl,
     explanation:[...], pattern:[...], examples:[{jp,reading,meaning}, ...],
     quiz:[{id,words:[...],answer:[...]}, ...] }

   Daftar 27 pola sisanya (jp · romaji · arti singkat · link materi
   yang sudah ada di web Anda) supaya tinggal disalin ke atas:
     19. つもり (tsumori) — berniat/berencana — tatabahasan4_tsumori.html
     20. かもしれない (kamoshirenai) — mungkin/bisa jadi — tatabahasan4_kamoshirenai.html
     21. でしょう (deshou) — mungkin/dugaan — tatabahasan4_deshou.html
     22. のに (noni) — padahal — tatabahasan4_noni.html
     23. し (shi) — lagipula/selain itu — tatabahasan4_shi.html
     24. ばかり (bakari) — baru saja/hanya melulu — tatabahasan4_bakari.html
     25. てもいい (temo ii) — boleh melakukan — tatabahasan4_temoii.html
     26. てはいけない (tewa ikenai) — tidak boleh melakukan — tatabahasan4_tewaikenai.html
     27. 命令形 (meireikei) — bentuk perintah — tatabahasan4_meireikei.html
     28. 使役形（させる） (shiekikei) — menyuruh/membiarkan — tatabahasan4_saseru.html
     29. 受身形（られる） (ukemikei) — bentuk pasif — tatabahasan4_rareru.html
     30. れる／られる（可能） (kanoukei) — bisa/dapat melakukan — tatabahasan4_kanoukei.html
     31. てみる (te miru) — mencoba melakukan — tatabahasan4_temiru.html
     32. （よ）うと思う ((y)ou to omou) — berniat/bermaksud — tatabahasan4_youtoomou.html
     33. ことにする (koto ni suru) — memutuskan untuk — tatabahasan4_kotonisuru.html
     34. ことになる (koto ni naru) — telah diputuskan/menjadi ketentuan — tatabahasan4_kotoninaru.html
     35. ようにする (you ni suru) — berusaha/membiasakan diri — tatabahasan4_younisuru.html
     36. てあげる (te ageru) — melakukan untuk orang lain — tatabahasan4_teageru.html
     37. てもらう (te morau) — menerima bantuan/meminta dilakukan — tatabahasan4_temorau.html
     38. てくれる (te kureru) — orang lain melakukan untuk saya — tatabahasan4_tekureru.html
     39. てある (te aru) — sudah dilakukan (hasilnya masih ada) — tatabahasan4_tearu.html
     40. ば (ba) — kalau/jika (bentuk ba) — tatabahasan4_ba.html
     41. なら (nara) — kalau begitu/kalau memang — tatabahasan4_nara.html
     42. ても (temo) — meskipun/walaupun — tatabahasan4_temo.html
     43. はずだ (hazu da) — seharusnya/pasti (perkiraan kuat) — tatabahasan4_hazuda.html
     44. らしい (rashii) — katanya/sepertinya (berdasarkan info) — tatabahasan4_rashii.html
     45. みたい（だ） (mitai (da)) — seperti/mirip dengan — tatabahasan4_mitaida.html
--------------------------------------------------------- */
const UNITS_N4 = [
  {
    id: "n4u1", order: 1,
    grammar: "〜たら", reading: "~tara",
    meaning: "kalau ~／seandainya ~／setelah ~",
    materialUrl: "tatabahasan4_tara.html",
    explanation: [
      "〜たら dibentuk dari bentuk lampau (た-form) kata kerja/kata sifat ditambah ら.",
      "Digunakan untuk menyatakan syarat atau urutan waktu — 'kalau/setelah A, maka B'."
    ],
    pattern: ["[Kata Kerja bentuk た] ＋ ら ＝ kalau/setelah ~"],
    examples: [
      { jp: "雨が降ったら、行きません。", reading: "あめがふったら、いきません。", meaning: "Kalau hujan turun, saya tidak akan pergi." },
      { jp: "家に着いたら、電話します。", reading: "いえについたら、でんわします。", meaning: "Setelah sampai rumah, saya akan menelepon." }
    ],
    quiz: [
      { id: "q1", words: ["雨が降ったら、", "行き", "ません"], answer: ["雨が降ったら、", "行き", "ません"] },
      { id: "q2", words: ["家に着いたら、", "電話", "します"], answer: ["家に着いたら、", "電話", "します"] }
    ]
  },
  {
    id: "n4u2", order: 2,
    grammar: "〜ながら", reading: "~nagara",
    meaning: "sambil melakukan ~",
    materialUrl: "tatabahasan4_nagara.html",
    explanation: [
      "ながら menempel pada bentuk ます suatu kata kerja (tanpa ます).",
      "Menyatakan dua tindakan yang dilakukan bersamaan oleh pelaku yang sama."
    ],
    pattern: ["[Kata Kerja bentuk ます tanpa ます] ＋ ながら ＝ sambil ~"],
    examples: [
      { jp: "音楽を聞きながら、勉強します。", reading: "おんがくをききながら、べんきょうします。", meaning: "Belajar sambil mendengarkan musik." },
      { jp: "テレビを見ながら、ご飯を食べます。", reading: "てれびをみながら、ごはんをたべます。", meaning: "Makan sambil menonton TV." }
    ],
    quiz: [
      { id: "q1", words: ["音楽を聞きながら、", "勉強", "します"], answer: ["音楽を聞きながら、", "勉強", "します"] },
      { id: "q2", words: ["テレビを見ながら、", "ご飯を", "食べます"], answer: ["テレビを見ながら、", "ご飯を", "食べます"] }
    ]
  },
  {
    id: "n4u3", order: 3,
    grammar: "〜てしまう", reading: "~te shimau",
    meaning: "selesai ~／terlanjur melakukan ~",
    materialUrl: "tatabahasan4_teshimau.html",
    explanation: [
      "〜てしまう dibentuk dari kata kerja bentuk -te ditambah しまう.",
      "Menyatakan tindakan selesai tuntas, atau rasa penyesalan karena terlanjur melakukan sesuatu."
    ],
    pattern: ["[Kata Kerja bentuk -te] ＋ しまう ＝ selesai/terlanjur ~"],
    examples: [
      { jp: "宿題をもう終わってしまいました。", reading: "しゅくだいをもうおわってしまいました。", meaning: "Pekerjaan rumah sudah selesai saya kerjakan (tuntas)." },
      { jp: "大事な本をなくしてしまいました。", reading: "だいじなほんをなくしてしまいました。", meaning: "Saya terlanjur kehilangan buku penting." }
    ],
    quiz: [
      { id: "q1", words: ["宿題を", "もう終わって", "しまいました"], answer: ["宿題を", "もう終わって", "しまいました"] },
      { id: "q2", words: ["大事な本を", "なくして", "しまいました"], answer: ["大事な本を", "なくして", "しまいました"] }
    ]
  },
  {
    id: "n4u4", order: 4,
    grammar: "〜ておく", reading: "~te oku",
    meaning: "melakukan sesuatu untuk persiapan",
    materialUrl: "tatabahasan4_teoku.html",
    explanation: [
      "〜ておく dibentuk dari kata kerja bentuk -te ditambah おく.",
      "Menyatakan suatu tindakan dilakukan sebagai persiapan untuk sesuatu di masa depan."
    ],
    pattern: ["[Kata Kerja bentuk -te] ＋ おく ＝ melakukan ~ sebagai persiapan"],
    examples: [
      { jp: "明日のパーティーのために、料理を作っておきます。", reading: "あしたのぱーてぃーのために、りょうりをつくっておきます。", meaning: "Untuk pesta besok, saya menyiapkan masakan terlebih dahulu." },
      { jp: "出かける前に、窓を閉めておきます。", reading: "でかけるまえに、まどをしめておきます。", meaning: "Sebelum keluar, saya menutup jendela dulu (untuk persiapan)." }
    ],
    quiz: [
      { id: "q1", words: ["明日のパーティーのために、", "料理を作って", "おきます"], answer: ["明日のパーティーのために、", "料理を作って", "おきます"] },
      { id: "q2", words: ["出かける前に、", "窓を閉めて", "おきます"], answer: ["出かける前に、", "窓を閉めて", "おきます"] }
    ]
  },
  {
    id: "n4u5", order: 5,
    grammar: "〜なければならない", reading: "~nakereba naranai",
    meaning: "harus melakukan ~",
    materialUrl: "tatabahasan4_nakerebanaranai.html",
    explanation: [
      "Dibentuk dari bentuk negatif kata kerja (buang い, tambah ければ) ditambah ならない.",
      "Menyatakan kewajiban atau keharusan untuk melakukan sesuatu."
    ],
    pattern: ["[Kata Kerja bentuk ない → なければ] ＋ ならない ＝ harus ~"],
    examples: [
      { jp: "明日までにレポートを出さなければなりません。", reading: "あしたまでにれぽーとをださなければなりません。", meaning: "Saya harus menyerahkan laporan paling lambat besok." },
      { jp: "毎朝六時に起きなければなりません。", reading: "まいあさろくじにおきなければなりません。", meaning: "Saya harus bangun jam 6 setiap pagi." }
    ],
    quiz: [
      { id: "q1", words: ["明日までに", "レポートを出さなければ", "なりません"], answer: ["明日までに", "レポートを出さなければ", "なりません"] },
      { id: "q2", words: ["毎朝六時に", "起きなければ", "なりません"], answer: ["毎朝六時に", "起きなければ", "なりません"] }
    ]
  },
  {
    id: "n4u6", order: 6,
    grammar: "〜なくてもいい", reading: "~nakutemo ii",
    meaning: "tidak perlu melakukan ~",
    materialUrl: "tatabahasan4_nakutemoii.html",
    explanation: [
      "Dibentuk dari bentuk negatif kata kerja (buang い, tambah くても) ditambah いい.",
      "Menyatakan bahwa suatu tindakan tidak wajib/tidak perlu dilakukan."
    ],
    pattern: ["[Kata Kerja bentuk ない → なくても] ＋ いい ＝ tidak perlu ~"],
    examples: [
      { jp: "今日は仕事に行かなくてもいいです。", reading: "きょうはしごとにいかなくてもいいです。", meaning: "Hari ini saya tidak perlu pergi kerja." },
      { jp: "心配しなくてもいいですよ。", reading: "しんぱいしなくてもいいですよ。", meaning: "Kamu tidak perlu khawatir." }
    ],
    quiz: [
      { id: "q1", words: ["今日は", "仕事に行かなくても", "いいです"], answer: ["今日は", "仕事に行かなくても", "いいです"] },
      { id: "q2", words: ["心配しなくても", "いいです", "よ"], answer: ["心配しなくても", "いいです", "よ"] }
    ]
  },
  {
    id: "n4u7", order: 7,
    grammar: "〜そうです（様態）", reading: "~sou desu (youtai)",
    meaning: "kelihatannya ~／sepertinya ~",
    materialUrl: "tatabahasan4_souyoutai.html",
    explanation: [
      "Bentuk 様態 (penampakan) dari そうです menempel langsung pada kata sifat/kata kerja bentuk ます (tanpa ます).",
      "Digunakan untuk menyatakan kesan visual — sesuatu 'terlihat/kelihatannya' seperti itu."
    ],
    pattern: ["[Kata Sifat-i (buang い) / Kata Kerja bentuk ます tanpa ます] ＋ そうです ＝ kelihatannya ~"],
    examples: [
      { jp: "このケーキはおいしそうです。", reading: "このけーきはおいしそうです。", meaning: "Kue ini kelihatannya enak." },
      { jp: "雨が降りそうです。", reading: "あめがふりそうです。", meaning: "Kelihatannya akan turun hujan." }
    ],
    quiz: [
      { id: "q1", words: ["このケーキは", "おいし", "そうです"], answer: ["このケーキは", "おいし", "そうです"] },
      { id: "q2", words: ["雨が", "降り", "そうです"], answer: ["雨が", "降り", "そうです"] }
    ]
  },
  {
    id: "n4u8", order: 8,
    grammar: "〜そうです（伝聞）", reading: "~sou desu (denbun)",
    meaning: "katanya ~／menurut informasi ~",
    materialUrl: "tatabahasan4_soudenbun.html",
    explanation: [
      "Bentuk 伝聞 (kabar dengar) dari そうです menempel pada kata kerja/kata sifat bentuk biasa (kamus).",
      "Digunakan untuk menyampaikan informasi yang didengar atau dibaca dari sumber lain."
    ],
    pattern: ["[Kata Kerja/Kata Sifat bentuk biasa] ＋ そうです ＝ katanya ~"],
    examples: [
      { jp: "天気予報によると、明日は晴れるそうです。", reading: "てんきよほうによると、あしたははれるそうです。", meaning: "Menurut ramalan cuaca, katanya besok akan cerah." },
      { jp: "あの店のラーメンはおいしいそうです。", reading: "あのみせのらーめんはおいしいそうです。", meaning: "Katanya ramen di toko itu enak." }
    ],
    quiz: [
      { id: "q1", words: ["天気予報によると、", "明日は晴れる", "そうです"], answer: ["天気予報によると、", "明日は晴れる", "そうです"] },
      { id: "q2", words: ["あの店のラーメンは", "おいしい", "そうです"], answer: ["あの店のラーメンは", "おいしい", "そうです"] }
    ]
  },
  {
    id: "n4u9", order: 9,
    grammar: "〜すぎる", reading: "~sugiru",
    meaning: "terlalu ~",
    materialUrl: "tatabahasan4_sugiru.html",
    explanation: [
      "すぎる menempel pada kata sifat (buang い/な) atau kata kerja bentuk ます (tanpa ます).",
      "Menyatakan sesuatu berlebihan / melewati batas wajar."
    ],
    pattern: ["[Kata Sifat/Kata Kerja bentuk ます tanpa ます] ＋ すぎる ＝ terlalu ~"],
    examples: [
      { jp: "この問題は難しすぎます。", reading: "このもんだいはむずかしすぎます。", meaning: "Soal ini terlalu sulit." },
      { jp: "昨日お酒を飲みすぎました。", reading: "きのうおさけをのみすぎました。", meaning: "Kemarin saya minum sake terlalu banyak." }
    ],
    quiz: [
      { id: "q1", words: ["この問題は", "難し", "すぎます"], answer: ["この問題は", "難し", "すぎます"] },
      { id: "q2", words: ["昨日", "お酒を飲み", "すぎました"], answer: ["昨日", "お酒を飲み", "すぎました"] }
    ]
  },
  {
    id: "n4u10", order: 10,
    grammar: "〜やすい／〜にくい", reading: "~yasui / ~nikui",
    meaning: "mudah／sulit dilakukan",
    materialUrl: "tatabahasan4_yasuinikui.html",
    explanation: [
      "やすい/にくい menempel pada kata kerja bentuk ます (tanpa ます), lalu berkonjugasi seperti kata sifat-i.",
      "やすい menyatakan mudah dilakukan, にくい menyatakan sulit dilakukan."
    ],
    pattern: ["[Kata Kerja bentuk ます tanpa ます] ＋ やすい／にくい ＝ mudah／sulit dilakukan"],
    examples: [
      { jp: "この本は字が大きくて読みやすいです。", reading: "このほんはじがおおきくてよみやすいです。", meaning: "Buku ini hurufnya besar jadi mudah dibaca." },
      { jp: "この漢字は書きにくいです。", reading: "このかんじはかきにくいです。", meaning: "Kanji ini sulit ditulis." }
    ],
    quiz: [
      { id: "q1", words: ["この本は", "字が大きくて", "読みやすいです"], answer: ["この本は", "字が大きくて", "読みやすいです"] },
      { id: "q2", words: ["この漢字は", "書き", "にくいです"], answer: ["この漢字は", "書き", "にくいです"] }
    ]
  },
  {
    id: "n4u11", order: 11,
    grammar: "〜ように", reading: "~you ni",
    meaning: "agar ~／supaya ~",
    materialUrl: "tatabahasan4_youni.html",
    explanation: [
      "ように menempel pada kata kerja bentuk kamus atau bentuk ない.",
      "Menyatakan tujuan atau harapan — melakukan sesuatu agar suatu keadaan tercapai."
    ],
    pattern: ["[Kata Kerja bentuk kamus/ない] ＋ ように ＝ agar/supaya ~"],
    examples: [
      { jp: "忘れないように、メモしておきます。", reading: "わすれないように、めもしておきます。", meaning: "Saya mencatat agar tidak lupa." },
      { jp: "よく聞こえるように、大きい声で話してください。", reading: "よくきこえるように、おおきいこえではなしてください。", meaning: "Tolong bicara dengan suara keras agar terdengar jelas." }
    ],
    quiz: [
      { id: "q1", words: ["忘れないように、", "メモして", "おきます"], answer: ["忘れないように、", "メモして", "おきます"] },
      { id: "q2", words: ["よく聞こえるように、", "大きい声で", "話してください"], answer: ["よく聞こえるように、", "大きい声で", "話してください"] }
    ]
  },
  {
    id: "n4u12", order: 12,
    grammar: "〜ようになる", reading: "~you ni naru",
    meaning: "menjadi bisa ~／berubah menjadi ~",
    materialUrl: "tatabahasan4_youninaru.html",
    explanation: [
      "ようになる menempel pada kata kerja bentuk kamus (sering bentuk potensial/bisa).",
      "Menyatakan perubahan keadaan atau kemampuan yang terjadi secara bertahap."
    ],
    pattern: ["[Kata Kerja bentuk kamus] ＋ ようになる ＝ menjadi bisa/berubah menjadi ~"],
    examples: [
      { jp: "練習して、漢字が書けるようになりました。", reading: "れんしゅうして、かんじがかけるようになりました。", meaning: "Setelah berlatih, saya jadi bisa menulis kanji." },
      { jp: "最近、よく寝られるようになりました。", reading: "さいきん、よくねられるようになりました。", meaning: "Belakangan ini, saya jadi bisa tidur nyenyak." }
    ],
    quiz: [
      { id: "q1", words: ["練習して、", "漢字が書ける", "ようになりました"], answer: ["練習して、", "漢字が書ける", "ようになりました"] },
      { id: "q2", words: ["最近、", "よく寝られる", "ようになりました"], answer: ["最近、", "よく寝られる", "ようになりました"] }
    ]
  },
  {
    id: "n4u13", order: 13,
    grammar: "〜ため（に）", reading: "~tame (ni)",
    meaning: "demi ~／untuk tujuan ~",
    materialUrl: "tatabahasan4_tameni.html",
    explanation: [
      "ために menempel pada kata benda + の, atau kata kerja bentuk kamus.",
      "Menyatakan tujuan atau alasan untuk melakukan suatu tindakan."
    ],
    pattern: ["[Kata Benda] ＋ のために／[Kata Kerja bentuk kamus] ＋ ために ＝ demi/untuk ~"],
    examples: [
      { jp: "家族のために、一生懸命働いています。", reading: "かぞくのために、いっしょうけんめいはたらいています。", meaning: "Saya bekerja keras demi keluarga." },
      { jp: "日本語が上手になるために、毎日練習しています。", reading: "にほんごがじょうずになるために、まいにちれんしゅうしています。", meaning: "Saya berlatih setiap hari agar mahir berbahasa Jepang." }
    ],
    quiz: [
      { id: "q1", words: ["家族のために、", "一生懸命", "働いています"], answer: ["家族のために、", "一生懸命", "働いています"] },
      { id: "q2", words: ["日本語が上手になるために、", "毎日", "練習しています"], answer: ["日本語が上手になるために、", "毎日", "練習しています"] }
    ]
  },
  {
    id: "n4u14", order: 14,
    grammar: "〜について", reading: "~ni tsuite",
    meaning: "mengenai ~／tentang ~",
    materialUrl: "tatabahasan4_nitsuite.html",
    explanation: [
      "について menempel pada kata benda.",
      "Menyatakan topik yang sedang dibicarakan atau dibahas."
    ],
    pattern: ["[Kata Benda] ＋ について ＝ mengenai/tentang ~"],
    examples: [
      { jp: "日本の文化について勉強しています。", reading: "にほんのぶんかについてべんきょうしています。", meaning: "Saya sedang belajar tentang budaya Jepang." },
      { jp: "この問題について話し合いましょう。", reading: "このもんだいについてはなしあいましょう。", meaning: "Mari kita bicarakan mengenai masalah ini." }
    ],
    quiz: [
      { id: "q1", words: ["日本の文化について", "勉強して", "います"], answer: ["日本の文化について", "勉強して", "います"] },
      { id: "q2", words: ["この問題について", "話し合い", "ましょう"], answer: ["この問題について", "話し合い", "ましょう"] }
    ]
  },
  {
    id: "n4u15", order: 15,
    grammar: "〜と思う", reading: "~to omou",
    meaning: "saya pikir ~／menurut saya ~",
    materialUrl: "tatabahasan4_toomou.html",
    explanation: [
      "と思う menempel setelah kalimat bentuk biasa.",
      "Digunakan untuk menyampaikan pendapat atau perkiraan pribadi pembicara."
    ],
    pattern: ["[Kalimat bentuk biasa] ＋ と思う ＝ saya pikir ~"],
    examples: [
      { jp: "明日は雨が降ると思います。", reading: "あしたはあめがふるとおもいます。", meaning: "Saya pikir besok akan turun hujan." },
      { jp: "この映画はおもしろいと思います。", reading: "このえいがはおもしろいとおもいます。", meaning: "Menurut saya film ini menarik." }
    ],
    quiz: [
      { id: "q1", words: ["明日は", "雨が降ると", "思います"], answer: ["明日は", "雨が降ると", "思います"] },
      { id: "q2", words: ["この映画は", "おもしろいと", "思います"], answer: ["この映画は", "おもしろいと", "思います"] }
    ]
  },
  {
    id: "n4u16", order: 16,
    grammar: "〜と言う", reading: "~to iu",
    meaning: "mengatakan bahwa ~",
    materialUrl: "tatabahasan4_toiu.html",
    explanation: [
      "と言う menempel setelah kalimat bentuk biasa untuk mengutip perkataan.",
      "Digunakan untuk menyampaikan sesuatu yang dikatakan oleh orang lain."
    ],
    pattern: ["[Kalimat bentuk biasa] ＋ と言う ＝ mengatakan bahwa ~"],
    examples: [
      { jp: "先生は明日休みだと言いました。", reading: "せんせいはあしたやすみだといいました。", meaning: "Guru mengatakan bahwa besok libur." },
      { jp: "彼は来ないと言いました。", reading: "かれはこないといいました。", meaning: "Dia bilang tidak akan datang." }
    ],
    quiz: [
      { id: "q1", words: ["先生は", "明日休みだと", "言いました"], answer: ["先生は", "明日休みだと", "言いました"] },
      { id: "q2", words: ["彼は", "来ないと", "言いました"], answer: ["彼は", "来ないと", "言いました"] }
    ]
  },
  {
    id: "n4u17", order: 17,
    grammar: "〜たことがある", reading: "~ta koto ga aru",
    meaning: "pernah melakukan ~",
    materialUrl: "tatabahasan4_takotogaaru.html",
    explanation: [
      "Dibentuk dari kata kerja bentuk た ditambah ことがある.",
      "Menyatakan pengalaman yang pernah dilakukan di masa lalu."
    ],
    pattern: ["[Kata Kerja bentuk た] ＋ ことがある ＝ pernah ~"],
    examples: [
      { jp: "富士山に登ったことがあります。", reading: "ふじさんにのぼったことがあります。", meaning: "Saya pernah mendaki Gunung Fuji." },
      { jp: "納豆を食べたことがありません。", reading: "なっとうをたべたことがありません。", meaning: "Saya belum pernah makan natto." }
    ],
    quiz: [
      { id: "q1", words: ["富士山に", "登った", "ことがあります"], answer: ["富士山に", "登った", "ことがあります"] },
      { id: "q2", words: ["納豆を", "食べた", "ことがありません"], answer: ["納豆を", "食べた", "ことがありません"] }
    ]
  },
  {
    id: "n4u18", order: 18,
    grammar: "〜たり〜たりする", reading: "~tari ~tari suru",
    meaning: "kadang ~ kadang ~",
    materialUrl: "tatabahasan4_tarisuru.html",
    explanation: [
      "Dibentuk dari kata kerja bentuk た ditambah り, diulang dua kali lalu diakhiri する.",
      "Menyatakan beberapa tindakan yang dilakukan sebagai contoh (tidak berurutan/lengkap)."
    ],
    pattern: ["[Kata Kerja bentuk た] ＋ り、[Kata Kerja bentuk た] ＋ り ＋ する ＝ kadang ~ kadang ~"],
    examples: [
      { jp: "週末は本を読んだり、映画を見たりします。", reading: "しゅうまつはほんをよんだり、えいがをみたりします。", meaning: "Di akhir pekan saya kadang membaca buku, kadang menonton film." },
      { jp: "部屋を掃除したり、洗濯したりしました。", reading: "へやをそうじしたり、せんたくしたりしました。", meaning: "Saya bersih-bersih kamar dan mencuci pakaian (di antara kegiatan lain)." }
    ],
    quiz: [
      { id: "q1", words: ["週末は", "本を読んだり、映画を見たり", "します"], answer: ["週末は", "本を読んだり、映画を見たり", "します"] },
      { id: "q2", words: ["部屋を", "掃除したり、洗濯したり", "しました"], answer: ["部屋を", "掃除したり、洗濯したり", "しました"] }
    ]
  }
];

// TODO: isi UNITS_N2/UNITS_N1 dengan pola yang sama seperti UNITS_N3/N4/N5 di
// atas supaya siswa yang sudah naik ke level tsb punya materi sungguhan.
const UNITS_N2 = [];
const UNITS_N1 = [];

const UNITS_BY_LEVEL = {
  N5: UNITS_N5,
  N4: UNITS_N4,
  N3: UNITS_N3,
  N2: UNITS_N2,
  N1: UNITS_N1,
};

function unitsForLevel(levelId){
  return UNITS_BY_LEVEL[levelId] || [];
}

/* ---------------------------------------------------------
   KANJI_N5 — CONTOH / SAMPEL (2 minggu pertama = 24 kanji).
   ------------------------------------------------------------
   ⚠️ Sama seperti UNITS_N5, ini baru contoh. Tambahkan kanji lagi
   dengan pola {id, kanji, reading, meaning} — setiap 12 kanji
   berturutan otomatis jadi kebutuhan hafalan 1 paket mingguan.
--------------------------------------------------------- */
const KANJI_N5 = [
  // Minggu 1 — angka dasar
  { id: "k01", kanji: "一", reading: "いち", meaning: "satu" },
  { id: "k02", kanji: "二", reading: "に", meaning: "dua" },
  { id: "k03", kanji: "三", reading: "さん", meaning: "tiga" },
  { id: "k04", kanji: "四", reading: "し・よん", meaning: "empat" },
  { id: "k05", kanji: "五", reading: "ご", meaning: "lima" },
  { id: "k06", kanji: "六", reading: "ろく", meaning: "enam" },
  { id: "k07", kanji: "七", reading: "しち・なな", meaning: "tujuh" },
  { id: "k08", kanji: "八", reading: "はち", meaning: "delapan" },
  { id: "k09", kanji: "九", reading: "きゅう・く", meaning: "sembilan" },
  { id: "k10", kanji: "十", reading: "じゅう", meaning: "sepuluh" },
  { id: "k11", kanji: "百", reading: "ひゃく", meaning: "seratus" },
  { id: "k12", kanji: "千", reading: "せん", meaning: "seribu" },
  // Minggu 2 — kata benda dasar sehari-hari
  { id: "k13", kanji: "日", reading: "にち・ひ", meaning: "hari / matahari" },
  { id: "k14", kanji: "月", reading: "げつ・つき", meaning: "bulan (kalender) / bulan (langit)" },
  { id: "k15", kanji: "火", reading: "か", meaning: "api" },
  { id: "k16", kanji: "水", reading: "すい", meaning: "air" },
  { id: "k17", kanji: "木", reading: "もく", meaning: "pohon / kayu" },
  { id: "k18", kanji: "金", reading: "きん", meaning: "emas / uang" },
  { id: "k19", kanji: "土", reading: "ど", meaning: "tanah" },
  { id: "k20", kanji: "人", reading: "ひと・じん", meaning: "orang" },
  { id: "k21", kanji: "本", reading: "ほん", meaning: "buku / asal" },
  { id: "k22", kanji: "年", reading: "ねん", meaning: "tahun" },
  { id: "k23", kanji: "時", reading: "じ", meaning: "waktu / jam" },
  { id: "k24", kanji: "分", reading: "ふん・ぶん", meaning: "menit / bagian" },
];

/* ---------------------------------------------------------
   KANJI_N3 — set dasar kanji tingkat menengah, dipakai sebagai
   sumber 10 soal Kanji per unit di UNITS_N3 (lihat buildUnitQuiz).
   ⚠️ Ini kanji contoh yang cukup umum dipakai di level N3 —
   tambahkan/ganti sesuai silabus Anda kalau perlu.
--------------------------------------------------------- */
const KANJI_N3 = [
  { id: "n3k01", kanji: "経験", reading: "けいけん", meaning: "pengalaman" },
  { id: "n3k02", kanji: "習慣", reading: "しゅうかん", meaning: "kebiasaan" },
  { id: "n3k03", kanji: "以外", reading: "いがい", meaning: "selain / kecuali" },
  { id: "n3k04", kanji: "続ける", reading: "つづける", meaning: "melanjutkan" },
  { id: "n3k05", kanji: "変化", reading: "へんか", meaning: "perubahan" },
  { id: "n3k06", kanji: "理由", reading: "りゆう", meaning: "alasan" },
  { id: "n3k07", kanji: "反対", reading: "はんたい", meaning: "menentang / berlawanan" },
  { id: "n3k08", kanji: "参加", reading: "さんか", meaning: "berpartisipasi" },
  { id: "n3k09", kanji: "解決", reading: "かいけつ", meaning: "penyelesaian masalah" },
  { id: "n3k10", kanji: "努力", reading: "どりょく", meaning: "usaha / kerja keras" },
  { id: "n3k11", kanji: "感謝", reading: "かんしゃ", meaning: "rasa terima kasih" },
  { id: "n3k12", kanji: "予定", reading: "よてい", meaning: "rencana / jadwal" },
  { id: "n3k13", kanji: "確認", reading: "かくにん", meaning: "konfirmasi / memastikan" },
  { id: "n3k14", kanji: "説明", reading: "せつめい", meaning: "penjelasan" },
  { id: "n3k15", kanji: "興味", reading: "きょうみ", meaning: "minat / ketertarikan" },
  { id: "n3k16", kanji: "関係", reading: "かんけい", meaning: "hubungan" },
  { id: "n3k17", kanji: "判断", reading: "はんだん", meaning: "keputusan / penilaian" },
  { id: "n3k18", kanji: "影響", reading: "えいきょう", meaning: "pengaruh" },
  { id: "n3k19", kanji: "状況", reading: "じょうきょう", meaning: "situasi / keadaan" },
  { id: "n3k20", kanji: "評価", reading: "ひょうか", meaning: "penilaian / evaluasi" },
];

/* ---------------------------------------------------------
   KANJI_N4 — 72 kanji pertama (6 minggu pertama x 12 kanji/minggu),
   selaras dengan 18 unit UNITS_N4 di atas.
   ------------------------------------------------------------
   Setiap kanji sekarang punya field `vocab` (contoh kosakata):
   { word, reading, meaning } — dipakai otomatis oleh
   buildKanjiQuestionsForUnit() di bawah supaya soal & kunci
   jawaban latihan kanji per-unit menampilkan contoh kosakatanya,
   bukan cuma karakter kanji sendirian.

   ⚠️ Ini baru 72 dari sekitar 168 kanji N4 yang umum diajarkan.
   Untuk menutupi 15 minggu penuh (45 unit ÷ 3), tambahkan kanji
   lagi dengan pola {id, kanji, reading, meaning, vocab} yang sama.
--------------------------------------------------------- */
const KANJI_N4 = [
  // Minggu 1
  { id: "n4k01", kanji: "会", reading: "あ(う)・かい", meaning: "bertemu / pertemuan", vocab: { word: "会う", reading: "あう", meaning: "bertemu" } },
  { id: "n4k02", kanji: "社", reading: "しゃ", meaning: "perusahaan / kuil", vocab: { word: "会社", reading: "かいしゃ", meaning: "perusahaan" } },
  { id: "n4k03", kanji: "員", reading: "いん", meaning: "anggota", vocab: { word: "社員", reading: "しゃいん", meaning: "karyawan" } },
  { id: "n4k04", kanji: "事", reading: "こと・じ", meaning: "hal / urusan", vocab: { word: "仕事", reading: "しごと", meaning: "pekerjaan" } },
  { id: "n4k05", kanji: "自", reading: "じ", meaning: "diri sendiri", vocab: { word: "自分", reading: "じぶん", meaning: "diri sendiri" } },
  { id: "n4k06", kanji: "家", reading: "いえ・か", meaning: "rumah / keluarga", vocab: { word: "家族", reading: "かぞく", meaning: "keluarga" } },
  { id: "n4k07", kanji: "族", reading: "ぞく", meaning: "suku / kaum", vocab: { word: "家族", reading: "かぞく", meaning: "keluarga" } },
  { id: "n4k08", kanji: "主", reading: "しゅ", meaning: "utama / tuan", vocab: { word: "主人", reading: "しゅじん", meaning: "suami / tuan rumah" } },
  { id: "n4k09", kanji: "発", reading: "はつ", meaning: "berangkat / muncul", vocab: { word: "出発", reading: "しゅっぱつ", meaning: "keberangkatan" } },
  { id: "n4k10", kanji: "業", reading: "ぎょう", meaning: "usaha / pelajaran", vocab: { word: "授業", reading: "じゅぎょう", meaning: "pelajaran" } },
  { id: "n4k11", kanji: "者", reading: "しゃ・もの", meaning: "orang (pelaku)", vocab: { word: "医者", reading: "いしゃ", meaning: "dokter" } },
  { id: "n4k12", kanji: "地", reading: "ち", meaning: "tanah / bumi", vocab: { word: "地図", reading: "ちず", meaning: "peta" } },

  // Minggu 2
  { id: "n4k13", kanji: "方", reading: "ほう・かた", meaning: "arah / cara", vocab: { word: "方法", reading: "ほうほう", meaning: "cara" } },
  { id: "n4k14", kanji: "場", reading: "ば・じょう", meaning: "tempat", vocab: { word: "場所", reading: "ばしょ", meaning: "tempat" } },
  { id: "n4k15", kanji: "立", reading: "た(つ)・りつ", meaning: "berdiri", vocab: { word: "立つ", reading: "たつ", meaning: "berdiri" } },
  { id: "n4k16", kanji: "開", reading: "あ(ける)・かい", meaning: "membuka", vocab: { word: "開ける", reading: "あける", meaning: "membuka" } },
  { id: "n4k17", kanji: "閉", reading: "し(める)・へい", meaning: "menutup", vocab: { word: "閉める", reading: "しめる", meaning: "menutup" } },
  { id: "n4k18", kanji: "集", reading: "あつ(める)・しゅう", meaning: "mengumpulkan", vocab: { word: "集める", reading: "あつめる", meaning: "mengumpulkan" } },
  { id: "n4k19", kanji: "動", reading: "うご(く)・どう", meaning: "bergerak", vocab: { word: "動く", reading: "うごく", meaning: "bergerak" } },
  { id: "n4k20", kanji: "働", reading: "はたら(く)・どう", meaning: "bekerja", vocab: { word: "働く", reading: "はたらく", meaning: "bekerja" } },
  { id: "n4k21", kanji: "感", reading: "かん", meaning: "rasa / merasakan", vocab: { word: "感じる", reading: "かんじる", meaning: "merasa" } },
  { id: "n4k22", kanji: "覚", reading: "おぼ(える)・かく", meaning: "mengingat", vocab: { word: "覚える", reading: "おぼえる", meaning: "mengingat" } },
  { id: "n4k23", kanji: "忘", reading: "わす(れる)・ぼう", meaning: "melupakan", vocab: { word: "忘れる", reading: "わすれる", meaning: "melupakan" } },
  { id: "n4k24", kanji: "決", reading: "き(める)・けつ", meaning: "memutuskan", vocab: { word: "決める", reading: "きめる", meaning: "memutuskan" } },

  // Minggu 3
  { id: "n4k25", kanji: "変", reading: "か(える)・へん", meaning: "mengubah / aneh", vocab: { word: "変える", reading: "かえる", meaning: "mengubah" } },
  { id: "n4k26", kanji: "続", reading: "つづ(ける)・ぞく", meaning: "melanjutkan", vocab: { word: "続ける", reading: "つづける", meaning: "melanjutkan" } },
  { id: "n4k27", kanji: "始", reading: "はじ(める)・し", meaning: "memulai", vocab: { word: "始める", reading: "はじめる", meaning: "memulai" } },
  { id: "n4k28", kanji: "終", reading: "お(わる)・しゅう", meaning: "berakhir", vocab: { word: "終わる", reading: "おわる", meaning: "berakhir" } },
  { id: "n4k29", kanji: "育", reading: "そだ(てる)・いく", meaning: "membesarkan", vocab: { word: "育てる", reading: "そだてる", meaning: "membesarkan" } },
  { id: "n4k30", kanji: "死", reading: "し(ぬ)・し", meaning: "mati", vocab: { word: "死ぬ", reading: "しぬ", meaning: "mati" } },
  { id: "n4k31", kanji: "生", reading: "う(まれる)・せい", meaning: "lahir / hidup", vocab: { word: "生まれる", reading: "うまれる", meaning: "lahir" } },
  { id: "n4k32", kanji: "経", reading: "けい", meaning: "melewati / mengalami", vocab: { word: "経験", reading: "けいけん", meaning: "pengalaman" } },
  { id: "n4k33", kanji: "験", reading: "けん", meaning: "ujian / percobaan", vocab: { word: "経験", reading: "けいけん", meaning: "pengalaman" } },
  { id: "n4k34", kanji: "使", reading: "つか(う)・し", meaning: "menggunakan", vocab: { word: "使う", reading: "つかう", meaning: "menggunakan" } },
  { id: "n4k35", kanji: "別", reading: "わか(れる)・べつ", meaning: "berpisah / lain", vocab: { word: "別れる", reading: "わかれる", meaning: "berpisah" } },
  { id: "n4k36", kanji: "送", reading: "おく(る)・そう", meaning: "mengirim", vocab: { word: "送る", reading: "おくる", meaning: "mengirim" } },

  // Minggu 4
  { id: "n4k37", kanji: "待", reading: "ま(つ)・たい", meaning: "menunggu", vocab: { word: "待つ", reading: "まつ", meaning: "menunggu" } },
  { id: "n4k38", kanji: "遅", reading: "おく(れる)・ち", meaning: "terlambat", vocab: { word: "遅れる", reading: "おくれる", meaning: "terlambat" } },
  { id: "n4k39", kanji: "急", reading: "いそ(ぐ)・きゅう", meaning: "buru-buru / mendadak", vocab: { word: "急ぐ", reading: "いそぐ", meaning: "buru-buru" } },
  { id: "n4k40", kanji: "特", reading: "とく", meaning: "khusus", vocab: { word: "特に", reading: "とくに", meaning: "khususnya" } },
  { id: "n4k41", kanji: "例", reading: "たと(えば)・れい", meaning: "contoh", vocab: { word: "例えば", reading: "たとえば", meaning: "misalnya" } },
  { id: "n4k42", kanji: "実", reading: "じつ", meaning: "kenyataan / sungguhan", vocab: { word: "実は", reading: "じつは", meaning: "sebenarnya" } },
  { id: "n4k43", kanji: "全", reading: "ぜん", meaning: "seluruh / semua", vocab: { word: "全部", reading: "ぜんぶ", meaning: "semua" } },
  { id: "n4k44", kanji: "部", reading: "ぶ", meaning: "bagian", vocab: { word: "部分", reading: "ぶぶん", meaning: "bagian" } },
  { id: "n4k45", kanji: "半", reading: "はん", meaning: "setengah", vocab: { word: "半分", reading: "はんぶん", meaning: "setengah" } },
  { id: "n4k46", kanji: "台", reading: "だい", meaning: "meja / dasar (kata bantu bilangan)", vocab: { word: "台所", reading: "だいどころ", meaning: "dapur" } },
  { id: "n4k47", kanji: "所", reading: "しょ・ところ", meaning: "tempat", vocab: { word: "近所", reading: "きんじょ", meaning: "tetangga / sekitar rumah" } },
  { id: "n4k48", kanji: "近", reading: "ちか(い)・きん", meaning: "dekat", vocab: { word: "近く", reading: "ちかく", meaning: "dekat / sekitar" } },

  // Minggu 5
  { id: "n4k49", kanji: "遠", reading: "とお(い)・えん", meaning: "jauh", vocab: { word: "遠い", reading: "とおい", meaning: "jauh" } },
  { id: "n4k50", kanji: "太", reading: "ふと(る)・たい", meaning: "gemuk", vocab: { word: "太る", reading: "ふとる", meaning: "menjadi gemuk" } },
  { id: "n4k51", kanji: "細", reading: "ほそ(い)・さい", meaning: "kurus / tipis", vocab: { word: "細い", reading: "ほそい", meaning: "kurus / tipis" } },
  { id: "n4k52", kanji: "重", reading: "おも(い)・じゅう", meaning: "berat", vocab: { word: "重い", reading: "おもい", meaning: "berat" } },
  { id: "n4k53", kanji: "軽", reading: "かる(い)・けい", meaning: "ringan", vocab: { word: "軽い", reading: "かるい", meaning: "ringan" } },
  { id: "n4k54", kanji: "強", reading: "つよ(い)・きょう", meaning: "kuat", vocab: { word: "強い", reading: "つよい", meaning: "kuat" } },
  { id: "n4k55", kanji: "弱", reading: "よわ(い)・じゃく", meaning: "lemah", vocab: { word: "弱い", reading: "よわい", meaning: "lemah" } },
  { id: "n4k56", kanji: "明", reading: "あか(るい)・めい", meaning: "terang / jelas", vocab: { word: "明るい", reading: "あかるい", meaning: "terang" } },
  { id: "n4k57", kanji: "暗", reading: "くら(い)・あん", meaning: "gelap", vocab: { word: "暗い", reading: "くらい", meaning: "gelap" } },
  { id: "n4k58", kanji: "静", reading: "しず(か)・せい", meaning: "tenang", vocab: { word: "静か", reading: "しずか", meaning: "tenang" } },
  { id: "n4k59", kanji: "危", reading: "あぶ(ない)・き", meaning: "berbahaya", vocab: { word: "危ない", reading: "あぶない", meaning: "berbahaya" } },
  { id: "n4k60", kanji: "忙", reading: "いそが(しい)・ぼう", meaning: "sibuk", vocab: { word: "忙しい", reading: "いそがしい", meaning: "sibuk" } },

  // Minggu 6
  { id: "n4k61", kanji: "品", reading: "しな・ひん", meaning: "barang", vocab: { word: "品物", reading: "しなもの", meaning: "barang" } },
  { id: "n4k62", kanji: "物", reading: "もの・ぶつ", meaning: "benda / barang", vocab: { word: "食べ物", reading: "たべもの", meaning: "makanan" } },
  { id: "n4k63", kanji: "味", reading: "あじ・み", meaning: "rasa", vocab: { word: "味", reading: "あじ", meaning: "rasa" } },
  { id: "n4k64", kanji: "色", reading: "いろ・しょく", meaning: "warna", vocab: { word: "色", reading: "いろ", meaning: "warna" } },
  { id: "n4k65", kanji: "音", reading: "おと・おん", meaning: "suara / bunyi", vocab: { word: "音楽", reading: "おんがく", meaning: "musik" } },
  { id: "n4k66", kanji: "楽", reading: "たの(しい)・らく", meaning: "menyenangkan / musik", vocab: { word: "楽しい", reading: "たのしい", meaning: "menyenangkan" } },
  { id: "n4k67", kanji: "声", reading: "こえ・せい", meaning: "suara (manusia)", vocab: { word: "声", reading: "こえ", meaning: "suara" } },
  { id: "n4k68", kanji: "顔", reading: "かお・がん", meaning: "wajah", vocab: { word: "顔", reading: "かお", meaning: "wajah" } },
  { id: "n4k69", kanji: "首", reading: "くび・しゅ", meaning: "leher", vocab: { word: "首", reading: "くび", meaning: "leher" } },
  { id: "n4k70", kanji: "髪", reading: "かみ・はつ", meaning: "rambut", vocab: { word: "髪", reading: "かみ", meaning: "rambut" } },
  { id: "n4k71", kanji: "若", reading: "わか(い)・じゃく", meaning: "muda", vocab: { word: "若い", reading: "わかい", meaning: "muda" } },
  { id: "n4k72", kanji: "老", reading: "ろう・お(いる)", meaning: "tua", vocab: { word: "老人", reading: "ろうじん", meaning: "orang tua / lansia" } },
];

// TODO: isi kanji level lain dengan pola yang sama.
const KANJI_N2 = [];
const KANJI_N1 = [];

const KANJI_BY_LEVEL = {
  N5: KANJI_N5,
  N4: KANJI_N4,
  N3: KANJI_N3,
  N2: KANJI_N2,
  N1: KANJI_N1,
};

function kanjiForLevel(levelId){
  return KANJI_BY_LEVEL[levelId] || [];
}

/* Dipertahankan untuk kompatibilitas mundur — ini metadata level statis
   (tanpa status, karena status sekarang dihitung per siswa). Kalau ada
   kode lama yang masih membaca `LEVELS` langsung, sebaiknya diganti ke
   `TekiStore.getLevelStates(student)`. */
const LEVELS = LEVEL_META.map(l => ({ ...l, status: "aktif" }));

/* ---------------------------------------------------------
   2. UTIL TANGGAL & ARRAY
--------------------------------------------------------- */
function nowISO() { return new Date().toISOString(); }
function addDays(iso, days) {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}
function daysBetween(isoA, isoB) {
  return Math.round((new Date(isoB) - new Date(isoA)) / 86400000);
}
function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  const bulan = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
  return d.getDate() + " " + bulan[d.getMonth()] + " " + d.getFullYear();
}
function chunkArray(arr, size){
  const out = [];
  for(let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
function shuffleArray(arr){
  const a = [...arr];
  for(let i = a.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ---------------------------------------------------------
   3. PAKET MINGGUAN (BUNPOU + KANJI) — dipakai untuk level yang
   sudah punya data Kanji (lihat KANJI_BY_LEVEL), misalnya N5, N4.
   Level yang belum punya data Kanji (mis. N3 saat ini) tetap
   pakai alur unit-per-unit yang lama, supaya tidak ada yang rusak.
--------------------------------------------------------- */
function levelUsesWeeklyPackages(levelId){
  return kanjiForLevel(levelId).length > 0;
}

function getWeekPackagesForLevel(levelId){
  const bunpouChunks = chunkArray(unitsForLevel(levelId), BUNPOU_PER_WEEK);
  const kanjiChunks = chunkArray(kanjiForLevel(levelId), KANJI_PER_WEEK);
  const count = Math.max(bunpouChunks.length, kanjiChunks.length);
  const packages = [];
  for(let i = 0; i < count; i++){
    packages.push({
      index: i,
      week: i + 1,
      bunpouUnits: bunpouChunks[i] || [],
      kanjiBatch: kanjiChunks[i] || [],
    });
  }
  return packages;
}

/** Bikin soal pilihan ganda kanji dari 1 batch (mis. 12 kanji minggu ini).
    Tiap soal: tampilkan karakter kanji, siswa pilih arti/bacaan yang benar
    dari 4 opsi (distraktor diambil acak dari kanji lain di level yang sama). */
function buildKanjiQuiz(levelId, batch){
  const pool = kanjiForLevel(levelId);

  return batch.map((k, index) => {
    const isReadingQuestion = index % 2 === 1;

    if(isReadingQuestion){
      const distractors = shuffleArray(
        pool.filter(x => x.id !== k.id).map(x => x.reading)
      ).slice(0, 3);

      return {
        id: `${k.id}_weekly_reading`,
        kanji: k.kanji,
        reading: k.reading,
        questionType: "reading",
        prompt: `Bagaimana cara membaca kanji 「${k.kanji}」?`,
        correct: k.reading,
        options: shuffleArray([k.reading, ...distractors]),
        vocab: k.vocab || null
      };
    }

    const distractors = shuffleArray(
      pool.filter(x => x.id !== k.id).map(x => x.meaning)
    ).slice(0, 3);

    return {
      id: `${k.id}_weekly_meaning`,
      kanji: k.kanji,
      reading: k.reading,
      questionType: "meaning",
      prompt: `Apa arti kanji 「${k.kanji}」?`,
      correct: k.meaning,
      options: shuffleArray([k.meaning, ...distractors]),
      vocab: k.vocab || null
    };
  });
}

/* ---------------------------------------------------------
   3b. SOAL LATIHAN PER UNIT (20 soal: 10 Tata Bahasa + 10 Kanji)
   ------------------------------------------------------------
   Dipakai oleh halaman unit di siswa.html. Digabung jadi 1 fungsi
   supaya konsisten untuk SEMUA level (baik yang pakai paket
   mingguan seperti N5/N4 maupun yang tidak seperti N3).

   - 10 soal Tata Bahasa: 5 Pilihan Ganda + 5 Esai, dibangun dari
     pola/kalimat contoh/susun-kata milik unit itu sendiri, dengan
     distraktor pilihan ganda diambil dari unit lain di level yang
     sama (kalau tersedia).
   - 10 soal Kanji: 5 Pilihan Ganda (arti, disertai contoh kosakata)
     + 5 Esai (bacaan + contoh kosakata), diambil dari daftar Kanji
     level tsb (lihat KANJI_BY_LEVEL), bergeser per unit supaya unit
     yang berbeda dapat kanji yang berbeda-beda kalau pool-nya cukup
     besar.
--------------------------------------------------------- */

/** Ambil `count` kanji dari `pool`, mulai dari `startIndex`, berputar
    balik ke awal kalau pool lebih pendek dari yang dibutuhkan. */
function pickKanjiWindow(pool, startIndex, count){
  if(!pool.length) return [];
  const out = [];
  for(let i = 0; i < count; i++){
    out.push(pool[(startIndex + i) % pool.length]);
  }
  return out;
}

function buildGrammarQuestionsForUnit(levelId, unit){
  const allUnits = unitsForLevel(levelId);
  const otherMeanings = allUnits.filter(u => u.id !== unit.id).map(u => u.meaning);
  const otherSentences = allUnits.filter(u => u.id !== unit.id).flatMap(u => u.examples.map(e => e.jp));
  const otherExampleMeanings = allUnits.filter(u => u.id !== unit.id).flatMap(u => u.examples.map(e => e.meaning));

  const mkOptions = (correct, distractorPool, n = 3) => {
    const pool = shuffleArray(distractorPool.filter(v => v !== correct)).slice(0, n);
    // jaga-jaga kalau distraktor kurang dari n (level dengan sedikit unit)
    while(pool.length < n) pool.push(correct + " ");
    return shuffleArray([correct, ...pool]);
  };

  const qs = [];

  // --- 5 PILIHAN GANDA ---
  qs.push({
    id: `${unit.id}_gmc1`, type: "mc",
    prompt: `Apa arti dari pola tata bahasa "${unit.grammar}"?`,
    correct: unit.meaning,
    options: mkOptions(unit.meaning, otherMeanings)
  });
  qs.push({
    id: `${unit.id}_gmc2`, type: "mc",
    prompt: `Kalimat manakah yang benar menggunakan pola "${unit.grammar}"?`,
    correct: unit.examples[0].jp,
    options: mkOptions(unit.examples[0].jp, otherSentences)
  });
  unit.examples.forEach((e, i) => {
    qs.push({
      id: `${unit.id}_gmc_ex${i + 1}`, type: "mc",
      prompt: `Apa arti kalimat berikut? "${e.jp}"`,
      correct: e.meaning,
      options: mkOptions(e.meaning, otherExampleMeanings.length ? otherExampleMeanings : otherMeanings)
    });
  });
  // pastikan tepat 5 MC (kalau examples < 2, tambahkan soal pola sekali lagi dgn variasi)
  while(qs.length < 5){
    qs.push({
      id: `${unit.id}_gmc_extra${qs.length}`, type: "mc",
      prompt: `Manakah arti yang paling tepat untuk pola "${unit.grammar}"?`,
      correct: unit.meaning,
      options: mkOptions(unit.meaning, otherMeanings)
    });
  }

  // --- 5 ESAI ---
  (unit.quiz || []).forEach((q, i) => {
    qs.push({
      id: `${unit.id}_ges_susun${i + 1}`, type: "essay",
      prompt: `Susun kata-kata berikut menjadi kalimat yang benar: ${shuffleArray(q.words).join(" / ")}`,
      answer: q.answer.join("")
    });
  });
  unit.examples.forEach((e, i) => {
    qs.push({
      id: `${unit.id}_ges_trans${i + 1}`, type: "essay",
      prompt: `Terjemahkan kalimat berikut ke Bahasa Indonesia: ${e.jp}`,
      answer: e.meaning
    });
  });
  qs.push({
    id: `${unit.id}_ges_own`, type: "essay",
    prompt: `Buatlah 1 kalimat sendiri (dalam Bahasa Jepang) menggunakan pola "${unit.grammar}", lalu tuliskan artinya.`,
    answer: `Gunakan pola: ${unit.pattern.join(" / ")}. Contoh: ${unit.examples[0].jp} (${unit.examples[0].meaning})`
  });

  return qs.slice(0, GRAMMAR_Q_PER_UNIT);
}

function buildKanjiQuestionsForUnit(levelId, unit, unitIndex){
  const pool = kanjiForLevel(levelId);
  if(!pool.length){
    return [{
      id: `${unit.id}_kanji_none`, type: "essay",
      prompt: "Belum ada data Kanji untuk level ini — lewati soal ini.",
      answer: "-"
    }];
  }

  // 10 soal Kanji per unit:
  // 3 PG arti + 3 PG cara baca + 2 esai cara baca + 2 esai membuat kalimat.
  const selected = pickKanjiWindow(
    pool,
    (unitIndex * KANJI_Q_PER_UNIT) % pool.length,
    KANJI_Q_PER_UNIT
  );

  const qs = [];

  // 3 soal arti Kanji (pilihan ganda)
  selected.slice(0, 3).forEach(k => {
    const distractors = shuffleArray(
      pool.filter(x => x.id !== k.id).map(x => x.meaning)
    ).slice(0, 3);

    const vocabHint = k.vocab
      ? ` (Contoh kosakata: ${k.vocab.word})`
      : "";

    qs.push({
      id: `${unit.id}_kmeaning_${k.id}`,
      type: "mc",
      prompt: `Apa arti kanji berikut? ${k.kanji}${vocabHint}`,
      correct: k.meaning,
      options: shuffleArray([k.meaning, ...distractors])
    });
  });

  // 3 soal cara baca Kanji (pilihan ganda)
  selected.slice(3, 6).forEach(k => {
    const distractors = shuffleArray(
      pool.filter(x => x.id !== k.id).map(x => x.reading)
    ).slice(0, 3);

    qs.push({
      id: `${unit.id}_kreading_${k.id}`,
      type: "mc",
      prompt: `Bagaimana cara membaca kanji berikut? ${k.kanji}`,
      correct: k.reading,
      options: shuffleArray([k.reading, ...distractors])
    });
  });

  // 2 soal esai: siswa menulis cara baca.
  selected.slice(6, 8).forEach(k => {
    const vocabAnswer = k.vocab
      ? ` Contoh kosakata: ${k.vocab.word}（${k.vocab.reading}）`
      : "";

    qs.push({
      id: `${unit.id}_kessay_reading_${k.id}`,
      type: "essay",
      prompt: `Tuliskan cara baca kanji berikut dalam hiragana/katakana: ${k.kanji}`,
      answer: `${k.reading}（${k.meaning}）.${vocabAnswer}`
    });
  });

  // 2 soal esai: membuat kalimat memakai kosakata Kanji.
  selected.slice(8, 10).forEach(k => {
    const word = k.vocab?.word || k.kanji;
    const reading = k.vocab?.reading || k.reading;
    const meaning = k.vocab?.meaning || k.meaning;

    qs.push({
      id: `${unit.id}_kessay_sentence_${k.id}`,
      type: "essay",
      prompt: `Buat 1 kalimat bahasa Jepang menggunakan kosakata 「${word}」(${reading} = ${meaning}).`,
      answer: `Jawaban bebas. Contoh penggunaan: 「${word}」を使って、kalimat bahasa Jepang yang benar.`
    });
  });

  return qs.slice(0, KANJI_Q_PER_UNIT);
}

/** Fungsi utama: bangun 20 soal latihan (10 Tata Bahasa + 10 Kanji)
    untuk 1 unit tertentu di 1 level tertentu. */
function buildUnitQuiz(levelId, unitId){
  const units = unitsForLevel(levelId);
  const unit = units.find(u => u.id === unitId);
  if(!unit) return { grammarQuestions: [], kanjiQuestions: [] };
  const unitIndex = Math.max(0, units.findIndex(u => u.id === unitId));
  return {
    grammarQuestions: buildGrammarQuestionsForUnit(levelId, unit),
    kanjiQuestions: buildKanjiQuestionsForUnit(levelId, unit, unitIndex)
  };
}

/* ---------------------------------------------------------
   4. STORE API  (localStorage — ganti ke backend di sini nanti)
--------------------------------------------------------- */
const TekiStore = {

  _readAll() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  },

  _writeAll(students) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
  },

  /** Seed data contoh — hanya dipakai kalau localStorage masih kosong */
  _seed() {
    const mk = (code, name, unitsDone, opts = {}) => {
      const progress = {};
      let cursor = opts.startedDaysAgo ?? (unitsDone * 6 + 3);
      const startBase = addDays(nowISO(), -cursor);
      let unlockAt = startBase;
      UNITS_N3.forEach((u, i) => {
        if (i < unitsDone) {
          const score = opts.scores?.[i] ?? (75 + ((i * 7) % 20));
          const completedAt = addDays(unlockAt, 2 + (i % 3));
          progress[u.id] = {
            status: "selesai",
            unlockedAt: unlockAt,
            deadline: addDays(unlockAt, UNIT_DEADLINE_DAYS),
            score,
            completedAt,
            attempts: [{ date: completedAt, score }]
          };
          unlockAt = completedAt;
        } else if (i === unitsDone) {
          progress[u.id] = {
            status: "berjalan",
            unlockedAt: unlockAt,
            deadline: addDays(unlockAt, UNIT_DEADLINE_DAYS),
            score: null,
            completedAt: null,
            attempts: []
          };
        }
      });
      return {
        code, name, level: "N3",
        joinedAt: addDays(nowISO(), -(cursor + 20)),
        levelStartedAt: addDays(nowISO(), -(cursor + 20)),
        lastActiveAt: addDays(nowISO(), -(opts.inactiveDays ?? 0)),
        progress,
        weekProgress: {},
        finalExam: {}
      };
    };

    const students = [
      mk("PTPR07", "NIKO",   4, { inactiveDays: 1 }),
      mk("PTPR06", "RINGGA", 3, { inactiveDays: 2 }),
      mk("PTPR03", "SHOMAD", 5, { inactiveDays: 3, scores:[92,95,90,88,94] }),
      mk("PTPR01", "TRIANTO",1, { inactiveDays: 21 }),
      mk("PTPR04", "JONI",   3, { inactiveDays: 1 }),
      mk("PTPR05", "FERIAN", 2, { inactiveDays: 6 }),
      mk("PTPR02", "LUKI",   0, { inactiveDays: 18, startedDaysAgo: 3 }),
    ];
    this._writeAll(students);
    return students;
  },

  getAllStudents() {
    let students = this._readAll();
    if (!students) students = this._seed();
    return students;
  },

  /**
   * Daftarkan siswa baru.
   * `level` menentukan DI LEVEL MANA siswa ini mulai belajar —
   * ini kunci untuk siswa baru yang levelnya N5/N4 (pemula):
   *   TekiStore.addStudent("ABCD01", "Nama Siswa", "N5")
   *   TekiStore.addStudent("ABCD02", "Nama Siswa", "N4")
   * Siswa akan langsung melihat unit-unit level tsb sebagai level
   * aktifnya, dan level sebelum itu di LEVEL_ORDER otomatis
   * dianggap "selesai" (dilewati/di luar cakupan platform ini).
   * Return {ok:true} atau {ok:false, message}
   */
  addStudent(code, name, level = "N5") {
    code = (code || "").trim().toUpperCase();
    name = (name || "").trim();
    level = (level || "N5").trim().toUpperCase();
    if (!code || !name) return { ok: false, message: "Kode dan nama wajib diisi." };
    if (!LEVEL_ORDER.includes(level)) return { ok: false, message: "Level tidak dikenali: " + level };
    const students = this.getAllStudents();
    if (students.some(s => s.code === code)) return { ok: false, message: "Kode siswa sudah dipakai." };
    students.push({
      code, name, level,
      joinedAt: nowISO(),
      levelStartedAt: nowISO(),
      lastActiveAt: nowISO(),
      progress: {},
      weekProgress: {},
      finalExam: {}
    });
    this._writeAll(students);
    return { ok: true };
  },

  /** Hapus siswa dari daftar (opsional dipakai guru) */
  removeStudent(code) {
    const students = this.getAllStudents().filter(s => s.code !== code);
    this._writeAll(students);
  },

  getStudent(code) {
    const s = this.getAllStudents().find(s => s.code === code) || null;
    if (s) {
      if (!s.weekProgress) s.weekProgress = {};
      if (!s.finalExam) s.finalExam = {};
      if (!s.levelStartedAt) s.levelStartedAt = s.joinedAt || nowISO();
    }
    return s;
  },

  touchLastActive(code) {
    const students = this.getAllStudents();
    const s = students.find(x => x.code === code);
    if (s) { s.lastActiveAt = nowISO(); this._writeAll(students); }
  },

  /** Status tiap level (selesai/aktif/terkunci) UNTUK SISWA INI,
      berdasarkan posisi student.level di LEVEL_ORDER. */
  getLevelStates(student) {
    const currentIdx = LEVEL_ORDER.indexOf(student.level);
    return LEVEL_META.map((l, i) => {
      let status;
      if (currentIdx === -1) status = "terkunci";
      else if (i < currentIdx) status = "selesai";
      else if (i === currentIdx) status = "aktif";
      else status = "terkunci";
      return { ...l, status };
    });
  },

  /** Apakah level aktif siswa memakai sistem paket mingguan (bunpou+kanji)? */
  usesWeeklyPackages(levelId){
    return levelUsesWeeklyPackages(levelId);
  },

  /** Bangun 20 soal latihan (10 Tata Bahasa + 10 Kanji, campuran
      Pilihan Ganda & Esai) untuk 1 unit — dipakai di halaman unit. */
  buildUnitQuiz(levelId, unitId){
    return buildUnitQuiz(levelId, unitId);
  },

  /** Info batas waktu keseluruhan level (mis. N5/N4 = 90 hari), dihitung
      sejak student.levelStartedAt. Return null kalau level tsb belum
      diatur batas waktunya. */
  getLevelDeadlineInfo(student) {
    const days = LEVEL_DURATION_DAYS[student.level];
    if (!days || !student.levelStartedAt) return null;
    const deadline = addDays(student.levelStartedAt, days);
    const daysLeft = daysBetween(nowISO(), deadline);
    return { totalDays: days, deadline, daysLeft, overdue: daysLeft < 0 };
  },

  /** Susun daftar unit dengan status terkunci/berjalan/selesai + tenggat,
      untuk LEVEL AKTIF siswa (student.level). Dipakai untuk level yang
      TIDAK memakai paket mingguan (mis. N3). */
  getUnitStates(student) {
    const units = unitsForLevel(student.level);
    let previousDone = true;
    return units.map((u) => {
      let p = student.progress[u.id];
      if (!p && previousDone) {
        // Unit baru terbuka pertama kali dilihat
        const unlockedAt = nowISO();
        p = { status: "berjalan", unlockedAt, deadline: addDays(unlockedAt, UNIT_DEADLINE_DAYS), score: null, completedAt: null, attempts: [] };
        student.progress[u.id] = p;
        this._persistStudent(student);
      }
      const state = p ? p.status : "terkunci";
      const overdue = p && state !== "selesai" && new Date() > new Date(p.deadline);
      previousDone = state === "selesai";
      return { ...u, state, overdue, progress: p || null };
    });
  },

  /** Susun paket mingguan (3 bunpou + 12 kanji) dengan status masing-masing,
      untuk LEVEL AKTIF siswa. Return null kalau level ini tidak memakai
      sistem paket mingguan (pemanggil sebaiknya fallback ke getUnitStates).
      Paket ke-N (dan seluruh isinya) baru berstatus "berjalan"/terbuka
      SETELAH paket ke-(N-1) berstatus "selesai" — sebelum itu tetap
      "terkunci" (lihat tampilan .locked / 🔒 di siswa.html). */
  getWeekStates(student) {
    const levelId = student.level;
    if (!levelUsesWeeklyPackages(levelId)) return null;
    const packages = getWeekPackagesForLevel(levelId);
    if (!student.weekProgress) student.weekProgress = {};
    if (!student.weekProgress[levelId]) student.weekProgress[levelId] = {};
    const wp = student.weekProgress[levelId];

    let previousDone = true;
    let dirty = false;
    const result = packages.map(pkg => {
      let p = wp[pkg.index];
      if (!p && previousDone) {
        const unlockedAt = nowISO();
        p = { status: "berjalan", unlockedAt, deadline: addDays(unlockedAt, WEEK_DEADLINE_DAYS), bunpou: {}, kanji: null, completedAt: null };
        wp[pkg.index] = p;
        dirty = true;
      }
      const state = p ? p.status : "terkunci";
      const overdue = !!p && state !== "selesai" && new Date() > new Date(p.deadline);
      previousDone = state === "selesai";
      const bunpouDoneCount = pkg.bunpouUnits.filter(u => p?.bunpou?.[u.id]?.passed).length;
      const kanjiDone = !!p?.kanji?.passed;
      return { ...pkg, state, overdue, progress: p || null, bunpouDoneCount, bunpouTotal: pkg.bunpouUnits.length, kanjiDone };
    });
    if (dirty) this._persistStudent(student);
    return result;
  },

  _persistStudent(student) {
    const students = this.getAllStudents();
    const idx = students.findIndex(s => s.code === student.code);
    if (idx > -1) students[idx] = student; else students.push(student);
    this._writeAll(students);
  },

  /** Kirim hasil latihan untuk sebuah unit di level aktif siswa
      (hanya untuk level yang TIDAK memakai paket mingguan, mis. N3).
      Kalau ini unit terakhir di level tsb dan lulus, siswa otomatis
      naik ke level berikutnya di LEVEL_ORDER (kalau levelnya sudah
      punya materi). `totalCount` sekarang biasanya 20 (10 Tata
      Bahasa + 10 Kanji), tapi fungsi ini generik terhadap jumlah
      soal apa pun. */
  submitUnitResult(code, unitId, correctCount, totalCount) {
    const student = this.getStudent(code);
    if (!student) return null;
    const score = Math.round((correctCount / totalCount) * 100);
    const passed = score >= PASS_SCORE;
    const p = student.progress[unitId] || { unlockedAt: nowISO(), deadline: addDays(nowISO(), UNIT_DEADLINE_DAYS), attempts: [] };
    p.attempts = [...(p.attempts || []), { date: nowISO(), score }];
    p.score = score;
    if (passed) {
      p.status = "selesai";
      p.completedAt = nowISO();
    } else {
      p.status = "berjalan";
    }
    student.progress[unitId] = p;
    student.lastActiveAt = nowISO();

    let leveledUp = false;
    if (passed) {
      const levelUnits = unitsForLevel(student.level);
      const allDone = levelUnits.length > 0 && levelUnits.every(u => student.progress[u.id]?.status === "selesai");
      if (allDone) {
        const idx = LEVEL_ORDER.indexOf(student.level);
        const nextLevel = idx > -1 ? LEVEL_ORDER[idx + 1] : null;
        if (nextLevel && unitsForLevel(nextLevel).length > 0) {
          student.level = nextLevel;
          student.levelStartedAt = nowISO();
          leveledUp = true;
        }
      }
    }

    this._persistStudent(student);
    return { score, passed, leveledUp, newLevel: student.level };
  },

  /** Kirim hasil kuis 1 unit Bunpou DI DALAM sebuah paket mingguan
      (level yang memakai sistem paket, mis. N5/N4). `totalCount` sekarang
      biasanya 20 (10 Tata Bahasa + 10 Kanji milik unit tsb). */
  submitBunpouInPackage(code, levelId, packageIndex, unitId, correctCount, totalCount) {
    const student = this.getStudent(code);
    if (!student) return null;
    const score = Math.round((correctCount / totalCount) * 100);
    const passed = score >= PASS_SCORE;
    this.getWeekStates(student); // pastikan paket sudah ter-inisialisasi
    const p = student.weekProgress[levelId]?.[packageIndex];
    if (!p) return null;
    p.bunpou[unitId] = { score, passed, date: nowISO() };
    student.lastActiveAt = nowISO();
    const done = this._checkPackageCompletion(student, levelId, packageIndex);
    this._persistStudent(student);
    return { score, passed, ...done };
  },

  /** Kirim hasil kuis Kanji (pilihan ganda) untuk 1 paket mingguan. */
  submitKanjiInPackage(code, levelId, packageIndex, correctCount, totalCount) {
    const student = this.getStudent(code);
    if (!student) return null;
    const score = Math.round((correctCount / totalCount) * 100);
    const passed = score >= PASS_SCORE;
    this.getWeekStates(student);
    const p = student.weekProgress[levelId]?.[packageIndex];
    if (!p) return null;
    p.kanji = { score, passed, date: nowISO() };
    student.lastActiveAt = nowISO();
    const done = this._checkPackageCompletion(student, levelId, packageIndex);
    this._persistStudent(student);
    return { score, passed, ...done };
  },

  _checkPackageCompletion(student, levelId, packageIndex) {
    const packages = getWeekPackagesForLevel(levelId);
    const pkg = packages[packageIndex];
    const p = student.weekProgress[levelId][packageIndex];
    if (!pkg || !p) return { packageCompleted: false, allPackagesDone: false };
    const allBunpouPassed = pkg.bunpouUnits.every(u => p.bunpou[u.id]?.passed);
    const kanjiPassed = pkg.kanjiBatch.length === 0 || !!p.kanji?.passed;
    let packageCompleted = false;
    if (allBunpouPassed && kanjiPassed && p.status !== "selesai") {
      p.status = "selesai";
      p.completedAt = nowISO();
      packageCompleted = true;
    }
    const allPackagesDone = packages.length > 0 && packages.every((_, i) => student.weekProgress[levelId][i]?.status === "selesai");
    return { packageCompleted, allPackagesDone };
  },

  /** Apakah siswa sudah boleh mengambil Ujian Akhir level (semua paket
      mingguan levelnya sudah lulus)? */
  canTakeFinalExam(student) {
    const levelId = student.level;
    if (!levelUsesWeeklyPackages(levelId)) return false;
    const packages = getWeekPackagesForLevel(levelId);
    const wp = student.weekProgress?.[levelId] || {};
    return packages.length > 0 && packages.every((_, i) => wp[i]?.status === "selesai");
  },

  /** Susun soal Ujian Akhir: gabungan 1 soal susun-kalimat per unit Bunpou
      + kuis pilihan ganda Kanji (maks 12 kanji diambil acak dari level ini). */
  buildFinalExam(levelId) {
    const units = unitsForLevel(levelId);
    const kanjiPool = kanjiForLevel(levelId);
    const bunpouQuestions = units.map(u => ({ type: "bunpou", unitId: u.id, grammar: u.grammar, ...u.quiz[0] }));
    const kanjiSample = shuffleArray(kanjiPool).slice(0, Math.min(12, kanjiPool.length));
    const kanjiQuestions = buildKanjiQuiz(levelId, kanjiSample);
    return { bunpouQuestions, kanjiQuestions };
  },

  /** Kirim hasil Ujian Akhir. Kalau lulus (>= FINAL_EXAM_PASS_SCORE),
      siswa naik ke level berikutnya di LEVEL_ORDER. */
  submitFinalExam(code, correctCount, totalCount) {
    const student = this.getStudent(code);
    if (!student) return null;
    const levelId = student.level;
    const score = Math.round((correctCount / totalCount) * 100);
    const passed = score >= FINAL_EXAM_PASS_SCORE;
    if (!student.finalExam) student.finalExam = {};
    const prevAttempts = student.finalExam[levelId]?.attempts || [];
    student.finalExam[levelId] = {
      status: passed ? "selesai" : "berjalan",
      score,
      completedAt: passed ? nowISO() : null,
      attempts: [...prevAttempts, { date: nowISO(), score }]
    };
    let leveledUp = false;
    if (passed) {
      const idx = LEVEL_ORDER.indexOf(levelId);
      const nextLevel = idx > -1 ? LEVEL_ORDER[idx + 1] : null;
      if (nextLevel) {
        student.level = nextLevel;
        student.levelStartedAt = nowISO();
        leveledUp = true;
      }
    }
    student.lastActiveAt = nowISO();
    this._persistStudent(student);
    return { score, passed, leveledUp, newLevel: student.level };
  },

  buildKanjiQuizForPackage(levelId, packageIndex) {
    const packages = getWeekPackagesForLevel(levelId);
    const pkg = packages[packageIndex];
    if (!pkg) return [];
    return buildKanjiQuiz(levelId, pkg.kanjiBatch);
  },

  getWeekPackagesForLevel(levelId){
    return getWeekPackagesForLevel(levelId);
  },

  /** Ringkasan progres 1 siswa untuk level yang TIDAK memakai paket
      mingguan (mis. N3) — dipakai untuk kartu / panel guru. */
  summarize(student) {
    const units = this.getUnitStates(student);
    const totalUnits = unitsForLevel(student.level).length;
    const done = units.filter(u => u.state === "selesai");
    const scores = done.map(u => u.progress.score);
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    const inactiveDays = Math.max(0, daysBetween(student.lastActiveAt, nowISO()));
    const anyOverdue = units.some(u => u.overdue);
    let status;
    if (totalUnits === 0) status = { key: "warn", label: "○ Materi belum tersedia" };
    else if (avg === null || inactiveDays > 14) status = { key: "fail", label: "⚠ Perlu Perhatian" };
    else if (avg < PASS_SCORE || inactiveDays > 7 || anyOverdue) status = { key: "warn", label: "● Perlu Didorong" };
    else status = { key: "pass", label: "✓ Aktif Baik" };
    return {
      units, avg, inactiveDays, anyOverdue, status,
      completedCount: done.length, totalUnits,
      percent: totalUnits ? Math.round((done.length / totalUnits) * 100) : 0
    };
  },

  /** Ringkasan progres 1 siswa untuk level yang MEMAKAI paket mingguan
      (mis. N5, N4) — dipakai untuk dashboard / progress siswa. */
  summarizeWeekly(student) {
    const weeks = this.getWeekStates(student) || [];
    const totalWeeks = weeks.length;
    const doneWeeks = weeks.filter(w => w.state === "selesai").length;
    const scores = [];
    weeks.forEach(w => {
      Object.values(w.progress?.bunpou || {}).forEach(b => scores.push(b.score));
      if (w.progress?.kanji) scores.push(w.progress.kanji.score);
    });
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
    const inactiveDays = Math.max(0, daysBetween(student.lastActiveAt, nowISO()));
    const anyOverdue = weeks.some(w => w.overdue);
    const percent = totalWeeks ? Math.round((doneWeeks / totalWeeks) * 100) : 0;
    const deadlineInfo = this.getLevelDeadlineInfo(student);
    const finalExam = student.finalExam?.[student.level] || null;
    const canFinalExam = this.canTakeFinalExam(student);
    let status;
    if (totalWeeks === 0) status = { key: "warn", label: "○ Materi belum tersedia" };
    else if (avg === null || inactiveDays > 14) status = { key: "fail", label: "⚠ Perlu Perhatian" };
    else if ((deadlineInfo && deadlineInfo.overdue) || avg < PASS_SCORE || inactiveDays > 7 || anyOverdue) status = { key: "warn", label: "● Perlu Didorong" };
    else status = { key: "pass", label: "✓ Aktif Baik" };
    return {
      weeks, totalWeeks, doneWeeks, avg, inactiveDays, anyOverdue, status,
      percent, deadlineInfo, finalExam, canFinalExam
    };
  }
};