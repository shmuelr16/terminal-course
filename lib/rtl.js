// lib/rtl.js
// סידור עברית לכיוון הנכון בטרמינלים שלא עושים bidi בעצמם (כמו Termux/אנדרואיד).
// הטרמינל של המק מסדר עברית לבד — שם המצב הזה כבוי, ולא נוגעים בכלום.
// כשהמצב פעיל, כל שורה שיוצאת מסודרת מראש כך שהיא תיראה נכון.
//
// זיהוי: אוטומטי ב-Termux/אנדרואיד, או ידני עם TERMINAL_COURSE_RTL=1/0.

'use strict';

const HEB = /[֐-׿יִ-ﭏ]/;
const LTR = /[A-Za-z0-9]/;
const MIRROR = { '(': ')', ')': '(', '[': ']', ']': '[', '{': '}', '}': '{', '<': '>', '>': '<' };

function detect() {
  const v = (process.env.TERMINAL_COURSE_RTL || '').toLowerCase();
  if (['1', 'on', 'true', 'yes'].includes(v)) return true;
  if (['0', 'off', 'false', 'no'].includes(v)) return false;
  // אוטומטי: Termux מגדיר TERMUX_VERSION; ב-Termux ובאנדרואיד אין bidi בטרמינל
  if (process.env.TERMUX_VERSION) return true;
  if (process.platform === 'android') return true;
  return false;
}

const ENABLED = detect();

// מפצל טקסט ל"תאים": כל תא הוא גרפמה (תו נראה, כולל אימוג'י מורכב) עם הסגנון (צבע) שחל עליו.
// קודי ANSI של צבע (SGR) לא נספרים כתווים — הם רק מעדכנים את הסגנון הנוכחי.
const SEG = typeof Intl !== 'undefined' && Intl.Segmenter
  ? new Intl.Segmenter(undefined, { granularity: 'grapheme' })
  : null;

function graphemes(str) {
  if (SEG) return [...SEG.segment(str)].map((s) => s.segment);
  return [...str];
}

// רוחב תצוגה של גרפמה: אימוג'י ותווים רחבים תופסים 2, השאר 1.
// חשוב שיתאים למה ש-Termux באמת מצייר, אחרת השבירה יוצאת לא מדויקת.
function cellWidth(g) {
  if (g.indexOf('️') !== -1) return 2; // תו וריאציה של אימוג'י (למשל ▶️ ℹ️) → רחב
  const code = g.codePointAt(0);
  if (
    (code >= 0x1f000 && code <= 0x1faff) ||
    (code >= 0x2600 && code <= 0x27bf) ||   // סמלים ודינגבטים
    (code >= 0x2b00 && code <= 0x2bff) ||   // ⭐ ⭕ חיצים
    (code >= 0x1f1e6 && code <= 0x1f1ff) || // דגלים
    code === 0x231a || code === 0x231b ||   // ⌚ ⌛
    (code >= 0x23e9 && code <= 0x23f3) ||   // ⏩ ⏰ ⏳
    (code >= 0x23f8 && code <= 0x23fa) ||   // ⏸ ⏹ ⏺
    code === 0x2705 || code === 0x274c || code === 0x2764
  ) {
    return 2;
  }
  return 1;
}

function toCells(line) {
  const cells = [];
  let style = '';
  const re = /\x1b\[[0-9;?]*[A-Za-z]/g;
  let last = 0;
  let m;
  while ((m = re.exec(line))) {
    if (m.index > last) for (const g of graphemes(line.slice(last, m.index))) cells.push({ g, style });
    const seq = m[0];
    if (seq.endsWith('m')) {
      if (/^\x1b\[0?m$/.test(seq)) style = '';
      else style += seq;
    } else {
      // רצף שאינו צבע (למשל תזוזת סמן) — לא אמור להופיע בשורות תוכן. משאירים כמו שהוא.
      return null;
    }
    last = re.lastIndex;
  }
  if (last < line.length) for (const g of graphemes(line.slice(last))) cells.push({ g, style });
  return cells;
}

// סיווג כיווני של גרפמה: R עברית, L לטינית/ספרה, N נייטרלי
function classify(g) {
  const ch = g[0];
  if (HEB.test(ch)) return 'R';
  if (LTR.test(ch)) return 'L';
  return 'N';
}

// סיווג כל התאים, כולל פתרון נייטרליים: נייטרלי בין שני תווים מאותו סוג מקבל את סוגם
// (כדי ש-"ls -la" ו-"1/20" יישארו מחוברים וקריאים).
function resolveClasses(cells) {
  const n = cells.length;
  const cls = cells.map((c) => classify(c.g));
  for (let i = 0; i < n; i++) {
    if (cls[i] !== 'N') continue;
    let l = i - 1;
    while (l >= 0 && cls[l] === 'N') l--;
    let r = i + 1;
    while (r < n && cls[r] === 'N') r++;
    const lt = l >= 0 ? cls[l] : 'R';
    const rt = r < n ? cls[r] : 'R';
    cls[i] = lt === 'L' && rt === 'L' ? 'L' : 'R';
  }
  return cls;
}

// מחזיר את סדר התצוגה (מערך אינדקסים) לפי bidi מפושט, בסיס RTL:
// הופכים את כל השורה, ואז מחזירים לסדרם המקורי את הרצפים הלטיניים (מילים באנגלית, מספרים, פקודות).
function visualOrder(cells, cls) {
  const n = cells.length;
  const idx = [...Array(n).keys()].reverse();
  let i = 0;
  while (i < n) {
    if (cls[idx[i]] === 'L') {
      let j = i;
      while (j < n && cls[idx[j]] === 'L') j++;
      for (let a = i, b = j - 1; a < b; a++, b--) {
        const t = idx[a];
        idx[a] = idx[b];
        idx[b] = t;
      }
      i = j;
    } else i++;
  }
  return idx;
}

// תו "מבני" שנשאר בצד שמאל: רווח, או תו מסגרת (box drawing / block)
function isStructural(g) {
  return /^[\s─-╿▀-▟]$/.test(g);
}

// שובר מערך תאים לשורות ברוחב נתון, עם העדפה לשבור ברווח (כדי לא לחתוך מילים באמצע).
// זה מה שמונע את השבירה העקומה על המסך הצר של הטלפון.
function wrapCells(cells, width) {
  if (!width || width < 4) return [cells];
  const rows = [];
  let row = [];
  let w = 0;
  let lastSpace = -1;
  for (const cell of cells) {
    const cw = cellWidth(cell.g);
    if (w + cw > width && row.length) {
      if (lastSpace > 0) {
        rows.push(row.slice(0, lastSpace)); // עד הרווח (בלי הרווח עצמו)
        row = row.slice(lastSpace + 1);
      } else {
        rows.push(row);
        row = [];
      }
      w = 0;
      lastSpace = -1;
      for (let i = 0; i < row.length; i++) {
        if (row[i].g === ' ') lastSpace = i;
        w += cellWidth(row[i].g);
      }
    }
    row.push(cell);
    if (cell.g === ' ') lastSpace = row.length - 1;
    w += cw;
  }
  if (row.length) rows.push(row);
  return rows;
}

// מסדר מערך תאים אחד (שורה אחת) ומחזיר מחרוזת עם צבעים
function reorderCells(cells) {
  // שומרים קידומת של רווחים/מסגרת בצד שמאל (כדי שקו המסגרת וההזחה יישארו במקום)
  let p = 0;
  while (p < cells.length && isStructural(cells[p].g)) p++;
  const head = cells.slice(0, p);
  const body = cells.slice(p);
  const cls = resolveClasses(body);
  const bodyOrdered = visualOrder(body, cls).map((k) => {
    const c = body[k];
    // בהקשר עברי הופכים סוגריים לכיוון הנכון: ( ↔ )
    if (cls[k] === 'R' && MIRROR[c.g]) return { g: MIRROR[c.g], style: c.style };
    return c;
  });
  const ordered = head.concat(bodyOrdered);
  let out = '';
  let cur = null;
  for (const c of ordered) {
    if (c.style !== cur) {
      out += '\x1b[0m' + c.style;
      cur = c.style;
    }
    out += c.g;
  }
  if (cur) out += '\x1b[0m';
  return out;
}

// מסדר שורה לוגית אחת. אם היא ארוכה מרוחב המסך — שוברים אותה קודם ומסדרים כל שורת-מסך בנפרד.
function reorderLine(line, width) {
  if (!HEB.test(line)) return line; // אין עברית — אין מה לסדר
  const cells = toCells(line);
  if (!cells || !cells.length) return line;
  if (width && width > 4) {
    const dw = cells.reduce((s, c) => s + cellWidth(c.g), 0);
    if (dw > width) {
      // קידומת מבנית (רווחים / קו מסגרת │) חוזרת בכל שורה שנשברת, כדי שמסגרת תישאר שלמה
      let p = 0;
      while (p < cells.length && isStructural(cells[p].g)) p++;
      const head = cells.slice(0, p);
      const headW = head.reduce((s, c) => s + cellWidth(c.g), 0);
      const body = cells.slice(p);
      const rows = wrapCells(body, Math.max(4, width - headW));
      return rows.map((r) => reorderCells(head.concat(r))).join('\n');
    }
  }
  return reorderCells(cells);
}

// מסדר טקסט שעשוי להכיל כמה שורות (שומר על ירידות שורה)
function reorder(text) {
  if (!ENABLED || typeof text !== 'string' || !HEB.test(text)) return text;
  const width = process.stdout.columns || 0;
  return text.split('\n').map((l) => reorderLine(l, width)).join('\n');
}

module.exports = { ENABLED, reorder, reorderLine, visualOrder, _toCells: toCells };
