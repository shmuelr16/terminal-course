// lib/detect.js
// מזהה אילו כלים מותקנים על המחשב של המשתמש (git, node, python...).
// עובד על כל מחשב — פשוט בודק אם הפקודה קיימת ומה הגרסה.

'use strict';

const { execSync } = require('child_process');

// רשימת הכלים שאנחנו בודקים, עם הסבר קליל בעברית מה כל אחד עושה
const TOOLS = [
  { cmd: 'git', label: 'Git', emoji: '🌱', versionArg: '--version',
    install: { darwin: 'xcode-select --install   (או: brew install git)', linux: 'sudo apt install git' },
    what: 'שומר "צילומי מצב" של הקוד שלך ומאפשר לחזור אחורה בזמן. חובה לכל מתכנת.' },
  { cmd: 'node', label: 'Node.js', emoji: '🟢', versionArg: '--version',
    install: { darwin: 'brew install node   (או הורדה מ-nodejs.org)', linux: 'sudo apt install nodejs npm' },
    what: 'מריץ JavaScript מחוץ לדפדפן. (הקורס הזה עצמו רץ עליו!)' },
  { cmd: 'npm', label: 'npm', emoji: '📦', versionArg: '--version',
    install: { darwin: 'מגיע יחד עם Node.js', linux: 'sudo apt install npm' },
    what: 'מנהל החבילות של Node — מתקין ספריות קוד מוכנות.' },
  { cmd: 'python3', label: 'Python', emoji: '🐍', versionArg: '--version',
    install: { darwin: 'brew install python', linux: 'sudo apt install python3' },
    what: 'שפת תכנות פופולרית וקלה לקריאה.' },
  { cmd: 'brew', label: 'Homebrew', emoji: '🍺', versionArg: '--version',
    install: { darwin: 'נכנסים ל-https://brew.sh ומדביקים בטרמינל את הפקודה שמופיעה שם', linux: 'בלינוקס משתמשים ב-apt במקום' },
    what: 'מנהל התקנות למאק — "חנות האפליקציות של הטרמינל".' },
  { cmd: 'docker', label: 'Docker', emoji: '🐳', versionArg: '--version',
    install: { darwin: 'מורידים את Docker Desktop מ-docker.com', linux: 'sudo apt install docker.io' },
    what: 'אורז תוכנה ל"קונטיינרים" שרצים אותו דבר בכל מחשב.' },
  { cmd: 'ssh', label: 'SSH', emoji: '🔐', versionArg: '-V',
    install: { darwin: 'מגיע מובנה במק', linux: 'sudo apt install openssh-client' },
    what: 'התחברות מאובטחת למחשבים אחרים דרך האינטרנט.' },
  { cmd: 'curl', label: 'curl', emoji: '🌐', versionArg: '--version',
    install: { darwin: 'מגיע מובנה במק (או: brew install curl)', linux: 'sudo apt install curl' },
    what: 'מוריד ושולח מידע מהאינטרנט ישר מהטרמינל.' },
  { cmd: 'code', label: 'VS Code', emoji: '💻', versionArg: '--version',
    install: { darwin: 'מתקינים VS Code, ואז בתוכו: Cmd+Shift+P ← "Shell Command: Install code command in PATH"', linux: 'מתקינים VS Code מ-code.visualstudio.com' },
    what: 'עורך הקוד הפופולרי בעולם — אפשר לפתוח אותו ישר מהטרמינל.' },
];

// במק, git ו-python3 קיימים תמיד ב-/usr/bin כ"פקודות דמה" — אם כלי הפיתוח של
// Apple לא מותקנים, הרצה שלהן רק מקפיצה חלון התקנה. לכן בודקים את זה בנפרד.
const MAC_STUBS = new Set(['git', 'python3']);
let cltCache = null;
function hasCommandLineTools() {
  if (cltCache === null) {
    try {
      execSync('xcode-select -p', { stdio: 'ignore', timeout: 3000 });
      cltCache = true;
    } catch {
      cltCache = false;
    }
  }
  return cltCache;
}

// בודק אם פקודה קיימת (בעזרת command -v, שעובד בכל shell)
function isInstalled(cmd) {
  let where;
  try {
    where = execSync(`command -v ${cmd}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], timeout: 3000 }).trim();
  } catch {
    return false;
  }
  if (process.platform === 'darwin' && MAC_STUBS.has(cmd) && where === `/usr/bin/${cmd}`) {
    return hasCommandLineTools();
  }
  return true;
}

// הוראת התקנה מתאימה למערכת ההפעלה
function installHint(tool, platform = process.platform) {
  if (!tool.install) return `חפש בגוגל: "install ${tool.cmd}"`;
  return tool.install[platform] || tool.install.linux || tool.install.darwin;
}

// מנסה לקבל גרסה קצרה
function getVersion(cmd, arg) {
  try {
    const out = execSync(`${cmd} ${arg} 2>&1`, { encoding: 'utf8', timeout: 3000 });
    // לוקחים את השורה הראשונה ומקצרים
    const first = out.split('\n')[0].trim();
    return first.length > 60 ? first.slice(0, 57) + '...' : first;
  } catch {
    return null;
  }
}

// סורק את כל הכלים ומחזיר מערך תוצאות
function scanTools() {
  return TOOLS.map((t) => {
    const installed = isInstalled(t.cmd);
    return {
      ...t,
      installed,
      version: installed ? getVersion(t.cmd, t.versionArg) : null,
    };
  });
}

// בודק כלי בודד לפי שם פקודה (לשימוש בתוך שיעור)
function checkOne(cmd) {
  const meta = TOOLS.find((t) => t.cmd === cmd) || { cmd, label: cmd, emoji: '🔧', versionArg: '--version', what: '' };
  const installed = isInstalled(cmd);
  return { ...meta, installed, version: installed ? getVersion(cmd, meta.versionArg) : null };
}

module.exports = { TOOLS, scanTools, isInstalled, getVersion, checkOne, installHint };
