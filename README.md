# 🖥️ קורס הטרמינל

קורס אינטראקטיבי שרץ **בתוך הטרמינל עצמו**: אתה מקליד פקודות אמיתיות, הקורס מריץ אותן, בודק אם הצלחת, נותן רמזים, מספר בדיחות וסופר XP.
הוא מסתכל על המחשב שלך (קריאה בלבד) כדי להתאים את ההדרכה — ומזהה אילו כלים מותקנים אצלך (git, node, python, brew...).
**הכל נשמר מקומית** ב-`~/.terminal-course/` — בלי שרת, בלי ענן, בלי תלויות חיצוניות.

## 🚀 התקנה — בחר את המכשיר שלך

צריך **Node.js** (זה מה שמריץ את הקורס). מתקינים פעם אחת, ואז הקורס עצמו — פקודה אחת.

### 🍎 מק

1. מתקינים Node.js מ-[nodejs.org](https://nodejs.org) (הבא-הבא-סיום)
2. פותחים **Terminal** ומדביקים:

```bash
npx terminal-course
```

### 🐧 לינוקס

```bash
sudo apt install nodejs npm   # אם עוד אין Node
npx terminal-course
```

### 🪟 Windows

1. מתקינים **Git for Windows** מ-[git-scm.com](https://git-scm.com/download/win) (הבא-הבא-סיום)
2. מתקינים **Node.js** מ-[nodejs.org](https://nodejs.org)
3. פותחים את התוכנה **Git Bash** ומדביקים:

```bash
npx terminal-course
```

> למה Git Bash? כי הקורס מלמד פקודות של מק/לינוקס, ו-Git Bash נותן אותן ב-Windows. הקורס מוצא אותו לבד.
> (חלופה למתקדמים: WSL — `wsl --install`.) שני שיעורים, הרשאות ותהליכים, מוצגים ב-Windows כהסבר בלבד.

### 🤖 אנדרואיד (טלפון/טאבלט)

1. מתקינים את האפליקציה **Termux** (מ-[F-Droid](https://f-droid.org/packages/com.termux/), לא מ-Google Play)
2. פותחים אותה ומדביקים:

```bash
pkg install nodejs
npx terminal-course
```

### 🔁 הרצה חוזרת

אחרי הפעם הראשונה, פשוט מקלידים `npx terminal-course` שוב — ההתקדמות נשמרה.
מעדיפים פקודה קצרה בלי `npx`? מתקינים פעם אחת: `npm install -g terminal-course`, ואז פשוט `terminal-course`.

### 🛠️ למפתחים (ישר מהקוד)

```bash
git clone https://github.com/shmuelr16/terminal-course.git
cd terminal-course && node index.js
```

## מה יש בפנים

**20 שיעורים בשלוש רמות** — כל אחד עם הסבר קליל, משימות מעשיות, חידונים ותרגילי אימון:

| רמה | שיעורים |
|---|---|
| בסיס | pwd/echo · ls · cd · סיור במחשב שלך · cat/head/tail · mkdir/touch · cp/mv/rm · תווים כלליים |
| בינוני | צינורות ו-sort/uniq · grep · find · הרשאות · מה מותקן אצלי · משתנים ו-alias |
| מתקדם | cut/sed/awk · תהליכים · סקריפטים · git · רשת (curl/ssh) · אתגר סופי + תעודה 🏆 |

**בכל משימה אפשר לכתוב:** `רמז` (רמזים הדרגתיים) · `חזרה` (מציג שוב את החומר) · `דלג` (מראה פתרון) · `בדיחה` · `תפריט`

**מהתפריט הראשי:** אימון מוגבר (8 תרגילים אקראיים ממה שלמדת) · ארגז חול חופשי · מצב חקירה חופשי · "מה מותקן אצלי?" · דף עזר · סטטיסטיקות ודרגות.

## בטיחות

- **ארגז חול** (`~/.terminal-course/playground`): כאן מתרגלים rm/mv/cp. כל פקודה שכותבת מחוץ לארגז (`../`, `~`, נתיב מוחלט, `> /x`) נחסמת.
- **מצב חקירה** (המחשב האמיתי): קריאה בלבד — כל פקודה שמשנה קבצים נחסמת.
- תמיד חסום: `sudo`, `kill`, התקנות, `git config --global`, `curl | bash`, ועוד.
- תוכנות מסך-מלא (vim, nano, less, top) לא נפתחות — מקבלים הסבר איך להשתמש בהן בטרמינל רגיל.
- זו רשת ביטחון ללמידה, לא כלא אבטחה.

## מבנה

```
index.js            תפריט ראשי ונקודת כניסה
lib/shell.js        איזה bash מריץ את הפקודות (כולל Git Bash ב-Windows)
lib/engine.js       ה-shell המדומה: הרצה, בטיחות, בדיקת משימות, אימון
lib/screens.js      היכרות, כלים מותקנים, דף עזר, סטטיסטיקות, תעודה
lib/sandbox.js      קבצי האימון של ארגז החול
lib/detect.js       זיהוי כלים מותקנים + הוראות התקנה
lib/personalize.js  קריאת תיקיית הבית (קריאה בלבד)
lib/storage.js      שמירת התקדמות ב-JSON
lib/ui.js, jokes.js צבעים, מסגרות, בדיחות
lessons/            השיעורים (basics / intermediate / advanced)
test/               בדיקה שכל פתרון עובר את הבדיקה של המשימה שלו
```

## הוספת שיעור

כל שיעור הוא אובייקט ב-`lessons/*.js`: `id`, `level`, `title`, `teach` (טקסט או פונקציה), `tasks`, `drills`, `cheats`.
משימה = `{ prompt, hint, solution, check(x) }` — ה-`x` מכיל `cmd`, `stdout`, `rel` (המיקום בארגז החול), `rootExists()`, `rootRead()` ועוד (ראה `buildCtx` ב-engine).
אחרי כל שינוי:

```bash
npm test
```

הבדיקה מריצה את ה-`solution` של כל משימה ובודקת שה-`check` עובר (בארגז חול זמני — לא נוגע בהתקדמות שלך).
