// lib/personalize.js
// קורא את המחשב האמיתי של המשתמש (בקריאה בלבד!) כדי להתאים את ההדרכה.
// למשל: "אני רואה שיש לך תיקייה בשם code עם 76 פריטים".
// שום דבר כאן לא כותב/מוחק — רק קורא מידע.

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

// סורק תיקייה ברמה אחת ומחזיר סיכום
function scanDir(dir) {
  const result = { dir, folders: [], files: [], total: 0, error: null };
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.name.startsWith('.')) continue; // מדלגים על קבצים מוסתרים
      if (/^ntuser\./i.test(e.name)) continue; // קבצי מערכת של Windows בתיקיית הבית
      if (e.isDirectory()) result.folders.push(e.name);
      else result.files.push(e.name);
    }
    result.total = result.folders.length + result.files.length;
  } catch (e) {
    result.error = e.message;
  }
  return result;
}

// אוסף פרופיל של המחשב: מי המשתמש, איזה shell, מה יש בבית
function profile() {
  const home = os.homedir();
  const homeScan = scanDir(home);

  return {
    username: os.userInfo().username,
    hostname: os.hostname(),
    platform: os.platform(),      // 'darwin' = מאק
    shell: process.env.SHELL || 'unknown',
    home,
    homeFolders: homeScan.folders,
    homeFiles: homeScan.files,
    homeTotal: homeScan.total,
  };
}

// בוחר תיקייה "מעניינת" מהבית להזכיר בהדרכה (למשל code / Documents)
// קודם תיקיות שבמק לא מקפיצות בקשת הרשאה (Desktop/Documents/Downloads כן מקפיצות).
function pickInterestingFolder(prof) {
  const preferred = ['code', 'projects', 'dev', 'Developer', 'src', 'Pictures', 'Music', 'Documents', 'Desktop', 'Downloads'];
  for (const name of preferred) {
    if (prof.homeFolders.includes(name)) return name;
  }
  return prof.homeFolders[0] || null;
}

// מתרגם שם platform לעברית
function platformName(platform) {
  return {
    darwin: 'macOS (מאק)',
    linux: 'לינוקס',
    win32: 'ווינדוס',
  }[platform] || platform;
}

module.exports = { scanDir, profile, pickInterestingFolder, platformName };
