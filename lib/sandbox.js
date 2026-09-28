// lib/sandbox.js
// יוצר "ארגז חול" — תיקייה בטוחה עם קבצים לדוגמה, שבה מתאמנים בפקודות
// שעלולות למחוק/לשנות דברים. ככה אף פעם לא נוגעים בקבצים האמיתיים.

'use strict';

const fs = require('fs');
const path = require('path');
const { PLAYGROUND_DIR } = require('./storage');

// המבנה שנזרע בכל reset. מפתח שמסתיים ב-/ הוא תיקייה.
const SEED = {
  'welcome.txt': 'ברוך הבא לארגז החול!\nכאן אפשר להתאמן בלי שום סיכון.\nנסה: ls, cat, mkdir, rm ...\n',
  '.treasure.txt': 'מצאת את האוצר הנסתר! 💎\nקבצים שמתחילים בנקודה מוסתרים מ-ls רגיל.\n',
  'diary.txt': 'יום ראשון: התחלתי ללמוד טרמינל.\nיום שני: כבר יודע ls ו-cd!\nיום שלישי: היום נלמד grep.\n',
  'shopping.csv': 'פריט,כמות,מחיר\nחלב,2,6\nלחם,1,8\nביצים,12,15\n',
  'secret.txt': 'הסיסמה שלי היא 123456 (לא באמת, זה תרגיל)\n',
  'names.txt': 'דני\nרותי\nאבי\nדני\nמיכל\nאבי\nיוסי\nדני\nנועה\nרותי\n',
  'numbers.txt': '42\n7\n19\n3\n100\n56\n8\n',
  'notes/': null,
  'notes/todo.txt': '- ללמוד ls\n- ללמוד cd\n- לשתות קפה\n- לכבוש את הטרמינל\n',
  'notes/ideas.md': '# רעיונות\n\n1. אפליקציית מתכונים\n2. משחק חלל\n3. בוט לוואטסאפ\n',
  'photos/': null,
  'photos/beach.jpg': '(תמונת חוף מדומה)\n',
  'photos/cat.png': '(תמונת חתול מדומה)\n',
  'photos/sunset.jpg': '(שקיעה מדומה)\n',
  'projects/': null,
  'projects/game/': null,
  'projects/game/index.html': '<h1>המשחק שלי</h1>\n',
  'projects/game/style.css': 'body { background: black; }\n',
  'projects/game/game.js': '// TODO: להוסיף ניקוד\nlet score = 0;\n// TODO: להוסיף שלבים\n',
  'projects/website/': null,
  'projects/website/index.html': '<h1>האתר שלי</h1>\n',
  'projects/website/about.html': '<!-- TODO: לכתוב משהו על עצמי -->\n<h1>עליי</h1>\n',
  'recipes/': null,
  'recipes/pasta.txt': 'פסטה ברוטב עגבניות\nמצרכים: פסטה, עגבניות, שום, שמן זית\n',
  'recipes/shakshuka.txt': 'שקשוקה\nמצרכים: ביצים, עגבניות, פלפל, בצל\n',
  'recipes/cake.txt': 'עוגת שוקולד\nמצרכים: קמח, סוכר, ביצים, שוקולד\n',
  'old-stuff/': null,
  'old-stuff/trash1.tmp': 'זבל ישן\n',
  'old-stuff/trash2.tmp': 'עוד זבל ישן\n',
  'old-stuff/keep.txt': 'את זה שומרים!\n',
  'logs/': null,
  'logs/app.log': [
    '2026-09-01 08:00:01 INFO server started port=3000',
    '2026-09-01 08:00:05 INFO user=dana logged in',
    '2026-09-01 08:01:12 INFO user=yossi logged in',
    '2026-09-01 08:02:40 WARN disk space low (15% left)',
    '2026-09-01 08:03:03 ERROR user=yossi payment failed',
    '2026-09-01 08:04:18 INFO user=dana viewed page /home',
    '2026-09-01 08:05:55 ERROR user=dana upload too large',
    '2026-09-01 08:06:30 INFO user=avi logged in',
    '2026-09-01 08:07:02 ERROR user=yossi payment failed again',
    '2026-09-01 08:08:44 WARN slow response 2300ms',
    '2026-09-01 08:09:10 INFO user=avi viewed page /shop',
    '2026-09-01 08:10:00 error user=avi someone wrote this one in lowercase',
    '2026-09-01 08:11:21 ERROR user=yossi session expired',
    '2026-09-01 08:12:00 INFO user=dana logged out',
    '2026-09-01 08:13:37 INFO backup completed',
  ].join('\n') + '\n',
};

// בונה מחדש את ארגז החול מאפס
function seed() {
  // מוחקים לגמרי ובונים מחדש
  if (fs.existsSync(PLAYGROUND_DIR)) {
    fs.rmSync(PLAYGROUND_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(PLAYGROUND_DIR, { recursive: true });

  for (const [rel, content] of Object.entries(SEED)) {
    const full = path.join(PLAYGROUND_DIR, rel);
    if (rel.endsWith('/')) {
      fs.mkdirSync(full, { recursive: true });
    } else {
      fs.mkdirSync(path.dirname(full), { recursive: true });
      fs.writeFileSync(full, content, 'utf8');
    }
  }
}

// דואג שהארגז קיים (בלי לאפס אם כבר יש)
function ensure() {
  if (!fs.existsSync(PLAYGROUND_DIR)) {
    seed();
  }
}

module.exports = { seed, ensure, PLAYGROUND_DIR };
