// lessons/intermediate.js
// רמת ביניים: צינורות, חיפוש, הרשאות, כלים מותקנים ומשתני סביבה.

'use strict';

const os = require('os');
const { ran, has, need, where, countFiles, firstNumber } = require('./_helpers');
const detect = require('../lib/detect');

module.exports = [
  // ─────────────────────────────────────────────
  {
    id: 'pipes',
    level: 'בינוני',
    emoji: '🏭',
    title: 'הפניות וצינורות: > | sort uniq',
    teach: `## לאן הולך הפלט?
כל פקודה "מדברת" ל**מסך** כברירת מחדל. אבל אפשר לכוון אותה למקום אחר:
- \`ls > files.txt\` — הפלט הולך לקובץ במקום למסך
- \`ls >> files.txt\` — מוסיף לסוף הקובץ
- \`ls nothing 2> errors.txt\` — **שגיאות** הולכות לקובץ (2 = ערוץ השגיאות)

## | — הצינור 🏭 (הכוכב של השיעור!)
\`|\` (Shift+\\) לוקח את הפלט של פקודה אחת ומעביר אותו **כקלט** לפקודה הבאה. כמו פס ייצור במפעל:
\`cat names.txt | sort | uniq\` — קרא ← מיין ← הורד כפילויות

## כלי הפס הייצור
- \`sort\` — ממיין שורות (\`-n\` = לפי מספרים, \`-r\` = הפוך)
- \`uniq\` — מוריד שורות כפולות **צמודות** (לכן תמיד sort לפני!) · \`uniq -c\` = גם סופר
- \`wc -l\` — סופר שורות
- \`head -n 1\` — רק הראשונה

## && ו-;
- \`mkdir x && cd x\` — הפקודה השנייה רצה **רק אם** הראשונה הצליחה ✅
- \`cmd1 ; cmd2\` — השנייה רצה תמיד

> עם | אפשר לבנות כמעט כל דבר מחלקים קטנים. זו הפילוסופיה של יוניקס: כל כלי עושה דבר אחד — ועושה אותו מעולה.
> 🐛 באג מוכר במק: sort ו-uniq לא מסתדרים עם עברית (uniq חושב שכל השמות זהים!). בקורס זה כבר מתוקן. בטרמינל שלך: הוסף את השורה \`export LC_COLLATE=C\` לקובץ ~/.zshrc.`,
    tasks: [
      {
        prompt: 'שמור את רשימת הקבצים (הפלט של ls) לתוך קובץ בשם **files.txt**',
        hint: '`ls > files.txt`',
        solution: 'ls > files.txt',
        check: (x) => need((x.rootRead('files.txt') || '').includes('welcome.txt'), 'files.txt צריך להכיל את הפלט של ls.' + where(x)),
        success: 'שים לב — שום דבר לא הודפס למסך. הכל הלך לקובץ. 📦',
      },
      {
        prompt: 'הצג את **names.txt** ממוין לפי א-ב.',
        hint: '`sort names.txt` (או `cat names.txt | sort`)',
        solution: 'sort names.txt',
        check: (x) => need(ran(x, /\bsort\b/) && x.lines.length === 10, 'צריך sort על names.txt'),
        success: 'רואה את הכפילויות? דני מופיע 3 פעמים. בוא נטפל בזה.',
      },
      {
        prompt: 'עכשיו ממוין **ובלי כפילויות** — חבר את sort ל-uniq עם צינור |',
        hint: ['sort ואז | ואז uniq', '`sort names.txt | uniq`'],
        solution: 'sort names.txt | uniq',
        check: (x) => need(/\|/.test(x.cmd) && /\buniq\b/.test(x.cmd) && x.lines.length === 6 && new Set(x.lines).size === 6, 'צריך 6 שמות, בלי כפילויות.'),
      },
      {
        prompt: 'מי השם הכי פופולרי? הוסף ל-uniq את הדגל **-c** שסופר כמה פעמים כל שם מופיע.',
        hint: '`sort names.txt | uniq -c`',
        solution: 'sort names.txt | uniq -c',
        check: (x) => /uniq\s+-c/.test(x.cmd) && /3\s+דני/.test(x.stdout),
        success: 'דני מנצח עם 3! 🏆',
      },
      {
        prompt: 'מיין את **numbers.txt** לפי **ערך מספרי** (ולא לפי א-ב).',
        hint: ['sort רגיל חושב ש-100 קטן מ-7 (כי 1 לפני 7). יש דגל למספרים.', '`sort -n numbers.txt`'],
        solution: 'sort -n numbers.txt',
        check: (x) => need(ran(x, /sort\s+.*-\w*n|sort\s+-\w*n/) && x.lines[0] === '3' && x.lines[x.lines.length - 1] === '100', 'צריך sort -n — מהקטן לגדול.'),
      },
      {
        prompt: 'מה **המספר הכי גדול** ב-numbers.txt? מיין מהגדול לקטן וקח רק את הראשון.',
        hint: ['-r = הפוך. head -n 1 = רק הראשון.', '`sort -rn numbers.txt | head -n 1`'],
        solution: 'sort -rn numbers.txt | head -n 1',
        check: (x) => need(/\|/.test(x.cmd) && x.stdout.trim() === '100', 'הפלט צריך להיות רק: 100'),
        success: '100! שלוש פקודות, צינור אחד, תשובה אחת. 🏭',
      },
      {
        prompt: 'כמה תמונות יש בתיקייה photos? (ls ואז צינור ל-wc -l)',
        hint: '`ls photos | wc -l`',
        solution: 'ls photos | wc -l',
        check: (x) => /\|\s*wc\b/.test(x.cmd) && firstNumber(x) === 3,
      },
      {
        prompt: 'כמה שמות **שונים** יש ב-names.txt? (שלוש פקודות בצינור)',
        hint: '`sort names.txt | uniq | wc -l`',
        solution: 'sort names.txt | uniq | wc -l',
        check: (x) => /uniq/.test(x.cmd) && /wc/.test(x.cmd) && firstNumber(x) === 6,
        success: '6 שמות שונים. אתה כבר מדבר "צינורית" שוטפת.',
      },
      {
        prompt: 'נסה להציג תיקייה שלא קיימת, ושלח את **השגיאה** לקובץ errors.txt',
        hint: '`ls no-such-folder 2> errors.txt`',
        solution: 'ls no-such-folder 2> errors.txt',
        check: (x) => need((x.rootRead('errors.txt') || '').trim().length > 0, 'errors.txt צריך להכיל את הודעת השגיאה (שימוש ב-2>).' + where(x)),
        success: 'השגיאה לא הופיעה במסך — היא הלכה לקובץ. 2> = "שגיאות לשם".',
      },
      {
        prompt: 'צור תיקייה **reports** ו**רק אם** זה הצליח — הדפס "נוצר!"',
        hint: '`mkdir reports && echo "נוצר!"`',
        solution: 'mkdir reports && echo "נוצר!"',
        check: (x) => need(/&&/.test(x.cmd) && x.rootIsDir('reports') && has(x, 'נוצר'), 'צריך mkdir ואז && ואז echo.'),
        success: 'עכשיו תריץ אותה שוב (חץ למעלה ↑) — mkdir ייכשל (כבר קיים) וה-echo לא ירוץ. זה הקסם של &&.',
      },
      {
        quiz: {
          question: 'למה כותבים `sort` **לפני** `uniq`?',
          options: ['uniq מוריד רק כפילויות שצמודות אחת לשנייה', 'סתם הרגל', 'uniq לא עובד בלי sort בכלל', 'sort מוחק כפילויות לבד'],
          answer: 0,
          explain: 'sort מצמיד את הכפילויות, ואז uniq מעיף אותן.',
        },
      },
      {
        quiz: {
          question: 'מה עושה `|`?',
          options: ['מעביר את הפלט של פקודה אחת כקלט לפקודה הבאה', 'שומר לקובץ', 'מריץ שתי פקודות במקביל', 'מוחק'],
          answer: 0,
          explain: 'פס ייצור: מה שיוצא מאחת נכנס לשנייה.',
        },
      },
    ],
    drills: [
      { prompt: 'שמור את התוכן של ls photos לתוך קובץ pics.txt', hint: 'ls photos > pics.txt', solution: 'ls photos > pics.txt', check: (x) => (x.rootRead('pics.txt') || '').includes('cat.png') },
      { prompt: 'מה המספר הכי קטן ב-numbers.txt? (הפלט: רק המספר)', hint: 'sort -n ... | head -n 1', solution: 'sort -n numbers.txt | head -n 1', check: (x) => x.stdout.trim() === '3' },
      { prompt: 'כמה קבצים יש ב-recipes? (ls + wc)', hint: 'ls recipes | wc -l', solution: 'ls recipes | wc -l', check: (x) => /wc/.test(x.cmd) && firstNumber(x) === 3 },
      { prompt: 'הצג את names.txt ממוין ובלי כפילויות', hint: 'sort | uniq', solution: 'sort names.txt | uniq', check: (x) => x.lines.length === 6 && new Set(x.lines).size === 6 },
      { prompt: 'הוסף את הפלט של date לסוף הקובץ diary.txt', hint: '>>', solution: 'date >> diary.txt', check: (x) => (x.rootRead('diary.txt') || '').trim().split('\n').length === 4 },
    ],
    cheats: [
      ['cmd > file', 'פלט לקובץ'],
      ['cmd 2> file', 'שגיאות לקובץ'],
      ['a | b', 'הפלט של a נכנס ל-b'],
      ['sort -n / -r', 'מיון מספרי / הפוך'],
      ['sort | uniq -c', 'ספירת כפילויות'],
      ['a && b', 'b רק אם a הצליח'],
    ],
  },

  // ─────────────────────────────────────────────
  {
    id: 'grep',
    level: 'בינוני',
    emoji: '🔍',
    title: 'grep — מחט בערימת שחת',
    teach: `## grep = Ctrl+F על סטרואידים 🔍
\`grep מילה קובץ\` — מציג רק את השורות שמכילות את המילה.

## הדגלים החשובים
- \`-i\` — לא משנה אותיות גדולות/קטנות (ignore case)
- \`-n\` — מראה מספרי שורות
- \`-c\` — רק **כמה** שורות תואמות (count)
- \`-v\` — ההפך: שורות שלא מכילות (in**v**ert)
- \`-r\` — מחפש בכל הקבצים בתיקייה, לעומק (recursive)
- \`-l\` — רק **שמות** הקבצים שבהם נמצא משהו

## grep + צינור = 💪
\`ls photos | grep jpg\` — מסנן כל פלט של כל פקודה!

## ביטויים (regex) — בקטנה
- \`^\` = תחילת שורה: \`grep "^2026"\`
- \`$\` = סוף שורה: \`grep "failed$"\`
> כשיש רווחים או סימנים מיוחדים — שים את המילה במרכאות: \`grep "payment failed" app.log\``,
    tasks: [
      {
        prompt: 'יש בעיות בשרת! הצג את כל שורות ה-**ERROR** מתוך logs/app.log',
        hint: '`grep ERROR logs/app.log`',
        solution: 'grep ERROR logs/app.log',
        check: (x) => need(ran(x, /^grep\b/) && x.lines.length === 4 && x.lines.every((l) => l.includes('ERROR')), 'צריך בדיוק את 4 שורות ה-ERROR.' + where(x)),
        success: '4 שגיאות. yossi מופיע שם הרבה... 🤔',
      },
      {
        prompt: 'המנהל רוצה רק מספר: **כמה** שורות ERROR יש?',
        hint: '`grep -c ERROR logs/app.log`',
        solution: 'grep -c ERROR logs/app.log',
        check: (x) => ran(x, /grep\s+.*-\w*c/) && x.stdout.trim() === '4',
      },
      {
        prompt: 'מישהו כתב error באותיות קטנות! חפש **בלי קשר לגודל האותיות**.',
        hint: '`grep -i error logs/app.log`',
        solution: 'grep -i error logs/app.log',
        check: (x) => need(/grep\s+.*-\w*i/.test(x.cmd) && x.lines.length === 5, 'עם -i צריכות לצאת 5 שורות.'),
        success: 'תפסנו גם את ה-error הקטן. אף באג לא בורח. 🪤',
      },
      {
        prompt: 'באילו שורות מופיעה המשתמשת **dana**? הצג עם **מספרי שורות**.',
        hint: '`grep -n dana logs/app.log`',
        solution: 'grep -n dana logs/app.log',
        check: (x) => /grep\s+.*-\w*n/.test(x.cmd) && /^\d+:/m.test(x.stdout) && x.lines.length === 4,
      },
      {
        prompt: 'הצג את כל השורות ש**לא** INFO (רק הדברים המעניינים).',
        hint: '`grep -v INFO logs/app.log`',
        solution: 'grep -v INFO logs/app.log',
        check: (x) => need(/grep\s+.*-\w*v/.test(x.cmd) && x.lines.length === 7 && !has(x, 'INFO'), 'צריך -v — 7 שורות בלי INFO.'),
      },
      {
        prompt: 'מצא את כל ה-**TODO** בכל הקבצים שבתיקייה projects (לעומק).',
        hint: '`grep -r TODO projects`',
        solution: 'grep -r TODO projects',
        check: (x) => /grep\s+.*-\w*r/.test(x.cmd) && x.lines.length === 3 && has(x, 'game.js', 'about.html'),
        success: '3 משימות פתוחות בקוד. כל מתכנת מכיר את התחושה. 😅',
      },
      {
        prompt: 'באילו מתכונים יש **ביצים**? הצג רק את **שמות הקבצים**.',
        hint: '`grep -l ביצים recipes/*`',
        solution: 'grep -l ביצים recipes/*',
        check: (x) => /grep\s+.*-\w*l/.test(x.cmd) && has(x, 'shakshuka.txt', 'cake.txt') && !has(x, 'pasta.txt'),
        success: 'שקשוקה ועוגה. 🍳🎂 לא ביחד, בבקשה.',
      },
      {
        prompt: 'grep עם צינור: הצג רק את קבצי ה-jpg מתוך `ls photos`',
        hint: '`ls photos | grep jpg`',
        solution: 'ls photos | grep jpg',
        check: (x) => /\|\s*grep\b/.test(x.cmd) && x.lines.length === 2,
      },
      {
        prompt: 'מצא שורות שה**סוף** שלהן הוא המילה failed (עם $).',
        hint: '`grep "failed$" logs/app.log`',
        solution: 'grep "failed$" logs/app.log',
        check: (x) => need(/\$/.test(x.cmd) && x.lines.length === 1 && x.stdout.includes('payment failed'), 'רק שורה אחת נגמרת ב-failed. (השנייה נגמרת ב-again)'),
      },
      {
        prompt: 'בלש מקצועי 🕵️: הצג את השגיאות (ERROR) של **yossi** בלבד — שני grep בצינור.',
        hint: '`grep yossi logs/app.log | grep ERROR`',
        solution: 'grep yossi logs/app.log | grep ERROR',
        check: (x) => /grep.*\|.*grep/.test(x.cmd) && x.lines.length === 3 && x.lines.every((l) => l.includes('yossi') && l.includes('ERROR')),
        success: '3 שגיאות ל-yossi. מישהו צריך לדבר איתו על התשלומים שלו. 💳',
      },
      {
        quiz: {
          question: 'מה עושה `grep -v INFO`?',
          options: ['מציג את כל השורות שלא מכילות INFO', 'מציג רק שורות INFO', 'סופר שורות INFO', 'מוחק שורות INFO'],
          answer: 0,
          explain: 'v = invert = הפוך.',
        },
      },
      {
        quiz: {
          question: 'איזה דגל מחפש בתוך **כל הקבצים** בתיקייה?',
          options: ['-r', '-c', '-n', '-i'],
          answer: 0,
          explain: 'r = recursive = לעומק.',
        },
      },
    ],
    drills: [
      { prompt: 'מצא את כל שורות ה-WARN בלוג logs/app.log', hint: 'grep WARN ...', solution: 'grep WARN logs/app.log', check: (x) => /grep/.test(x.cmd) && x.lines.length === 2 },
      { prompt: 'כמה שורות בלוג מזכירות את avi? (רק מספר)', hint: 'grep -c', solution: 'grep -c avi logs/app.log', check: (x) => x.stdout.trim() === '3' },
      { prompt: 'באילו מתכונים יש עגבניות? (רק שמות קבצים)', hint: 'grep -l ... recipes/*', solution: 'grep -l עגבניות recipes/*', check: (x) => has(x, 'pasta.txt', 'shakshuka.txt') && !has(x, 'cake.txt') },
      { prompt: 'חפש "קפה" בכל הקבצים שבתיקייה notes', hint: 'grep -r', solution: 'grep -r קפה notes', check: (x) => has(x, 'todo.txt') },
      { prompt: 'הצג את השורות ב-diary.txt שמכילות "ls" עם מספרי שורות', hint: 'grep -n', solution: 'grep -n ls diary.txt', check: (x) => /^\d+:/m.test(x.stdout) && has(x, 'ls') },
    ],
    cheats: [
      ['grep word file', 'שורות שמכילות word'],
      ['grep -i', 'בלי רגישות לאותיות'],
      ['grep -n / -c', 'מספרי שורות / ספירה'],
      ['grep -v', 'שורות שלא מכילות'],
      ['grep -r word dir', 'חיפוש בכל התיקייה'],
      ['grep -l', 'רק שמות קבצים'],
      ['cmd | grep x', 'סינון פלט'],
    ],
  },

  // ─────────────────────────────────────────────
  {
    id: 'find',
    level: 'בינוני',
    emoji: '🧭',
    title: 'find — למצוא קבצים בכל מקום',
    teach: `## grep מחפש **בתוך** קבצים. find מחפש **את** הקבצים.
\`find איפה -name "תבנית"\`
- \`find . -name "*.jpg"\` — כל ה-jpg מכאן ולעומק (\`.\` = "מכאן")
- \`find . -iname "*.PNG"\` — בלי רגישות לאותיות גדולות/קטנות
- \`find . -type f\` — רק קבצים (**f**ile) · \`-type d\` — רק תיקיות (**d**irectory)
- \`find . -name "*.tmp" -delete\` — מוצא **ומוחק** 😱 (תמיד להריץ קודם בלי -delete!)

## שילובים
- \`find . -type f | wc -l\` — כמה קבצים יש בסך הכל?
- \`find ~ -name "*.pdf" 2>/dev/null\` — חיפוש בכל הבית, בלי הודעות "אין הרשאה"

> שים את התבנית **במרכאות** ("*.jpg"). בלי מרכאות, ה-shell עלול להפוך את * לשמות קבצים לפני ש-find בכלל רואה אותה.`,
    tasks: [
      {
        prompt: 'מצא את כל קבצי ה-**jpg** בכל ארגז החול.',
        hint: '`find . -name "*.jpg"`',
        solution: 'find . -name "*.jpg"',
        check: (x) => need(ran(x, /^find\b/) && has(x, 'beach.jpg', 'sunset.jpg') && !has(x, 'cat.png'), 'צריך find עם -name "*.jpg"' + where(x)),
      },
      {
        prompt: 'הצג את כל **התיקיות** (ורק תיקיות) בארגז החול.',
        hint: '`find . -type d`',
        solution: 'find . -type d',
        check: (x) => need(/-type\s+d/.test(x.cmd) && x.lines.length >= 8 && x.lines.every((l) => x.isDir(l)), 'צריך -type d'),
        success: 'מפת הבית המלאה. 🗺️',
      },
      {
        prompt: 'איפה מסתתרים כל הקבצים בשם **index.html**?',
        hint: '`find . -name index.html`',
        solution: 'find . -name index.html',
        check: (x) => ran(x, /^find\b/) && x.lines.length === 2 && has(x, 'game/index.html', 'website/index.html'),
      },
      {
        prompt: 'כמה **קבצים** (לא תיקיות) יש בכל ארגז החול? (find + wc)',
        hint: '`find . -type f | wc -l`',
        solution: 'find . -type f | wc -l',
        check: (x) => need(/-type\s+f/.test(x.cmd) && /wc/.test(x.cmd) && firstNumber(x) === countFiles(x.cwd), 'find . -type f | wc -l — מהשורש של ארגז החול.' + where(x)),
      },
      {
        prompt: 'חפש את קבצי ה-txt רק בתוך התיקייה **recipes**',
        hint: '`find recipes -name "*.txt"`',
        solution: 'find recipes -name "*.txt"',
        check: (x) => /^find\s+recipes/.test(x.cmd) && x.lines.length === 3,
      },
      {
        prompt: 'מצא את החתול עם **PNG באותיות גדולות** — בלי קשר לגודל האותיות.',
        hint: '`find . -iname "*.PNG"`',
        solution: 'find . -iname "*.PNG"',
        check: (x) => /-iname/.test(x.cmd) && has(x, 'cat.png'),
        success: 'מצאתי את החתול! 🐈 (i = ignore case, כמו ב-grep)',
      },
      {
        prompt: 'מצא את כל הקבצים ה**מוסתרים** (שמתחילים בנקודה).',
        hint: ['תבנית: שם שמתחיל בנקודה ואחריה כל דבר.', '`find . -name ".*" -type f`'],
        solution: 'find . -name ".*" -type f',
        check: (x) => /-name\s+["']\.\*["']/.test(x.cmd) && has(x, '.treasure.txt'),
      },
      {
        prompt: 'קודם בודקים: מצא את כל קבצי ה-**.tmp** (בלי למחוק).',
        hint: '`find . -name "*.tmp"`',
        solution: 'find . -name "*.tmp"',
        check: (x) => !/-delete/.test(x.cmd) && x.lines.length === 2 && has(x, 'trash1.tmp'),
      },
      {
        prompt: 'עכשיו כשראינו מה יימחק — מחק אותם עם **-delete**.',
        hint: '`find . -name "*.tmp" -delete`',
        solution: 'find . -name "*.tmp" -delete',
        check: (x) => need(/-delete/.test(x.cmd) && !x.rootList('old-stuff').some((f) => f.endsWith('.tmp')), 'צריך -delete על קבצי ה-.tmp'),
        success: 'ניקיון אביב בשורה אחת. 🧹',
      },
      {
        quiz: {
          question: 'למה שמים מרכאות ב-`find . -name "*.txt"`?',
          options: ['כדי שה-shell לא יהפוך את * לשמות קבצים לפני ש-find רואה אותה', 'בשביל היופי', 'find לא עובד עם כוכבית', 'כדי למחוק'],
          answer: 0,
          explain: 'המרכאות שומרות את ה-* בשביל find.',
        },
      },
      {
        quiz: {
          question: 'מה ההבדל בין grep ל-find?',
          options: ['grep מחפש בתוך תוכן, find מחפש קבצים לפי שם/סוג', 'אין הבדל', 'find מהיר יותר', 'grep רק לתיקיות'],
          answer: 0,
          explain: 'grep = מה כתוב. find = איפה נמצא.',
        },
      },
    ],
    drills: [
      { prompt: 'מצא את כל קבצי ה-.md בארגז החול', hint: 'find . -name "*.md"', solution: 'find . -name "*.md"', check: (x) => has(x, 'ideas.md') },
      { prompt: 'מצא את כל התיקיות שבתוך projects', hint: 'find projects -type d', solution: 'find projects -type d', check: (x) => /-type\s+d/.test(x.cmd) && has(x, 'game', 'website') },
      { prompt: 'איפה נמצא הקובץ cake.txt?', hint: 'find . -name', solution: 'find . -name cake.txt', check: (x) => has(x, 'recipes/cake.txt') },
      { prompt: 'כמה קבצי .txt יש בכל ארגז החול? (רק מספר)', hint: 'find ... | wc -l', solution: 'find . -name "*.txt" | wc -l', check: (x) => firstNumber(x) === countFiles(x.root, '.txt') },
    ],
    cheats: [
      ['find . -name "*.jpg"', 'חיפוש לפי שם'],
      ['find . -iname', 'בלי רגישות לאותיות'],
      ['find . -type f / d', 'רק קבצים / תיקיות'],
      ['find . -name "*.tmp" -delete', 'מצא ומחק (זהירות!)'],
      ['2>/dev/null', 'להעלים הודעות שגיאה'],
    ],
  },

  // ─────────────────────────────────────────────
  {
    id: 'permissions',
    level: 'בינוני',
    emoji: '🔐',
    title: 'הרשאות: מי מורשה מה?',
    teach: `## מה זה -rwxr-xr-- ? 🤯
כשמריצים \`ls -l\`, העמודה הראשונה נראית כמו קוד סודי. בוא נפצח אותו:
\`-rwxr-xr--\`
- תו ראשון: \`-\` קובץ, \`d\` תיקייה
- ואז 3 שלשות: **בעלים** (u) · **קבוצה** (g) · **כל השאר** (o)
- בכל שלשה: **r** = קריאה 👀 · **w** = כתיבה ✏️ · **x** = הרצה 🏃 · **-** = אין

## chmod — לשנות הרשאות
- \`chmod +x script.sh\` — מאפשר להריץ את הקובץ
- \`chmod -w file\` — מוריד הרשאת כתיבה (קובץ "לקריאה בלבד")
- \`chmod u+x file\` — רק לבעלים

## השיטה המספרית (של המקצוענים)
r=4, w=2, x=1 — מחברים!  7=rwx · 6=rw- · 5=r-x · 4=r--
- \`chmod 755 script.sh\` — אני הכל, אחרים לקרוא ולהריץ
- \`chmod 644 file\` — אני לקרוא ולכתוב, אחרים רק לקרוא
- \`chmod 600 secret\` — רק אני. אף אחד אחר. 🔒

## להריץ סקריפט
\`./hello.sh\` — ה-\`./\` אומר "הקובץ שנמצא **כאן**". בלי זה המחשב מחפש פקודה בשם hello.sh במקומות אחרים.`,
    tasks: [
      {
        prompt: 'הצג את ההרשאות של **welcome.txt**',
        hint: '`ls -l welcome.txt`',
        solution: 'ls -l welcome.txt',
        check: (x) => ran(x, /^ls\s+-\w*l/) && /^-rw/.test(x.stdout),
        success: '-rw-r--r-- = אתה קורא וכותב, כל השאר רק קוראים.',
      },
      {
        prompt: `צור סקריפט קטן: \`echo 'echo "שלום מהסקריפט! 🎉"' > hello.sh\``,
        hint: 'העתק את הפקודה כמו שהיא. (שים לב: גרשיים בחוץ, מרכאות בפנים)',
        solution: `echo 'echo "שלום מהסקריפט! 🎉"' > hello.sh`,
        check: (x) => need((x.rootRead('hello.sh') || '').includes('echo'), 'hello.sh צריך להכיל פקודת echo.' + where(x)),
      },
      {
        prompt: 'עכשיו **נסה להריץ** אותו: `./hello.sh` (זה אמור להיכשל — ובכוונה!)',
        hint: '`./hello.sh`',
        solution: './hello.sh',
        check: (x) => /^\.\/hello\.sh/.test(x.cmd) && (/denied/i.test(x.stderr) || has(x, 'שלום')),
        success: 'בדיוק! "Permission denied" — לקובץ אין הרשאת הרצה (x). בוא נתקן.',
      },
      {
        prompt: 'תן ל-hello.sh **הרשאת הרצה**.',
        hint: '`chmod +x hello.sh`',
        solution: 'chmod +x hello.sh',
        check: (x) => need((x.rootMode('hello.sh') & 0o100) !== 0, 'צריך chmod +x על hello.sh'),
      },
      {
        prompt: 'ועכשיו — הרץ אותו שוב! 🥁',
        hint: '`./hello.sh`',
        solution: './hello.sh',
        check: (x) => has(x, 'שלום מהסקריפט'),
        success: 'כתבת והרצת את התוכנה הראשונה שלך! 🎉🎉🎉',
      },
      {
        prompt: 'תסתכל על ההרשאות החדשות של hello.sh',
        hint: '`ls -l hello.sh`',
        solution: 'ls -l hello.sh',
        check: (x) => ran(x, /^ls\s+-\w*l/) && /^-rwx/.test(x.stdout),
        success: 'רואה את ה-x? זה ה"מותר להריץ".',
      },
      {
        prompt: 'הגן על **secret.txt**: רק אתה תוכל לקרוא ולכתוב (השיטה המספרית: 600)',
        hint: '`chmod 600 secret.txt`',
        solution: 'chmod 600 secret.txt',
        check: (x) => need(x.rootMode('secret.txt') === 0o600, 'ההרשאות של secret.txt צריכות להיות 600 (rw-------).'),
      },
      {
        prompt: 'בדוק: `ls -l secret.txt` — אמור להיראות -rw-------',
        hint: '`ls -l secret.txt`',
        solution: 'ls -l secret.txt',
        check: (x) => ran(x, /^ls\b/) && /^-rw-------/.test(x.stdout),
        success: 'סגור הרמטית. 🔒 (ככה בדיוק שומרים מפתחות SSH!)',
      },
      {
        prompt: 'הפוך את **diary.txt** ל"קריאה בלבד" — הורד את הרשאת הכתיבה.',
        hint: '`chmod -w diary.txt`',
        solution: 'chmod -w diary.txt',
        check: (x) => need((x.rootMode('diary.txt') & 0o222) === 0, 'צריך להוריד את ה-w מ-diary.txt'),
      },
      {
        prompt: 'עכשיו נסה להוסיף שורה ליומן: `echo "ניסיון" >> diary.txt` (אמור להיכשל 😈)',
        hint: 'echo "ניסיון" >> diary.txt',
        solution: 'echo "ניסיון" >> diary.txt',
        check: (x) => />>\s*diary\.txt/.test(x.cmd) && /denied/i.test(x.stderr),
        success: 'Permission denied! היומן מוגן. גם ממך. 😄',
      },
      {
        prompt: 'החזר את הרשאת הכתיבה ל-diary.txt',
        hint: '`chmod +w diary.txt` (או `chmod u+w diary.txt`)',
        solution: 'chmod u+w diary.txt',
        check: (x) => need((x.rootMode('diary.txt') & 0o200) !== 0, 'צריך להחזיר w לבעלים.'),
      },
      {
        prompt: 'קבע ל-hello.sh את ההרשאות הקלאסיות של סקריפט: **755**',
        hint: '`chmod 755 hello.sh`',
        solution: 'chmod 755 hello.sh',
        check: (x) => need(x.rootMode('hello.sh') === 0o755, 'צריך 755 (rwxr-xr-x).'),
      },
      {
        quiz: {
          question: 'מה המספר של **rwx**?',
          options: ['7', '3', '5', '777'],
          answer: 0,
          explain: 'r(4) + w(2) + x(1) = 7.',
        },
      },
      {
        quiz: {
          question: 'למה מריצים סקריפט עם `./script.sh` ולא סתם `script.sh`?',
          options: ['./ אומר "הקובץ שכאן בתיקייה הזאת"', 'זה יותר מהיר', 'זה מוחק אותו אחרי ההרצה', 'סתם מנהג'],
          answer: 0,
          explain: 'בלי ./ המחשב מחפש רק בתיקיות של ה-PATH (נלמד עליו בשיעור הבא).',
        },
      },
    ],
    drills: [
      { prompt: 'הצג את ההרשאות של כל הקבצים בארגז החול', hint: 'ls -l', solution: 'ls -l', check: (x) => ran(x, /^ls\s+-\w*l/) && /^-rw/m.test(x.stdout) },
      { prompt: 'שנה את secret.txt כך שרק אתה תוכל לקרוא ולכתוב (במספרים)', hint: 'chmod 600', solution: 'chmod 600 secret.txt', check: (x) => x.rootMode('secret.txt') === 0o600 },
      { prompt: 'הפוך את names.txt לקריאה בלבד (בלי w)', hint: 'chmod -w', solution: 'chmod -w names.txt', check: (x) => (x.rootMode('names.txt') & 0o222) === 0 },
      { prompt: 'תן הרשאות 755 ל-welcome.txt', hint: 'chmod 755', solution: 'chmod 755 welcome.txt', check: (x) => x.rootMode('welcome.txt') === 0o755 },
    ],
    cheats: [
      ['ls -l', 'לראות הרשאות'],
      ['chmod +x file', 'לאפשר הרצה'],
      ['chmod -w file', 'קריאה בלבד'],
      ['chmod 755 / 644 / 600', 'סקריפט / קובץ רגיל / סודי'],
      ['./script.sh', 'להריץ סקריפט מכאן'],
    ],
  },

  // ─────────────────────────────────────────────
  {
    id: 'tools',
    level: 'בינוני',
    emoji: '🔧',
    title: 'מה מותקן אצלי? which, PATH, גרסאות',
    mode: 'explore',
    teach: () => {
      const tools = detect.scanTools();
      const yes = tools.filter((t) => t.installed);
      const no = tools.filter((t) => !t.installed);
      const yesLines = yes.map((t) => `- ✅ ${t.emoji} **${t.label}** — ${t.what} ${t.version ? '(' + t.version + ')' : ''}`).join('\n');
      const noLines = no.map((t) => `- ❌ ${t.emoji} **${t.label}** — ${t.what}\n  איך מתקינים: \`${detect.installHint(t)}\``).join('\n');
      return `## סרקתי את המחשב שלך 🔎
${yesLines || '- (לא מצאתי כלים מוכרים)'}
${no.length ? '\n## מה עוד לא מותקן\n' + noLines + '\n> לא חובה להתקין הכל! רק מה שצריך. (ולא מתקינים מתוך הקורס — בחלון טרמינל רגיל.)' : '\n> וואו, יש לך הכל! 🏆'}

## איך המחשב יודע איפה נמצאת כל פקודה?
כשאתה כותב \`git\`, המחשב מחפש קובץ בשם git ברשימה של תיקיות שנקראת **PATH** — כמו ספר טלפונים של פקודות 📒.
- \`echo $PATH\` — מציג את הרשימה (מופרדת בנקודתיים :)
- \`which git\` — "איפה גר git?" מחזיר את הנתיב המלא
- \`git --version\` — כמעט כל כלי יודע להגיד את הגרסה שלו
- \`type cd\` — מגלה אם פקודה היא קובץ או משהו שמובנה ב-shell

## מנהלי חבילות = חנות אפליקציות לטרמינל 🛒
- מק: \`brew install שם\` (Homebrew)
- לינוקס: \`sudo apt install שם\`
- חבילות JavaScript: \`npm install שם\``;
    },
    tasks: [
      {
        prompt: 'איפה "גר" node? (הקורס הזה רץ עליו, אז הוא בטוח מותקן 😉)',
        hint: '`which node`',
        solution: 'which node',
        check: (x) => ran(x, /^which\s+node/) && has(x, '/node'),
        success: 'זה הנתיב המלא לתוכנה node. כשאתה כותב node, זה מה שרץ.',
      },
      {
        prompt: 'איזו גרסה של node יש לך?',
        hint: '`node --version`',
        solution: 'node --version',
        check: (x) => ran(x, /^node\s+(--version|-v)/) && /^v\d+/.test(x.stdout.trim()),
      },
      {
        prompt: 'הצג את ספר הטלפונים של הפקודות — משתנה **PATH**.',
        hint: '`echo $PATH`',
        solution: 'echo $PATH',
        check: (x) => ran(x, /^echo\s+.*\$PATH/) && has(x, '/usr/bin'),
        success: 'בלאגן של נקודתיים, נכון? בוא נסדר את זה.',
      },
      {
        prompt: 'הצג את PATH **תיקייה בכל שורה** — החלף : בירידת שורה עם tr',
        hint: `\`echo $PATH | tr ':' '\\n'\``,
        solution: "echo $PATH | tr ':' '\\n'",
        check: (x) => /\|\s*tr\b/.test(x.cmd) && x.lines.length >= 3 && x.lines.includes('/usr/bin'),
        success: 'הרבה יותר קריא! המחשב עובר על הרשימה הזו מלמעלה למטה עד שהוא מוצא את הפקודה.',
      },
      {
        prompt: 'בדוק אם **git** מותקן אצלך.',
        hint: '`which git`',
        solution: 'which git',
        check: (x) => {
          if (!/^which\s+git/.test(x.cmd)) return false;
          return { ok: true, msg: detect.isInstalled('git') ? 'git מותקן! 🌱 נשתמש בו בשיעור מתקדם.' : 'git לא מותקן — ראה בהסבר ("חזרה") איך מתקינים.' };
        },
      },
      {
        prompt: 'בדוק את הגרסה של **עוד כלי** שמותקן אצלך (למשל `git --version` או `python3 --version`).',
        hint: 'שם הכלי ואז --version',
        solution: () => (detect.isInstalled('git') ? 'git --version' : 'ls --version || echo ok'),
        check: (x) => need(/--version|\s-V\b|\bversion\b/.test(x.cmd) && x.code === 0 && !/^node\b/.test(x.cmd), 'בחר כלי אחר (לא node) שמותקן אצלך, והוסף --version'),
      },
      {
        prompt: 'האם cd הוא תוכנה בדיסק? בדוק עם `type cd`',
        hint: '`type cd`',
        solution: 'type cd',
        check: (x) => ran(x, /^type\s+cd/) && has(x, 'builtin'),
        success: 'cd הוא "builtin" — מובנה בתוך ה-shell עצמו, לא קובץ. (כי רק ה-shell יכול לשנות את המיקום של עצמו!)',
      },
      {
        prompt: 'כמה תוכנות יש בתיקייה **/usr/bin**? (ls + wc)',
        hint: '`ls /usr/bin | wc -l`',
        solution: 'ls /usr/bin | wc -l',
        check: (x) => /\/usr\/bin/.test(x.cmd) && /wc/.test(x.cmd) && firstNumber(x) > 10,
        success: 'מאות תוכנות קטנות שמחכות לך. והכרת כבר עשרות מהן. 💪',
      },
      {
        quiz: {
          question: 'מה זה **PATH**?',
          options: ['רשימת תיקיות שבהן המחשב מחפש פקודות', 'התיקייה הנוכחית', 'תיקיית הבית', 'רשימת הקבצים שמחקת'],
          answer: 0,
          explain: 'כשאתה כותב פקודה, המחשב מחפש אותה בתיקיות של PATH לפי הסדר.',
        },
      },
      {
        quiz: {
          question: 'מה תעשה אם כתבת `docker` וקיבלת **command not found**?',
          options: ['זה אומר שהכלי לא מותקן (או לא ב-PATH) — מתקינים אותו', 'המחשב מקולקל', 'צריך sudo', 'מוחקים את PATH'],
          answer: 0,
          explain: 'command not found = "חיפשתי בכל ה-PATH ולא מצאתי".',
        },
      },
    ],
    drills: [
      { prompt: 'איפה נמצאת הפקודה ls? (הנתיב המלא)', hint: 'which', solution: 'which ls', check: (x) => ran(x, /^which\s+ls/) && has(x, '/ls') },
      { prompt: 'מה הגרסה של node?', hint: 'node --version', solution: 'node --version', check: (x) => /^v\d+/.test(x.stdout.trim()) },
      { prompt: 'הצג את משתנה ה-PATH', hint: 'echo $PATH', solution: 'echo $PATH', check: (x) => has(x, '/usr/bin') },
    ],
    cheats: [
      ['which cmd', 'איפה הפקודה גרה'],
      ['cmd --version', 'גרסה'],
      ['echo $PATH', 'איפה מחפשים פקודות'],
      ['type cmd', 'מה סוג הפקודה'],
      ['brew install x', 'התקנה במק'],
    ],
  },

  // ─────────────────────────────────────────────
  {
    id: 'env',
    level: 'בינוני',
    emoji: '🎛️',
    title: 'משתנים, alias וקיצורי מקלדת',
    teach: `## משתנים = פתקים עם שם 📝
- \`FOOD=פיצה\` — יוצר משתנה. **בלי רווחים סביב ה-=!** (\`FOOD = פיצה\` = שגיאה)
- \`echo $FOOD\` — ה-$ אומר "תביא את הערך"
- \`export CITY=חיפה\` — משתנה שגם תוכנות אחרות שתריץ יראו

## משתנים שכבר קיימים (משתני סביבה)
\`$HOME\` הבית · \`$USER\` שם המשתמש · \`$SHELL\` איזה shell · \`$PATH\` איפה מחפשים פקודות
\`env\` — מציג את כולם

## alias — קיצורים משלך ⚡
\`alias ll='ls -la'\` — מעכשיו \`ll\` = \`ls -la\`. חוסך מיליון הקלדות בשנה.
> כדי שזה יישמר לתמיד, מוסיפים את השורה לקובץ ~/.zshrc (זה קובץ ההגדרות של ה-shell). הקורס לא נוגע בו — זה שלך.

## היסטוריה וקיצורי מקלדת (בטרמינל אמיתי) ⌨️
- ↑ / ↓ — פקודות קודמות (עובד גם כאן!)
- \`history\` — כל מה שהקלדת · \`!!\` — הפקודה הקודמת שוב
- **Ctrl+R** — חיפוש בהיסטוריה 🔎 · **Ctrl+C** — עצור! 🛑 · **Ctrl+L** — נקה מסך
- **Ctrl+A** / **Ctrl+E** — קפוץ לתחילת / סוף השורה · **Ctrl+U** — מחק את כל השורה
- **Tab** — השלמה אוטומטית`,
    tasks: [
      {
        prompt: 'איפה הבית שלך? הצג את המשתנה **HOME**.',
        hint: '`echo $HOME`',
        solution: 'echo $HOME',
        check: (x) => ran(x, /^echo\b.*\$\{?HOME/) && x.stdout.trim() === os.homedir(),
      },
      {
        prompt: 'מה שם המשתמש שלך — אבל הפעם דרך המשתנה **USER**.',
        hint: '`echo $USER`',
        solution: 'echo $USER',
        check: (x) => ran(x, /^echo\b.*\$\{?USER/) && has(x, os.userInfo().username),
      },
      {
        prompt: 'שלב משתנים בתוך משפט: `echo "אני $USER והבית שלי ב-$HOME"`',
        hint: 'המשתנים עובדים בתוך "מרכאות כפולות".',
        solution: 'echo "אני $USER והבית שלי ב-$HOME"',
        check: (x) => ran(x, /^echo\b/) && has(x, os.userInfo().username, os.homedir()),
        success: 'בתוך "מרכאות" המשתנים מתחלפים. בתוך \'גרשיים\' — לא. (נסה ותראה!)',
      },
      {
        prompt: 'צור משתנה בשם **FOOD** עם האוכל שאתה הכי אוהב. (למשל: `FOOD=פיצה` — בלי רווחים!)',
        hint: ['שם=ערך, צמוד.', '`FOOD=פיצה`'],
        solution: 'FOOD=פיצה',
        check: (x) => {
          if (x.env.FOOD) return true;
          if (/^FOOD\s+=/.test(x.cmd)) return { ok: false, msg: 'רואה? עם רווחים זה לא עובד — המחשב חשב ש-FOOD זו פקודה. כתוב צמוד: FOOD=פיצה' };
          return { ok: false, msg: 'צריך FOOD=משהו' };
        },
      },
      {
        prompt: 'עכשיו תשתמש בו: `echo "האוכל שלי: $FOOD"`',
        hint: 'echo עם $FOOD',
        solution: 'echo "האוכל שלי: $FOOD"',
        check: (x) => ran(x, /\$\{?FOOD/) && !!x.env.FOOD && has(x, x.env.FOOD),
        success: 'יאמי. 😋',
      },
      {
        prompt: 'צור משתנה **CITY** עם `export` (העיר שלך) — ואז בשורה הבאה נציג אותו.',
        hint: '`export CITY=ירושלים`',
        solution: 'export CITY=ירושלים',
        check: (x) => need(/^export\s+CITY=/.test(x.cmd) && !!x.env.CITY, 'צריך export CITY=...'),
      },
      {
        prompt: 'הצג את **CITY**',
        hint: '`echo $CITY`',
        solution: 'echo $CITY',
        check: (x) => !!x.env.CITY && has(x, x.env.CITY),
      },
      {
        prompt: `צור קיצור: \`alias ll='ls -la'\``,
        hint: `alias ll='ls -la'`,
        solution: "alias ll='ls -la'",
        check: (x) => need(x.aliases.ll && /ls\s+-/.test(x.aliases.ll), "צריך alias ll='ls -la'"),
      },
      {
        prompt: 'עכשיו תקליד רק `ll` 😎',
        hint: 'שתי אותיות L.',
        solution: 'll',
        check: (x) => /^ll\b/.test(x.raw) && has(x, '.treasure.txt'),
        success: 'שתי אותיות במקום שש. תכפיל בכמה פעמים ביום... ⚡',
      },
      {
        prompt: `צור alias משלך בשם **hi** שמברך אותך. למשל: \`alias hi='echo "שלום $USER! 👋"'\``,
        hint: `alias hi='echo "שלום $USER"'`,
        solution: `alias hi='echo "שלום $USER! 👋"'`,
        check: (x) => need(!!x.aliases.hi, 'צריך alias בשם hi'),
      },
      {
        prompt: 'הפעל אותו: `hi`',
        hint: 'hi',
        solution: 'hi',
        check: (x) => /^hi\b/.test(x.raw) && x.code === 0 && x.stdout.trim().length > 0,
      },
      {
        prompt: 'מה הקלדת עד עכשיו? הצג את **ההיסטוריה**.',
        hint: '`history`',
        solution: 'history',
        check: (x) => /^history\b/.test(x.cmd) && x.lines.length >= 3,
        success: 'כל פקודה שהקלדת נשמרת. בטרמינל אמיתי: Ctrl+R מחפש בתוכה. 🔎',
      },
      {
        prompt: 'הרץ שוב את הפקודה הקודמת עם הקיצור `!!`',
        hint: 'שני סימני קריאה: !!',
        solution: '!!',
        check: (x) => /!!/.test(x.raw),
        success: 'הטריק הקלאסי: שכחת sudo? כותבים sudo !! 😄',
      },
      {
        prompt: 'הצג את כל משתני הסביבה שמכילים את המילה USER (env + grep)',
        hint: '`env | grep USER`',
        solution: 'env | grep USER',
        check: (x) => /^env\s*\|\s*grep/.test(x.cmd) && has(x, 'USER'),
      },
      {
        quiz: {
          question: 'למה `NAME = דני` לא עובד?',
          options: ['בגלל הרווחים — המחשב חושב ש-NAME זו פקודה', 'כי אסור עברית', 'צריך export', 'כי NAME תפוס'],
          answer: 0,
          explain: 'בהגדרת משתנה: שם=ערך, בלי רווחים.',
        },
      },
      {
        quiz: {
          question: 'פקודה נתקעה ולא מפסיקה. מה לוחצים?',
          options: ['Ctrl+C', 'Ctrl+V', 'Ctrl+S', 'Esc'],
          answer: 0,
          explain: 'Ctrl+C = "עצור!" — עובד כמעט בכל תוכנה בטרמינל.',
        },
      },
      {
        quiz: {
          question: 'איך מחפשים פקודה ישנה בהיסטוריה?',
          options: ['Ctrl+R', 'Ctrl+F', 'Ctrl+H', 'find history'],
          answer: 0,
          explain: 'Ctrl+R ומתחילים להקליד — קסם.',
        },
      },
    ],
    drills: [
      { prompt: 'הדפס את תיקיית הבית שלך בעזרת משתנה', hint: '$HOME', solution: 'echo $HOME', check: (x) => has(x, os.homedir()) },
      { prompt: "צור alias בשם la שמריץ ls -a", hint: "alias la='ls -a'", solution: "alias la='ls -a'", check: (x) => !!x.aliases.la && /ls/.test(x.aliases.la) },
      { prompt: 'צור משתנה COLOR עם הצבע האהוב עליך', hint: 'COLOR=כחול', solution: 'COLOR=כחול', check: (x) => !!x.env.COLOR },
      { prompt: 'הדפס את ה-shell שלך (משתנה SHELL)', hint: '$SHELL', solution: 'echo $SHELL', check: (x) => /\$\{?SHELL/.test(x.cmd) && /sh/.test(x.stdout) },
    ],
    cheats: [
      ['NAME=value', 'משתנה (בלי רווחים!)'],
      ['echo $NAME', 'שימוש במשתנה'],
      ['export NAME=value', 'משתנה לתוכנות אחרות'],
      ["alias ll='ls -la'", 'קיצור'],
      ['history / !!', 'היסטוריה / שוב'],
      ['Ctrl+R / Ctrl+C / Ctrl+L', 'חיפוש / עצור / נקה'],
    ],
  },
];
