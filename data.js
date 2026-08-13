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
   Kanji, misalnya N5): setiap minggu siswa dapat 1 PAKET berisi
   3 unit Bunpou + 12 Kanji, dengan 1 deadline gabungan. Paket
   dianggap lulus kalau SEMUA unit Bunpou di paket itu lulus DAN
   kuis Kanji-nya lulus. Paket berikutnya baru terbuka setelah
   paket sekarang lulus.
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

// TODO: isi UNITS_N4 dengan pola yang sama seperti UNITS_N3/UNITS_N5 di
// atas supaya siswa yang sudah naik ke N4 punya materi sungguhan.
const UNITS_N4 = [];
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

// TODO: isi kanji level lain dengan pola yang sama.
const KANJI_N4 = [];
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
   sudah punya data Kanji (lihat KANJI_BY_LEVEL), misalnya N5.
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
  return batch.map(k => {
    const distractorPool = pool.filter(x => x.id !== k.id);
    const distractors = shuffleArray(distractorPool).slice(0, 3).map(x => x.meaning);
    const options = shuffleArray([k.meaning, ...distractors]);
    return { id: k.id, kanji: k.kanji, reading: k.reading, correct: k.meaning, options };
  });
}

/* ---------------------------------------------------------
   3b. SOAL LATIHAN PER UNIT (20 soal: 10 Tata Bahasa + 10 Kanji)
   ------------------------------------------------------------
   Dipakai oleh halaman unit di siswa.html. Digabung jadi 1 fungsi
   supaya konsisten untuk SEMUA level (baik yang pakai paket
   mingguan seperti N5 maupun yang tidak seperti N3).

   - 10 soal Tata Bahasa: 5 Pilihan Ganda + 5 Esai, dibangun dari
     pola/kalimat contoh/susun-kata milik unit itu sendiri, dengan
     distraktor pilihan ganda diambil dari unit lain di level yang
     sama (kalau tersedia).
   - 10 soal Kanji: 5 Pilihan Ganda (arti) + 5 Esai (bacaan),
     diambil dari daftar Kanji level tsb (lihat KANJI_BY_LEVEL),
     bergeser per unit supaya unit yang berbeda dapat kanji yang
     berbeda-beda kalau pool-nya cukup besar.
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
  const selected = pickKanjiWindow(pool, (unitIndex * KANJI_Q_PER_UNIT) % pool.length, KANJI_Q_PER_UNIT);
  const half = Math.ceil(KANJI_Q_PER_UNIT / 2);
  const qs = [];

  selected.slice(0, half).forEach(k => {
    const distractorPool = pool.filter(x => x.id !== k.id).map(x => x.meaning);
    const distractors = shuffleArray(distractorPool).slice(0, 3);
    qs.push({
      id: `${unit.id}_kmc_${k.id}`, type: "mc",
      prompt: `Apa arti kanji berikut? ${k.kanji}`,
      correct: k.meaning,
      options: shuffleArray([k.meaning, ...distractors])
    });
  });

  selected.slice(half).forEach(k => {
    qs.push({
      id: `${unit.id}_kes_${k.id}`, type: "essay",
      prompt: `Tuliskan cara baca (bacaan) kanji berikut dalam hiragana/katakana: ${k.kanji}`,
      answer: `${k.reading} (${k.meaning})`
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

  /** Info batas waktu keseluruhan level (mis. N5 = 90 hari), dihitung
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
      sistem paket mingguan (pemanggil sebaiknya fallback ke getUnitStates). */
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
      (level yang memakai sistem paket, mis. N5). `totalCount` sekarang
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
      (mis. N5) — dipakai untuk dashboard / progress siswa. */
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