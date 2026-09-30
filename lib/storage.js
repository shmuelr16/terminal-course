// lib/storage.js
// שמירת התקדמות מקומית בלבד — בלי שרת.
// הכל נשמר בקובץ JSON תחת ~/.terminal-course/

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

// תיקיית הנתונים של הקורס בבית המשתמש
// (אפשר לעקוף עם TERMINAL_COURSE_HOME — שימושי לבדיקות אוטומטיות)
const DATA_DIR = process.env.TERMINAL_COURSE_HOME || path.join(os.homedir(), '.terminal-course');
const PROGRESS_FILE = path.join(DATA_DIR, 'progress.json');
const PLAYGROUND_DIR = path.join(DATA_DIR, 'playground');

// מבנה ברירת המחדל של ההתקדמות
function defaultProgress() {
  return {
    version: 1,
    name: null,             // שם שהמשתמש הזין (אופציונלי)
    completed: [],          // מזהי שיעורים שהושלמו
    xp: 0,                  // נקודות ניסיון
    streakDays: 0,          // רצף ימים (מחושב מהיסטוריית playedDates)
    lastPlayed: null,       // תאריך משחק אחרון (YYYY-MM-DD מקומי)
    playedDates: [],        // כל הימים שבהם שוחק (מקור האמת של הרצף)
    createdAt: new Date().toISOString(),
    stats: {
      commandsRun: 0,       // כמה פקודות הרצת בסך הכל
      hintsUsed: 0,         // כמה רמזים ביקשת
      drillsSolved: 0,      // כמה תרגילי אימון פתרת
      jokesRead: 0,         // כמה בדיחות ביקשת 😄
    },
  };
}

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function load() {
  ensureDir();
  if (!fs.existsSync(PROGRESS_FILE)) {
    return defaultProgress();
  }
  try {
    const raw = fs.readFileSync(PROGRESS_FILE, 'utf8');
    const data = JSON.parse(raw);
    // מיזוג עם ברירת מחדל כדי שלא ייחסרו שדות בעדכוני גרסה
    const merged = { ...defaultProgress(), ...data, stats: { ...defaultProgress().stats, ...(data.stats || {}) } };
    // קבצים ישנים (לפני היסטוריית הימים) שמרו רק את התאריך האחרון.
    // מזריעים אותו להיסטוריה כדי לא לאבד את הרצף הקיים, ומחשבים מחדש.
    merged.playedDates = normalizePlayedDates(merged.playedDates);
    if (!merged.playedDates.length) {
      const seed = playedDate(merged.lastPlayed) || playedDate(merged.createdAt);
      if (seed) merged.playedDates = [seed];
    }
    return merged;
  } catch (e) {
    // אם הקובץ נפגם — מתחילים מחדש בבטחה (עם גיבוי)
    try {
      fs.renameSync(PROGRESS_FILE, PROGRESS_FILE + '.corrupt-' + Date.now());
    } catch (_) {}
    return defaultProgress();
  }
}

function save(progress) {
  ensureDir();
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2), 'utf8');
}

// תאריך מקומי בפורמט YYYY-MM-DD.
// חשוב לא להשתמש כאן ב-toISOString(): הוא מחזיר UTC, ולמשתמש שמשחק
// ב-01:00 (או ב-23:00) התאריך "קופץ" יום קדימה או אחורה — והרצך נשבר.
function localDate(date) {
  const d = date || new Date();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

// תאריך המשחק האחרון כתאריך מקומי.
// קובצי התקדמות ישנים שמרו ISO מלא (ב-UTC) — ממירים אותם כדי לא לאבד רצף.
function playedDate(value) {
  if (!value) return null;
  const raw = String(value);
  if (raw.includes('T')) return localDate(new Date(raw));
  return raw.slice(0, 10);
}

// תאריך מקומי של יום X ימים אחרה/לפני — חסון לשעות קיץ ולשעות חורף.
function shiftDay(dateStr, delta) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return localDate(new Date(y, m - 1, d + delta));
}

// כמה ימים עברו מאז תאריך מקומי (0 = היום)
function daysAgo(dateStr, today) {
  const [y, m, d] = String(dateStr).split('-').map(Number);
  const then = new Date(y, m - 1, d).getTime();
  const [ty, tm, td] = String(today || localDate()).split('-').map(Number);
  const now = new Date(ty, tm - 1, td).getTime();
  return Math.round((now - then) / 86400000);
}

// רשימת הימים שבהם שוחקו, ממוינת וללא כפילויות.
function normalizePlayedDates(list) {
  const seen = new Set();
  for (const raw of Array.isArray(list) ? list : []) {
    const d = playedDate(raw);
    if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) seen.add(d);
  }
  return [...seen].sort();
}

// חישוב הרצף מתוך ההיסטוריה המלאה (לא רק מהתאריך האחרון).
// הרצך "חי" עד יום אחרי היום שבו שיחקת — כלומר הוא נשבר רק אחרי שתי ימים
// רצופים בלי פתיחה של הקורס. מחזיר { days, last, gap }.
function computeStreak(playedDates, today) {
  const day = today || localDate();
  const dates = normalizePlayedDates(playedDates);
  if (!dates.length) return { days: 0, last: null, gap: Infinity };

  const last = dates[dates.length - 1];
  const gap = daysAgo(last, day);
  if (gap > 1) return { days: 0, last, gap }; // הרצך נשבר

  // סופרים אחורה יום־יום מהמשחק האחרון
  let days = 1;
  for (let i = dates.length - 1; i > 0; i--) {
    if (dates[i - 1] === shiftDay(dates[i], -1)) days++;
    else break;
  }
  return { days, last, gap };
}

// רושם משחק היום ומחשב את הרצף מתוך כל ההיסטוריה.
function touchStreak(progress) {
  const today = localDate();
  const dates = normalizePlayedDates(progress.playedDates);
  if (!dates.includes(today)) dates.push(today);

  // שומרים שנה אחרונה בלבד — הקובץ לא יתפוצץ
  const trimmed = dates.slice(-400);
  const streak = computeStreak(trimmed, today);

  progress.playedDates = trimmed;
  progress.streakDays = streak.days;
  progress.lastPlayed = today;
  return progress;
}

function reset() {
  if (fs.existsSync(PROGRESS_FILE)) {
    fs.unlinkSync(PROGRESS_FILE);
  }
}

module.exports = {
  DATA_DIR,
  PROGRESS_FILE,
  PLAYGROUND_DIR,
  defaultProgress,
  load,
  save,
  touchStreak,
  computeStreak,
  localDate,
  daysAgo,
  reset,
};
