// lib/engine.js
// המנוע של הקורס: "שֶׁל" מדומה שמריץ פקודות אמיתיות בתוך ארגז החול,
// בודק אם המשימה הושלמה, נותן רמזים, ומעניק נקודות.

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');
const { PLAYGROUND_DIR } = require('./storage');
const sandbox = require('./sandbox');
const detect = require('./detect');
const ui = require('./ui');
const { c, C } = ui;
const { randomCheer, randomJoke } = require('./jokes');

// ---- קלט: תור שורות ----
// עובד גם כשמקלידים וגם כשמזרימים קלט מקובץ (pipe) — שום שורה לא הולכת לאיבוד.
// חייבים לקרוא ל-attachQueue מיד אחרי יצירת ה-readline.
function attachQueue(rl) {
  if (rl.__queue) return rl.__queue;
  const q = { lines: [], waiters: [], closed: false };
  rl.on('line', (line) => {
    const w = q.waiters.shift();
    if (w) w(line);
    else q.lines.push(line);
  });
  rl.on('close', () => {
    q.closed = true;
    for (const w of q.waiters.splice(0)) w(null);
  });
  rl.__queue = q;
  return q;
}

// כשהקלט נגמר (Ctrl+D או סוף קובץ) — יוצאים יפה. ההתקדמות כבר נשמרה.
function onInputEnd() {
  console.log('\n' + c.dim('👋 להתראות! ההתקדמות נשמרה.'));
  process.exit(0);
}

// שאלה למשתמש. history:true = השורה נשמרת בהיסטוריית החצים (רק לפקודות של ה-shell)
function ask(rl, question, opts = {}) {
  const q = attachQueue(rl);
  const tty = !!process.stdin.isTTY;
  const done = (line) => {
    if (line === null) return onInputEnd();
    if (!opts.history && Array.isArray(rl.history) && rl.history[0] === line) rl.history.shift();
    return line;
  };
  if (q.lines.length) {
    const line = q.lines.shift();
    if (!tty) process.stdout.write(question + line + '\n');
    return Promise.resolve(done(line));
  }
  if (q.closed) return Promise.resolve(done(null));
  if (tty) {
    rl.setPrompt(question);
    rl.prompt();
  } else {
    process.stdout.write(question);
  }
  return new Promise((resolve) =>
    q.waiters.push((line) => {
      if (!tty && line !== null) process.stdout.write(line + '\n');
      resolve(done(line));
    })
  );
}

// ---- יצירת "שֶׁל" מדומה ----
// sandbox: עובדים בתוך ארגז החול, מותר לכתוב/למחוק.
// explore: עובדים על הבית האמיתי, קריאה בלבד.
function createShell(mode = 'sandbox') {
  const base = mode === 'explore' ? os.homedir() : PLAYGROUND_DIR;
  return {
    mode,
    base,
    cwd: base,
    prevCwd: null,
    restrictTo: mode === 'explore' ? null : PLAYGROUND_DIR,
    writesAllowed: mode !== 'explore',
    env: {},       // משתנים שהמשתמש הגדיר (FOOD=פיצה / export CITY=...)
    aliases: {},   // קיצורים (alias ll='ls -la')
    history: [],   // היסטוריית פקודות (history / !!)
    reset() {
      this.cwd = this.base;
      this.prevCwd = null;
    },
    // הנתיב היחסי שיוצג בפרומפט
    promptPath() {
      if (this.mode === 'explore') {
        const rel = path.relative(os.homedir(), this.cwd);
        return rel === '' ? '~' : rel.startsWith('..') ? this.cwd : '~/' + rel;
      }
      const rel = path.relative(PLAYGROUND_DIR, this.cwd);
      return rel === '' ? 'playground' : 'playground/' + rel;
    },
  };
}

// ---- פירוק שורת פקודה ----

// מפצל למילים כמו ש-shell עושה: מכבד "מרכאות", 'גרשיים' ו-\ לפני רווח
function splitArgs(str) {
  const out = [];
  let cur = '';
  let quote = null;
  let has = false;
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (quote) {
      if (ch === quote) quote = null;
      else cur += ch;
      continue;
    }
    if (ch === '"' || ch === "'") { quote = ch; has = true; continue; }
    if (ch === '\\' && i + 1 < str.length) { cur += str[++i]; has = true; continue; }
    if (/\s/.test(ch)) {
      if (has) { out.push(cur); cur = ''; has = false; }
      continue;
    }
    cur += ch;
    has = true;
  }
  if (has) out.push(cur);
  return out;
}

// מפצל שורה ל"מקטעים" לפי | ; && || & (מחוץ למרכאות ומחוץ ל-$( ))
function splitTopLevel(line) {
  const segs = [];
  let cur = '';
  let quote = null;
  let depth = 0;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    const nx = line[i + 1];
    const pv = line[i - 1];
    if (quote) {
      cur += ch;
      if (ch === quote) quote = null;
      continue;
    }
    if (ch === '\\' && nx !== undefined) { cur += ch + nx; i++; continue; }
    if (ch === "'" || ch === '"') { quote = ch; cur += ch; continue; }
    if (ch === '(') { depth++; cur += ch; continue; }
    if (ch === ')') { depth = Math.max(0, depth - 1); cur += ch; continue; }
    if (depth > 0) { cur += ch; continue; }
    let sep = null;
    if (ch === '&' && nx === '&') sep = '&&';
    else if (ch === '|' && nx === '|') sep = '||';
    else if (ch === '|') sep = '|';
    else if (ch === ';') sep = ';';
    else if (ch === '&' && pv !== '>' && nx !== '>') sep = '&';
    if (sep) {
      segs.push({ text: cur.trim(), sep });
      cur = '';
      i += sep.length - 1;
      continue;
    }
    cur += ch;
  }
  if (cur.trim() || !segs.length) segs.push({ text: cur.trim(), sep: null });
  return segs;
}

// מילות מפתח של bash שיכולות לבוא לפני הפקודה האמיתית במקטע
const LEAD_WORDS = new Set(['do', 'then', 'else', 'elif', 'if', 'while', 'until', '!', 'time', '{', '}', '(']);

// הפקודה האמיתית של מקטע + הארגומנטים שלה
function commandOf(segText) {
  const words = splitArgs(segText);
  let i = 0;
  while (i < words.length && (LEAD_WORDS.has(words[i]) || /^[A-Za-z_]\w*=/.test(words[i]))) i++;
  return { cmd: words[i] || '', args: words.slice(i + 1) };
}

// יעדי הפניה (> קובץ / >> קובץ) בשורה. מתעלמים מתוכן שבתוך מרכאות.
function redirectTargets(line) {
  const stripped = line.replace(/'[^']*'|"(?:\\.|[^"\\])*"/g, 'Q');
  const targets = [];
  const re = />>?\s*([^\s|;&<>()]+)/g;
  let m;
  while ((m = re.exec(stripped))) targets.push(m[1]);
  return targets;
}

// ---- בטיחות ----

// פקודות שכותבות/משנות קבצים
const WRITE_CMDS = new Set([
  'rm', 'rmdir', 'mv', 'cp', 'mkdir', 'touch', 'tee',
  'chmod', 'chown', 'chgrp', 'ln', 'truncate', 'shred',
  'install', 'rsync', 'unzip', 'tar', 'patch',
]);

// דפוסים מסוכנים שנחסמים תמיד, בכל מצב
const DANGER = [
  { re: /\bsudo\b/, why: 'אין צורך ב-sudo בקורס הזה — זה מריץ דברים כמנהל המערכת. 👑 כוח גדול = אחריות גדולה.' },
  { re: /:\s*\(\s*\)\s*\{/, why: 'זה נראה כמו "פצצת fork" 💣 — חסום.' },
  { re: /\b(mkfs|dd|shutdown|reboot|halt|diskutil|launchctl|crontab|passwd|chsh)\b/, why: 'פקודת מערכת רגישה — חסומה בקורס.' },
  { re: /\b(kill|killall|pkill)\b/, why: 'בקורס לא סוגרים תהליכים (כדי לא לסגור בטעות משהו חשוב). את kill מתרגלים בחלון טרמינל רגיל, על תהליך שיצרת בעצמך.' },
  { re: />\s*\/dev\/(?!null\b)/, why: 'כתיבה להתקני מערכת חסומה.' },
  { re: /--no-preserve-root/, why: 'לא. פשוט לא. 😅' },
  { re: /\b(curl|wget)\b[^|]*\|\s*(ba|z)?sh\b/, why: 'להריץ סקריפט ישר מהאינטרנט (curl | bash) — לא בקורס. בחיים האמיתיים: רק ממקורות שאתה סומך עליהם!' },
  { re: /\bgit\s+config\s+--global\s+\S+\s+\S/, why: 'בקורס משנים הגדרות git רק לריפו המקומי (בלי --global), כדי לא לגעת בהגדרות האמיתיות שלך.' },
  { re: /\bbrew\s+(install|uninstall|upgrade|remove|reinstall)\b|\bnpm\s+(i|install|uninstall|update)\b|\bapt(-get)?\s+(install|remove)\b|\bpip3?\s+install\b/, why: 'התקנות עושים מחוץ לקורס, בחלון טרמינל רגיל — כדי שאתה תחליט מה נכנס למחשב שלך.' },
  { re: /\bssh-keygen\b/, why: 'יצירת מפתחות SSH עושים בחלון טרמינל רגיל — הקורס לא נוגע בתיקיית ~/.ssh שלך.' },
];

// האם נתיב p נמצא בתוך התיקייה root
function isInside(p, root) {
  const rel = path.relative(root, p);
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

// האם ארגומנט מצביע אל מחוץ לארגז החול
function pointsOutside(arg, shell) {
  if (/^~/.test(arg) || /\$\{?HOME\b/.test(arg)) return true;
  if (/^\$/.test(arg)) return false; // משתנה אחר — אין לנו דרך לדעת, נותנים לעבור
  return !isInside(path.resolve(shell.cwd, arg), shell.restrictTo);
}

// הפעולות ב-git שמותר להריץ במצב חקירה (קריאה בלבד)
const GIT_READONLY = /^git\s+(--version|version|status|log|diff|branch\s*$|show|config\s+(--global\s+|--local\s+)?(--get\s+|--list|-l)?[\w.]*\s*$)/;

// בודק אם פקודה חסומה. מחזיר {blocked, why} או {blocked:false}
function classify(line, shell) {
  const trimmed = line.trim();

  for (const d of DANGER) {
    if (d.re.test(trimmed)) return { blocked: true, why: d.why };
  }

  const segs = splitTopLevel(trimmed);

  // ארגז החול: מותר לקרוא מכל מקום, אבל לכתוב רק בפנים
  if (shell.restrictTo) {
    for (const seg of segs) {
      let { cmd, args } = commandOf(seg.text);
      if (cmd === 'xargs') {
        const inner = args.find((a) => !a.startsWith('-'));
        if (inner) ({ cmd, args } = { cmd: inner, args: args.slice(args.indexOf(inner) + 1) });
      }
      const writes =
        WRITE_CMDS.has(cmd) ||
        (cmd === 'find' && /\s-(delete|exec|ok)\b/.test(seg.text)) ||
        (cmd === 'sed' && /\s-i\b/.test(seg.text)) ||
        (['curl', 'wget'].includes(cmd) && /\s-\w*[oO]\b/.test(seg.text));
      if (!writes) continue;
      for (const a of args) {
        if (a.startsWith('-')) continue;
        if (pointsOutside(a, shell)) {
          return { blocked: true, why: `הפקודה "${cmd}" מנסה לשנות משהו מחוץ לארגז החול (${a}). כאן משנים רק קבצים בתוך playground 🏖️` };
        }
      }
    }
    for (const t of redirectTargets(trimmed)) {
      if (t === '/dev/null') continue;
      if (pointsOutside(t, shell)) {
        return { blocked: true, why: `כתיבה לקובץ מחוץ לארגז החול (${t}) חסומה. כתוב לקובץ בתוך playground.` };
      }
    }
  }

  // מצב חקירה: קריאה בלבד — חוסמים כל פקודה שכותבת
  if (!shell.writesAllowed) {
    for (const seg of segs) {
      const { cmd, args } = commandOf(seg.text);
      const inner = cmd === 'xargs' ? args.find((a) => !a.startsWith('-')) : null;
      if (WRITE_CMDS.has(cmd) || (inner && WRITE_CMDS.has(inner))) {
        return { blocked: true, why: `במצב חקירה (המחשב האמיתי שלך) אסור לשנות קבצים. הפקודה "${inner || cmd}" חסומה כאן. 🔒` };
      }
      if (cmd === 'find' && /\s-(delete|exec|ok)\b/.test(seg.text)) {
        return { blocked: true, why: 'במצב חקירה find רק מחפש — בלי -delete או -exec. 🔒' };
      }
      if (cmd === 'sed' && /\s-i\b/.test(seg.text)) {
        return { blocked: true, why: 'sed -i משנה קבצים — חסום במצב חקירה. 🔒' };
      }
      if (['curl', 'wget'].includes(cmd) && /\s-\w*[oO]\b/.test(seg.text)) {
        return { blocked: true, why: 'שמירת הורדה לקובץ חסומה במצב חקירה. 🔒' };
      }
      if (cmd === 'git' && !GIT_READONLY.test(seg.text.trim())) {
        return { blocked: true, why: 'במצב חקירה מותר רק git לקריאה (status, log, --version...). 🔒' };
      }
    }
    for (const t of redirectTargets(trimmed)) {
      if (t !== '/dev/null') {
        return { blocked: true, why: 'הפניית פלט לקובץ (>) חסומה במצב חקירה כדי לא לשנות קבצים אמיתיים. (מותר: 2>/dev/null)' };
      }
    }
  }

  return { blocked: false };
}

// תוכנות "מסך מלא" שלא יכולות לרוץ בתוך הקורס — מחזיר הסבר או null
function interactiveWhy(line) {
  for (const seg of splitTopLevel(line)) {
    const { cmd, args } = commandOf(seg.text);
    const noArgs = args.length === 0;
    if (['vim', 'vi', 'nvim'].includes(cmd)) {
      return `${cmd} הוא עורך מסך-מלא, אז הוא לא רץ בתוך הקורס. נסה אותו בחלון טרמינל רגיל! יציאה: Esc ואז :q! 😅 (הבדיחה הכי ותיקה בתכנות: "איך יוצאים מ-vim?")`;
    }
    if (['nano', 'pico', 'emacs', 'micro'].includes(cmd)) {
      return `${cmd} פותח עורך טקסט במסך מלא — זה לא עובד בתוך הקורס. נסה בחלון טרמינל רגיל (ב-nano: Ctrl+X ליציאה). כאן כותבים לקבצים עם echo "..." > file.`;
    }
    if (['less', 'more', 'most'].includes(cmd)) {
      return `${cmd} מציג קובץ עמוד-עמוד (q ליציאה) — בתוך הקורס השתמש ב-cat, head או tail במקום.`;
    }
    if (['top', 'htop', 'btop', 'watch'].includes(cmd)) {
      return `${cmd} מתעדכן כל הזמן במסך מלא — נסה אותו בחלון טרמינל רגיל (q ליציאה). כאן אפשר: ps aux | head`;
    }
    if (cmd === 'ssh' && !(args.length === 1 && args[0] === '-V')) {
      return 'ssh פותח חיבור למחשב אחר — בקורס רק לומדים עליו. (ssh -V מראה גרסה)';
    }
    if (['telnet', 'ftp', 'sftp', 'mysql', 'psql', 'sqlite3', 'irb'].includes(cmd)) {
      return `${cmd} הוא כלי אינטראקטיבי — נסה אותו בחלון טרמינל רגיל.`;
    }
    if (['python', 'python3', 'node', 'ruby', 'bash', 'zsh', 'sh', 'fish'].includes(cmd) && noArgs) {
      return `${cmd} לבד פותח מצב אינטראקטיבי (REPL) — לא עובד בתוך הקורס. אפשר: ${cmd} --version, או להריץ קובץ: ${cmd} script`;
    }
    if (cmd === 'tail' && args.some((a) => /^-[a-zA-Z]*[fF]/.test(a))) {
      return 'tail -f עוקב אחרי קובץ לנצח (עד Ctrl+C) — בקורס השתמש ב-tail -n 5 במקום.';
    }
    if (cmd === 'git' && args[0] === 'commit' && !args.some((a) => /^-[a-zA-Z]*m|^--message|^-F|^--no-edit/.test(a))) {
      return 'git commit בלי -m פותח עורך טקסט. בקורס כותבים את ההודעה ישר: git commit -m "מה עשיתי"';
    }
    if (cmd === 'git' && ((args[0] === 'rebase' && args.includes('-i')) || (args[0] === 'add' && args.includes('-p')))) {
      return 'זה מצב אינטראקטיבי של git — נסה אותו בחלון טרמינל רגיל.';
    }
    if (cmd === 'sleep' && Number(args[0]) > 8) {
      return 'בקורס כל פקודה מוגבלת ל-10 שניות. נסה sleep 2 😴';
    }
    if (cmd === 'cat' && noArgs && splitTopLevel(line)[0].text === seg.text) {
      return 'cat בלי שם קובץ מחכה שתקליד לתוכו (עד Ctrl+D). בקורס כתוב cat ושם של קובץ, למשל: cat welcome.txt';
    }
  }
  return null;
}

// ---- מקלדת בעברית? ----
// "ךד" זה בעצם ls שהוקלד כשהמקלדת על עברית. ממירים ומציעים.
const HEB_TO_ENG = {
  'ש': 'a', 'נ': 'b', 'ב': 'c', 'ג': 'd', 'ק': 'e', 'כ': 'f', 'ע': 'g', 'י': 'h', 'ן': 'i', 'ח': 'j',
  'ל': 'k', 'ך': 'l', 'צ': 'm', 'מ': 'n', 'ם': 'o', 'פ': 'p', '/': 'q', 'ר': 'r', 'ד': 's', 'א': 't',
  'ו': 'u', 'ה': 'v', "'": 'w', 'ס': 'x', 'ט': 'y', 'ז': 'z', 'ת': ',', 'ץ': '.', '.': '/', 'ף': ';',
};
const KNOWN_CMDS = new Set([
  'ls', 'cd', 'pwd', 'cat', 'echo', 'mkdir', 'touch', 'rm', 'cp', 'mv', 'grep', 'find', 'head', 'tail',
  'wc', 'sort', 'uniq', 'man', 'clear', 'whoami', 'date', 'which', 'chmod', 'git', 'ps', 'history',
  'alias', 'export', 'less', 'nano', 'code', 'open', 'node', 'npm', 'python3', 'curl', 'ping', 'cut',
  'sed', 'awk', 'tr', 'rmdir', 'env', 'uptime', 'type', 'seq', 'for', 'du', 'df', 'file', 'stat',
]);

function hebrewLayoutFix(line) {
  const first = line.trim().split(/\s+/)[0];
  if (!/[\u05d0-\u05ea]/.test(first)) return null;
  const conv = [...first].map((ch) => HEB_TO_ENG[ch] || ch).join('');
  if (!KNOWN_CMDS.has(conv)) return null;
  return [...line.trim()].map((ch) => HEB_TO_ENG[ch] || ch).join('');
}

// ---- מרכאות מהמקלדת העברית ----
// ״ (גרשיים) ו-׳ (גרש) נראים כמו מרכאות, אבל בשביל ה-shell הם סתם אותיות.
// מחליפים אותם — חוץ ממקרים שהם באמצע מילה עברית (צה״ל, ג׳ירפה).
const HEB = '\u05d0-\u05ea';
const GERSHAYIM_RE = new RegExp(`(?<![${HEB}])\u05f4|\u05f4(?![${HEB}])`, 'g');
const GERESH_RE = new RegExp(`(?<![${HEB}])\u05f3|\u05f3(?![${HEB}])`, 'g');

function normalizeQuotes(line) {
  return line
    .replace(GERSHAYIM_RE, '"')
    .replace(GERESH_RE, "'")
    .replace(/[\u201c\u201d\u201e\u2033]/g, '"')   // “ ” „ ″
    .replace(/[\u2018\u2019\u201a\u2032]/g, "'");  // ‘ ’ ‚ ′
}

// ---- פקודות מובנות (שאנחנו מבצעים בעצמנו כי הן משנות את ה-shell עצמו) ----

const ASSIGN_RE = /^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/s;

function isBuiltin(segText) {
  const words = splitArgs(segText);
  if (!words.length) return false;
  if (['cd', 'export', 'alias', 'unalias', 'history', 'clear'].includes(words[0])) return true;
  return words.length === 1 && ASSIGN_RE.test(segText.trim());
}

// מחליף $VAR / ${VAR} בערכים (מהמשתנים של הקורס ואז מהמערכת)
function expandVars(str, shell) {
  return str.replace(/\$\{(\w+)\}|\$(\w+)/g, (m, a, b) => {
    const name = a || b;
    if (name in shell.env) return shell.env[name];
    if (name in process.env) return process.env[name];
    return '';
  });
}

function setVar(shell, text) {
  const m = text.match(ASSIGN_RE);
  if (!m) return false;
  const rawValue = m[2];
  let value = splitArgs(rawValue).join(' ');
  if (!rawValue.startsWith("'")) value = expandVars(value, shell);
  shell.env[m[1]] = value;
  return true;
}

function runBuiltin(segText, shell) {
  const ok = (stdout = '') => ({ result: { stdout, stderr: '', code: 0 } });
  const fail = (stderr) => ({ result: { stdout: '', stderr, code: 1 } });
  const text = segText.trim();
  const words = splitArgs(text);
  const name = words[0];

  if (ASSIGN_RE.test(text) && words.length === 1) {
    setVar(shell, text);
    return ok();
  }

  if (name === 'cd') {
    let target = words[1];
    let print = '';
    if (!target) target = shell.mode === 'explore' ? os.homedir() : shell.base;
    else if (target === '-') {
      if (!shell.prevCwd) return fail('cd: עוד לא היית בתיקייה קודמת\n');
      target = shell.prevCwd;
      print = target + '\n';
    } else {
      target = target.replace(/^~(?=$|\/)/, os.homedir());
      target = expandVars(target, shell);
    }
    const next = path.resolve(shell.cwd, target);

    // הגבלה לארגז החול
    if (shell.restrictTo && !isInside(next, shell.restrictTo)) {
      return fail('אי אפשר לצאת מארגז החול. נשארים בפנים 🙂\n');
    }
    let st;
    try { st = fs.statSync(next); } catch { st = null; }
    if (!st) return fail(`cd: אין תיקייה כזו: ${words[1]}\n`);
    if (!st.isDirectory()) return fail(`cd: זה קובץ, לא תיקייה: ${words[1]}\n`);
    shell.prevCwd = shell.cwd;
    shell.cwd = next;
    return ok(print);
  }

  if (name === 'clear') {
    ui.clear();
    return ok();
  }

  if (name === 'export') {
    const rest = text.slice('export'.length).trim();
    if (!rest) {
      const lines = Object.entries(shell.env).map(([k, v]) => `export ${k}="${v}"`);
      return ok(lines.length ? lines.join('\n') + '\n' : '(עוד לא הגדרת משתנים)\n');
    }
    if (!setVar(shell, rest)) {
      if (/^[A-Za-z_]\w*$/.test(rest)) return ok(); // export NAME — בסדר
      return fail('export: הצורה הנכונה היא export NAME=value (בלי רווחים סביב ה-=)\n');
    }
    return ok();
  }

  if (name === 'alias') {
    const rest = text.slice('alias'.length).trim();
    if (!rest) {
      const lines = Object.entries(shell.aliases).map(([k, v]) => `alias ${k}='${v}'`);
      return ok(lines.length ? lines.join('\n') + '\n' : '(עוד אין קיצורים)\n');
    }
    const m = rest.match(/^([\w.-]+)=(.*)$/s);
    if (!m) {
      if (shell.aliases[rest]) return ok(`alias ${rest}='${shell.aliases[rest]}'\n`);
      return fail("alias: הצורה הנכונה היא alias name='command' (בלי רווחים סביב ה-=)\n");
    }
    shell.aliases[m[1]] = splitArgs(m[2]).join(' ');
    return ok();
  }

  if (name === 'unalias') {
    if (!shell.aliases[words[1]]) return fail(`unalias: אין קיצור בשם ${words[1] || ''}\n`);
    delete shell.aliases[words[1]];
    return ok();
  }

  if (name === 'history') {
    const lines = shell.history.map((h, i) => `${String(i + 1).padStart(5)}  ${h}`);
    return ok(lines.join('\n') + '\n');
  }

  return fail(`${name}: לא נתמך\n`);
}

// מחליף alias במילה הראשונה של השורה
function expandAlias(line, shell) {
  const m = line.match(/^(\S+)(.*)$/s);
  if (m && shell.aliases[m[1]]) return shell.aliases[m[1]] + m[2];
  return line;
}

// ---- הרצה אמיתית ----

const BASH = fs.existsSync('/bin/bash') ? '/bin/bash' : undefined;

function buildEnv(shell) {
  const env = {
    ...process.env,
    ...shell.env,
    PWD: shell.cwd,
    PAGER: 'cat',
    GIT_PAGER: 'cat',
    GIT_TERMINAL_PROMPT: '0',
    LANG: process.env.LC_ALL || process.env.LANG || 'en_US.UTF-8',
    // במק, ב-en_US.UTF-8 אין סדר מיון לעברית: sort לא ממיין ו-uniq חושב שכל השורות זהות.
    // מיון לפי בתים (C) מסדר עברית נכון לפי א-ב.
    LC_COLLATE: 'C',
  };
  delete env.LC_ALL; // LC_ALL היה דורס את LC_COLLATE
  if (shell.mode === 'sandbox') {
    // בארגז החול: ענף ברירת מחדל main, בלי לגעת בהגדרות ה-git של המשתמש
    Object.assign(env, { GIT_CONFIG_COUNT: '1', GIT_CONFIG_KEY_0: 'init.defaultBranch', GIT_CONFIG_VALUE_0: 'main' });
  }
  return env;
}

// מריץ פקודה אמיתית ומחזיר {stdout, stderr, code}
function runReal(cmd, shell) {
  try {
    const stdout = execSync(cmd, {
      cwd: shell.cwd,
      encoding: 'utf8',
      timeout: 10000,
      maxBuffer: 2 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: BASH,
      env: buildEnv(shell),
    });
    return { stdout, stderr: '', code: 0 };
  } catch (e) {
    if (e.code === 'ETIMEDOUT' || e.signal === 'SIGTERM') {
      return {
        stdout: e.stdout ? e.stdout.toString() : '',
        stderr: '⏱️ הפקודה רצה יותר מ-10 שניות ונעצרה.\n',
        code: 124,
      };
    }
    return {
      stdout: e.stdout ? e.stdout.toString() : '',
      stderr: e.stderr ? e.stderr.toString() : (e.message || 'שגיאה'),
      code: typeof e.status === 'number' ? e.status : 1,
    };
  }
}

// האם כל מרכאה נפתחה ונסגרה
function quotesBalanced(line) {
  let quote = null;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quote) {
      if (ch === quote) quote = null;
      else if (ch === '\\' && quote === '"') i++;
      continue;
    }
    if (ch === '\\') { i++; continue; }
    if (ch === '"' || ch === "'") quote = ch;
  }
  return quote === null;
}

// פקודה חיצונית: בדיקת בטיחות → הרצה
function runExternal(line, shell) {
  const cls = classify(line, shell);
  if (cls.blocked) return { blocked: true, why: cls.why };
  const inter = interactiveWhy(line);
  if (inter) return { blocked: true, why: inter };

  if (!quotesBalanced(line)) {
    return { blocked: true, why: 'חסרה מרכאה: מרכאות באות תמיד בזוגות — אחת בהתחלה ואחת בסוף. למשל: echo "שלום עולם"' };
  }

  let cmd = line;
  let note = null;
  const man = line.match(/^man\s+([\w.-]+)$/);
  if (man) {
    cmd = `man ${man[1]} 2>&1 | col -bx | head -n 60`;
    note = 'מוצגות 60 השורות הראשונות של המדריך. בטרמינל רגיל man נפתח במסך מלא: חצים לגלילה, q ליציאה.';
  }
  return { result: runReal(cmd, shell), note };
}

// ---- הפונקציה המרכזית: מבצע שורה שהמשתמש הקליד ----
// מחזיר {blocked, why} או {cmd, result:{stdout,stderr,code}, notes:[]}
function executeCommand(raw, shell) {
  let line = raw.trim();
  const notes = [];

  // מקלדת עברית נותנת ״ ו-׳ במקום " ו-' — וה-shell לא מזהה אותם כמרכאות
  const fixedQuotes = normalizeQuotes(line);
  if (fixedQuotes !== line) {
    line = fixedQuotes;
    notes.push('↻ ' + line);
    if (!shell.quoteTipShown) {
      shell.quoteTipShown = true;
      notes.push('במקלדת עברית יוצא ״ במקום " — ה-shell מבין רק את המרכאות האנגליות, אז החלפתי בשבילך. (בטרמינל רגיל אין מי שיחליף — שם צריך את " האנגלי)');
    }
  }

  const fixed = hebrewLayoutFix(line);
  if (fixed) {
    return { blocked: true, why: `נראה שהמקלדת על עברית 🙃 התכוונת ל: ${fixed} ? (החלפת שפה: Ctrl+Space או Cmd+Space)` };
  }

  // !! = הפקודה הקודמת
  if (line.includes('!!')) {
    const last = shell.history[shell.history.length - 1];
    if (!last) return { blocked: true, why: 'אין עדיין פקודה קודמת ש-!! יכול לחזור עליה.' };
    line = line.split('!!').join(last);
    notes.push('↻ ' + line);
  }
  shell.history.push(line);

  line = expandAlias(line, shell);
  const segs = splitTopLevel(line);
  const hasPipe = segs.some((s) => s.sep === '|');
  const hasKeyword = segs.some((s) => /^(for|while|until|if|case|function|select|do|then|done|fi|esac|\{|\()(\s|$)/.test(s.text));
  const hasBuiltin = segs.some((s) => isBuiltin(s.text));

  // שורה עם cd/export/alias: מריצים מקטע-מקטע (כמו && ו-; אמיתיים)
  if (hasBuiltin && !hasPipe && !hasKeyword) {
    let stdout = '';
    let stderr = '';
    let code = 0;
    let prevSep = null;
    for (const s of segs) {
      const skip = (prevSep === '&&' && code !== 0) || (prevSep === '||' && code === 0);
      prevSep = s.sep;
      if (skip || !s.text) continue;
      const r = isBuiltin(s.text) ? runBuiltin(s.text, shell) : runExternal(s.text, shell);
      if (r.blocked) return r;
      if (r.note) notes.push(r.note);
      stdout += r.result.stdout;
      stderr += r.result.stderr;
      code = r.result.code;
    }
    return { cmd: line, result: { stdout, stderr, code }, notes };
  }

  const r = runExternal(line, shell);
  if (r.blocked) return r;
  if (r.note) notes.push(r.note);
  return { cmd: line, result: r.result, notes };
}

// הדפסת תוצאה של executeCommand
function printExec(ex) {
  if (ex.blocked) {
    console.log('   ' + c.err('🚫 ') + c.warn(ex.why));
    return;
  }
  for (const n of ex.notes.filter((n) => n.startsWith('↻'))) console.log('   ' + c.dim(n));
  if (ex.result.stdout) process.stdout.write(indent(ex.result.stdout));
  if (ex.result.stderr) process.stdout.write(indent(c.err(ex.result.stderr.replace(/\n$/, ''))));
  for (const n of ex.notes.filter((n) => !n.startsWith('↻'))) console.log('   ' + c.dim('ℹ️  ' + n));
}

// ---- בדיקת משימות ----

// בונה את ה-ctx שמועבר לפונקציית הבדיקה של משימה
function buildCtx(shell, raw, ex) {
  const result = ex.result;
  const inRoot = (p) => path.join(PLAYGROUND_DIR, p);
  const statOf = (p) => { try { return fs.statSync(p); } catch { return null; } };
  const stdout = result.stdout || '';
  return {
    raw: raw.trim(),                 // מה שהמשתמש הקליד בפועל
    cmd: (ex.cmd || raw).trim(),     // אחרי הרחבת !! ו-alias
    stdout,
    stderr: result.stderr || '',
    code: result.code,
    lines: stdout.split('\n').map((l) => l.trim()).filter(Boolean),
    cwd: shell.cwd,
    root: PLAYGROUND_DIR,
    home: os.homedir(),
    rel: path.relative(PLAYGROUND_DIR, shell.cwd).split(path.sep).join('/'),
    env: shell.env,
    aliases: shell.aliases,
    fs,
    path,
    // עזרי בדיקה יחסית לתיקייה הנוכחית
    exists: (p) => fs.existsSync(path.resolve(shell.cwd, p)),
    isDir: (p) => { const s = statOf(path.resolve(shell.cwd, p)); return !!s && s.isDirectory(); },
    read: (p) => { try { return fs.readFileSync(path.resolve(shell.cwd, p), 'utf8'); } catch { return null; } },
    // עזרי בדיקה יחסית לשורש ארגז החול
    rootExists: (p) => fs.existsSync(inRoot(p)),
    rootIsDir: (p) => { const s = statOf(inRoot(p)); return !!s && s.isDirectory(); },
    rootRead: (p) => { try { return fs.readFileSync(inRoot(p), 'utf8'); } catch { return null; } },
    rootList: (p = '') => { try { return fs.readdirSync(inRoot(p)); } catch { return []; } },
    rootMode: (p) => { const s = statOf(inRoot(p)); return s ? s.mode & 0o777 : null; },
    // מריץ פקודת קריאה קטנה (למשל git log) בתיקייה בתוך ארגז החול ומחזיר פלט
    run: (cmd, dir = '') => {
      try {
        return execSync(cmd, { cwd: inRoot(dir), encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 5000, shell: BASH, env: buildEnv(shell) });
      } catch { return ''; }
    },
    cmdMatches: (re) => re.test((ex.cmd || raw).trim()),
  };
}

// מחזיר ערך של שדה שיכול להיות פונקציה (prompt/hint/solution)
function resolve(v, ...args) {
  return typeof v === 'function' ? v(...args) : v;
}

// מפעיל את הבדיקה של משימה. מחזיר {ok, msg}
function evaluate(task, ctx) {
  try {
    if (typeof task.check === 'function') {
      const r = task.check(ctx);
      return { ok: r === true || !!(r && r.ok), msg: (r && typeof r === 'object' && r.msg) || '' };
    }
    if (task.expect) return { ok: task.expect.test(ctx.cmd), msg: '' };
  } catch (e) {
    return { ok: false, msg: 'שגיאה בבדיקה: ' + e.message };
  }
  return { ok: false, msg: '' };
}

// ---- הרצת שיעור שלם ----
// deps = { rl, progress, save }
async function runLesson(lesson, deps) {
  const { rl, progress, save } = deps;
  const shell = createShell(lesson.mode || 'sandbox');
  shell.reset();

  // כל שיעור בארגז החול מתחיל מארגז נקי — ככה הבדיקות תמיד צפויות
  if (shell.mode === 'sandbox') {
    sandbox.seed();
    if (typeof lesson.setup === 'function') lesson.setup(PLAYGROUND_DIR);
  }

  // ההסבר יכול להיות טקסט קבוע או פונקציה (למשל כשצריך לזהות מה מותקן)
  const teachText = resolve(lesson.teach, deps);

  ui.clear();
  console.log(ui.banner(`${lesson.emoji || '📘'} שיעור ${lesson.num}: ${lesson.title}`, C.bgBlue));
  console.log();
  console.log(ui.renderTeach(teachText));
  console.log();
  console.log('   ' + c.dim('😂 בדיחה לדרך: ') + c.dim(randomJoke()));
  console.log();

  // כלי שלא מותקן — מראים הסבר, והתרגול יחכה להתקנה
  if (lesson.requires && !detect.isInstalled(lesson.requires)) {
    const tool = detect.checkOne(lesson.requires);
    console.log(ui.box([
      c.err(`❌ ${tool.label} לא מותקן אצלך.`),
      '',
      'את ההסבר אפשר לקרוא כבר עכשיו. התרגול ייפתח אחרי ההתקנה:',
      c.cmd(detect.installHint(tool)),
      c.dim('(התקנות עושים בחלון טרמינל רגיל, ואז חוזרים לכאן)'),
    ], { color: C.brightYellow }));
    console.log();
    await ask(rl, c.dim('   [Enter לחזרה לתפריט] '));
    return 'menu';
  }

  await ask(rl, c.dim('   [Enter כדי להתחיל את התרגול] '));

  const tasks = lesson.tasks.filter((t) => !resolve(t.skipIf));
  let earned = 0;
  let taskIndex = 0;
  for (const task of tasks) {
    taskIndex++;
    const r = await runTask(task, taskIndex, tasks.length, shell, deps, teachText);
    if (r.status === 'menu') return 'menu';
    if (r.status === 'exit') return 'exit';
    if (r.status === 'ok') {
      progress.xp += 10;
      earned += 10;
      save(progress);
    }
  }

  // סיום שיעור
  const first = !progress.completed.includes(lesson.id);
  if (first) {
    progress.completed.push(lesson.id);
    progress.xp += 25; // בונוס סיום
    earned += 25;
  }
  save(progress);

  ui.clear();
  console.log(
    ui.box(
      [
        c.ok('🎉 סיימת את השיעור: ') + c.title(lesson.title),
        '',
        `הרווחת ${c.accent('+' + earned + ' XP')}  ·  סה"כ ${c.ok(progress.xp + ' XP')}`,
        first ? c.dim('(כולל בונוס סיום של 25 XP)') : c.dim('(חזרה על שיעור — בונוס הסיום ניתן רק בפעם הראשונה)'),
      ],
      { color: C.brightGreen }
    )
  );
  console.log();
  console.log('   ' + c.dim('😂 ') + c.dim(randomJoke()));
  console.log();
  if (typeof lesson.onComplete === 'function') await lesson.onComplete(deps);
  await ask(rl, c.dim('   [Enter לחזרה לתפריט] '));
  return 'done';
}

// ---- הרצת משימה בודדת ----
// מחזיר {status: 'ok'|'skipped'|'menu'|'exit', hints}
async function runTask(task, idx, total, shell, deps, teachText, opts = {}) {
  const { rl, progress, save } = deps;

  // משימת חידון (שאלה אמריקאית) — לנושאים תאורטיים
  if (task.quiz) {
    return runQuiz(task.quiz, idx, total, deps, teachText);
  }

  // משימת מידע בלבד (לחיצת Enter כדי להמשיך)
  if (task.info) {
    console.log();
    console.log(ui.renderTeach(resolve(task.info)));
    console.log();
    await ask(rl, c.dim('   [Enter להמשך] '));
    return { status: 'info', hints: 0 };
  }

  // משימת פקודה
  const label = opts.label || `משימה ${idx}/${total}`;
  console.log();
  console.log(ui.textBox(c.info(label), resolve(task.prompt), { color: C.brightBlue }));
  console.log('   ' + c.dim('מילות עזר: רמז · דלג · חזרה · בדיחה · תפריט'));
  console.log();

  const hints = [].concat(resolve(task.hint) || []);
  let hintIdx = 0;
  let attempts = 0;
  let joked = false;
  while (true) {
    const promptStr =
      ui.paint('➜', C.brightGreen) + ' ' +
      ui.paint(shell.promptPath(), C.brightCyan) + ' ' +
      ui.paint('$', C.gray) + ' ';
    const input = (await ask(rl, promptStr, { history: true })).trim();

    // מילות שליטה
    const lower = input.toLowerCase();
    if (['רמז', 'hint', '?'].includes(lower)) {
      progress.stats.hintsUsed++;
      save(progress);
      if (hints.length) {
        const h = hints[Math.min(hintIdx, hints.length - 1)];
        const tag = hints.length > 1 ? ` (${Math.min(hintIdx + 1, hints.length)}/${hints.length})` : '';
        console.log('   ' + c.warn(`💡 רמז${tag}: `) + ui.inline(h));
        if (hintIdx >= hints.length - 1 && task.solution) console.log('   ' + c.dim('זה הרמז האחרון. עדיין תקוע? "דלג" יראה את הפתרון.'));
        hintIdx++;
      } else {
        console.log('   ' + c.warn('💡 ') + 'אין רמז למשימה הזו' + (task.solution ? ' — אבל "דלג" יראה את הפתרון.' : '.'));
      }
      continue;
    }
    if (['דלג', 'skip'].includes(lower)) {
      const sol = resolve(task.solution);
      if (sol) console.log('   ' + c.dim('הפתרון היה: ') + c.cmd(sol));
      console.log('   ' + c.warn('דילגת על המשימה') + c.dim(' (בלי XP הפעם — אבל אפשר לחזור לשיעור מתי שרוצים).'));
      return { status: 'skipped', hints: hintIdx };
    }
    if (['חזרה', 'repeat', 'שוב', 'r'].includes(lower)) {
      console.log();
      console.log(c.title('📖 חזרה על החומר:'));
      console.log(ui.renderTeach(teachText || 'אין חומר להצגה.'));
      console.log();
      console.log(ui.textBox(c.info('ועכשיו בחזרה ל' + label), resolve(task.prompt), { color: C.brightBlue }));
      continue;
    }
    if (['בדיחה', 'joke'].includes(lower)) {
      progress.stats.jokesRead = (progress.stats.jokesRead || 0) + 1;
      save(progress);
      console.log('   😂 ' + randomJoke());
      continue;
    }
    if (['תפריט', 'menu'].includes(lower)) return { status: 'menu', hints: hintIdx };
    if (['יציאה', 'exit', 'quit'].includes(lower)) return { status: 'exit', hints: hintIdx };
    if (input === '') continue;

    const ex = executeCommand(input, shell);
    printExec(ex);
    progress.stats.commandsRun++;
    save(progress);
    if (ex.blocked) continue;
    attempts++;

    // בדיקת הצלחת המשימה
    const { ok, msg } = evaluate(task, buildCtx(shell, input, ex));
    if (ok) {
      console.log();
      console.log('   ' + c.ok('✅ ' + (resolve(task.success) || randomCheer())));
      if (msg) console.log('   ' + c.dim(msg));
      console.log();
      return { status: 'ok', hints: hintIdx };
    }
    console.log('   ' + c.warn('🤔 עדיין לא. ') + c.dim(msg || 'נסה שוב, או כתוב "רמז".'));
    if (attempts === 3 && task.solution) {
      console.log('   ' + c.dim('טיפ: אפשר לכתוב "דלג" כדי לראות את הפתרון.'));
    }
    if (attempts >= 5 && !joked) {
      joked = true;
      console.log('   ' + c.dim('נראה שהמשימה הזאת קשוחה. בדיחה לשחרר לחץ: ') + randomJoke());
    }
  }
}

// ---- חידון אמריקאי ----
async function runQuiz(quiz, idx, total, deps, teachText) {
  const { rl } = deps;
  console.log();
  console.log(ui.textBox(c.info(`שאלה ${idx}/${total}`), quiz.question, { color: C.brightMagenta }));
  quiz.options.forEach((opt, i) => {
    console.log('   ' + c.accent(`${i + 1})`) + ' ' + ui.inline(opt));
  });
  console.log();

  let wrong = 0;
  while (true) {
    const a = (await ask(rl, c.dim('   התשובה שלך (מספר): '))).trim();
    const lower = a.toLowerCase();
    if (['תפריט', 'menu'].includes(lower)) return { status: 'menu', hints: 0 };
    if (['יציאה', 'exit', 'quit'].includes(lower)) return { status: 'exit', hints: 0 };
    if (['חזרה', 'repeat', 'שוב'].includes(lower)) {
      console.log(ui.renderTeach(teachText || 'אין חומר להצגה.'));
      console.log();
      continue;
    }
    if (['דלג', 'skip'].includes(lower)) {
      console.log('   ' + c.dim('התשובה הנכונה: ') + ui.inline(quiz.options[quiz.answer]));
      return { status: 'skipped', hints: 0 };
    }
    const n = parseInt(a, 10);
    if (isNaN(n) || n < 1 || n > quiz.options.length) {
      console.log('   ' + c.warn(`הקלד מספר בין 1 ל-${quiz.options.length}.`));
      continue;
    }
    if (n - 1 === quiz.answer) {
      console.log('   ' + c.ok('✅ נכון!') + ' ' + c.dim(ui.inline(quiz.explain || '')));
      console.log();
      return { status: wrong ? 'skipped' : 'ok', hints: 0 };
    }
    wrong++;
    console.log('   ' + c.err('❌ לא מדויק.') + ' ' + c.dim(wrong >= 2 ? 'רוצה לקרוא שוב את ההסבר? כתוב "חזרה".' : 'נסה שוב.'));
  }
}

// ---- אימון מוגבר: תרגילים אקראיים ממה שכבר למדת ----
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

async function runDrills(pool, deps, count = 8) {
  const { rl, progress, save } = deps;
  const picks = shuffle(pool).slice(0, count);
  const shell = createShell('sandbox');

  ui.clear();
  console.log(ui.banner('🏋️ אימון מוגבר — חורשים על התרגול!', C.bgMagenta));
  console.log();
  console.log(ui.renderTeach(
    `${picks.length} תרגילים אקראיים ממה שכבר למדת. כל תרגיל מתחיל מארגז חול נקי.\n` +
    '> פתרון בלי רמז = ⭐ · עם רמז = ✅ · דילוג = ❌\n' +
    '> כל תרגיל שנפתר = +5 XP. שכחת משהו? "חזרה" מציג את ההסבר של השיעור שממנו הגיע התרגיל.'
  ));
  console.log();
  await ask(rl, c.dim('   [Enter כדי להתחיל] '));

  const marks = [];
  let solved = 0;
  for (let i = 0; i < picks.length; i++) {
    const drill = picks[i];
    sandbox.seed();
    shell.reset();
    const r = await runTask(drill, i + 1, picks.length, shell, deps, drill.teachText, {
      label: `תרגיל ${i + 1}/${picks.length} · מתוך: ${drill.from}`,
    });
    if (r.status === 'menu' || r.status === 'exit') return r.status;
    if (r.status === 'ok') {
      solved++;
      progress.xp += 5;
      progress.stats.drillsSolved = (progress.stats.drillsSolved || 0) + 1;
      save(progress);
      marks.push(r.hints ? '✅' : '⭐');
    } else {
      marks.push('❌');
    }
  }

  const stars = marks.filter((m) => m === '⭐').length;
  const verdict =
    stars === picks.length ? 'מושלם! אפס רמזים. הטרמינל מצדיע לך. 🫡' :
    solved === picks.length ? 'פתרת הכל! בפעם הבאה נסה בלי רמזים 😉' :
    solved >= picks.length / 2 ? 'יפה מאוד! עוד סבב אחד וזה יושב חזק.' :
    'זה בסדר גמור — ככה לומדים. כדאי לחזור על השיעורים שהופיעו פה ❌';

  ui.clear();
  console.log(ui.box([
    c.title('🏋️ סיכום האימון'),
    '',
    marks.join(' '),
    '',
    `פתרת ${c.ok(solved + '/' + picks.length)} · ⭐ בלי רמזים: ${c.accent(String(stars))} · ${c.ok('+' + solved * 5 + ' XP')}`,
    '',
    verdict,
  ], { color: C.brightMagenta }));
  console.log();
  await ask(rl, c.dim('   [Enter לחזרה לתפריט] '));
  return 'done';
}

// ---- מצב חופשי: shell בלי משימות ----
async function runFreePlay(deps, mode = 'sandbox') {
  const { rl, progress, save } = deps;
  const shell = createShell(mode);
  if (mode === 'sandbox') sandbox.ensure();

  ui.clear();
  if (mode === 'sandbox') {
    console.log(ui.banner('🧪 ארגז חול חופשי', C.bgGreen));
    console.log();
    console.log(ui.renderTeach(
      'כאן אין משימות — רק אתה והטרמינל. תנסה כל מה שבא לך!\n' +
      '- "איפוס" — מחזיר את ארגז החול למצב ההתחלתי\n' +
      '- "תפריט" — חזרה לתפריט הראשי'
    ));
  } else {
    console.log(ui.banner('🔭 מצב חקירה חופשי — המחשב האמיתי שלך (קריאה בלבד)', C.bgBlue));
    console.log();
    console.log(ui.renderTeach(
      'מסתובבים במחשב האמיתי שלך. אפשר להסתכל על הכל, אי אפשר לשנות כלום 🔒\n' +
      '- "תפריט" — חזרה לתפריט הראשי'
    ));
  }
  console.log();

  while (true) {
    const promptStr =
      ui.paint('➜', C.brightGreen) + ' ' +
      ui.paint(shell.promptPath(), C.brightCyan) + ' ' +
      ui.paint('$', C.gray) + ' ';
    const input = (await ask(rl, promptStr, { history: true })).trim();
    const lower = input.toLowerCase();
    if (!input) continue;
    if (['תפריט', 'menu'].includes(lower)) return 'menu';
    if (['יציאה', 'exit', 'quit'].includes(lower)) return 'exit';
    if (['בדיחה', 'joke'].includes(lower)) { console.log('   😂 ' + randomJoke()); continue; }
    if (mode === 'sandbox' && ['איפוס', 'reset'].includes(lower)) {
      sandbox.seed();
      shell.reset();
      console.log('   ' + c.ok('♻️  ארגז החול חזר למצב ההתחלתי.'));
      continue;
    }
    const ex = executeCommand(input, shell);
    printExec(ex);
    progress.stats.commandsRun++;
    save(progress);
  }
}

// הזחה של פלט פקודות כדי שיהיה מיושר ומובדל
function indent(text) {
  return text
    .replace(/\n$/, '')
    .split('\n')
    .map((l) => '   ' + c.dim('│ ') + l)
    .join('\n') + '\n';
}

module.exports = {
  ask,
  attachQueue,
  createShell,
  runLesson,
  runDrills,
  runFreePlay,
  executeCommand,
  buildCtx,
  evaluate,
  resolve,
  classify,
  splitArgs,
  splitTopLevel,
  hebrewLayoutFix,
  normalizeQuotes,
};
