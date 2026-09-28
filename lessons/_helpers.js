// lessons/_helpers.js
// עזרים קטנים לכתיבת בדיקות של משימות — כדי שהשיעורים יהיו קצרים וקריאים.

'use strict';

const fs = require('fs');
const path = require('path');

// הפקודה מתאימה לתבנית והצליחה (קוד יציאה 0)
function ran(x, re) {
  return re.test(x.cmd) && x.code === 0;
}

// הפלט מכיל את כל המחרוזות
function has(x, ...strs) {
  return strs.every((s) => x.stdout.includes(s));
}

// תנאי + הודעה כשהוא לא מתקיים
function need(cond, msg) {
  return cond ? true : { ok: false, msg };
}

// תזכורת לאן המשתמש הלך, כשהבדיקה נכשלה בגלל מיקום
function where(x) {
  return x.rel ? ` (אתה כרגע ב-playground/${x.rel} — אולי צריך קודם cd כדי לחזור?)` : '';
}

// סופר קבצים (כולל מוסתרים) מתחת לתיקייה, אופציונלית לפי סיומת
function countFiles(dir, suffix = '') {
  let n = 0;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) n += countFiles(full, suffix);
    else if (!suffix || e.name.endsWith(suffix)) n++;
  }
  return n;
}

// המספר הראשון בפלט (wc -l מדפיס רווחים לפניו במק)
function firstNumber(x) {
  const m = x.stdout.match(/-?\d+/);
  return m ? Number(m[0]) : null;
}

module.exports = { ran, has, need, where, countFiles, firstNumber };
