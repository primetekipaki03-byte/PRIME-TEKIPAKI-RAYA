/* ============================================================
   TEKIPAKI — DATA & STORE
   Versi sederhana:
   tiap level = 12 minggu
   tiap minggu = 4 materi
   ============================================================ */

/* ============================================================
   1. DAFTAR LEVEL
   ============================================================ */

const LEVELS = [
  { id: "N5", title: "Dasar" },
  { id: "N4", title: "Pemula Lanjutan" },
  { id: "N3", title: "Menengah" },
  { id: "N2", title: "Menengah Atas" },
  { id: "N1", title: "Mahir" },
];

const WEEKS_PER_LEVEL = 12;
const MATERI_PER_WEEK = 4;


/* ============================================================
   2. MATERI PER LEVEL
   ============================================================ */

function buildDefaultWeeks(levelId) {
  const weeks = [];

  for (let w = 1; w <= WEEKS_PER_LEVEL; w++) {
    const materi = [];

    for (let m = 1; m <= MATERI_PER_WEEK; m++) {
      materi.push({
        title: `Minggu ${w} · Materi ${m}`,
        link: "https://drive.google.com/",
      });
    }

    weeks.push(materi);
  }

  return weeks;
}

const MATERI_BY_LEVEL = {
  N5: buildDefaultWeeks("N5"),
  N4: buildDefaultWeeks("N4"),
  N3: buildDefaultWeeks("N3"),
  N2: buildDefaultWeeks("N2"),
  N1: buildDefaultWeeks("N1"),
};


/* ============================================================
   CONTOH MATERI N5 MINGGU 1
   ============================================================ */

MATERI_BY_LEVEL.N5[0][0].title = "Minggu 1 · Hiragana Dasar";
MATERI_BY_LEVEL.N5[0][0].link = "https://drive.google.com/your-link-1";

MATERI_BY_LEVEL.N5[0][1].title = "Minggu 1 · Katakana Dasar";
MATERI_BY_LEVEL.N5[0][1].link = "https://drive.google.com/your-link-2";

MATERI_BY_LEVEL.N5[0][2].title = "Minggu 1 · Kosakata Perkenalan";
MATERI_BY_LEVEL.N5[0][2].link = "https://drive.google.com/your-link-3";

MATERI_BY_LEVEL.N5[0][3].title = "Minggu 1 · Latihan Percakapan";
MATERI_BY_LEVEL.N5[0][3].link = "https://drive.google.com/your-link-4";


/* ============================================================
   CONTOH MATERI N4 MINGGU 1
   ------------------------------------------------------------
   Materi 1 mengarah ke halaman n4-minggu1-materi1.html
   (berisi link ke Materi Tata Bahasa JLPT N4 + link Kuis).

   PENTING:
   Pastikan file n4-minggu1-materi1.html berada di folder
   yang sama dengan elearning.html dan data.js ini.
   Kalau kamu upload ke subfolder, sesuaikan path-nya,
   misal: "materi/n4-minggu1-materi1.html".
   ============================================================ */

MATERI_BY_LEVEL.N4[0][0].title = "Minggu 1 · Materi 1";
MATERI_BY_LEVEL.N4[0][0].link = "n4_minggu1materi1.html";

MATERI_BY_LEVEL.N4[0][1].title = "Minggu 1 · Materi 2";
MATERI_BY_LEVEL.N4[0][1].link = "n4_minggu1materi2.html";

MATERI_BY_LEVEL.N4[0][2].title = "Minggu 1 · Materi 3";
MATERI_BY_LEVEL.N4[0][2].link = "n4_minggu1materi3.html";

MATERI_BY_LEVEL.N4[0][3].title = "Minggu 1 · Materi 4";
MATERI_BY_LEVEL.N4[0][3].link = "n4_minggu1materi4.html";

MATERI_BY_LEVEL.N4[1][0].title = "Minggu 2 · Materi 1";
MATERI_BY_LEVEL.N4[1][0].link = "n4_minggu2materi1.html";

MATERI_BY_LEVEL.N4[1][1].title = "Minggu 2 · Materi 2";
MATERI_BY_LEVEL.N4[1][1].link = "n4_minggu2materi2.html";

MATERI_BY_LEVEL.N4[1][2].title = "Minggu 2 · Materi 3";
MATERI_BY_LEVEL.N4[1][2].link = "n4_minggu2materi3.html";

MATERI_BY_LEVEL.N4[1][3].title = "Minggu 2 · Materi 4";
MATERI_BY_LEVEL.N4[1][3].link = "n4_minggu2materi4.html";

MATERI_BY_LEVEL.N4[2][0].title = "Minggu 3 · Materi 1";
MATERI_BY_LEVEL.N4[2][0].link = "n4_minggu3materi1.html";

MATERI_BY_LEVEL.N4[2][1].title = "Minggu 3 · Materi 2";
MATERI_BY_LEVEL.N4[2][1].link = "n4_minggu3materi2.html";

MATERI_BY_LEVEL.N4[2][2].title = "Minggu 3 · Materi 3";
MATERI_BY_LEVEL.N4[2][2].link = "n4_minggu3materi3.html";

MATERI_BY_LEVEL.N4[2][3].title = "Minggu 3 · Materi 4";
MATERI_BY_LEVEL.N4[2][3].link = "n4_minggu3materi4.html";

MATERI_BY_LEVEL.N4[3][0].title = "Minggu 4 · Materi 1";
MATERI_BY_LEVEL.N4[3][0].link = "n4_minggu4materi1.html";

MATERI_BY_LEVEL.N4[3][1].title = "Minggu 4 · Materi 2";
MATERI_BY_LEVEL.N4[3][1].link = "n4_minggu4materi2.html";

MATERI_BY_LEVEL.N4[3][2].title = "Minggu 4 · Materi 3";
MATERI_BY_LEVEL.N4[3][2].link = "n4_minggu4materi3.html";

MATERI_BY_LEVEL.N4[3][3].title = "Minggu 4 · Materi 4";
MATERI_BY_LEVEL.N4[3][3].link = "n4_minggu4materi4.html";




/* Materi 2, 3, 4 di Minggu 1 N4 masih placeholder —
   ganti title & link-nya kalau sudah siap, contoh:

MATERI_BY_LEVEL.N4[0][1].title = "Minggu 1 · Materi 2";
MATERI_BY_LEVEL.N4[0][1].link = "n4-minggu1-materi2.html";

MATERI_BY_LEVEL.N4[0][2].title = "Minggu 1 · Materi 3";
MATERI_BY_LEVEL.N4[0][2].link = "n4-minggu1-materi3.html";

MATERI_BY_LEVEL.N4[0][3].title = "Minggu 1 · Materi 4";
MATERI_BY_LEVEL.N4[0][3].link = "n4-minggu1-materi4.html";

*/


/* ============================================================
   3. DAFTAR SISWA
   ------------------------------------------------------------
   PENTING (FIX):
   Sebelumnya STUDENTS cuma array biasa di memori, jadi siswa
   yang ditambahkan lewat panel guru (addStudent) hilang lagi
   setiap kali halaman di-refresh/dibuka ulang, walau progress
   belajarnya sendiri tetap tersimpan di localStorage.

   Sekarang daftar siswa disinkronkan ke localStorage juga,
   supaya siswa baru tidak hilang.
   ============================================================ */

const STUDENTS_STORAGE_KEY = "tekipaki_students_v1";

const DEFAULT_STUDENTS = [
  {
    code: "PTPRO1",
    name: "Andi Saputra",
    level: "N5"
  },
  {
    code: "PTPRO2",
    name: "Sari Dewi",
    level: "N5"
  },
  {
    code: "PTPRO3",
    name: "Budi Santoso",
    level: "N4"
  },
];


function loadStudentsFromStorage() {

  try {

    const saved = JSON.parse(
      localStorage.getItem(STUDENTS_STORAGE_KEY)
    );

    if (Array.isArray(saved) && saved.length) {
      return saved;
    }

  } catch (e) {

    console.warn(
      "Gagal membaca daftar siswa dari localStorage:",
      e
    );

  }

  /*
     Belum ada data tersimpan (pertama kali dibuka) →
     pakai daftar default, lalu simpan supaya
     konsisten untuk sesi berikutnya.
  */

  const defaults = DEFAULT_STUDENTS.map(s => ({ ...s }));

  try {

    localStorage.setItem(
      STUDENTS_STORAGE_KEY,
      JSON.stringify(defaults)
    );

  } catch (e) {

    console.warn(
      "Gagal menyimpan daftar siswa default:",
      e
    );

  }

  return defaults;

}


function saveStudentsToStorage() {

  try {

    localStorage.setItem(
      STUDENTS_STORAGE_KEY,
      JSON.stringify(STUDENTS)
    );

  } catch (e) {

    console.warn(
      "Gagal menyimpan daftar siswa:",
      e
    );

  }

}


const STUDENTS = loadStudentsFromStorage();


/* ============================================================
   4. PENYIMPANAN PROGRESS
   ============================================================ */

const STORAGE_KEY = "tekipaki_progress_v1";


function nowISO() {
  return new Date().toISOString();
}


function fmtDate(iso) {
  if (!iso) return "-";

  const d = new Date(iso);

  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}


function daysBetween(fromISO, toISO) {
  const a = new Date(fromISO);
  const b = new Date(toISO);

  return Math.ceil((b - a) / 86400000);
}


function loadAllProgress() {
  try {
    return JSON.parse(
      localStorage.getItem(STORAGE_KEY)
    ) || {};
  } catch (e) {
    return {};
  }
}


function saveAllProgress(all) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(all)
  );
}


function ensureRecord(all, code, baseLevel) {

  if (!all[code]) {

    all[code] = {
      level: baseLevel,
      levelStartedAt: nowISO(),
      lastActive: nowISO(),
      weeks: {}
    };

    saveAllProgress(all);
  }

  return all[code];
}


/* ============================================================
   5. CEK MINGGU & LEVEL
   ============================================================ */

function isWeekDone(
  weeksData,
  levelId,
  weekIndex
) {

  const w =
    (weeksData[levelId] || {})[weekIndex] || {};

  for (
    let m = 0;
    m < MATERI_PER_WEEK;
    m++
  ) {

    if (!w[m]) {
      return false;
    }
  }

  return true;
}


function isLevelDone(
  weeksData,
  levelId
) {

  for (
    let w = 0;
    w < WEEKS_PER_LEVEL;
    w++
  ) {

    if (
      !isWeekDone(
        weeksData,
        levelId,
        w
      )
    ) {

      return false;
    }
  }

  return true;
}


/* ============================================================
   6. NAIK LEVEL OTOMATIS
   ============================================================ */

function checkLevelUp(code) {

  const all = loadAllProgress();
  const rec = all[code];

  if (!rec) return;

  if (
    isLevelDone(
      rec.weeks,
      rec.level
    )
  ) {

    const idx =
      LEVELS.findIndex(
        l => l.id === rec.level
      );

    if (
      idx > -1 &&
      idx < LEVELS.length - 1
    ) {

      rec.level =
        LEVELS[idx + 1].id;

      rec.levelStartedAt =
        nowISO();

      saveAllProgress(all);
    }
  }
}


/* ============================================================
   7. TEKIPAKI STORE
   ============================================================ */

const TekiStore = {

  /* ----------------------------------------------------------
     AMBIL DATA SISWA
     ---------------------------------------------------------- */

  getStudent(code) {

    const normalizedCode =
      String(code || "")
        .trim()
        .toUpperCase();

    const base =
      STUDENTS.find(
        s => s.code === normalizedCode
      );

    if (!base) {
      return null;
    }

    const all =
      loadAllProgress();

    const rec =
      ensureRecord(
        all,
        normalizedCode,
        base.level
      );

    return {

      code: normalizedCode,

      name: base.name,

      level: rec.level,

      levelStartedAt:
        rec.levelStartedAt,

      lastActive:
        rec.lastActive || null,

      /*
         FIX (sinkron dengan Panel Guru):
         panel-guru.html membaca field bernama
         'joinedAt' dan 'lastActiveAt', bukan
         'levelStartedAt' dan 'lastActive'.
         Disediakan sebagai alias supaya kedua
         halaman kompak tanpa perlu ubah HTML.
      */

      joinedAt:
        rec.levelStartedAt,

      lastActiveAt:
        rec.lastActive || null,

      weeks:
        rec.weeks || {}
    };
  },


  /* ----------------------------------------------------------
     DATA REMOTE
     ---------------------------------------------------------- */

  async getStudentRemote(code) {

    return this.getStudent(code);

  },


  /* ----------------------------------------------------------
     UPDATE AKTIVITAS
     ---------------------------------------------------------- */

  touchLastActive(code) {

    const all =
      loadAllProgress();

    const normalizedCode =
      String(code || "")
        .trim()
        .toUpperCase();

    if (all[normalizedCode]) {

      all[normalizedCode].lastActive =
        nowISO();

      saveAllProgress(all);
    }
  },


  /* ----------------------------------------------------------
     LEVEL STATES
     ---------------------------------------------------------- */

  getLevelStates(student) {

    const curIdx =
      LEVELS.findIndex(
        l => l.id === student.level
      );

    return LEVELS.map(
      (l, i) => ({

        id: l.id,

        title: l.title,

        status:
          i < curIdx
            ? "selesai"
            : i === curIdx
            ? "aktif"
            : "terkunci"

      })
    );
  },


  /* ----------------------------------------------------------
     AMBIL MATERI
     ---------------------------------------------------------- */

  getMateriDefs(levelId) {

    return (
      MATERI_BY_LEVEL[levelId]
      || null
    );
  },


  /* ----------------------------------------------------------
     RINGKASAN MINGGU
     ---------------------------------------------------------- */

  summarizeWeeks(
    student,
    levelId
  ) {

    const materiDefs =
      MATERI_BY_LEVEL[levelId]
      || [];

    const isActive =
      levelId === student.level;

    const weeksData =
      isActive
        ? student.weeks[levelId] || {}
        : {};

    let doneWeeks = 0;

    let doneMateriTotal = 0;

    const totalMateri =
      WEEKS_PER_LEVEL *
      MATERI_PER_WEEK;

    const weeks = [];

    let previousDone = true;


    for (
      let w = 0;
      w < WEEKS_PER_LEVEL;
      w++
    ) {

      const wp =
        weeksData[w] || {};

      const materi =
        (materiDefs[w] || [])
          .map(
            (m, mi) => ({

              ...m,

              done:
                !!wp[mi]

            })
          );


      const doneCount =
        materi.filter(
          m => m.done
        ).length;


      doneMateriTotal +=
        doneCount;


      const selesai =
        doneCount ===
        MATERI_PER_WEEK;


      if (selesai) {
        doneWeeks++;
      }


      const locked =
        isActive
          ? !previousDone
          : false;


      weeks.push({

        index: w,

        week: w + 1,

        materi,

        doneCount,

        selesai,

        locked

      });


      previousDone =
        selesai;
    }


    const percent =
      totalMateri
        ? Math.round(
            (
              doneMateriTotal /
              totalMateri
            ) * 100
          )
        : 0;


    let deadlineInfo = null;


    if (isActive) {

      const totalDays =
        WEEKS_PER_LEVEL * 7;

      const target =
        new Date(
          student.levelStartedAt
        );

      target.setDate(
        target.getDate() +
        totalDays
      );


      const daysLeft =
        daysBetween(
          nowISO(),
          target.toISOString()
        );


      deadlineInfo = {

        totalDays,

        daysLeft,

        overdue:
          daysLeft < 0

      };
    }


    return {

      isActive,

      weeks,

      doneWeeks,

      totalWeeks:
        WEEKS_PER_LEVEL,

      percent,

      doneMateriTotal,

      totalMateri,

      deadlineInfo

    };
  },


  /* ----------------------------------------------------------
     TANDAI MATERI SELESAI
     ---------------------------------------------------------- */

  toggleMateri(
    code,
    levelId,
    weekIndex,
    materiIndex
  ) {

    const normalizedCode =
      String(code || "")
        .trim()
        .toUpperCase();


    const all =
      loadAllProgress();


    const base =
      STUDENTS.find(
        s => s.code === normalizedCode
      );


    const rec =
      ensureRecord(
        all,
        normalizedCode,
        base
          ? base.level
          : levelId
      );


    /* hanya level aktif */
    if (
      rec.level !== levelId
    ) {

      return null;
    }


    if (
      !rec.weeks[levelId]
    ) {

      rec.weeks[levelId] = {};
    }


    if (
      !rec.weeks[levelId][weekIndex]
    ) {

      rec.weeks[levelId][weekIndex] = {};
    }


    const cur =
      !!rec.weeks[levelId][weekIndex][materiIndex];


    rec.weeks[levelId][weekIndex][materiIndex] =
      !cur;


    rec.lastActive =
      nowISO();


    saveAllProgress(all);


    checkLevelUp(
      normalizedCode
    );


    return this.getStudent(
      normalizedCode
    );
  }
};


/* ============================================================
   8. LOGIN GURU / ADMIN
   ============================================================ */

/*
   KODE LOGIN GURU:

   GURU2026

   Jika ingin mengganti kode,
   ubah tulisan "GURU2026" di bawah.
*/

const TEACHER_CODES = [
  "GURU2026"
];


function isValidTeacherCode(code) {

  const normalizedCode =
    String(code || "")
      .trim()
      .toUpperCase();

  return TEACHER_CODES.includes(
    normalizedCode
  );
}


/* ============================================================
   9. TAMBAH SISWA
   ============================================================ */

TekiStore.getAllStudents = function () {

  return STUDENTS.map(
    s => this.getStudent(s.code)
  );

};


TekiStore.addStudent = function (
  code,
  name,
  level
) {

  code =
    String(code || "")
      .trim()
      .toUpperCase();

  name =
    String(name || "")
      .trim();

  level =
    String(level || "N5")
      .trim()
      .toUpperCase();


  if (!code) {

    return {
      ok: false,
      message:
        "Kode siswa wajib diisi."
    };
  }


  if (!name) {

    return {
      ok: false,
      message:
        "Nama siswa wajib diisi."
    };
  }


  if (
    !LEVELS.some(
      l => l.id === level
    )
  ) {

    return {
      ok: false,
      message:
        "Level siswa tidak valid."
    };
  }


  if (
    STUDENTS.some(
      s => s.code === code
    )
  ) {

    return {
      ok: false,
      message:
        "Kode siswa sudah terdaftar."
    };
  }


  STUDENTS.push({

    code,

    name,

    level

  });


  /* FIX: simpan daftar siswa yang sudah diperbarui */
  saveStudentsToStorage();


  const all =
    loadAllProgress();


  ensureRecord(
    all,
    code,
    level
  );


  saveAllProgress(
    all
  );


  return {

    ok: true,

    message:
      "Siswa berhasil ditambahkan.",

    student:
      this.getStudent(code)

  };

};


/* ============================================================
   10. HAPUS SISWA
   ============================================================ */

TekiStore.removeStudent = function (
  code
) {

  code =
    String(code || "")
      .trim()
      .toUpperCase();


  const index =
    STUDENTS.findIndex(
      s => s.code === code
    );


  if (index === -1) {

    return {

      ok: false,

      message:
        "Siswa tidak ditemukan."

    };
  }


  STUDENTS.splice(
    index,
    1
  );


  /* FIX: simpan daftar siswa yang sudah diperbarui */
  saveStudentsToStorage();


  const all =
    loadAllProgress();


  delete all[code];


  saveAllProgress(
    all
  );


  return {

    ok: true,

    message:
      "Siswa berhasil dihapus."

  };

};


/* ============================================================
   11. RINGKASAN SISWA
   Digunakan oleh Panel Guru
   ============================================================ */

TekiStore.summarize = function (
  student
) {

  if (!student) {

    return {

      avg: null,

      completedCount: 0,

      totalUnits: 0,

      percent: 0,

      inactiveDays: 999,

      status: {
        key: "fail",
        label: "Tidak ada data"
      },

      units: []

    };
  }


  const materiDefs =
    MATERI_BY_LEVEL[
      student.level
    ] || [];


  const weeksData =
    student.weeks[
      student.level
    ] || {};


  const units = [];


  let totalScore = 0;

  let scoreCount = 0;

  let completedCount = 0;


  /*
     Di Panel Guru setiap minggu
     dianggap sebagai 1 unit.
  */

  for (
    let w = 0;
    w < WEEKS_PER_LEVEL;
    w++
  ) {

    const weekData =
      weeksData[w] || {};


    const materi =
      materiDefs[w] || [];


    let doneCount = 0;


    for (
      let m = 0;
      m < MATERI_PER_WEEK;
      m++
    ) {

      if (weekData[m]) {

        doneCount++;
      }
    }


    const selesai =
      doneCount ===
      MATERI_PER_WEEK;


    if (selesai) {

      completedCount++;
    }


    /*
       Untuk sementara nilai
       berdasarkan persentase
       penyelesaian minggu.
    */

    const score =
      doneCount === 0
        ? null
        : Math.round(
            (
              doneCount /
              MATERI_PER_WEEK
            ) * 100
          );


    if (score !== null) {

      totalScore += score;

      scoreCount++;
    }


    const startDate =
      student.levelStartedAt
        ? new Date(
            student.levelStartedAt
          )
        : new Date();


    startDate.setDate(
      startDate.getDate() +
      (w * 7)
    );


    const deadline =
      new Date(startDate);

    deadline.setDate(
      deadline.getDate() + 6
    );


    const now =
      new Date();


    const overdue =
      !selesai &&
      now > deadline;


    units.push({

      order: w + 1,

      grammar:
        materi[0]?.title ||
        `Minggu ${w + 1}`,

      state:
        selesai
          ? "selesai"
          : doneCount > 0
          ? "berjalan"
          : "belum",

      overdue,

      progress:
        score === null
          ? null
          : {
              score,

              deadline:
                deadline.toISOString(),

              completedAt:
                selesai
                  ? nowISO()
                  : null
            }

    });
  }


  const totalUnits =
    WEEKS_PER_LEVEL;


  const percent =
    totalUnits
      ? Math.round(
          (
            completedCount /
            totalUnits
          ) * 100
        )
      : 0;


  const avg =
    scoreCount
      ? Math.round(
          totalScore /
          scoreCount
        )
      : null;


  let lastActive =
    student.lastActive;


  let inactiveDays = 999;


  if (lastActive) {

    inactiveDays =
      Math.max(
        0,
        Math.floor(
          (
            new Date() -
            new Date(lastActive)
          ) / 86400000
        )
      );

  } else if (
    student.levelStartedAt
  ) {

    inactiveDays =
      Math.max(
        0,
        Math.floor(
          (
            new Date() -
            new Date(
              student.levelStartedAt
            )
          ) / 86400000
        )
      );
  }


  let status;


  if (
    avg !== null &&
    avg >= 80
  ) {

    status = {

      key: "pass",

      label:
        "Baik"

    };

  } else if (
    avg !== null &&
    avg >= 60
  ) {

    status = {

      key: "warn",

      label:
        "Perlu Ditingkatkan"

    };

  } else {

    status = {

      key: "fail",

      label:
        "Perlu Perhatian"

    };
  }


  return {

    avg,

    completedCount,

    totalUnits,

    percent,

    inactiveDays,

    status,

    units

  };

};


/* ============================================================
   12. DATABASE ONLINE
   ============================================================ */

/*
   Saat ini masih menggunakan localStorage.

   Kalau nanti Google Apps Script / database online
   sudah dipasang, bagian ini bisa diaktifkan.
*/

function cloudEnabled() {

  return false;

}


TekiStore.refreshFromCloud = async function () {

  return {

    ok: false,

    message:
      "Database online belum dipasang."

  };

};


TekiStore.saveAllRemote = async function (
  students
) {

  return {

    ok: false,

    message:
      "Database online belum dipasang."

  };

};