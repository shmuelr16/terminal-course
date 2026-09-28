// lib/ui.js
// כל מה שקשור לתצוגה בטרמינל: צבעים, מסגרות, כותרות, אנימציות טקסט.
// אין תלות בחבילות חיצוניות — רק קודי ANSI רגילים.

'use strict';

// ---- קודי צבע ANSI ----
// כל קוד כזה "מדליק" צבע או סגנון, ו-reset מכבה הכל.
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  italic: '\x1b[3m',
  underline: '\x1b[4m',

  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m',

  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',

  bgBlue: '\x1b[44m',
  bgGreen: '\x1b[42m',
  bgMagenta: '\x1b[45m',
  bgRed: '\x1b[41m',
  bgGray: '\x1b[100m',
};

// פונקציית עזר קטנה שעוטפת טקסט בצבע ואז מאפסת
function paint(str, ...codes) {
  return codes.join('') + str + C.reset;
}

// קיצורים נוחים
const c = {
  title: (s) => paint(s, C.bold, C.brightCyan),
  ok: (s) => paint(s, C.brightGreen),
  err: (s) => paint(s, C.brightRed),
  warn: (s) => paint(s, C.brightYellow),
  info: (s) => paint(s, C.brightBlue),
  dim: (s) => paint(s, C.gray),
  cmd: (s) => paint(s, C.bold, C.brightYellow),
  key: (s) => paint(` ${s} `, C.bgGray, C.white, C.bold),
  accent: (s) => paint(s, C.brightMagenta),
};

// ---- חישוב "רוחב" תצוגה של מחרוזת ----
// טקסט עברי הוא תו אחד ברוחב, אבל אימוג'י תופס לרוב 2.
// זה חשוב כדי שמסגרות ייראו ישרות.
// מסירים קודי ANSI לפני המדידה.
const ANSI_RE = /\x1b\[[0-9;]*m/g;

function displayWidth(str) {
  const clean = str.replace(ANSI_RE, '');
  let width = 0;
  for (const ch of clean) {
    const code = ch.codePointAt(0);
    // טווחי אימוג'י / תווים רחבים נפוצים -> רוחב 2
    if (
      (code >= 0x1f300 && code <= 0x1faff) ||
      (code >= 0x2600 && code <= 0x27bf) ||
      (code >= 0x1f000 && code <= 0x1f2ff) ||
      code === 0x2705 || code === 0x274c || code === 0x2764 ||
      (code >= 0x1f1e6 && code <= 0x1f1ff)
    ) {
      width += 2;
    } else if (code === 0xfe0f || code === 0x200d) {
      // variation selector / ZWJ — לא תופסים רוחב
      width += 0;
    } else {
      width += 1;
    }
  }
  return width;
}

// רוחב הטרמינל (עם ברירת מחדל אם לא זמין)
function termWidth() {
  return Math.min(process.stdout.columns || 80, 100);
}

// ---- מסגרת מסביב לבלוק טקסט ----
// רק פס משמאל, בלי גבול ימני: ככה המסגרת לא נשברת כשמקטינים את החלון,
// כשיש עברית (הטרמינל הופך כיוון) או כשהטרמינל מודד אימוג'י אחרת מאיתנו.
function box(lines, opts = {}) {
  const color = opts.color || C.brightCyan;
  const pad = ' '.repeat(opts.pad ?? 1);
  const inner = Math.max(...lines.map(displayWidth), opts.minWidth || 0);
  const ruleLen = Math.max(10, Math.min(inner + pad.length * 2, termWidth() - 2));

  const out = [color + '╭' + '─'.repeat(ruleLen) + C.reset];
  for (const line of lines) {
    out.push(color + '│' + C.reset + (line ? pad + line : ''));
  }
  out.push(color + '╰' + '─'.repeat(ruleLen) + C.reset);
  return out.join('\n');
}

// כותרת גדולה עם רקע
function banner(text, color = C.bgMagenta) {
  const w = termWidth() - 1; // בלי העמודה האחרונה — חלק מהטרמינלים קופצים שורה
  const label = '  ' + text + '  ';
  const gap = Math.max(0, w - displayWidth(label));
  return paint(label + ' '.repeat(gap), color, C.white, C.bold);
}

// קו מפריד
function rule(char = '─', color = C.gray) {
  return paint(char.repeat(termWidth()), color);
}

// פס התקדמות
function progressBar(done, total, width = 30) {
  const ratio = total === 0 ? 0 : done / total;
  const filled = Math.round(ratio * width);
  const empty = width - filled;
  const bar =
    paint('█'.repeat(filled), C.brightGreen) +
    paint('░'.repeat(empty), C.gray);
  const pct = Math.round(ratio * 100);
  return `${bar} ${c.ok(pct + '%')} ${c.dim(`(${done}/${total})`)}`;
}

// ---- רינדור טקסט לימוד עם עיצוב "markdown-lite" ----
// תומך ב: **מודגש**, `פקודה`, שורות שמתחילות ב-> כטיפ,
// ובורר כותרות ## .
function renderTeach(text) {
  const lines = text.split('\n');
  const out = [];
  for (let line of lines) {
    // כותרת
    if (line.startsWith('## ')) {
      out.push('\n' + c.title('▌ ' + line.slice(3)));
      continue;
    }
    // ציטוט/טיפ
    if (line.startsWith('> ')) {
      out.push(paint('  💡 ', '') + c.warn(inline(line.slice(2))));
      continue;
    }
    // רשימה
    if (line.startsWith('- ')) {
      out.push('  ' + c.accent('•') + ' ' + inline(line.slice(2)));
      continue;
    }
    out.push(inline(line));
  }
  return out.join('\n');
}

// עיצוב בתוך שורה: `פקודה` ו-**מודגש**
function inline(s) {
  s = s.replace(/`([^`]+)`/g, (_, m) => c.cmd(m));
  s = s.replace(/\*\*([^*]+)\*\*/g, (_, m) => paint(m, C.bold, C.white));
  return s;
}

// שובר טקסט "markdown-lite" לשורות ברוחב נתון, בלי לשבור `קוד` או **מודגש** באמצע.
// מחזיר מערך של שורות גולמיות (לפני צביעה).
function wrapMarkdown(text, width) {
  const measure = (t) => displayWidth(t.replace(/`|\*\*/g, ''));
  const out = [];
  for (const para of String(text).split('\n')) {
    const tokens = para.match(/\*\*[^*]+\*\*\S*|`[^`]*`\S*|\S+/g);
    if (!tokens) { out.push(''); continue; }
    let line = '';
    for (const tok of tokens) {
      const next = line ? line + ' ' + tok : tok;
      if (line && measure(next) > width) {
        out.push(line);
        line = tok;
      } else {
        line = next;
      }
    }
    out.push(line);
  }
  return out;
}

// מסגרת לטקסט markdown-lite: שבירת שורות + צביעה
function textBox(header, text, opts = {}) {
  const width = Math.max(30, termWidth() - 6);
  const lines = [header, '', ...wrapMarkdown(text, width).map(inline)];
  return box(lines, opts);
}

// ניקוי מסך
// 2J מנקה את מה שרואים, אבל הטרמינל של המק דוחף את זה להיסטוריית הגלילה —
// ואז גוללים למעלה ורואים את כל המסכים הקודמים. 3J מוחק גם את היסטוריית הגלילה,
// כך שכל מסך חדש באמת מחליף את הקודם (כמו הפקודה clear במק).
function clear() {
  process.stdout.write('\x1b[H\x1b[2J\x1b[3J');
}

// אנימציית הקלדה קלה (השהיה קצרה בין תווים)
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function typeLine(str, delay = 6) {
  if (process.env.NO_ANIM) {
    process.stdout.write(str + '\n');
    return;
  }
  for (const ch of str) {
    process.stdout.write(ch);
    if (delay > 0) await sleep(delay);
  }
  process.stdout.write('\n');
}

module.exports = {
  C,
  c,
  paint,
  box,
  banner,
  rule,
  progressBar,
  renderTeach,
  inline,
  wrapMarkdown,
  textBox,
  clear,
  displayWidth,
  termWidth,
  sleep,
  typeLine,
};
