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
const PASS_SCORE = 70;          // nilai minimal supaya unit dianggap lulus
const UNIT_DEADLINE_DAYS = 7;   // setiap unit harus selesai dalam 1 minggu

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

   UNITS_BY_LEVEL menyimpan materi & latihan untuk tiap level.
   Materi & latihan sudah lengkap untuk level N3. Level lain
   tinggal ditambahkan dengan pola yang sama — array unit kosong
   [] berarti "materi belum tersedia" dan akan ditampilkan
   sebagai demikian di siswa.html.
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

// TODO: isi UNITS_N4 dan UNITS_N5 dengan pola yang sama seperti UNITS_N3
// di atas (id, order, grammar, reading, meaning, explanation, pattern,
// examples, quiz) supaya siswa yang start di N4/N5 punya materi sungguhan.
const UNITS_N4 = [];
const UNITS_N5 = [];
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

/* Dipertahankan untuk kompatibilitas mundur — ini metadata level statis
   (tanpa status, karena status sekarang dihitung per siswa). Kalau ada
   kode lama yang masih membaca `LEVELS` langsung, sebaiknya diganti ke
   `TekiStore.getLevelStates(student)`. */
const LEVELS = LEVEL_META.map(l => ({ ...l, status: "aktif" }));

/* ---------------------------------------------------------
   2. UTIL TANGGAL
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

/* ---------------------------------------------------------
   3. STORE API  (localStorage — ganti ke backend di sini nanti)
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
        lastActiveAt: addDays(nowISO(), -(opts.inactiveDays ?? 0)),
        progress
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
      lastActiveAt: nowISO(),
      progress: {}
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
    return this.getAllStudents().find(s => s.code === code) || null;
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

  /** Susun daftar unit dengan status terkunci/berjalan/selesai + tenggat,
      untuk LEVEL AKTIF siswa (student.level). */
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

  _persistStudent(student) {
    const students = this.getAllStudents();
    const idx = students.findIndex(s => s.code === student.code);
    if (idx > -1) students[idx] = student; else students.push(student);
    this._writeAll(students);
  },

  /** Kirim hasil latihan untuk sebuah unit di level aktif siswa.
      correctCount/totalCount dari kuis. Kalau ini unit terakhir di
      level tsb dan lulus, siswa otomatis naik ke level berikutnya
      di LEVEL_ORDER (kalau levelnya sudah punya materi). */
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
          leveledUp = true;
        }
      }
    }

    this._persistStudent(student);
    return { score, passed, leveledUp, newLevel: student.level };
  },

  /** Ringkasan progres 1 siswa untuk kartu / panel guru — otomatis
      mengikuti level aktif siswa (student.level). */
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
  }
};