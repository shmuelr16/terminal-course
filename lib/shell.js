// lib/shell.js
// איזה bash מריץ את הפקודות — בכל מערכת הפעלה.
// מק/לינוקס: /bin/bash. ב-Windows: Git Bash (מגיע עם Git for Windows).
// ב-WSL הקורס רץ כמו בלינוקס רגיל, אז אין מה לעשות מיוחד.

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const IS_WINDOWS = process.platform === 'win32';

// מחפש bash.exe של Git for Windows. לא משתמשים ב-C:\Windows\System32\bash.exe —
// זה המשגר של WSL, שרואה את הקבצים בנתיבים אחרים (/mnt/c/...).
function findWindowsBash() {
  const candidates = [];
  if (process.env.TERMINAL_COURSE_BASH) candidates.push(process.env.TERMINAL_COURSE_BASH);

  // לפי המיקום של git: ...\Git\cmd\git.exe ← ...\Git\bin\bash.exe
  try {
    const gits = execSync('where git', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 3000 })
      .split(/\r?\n/)
      .filter(Boolean);
    for (const g of gits) candidates.push(path.join(path.dirname(path.dirname(g)), 'bin', 'bash.exe'));
  } catch {
    // אין git ב-PATH — ננסה את המקומות הרגילים
  }

  for (const base of [process.env.ProgramFiles, process.env['ProgramFiles(x86)'], process.env.ProgramW6432]) {
    if (base) candidates.push(path.join(base, 'Git', 'bin', 'bash.exe'));
  }
  if (process.env.LOCALAPPDATA) candidates.push(path.join(process.env.LOCALAPPDATA, 'Programs', 'Git', 'bin', 'bash.exe'));
  candidates.push('C:\\Program Files\\Git\\bin\\bash.exe');

  return candidates.find((p) => {
    try {
      return fs.statSync(p).isFile();
    } catch {
      return false;
    }
  }) || null;
}

// מחפש bash אמיתי (עדיף על sh — השיעורים משתמשים בהרחבות של bash כמו {1..5}).
// כולל את המקומות של Termux/אנדרואיד, שם אין /bin רגיל אלא $PREFIX/bin.
function findShell() {
  if (IS_WINDOWS) return findWindowsBash();
  const prefix = process.env.PREFIX; // ב-Termux: /data/data/com.termux/files/usr
  const candidates = [
    process.env.TERMINAL_COURSE_BASH,
    '/bin/bash',
    '/usr/bin/bash',
    '/usr/local/bin/bash',
    prefix && path.join(prefix, 'bin', 'bash'),
    '/data/data/com.termux/files/usr/bin/bash',
    process.env.SHELL,
    '/bin/sh',
    prefix && path.join(prefix, 'bin', 'sh'),
  ].filter(Boolean);
  for (const c of candidates) {
    try {
      if (fs.statSync(c).isFile()) return c;
    } catch {
      // ממשיכים למועמד הבא
    }
  }
  return null;
}

const SHELL_PATH = findShell();

// C:\Users\dana ← → /c/Users/dana (כך Git Bash כותב נתיבים)
function toPosixPath(p) {
  return String(p).replace(/^([A-Za-z]):[\\/]?/, (_, d) => '/' + d.toLowerCase() + '/').replace(/\\/g, '/').replace(/\/+$/, '');
}

// האם שני נתיבים הם אותו מקום, גם אם אחד בכתיב של Windows ואחד בכתיב של Git Bash
function samePath(a, b) {
  const norm = (p) => {
    let s = toPosixPath(String(p).trim());
    if (IS_WINDOWS) s = s.toLowerCase();
    return s;
  };
  return norm(a) === norm(b);
}

// הודעה למשתמשי Windows בלי Git Bash
function windowsSetupHelp() {
  return [
    'הקורס מלמד את הטרמינל של מק ולינוקס (bash) — וב-Windows צריך בשביל זה אחד משניים:',
    '',
    '1) Git for Windows (הכי פשוט):',
    '   מורידים מ-https://git-scm.com/download/win ומתקינים עם ברירות המחדל.',
    '   או בפקודה אחת ב-PowerShell:  winget install Git.Git',
    '   ואז מריצים שוב את הקורס.',
    '',
    '2) WSL (לינוקס אמיתי בתוך Windows):',
    '   ב-PowerShell כמנהל:  wsl --install',
    '   אחרי הפעלה מחדש: פותחים "Ubuntu", מתקינים שם Node.js, ומריצים את הקורס משם.',
    '',
    'אם Git מותקן במקום לא רגיל, אפשר להגיד לקורס איפה bash.exe:',
    '   set TERMINAL_COURSE_BASH=D:\\Git\\bin\\bash.exe',
  ].join('\n');
}

module.exports = { IS_WINDOWS, SHELL_PATH, findShell, toPosixPath, samePath, windowsSetupHelp };
