/* ============================================================
   TEKIPAKI — DATA & STORE
   Versi sederhana: tiap level = 12 minggu, tiap minggu = 4 materi.
   Siswa cukup buka link materi lalu tekan "Tandai Selesai".
   ============================================================
   CARA EDIT:
   1) Ganti nama siswa / level di bagian STUDENTS.
   2) Ganti judul & link materi di bagian MATERI_BY_LEVEL.
      -> Tidak perlu sentuh kode lain di index.html.
   ============================================================ */

/* ---------- 1. DAFTAR LEVEL (urutan = urutan kenaikan level) ---------- */
const LEVELS = [
  { id: "N5", title: "Dasar" },
  { id: "N4", title: "Pemula Lanjutan" },
  { id: "N3", title: "Menengah" },
  { id: "N2", title: "Menengah Atas" },
  { id: "N1", title: "Mahir" },
];

const WEEKS_PER_LEVEL = 12;
const MATERI_PER_WEEK = 4;

/* ---------- 2. MATERI PER LEVEL ----------
   MATERI_BY_LEVEL[levelId] = array berisi 12 minggu.
   Tiap minggu = array berisi 4 materi: { title, link }.
   GANTI title & link SESUAI KEBUTUHAN — strukturnya sudah otomatis
   dibuatkan di bawah supaya kamu tidak perlu ketik 12x4 baris manual,
   tinggal timpa satu-satu yang mau diganti (contoh ada di bawah). */
function buildDefaultWeeks(levelId) {
  const weeks = [];
  for (let w = 1; w <= WEEKS_PER_LEVEL; w++) {
    const materi = [];
    for (let m = 1; m <= MATERI_PER_WEEK; m++) {
      materi.push({
        title: `Minggu ${w} · Materi ${m}`,
        link: "https://drive.google.com/", // <-- GANTI LINK MATERI DI SINI
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

/* Contoh mengganti materi tertentu (Minggu 1, Materi 1 di level N5).
   Tinggal copy baris seperti ini sebanyak yang perlu diganti: */
MATERI_BY_LEVEL.N5[0][0].title = "Minggu 1 · Hiragana Dasar";
MATERI_BY_LEVEL.N5[0][0].link = "https://drive.google.com/your-link-1";
MATERI_BY_LEVEL.N5[0][1].title = "Minggu 1 · Katakana Dasar";
MATERI_BY_LEVEL.N5[0][1].link = "https://drive.google.com/your-link-2";
MATERI_BY_LEVEL.N5[0][2].title = "Minggu 1 · Kosakata Perkenalan";
MATERI_BY_LEVEL.N5[0][2].link = "https://drive.google.com/your-link-3";
MATERI_BY_LEVEL.N5[0][3].title = "Minggu 1 · Latihan Percakapan";
MATERI_BY_LEVEL.N5[0][3].link = "https://drive.google.com/your-link-4";

/* ---------- 3. DAFTAR SISWA ----------
   Tambahkan siswa baru dengan menambah baris di array ini.
   "code" = kode login siswa (bebas huruf/angka, akan otomatis diubah UPPERCASE). */
const STUDENTS = [
  { code: "TEKI001", name: "Andi Saputra", level: "N5" },
  { code: "TEKI002", name: "Sari Dewi", level: "N5" },
  { code: "TEKI003", name: "Budi Santoso", level: "N4" },
];

/* ---------- 4. PENYIMPANAN PROGRESS (localStorage) ---------- */
const STORAGE_KEY = "tekipaki_progress_v1";

function nowISO() { return new Date().toISOString(); }
function fmtDate(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}
function daysBetween(fromISO, toISO) {
  const a = new Date(fromISO), b = new Date(toISO);
  return Math.ceil((b - a) / 86400000);
}

function loadAllProgress() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch (e) { return {}; }
}
function saveAllProgress(all) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

function ensureRecord(all, code, baseLevel) {
  if (!all[code]) {
    all[code] = { level: baseLevel, levelStartedAt: nowISO(), weeks: {} };
    saveAllProgress(all);
  }
  return all[code];
}

function isWeekDone(weeksData, levelId, weekIndex) {
  const w = (weeksData[levelId] || {})[weekIndex] || {};
  for (let m = 0; m < MATERI_PER_WEEK; m++) if (!w[m]) return false;
  return true;
}
function isLevelDone(weeksData, levelId) {
  for (let w = 0; w < WEEKS_PER_LEVEL; w++) if (!isWeekDone(weeksData, levelId, w)) return false;
  return true;
}

function checkLevelUp(code) {
  const all = loadAllProgress();
  const rec = all[code];
  if (!rec) return;
  if (isLevelDone(rec.weeks, rec.level)) {
    const idx = LEVELS.findIndex(l => l.id === rec.level);
    if (idx > -1 && idx < LEVELS.length - 1) {
      rec.level = LEVELS[idx + 1].id;
      rec.levelStartedAt = nowISO();
      saveAllProgress(all);
    }
  }
}

/* ---------- 5. TekiStore (API dipakai oleh index.html) ---------- */
const TekiStore = {

  getStudent(code) {
    const base = STUDENTS.find(s => s.code === code);
    if (!base) return null;
    const all = loadAllProgress();
    const rec = ensureRecord(all, code, base.level);
    return {
      code,
      name: base.name,
      level: rec.level,
      levelStartedAt: rec.levelStartedAt,
      weeks: rec.weeks,
    };
  },

  // Placeholder untuk mode database online — belum dipakai di versi ini,
  // tapi tetap ada supaya index.html tidak error kalau cloudEnabled() true.
  async getStudentRemote(code) {
    return this.getStudent(code);
  },

  touchLastActive(code) {
    const all = loadAllProgress();
    if (all[code]) { all[code].lastActive = nowISO(); saveAllProgress(all); }
  },

  getLevelStates(student) {
    const curIdx = LEVELS.findIndex(l => l.id === student.level);
    return LEVELS.map((l, i) => ({
      id: l.id,
      title: l.title,
      status: i < curIdx ? "selesai" : i === curIdx ? "aktif" : "terkunci",
    }));
  },

  getMateriDefs(levelId) {
    return MATERI_BY_LEVEL[levelId] || null;
  },

  // Ringkasan 12 minggu untuk sebuah level (levelId bisa beda dari student.level
  // saat siswa sedang "menelusuri" level lain — progress cuma dihitung kalau
  // levelId === student.level).
  summarizeWeeks(student, levelId) {
    const materiDefs = MATERI_BY_LEVEL[levelId] || [];
    const isActive = levelId === student.level;
    const weeksData = isActive ? student.weeks[levelId] || {} : {};
    let doneWeeks = 0, doneMateriTotal = 0;
    const totalMateri = WEEKS_PER_LEVEL * MATERI_PER_WEEK;
    const weeks = [];
    let previousDone = true; // minggu 1 selalu terbuka
    for (let w = 0; w < WEEKS_PER_LEVEL; w++) {
      const wp = weeksData[w] || {};
      const materi = (materiDefs[w] || []).map((m, mi) => ({ ...m, done: !!wp[mi] }));
      const doneCount = materi.filter(m => m.done).length;
      doneMateriTotal += doneCount;
      const selesai = doneCount === MATERI_PER_WEEK;
      if (selesai) doneWeeks++;
      const locked = isActive ? !previousDone : false;
      weeks.push({ index: w, week: w + 1, materi, doneCount, selesai, locked });
      previousDone = selesai;
    }
    const percent = totalMateri ? Math.round((doneMateriTotal / totalMateri) * 100) : 0;

    let deadlineInfo = null;
    if (isActive) {
      const totalDays = WEEKS_PER_LEVEL * 7;
      const target = new Date(student.levelStartedAt);
      target.setDate(target.getDate() + totalDays);
      const daysLeft = daysBetween(nowISO(), target.toISOString());
      deadlineInfo = { totalDays, daysLeft, overdue: daysLeft < 0 };
    }

    return {
      isActive, weeks, doneWeeks, totalWeeks: WEEKS_PER_LEVEL,
      percent, doneMateriTotal, totalMateri, deadlineInfo,
    };
  },

  toggleMateri(code, levelId, weekIndex, materiIndex) {
    const all = loadAllProgress();
    const base = STUDENTS.find(s => s.code === code);
    const rec = ensureRecord(all, code, base ? base.level : levelId);
    if (rec.level !== levelId) return null; // hanya level aktif yang bisa ditandai
    if (!rec.weeks[levelId]) rec.weeks[levelId] = {};
    if (!rec.weeks[levelId][weekIndex]) rec.weeks[levelId][weekIndex] = {};
    const cur = !!rec.weeks[levelId][weekIndex][materiIndex];
    rec.weeks[levelId][weekIndex][materiIndex] = !cur;
    saveAllProgress(all);
    checkLevelUp(code);
    return this.getStudent(code);
  },
};

/* cloudEnabled() sengaja dikosongkan (false) — versi ini memakai localStorage saja. */
function cloudEnabled() { return false; }