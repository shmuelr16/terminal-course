// test/solutions.test.js
// בודק שכל פתרון של כל משימה באמת עובר את הבדיקה של אותה משימה.
// רץ בארגז חול זמני — לא נוגע בהתקדמות האמיתית שלך.
// הרצה: npm test

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.TERMINAL_COURSE_HOME = fs.mkdtempSync(path.join(os.tmpdir(), 'terminal-course-test-'));

const engine = require('../lib/engine');
const sandbox = require('../lib/sandbox');
const lessons = require('../lessons');

const only = process.argv[2]; // אפשר להריץ שיעור בודד: node test/solutions.test.js grep
let pass = 0;
let fail = 0;
let skipped = 0;
const failures = [];

function runOne(lesson, task, shell, label) {
  const solution = engine.resolve(task.solution);
  if (!solution) {
    failures.push(`${label}: אין solution`);
    fail++;
    return;
  }
  const ex = engine.executeCommand(solution, shell);
  if (ex.blocked) {
    failures.push(`${label}: הפתרון נחסם — ${ex.why}\n      $ ${solution}`);
    fail++;
    return;
  }
  const r = engine.evaluate(task, engine.buildCtx(shell, solution, ex));
  if (r.ok) {
    pass++;
  } else {
    fail++;
    failures.push(
      `${label}: הבדיקה נכשלה ${r.msg ? '(' + r.msg + ')' : ''}\n      $ ${solution}\n      stdout: ${JSON.stringify(ex.result.stdout.slice(0, 200))}\n      stderr: ${JSON.stringify(ex.result.stderr.slice(0, 200))}`
    );
  }
}

const ids = new Set();
for (const lesson of lessons) {
  if (ids.has(lesson.id)) failures.push(`מזהה שיעור כפול: ${lesson.id}`);
  ids.add(lesson.id);
  if (only && lesson.id !== only) continue;

  const blocker = engine.lessonBlocker(lesson);
  if (blocker) {
    console.log(`⏭️  ${lesson.id} — ${blocker.kind === 'unix' ? 'לא רלוונטי ב-Windows' : lesson.requires + ' לא מותקן'}, מדלג`);
    skipped++;
    continue;
  }

  // ההסבר חייב להיבנות בלי שגיאות
  engine.resolve(lesson.teach, { progress: { name: 'בודק' } });

  const shell = engine.createShell(lesson.mode || 'sandbox');
  if (shell.mode === 'sandbox') sandbox.seed();
  lesson.tasks.forEach((task, i) => {
    const label = `${lesson.id} משימה ${i + 1}`;
    if (engine.resolve(task.skipIf)) return;
    if (task.quiz) {
      const q = task.quiz;
      if (!(q.answer >= 0 && q.answer < q.options.length)) {
        fail++;
        failures.push(`${label}: תשובת חידון מחוץ לטווח`);
      } else pass++;
      return;
    }
    if (task.info) return;
    runOne(lesson, task, shell, label);
  });

  // תרגילי אימון: כל אחד מתחיל מארגז נקי, בדיוק כמו במצב האימון
  (lesson.drills || []).forEach((drill, i) => {
    const s = engine.createShell('sandbox');
    sandbox.seed();
    runOne(lesson, drill, s, `${lesson.id} תרגיל ${i + 1}`);
  });

  console.log(`✔ ${lesson.num}. ${lesson.id}`);
}

fs.rmSync(process.env.TERMINAL_COURSE_HOME, { recursive: true, force: true });

console.log();
for (const f of failures) console.log('❌ ' + f);
console.log(`\n${pass} עברו · ${fail} נכשלו · ${skipped} שיעורים דולגו`);
process.exit(fail ? 1 : 0);
