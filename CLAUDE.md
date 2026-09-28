# CLAUDE.md — קורס הטרמינל

קורס אינטראקטיבי בעברית שרץ בתוך הטרמינל: המשתמש מקליד פקודות אמיתיות, המנוע מריץ אותן (בארגז חול או במצב קריאה-בלבד), בודק את המשימה, נותן רמזים, בדיחות ו-XP. Node.js ≥16, **בלי תלויות חיצוניות**. הכל נשמר מקומית ב-`~/.terminal-course/`.

## פקודות

- הרצה: `terminal-course` (מקושר גלובלית עם `npm link` — שינויים בקוד חלים מיד) או `node index.js`
- בדיקות: `npm test` — מריץ את ה-`solution` של **כל** משימה ותרגיל דרך המנוע האמיתי ובודק שה-`check` עובר. חובה אחרי כל שינוי בשיעורים או במנוע. בדיקת שיעור בודד: `node test/solutions.test.js grep`
- `TERMINAL_COURSE_HOME=<dir>` מפנה את נתוני הקורס (התקדמות + ארגז חול) לתיקייה אחרת — לבדיקות, כדי לא לגעת בהתקדמות האמיתית של המשתמש.
- בדיקת קצה-לקצה: להזרים קלט, למשל `printf 'שם\n\n1\n\npwd\nתפריט\n0\n' | NO_ANIM=1 TERMINAL_COURSE_HOME=/tmp/x node index.js`

## מבנה

- `index.js` — תפריט ראשי, בחירת שיעור, אימון, הגדרות
- `lib/engine.js` — ה-shell המדומה: `executeCommand` (הרחבת `!!`/alias, פקודות מובנות cd/export/alias/history, בדיקות בטיחות, הרצה ב-bash), `buildCtx` + `evaluate` לבדיקת משימות, `runLesson`/`runTask`/`runDrills`/`runFreePlay`
- `lib/shell.js` — איזה bash מריץ פקודות (`/bin/bash`, ב-Windows: Git Bash, Termux), עזרי נתיבים (`samePath`, `toPosixPath`)
- `lib/rtl.js` — סידור עברית לטרמינלים בלי bidi (Termux/אנדרואיד). מופעל אוטומטית שם (או עם `TERMINAL_COURSE_RTL=1/0`). `console.log` עטוף ב-`index.js`, וגם פלט פקודות/פרומפטים עוברים דרך `rtl.reorder`
- `lib/screens.js` — היכרות, "מה מותקן אצלי", דף עזר, סטטיסטיקות, תעודה
- `lib/detect.js` — זיהוי כלים מותקנים + הוראות התקנה לפי מערכת הפעלה
- `lib/sandbox.js` — קבצי האימון (`SEED`). הבדיקות בשיעורים תלויות בתוכן המדויק שלהם (למשל 4 שורות ERROR ב-`logs/app.log`)
- `lessons/{basics,intermediate,advanced}.js` — 20 שיעורים; `lessons/_helpers.js` — עזרי בדיקה (`ran`, `has`, `need`, `where`, `isExec`, `hasHome`...)

## מבנה שיעור ומשימה

שיעור: `{ id, level, emoji, title, mode?: 'explore', requires?: 'git', unixOnly?, windowsNote?, teach (טקסט או פונקציה), tasks, drills, cheats, onComplete? }`
משימה: `{ prompt, hint (מחרוזת או מערך הדרגתי), solution, check(x), success? }` — כל שדה יכול להיות פונקציה. גם `{ quiz: {question, options, answer, explain} }` ו-`{ info }`.
ב-`check(x)`: `x.cmd` (אחרי הרחבות), `x.raw`, `x.stdout`, `x.lines`, `x.code`, `x.rel` (מיקום בתוך ארגז החול), `x.rootExists/rootRead/rootIsDir/rootMode/rootList`, `x.run(cmd, dir)`, `x.env`, `x.aliases`. להחזיר `true` או `{ok:false, msg}` עם הודעה שעוזרת.
תרגילי `drills` חייבים להיות עצמאיים — כל אחד מתחיל מארגז חול נקי ומהשורש.

## סגנון התוכן

עברית, קליל, מצחיק ולא משעמם, עם הרבה תרגול. הסברים עם אנלוגיות ואימוג'י, רמזים הדרגתיים, הודעות שגיאה שמסבירות מה לעשות.

## מלכודות שכבר נפלנו בהן

- **עברית ב-sort/uniq במק**: ב-`en_US.UTF-8` אין סדר מיון לעברית — `uniq` חושב שכל השורות זהות. המנוע מגדיר `LC_COLLATE=C` (ב-`buildEnv`).
- **מרכאות ממקלדת עברית**: `״`/`׳` מומרים ל-`"`/`'` (`normalizeQuotes`), חוץ מגרשיים באמצע מילה (צה״ל).
- **מסגרות**: רק פס שמאלי, בלי גבול ימני — גבול ימני נשבר עם עברית (bidi), אימוג'י ושינוי גודל חלון.
- **עברית ב-Termux**: הטרמינל של Termux לא מסדר עברית (מציג הפוך). `lib/rtl.js` מסדר מראש. במק זה כבוי (המק מסדר לבד), אז שינויים ב-rtl לא נראים במק — בודקים עם `TERMINAL_COURSE_RTL=1`.
- **ניקוי מסך**: `ui.clear` שולח גם `\x1b[3J`, אחרת הטרמינל של המק שומר כל מסך בהיסטוריית הגלילה.
- `ui.paint` הוא פונקציה של `ui`, לא של `c`.
- תוכנות מסך-מלא (vim, nano, less, top) חסומות עם הסבר — `execSync` לא יכול להריץ אותן.

## בטיחות (לא להחליש)

ארגז החול חוסם כתיבה מחוץ לו (`../`, `~`, נתיבים מוחלטים, הפניות `>`). מצב חקירה = קריאה בלבד. תמיד חסום: sudo, kill, התקנות, `git config --global` לכתיבה, `curl | bash`, ssh-keygen.

## מצב הפרויקט וכללים

- **לא מפורסם.** החבילה מוכנה ל-npm בשם `terminal-course` (השם היה פנוי), אבל `"private": true` ב-package.json הוא נעילת בטיחות נגד פרסום בטעות — מסירים רק כשהמשתמש מאשר במפורש לפרסם.
- **Windows** (Git Bash / WSL) נכתב אבל **לא נבדק על מחשב Windows אמיתי**.
- **לשאול לפני כל commit**, ולא לעשות push/publish בלי בקשה מפורשת. אין remote.
- לא להכניס לריפו נתיבים אישיים (`/Users/...`) או מיילים — הקוד משתמש ב-`os.homedir()`. `.DS_Store` ב-.gitignore.
