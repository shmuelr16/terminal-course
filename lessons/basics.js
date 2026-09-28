// lessons/basics.js
// רמת בסיס: מהפקודה הראשונה ועד תווים כלליים.

'use strict';

const os = require('os');
const path = require('path');
const { ran, has, need, where, firstNumber } = require('./_helpers');
const personalize = require('../lib/personalize');

const USER = os.userInfo().username;

// התיקייה ה"מעניינת" בבית של המשתמש (לשיעור הסיור)
function favFolder() {
  return personalize.pickInterestingFolder(personalize.profile());
}

module.exports = [
  // ─────────────────────────────────────────────
  {
    id: 'hello',
    level: 'בסיס',
    emoji: '👋',
    title: 'שלום, טרמינל!',
    teach: ({ progress } = {}) => `## מה זה בכלל טרמינל?
היי${progress && progress.name ? ' ' + progress.name : ''}! הטרמינל זה בעצם **צ'אט עם המחשב** 💬
אתה כותב הודעה (= **פקודה**), לוחץ Enter, והמחשב עונה. בלי עכבר, בלי כפתורים — רק מילים.
ולמה שמישהו ירצה את זה? כי מי שמדבר עם המחשב בשפה שלו — מקבל ממנו כוחות-על. 🦸

## איך נראית פקודה?
\`echo שלום\`
- המילה הראשונה (\`echo\`) היא **הפקודה** — מה לעשות.
- מה שבא אחריה (\`שלום\`) נקרא **ארגומנט** — על מה לעשות את זה.

## ארבע פקודות ראשונות
- \`pwd\` — "איפה אני?" (Print Working Directory)
- \`whoami\` — "מי אני?" (שאלה פילוסופית, תשובה טכנית 🧘)
- \`echo טקסט\` — המחשב חוזר אחריך כמו תוכי 🦜
- \`date\` — מה התאריך והשעה עכשיו

> הכל כאן קורה בתוך "ארגז חול" — תיקיית אימונים בטוחה. אי אפשר לשבור כלום. באמת. תנסה.
> נתקעת? כתוב "רמז". שכחת את ההסבר? כתוב "חזרה". צריך לצחוק? כתוב "בדיחה".`,
    tasks: [
      {
        prompt: 'בוא נתחיל: גלה **איפה אתה נמצא** עכשיו. כתוב `pwd` ולחץ Enter.',
        hint: 'פשוט תקליד שלוש אותיות: p w d ואז Enter.',
        solution: 'pwd',
        check: (x) => need(ran(x, /^pwd\b/), 'הפקודה היא pwd — שלוש אותיות באנגלית.'),
        success: 'יופי! זו "הכתובת" של התיקייה שבה אתה עומד. playground = ארגז החול שלנו 🏖️',
      },
      {
        prompt: 'עכשיו תשאל את המחשב **מי אתה**. (באנגלית: who am i — אבל הכל צמוד)',
        hint: 'whoami',
        solution: 'whoami',
        check: (x) => ran(x, /^whoami\b/) && x.stdout.trim().split(/[\\/]/).pop().toLowerCase() === USER.toLowerCase(),
        success: `נעים מאוד, ${USER}! 👋 זה שם המשתמש שלך במחשב.`,
      },
      {
        prompt: 'תגרום למחשב להגיד: `שלום עולם`',
        hint: ['משתמשים ב-echo ואחריו הטקסט.', '`echo שלום עולם`'],
        solution: 'echo שלום עולם',
        check: (x) => need(ran(x, /^echo\b/) && has(x, 'שלום עולם'), 'צריך echo ואחריו בדיוק: שלום עולם'),
      },
      {
        prompt: 'עכשיו תגרום לו להגיד **את השם שלך**.',
        hint: 'למשל: `echo דני`',
        solution: 'echo אני לומד טרמינל',
        check: (x) => ran(x, /^echo\s+\S/),
      },
      {
        prompt: 'מה השעה? תשאל את המחשב עם `date`',
        hint: 'date — "תאריך" באנגלית.',
        solution: 'date',
        check: (x) => ran(x, /^date\b/),
        success: 'עכשיו אתה יודע מה השעה. וגם שהגיע הזמן לעוד פקודה. ⏰',
      },
      {
        quiz: {
          question: 'בפקודה `echo היי` — מה זה "היי"?',
          options: ['הפקודה', 'ארגומנט — הדבר שהפקודה עובדת עליו', 'שם של תיקייה', 'שגיאה'],
          answer: 1,
          explain: 'echo היא הפקודה, "היי" הוא הארגומנט.',
        },
      },
      {
        prompt: 'טקסט עם סימנים מיוחדים שמים **בתוך מרכאות**. תגרום למחשב להגיד: `"הטרמינל שלי!"` (עם המרכאות בפקודה)',
        hint: 'שים את הטקסט בתוך מרכאות כפולות: `echo "הטרמינל שלי!"`',
        solution: 'echo "הטרמינל שלי!"',
        check: (x) => need(ran(x, /^echo\s+["']/) && has(x, 'הטרמינל שלי'), 'שים לב למרכאות: echo "הטרמינל שלי!"'),
        success: 'מרכאות "מדביקות" טקסט יחד — חשוב כשיש רווחים או סימנים כמו ! ? *',
      },
      {
        prompt: 'המסך התמלא? `clear` מנקה אותו (הלוח מחיקה של הטרמינל 🧽)',
        hint: 'clear',
        solution: 'clear',
        check: (x) => /^clear\b/.test(x.cmd),
        success: 'נקי ומבריק! (קיצור מקלדת לאותו דבר: Ctrl+L)',
      },
      {
        quiz: {
          question: 'איזו פקודה עונה על השאלה "איפה אני?"',
          options: ['whoami', 'date', 'pwd', 'echo'],
          answer: 2,
          explain: 'pwd = Print Working Directory.',
        },
      },
    ],
    drills: [
      { prompt: 'איפה אתה? (הצג את התיקייה הנוכחית)', hint: 'pwd', solution: 'pwd', check: (x) => ran(x, /^pwd\b/) },
      { prompt: 'הצג את שם המשתמש שלך', hint: 'who am i — צמוד', solution: 'whoami', check: (x) => ran(x, /^whoami\b/) },
      { prompt: 'גרום למחשב להגיד "אני אלוף"', hint: 'echo "..."', solution: 'echo "אני אלוף"', check: (x) => ran(x, /^echo\b/) && has(x, 'אני אלוף') },
    ],
    cheats: [
      ['pwd', 'איפה אני?'],
      ['whoami', 'מי אני?'],
      ['echo "טקסט"', 'מדפיס טקסט'],
      ['date', 'תאריך ושעה'],
      ['clear', 'מנקה את המסך (Ctrl+L)'],
    ],
  },

  // ─────────────────────────────────────────────
  {
    id: 'ls',
    level: 'בסיס',
    emoji: '📂',
    title: 'ls — מה יש פה?',
    teach: `## ls = להציץ למקרר 🍎
\`ls\` (קיצור של list) מראה מה יש בתיקייה שבה אתה עומד. כמו לפתוח את המקרר ולבדוק מה יש — בלי לשנות כלום.

## להציץ לתיקייה אחרת
\`ls notes\` — מציץ לתוך התיקייה notes בלי להיכנס אליה. אפשר גם כמה: \`ls notes photos\`

## דגלים (flags) = תוספות לפיצה 🍕
אפשר "לתבל" פקודה עם **דגלים** — אותיות שמתחילות במקף:
- \`ls -l\` — **l**ong: רשימה מפורטת (הרשאות, גודל, תאריך)
- \`ls -a\` — **a**ll: כולל קבצים **מוסתרים** (כאלה שמתחילים בנקודה .)
- \`ls -h\` — **h**uman: גדלים שבני אדם מבינים (K, M, G) — הולך יחד עם -l
- אפשר לחבר: \`ls -la\` זה בדיוק \`ls -l -a\` — כמו פיצה עם זיתים **וגם** פטריות.

> קבצים שמתחילים בנקודה (כמו .zshrc) מוסתרים — בדרך כלל אלה קבצי הגדרות שלא רוצים שיפריעו בעין.
> ב-ls -l: אם השורה מתחילה ב-d זו תיקייה (directory). אם במקף - זה קובץ רגיל.`,
    tasks: [
      {
        prompt: 'מה יש בארגז החול? הרץ `ls`',
        hint: 'שתי אותיות: l ו-s (L קטנה, לא I גדולה).',
        solution: 'ls',
        check: (x) => need(ran(x, /^ls\b/) && has(x, 'welcome.txt'), 'הרץ ls כשאתה בשורש ארגז החול.' + where(x)),
        success: 'הנה כל מה שיש פה. שים לב: יש קבצים (עם סיומת כמו .txt) ויש תיקיות.',
      },
      {
        prompt: 'הצץ לתוך התיקייה **notes** — בלי להיכנס אליה.',
        hint: '`ls notes`',
        solution: 'ls notes',
        check: (x) => ran(x, /^ls\b.*notes/) && has(x, 'todo.txt'),
      },
      {
        prompt: 'מה יש בתיקייה **photos**?',
        hint: '`ls` ואחריו שם התיקייה.',
        solution: 'ls photos',
        check: (x) => ran(x, /^ls\b.*photos/) && has(x, 'cat.png'),
        success: 'שלוש תמונות (מדומות 😉). חתול, חוף ושקיעה — פרופיל אינסטגרם מושלם.',
      },
      {
        prompt: 'עכשיו רשימה **מפורטת** — עם הרשאות, גדלים ותאריכים. (דגל של "long")',
        hint: ['הדגל הוא -l (L קטנה).', '`ls -l`'],
        solution: 'ls -l',
        check: (x) => need(ran(x, /^ls\s+-\w*l/) && /^[-d][rwx-]{9}/m.test(x.stdout), 'צריך ls עם הדגל -l'),
        success: 'כל שורה = פריט אחד. d בהתחלה = תיקייה, - = קובץ. המספר הגדול באמצע = גודל בבתים.',
      },
      {
        prompt: '🕵️ יש בארגז החול **קובץ מוסתר**. מצא אותו! (דגל של "all")',
        hint: ['קבצים מוסתרים מתחילים בנקודה. יש דגל שמראה את כולם.', '`ls -a`'],
        solution: 'ls -a',
        check: (x) => need(ran(x, /^ls\s+-\w*a/) && has(x, '.treasure.txt'), 'צריך ls עם הדגל -a' + where(x)),
        success: 'מצאת את האוצר הנסתר! 💎 (הקובץ .treasure.txt — הנקודה בהתחלה היא שהסתירה אותו)',
      },
      {
        quiz: {
          question: 'איך תזהה בשורה של `ls -l` שמשהו הוא **תיקייה**?',
          options: ['השורה מתחילה באות d', 'יש לו סיומת .dir', 'הוא תמיד צבוע בכחול', 'אי אפשר לדעת'],
          answer: 0,
          explain: 'd = directory = תיקייה.',
        },
      },
      {
        prompt: 'עכשיו תחבר שני דגלים: רשימה **מפורטת** + **כולל מוסתרים**, בפקודה אחת.',
        hint: ['אפשר לחבר דגלים: -l ו-a יחד.', '`ls -la`'],
        solution: 'ls -la',
        check: (x) => need(
          ran(x, /^ls\b/) && /-\w*l/.test(x.cmd) && /-\w*a/.test(x.cmd) && has(x, '.treasure.txt') && /^[-d][rwx-]{9}/m.test(x.stdout),
          'צריך גם l וגם a — למשל ls -la'
        ),
        success: 'ls -la — כנראה הפקודה שתקליד הכי הרבה פעמים בחיים שלך. 😄 (שים לב ל-. ול-.. — נכיר אותם בשיעור הבא)',
      },
      {
        prompt: 'מה יש בתוך **projects/game**? (אפשר לתת ל-ls נתיב עם /)',
        hint: '`ls projects/game`',
        solution: 'ls projects/game',
        check: (x) => ran(x, /^ls\b.*projects\/game/) && has(x, 'index.html'),
      },
      {
        prompt: 'רשימה מפורטת של **photos** עם גדלים "אנושיים" (h).',
        hint: '`ls -lh photos`',
        solution: 'ls -lh photos',
        check: (x) => need(ran(x, /^ls\s+-\w*h/) && /-\w*l/.test(x.cmd) && has(x, 'beach.jpg'), 'צריך -l וגם -h, על photos'),
      },
      {
        prompt: 'בונוס: הצץ **גם** ל-notes **וגם** ל-photos בפקודה אחת.',
        hint: '`ls notes photos`',
        solution: 'ls notes photos',
        check: (x) => ran(x, /^ls\b/) && has(x, 'todo.txt', 'cat.png'),
        success: 'הרבה פקודות מקבלות כמה ארגומנטים בבת אחת. חוסך הקלדה!',
      },
      {
        quiz: {
          question: '`ls -la` זה בדיוק כמו...',
          options: ['`ls -l -a`', '`ls -l`', '`ls --la`', '`ls la`'],
          answer: 0,
          explain: 'דגלים של אות אחת אפשר לחבר מאחורי מקף אחד.',
        },
      },
    ],
    drills: [
      { prompt: 'מה יש בתיקייה projects?', hint: 'ls ושם התיקייה', solution: 'ls projects', check: (x) => ran(x, /^ls\b/) && has(x, 'game', 'website') },
      { prompt: 'מצא את הקובץ המוסתר בארגז החול', hint: 'ls -a', solution: 'ls -a', check: (x) => ran(x, /^ls\b/) && has(x, '.treasure.txt') },
      { prompt: 'רשימה מפורטת (long) של notes', hint: 'ls -l notes', solution: 'ls -l notes', check: (x) => ran(x, /^ls\s+-\w*l/) && has(x, 'todo.txt') },
      { prompt: 'מה יש בתיקייה recipes?', hint: 'ls recipes', solution: 'ls recipes', check: (x) => ran(x, /^ls\b/) && has(x, 'pasta.txt') },
    ],
    cheats: [
      ['ls', 'מה יש פה'],
      ['ls folder', 'מה יש בתיקייה אחרת'],
      ['ls -l', 'רשימה מפורטת'],
      ['ls -a', 'כולל קבצים מוסתרים'],
      ['ls -la', 'מפורט + מוסתרים'],
      ['ls -lh', 'מפורט עם גדלים קריאים'],
    ],
  },

  // ─────────────────────────────────────────────
  {
    id: 'cd',
    level: 'בסיס',
    emoji: '🚶',
    title: 'cd — לטייל בין תיקיות',
    teach: `## תיקיות = חדרים בבית 🏠
המחשב בנוי כמו בית: תיקיות בתוך תיקיות, כמו חדרים בתוך קומות.
\`cd\` (change directory) = **ללכת** לחדר אחר.

## הצעדים הבסיסיים
- \`cd notes\` — להיכנס לתיקייה notes
- \`cd ..\` — לחזור **למעלה** לתיקייה שמעל (".." = "החדר שממנו באתי")
- \`cd projects/game\` — כמה צעדים בבת אחת
- \`cd ../website\` — עולים אחד, ואז נכנסים ל-website
- \`cd\` לבד — חוזרים הביתה מכל מקום (כאן: לשורש ארגז החול)
- \`cd -\` — חוזרים למקום **הקודם** שהיית בו (כמו כפתור "אחורה" 🔙)

## שני סוגי נתיבים
- **יחסי**: \`notes/todo.txt\` — "מהמקום שאני עומד בו"
- **מוחלט**: \`/Users/dana/notes\` — מתחיל ב-/, "כתובת מלאה" מכל מקום

> הפרומפט (השורה עם ה-$) תמיד מראה איפה אתה. ו-pwd תמיד עונה בדיוק.
> טיפ זהב לטרמינל האמיתי: מקלידים את תחילת השם ולוחצים Tab — והמחשב משלים לבד! ⚡
> שמות תיקיות רגישים לאותיות גדולות/קטנות: Notes ו-notes זה לא אותו דבר.`,
    tasks: [
      {
        prompt: 'היכנס לתיקייה **notes**.',
        hint: '`cd notes`',
        solution: 'cd notes',
        check: (x) => need(x.rel === 'notes', 'צריך להיות בתוך notes.'),
        success: 'נכנסת! שים לב איך הפרומפט השתנה ל-playground/notes',
      },
      {
        prompt: 'עכשיו כשאתה בפנים — מה יש כאן?',
        hint: 'אותה פקודה מהשיעור הקודם 😉',
        solution: 'ls',
        check: (x) => need(x.rel === 'notes' && ran(x, /^ls\b/) && has(x, 'todo.txt'), 'הרץ ls בתוך notes.'),
      },
      {
        prompt: 'תוודא איפה אתה עם `pwd`',
        hint: 'pwd',
        solution: 'pwd',
        check: (x) => ran(x, /^pwd\b/) && x.stdout.trim().endsWith('notes'),
        success: 'רואה? הנתיב המלא נגמר ב-notes.',
      },
      {
        prompt: 'חזור **למעלה** לתיקייה הקודמת (ה"הורה").',
        hint: ['שתי נקודות = למעלה.', '`cd ..` (עם רווח אחרי cd!)'],
        solution: 'cd ..',
        check: (x) => need(x.rel === '', 'צריך לחזור לשורש ארגז החול (playground).'),
      },
      {
        prompt: 'קפוץ ישר לתוך **projects/game** — בפקודה אחת.',
        hint: '`cd projects/game`',
        solution: 'cd projects/game',
        check: (x) => need(x.rel === 'projects/game', 'היעד: playground/projects/game' + where(x)),
      },
      {
        prompt: 'עכשיו עבור ל-**website**, שנמצאת ליד game (שתיהן בתוך projects). בפקודה אחת!',
        hint: ['קודם עולים אחד (..) ואז נכנסים ל-website.', '`cd ../website`'],
        solution: 'cd ../website',
        check: (x) => need(x.rel === 'projects/website', 'היעד: playground/projects/website'),
        success: 'עלית קומה ונכנסת לחדר ליד — בצעד אחד. 🧗',
      },
      {
        prompt: 'חזור לשורש ארגז החול — **שתי קומות למעלה** בבת אחת.',
        hint: '`cd ../..`',
        solution: 'cd ../..',
        check: (x) => need(x.rel === '', 'צריך להגיע ל-playground.'),
      },
      {
        prompt: 'היכנס ל-**photos**.',
        hint: '`cd photos`',
        solution: 'cd photos',
        check: (x) => need(x.rel === 'photos', 'היעד: playground/photos'),
      },
      {
        prompt: 'עכשיו תשתמש בכפתור "אחורה" 🔙 — חזור למקום **הקודם** שהיית בו.',
        hint: '`cd -` (cd, רווח, מקף)',
        solution: 'cd -',
        check: (x) => need(/^cd\s+-$/.test(x.cmd) && x.rel === '', 'הפקודה היא cd -'),
        success: 'cd - זה אחד הקיצורים הכי שימושיים. קופצים בין שני מקומות הלוך-חזור.',
      },
      {
        prompt: 'צלול עמוק: **projects/website**.',
        hint: '`cd projects/website`',
        solution: 'cd projects/website',
        check: (x) => need(x.rel === 'projects/website', 'היעד: playground/projects/website' + where(x)),
      },
      {
        prompt: 'ועכשיו הקיצור הכי מהיר הביתה — `cd` **לבד**, בלי כלום אחריו.',
        hint: 'רק שתי אותיות: cd',
        solution: 'cd',
        check: (x) => need(/^cd\s*$/.test(x.cmd) && x.rel === '', 'רק cd לבד.'),
        success: 'בבית! 🏠 בטרמינל רגיל cd לבד מחזיר לתיקיית הבית שלך (~).',
      },
      {
        quiz: {
          question: 'אתה ב-`projects/game`. לאן תגיע עם `cd ../website`?',
          options: ['projects/website', 'website (בשורש)', 'game/website', 'שגיאה'],
          answer: 0,
          explain: '.. מעלה אותך ל-projects, ומשם נכנסים ל-website.',
        },
      },
      {
        quiz: {
          question: 'מה זה `..`?',
          options: ['התיקייה שמעל (ההורה)', 'התיקייה הנוכחית', 'כל התיקיות', 'קובץ מוסתר'],
          answer: 0,
          explain: 'ואחות קטנה שלה: . (נקודה אחת) = התיקייה הנוכחית.',
        },
      },
    ],
    drills: [
      { prompt: 'היכנס לתיקייה projects/website', hint: 'cd ונתיב עם /', solution: 'cd projects/website', check: (x) => x.rel === 'projects/website' },
      { prompt: 'היכנס לתיקייה recipes', hint: 'cd recipes', solution: 'cd recipes', check: (x) => x.rel === 'recipes' },
      { prompt: 'היכנס ל-projects/game (בפקודה אחת)', hint: 'cd projects/game', solution: 'cd projects/game', check: (x) => x.rel === 'projects/game' },
      { prompt: 'היכנס ל-logs', hint: 'cd logs', solution: 'cd logs', check: (x) => x.rel === 'logs' },
    ],
    cheats: [
      ['cd folder', 'להיכנס לתיקייה'],
      ['cd ..', 'לעלות תיקייה אחת'],
      ['cd ../..', 'לעלות שתיים'],
      ['cd', 'הביתה'],
      ['cd -', 'חזרה למקום הקודם'],
      ['Tab', 'השלמה אוטומטית של שמות'],
    ],
  },

  // ─────────────────────────────────────────────
  {
    id: 'explore',
    level: 'בסיס',
    emoji: '🗺️',
    title: 'סיור במחשב שלך',
    mode: 'explore',
    teach: () => {
      const p = personalize.profile();
      const fav = favFolder();
      const some = p.homeFolders.slice(0, 8).join(', ');
      const zsh = /zsh$/.test(p.shell) ? ' (zsh — ברירת המחדל במק החדשים)' : '';
      const mac = p.platform === 'darwin';
      return `## יוצאים מארגז החול! 🚀
עד עכשיו התאמנו בארגז חול. עכשיו מטיילים ב**מחשב האמיתי שלך** (${personalize.platformName(p.platform)}) — במצב **קריאה בלבד** 🔒.
כמו מוזיאון: מסתכלים על הכל, לא נוגעים בכלום.

## מה אני רואה אצלך 👀
- שם המשתמש: **${p.username}**
- תיקיית הבית: \`${p.home}\`
- יש בה ${p.homeFolders.length} תיקיות ו-${p.homeFiles.length} קבצים (לא כולל מוסתרים)
${some ? `- למשל: ${some}` : ''}
- ה-shell שלך: \`${p.shell}\`${zsh}
${fav ? `- התיקייה שנבקר בה: **${fav}**` : ''}

## שני סימנים שחייבים להכיר
- \`~\` (טילדה) = **הבית שלך**. \`cd ~\` מחזיר הביתה מכל מקום. \`~/${fav || 'Desktop'}\` = תיקייה בתוך הבית.
- \`/\` = **השורש** של כל הדיסק — "קומת הקרקע" של כל המחשב. נתיב שמתחיל ב-/ הוא כתובת מלאה.

## תיקיות שכדאי להכיר
- Desktop — שולחן העבודה 🖥️ · Documents — מסמכים 📄 · Downloads — הורדות ⬇️
${mac ? '- /Applications — כל האפליקציות שלך 📱' : '- /usr/bin — המון תוכנות של המערכת'}

> ${mac ? 'macOS עשוי לשאול "לאפשר לטרמינל גישה ל-Documents/Desktop?" — זה נורמלי, זה המק ששומר עליך.' : 'הכל כאן קריאה בלבד.'}`;
    },
    tasks: [
      {
        prompt: 'איפה אתה עכשיו? (שים לב: זה כבר המחשב האמיתי!)',
        hint: 'pwd',
        solution: 'pwd',
        check: (x) => ran(x, /^pwd\b/) && x.samePath(x.stdout.trim(), x.home),
        success: 'אתה בבית! זה הנתיב המלא של תיקיית הבית שלך.',
      },
      {
        prompt: 'מה יש בבית שלך?',
        hint: 'ls',
        solution: 'ls',
        check: (x) => ran(x, /^ls\b/),
        success: () => {
          const fav = favFolder();
          return fav ? `הנה החדרים בבית שלך. אני רואה שם את ${fav} — נבקר שם עוד רגע.` : 'הנה מה שיש בבית שלך.';
        },
      },
      {
        prompt: () => `היכנס לתיקייה **${favFolder()}**.`,
        hint: () => `\`cd ${favFolder()}\``,
        solution: () => `cd ${favFolder()}`,
        skipIf: () => !favFolder(),
        check: (x) => need(x.cwd === path.join(x.home, favFolder()), `היעד: ~/${favFolder()}`),
      },
      {
        prompt: 'רשימה מפורטת של מה שיש כאן, כולל מוסתרים.',
        hint: 'ls -la',
        solution: 'ls -la',
        check: (x) => ran(x, /^ls\s+-\w*/) && /-\w*l/.test(x.cmd) && /^[-dl][rwx-]{9}/m.test(x.stdout),
      },
      {
        prompt: 'חזור הביתה בעזרת **הטילדה** `~`',
        hint: '`cd ~`',
        solution: 'cd ~',
        check: (x) => need(x.cwd === x.home, 'היעד: הבית (~).'),
        success: 'cd ~ ו-cd לבד עושים אותו דבר — חוזרים הביתה.',
      },
      {
        prompt: 'הצץ ל**שורש** של כל הדיסק — קומת הקרקע של המחשב.',
        hint: ['השורש הוא /', '`ls /`'],
        solution: 'ls /',
        check: (x) => need(ran(x, /^ls\s+(-\w+\s+)?\/\s*$/) && (has(x, 'Users') || has(x, 'usr') || has(x, 'home')), 'צריך ls /'),
        success: 'זה שורש המחשב. Users = איפה שהבית שלך גר, usr/bin = המון תוכנות, System = לב מערכת ההפעלה.',
      },
      {
        prompt: () => (process.platform === 'darwin'
          ? 'איזה אפליקציות יש לך? הצץ ל-`/Applications`'
          : 'הצץ לתיקיית התוכנות `/usr/bin`'),
        hint: () => (process.platform === 'darwin' ? '`ls /Applications`' : '`ls /usr/bin`'),
        solution: () => (process.platform === 'darwin' ? 'ls /Applications' : 'ls /usr/bin'),
        check: (x) => ran(x, /^ls\b.*\/(Applications|usr\/bin)/),
        success: 'כל אפליקציה שאתה לוחץ עליה בעכבר — גרה בתיקייה. הטרמינל פשוט רואה את זה ישירות.',
      },
      {
        prompt: () => `הצץ לתוך **${favFolder()}** בלי להיכנס — בעזרת נתיב שמתחיל ב-~`,
        hint: () => `\`ls ~/${favFolder()}\``,
        solution: () => `ls ~/${favFolder()}`,
        skipIf: () => !favFolder(),
        check: (x) => need(ran(x, /^ls\b.*~\//), 'צריך נתיב שמתחיל ב-~/'),
        success: 'עם ~ אפשר להגיע לכל מקום בבית מכל מקום במחשב. 🧭',
      },
      {
        quiz: {
          question: 'מה המשמעות של `~` ?',
          options: ['תיקיית הבית שלך', 'השורש של הדיסק', 'התיקייה הקודמת', 'סל המחזור'],
          answer: 0,
          explain: '~ = הבית. / = השורש.',
        },
      },
      {
        quiz: {
          question: 'איזה נתיב הוא **מוחלט**?',
          options: ['`/Users/dana/code`', '`code/app`', '`../notes`', '`notes`'],
          answer: 0,
          explain: 'נתיב מוחלט מתחיל ב-/ ועובד מכל מקום.',
        },
      },
    ],
    drills: [],
    cheats: [
      ['~', 'תיקיית הבית'],
      ['/', 'שורש הדיסק'],
      ['cd ~', 'חזרה הביתה'],
      ['ls ~/Desktop', 'הצצה לתיקייה בבית'],
    ],
  },

  // ─────────────────────────────────────────────
  {
    id: 'read',
    level: 'בסיס',
    emoji: '📖',
    title: 'לקרוא קבצים: cat, head, tail, wc',
    teach: `## cat — להציג קובץ שלם 🐈
\`cat welcome.txt\` מציג את כל התוכן. (cat = concatenate = "לשרשר" — לא חתול. אבל גם חתול זה בסדר.)
אפשר כמה קבצים: \`cat a.txt b.txt\` — מדביק אותם אחד אחרי השני.

## head ו-tail — ראש וזנב 🐍
- \`head file\` — 10 השורות **הראשונות**
- \`tail file\` — 10 השורות **האחרונות**
- \`head -n 3 file\` — רק 3 ראשונות (n = number)
> tail מעולה ללוגים: האירועים החדשים תמיד בסוף.

## wc — לספור 🔢
- \`wc -l file\` — כמה **שורות** (lines)
- \`wc -w file\` — כמה **מילים** (words)

## less — לקבצים ענקיים
\`less bigfile\` פותח קובץ לגלילה: חצים/רווח לגלול, / לחפש, **q ליציאה**.
> בתוך הקורס less לא רץ (הוא מסך מלא) — אבל תנסה אותו בטרמינל רגיל!`,
    tasks: [
      {
        prompt: 'הצג את כל התוכן של **welcome.txt**',
        hint: '`cat welcome.txt`',
        solution: 'cat welcome.txt',
        check: (x) => need(ran(x, /^cat\b/) && has(x, 'ארגז החול'), 'cat ואחריו שם הקובץ.' + where(x)),
      },
      {
        prompt: 'מה כתוב ברשימת המשימות **notes/todo.txt**?',
        hint: '`cat notes/todo.txt`',
        solution: 'cat notes/todo.txt',
        check: (x) => ran(x, /^cat\b/) && has(x, 'קפה'),
        success: 'משימה 3: לשתות קפה. סדרי עדיפויות נכונים. ☕',
      },
      {
        prompt: 'הצג את **שני** הקבצים שבתוך notes (todo.txt ו-ideas.md) בפקודה אחת.',
        hint: '`cat notes/todo.txt notes/ideas.md`',
        solution: 'cat notes/todo.txt notes/ideas.md',
        check: (x) => ran(x, /^cat\b/) && has(x, 'קפה', 'רעיונות'),
        success: 'זה ה"שרשור" ש-cat קיבל עליו את השם.',
      },
      {
        prompt: 'הצג רק את **2 השורות הראשונות** של diary.txt',
        hint: ['head עם -n ומספר.', '`head -n 2 diary.txt`'],
        solution: 'head -n 2 diary.txt',
        check: (x) => need(ran(x, /^head\b/) && x.lines.length === 2 && has(x, 'יום ראשון'), 'בדיוק 2 שורות, מההתחלה.'),
      },
      {
        prompt: 'הצג רק את **השורה האחרונה** של diary.txt',
        hint: '`tail -n 1 diary.txt`',
        solution: 'tail -n 1 diary.txt',
        check: (x) => need(ran(x, /^tail\b/) && x.lines.length === 1 && has(x, 'יום שלישי'), 'בדיוק שורה אחת, מהסוף.'),
      },
      {
        prompt: 'כמה **שורות** יש בקובץ shopping.csv?',
        hint: '`wc -l shopping.csv`',
        solution: 'wc -l shopping.csv',
        check: (x) => ran(x, /^wc\b.*-l/) && firstNumber(x) === 4,
        success: '4 שורות: כותרת + 3 מוצרים.',
      },
      {
        prompt: 'יש לוג של שרת ב-**logs/app.log**. הצג את **3 השורות הראשונות** שלו.',
        hint: '`head -n 3 logs/app.log`',
        solution: 'head -n 3 logs/app.log',
        check: (x) => ran(x, /^head\b/) && x.lines.length === 3 && has(x, 'server started'),
      },
      {
        prompt: 'ועכשיו **3 האחרונות** של הלוג — מה קרה לאחרונה בשרת?',
        hint: '`tail -n 3 logs/app.log`',
        solution: 'tail -n 3 logs/app.log',
        check: (x) => ran(x, /^tail\b/) && x.lines.length === 3 && has(x, 'backup completed'),
        success: 'ככה מתכנתים בודקים מה קרה בשרת: tail על הלוג. 🕵️',
      },
      {
        prompt: 'זוכר את האוצר המוסתר מהשיעור על ls? **קרא** מה כתוב בו.',
        hint: 'שם הקובץ: .treasure.txt (עם הנקודה!)',
        solution: 'cat .treasure.txt',
        check: (x) => ran(x, /^cat\b/) && has(x, 'אוצר'),
      },
      {
        prompt: 'כמה **מילים** יש ב-diary.txt?',
        hint: '`wc -w diary.txt`',
        solution: 'wc -w diary.txt',
        check: (x) => ran(x, /^wc\b.*-w/) && firstNumber(x) > 0,
      },
      {
        quiz: {
          question: 'פתחת קובץ עם `less` ואתה רוצה לצאת. מה לוחצים?',
          options: ['q', 'Esc', 'Ctrl+Z', 'כותבים exit'],
          answer: 0,
          explain: 'q = quit. אותו דבר ב-man וב-top.',
        },
      },
      {
        quiz: {
          question: 'מה יציג `tail app.log` (בלי -n)?',
          options: ['10 השורות האחרונות', 'השורה האחרונה', 'את כל הקובץ', 'שגיאה'],
          answer: 0,
          explain: 'ברירת המחדל של head ושל tail היא 10 שורות.',
        },
      },
    ],
    drills: [
      { prompt: 'הצג את השורה הראשונה של names.txt', hint: 'head -n 1', solution: 'head -n 1 names.txt', check: (x) => ran(x, /^head\b/) && x.lines.length === 1 && has(x, 'דני') },
      { prompt: 'כמה שורות יש ב-names.txt?', hint: 'wc -l', solution: 'wc -l names.txt', check: (x) => ran(x, /^wc\b/) && firstNumber(x) === 10 },
      { prompt: 'הצג את המתכון recipes/cake.txt', hint: 'cat', solution: 'cat recipes/cake.txt', check: (x) => ran(x, /^cat\b/) && has(x, 'שוקולד') },
      { prompt: 'הצג את 2 השורות האחרונות של numbers.txt', hint: 'tail -n 2', solution: 'tail -n 2 numbers.txt', check: (x) => ran(x, /^tail\b/) && x.lines.length === 2 && has(x, '56') },
    ],
    cheats: [
      ['cat file', 'הצג קובץ שלם'],
      ['head -n 5 file', '5 שורות ראשונות'],
      ['tail -n 5 file', '5 שורות אחרונות'],
      ['wc -l file', 'כמה שורות'],
      ['less file', 'גלילה בקובץ גדול (q ליציאה)'],
    ],
  },

  // ─────────────────────────────────────────────
  {
    id: 'create',
    level: 'בסיס',
    emoji: '🏗️',
    title: 'ליצור: mkdir, touch, echo >',
    teach: `## mkdir — תיקייה חדשה 📁
- \`mkdir music\` — יוצר תיקייה (make directory)
- \`mkdir games movies books\` — כמה בבת אחת
- \`mkdir -p school/2026/math\` — כל השרשרת בפעם אחת (p = parents), גם אם הביניים לא קיימים

## touch — קובץ ריק 📄
\`touch notes.txt\` — יוצר קובץ ריק. כמו להניח דף חלק על השולחן.

## echo + > — לכתוב לתוך קובץ ✍️
- \`echo "שלום" > hi.txt\` — כותב לקובץ. **זהירות: > דורס את מה שהיה!** 💥
- \`echo "עוד שורה" >> hi.txt\` — >> **מוסיף** לסוף, בלי למחוק.
> זוכרים ככה: חץ אחד = מחליף הכל. שני חצים = מוסיף עוד.

## שמות עם רווחים
\`touch "my file.txt"\` — עם מרכאות. בלי מרכאות, המחשב חושב שאלה שני קבצים: my ו-file.txt.
> טיפ של מקצוענים: בשמות קבצים משתמשים ב-מקף או_קו_תחתון במקום רווחים. חוסך כאב ראש.`,
    tasks: [
      {
        prompt: 'צור תיקייה חדשה בשם **music**.',
        hint: '`mkdir music`',
        solution: 'mkdir music',
        check: (x) => need(x.rootIsDir('music'), 'לא מצאתי את playground/music.' + where(x)),
      },
      {
        prompt: 'צור קובץ ריק בשם **playlist.txt** בתוך music.',
        hint: '`touch music/playlist.txt`',
        solution: 'touch music/playlist.txt',
        check: (x) => need(x.rootExists('music/playlist.txt'), 'לא מצאתי את music/playlist.txt' + where(x)),
      },
      {
        prompt: 'תוודא שהקובץ באמת שם — הצץ לתוך music.',
        hint: '`ls music`',
        solution: 'ls music',
        check: (x) => ran(x, /^ls\b/) && has(x, 'playlist.txt'),
      },
      {
        prompt: 'כתוב את השיר הראשון לתוך הפלייליסט: `echo "שיר ראשון" > music/playlist.txt` (או שיר שאתה אוהב 🎵)',
        hint: 'echo "שם השיר" > music/playlist.txt',
        solution: 'echo "שיר ראשון" > music/playlist.txt',
        check: (x) => {
          const t = x.rootRead('music/playlist.txt');
          return need(t && t.trim().length > 0, 'הקובץ music/playlist.txt עדיין ריק.' + where(x));
        },
      },
      {
        prompt: 'עכשיו **הוסף** שיר שני — בלי למחוק את הראשון! (שני חצים)',
        hint: ['> מוחק, >> מוסיף.', 'echo "שיר שני" >> music/playlist.txt'],
        solution: 'echo "שיר שני" >> music/playlist.txt',
        check: (x) => {
          const t = x.rootRead('music/playlist.txt') || '';
          if (/>>/.test(x.cmd) && t.trim().split('\n').length >= 2) return true;
          if (/[^>]>[^>]/.test(x.cmd)) return { ok: false, msg: 'אופס — חץ אחד דרס את השיר הראשון! 😅 זה בדיוק למה צריך >>. כתוב שוב שיר עם > ואז הוסף עם >>.' };
          return { ok: false, msg: 'צריך >> כדי להוסיף שורה.' };
        },
      },
      {
        prompt: 'הצג את הפלייליסט — שני השירים צריכים להיות שם.',
        hint: '`cat music/playlist.txt`',
        solution: 'cat music/playlist.txt',
        check: (x) => ran(x, /^cat\b/) && x.lines.length >= 2,
        success: '🎶 הפלייליסט מוכן. Spotify רועדים.',
      },
      {
        prompt: 'צור בפקודה **אחת** את כל השרשרת **school/2026/math**',
        hint: ['mkdir רגיל ייכשל כי school לא קיימת. יש דגל ל"צור גם את ההורים".', '`mkdir -p school/2026/math`'],
        solution: 'mkdir -p school/2026/math',
        check: (x) => need(x.rootIsDir('school/2026/math'), 'לא מצאתי את school/2026/math' + where(x)),
        success: '-p יוצר את כל מה שחסר בדרך. בלי תלונות.',
      },
      {
        prompt: 'צור **שלוש** תיקיות בפקודה אחת: games, movies, books',
        hint: '`mkdir games movies books`',
        solution: 'mkdir games movies books',
        check: (x) => need(['games', 'movies', 'books'].every((d) => x.rootIsDir(d)), 'צריך את שלושתן: games movies books' + where(x)),
      },
      {
        prompt: 'צור קובץ בשם **"my file.txt"** — כן, עם רווח בשם.',
        hint: ['בלי מרכאות זה ייצור שני קבצים!', '`touch "my file.txt"`'],
        solution: 'touch "my file.txt"',
        check: (x) => {
          if (x.rootExists('my file.txt')) return true;
          if (x.rootExists('my') && x.rootExists('file.txt')) return { ok: false, msg: 'נוצרו שני קבצים: my ו-file.txt 😄 זה מה שקורה בלי מרכאות. נסה שוב עם "..."' };
          return { ok: false, msg: 'לא מצאתי קובץ בשם "my file.txt"' + where(x) };
        },
      },
      {
        prompt: 'צור קובץ **greeting.txt** עם הטקסט "בוקר טוב" — בפקודה אחת.',
        hint: 'echo "בוקר טוב" > greeting.txt',
        solution: 'echo "בוקר טוב" > greeting.txt',
        check: (x) => need((x.rootRead('greeting.txt') || '').includes('בוקר טוב'), 'greeting.txt צריך להכיל "בוקר טוב"' + where(x)),
      },
      {
        quiz: {
          question: 'מה ההבדל בין `>` ל-`>>`?',
          options: ['> דורס את הקובץ, >> מוסיף לסוף', 'אין הבדל', '> מוסיף, >> דורס', '>> זו שגיאת הקלדה'],
          answer: 0,
          explain: 'חץ אחד מחליף, שניים מוסיפים.',
        },
      },
    ],
    drills: [
      { prompt: 'צור תיקייה בשם archive', hint: 'mkdir', solution: 'mkdir archive', check: (x) => x.rootIsDir('archive') },
      { prompt: 'צור קובץ ריק בשם new.txt בתוך notes', hint: 'touch notes/new.txt', solution: 'touch notes/new.txt', check: (x) => x.rootExists('notes/new.txt') },
      { prompt: 'צור בפקודה אחת את השרשרת a/b/c', hint: 'mkdir -p', solution: 'mkdir -p a/b/c', check: (x) => x.rootIsDir('a/b/c') },
      { prompt: 'כתוב "היי" לתוך קובץ חדש בשם hi.txt', hint: 'echo ... > hi.txt', solution: 'echo היי > hi.txt', check: (x) => (x.rootRead('hi.txt') || '').includes('היי') },
      { prompt: 'הוסף את השורה "- לנוח" לסוף notes/todo.txt (בלי למחוק!)', hint: '>>', solution: 'echo "- לנוח" >> notes/todo.txt', check: (x) => { const t = x.rootRead('notes/todo.txt') || ''; return t.includes('קפה') && t.includes('לנוח'); } },
    ],
    cheats: [
      ['mkdir name', 'תיקייה חדשה'],
      ['mkdir -p a/b/c', 'שרשרת תיקיות'],
      ['touch file', 'קובץ ריק'],
      ['echo "x" > file', 'כתיבה (דורס!)'],
      ['echo "x" >> file', 'הוספה לסוף'],
    ],
  },

  // ─────────────────────────────────────────────
  {
    id: 'cp-mv-rm',
    level: 'בסיס',
    emoji: '✂️',
    title: 'להעתיק, להזיז, למחוק',
    teach: `## cp — העתקה 📋
- \`cp diary.txt backup.txt\` — העתק (מקור ← יעד)
- \`cp photo.png notes/\` — העתק לתוך תיקייה (משאיר את השם)
- \`cp -r folder folder2\` — להעתיק **תיקייה** שלמה צריך -r (recursive = "עם כל מה שבפנים")

## mv — הזזה **וגם** שינוי שם 🚚
לטרמינל אין פקודת "שנה שם" — כי שינוי שם זה בעצם להזיז קובץ לכתובת חדשה!
- \`mv old.txt new.txt\` — שינוי שם
- \`mv file.txt notes/\` — הזזה לתיקייה
- \`mv\` עובד גם על תיקיות, בלי -r

## rm — מחיקה 🗑️
- \`rm file.txt\` — מוחק קובץ
- \`rm -r folder\` — מוחק תיקייה עם כל מה שבתוכה
- \`rmdir folder\` — מוחק רק תיקייה **ריקה** (בטוח יותר)

> ⚠️ אין סל מחזור בטרמינל! rm = נעלם לתמיד. אין "בטל". אין "אופס". רק שקט. 😶
> לכן מקצוענים בודקים עם ls **לפני** שמוחקים. (ובקורס — הכל בארגז חול, אז תמחק בלב שלם.)`,
    tasks: [
      {
        prompt: 'צור גיבוי: העתק את **diary.txt** לקובץ חדש בשם **diary-backup.txt**',
        hint: '`cp diary.txt diary-backup.txt`',
        solution: 'cp diary.txt diary-backup.txt',
        check: (x) => need(x.rootExists('diary-backup.txt') && x.rootRead('diary-backup.txt') === x.rootRead('diary.txt'), 'לא מצאתי העתק זהה בשם diary-backup.txt' + where(x)),
        success: 'גיבוי! הדבר הכי משעמם והכי חשוב בעולם המחשבים. 💾',
      },
      {
        prompt: 'הזז את **diary-backup.txt** לתוך התיקייה **notes**.',
        hint: '`mv diary-backup.txt notes/`',
        solution: 'mv diary-backup.txt notes/',
        check: (x) => need(x.rootExists('notes/diary-backup.txt') && !x.rootExists('diary-backup.txt'), 'הקובץ צריך לעבור לתוך notes (ולא להישאר בחוץ).'),
      },
      {
        prompt: 'שנה את השם של **secret.txt** ל-**top-secret.txt** 🤫',
        hint: ['שינוי שם = mv.', '`mv secret.txt top-secret.txt`'],
        solution: 'mv secret.txt top-secret.txt',
        check: (x) => need(x.rootExists('top-secret.txt') && !x.rootExists('secret.txt'), 'צריך ש-secret.txt ייקרא עכשיו top-secret.txt'),
        success: 'סודי ביותר. 🕶️',
      },
      {
        prompt: 'העתק את התמונה **photos/cat.png** לתוך **notes** (בלי לשנות שם).',
        hint: '`cp photos/cat.png notes/`',
        solution: 'cp photos/cat.png notes/',
        check: (x) => need(x.rootExists('notes/cat.png') && x.rootExists('photos/cat.png'), 'צריך עותק ב-notes/cat.png (והמקור נשאר).'),
      },
      {
        prompt: 'העתק את **כל התיקייה** projects/game לתיקייה חדשה **projects/game-copy**',
        hint: ['להעתקת תיקייה צריך דגל מיוחד.', '`cp -r projects/game projects/game-copy`'],
        solution: 'cp -r projects/game projects/game-copy',
        check: (x) => need(x.rootExists('projects/game-copy/index.html'), 'לא מצאתי את projects/game-copy/index.html'),
      },
      {
        prompt: 'נקה זבל: מחק את **old-stuff/trash1.tmp**',
        hint: '`rm old-stuff/trash1.tmp`',
        solution: 'rm old-stuff/trash1.tmp',
        check: (x) => need(!x.rootExists('old-stuff/trash1.tmp') && x.rootExists('old-stuff/keep.txt'), 'צריך למחוק רק את trash1.tmp.'),
        success: 'נמחק. לתמיד. 🪦 (בארגז חול זה בסדר גמור)',
      },
      {
        prompt: 'מחק גם את **old-stuff/trash2.tmp**',
        hint: 'rm ...',
        solution: 'rm old-stuff/trash2.tmp',
        check: (x) => need(!x.rootExists('old-stuff/trash2.tmp') && x.rootExists('old-stuff/keep.txt'), 'צריך למחוק את trash2.tmp (ולהשאיר את keep.txt).'),
      },
      {
        prompt: 'מחק את התיקייה **projects/game-copy** — עם כל מה שבתוכה.',
        hint: ['rm רגיל לא מוחק תיקיות.', '`rm -r projects/game-copy`'],
        solution: 'rm -r projects/game-copy',
        check: (x) => need(!x.rootExists('projects/game-copy') && x.rootExists('projects/game/index.html'), 'צריך למחוק את game-copy (ולא את game המקורי!).'),
      },
      {
        prompt: 'צור תיקייה ריקה **empty-box** ואז... לא, רגע. פשוט צור אותה. 📦',
        hint: 'mkdir empty-box',
        solution: 'mkdir empty-box',
        check: (x) => x.rootIsDir('empty-box'),
      },
      {
        prompt: 'עכשיו מחק אותה עם הפקודה ה**בטוחה** שמוחקת רק תיקיות ריקות.',
        hint: '`rmdir empty-box`',
        solution: 'rmdir empty-box',
        check: (x) => need(/^rmdir\b/.test(x.cmd) && !x.rootExists('empty-box'), 'השתמש ב-rmdir.'),
        success: 'rmdir מסרב למחוק תיקייה שיש בה משהו — רשת ביטחון נחמדה.',
      },
      {
        prompt: 'שנה את השם של **התיקייה** photos ל-**pictures**',
        hint: 'mv עובד גם על תיקיות: `mv photos pictures`',
        solution: 'mv photos pictures',
        check: (x) => need(x.rootIsDir('pictures') && !x.rootExists('photos'), 'צריך שהתיקייה תיקרא pictures.'),
      },
      {
        quiz: {
          question: 'לאן הולך קובץ שמחקת עם `rm`?',
          options: ['לשום מקום — הוא נמחק לצמיתות', 'לסל המחזור', 'לתיקייה מוסתרת', 'לענן'],
          answer: 0,
          explain: 'לכן בודקים פעמיים. ואז עוד פעם. 😅',
        },
      },
      {
        quiz: {
          question: 'איך משנים שם של קובץ?',
          options: ['`mv old new`', '`rename old new`', '`cp old new`', '`rn old new`'],
          answer: 0,
          explain: 'mv = move. שינוי שם = הזזה לכתובת חדשה.',
        },
      },
    ],
    drills: [
      { prompt: 'העתק את welcome.txt לקובץ בשם welcome-copy.txt', hint: 'cp מקור יעד', solution: 'cp welcome.txt welcome-copy.txt', check: (x) => x.rootExists('welcome-copy.txt') && x.rootExists('welcome.txt') },
      { prompt: 'שנה את השם של numbers.txt ל-nums.txt', hint: 'mv', solution: 'mv numbers.txt nums.txt', check: (x) => x.rootExists('nums.txt') && !x.rootExists('numbers.txt') },
      { prompt: 'מחק את old-stuff/keep.txt (סליחה keep 😢)', hint: 'rm', solution: 'rm old-stuff/keep.txt', check: (x) => !x.rootExists('old-stuff/keep.txt') },
      { prompt: 'העתק את כל התיקייה recipes לתיקייה חדשה recipes2', hint: 'cp -r', solution: 'cp -r recipes recipes2', check: (x) => x.rootExists('recipes2/cake.txt') },
      { prompt: 'הזז את names.txt לתוך notes', hint: 'mv file folder/', solution: 'mv names.txt notes/', check: (x) => x.rootExists('notes/names.txt') && !x.rootExists('names.txt') },
      { prompt: 'מחק את התיקייה old-stuff עם כל מה שבתוכה', hint: 'rm -r', solution: 'rm -r old-stuff', check: (x) => !x.rootExists('old-stuff') },
    ],
    cheats: [
      ['cp a b', 'העתקה'],
      ['cp -r dir1 dir2', 'העתקת תיקייה'],
      ['mv a b', 'הזזה / שינוי שם'],
      ['rm file', 'מחיקה (לתמיד!)'],
      ['rm -r dir', 'מחיקת תיקייה'],
      ['rmdir dir', 'מחיקת תיקייה ריקה'],
    ],
  },

  // ─────────────────────────────────────────────
  {
    id: 'wildcards',
    level: 'בסיס',
    emoji: '🃏',
    title: 'תווים כלליים: * ? {}',
    teach: `## * = הג'וקר 🃏
הכוכבית אומרת "כל דבר, בכל אורך". המחשב מחליף אותה ברשימת הקבצים שמתאימים:
- \`ls *.jpg\` — כל מה שנגמר ב-.jpg
- \`ls photos/*\` — כל מה שבתוך photos
- \`rm *.tmp\` — מוחק את כל קבצי ה-.tmp בבת אחת 💥

## ? = תו אחד בדיוק
\`ls day?.txt\` — יתאים ל-day1.txt, day7.txt, אבל **לא** ל-day10.txt

## {} = מכונת שכפול 🖨️
- \`touch day{1..5}.txt\` — יוצר day1.txt עד day5.txt
- \`mkdir -p trip/{photos,videos,notes}\` — שלוש תיקיות בבת אחת

> טיפ בטיחות של מקצוענים: לפני \`rm *.tmp\`, תריץ \`echo *.tmp\` — זה מראה בדיוק מה יימחק, בלי למחוק כלום. 🛡️
> ה-* לא תופס קבצים מוסתרים (שמתחילים בנקודה) — וזה לטובה.`,
    tasks: [
      {
        prompt: 'הצג רק את התמונות מסוג **jpg** שבתוך photos.',
        hint: '`ls photos/*.jpg`',
        solution: 'ls photos/*.jpg',
        check: (x) => need(ran(x, /^ls\b.*\*/) && has(x, 'beach.jpg', 'sunset.jpg') && !has(x, 'cat.png'), 'צריך רק jpg — בלי ה-png.'),
        success: 'החתול (png) נשאר בחוץ. 🐈 לא נעלב.',
      },
      {
        prompt: 'הצג את כל קבצי ה-**.txt** בשורש ארגז החול.',
        hint: '`ls *.txt`',
        solution: 'ls *.txt',
        check: (x) => need(ran(x, /^ls\b.*\*/) && has(x, 'welcome.txt', 'diary.txt') && !has(x, 'shopping.csv'), 'רק קבצים שנגמרים ב-.txt' + where(x)),
      },
      {
        prompt: 'הצג את כל המתכונים ב-recipes שמתחילים באות **s**',
        hint: '`ls recipes/s*`',
        solution: 'ls recipes/s*',
        check: (x) => ran(x, /^ls\b.*\*/) && has(x, 'shakshuka.txt') && !has(x, 'pasta.txt'),
      },
      {
        prompt: '🛡️ לפני מחיקה — **תצוגה מקדימה**: הדפס עם echo אילו קבצי .tmp יש ב-old-stuff',
        hint: '`echo old-stuff/*.tmp`',
        solution: 'echo old-stuff/*.tmp',
        check: (x) => ran(x, /^echo\b.*\*/) && has(x, 'trash1.tmp', 'trash2.tmp'),
        success: 'עכשיו אתה יודע בדיוק מה יימחק. זה נקרא להיות מקצוען. 😎',
      },
      {
        prompt: 'עכשיו מחק את **כל** קבצי ה-.tmp ב-old-stuff בפקודה אחת.',
        hint: '`rm old-stuff/*.tmp`',
        solution: 'rm old-stuff/*.tmp',
        check: (x) => need(!x.rootList('old-stuff').some((f) => f.endsWith('.tmp')) && x.rootExists('old-stuff/keep.txt'), 'צריך למחוק את כל ה-.tmp ולהשאיר את keep.txt.'),
      },
      {
        prompt: 'צור תיקייה בשם **backup**',
        hint: 'mkdir backup',
        solution: 'mkdir backup',
        check: (x) => x.rootIsDir('backup'),
      },
      {
        prompt: 'העתק את **כל קבצי ה-.txt** מהשורש לתוך backup — בפקודה אחת.',
        hint: '`cp *.txt backup/`',
        solution: 'cp *.txt backup/',
        check: (x) => need(['welcome.txt', 'diary.txt', 'names.txt'].every((f) => x.rootExists('backup/' + f)), 'ב-backup צריכים להיות כל קבצי ה-txt מהשורש.' + where(x)),
      },
      {
        prompt: 'צור תיקייה **week**',
        hint: 'mkdir week',
        solution: 'mkdir week',
        check: (x) => x.rootIsDir('week'),
      },
      {
        prompt: 'צור בתוך week את **day1.txt עד day7.txt** — בפקודה אחת! 🖨️',
        hint: ['סוגריים מסולסלים עם שתי נקודות: {1..7}', '`touch week/day{1..7}.txt`'],
        solution: 'touch week/day{1..7}.txt',
        check: (x) => need([1, 2, 3, 4, 5, 6, 7].every((n) => x.rootExists(`week/day${n}.txt`)), 'צריך 7 קבצים: week/day1.txt ... week/day7.txt'),
        success: 'שבעה קבצים בפקודה אחת. תחשוב כמה קליקים זה היה חוסך. 🤯',
      },
      {
        prompt: 'הצג את הימים עם **?** (תו אחד בדיוק): `ls week/day?.txt`',
        hint: '`ls week/day?.txt`',
        solution: 'ls week/day?.txt',
        check: (x) => ran(x, /^ls\b.*\?/) && has(x, 'day1.txt', 'day7.txt'),
      },
      {
        prompt: 'מתכננים טיול: צור **trip/photos, trip/videos, trip/notes** בפקודה אחת.',
        hint: '`mkdir -p trip/{photos,videos,notes}` (בלי רווחים בתוך הסוגריים!)',
        solution: 'mkdir -p trip/{photos,videos,notes}',
        check: (x) => need(['photos', 'videos', 'notes'].every((d) => x.rootIsDir('trip/' + d)), 'צריך את שלוש התיקיות בתוך trip.' + where(x)),
        success: 'מזוודה ארוזה. ✈️',
      },
      {
        quiz: {
          question: 'למה `?.txt` יתאים?',
          options: ['a.txt, אבל לא ab.txt', 'לכל קובץ txt', 'רק לקובץ ששמו באמת ?.txt', 'לשום דבר'],
          answer: 0,
          explain: '? = תו אחד בדיוק.',
        },
      },
      {
        quiz: {
          question: 'למה כדאי להריץ `echo *.tmp` לפני `rm *.tmp`?',
          options: ['כדי לראות מה יימחק בלי למחוק', 'כי rm לא עובד בלי זה', 'כדי להאיץ את המחיקה', 'אין סיבה'],
          answer: 0,
          explain: 'echo מראה למה ה-* הפך. תצוגה מקדימה בחינם.',
        },
      },
    ],
    drills: [
      { prompt: 'הצג רק את קבצי ה-.csv בארגז החול', hint: 'ls *.csv', solution: 'ls *.csv', check: (x) => ran(x, /^ls\b.*\*/) && has(x, 'shopping.csv') && !has(x, 'welcome.txt') },
      { prompt: 'צור test1.txt test2.txt test3.txt בפקודה אחת', hint: 'touch test{1..3}.txt', solution: 'touch test{1..3}.txt', check: (x) => [1, 2, 3].every((n) => x.rootExists(`test${n}.txt`)) },
      { prompt: 'מחק את כל קבצי ה-.tmp בתוך old-stuff', hint: 'rm old-stuff/*.tmp', solution: 'rm old-stuff/*.tmp', check: (x) => !x.rootList('old-stuff').some((f) => f.endsWith('.tmp')) },
      { prompt: 'הצג את כל ה-jpg וגם ה-png שב-photos בפקודה אחת', hint: 'photos/*.{jpg,png}', solution: 'ls photos/*.{jpg,png}', check: (x) => ran(x, /^ls\b/) && has(x, 'cat.png', 'beach.jpg') },
      { prompt: 'צור את התיקיות app/src, app/tests, app/docs בפקודה אחת', hint: 'mkdir -p app/{...}', solution: 'mkdir -p app/{src,tests,docs}', check: (x) => ['src', 'tests', 'docs'].every((d) => x.rootIsDir('app/' + d)) },
    ],
    cheats: [
      ['*.jpg', 'כל מה שנגמר ב-.jpg'],
      ['day?.txt', 'תו אחד בדיוק'],
      ['file{1..5}.txt', 'file1 עד file5'],
      ['{a,b,c}', 'a, b ו-c'],
      ['echo *.tmp', 'תצוגה מקדימה לפני rm'],
    ],
  },
];
