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
    streakDays: 0,          // רצף ימים
    lastPlayed: null,       // תאריך משחק אחרון (YYYY-MM-DD מקומי)
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
    return { ...defaultProgress(), ...data, stats: { ...defaultProgress().stats, ...(data.stats || {}) } };
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

// מעדכן רצף ימים לפי התאריך המקומי של המחשב
function touchStreak(progress) {
  const today = localDate();
  const last = playedDate(progress.lastPlayed);

  if (last === today) {
    // כבר שיחקנו היום — הרצף נשאר
  } else if (last === shiftDay(today, -1)) {
    progress.streakDays += 1;
  } else {
    progress.streakDays = 1;
  }
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
  reset,
};
