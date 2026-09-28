// lib/screens.js
// המסכים של הקורס: היכרות ראשונה, כלים מותקנים, דף עזר, סטטיסטיקות, תעודה.

'use strict';

const ui = require('./ui');
const { c, C } = ui;
const personalize = require('./personalize');
const detect = require('./detect');
const { ask } = require('./engine');
const { DATA_DIR } = require('./storage');

// ---- דרגות לפי XP ----
const RANKS = [
  { xp: 0, title: '🐣 טירון' },
  { xp: 150, title: '🧭 חוקר' },
  { xp: 400, title: '🛠️ בנאי' },
  { xp: 800, title: '⚡ שולף מהיר' },
  { xp: 1300, title: '🧙 קוסם טרמינל' },
  { xp: 2000, title: '👑 אגדת ה-Shell' },
];

function rankFor(xp) {
  let current = RANKS[0];
  let next = null;
  for (const r of RANKS) {
    if (xp >= r.xp) current = r;
    else if (!next) next = r;
  }
  return { title: current.title, next };
}

// ---- היכרות בפעם הראשונה ----
async function onboarding(deps) {
  const { rl, progress, save } = deps;
  const prof = personalize.profile();

  ui.clear();
  console.log(ui.banner('🖥️  קורס הטרמינל — לומדים לדבר עם המחשב', C.bgMagenta));
  console.log();
  await ui.typeLine(c.title('  היי! ברוך הבא. 👋'));
  await ui.typeLine('  אני הולך ללמד אותך להשתמש בטרמינל — מאפס ועד רמה מתקדמת.');
  await ui.typeLine('  בלי הרצאות משעממות: אתה מקליד פקודות אמיתיות, ואני בודק ומעודד. 💪');
  console.log();

  let name = '';
  while (!name) {
    name = (await ask(rl, c.accent('  איך קוראים לך? '))).trim();
    if (!name) console.log(c.dim('  (אפשר כל שם, גם כינוי 🙂)'));
  }
  progress.name = name.slice(0, 30);
  save(progress);

  console.log();
  await ui.typeLine(`  נעים מאוד, ${c.ok(progress.name)}! רגע, אני מציץ במחשב שלך (רק מסתכל, לא נוגע)... 🔎`);
  console.log();

  const fav = personalize.pickInterestingFolder(prof);
  console.log(ui.box([
    c.title('💻 מה גיליתי על המחשב שלך'),
    '',
    `👤 משתמש: ${c.ok(prof.username)}`,
    `🖥️  מערכת: ${personalize.platformName(prof.platform)}`,
    `🐚 shell: ${prof.shell}`,
    `🏠 בבית שלך: ${prof.homeFolders.length} תיקיות ו-${prof.homeFiles.length} קבצים` + (fav ? ` (למשל ${fav})` : ''),
  ], { color: C.brightCyan }));
  console.log();

  const tools = detect.scanTools();
  const line = tools.map((t) => (t.installed ? c.ok('✅ ' + t.label) : c.dim('❌ ' + t.label))).join('  ');
  console.log('  ' + c.title('🔧 כלים שמצאתי: ') + line);
  console.log('  ' + c.dim('(פרטים מלאים והוראות התקנה — בתפריט "מה מותקן אצלי?")'));
  console.log();
  console.log(ui.renderTeach(
    `> הכל נשמר רק אצלך, ב-\`${DATA_DIR}\`. אין שרת, אין ענן, אין מעקב.\n` +
    '> כל התרגול קורה ב"ארגז חול" — אי אפשר לקלקל שום דבר אמיתי. 🏖️'
  ));
  console.log();
  await ask(rl, c.dim('  [Enter כדי להתחיל] '));
}

// ---- מה מותקן אצלי ----
async function showTools(deps) {
  const { rl } = deps;
  ui.clear();
  console.log(ui.banner('🔧 מה מותקן אצלי?', C.bgBlue));
  console.log();
  console.log(c.dim('  סורק... (בודק כל כלי עם command -v ו---version)'));
  const tools = detect.scanTools();
  ui.clear();
  console.log(ui.banner('🔧 מה מותקן אצלי?', C.bgBlue));
  console.log();

  for (const t of tools) {
    if (t.installed) {
      console.log(`  ${c.ok('✅')} ${t.emoji} ${c.title(t.label)} ${c.dim(t.version || '')}`);
      console.log(`     ${t.what}`);
    } else {
      console.log(`  ${c.err('❌')} ${t.emoji} ${c.title(t.label)} ${c.dim('— לא מותקן')}`);
      console.log(`     ${t.what}`);
      console.log(`     ${c.warn('איך מתקינים:')} ${c.cmd(detect.installHint(t))}`);
    }
    console.log();
  }
  const count = tools.filter((t) => t.installed).length;
  console.log(ui.renderTeach(
    `> מותקנים אצלך ${count} מתוך ${tools.length}. לא חייבים הכל — מתקינים רק מה שצריך.\n` +
    '> התקנות עושים בחלון טרמינל רגיל (לא מתוך הקורס), כדי שאתה תחליט מה נכנס למחשב שלך.'
  ));
  console.log();
  await ask(rl, c.dim('  [Enter לחזרה לתפריט] '));
}

// ---- דף עזר ----
async function showCheats(lessons, deps) {
  const { rl, progress } = deps;
  ui.clear();
  console.log(ui.banner('📋 דף עזר — כל הפקודות במקום אחד', C.bgGreen));
  console.log();
  const cmdWidth = Math.max(...lessons.flatMap((l) => (l.cheats || []).map(([cmd]) => ui.displayWidth(cmd))));
  for (const l of lessons) {
    if (!l.cheats || !l.cheats.length) continue;
    const done = progress.completed.includes(l.id);
    console.log('  ' + (done ? c.ok('✅') : c.dim('○')) + ' ' + c.title(`${l.num}. ${l.title}`));
    for (const [cmd, desc] of l.cheats) {
      const pad = ' '.repeat(Math.max(1, cmdWidth - ui.displayWidth(cmd) + 2));
      console.log('     ' + (done ? c.cmd(cmd) : c.dim(cmd)) + pad + (done ? desc : c.dim(desc)));
    }
    console.log();
  }
  console.log(c.dim('  (שיעורים שעוד לא סיימת מופיעים באפור — אבל מותר להציץ 😉)'));
  console.log();
  await ask(rl, c.dim('  [Enter לחזרה לתפריט] '));
}

// ---- סטטיסטיקות ----
async function showStats(lessons, deps) {
  const { rl, progress } = deps;
  const rank = rankFor(progress.xp);
  ui.clear();
  console.log(ui.banner('📊 הסטטיסטיקות שלי', C.bgMagenta));
  console.log();
  const since = progress.createdAt ? new Date(progress.createdAt).toLocaleDateString('he-IL') : '?';
  console.log(ui.box([
    c.title(`${progress.name || 'אלוף'} — ${rank.title}`),
    '',
    `⭐ XP: ${c.ok(String(progress.xp))}` + (rank.next ? c.dim(`  (עוד ${rank.next.xp - progress.xp} לדרגה ${rank.next.title})`) : c.dim('  (הדרגה הכי גבוהה!)')),
    `📚 שיעורים: ${ui.progressBar(progress.completed.length, lessons.length, 20)}`,
    `🔥 רצף ימים: ${progress.streakDays}`,
    `⌨️  פקודות שהרצת: ${progress.stats.commandsRun}`,
    `🏋️ תרגילי אימון שפתרת: ${progress.stats.drillsSolved || 0}`,
    `💡 רמזים שביקשת: ${progress.stats.hintsUsed}`,
    `😂 בדיחות שביקשת: ${progress.stats.jokesRead || 0}`,
    `📅 לומד מאז: ${since}`,
  ], { color: C.brightMagenta }));
  console.log();
  console.log(c.dim('  דרגות: ') + RANKS.map((r) => (progress.xp >= r.xp ? c.ok(r.title) : c.dim(r.title))).join(c.dim(' → ')));
  console.log();
  await ask(rl, c.dim('  [Enter לחזרה לתפריט] '));
}

// ---- תעודת סיום ----
function certificate(progress) {
  const date = new Date().toLocaleDateString('he-IL');
  console.log(ui.box([
    '',
    c.title('🏆  תעודת קוסם טרמינל  🏆'),
    '',
    'מוענקת בזאת ל:',
    c.accent('✨ ' + (progress.name || 'אלוף הטרמינל') + ' ✨'),
    '',
    'על השלמת האתגר הסופי של קורס הטרמינל,',
    'מ-pwd הראשון ועד צינורות, סקריפטים ו-git.',
    '',
    `⭐ ${progress.xp} XP   ·   ⌨️  ${progress.stats.commandsRun} פקודות   ·   📅 ${date}`,
    '',
    c.dim('"עם כוח גדול באה אחריות גדולה. ובעיקר — אל תריץ rm -rf / ." 😉'),
    '',
  ], { color: C.brightYellow, pad: 3 }));
  console.log();
}

module.exports = { RANKS, rankFor, onboarding, showTools, showCheats, showStats, certificate };
