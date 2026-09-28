#!/usr/bin/env node
// index.js
// נקודת הכניסה של קורס הטרמינל: תפריט ראשי, בחירת שיעורים, אימון ומצבים חופשיים.
// הרצה: node index.js   (או אחרי npm link: terminal-course)

'use strict';

const readline = require('readline');
const storage = require('./lib/storage');
const sandbox = require('./lib/sandbox');
const engine = require('./lib/engine');
const screens = require('./lib/screens');
const ui = require('./lib/ui');
const { c, C } = ui;
const { randomJoke } = require('./lib/jokes');
const lessons = require('./lessons');

const { ask } = engine;

// ---- דגלים משורת הפקודה ----
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
קורס הטרמינל 🖥️  — לומדים טרמינל בתוך הטרמינל

שימוש:
  node index.js            מתחילים / ממשיכים מאיפה שעצרת
  node index.js --list     רשימת השיעורים
  node index.js --reset    איפוס כל ההתקדמות (מבקש אישור)
  node index.js --help     המסך הזה

ההתקדמות נשמרת ב: ${storage.PROGRESS_FILE}
`);
  process.exit(0);
}
if (args.includes('--list')) {
  for (const l of lessons) console.log(`${String(l.num).padStart(2)}. [${l.level}] ${l.emoji} ${l.title}`);
  process.exit(0);
}

const major = Number(process.versions.node.split('.')[0]);
if (major < 16) {
  console.error(`הקורס צריך Node.js 16 ומעלה (יש לך ${process.versions.node}). עדכן מ-nodejs.org או: brew install node`);
  process.exit(1);
}

// ---- עזרים ----
function nextLesson(progress) {
  return lessons.find((l) => !progress.completed.includes(l.id)) || null;
}

function bye(progress) {
  ui.clear(); // יוצאים באמת — בלי להשאיר את הקורס בהיסטוריית הגלילה
  console.log('  ' + c.ok('👋 להתראות' + (progress && progress.name ? ', ' + progress.name : '') + '! ההתקדמות נשמרה.'));
  console.log('  ' + c.dim('😂 אחת אחרונה לדרך: ' + randomJoke()));
  console.log();
  process.exit(0);
}

// ---- תפריט ראשי ----
function renderHeader(progress) {
  const rank = screens.rankFor(progress.xp);
  ui.clear();
  console.log(ui.banner('🖥️  קורס הטרמינל', C.bgMagenta));
  console.log();
  console.log(ui.box([
    `${c.title('היי ' + (progress.name || '') + '!')}  ${rank.title}  ·  ⭐ ${c.ok(progress.xp + ' XP')}  ·  🔥 ${progress.streakDays} ימים ברצף`,
    '',
    '📚 ' + ui.progressBar(progress.completed.length, lessons.length, 24),
  ], { color: C.brightCyan }));
  console.log();
}

async function mainMenu(deps) {
  const { rl, progress } = deps;
  while (true) {
    renderHeader(progress);
    const next = nextLesson(progress);
    const items = [
      ['1', next ? `▶️  המשך: שיעור ${next.num} — ${next.emoji} ${next.title}` : '🏆 סיימת את כל השיעורים! (אפשר לחזור על כל שיעור)'],
      ['2', '📚 כל השיעורים'],
      ['3', '🏋️  אימון מוגבר — תרגילים אקראיים ממה שלמדת'],
      ['4', '🧪 ארגז חול חופשי'],
      ['5', '🔭 מצב חקירה חופשי (המחשב האמיתי, קריאה בלבד)'],
      ['6', '🔧 מה מותקן אצלי?'],
      ['7', '📋 דף עזר'],
      ['8', '📊 הסטטיסטיקות שלי'],
      ['9', '⚙️  הגדרות ואיפוס'],
      ['0', '👋 יציאה'],
    ];
    for (const [k, label] of items) console.log('  ' + c.accent(k + ')') + ' ' + label);
    console.log();
    console.log('  ' + c.dim('😂 ' + randomJoke()));
    console.log();

    const choice = (await ask(rl, c.accent('  מה בא לך? '))).trim();
    let r = null;
    switch (choice) {
      case '1':
      case '':
        r = next ? await engine.runLesson(next, deps) : await lessonPicker(deps);
        break;
      case '2':
        r = await lessonPicker(deps);
        break;
      case '3':
        r = await drills(deps);
        break;
      case '4':
        r = await engine.runFreePlay(deps, 'sandbox');
        break;
      case '5':
        r = await engine.runFreePlay(deps, 'explore');
        break;
      case '6':
        await screens.showTools(deps);
        break;
      case '7':
        await screens.showCheats(lessons, deps);
        break;
      case '8':
        await screens.showStats(lessons, deps);
        break;
      case '9':
        r = await settings(deps);
        break;
      case '0':
      case 'יציאה':
      case 'exit':
      case 'q':
        return;
      default:
        break;
    }
    if (r === 'exit') return;
  }
}

// ---- בחירת שיעור ----
async function lessonPicker(deps) {
  const { rl, progress } = deps;
  const next = nextLesson(progress);
  ui.clear();
  console.log(ui.banner('📚 כל השיעורים', C.bgBlue));
  for (const level of lessons.LEVELS) {
    console.log();
    console.log('  ' + c.title(`▌ רמת ${level}`));
    for (const l of lessons.filter((x) => x.level === level)) {
      const done = progress.completed.includes(l.id);
      const mark = done ? c.ok('✅') : l === next ? '👉' : c.dim('○ ');
      const extra = l.mode === 'explore' ? c.dim(' 🔭 במחשב האמיתי') : l.requires ? c.dim(` (צריך ${l.requires})`) : '';
      console.log(`   ${mark} ${c.accent(String(l.num).padStart(2) + ')')} ${l.emoji} ${done ? c.dim(l.title) : l.title}${extra}`);
    }
  }
  console.log();
  console.log('  ' + c.dim('אפשר לבחור כל שיעור — גם לקפוץ קדימה, גם לחזור אחורה.'));
  console.log();
  while (true) {
    const a = (await ask(rl, c.accent('  מספר שיעור (Enter = חזרה לתפריט): '))).trim();
    if (!a || ['תפריט', 'menu'].includes(a)) return 'menu';
    const n = parseInt(a, 10);
    const lesson = lessons.find((l) => l.num === n);
    if (lesson) return engine.runLesson(lesson, deps);
    console.log('  ' + c.warn(`אין שיעור כזה. בחר מספר בין 1 ל-${lessons.length}.`));
  }
}

// ---- אימון מוגבר ----
async function drills(deps) {
  const { rl, progress } = deps;
  let source = lessons.filter((l) => progress.completed.includes(l.id) && l.drills && l.drills.length);
  if (!source.length) {
    ui.clear();
    console.log(ui.box([
      c.warn('עוד לא סיימת שיעורים עם תרגילי אימון.'),
      '',
      'אז נתחיל מתרגילים של השיעורים הראשונים — חימום קליל. 🤸',
    ], { color: C.brightYellow }));
    console.log();
    await ask(rl, c.dim('  [Enter להמשך] '));
    source = lessons.filter((l) => l.drills && l.drills.length).slice(0, 3);
  }
  const pool = source.flatMap((l) =>
    l.drills.map((d) => ({ ...d, from: `${l.emoji} ${l.title}`, teachText: engine.resolve(l.teach, deps) }))
  );
  return engine.runDrills(pool, deps, 8);
}

// ---- הגדרות ----
async function settings(deps) {
  const { rl, progress, save } = deps;
  while (true) {
    ui.clear();
    console.log(ui.banner('⚙️  הגדרות ואיפוס', C.bgGray));
    console.log();
    console.log('  ' + c.accent('1)') + ' ♻️  איפוס ארגז החול (מחזיר את קבצי האימון למצב ההתחלתי)');
    console.log('  ' + c.accent('2)') + ` ✏️  שינוי שם (כרגע: ${progress.name || '—'})`);
    console.log('  ' + c.accent('3)') + ' 🗑️  איפוס כל ההתקדמות');
    console.log('  ' + c.accent('0)') + ' ↩️  חזרה');
    console.log();
    console.log('  ' + c.dim(`ההתקדמות נשמרת ב: ${storage.PROGRESS_FILE}`));
    console.log();
    const a = (await ask(rl, c.accent('  בחירה: '))).trim();
    if (a === '1') {
      sandbox.seed();
      console.log('  ' + c.ok('✅ ארגז החול אופס.'));
      await ask(rl, c.dim('  [Enter] '));
    } else if (a === '2') {
      const name = (await ask(rl, c.accent('  שם חדש: '))).trim();
      if (name) {
        progress.name = name.slice(0, 30);
        save(progress);
        console.log('  ' + c.ok(`✅ נעים מאוד, ${progress.name}!`));
        await ask(rl, c.dim('  [Enter] '));
      }
    } else if (a === '3') {
      const sure = (await ask(rl, c.err('  בטוח? כל ה-XP והשיעורים יימחקו. כתוב "כן" לאישור: '))).trim();
      if (sure === 'כן' || sure.toLowerCase() === 'yes') {
        storage.reset();
        // שומרים על אותו אובייקט כדי שכל המודולים יראו את האיפוס
        for (const k of Object.keys(progress)) delete progress[k];
        Object.assign(progress, storage.defaultProgress());
        storage.touchStreak(progress);
        save(progress);
        sandbox.seed();
        console.log('  ' + c.ok('✅ הכל אופס. מתחילים מחדש! 🐣'));
        await ask(rl, c.dim('  [Enter] '));
        await screens.onboarding(deps);
        return 'menu';
      }
      console.log('  ' + c.dim('בוטל. שום דבר לא נמחק. 😌'));
      await ask(rl, c.dim('  [Enter] '));
    } else {
      return 'menu';
    }
  }
}

// ---- התחלה ----
async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: !!process.stdin.isTTY,
    historySize: 200,
  });
  engine.attachQueue(rl);

  const progress = storage.touchStreak(storage.load());
  storage.save(progress);
  sandbox.ensure();

  rl.on('SIGINT', () => bye(progress));

  const deps = { rl, progress, save: storage.save };

  if (args.includes('--reset')) {
    const sure = (await ask(rl, c.err('למחוק את כל ההתקדמות? כתוב "כן": '))).trim();
    if (sure === 'כן' || sure.toLowerCase() === 'yes') {
      storage.reset();
      for (const k of Object.keys(progress)) delete progress[k];
      Object.assign(progress, storage.touchStreak(storage.defaultProgress()));
      storage.save(progress);
      sandbox.seed();
      console.log(c.ok('✅ אופס.'));
    }
  }

  if (!progress.name) await screens.onboarding(deps);
  await mainMenu(deps);
  bye(progress);
}

main().catch((e) => {
  console.error(c.err('\n💥 אופס, משהו נשבר בקורס עצמו (לא אצלך!):'));
  console.error(e && e.stack ? e.stack : e);
  process.exit(1);
});
