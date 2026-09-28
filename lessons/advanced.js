// lessons/advanced.js
// רמה מתקדמת: עיבוד טקסט, תהליכים, סקריפטים, git, רשת — ואתגר מסכם.

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');
const { ran, has, need, where, countFiles, firstNumber, isExec } = require('./_helpers');
const detect = require('../lib/detect');

// קריאה בלבד: שם המשתמש שמוגדר ב-git של המשתמש (אם יש)
function gitGlobalName() {
  try {
    return execSync('git config --global user.name', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 3000 }).trim();
  } catch {
    return '';
  }
}

// קריאה בלבד: אילו מפתחות SSH ציבוריים קיימים (רק שמות קבצים, לא תוכן)
function sshPublicKeys() {
  try {
    return fs.readdirSync(path.join(os.homedir(), '.ssh')).filter((f) => f.endsWith('.pub'));
  } catch {
    return [];
  }
}

const PING = process.platform === 'win32' ? 'ping -n 2' : 'ping -c 2';

// ארגומנט אחרי שם הסקריפט (bash greet.sh דני → דני)
function scriptArg(x) {
  const m = x.cmd.match(/greet\.sh\s+(.+)$/);
  return m ? m[1].replace(/["']/g, '').trim() : '';
}

module.exports = [
  // ─────────────────────────────────────────────
  {
    id: 'text',
    level: 'מתקדם',
    emoji: '✂️',
    title: 'עיבוד טקסט: cut, tr, sed, awk, xargs',
    teach: `## cut — לגזור עמודות ✂️
קבצי CSV הם טבלאות שהעמודות בהן מופרדות בפסיקים.
- \`cut -d, -f1 shopping.csv\` — עמודה 1 (d = delimiter, המפריד; f = field, העמודה)
- \`cut -d, -f1,3\` — עמודות 1 ו-3

## tr — להחליף תווים 🔤
- \`echo hello | tr a-z A-Z\` → HELLO
- \`tr ',' '\\n'\` — כל פסיק הופך לירידת שורה

## sed — "חפש והחלף" (כמו Ctrl+H) 🔁
- \`sed 's/קפה/תה/' file\` — מחליף את ההופעה הראשונה בכל שורה (s = substitute)
- \`sed 's/a/b/g' file\` — g = כל ההופעות (global)
> sed מדפיס את התוצאה למסך — הקובץ המקורי לא משתנה. רוצים לשמור? \`> new.txt\`

## awk — מחשבון-טבלאות מיני 🧮
- \`awk -F, '{print $1}' file\` — עמודה 1 (F = המפריד)
- \`awk -F, 'NR>1 {sum += $3} END {print sum}' file\` — סכום של עמודה 3, בלי שורת הכותרת (NR = מספר השורה)

## xargs — להפוך שורות לארגומנטים 🔗
\`find . -name "*.txt" | xargs wc -l\` — כל קובץ ש-find מצא נשלח ל-wc`,
    tasks: [
      {
        prompt: 'הצג רק את **שמות המוצרים** (עמודה 1) מ-shopping.csv',
        hint: '`cut -d, -f1 shopping.csv`',
        solution: 'cut -d, -f1 shopping.csv',
        check: (x) => need(ran(x, /^cut\b/) && x.lines.length === 4 && has(x, 'חלב') && !has(x, ','), 'צריך רק את העמודה הראשונה.' + where(x)),
      },
      {
        prompt: 'הצג את עמודות **1 ו-3** (מוצר ומחיר).',
        hint: '`cut -d, -f1,3 shopping.csv`',
        solution: 'cut -d, -f1,3 shopping.csv',
        check: (x) => ran(x, /^cut\b/) && has(x, 'חלב,6', 'ביצים,15'),
      },
      {
        prompt: 'עכשיו שמות המוצרים **בלי שורת הכותרת**. רמז: `tail -n +2` מתחיל משורה 2.',
        hint: '`tail -n +2 shopping.csv | cut -d, -f1`',
        solution: 'tail -n +2 shopping.csv | cut -d, -f1',
        check: (x) => need(/\|/.test(x.cmd) && x.lines.length === 3 && !has(x, 'פריט'), 'צריכות לצאת 3 שורות — בלי "פריט".'),
        success: 'tail -n +2 = "מהשורה השנייה והלאה". טריק שימושי מאוד לכותרות.',
      },
      {
        prompt: 'צעק! 📢 המר את hello לאותיות גדולות: `echo hello | tr a-z A-Z`',
        hint: 'echo hello | tr a-z A-Z',
        solution: 'echo hello | tr a-z A-Z',
        check: (x) => /\|\s*tr\b/.test(x.cmd) && x.stdout.trim() === 'HELLO',
      },
      {
        prompt: 'הצג את שורת הכותרת של shopping.csv כשכל עמודה **בשורה נפרדת** (tr מפסיק לירידת שורה).',
        hint: `\`head -n 1 shopping.csv | tr ',' '\\n'\``,
        solution: "head -n 1 shopping.csv | tr ',' '\\n'",
        check: (x) => /\|\s*tr\b/.test(x.cmd) && x.lines.length === 3 && has(x, 'פריט', 'מחיר'),
      },
      {
        prompt: 'בריאות! הצג את notes/todo.txt כשה**קפה** מוחלף ב**תה** (עם sed).',
        hint: '`sed \'s/קפה/תה/\' notes/todo.txt`',
        solution: "sed 's/קפה/תה/' notes/todo.txt",
        check: (x) => ran(x, /^sed\b/) && has(x, 'תה') && !has(x, 'קפה'),
        success: '🍵 שים לב: הקובץ המקורי לא השתנה — sed רק הראה איך זה ייראה.',
      },
      {
        prompt: 'החלף **כל** "דני" ב"דניאל" ב-names.txt ו**שמור** לקובץ חדש names2.txt',
        hint: ['g בסוף = כל ההופעות. > = שמירה לקובץ.', "`sed 's/דני/דניאל/g' names.txt > names2.txt`"],
        solution: "sed 's/דני/דניאל/g' names.txt > names2.txt",
        check: (x) => need(((x.rootRead('names2.txt') || '').match(/דניאל/g) || []).length === 3, 'names2.txt צריך להכיל 3 פעמים "דניאל".' + where(x)),
      },
      {
        prompt: 'עם awk: הצג רק את **עמודת המחיר** (עמודה 3).',
        hint: "`awk -F, '{print $3}' shopping.csv`",
        solution: "awk -F, '{print $3}' shopping.csv",
        check: (x) => ran(x, /^awk\b/) && x.lines.length === 4 && x.lines.includes('15'),
      },
      {
        prompt: '💰 כמה עולים כל המוצרים ביחד? סכום של עמודה 3 (בלי הכותרת) עם awk.',
        hint: ["NR>1 = מדלג על הכותרת. END = בסוף מדפיסים.", "`awk -F, 'NR>1 {sum += $3} END {print sum}' shopping.csv`"],
        solution: "awk -F, 'NR>1 {sum += $3} END {print sum}' shopping.csv",
        check: (x) => need(/awk/.test(x.cmd) && x.stdout.trim() === '29', 'הסכום צריך לצאת 29.'),
        success: '29 ש"ח. awk הוא בעצם שפת תכנות שלמה שמתחבאת בתוך פקודה אחת. 🤯',
      },
      {
        prompt: 'כמה שורות יש בכל מתכון? מצא אותם עם find ושלח ל-wc -l עם **xargs**.',
        hint: '`find recipes -name "*.txt" | xargs wc -l`',
        solution: 'find recipes -name "*.txt" | xargs wc -l',
        check: (x) => /xargs\s+wc/.test(x.cmd) && has(x, 'cake.txt', 'pasta.txt') && /total/i.test(x.stdout),
      },
      {
        quiz: {
          question: "מה עושה ה-g ב-`sed 's/a/b/g'`?",
          options: ['מחליף את כל ההופעות בשורה, לא רק הראשונה', 'שומר לקובץ', 'מתעלם מאותיות גדולות', 'מחפש בכל התיקיות'],
          answer: 0,
          explain: 'g = global.',
        },
      },
      {
        quiz: {
          question: 'ב-`cut -d, -f2` — מה זה `-d,`?',
          options: ['המפריד בין העמודות הוא פסיק', 'מוחק פסיקים', 'עמודה מספר 2', 'מצב debug'],
          answer: 0,
          explain: 'd = delimiter = מפריד.',
        },
      },
    ],
    drills: [
      { prompt: 'הצג רק את עמודת הכמות (עמודה 2) מ-shopping.csv', hint: 'cut -d, -f2', solution: 'cut -d, -f2 shopping.csv', check: (x) => has(x, 'כמות', '12') && !has(x, 'חלב') },
      { prompt: 'המר את "abc" לאותיות גדולות', hint: 'echo abc | tr a-z A-Z', solution: 'echo abc | tr a-z A-Z', check: (x) => x.stdout.trim() === 'ABC' },
      { prompt: 'הצג את shopping.csv כש"לחם" מוחלף ב"פיתה"', hint: "sed 's/.../.../'", solution: "sed 's/לחם/פיתה/' shopping.csv", check: (x) => has(x, 'פיתה') && !has(x, 'לחם') },
      { prompt: 'חשב את הסכום של כל המספרים ב-numbers.txt עם awk', hint: "awk '{s += $1} END {print s}'", solution: "awk '{s += $1} END {print s}' numbers.txt", check: (x) => x.stdout.trim() === '235' },
    ],
    cheats: [
      ['cut -d, -f1', 'עמודה מקובץ CSV'],
      ['tr a-z A-Z', 'החלפת תווים'],
      ["sed 's/old/new/g'", 'חפש והחלף'],
      ["awk -F, '{print $2}'", 'עמודות וחישובים'],
      ['... | xargs cmd', 'שורות ← ארגומנטים'],
      ['tail -n +2', 'בלי שורת הכותרת'],
    ],
  },

  // ─────────────────────────────────────────────
  {
    id: 'processes',
    level: 'מתקדם',
    emoji: '⚙️',
    title: 'תהליכים: מה רץ עכשיו במחשב?',
    mode: 'explore',
    unixOnly: true,
    windowsNote: 'ב-Windows רואים תהליכים עם Ctrl+Shift+Esc (מנהל המשימות), ובטרמינל: tasklist, וסוגרים עם taskkill /PID מספר.',
    teach: `## כל תוכנה שרצה = תהליך (process) ⚙️
לכל תהליך יש מספר זהות: **PID**. הדפדפן, המוזיקה, והקורס הזה עצמו — כולם תהליכים.

## לראות תהליכים
- \`ps\` — התהליכים שלך בטרמינל הזה
- \`ps aux\` — **כל** התהליכים במחשב (a = כולם, u = עם פרטים, x = גם בלי טרמינל)
- \`ps aux | grep node\` — חיפוש תהליך מסוים
- \`top\` / \`htop\` — "מנהל המשימות" של הטרמינל (q ליציאה) — נסה בטרמינל רגיל
- \`uptime\` — כמה זמן המחשב דולק

## לשלוט בתהליכים (בטרמינל רגיל)
- **Ctrl+C** — עצור את הפקודה שרצה עכשיו 🛑
- **Ctrl+Z** — השהה אותה ⏸️ · \`fg\` — המשך אותה ▶️
- \`sleep 100 &\` — ה-& מריץ ברקע, והטרמינל פנוי מיד
- \`jobs\` — מה רץ ברקע
- \`kill PID\` — מבקש בנימוס מתהליך להיסגר 🙏
- \`kill -9 PID\` — סוגר בכוח, בלי לשאול 🔨 (רק כשהנימוס לא עוזר)

> הקורס במצב קריאה בלבד כאן — מסתכלים על תהליכים, לא סוגרים אותם.`,
    tasks: [
      {
        prompt: 'הצג את התהליכים שלך עם `ps`',
        hint: 'ps',
        solution: 'ps',
        check: (x) => ran(x, /^ps\b/),
      },
      {
        prompt: 'הצג את **5 השורות הראשונות** של כל התהליכים במחשב.',
        hint: '`ps aux | head -n 5`',
        solution: 'ps aux | head -n 5',
        check: (x) => /ps\s+aux/.test(x.cmd) && /head/.test(x.cmd) && has(x, 'PID'),
        success: 'USER = של מי, PID = מספר זהות, %CPU/%MEM = כמה משאבים הוא אוכל, COMMAND = מה זה.',
      },
      {
        prompt: 'חפש את כל תהליכי **node** שרצים. (רמז: יש לפחות אחד... 😉)',
        hint: '`ps aux | grep node`',
        solution: 'ps aux | grep node',
        check: (x) => /ps\s+aux.*\|\s*grep/.test(x.cmd) && has(x, 'node'),
        success: 'רואה את זה? זה הקורס עצמו, רץ כתהליך! אתה מסתכל על עצמך מבפנים. 🤯',
      },
      {
        prompt: 'כמה תהליכים רצים עכשיו במחשב? (ps aux + wc)',
        hint: '`ps aux | wc -l`',
        solution: 'ps aux | wc -l',
        check: (x) => /ps\s+aux/.test(x.cmd) && /wc/.test(x.cmd) && firstNumber(x) > 5,
        success: 'מאות תהליכים רצים ברקע כל הזמן, ואתה אפילו לא שם לב. 🐜',
      },
      {
        prompt: 'מי אוכל הכי הרבה מעבד? מיין לפי עמודה 3 (CPU) מהגבוה לנמוך, והצג 5.',
        hint: '`ps aux | sort -nrk 3 | head -n 5`',
        solution: 'ps aux | sort -nrk 3 | head -n 5',
        check: (x) => /ps\s+aux/.test(x.cmd) && /sort/.test(x.cmd) && x.lines.length <= 5 && x.lines.length > 0,
        success: 'ככה מוצאים מה מאט את המחשב. -k 3 = לפי עמודה 3.',
      },
      {
        prompt: 'כמה זמן המחשב שלך דולק?',
        hint: '`uptime`',
        solution: 'uptime',
        check: (x) => ran(x, /^uptime\b/),
      },
      {
        prompt: 'הרץ `sleep 2` ותראה מה קורה לטרמינל. 😴',
        hint: 'sleep 2',
        solution: 'sleep 2',
        check: (x) => ran(x, /^sleep\s+\d/),
        success: 'שמת לב? הטרמינל חיכה ולא נתן לך להקליד. ככה נראית פקודה "חוסמת". עם & בסוף היא הייתה רצה ברקע.',
      },
      {
        prompt: 'מה ה-PID של ה-shell שמריץ את הפקודה? `echo $$`',
        hint: 'echo $$',
        solution: 'echo $$',
        check: (x) => /echo\s+\$\$/.test(x.cmd) && /^\d+$/.test(x.stdout.trim()),
      },
      {
        quiz: {
          question: 'פקודה רצה ולא נגמרת. מה עושים?',
          options: ['Ctrl+C', 'סוגרים את המחשב', 'Ctrl+V', 'מחכים לנצח'],
          answer: 0,
          explain: 'Ctrl+C שולח "עצור" לפקודה שרצה.',
        },
      },
      {
        quiz: {
          question: 'מה ההבדל בין `kill PID` ל-`kill -9 PID`?',
          options: ['kill מבקש בנימוס, kill -9 סוגר בכוח', 'אין הבדל', 'kill -9 סוגר 9 תהליכים', 'kill -9 מוחק את התוכנה'],
          answer: 0,
          explain: 'תמיד קודם בנימוס. -9 רק כשאין ברירה.',
        },
      },
      {
        quiz: {
          question: 'מה עושה ה-`&` בסוף פקודה?',
          options: ['מריץ אותה ברקע', 'מריץ פעמיים', 'שומר לקובץ', 'מבטל אותה'],
          answer: 0,
          explain: 'והטרמינל נשאר פנוי לפקודות אחרות.',
        },
      },
    ],
    drills: [
      { prompt: 'הצג את 3 השורות הראשונות של כל התהליכים', hint: 'ps aux | head -n 3', solution: 'ps aux | head -n 3', check: (x) => /ps/.test(x.cmd) && x.lines.length === 3 },
      { prompt: 'כמה זמן המחשב דולק?', hint: 'uptime', solution: 'uptime', check: (x) => ran(x, /^uptime/) },
    ],
    cheats: [
      ['ps aux', 'כל התהליכים'],
      ['ps aux | grep x', 'חיפוש תהליך'],
      ['top / htop', 'מנהל משימות (q ליציאה)'],
      ['cmd &', 'הרצה ברקע'],
      ['Ctrl+C / Ctrl+Z / fg', 'עצור / השהה / המשך'],
      ['kill PID / kill -9 PID', 'סגירה בנימוס / בכוח'],
    ],
  },

  // ─────────────────────────────────────────────
  {
    id: 'scripting',
    level: 'מתקדם',
    emoji: '🤖',
    title: 'סקריפטים: לגרום למחשב לעבוד בשבילך',
    teach: `## לולאה = "תעשה את זה לכל אחד" 🔁
\`for i in 1 2 3; do echo "סיבוב $i"; done\`
- \`for X in רשימה\` — עובר על כל פריט
- \`do ... done\` — מה לעשות בכל סיבוב
- \`for f in *.txt\` — לכל קובץ txt!
- \`$(seq 1 10)\` — המספרים 1 עד 10 · \`$((n*n))\` — חשבון

## תנאי = "אם... אז..." 🤔
\`if [ -f file.txt ]; then echo "קיים"; else echo "לא קיים"; fi\`
- \`[ -f file ]\` הקובץ קיים · \`[ -d dir ]\` התיקייה קיימת
- \`[ $A -gt 5 ]\` גדול מ- · \`-lt\` קטן מ- · \`-eq\` שווה
- (כן, \`fi\` זה \`if\` הפוך. מתכנתים. 🙄)

## סקריפט = קובץ עם רשימת פקודות 📜
1. שורה ראשונה: \`#!/bin/bash\` — ה-"shebang", אומר איזו תוכנה תריץ את הקובץ
2. \`$1\` = הארגומנט הראשון שנותנים לסקריפט, \`$2\` השני...
3. \`$(פקודה)\` — מכניס את הפלט של פקודה לתוך טקסט
4. מריצים: \`bash script.sh\` או \`chmod +x script.sh\` ואז \`./script.sh\`

> בטרמינל אמיתי כותבים סקריפטים בעורך (nano / VS Code). בקורס בונים אותם שורה-שורה עם echo ו->>.`,
    tasks: [
      {
        prompt: 'הלולאה הראשונה שלך: `for i in 1 2 3; do echo "סיבוב $i"; done`',
        hint: 'העתק כמו שהיא — שים לב לנקודה-פסיק לפני do ולפני done.',
        solution: 'for i in 1 2 3; do echo "סיבוב $i"; done',
        check: (x) => need(/^for\b/.test(x.cmd) && x.lines.length === 3 && has(x, 'סיבוב 3'), 'צריכות לצאת 3 שורות: סיבוב 1, 2, 3'),
        success: 'המחשב עשה אותו דבר 3 פעמים בלי להתלונן. עכשיו תדמיין 3,000. 🤖',
      },
      {
        prompt: 'לולאה על קבצים: הדפס "תמונה: X" לכל קובץ ב-photos.',
        hint: '`for f in photos/*; do echo "תמונה: $f"; done`',
        solution: 'for f in photos/*; do echo "תמונה: $f"; done',
        check: (x) => /^for\b/.test(x.cmd) && x.lines.length === 3 && has(x, 'cat.png'),
      },
      {
        prompt: 'הדפס את המספרים 1 עד 5 עם `seq`',
        hint: '`seq 1 5`',
        solution: 'seq 1 5',
        check: (x) => ran(x, /^seq\b/) && x.lines.length === 5,
      },
      {
        prompt: 'לוח הכפל! הדפס כל מספר מ-1 עד 5 **בריבוע**: `for n in $(seq 1 5); do echo "$n בריבוע = $((n*n))"; done`',
        hint: 'העתק כמו שהיא. $(( )) = חשבון.',
        solution: 'for n in $(seq 1 5); do echo "$n בריבוע = $((n*n))"; done',
        check: (x) => /^for\b/.test(x.cmd) && has(x, '25') && x.lines.length === 5,
        success: 'המורה למתמטיקה גאה בך. 📐',
      },
      {
        prompt: 'צור 3 תיקיות בלולאה: box-red, box-green, box-blue',
        hint: '`for c in red green blue; do mkdir "box-$c"; done`',
        solution: 'for c in red green blue; do mkdir "box-$c"; done',
        check: (x) => need(['red', 'green', 'blue'].every((c) => x.rootIsDir('box-' + c)), 'צריך את שלוש התיקיות box-red, box-green, box-blue' + where(x)),
      },
      {
        prompt: 'תנאי: בדוק אם welcome.txt קיים: `if [ -f welcome.txt ]; then echo "קיים!"; else echo "לא קיים"; fi`',
        hint: 'שים לב לרווחים בתוך הסוגריים המרובעים: [ -f welcome.txt ]',
        solution: 'if [ -f welcome.txt ]; then echo "קיים!"; else echo "לא קיים"; fi',
        check: (x) => need(/^if\b/.test(x.cmd) && has(x, 'קיים!'), 'צריך if עם [ -f welcome.txt ] שמדפיס "קיים!"' + where(x)),
      },
      {
        prompt: 'משתנה + תנאי: `AGE=20; if [ $AGE -ge 18 ]; then echo "בגיר"; else echo "קטין"; fi` (נסה גם עם גיל אחר!)',
        hint: '-ge = גדול או שווה (greater or equal)',
        solution: 'AGE=20; if [ $AGE -ge 18 ]; then echo "בגיר"; else echo "קטין"; fi',
        check: (x) => /if\s+\[/.test(x.cmd) && (has(x, 'בגיר') || has(x, 'קטין')),
      },
      {
        prompt: 'נבנה סקריפט אמיתי! שורה 1 — ה-shebang: `echo \'#!/bin/bash\' > greet.sh`',
        hint: "echo '#!/bin/bash' > greet.sh  (בגרשיים בודדים!)",
        solution: "echo '#!/bin/bash' > greet.sh",
        check: (x) => need((x.rootRead('greet.sh') || '').startsWith('#!/bin/bash'), 'השורה הראשונה של greet.sh צריכה להיות #!/bin/bash' + where(x)),
      },
      {
        prompt: `שורה 2 — ברכה שמשתמשת ב-**$1**: \`echo 'echo "שלום $1, ברוך הבא! 🎉"' >> greet.sh\``,
        hint: 'שני חצים (>>) כדי לא למחוק את השורה הראשונה!',
        solution: `echo 'echo "שלום $1, ברוך הבא! 🎉"' >> greet.sh`,
        check: (x) => {
          const t = x.rootRead('greet.sh') || '';
          if (!t.startsWith('#!')) return { ok: false, msg: 'אופס, ה-shebang נמחק (השתמשת ב-> במקום >>?). כתוב שוב את שתי השורות.' };
          return need(t.includes('$1'), "השורה צריכה להכיל $1 — ובגרשיים בודדים מבחוץ, כדי שה-$1 יישמר כמו שהוא.");
        },
      },
      {
        prompt: 'הרץ את הסקריפט עם **השם שלך** כארגומנט: `bash greet.sh השם-שלך`',
        hint: 'bash greet.sh דני',
        solution: 'bash greet.sh דני',
        check: (x) => need(/greet\.sh\s+\S/.test(x.cmd) && has(x, 'שלום') && has(x, scriptArg(x)), 'צריך להריץ עם שם אחרי greet.sh'),
        success: 'הסקריפט קיבל את השם שלך דרך $1 והשתמש בו. זה תכנות! 🧑‍💻',
      },
      {
        prompt: 'הפוך את greet.sh לתוכנה אמיתית — תן לו הרשאת הרצה.',
        hint: 'chmod +x greet.sh',
        solution: 'chmod +x greet.sh',
        check: (x) => need(isExec(x, 'greet.sh'), 'צריך chmod +x greet.sh'),
      },
      {
        prompt: 'הרץ אותו ישירות: `./greet.sh` עם שם של חבר',
        hint: './greet.sh יוסי',
        solution: './greet.sh יוסי',
        check: (x) => /^\.\/greet\.sh\s+\S/.test(x.cmd) && has(x, 'שלום'),
        success: 'עכשיו greet.sh זו תוכנה לכל דבר. בדיוק כמו ls. 🚀',
      },
      {
        prompt: 'אוטומציה אמיתית 💪: גבה **כל** קובץ txt לקובץ .bak בלולאה אחת.',
        hint: '`for f in *.txt; do cp "$f" "$f.bak"; done`',
        solution: 'for f in *.txt; do cp "$f" "$f.bak"; done',
        check: (x) => need(['welcome.txt.bak', 'diary.txt.bak', 'names.txt.bak'].every((f) => x.rootExists(f)), 'צריך .bak לכל קובץ txt בשורש.' + where(x)),
        success: 'גיבית את כל הקבצים בשורה אחת. תחשוב על זה עם 500 קבצים. 😎',
      },
      {
        prompt: `סקריפט עם $(פקודה) בפנים: \`echo 'echo "יש כאן $(ls | wc -l) פריטים"' > count.sh\` ואז \`bash count.sh\` — אפשר עם && בשורה אחת!`,
        hint: `echo 'echo "יש כאן $(ls | wc -l) פריטים"' > count.sh && bash count.sh`,
        solution: `echo 'echo "יש כאן $(ls | wc -l) פריטים"' > count.sh && bash count.sh`,
        check: (x) => need(/count\.sh/.test(x.cmd) && /יש כאן\s+\d+\s+פריטים/.test(x.stdout), 'הפלט צריך להיות: יש כאן X פריטים (צריך גם ליצור וגם להריץ את count.sh)'),
      },
      {
        quiz: {
          question: 'בתוך סקריפט, מה זה `$1`?',
          options: ['הארגומנט הראשון שנתנו לסקריפט', 'המספר 1', 'השורה הראשונה בקובץ', 'המשתנה הראשון שהגדרת'],
          answer: 0,
          explain: 'bash greet.sh דני ← בתוך הסקריפט $1 = דני.',
        },
      },
      {
        quiz: {
          question: 'מה תפקיד השורה `#!/bin/bash` בתחילת סקריפט?',
          options: ['אומרת איזו תוכנה תריץ את הקובץ', 'הערה בלי משמעות', 'מוחקת את הקובץ אחרי הריצה', 'נותנת הרשאת הרצה'],
          answer: 0,
          explain: 'קוראים לה shebang (#! = "שבאנג").',
        },
      },
    ],
    drills: [
      { prompt: 'הדפס "שלום" 3 פעמים בלולאה', hint: 'for i in 1 2 3; do ...; done', solution: 'for i in 1 2 3; do echo שלום; done', check: (x) => /^for\b/.test(x.cmd) && x.lines.filter((l) => l.includes('שלום')).length === 3 },
      { prompt: 'הדפס את המספרים 1 עד 10', hint: 'seq', solution: 'seq 1 10', check: (x) => x.lines.length === 10 && x.lines[9] === '10' },
      { prompt: 'צור בלולאה את התיקיות level1 level2 level3', hint: 'for ... do mkdir ...', solution: 'for n in 1 2 3; do mkdir "level$n"; done', check: (x) => [1, 2, 3].every((n) => x.rootIsDir('level' + n)) },
      { prompt: 'בדוק עם if אם התיקייה photos קיימת והדפס "יש!"', hint: '[ -d photos ]', solution: 'if [ -d photos ]; then echo "יש!"; fi', check: (x) => /if/.test(x.cmd) && has(x, 'יש') },
    ],
    cheats: [
      ['for x in a b; do ...; done', 'לולאה'],
      ['if [ -f f ]; then ...; fi', 'תנאי'],
      ['$(cmd)', 'הפלט של פקודה בתוך טקסט'],
      ['$((1+2))', 'חשבון'],
      ['#!/bin/bash', 'שורה ראשונה של סקריפט'],
      ['$1 $2', 'ארגומנטים לסקריפט'],
    ],
  },

  // ─────────────────────────────────────────────
  {
    id: 'git',
    level: 'מתקדם',
    emoji: '🌱',
    title: 'Git — מכונת זמן לקוד שלך',
    requires: 'git',
    teach: () => {
      const tool = detect.checkOne('git');
      const name = tool.installed ? gitGlobalName() : '';
      const status = tool.installed
        ? `✅ git מותקן אצלך (${tool.version}).` + (name ? ` אני רואה שהשם שלך ב-git הוא **${name}**. 👋` : ' עוד לא הגדרת לו שם — נעשה את זה בתרגול (רק לריפו של הקורס).')
        : `❌ git עוד לא מותקן. להתקנה: \`${detect.installHint(tool)}\``;
      return `## ${status}

## מה זה git? 🕰️
תחשוב על משחק מחשב עם **נקודות שמירה** 🎮. כל פעם שמשהו עובד — שומרים. התקלקל? חוזרים לשמירה הקודמת.
- **repo** (ריפו) — תיקייה ש-git עוקב אחריה
- **commit** — נקודת שמירה (צילום מצב של כל הקבצים + הודעה מה השתנה)

## שלושת האזורים
1. **תיקיית העבודה** — איפה שאתה עורך קבצים
2. **Staging** (אזור ההכנה) — \`git add\` = "את זה אני רוצה בשמירה הבאה" 📦
3. **ההיסטוריה** — \`git commit\` = "שמור!" 💾

## הפקודות
- \`git init\` — הופך תיקייה לריפו
- \`git status\` — מה המצב? (הפקודה הכי שימושית!)
- \`git add file\` / \`git add .\` — הכנה לשמירה (. = הכל)
- \`git commit -m "הודעה"\` — שמירה
- \`git log --oneline\` — היסטוריית השמירות
- \`git diff\` — מה השתנה מאז השמירה האחרונה
- \`git switch -c שם\` — ענף (branch) חדש = קו זמן מקביל לניסויים 🌿

> GitHub = אתר ששומר ריפו בענן. \`git push\` שולח לשם, \`git pull\` מושך משם, \`git clone\` מוריד ריפו.`;
    },
    tasks: [
      {
        prompt: 'היכנס לפרויקט המשחק: **projects/game**',
        hint: 'cd projects/game',
        solution: 'cd projects/game',
        check: (x) => need(x.rel === 'projects/game', 'היעד: projects/game'),
      },
      {
        prompt: 'הפוך את התיקייה לריפו של git.',
        hint: '`git init`',
        solution: 'git init',
        check: (x) => need(x.rootExists('projects/game/.git'), 'צריך git init בתוך projects/game' + where(x)),
        success: 'נוצרה תיקייה מוסתרת .git — שם git שומר את כל ההיסטוריה. (רוצה לראות? ls -a)',
      },
      {
        prompt: 'מה המצב? 🧐',
        hint: '`git status`',
        solution: 'git status',
        check: (x) => ran(x, /^git\s+status/),
        success: '"Untracked files" = קבצים ש-git רואה אבל עוד לא עוקב אחריהם.',
      },
      {
        prompt: 'הגדר את השם שלך **לריפו הזה** (בלי --global): `git config user.name "השם שלך"`',
        hint: 'git config user.name "דני"',
        solution: 'git config user.name "תלמיד טרמינל"',
        check: (x) => need(x.run('git config --local user.name', 'projects/game').trim().length > 0, 'צריך git config user.name "..." בתוך projects/game'),
      },
      {
        prompt: 'והמייל (אפשר מומצא): `git config user.email "me@example.com"`',
        hint: 'git config user.email "me@example.com"',
        solution: 'git config user.email "me@example.com"',
        check: (x) => need(x.run('git config --local user.email', 'projects/game').trim().length > 0, 'צריך git config user.email "..."'),
        success: 'עכשיו כל שמירה תהיה חתומה בשם שלך. ✍️',
      },
      {
        prompt: 'הכן לשמירה רק את **index.html**.',
        hint: '`git add index.html`',
        solution: 'git add index.html',
        check: (x) => need(x.run('git diff --cached --name-only', 'projects/game').includes('index.html'), 'index.html צריך להיות ב-staging.'),
      },
      {
        prompt: 'תסתכל שוב על המצב — שים לב ל-"Changes to be committed".',
        hint: 'git status',
        solution: 'git status',
        check: (x) => ran(x, /^git\s+status/),
        success: 'index.html בקופסה 📦. שאר הקבצים עוד בחוץ.',
      },
      {
        prompt: 'עכשיו הכן **את כל** הקבצים בבת אחת.',
        hint: '`git add .` (נקודה = הכל)',
        solution: 'git add .',
        check: (x) => {
          const staged = x.run('git diff --cached --name-only', 'projects/game');
          return need(staged.includes('style.css') && staged.includes('game.js'), 'כל הקבצים צריכים להיות ב-staging.');
        },
      },
      {
        prompt: '💾 שמור! צור את ה-commit הראשון עם הודעה.',
        hint: '`git commit -m "המשחק הראשון שלי"`',
        solution: 'git commit -m "המשחק הראשון שלי"',
        check: (x) => {
          if (/tell me who you are|user\.email|user\.name/i.test(x.stderr)) return { ok: false, msg: 'git רוצה לדעת מי אתה — חזור על משימות ה-config (user.name ו-user.email).' };
          return need(Number(x.run('git rev-list --count HEAD', 'projects/game').trim()) >= 1, 'עוד אין commit.');
        },
        success: 'נקודת השמירה הראשונה שלך! 🎮💾 מעכשיו תמיד אפשר לחזור לכאן.',
      },
      {
        prompt: 'הצג את ההיסטוריה בקצרה.',
        hint: '`git log --oneline`',
        solution: 'git log --oneline',
        check: (x) => ran(x, /^git\s+log/) && x.lines.length >= 1,
        success: 'המספר המוזר בהתחלה = מזהה ייחודי (hash) של השמירה.',
      },
      {
        prompt: 'שנה משהו בקוד: `echo "h1 { color: gold; }" >> style.css`',
        hint: 'echo "h1 { color: gold; }" >> style.css',
        solution: 'echo "h1 { color: gold; }" >> style.css',
        check: (x) => need(x.run('git status --porcelain', 'projects/game').includes('style.css'), 'style.css צריך להשתנות.'),
      },
      {
        prompt: 'מה בדיוק השתנה? 🔍',
        hint: '`git diff`',
        solution: 'git diff',
        check: (x) => ran(x, /^git\s+diff/) && has(x, 'gold'),
        success: 'שורות עם + נוספו, שורות עם - נמחקו. ככה בודקים לפני ששומרים.',
      },
      {
        prompt: 'שמור את השינוי. קיצור: `-am` = add לכל הקבצים שכבר במעקב + commit.',
        hint: '`git commit -am "כותרת בצבע זהב"`',
        solution: 'git commit -am "כותרת בצבע זהב"',
        check: (x) => need(Number(x.run('git rev-list --count HEAD', 'projects/game').trim()) >= 2, 'צריכות להיות 2 שמירות.'),
      },
      {
        prompt: 'תסתכל על ההיסטוריה — עכשיו יש 2 שמירות.',
        hint: 'git log --oneline',
        solution: 'git log --oneline',
        check: (x) => ran(x, /^git\s+log/) && x.lines.length >= 2,
      },
      {
        prompt: 'צור **ענף** חדש לניסויים בשם **bonus-level** ועבור אליו 🌿',
        hint: '`git switch -c bonus-level` (או בגרסה הישנה: `git checkout -b bonus-level`)',
        solution: 'git switch -c bonus-level',
        check: (x) => need(x.run('git rev-parse --abbrev-ref HEAD', 'projects/game').trim() === 'bonus-level', 'הענף הנוכחי צריך להיות bonus-level'),
        success: 'עכשיו אפשר להשתגע עם ניסויים בלי לסכן את main. 🧪',
      },
      {
        prompt: 'הצג את כל הענפים (הכוכבית מסמנת איפה אתה).',
        hint: '`git branch`',
        solution: 'git branch',
        check: (x) => ran(x, /^git\s+branch/) && has(x, 'bonus-level', 'main'),
      },
      {
        quiz: {
          question: 'מה ההבדל בין `git add` ל-`git commit`?',
          options: ['add מכין לשמירה, commit שומר', 'add שומר, commit מוחק', 'אין הבדל', 'add מעלה ל-GitHub'],
          answer: 0,
          explain: 'add = לשים בקופסה. commit = לסגור את הקופסה ולשים עליה תווית.',
        },
      },
      {
        quiz: {
          question: 'איך שולחים את השמירות ל-GitHub?',
          options: ['`git push`', '`git commit`', '`git send`', '`git upload`'],
          answer: 0,
          explain: 'push = לדחוף החוצה. pull = למשוך פנימה.',
        },
      },
    ],
    drills: [
      { prompt: 'איזו גרסה של git מותקנת?', hint: 'git --version', solution: 'git --version', check: (x) => ran(x, /^git\s+--version/) },
    ],
    cheats: [
      ['git init', 'ריפו חדש'],
      ['git status', 'מה המצב'],
      ['git add . ', 'הכנה לשמירה'],
      ['git commit -m "msg"', 'שמירה'],
      ['git log --oneline', 'היסטוריה'],
      ['git diff', 'מה השתנה'],
      ['git switch -c name', 'ענף חדש'],
      ['git push / pull', 'ל-GitHub / מ-GitHub'],
    ],
  },

  // ─────────────────────────────────────────────
  {
    id: 'network',
    level: 'מתקדם',
    emoji: '🌐',
    title: 'רשת ואינטרנט: curl, ping, ssh',
    teach: () => {
      const keys = sshPublicKeys();
      const ssh = detect.checkOne('ssh');
      const keyLine = keys.length
        ? `🔑 יש לך כבר מפתח SSH: ${keys.join(', ')} — אתה מוכן להתחבר ל-GitHub ולשרתים!`
        : '🔑 עוד אין לך מפתח SSH. בסוף השיעור תראה איך יוצרים (בטרמינל רגיל).';
      return `## ping — "אתה שם?" 🏓
\`ping -c 3 google.com\` — שולח 3 "הלו" לשרת ומודד כמה זמן לוקחת התשובה (ms).
אם אין תשובה — משהו בדרך לא עובד. הכלי הראשון לבדוק "יש אינטרנט?".

## curl — דפדפן בלי חלון 🌐
- \`curl https://example.com\` — מוריד את הדף ומדפיס את ה-HTML
- \`curl -s\` — שקט (בלי פס התקדמות) · \`curl -o page.html URL\` — שומר לקובץ
- \`curl -I URL\` — רק ה"כותרות" (headers): סטטוס, סוג, שרת
- \`curl wttr.in/Tel-Aviv\` — מזג אוויר בטרמינל! ⛅ (כן, באמת)
> ככה מתכנתים בודקים APIs: שולחים בקשה ורואים מה חוזר.

## ssh — להתחבר למחשב אחר 🔐
${ssh.installed ? '✅ ssh מותקן אצלך.' : '❌ ssh לא נמצא.'}
- \`ssh user@server.com\` — פותח טרמינל **על מחשב אחר** (שרת בענן, למשל)
- מפתחות SSH = זוג: **ציבורי** (.pub — נותנים לכולם, כמו מנעול 🔒) ו**פרטי** (רק אצלך, כמו מפתח 🗝️)
- ${keyLine}
- יצירה (בטרמינל רגיל): \`ssh-keygen -t ed25519 -C "המייל שלך"\`
> ⚠️ את המפתח הפרטי (בלי .pub) לא שולחים לאף אחד. אף פעם. גם לא ל"תמיכה טכנית".`;
    },
    tasks: [
      {
        // ב-Windows ה-ping של המערכת משתמש ב--n במקום -c
        prompt: () => `יש אינטרנט? שלח **2** פינגים לשרת של גוגל: \`${PING} 8.8.8.8\``,
        hint: () => `${PING} 8.8.8.8`,
        solution: () => `${PING} 8.8.8.8`,
        check: (x) => {
          if (!/^ping\b.*-[cn]\s*\d/.test(x.cmd)) return { ok: false, msg: `צריך ping עם ${PING.split(' ')[1]} ומספר (אחרת הוא עלול להמשיך לנצח!)` };
          return { ok: true, msg: x.code === 0 ? 'time=XX ms = כמה זמן לקח להלוך ולחזור. 🏓' : 'לא הגיעה תשובה — אולי אין אינטרנט כרגע, או שהרשת חוסמת ping. זה בסדר, הבנת את הרעיון.' };
        },
      },
      {
        prompt: 'הורד את example.com והצג רק את **5 השורות הראשונות** של ה-HTML.',
        hint: '`curl -s https://example.com | head -n 5`',
        solution: 'curl -s https://example.com | head -n 5',
        check: (x) => {
          if (!/^curl\b/.test(x.cmd)) return false;
          return { ok: true, msg: x.stdout.trim() ? 'זה בדיוק מה שהדפדפן מקבל — לפני שהוא הופך את זה לדף יפה.' : '(לא הגיע כלום — אולי אין אינטרנט כרגע. הפקודה נכונה!)' };
        },
      },
      {
        prompt: 'שמור את הדף לקובץ **page.html**',
        hint: '`curl -s -o page.html https://example.com`',
        solution: 'curl -s -o page.html https://example.com',
        check: (x) => {
          if (!/^curl\b.*-o\s*page\.html/.test(x.cmd)) return { ok: false, msg: 'צריך curl עם -o page.html' };
          return { ok: true, msg: x.rootExists('page.html') ? 'נשמר! עכשיו אפשר לעבוד עליו עם grep, cat...' : '(לא נשמר — כנראה אין אינטרנט כרגע.)' };
        },
      },
      {
        prompt: 'מה הכותרת (title) של הדף? חפש אותה בקובץ.',
        hint: '`grep title page.html`',
        solution: 'grep -i title page.html',
        check: (x) => /grep\b.*title/i.test(x.cmd) && (has(x, 'title') || !x.rootExists('page.html')),
      },
      {
        prompt: 'הצג רק את ה**כותרות** (headers) של התשובה מ-example.com',
        hint: '`curl -sI https://example.com`',
        solution: 'curl -sI https://example.com',
        check: (x) => {
          if (!/^curl\b.*-\w*I/.test(x.cmd)) return { ok: false, msg: 'צריך את הדגל -I (i גדולה)' };
          return { ok: true, msg: has(x, 'HTTP/') ? '200 = הכל טוב. 404 = לא נמצא. 500 = השרת התבלבל. 🙃' : '(אין תשובה — כנראה בלי אינטרנט.)' };
        },
      },
      {
        prompt: '⛅ מה מזג האוויר? `curl -s "wttr.in/Tel-Aviv?format=3"` (אפשר להחליף עיר!)',
        hint: 'curl -s "wttr.in/Jerusalem?format=3"',
        solution: 'curl -s "wttr.in/Tel-Aviv?format=3"',
        check: (x) => /^curl\b.*wttr\.in/.test(x.cmd),
        success: 'מזג אוויר מהטרמינל. איזה עולם. 😎 (נסה בטרמינל רגיל בלי ?format=3 — יש שם ציור!)',
      },
      {
        prompt: 'יש לך תיקיית מפתחות SSH? `ls ~/.ssh` (רק מסתכלים 👀)',
        hint: 'ls ~/.ssh',
        solution: 'ls ~/.ssh',
        check: (x) => {
          if (!/^ls\b.*~\/\.ssh/.test(x.cmd)) return false;
          return { ok: true, msg: sshPublicKeys().length ? 'יש לך מפתחות! קבצי .pub הם הציבוריים (בטוח לשתף). השאר — סודיים.' : 'אין עדיין מפתחות — בהסבר ("חזרה") יש את הפקודה ליצירה.' };
        },
      },
      {
        quiz: {
          question: 'מה עושה `ssh user@server.com`?',
          options: ['פותח טרמינל על מחשב אחר', 'שולח מייל', 'מוריד קובץ', 'בודק מהירות אינטרנט'],
          answer: 0,
          explain: 'ssh = Secure Shell — טרמינל מאובטח מרחוק.',
        },
      },
      {
        quiz: {
          question: 'איזה מפתח SSH מותר לשתף (למשל להדביק ב-GitHub)?',
          options: ['רק הציבורי (.pub)', 'רק הפרטי', 'את שניהם', 'אף אחד'],
          answer: 0,
          explain: 'הציבורי = מנעול. הפרטי = המפתח. את המפתח לא נותנים לאף אחד.',
        },
      },
      {
        quiz: {
          question: 'למה `ping` צריך `-c 3`?',
          options: ['כדי לשלוח רק 3 פעמים — אחרת במק ובלינוקס הוא ממשיך עד Ctrl+C', 'כדי שיהיה מהיר יותר', 'בלי זה הוא לא עובד', 'c = color'],
          answer: 0,
          explain: 'c = count.',
        },
      },
    ],
    drills: [
      { prompt: 'הצג את ה-headers של https://example.com', hint: 'curl -I', solution: 'curl -sI https://example.com', check: (x) => /^curl\b.*-\w*I/.test(x.cmd) },
    ],
    cheats: [
      ['ping -c 3 host', 'יש חיבור?'],
      ['curl URL', 'להוריד דף'],
      ['curl -o file URL', 'לשמור לקובץ'],
      ['curl -I URL', 'רק headers'],
      ['ssh user@host', 'טרמינל מרחוק'],
      ['ssh-keygen -t ed25519', 'יצירת מפתח'],
    ],
  },

  // ─────────────────────────────────────────────
  {
    id: 'final',
    level: 'מתקדם',
    emoji: '🏆',
    title: 'האתגר הסופי — הבוס האחרון',
    teach: `## 🐉 הבוס האחרון
אין פה חומר חדש. רק **אתה** ו**כל מה שלמדת**.
כל משימה דורשת לשלב כמה כלים — בדיוק כמו בעבודה אמיתית.

## תזכורת מהירה של הנשק שלך ⚔️
- ניווט: \`ls\` \`cd\` \`pwd\` · קבצים: \`mkdir -p\` \`cp\` \`mv\` \`rm\`
- קריאה: \`cat\` \`head\` \`tail\` \`wc -l\`
- חיפוש: \`grep\` (-c -i -v -r -o) · \`find\` (-name -type -delete)
- צינורות: \`|\` \`>\` \`>>\` \`&&\` · מיון: \`sort\` (-n -r) \`uniq -c\`
- עיבוד: \`cut\` \`sed\` \`awk\` \`tr\` · סקריפטים: \`for\` \`if\` \`chmod +x\`

> יש רמזים אם צריך — אין בושה. גם מקצוענים מחפשים בגוגל כל יום. 😉
> \`grep -o\` מדפיס **רק** את החלק שהתאים, לא את כל השורה. יעזור לך באחת המשימות...`,
    tasks: [
      {
        prompt: 'צור מבנה פרויקט: **my-app** עם שלוש תת-תיקיות src, tests, docs — בפקודה **אחת**.',
        hint: ['mkdir -p + סוגריים מסולסלים', '`mkdir -p my-app/{src,tests,docs}`'],
        solution: 'mkdir -p my-app/{src,tests,docs}',
        check: (x) => need(['src', 'tests', 'docs'].every((d) => x.rootIsDir('my-app/' + d)), 'צריך my-app/src, my-app/tests, my-app/docs' + where(x)),
      },
      {
        prompt: 'כמה קבצי **.txt** יש בכל ארגז החול (כולל תת-תיקיות)? הפלט: מספר בלבד.',
        hint: ['find + wc', '`find . -name "*.txt" | wc -l`'],
        solution: 'find . -name "*.txt" | wc -l',
        check: (x) => need(/wc/.test(x.cmd) && firstNumber(x) === countFiles(x.root, '.txt'), 'המספר לא מדויק — ודא שאתה בשורש ארגז החול ומחפש לעומק.' + where(x)),
      },
      {
        prompt: 'דוח לבוס: שמור **את מספר** שורות ה-ERROR בלוג לתוך הקובץ **report.txt**',
        hint: ['grep -c וההפניה >', '`grep -c ERROR logs/app.log > report.txt`'],
        solution: 'grep -c ERROR logs/app.log > report.txt',
        check: (x) => need((x.rootRead('report.txt') || '').trim() === '4', 'report.txt צריך להכיל רק את המספר 4.' + where(x)),
      },
      {
        prompt: 'מי השם הכי נפוץ ב-names.txt? הפלט: **שורה אחת** עם המספר והשם.',
        hint: ['sort → uniq -c → sort -rn → head', '`sort names.txt | uniq -c | sort -rn | head -n 1`'],
        solution: 'sort names.txt | uniq -c | sort -rn | head -n 1',
        check: (x) => need(x.lines.length === 1 && has(x, 'דני') && /3/.test(x.stdout), 'צריכה לצאת שורה אחת: 3 דני'),
        success: 'צינור של 4 פקודות. אתה כבר מדבר יוניקס שוטף. 🗣️',
      },
      {
        prompt: 'גבה את כל המתכונים: צור **recipes-backup** ו**רק אם הצליח** — העתק לשם את כל הקבצים מ-recipes.',
        hint: ['&& מחבר בין שתי הפקודות', '`mkdir recipes-backup && cp recipes/* recipes-backup/`'],
        solution: 'mkdir recipes-backup && cp recipes/* recipes-backup/',
        check: (x) => need(['pasta.txt', 'shakshuka.txt', 'cake.txt'].every((f) => x.rootExists('recipes-backup/' + f)), 'ב-recipes-backup צריכים להיות 3 המתכונים.' + where(x)),
      },
      {
        prompt: '🕵️ איזה משתמש גרם להכי הרבה ERROR בלוג? הפלט: **שורה אחת**.',
        hint: ['grep ERROR → grep -o "user=[a-z]*" → sort → uniq -c → sort -rn → head', '`grep ERROR logs/app.log | grep -o "user=[a-z]*" | sort | uniq -c | sort -rn | head -n 1`'],
        solution: 'grep ERROR logs/app.log | grep -o "user=[a-z]*" | sort | uniq -c | sort -rn | head -n 1',
        check: (x) => need(x.lines.length === 1 && has(x, 'yossi'), 'צריכה לצאת שורה אחת עם yossi.'),
        success: 'yossi! 🕵️ בלש אמיתי. 6 פקודות בצינור אחד — זה כבר רמה של מקצוענים.',
      },
      {
        prompt: '💰 כמה עולה כל הקנייה ב-shopping.csv? (כמות × מחיר, לכל מוצר, ואז סכום). הפלט: מספר.',
        hint: ['awk עם $2 * $3', "`awk -F, 'NR>1 {sum += $2 * $3} END {print sum}' shopping.csv`"],
        solution: "awk -F, 'NR>1 {sum += $2 * $3} END {print sum}' shopping.csv",
        check: (x) => need(x.stdout.trim() === '200', 'התשובה הנכונה: 2×6 + 1×8 + 12×15'),
        success: '200 ש"ח. הביצים עלו ביוקר. 🥚💸',
      },
      {
        prompt: 'צור סקריפט **count.sh** שמדפיס כמה פריטים יש בתיקייה, תן לו הרשאת הרצה **והרץ אותו** — הכל בשורה אחת עם &&.',
        hint: ["echo ... > count.sh && chmod ... && ./count.sh", "`echo 'ls | wc -l' > count.sh && chmod +x count.sh && ./count.sh`"],
        solution: "echo 'ls | wc -l' > count.sh && chmod +x count.sh && ./count.sh",
        check: (x) => need(x.rootExists('count.sh') && isExec(x, 'count.sh') && /^\s*\d+\s*$/m.test(x.stdout), 'צריך שהקובץ count.sh ייווצר, יקבל x, וירוץ וידפיס מספר.'),
      },
      {
        prompt: 'ניקיון: מחק את כל קבצי ה-.tmp בכל ארגז החול, ו**רק אם הצליח** הדפס "נוקה!"',
        hint: '`find . -name "*.tmp" -delete && echo "נוקה!"`',
        solution: 'find . -name "*.tmp" -delete && echo "נוקה!"',
        check: (x) => need(!x.rootList('old-stuff').some((f) => f.endsWith('.tmp')) && has(x, 'נוקה'), 'צריך למחוק את ה-.tmp ולהדפיס נוקה!'),
      },
      {
        prompt: 'תפריט המסעדה 🍽️: הדפס את **השורה הראשונה** (שם המנה) של כל מתכון — בלולאה.',
        hint: ['for על recipes/*.txt, ובכל סיבוב head -n 1', '`for f in recipes/*.txt; do head -n 1 "$f"; done`'],
        solution: 'for f in recipes/*.txt; do head -n 1 "$f"; done',
        check: (x) => need(x.lines.length === 3 && has(x, 'שקשוקה', 'עוגת שוקולד', 'פסטה'), 'צריכות לצאת 3 שורות: שם של כל מנה.'),
        success: 'התפריט מוכן. השף מרוצה. 👨‍🍳',
      },
      {
        quiz: {
          question: 'שאלה אחרונה: מה הדבר הכי חשוב לזכור בטרמינל?',
          options: ['לבדוק פעמיים לפני rm — ולהשתמש ב-Tab, ↑ ו-Ctrl+R', 'להשתמש תמיד ב-sudo', 'אף פעם לא לקרוא הודעות שגיאה', 'להקליד כמה שיותר מהר'],
          answer: 0,
          explain: 'והודעות שגיאה? הן החברות הכי טובות שלך. הן אומרות בדיוק מה לא בסדר. 💙',
        },
      },
    ],
    drills: [],
    cheats: [
      ['grep -o "pattern"', 'רק החלק שהתאים'],
      ['sort | uniq -c | sort -rn', 'מה הכי נפוץ'],
      ['a && b && c', 'שרשרת בטוחה'],
    ],
    onComplete: async (deps) => {
      const screens = require('../lib/screens');
      screens.certificate(deps.progress);
    },
  },
];
