# יריד סוף החופש בסניף עופרים — עמוד נחיתה + הרשמה

עמוד נחיתה סטטי (GitHub Pages) עם פרטי האירוע, אימבוד של סרטון היוטיוב, וטופס הרשמה
שמתחבר ל-Google Sheets ושולח מייל אישור עם קישור התשלום ב-Paybox.

## מבנה הקבצים
- `index.html` — כל העמוד (עיצוב + טופס). קובץ אחד, ללא תלויות.
- `Code.gs` — סקריפט Google Apps Script להדבקה בגיליון (קליטת הרשמות + מייל).
- `assets/flyer.png` — הפלאייר המקורי (מוצג ככותרת העמוד).
- `.nojekyll` — כדי ש-GitHub Pages יגיש את תיקיית ה-assets כמו שהיא.

---

## שלב 1 — חיבור ל-Google Sheets (הסקריפט)
1. צרו/פתחו גיליון Google Sheets.
2. תפריט **Extensions ▸ Apps Script**.
3. מחקו את הקוד הקיים והדביקו את כל התוכן של `Code.gs`.
4. שמרו (Ctrl+S).
5. **Deploy ▸ New deployment ▸ בחרו סוג "Web app"**:
   - **Execute as:** Me
   - **Who has access:** **Anyone** ← חובה, אחרת הטופס לא ישלח
6. לחצו **Deploy** ואשרו את ההרשאות (Authorize access → בחרו את החשבון → Advanced → Allow).
7. העתיקו את ה-**Web app URL** (מסתיים ב-`/exec`).

> שינית את הקוד אחר כך? צריך **Deploy ▸ Manage deployments ▸ Edit (עיפרון) ▸ Version: New version ▸ Deploy**.

## שלב 2 — חיבור העמוד לסקריפט
ב-`index.html`, מצאו בסוף הקובץ:
```js
const SCRIPT_URL = 'PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE';
```
הדביקו במקום הטקסט את ה-URL שהעתקתם. שמרו.

## שלב 3 — העלאה ל-GitHub Pages
בטרמינל, מתוך תיקיית הפרויקט:
```bash
git init
git add .
git commit -m "Ofarim start-of-year fair — landing page + registration"
git branch -M main
# צרו ריפו חדש וריק ב-GitHub, ואז:
git remote add origin https://github.com/<USERNAME>/<REPO>.git
git push -u origin main
```
ואז ב-GitHub: **Settings ▸ Pages ▸ Source: Deploy from a branch ▸ Branch: main / (root) ▸ Save**.
תוך דקה-שתיים העמוד יהיה זמין בכתובת:
`https://<USERNAME>.github.io/<REPO>/`

---

## איך זה עובד
- הטופס שולח את הפרטים ל-Web App של Apps Script בבקשת `no-cors`
  (זו הדרך התקנית לחבר עמוד סטטי ל-Apps Script — הדפדפן לא מקבל תשובה, לכן העמוד מציג
  "תודה" אופטימיסטית לאחר השליחה).
- הסקריפט מוסיף שורה לגיליון (תאריך, שם, שם משפחה, כיתה, טלפון, אימייל)
  ושולח מייל אישור לנרשם/ת עם קישור ה-Paybox והדגשה שההרשמה תקפה רק לאחר תשלום.
- בעמוד עצמו, מסך התודה מציג את אותו קישור Paybox + אותה הבהרה.

## הגדרות שאפשר לשנות (בראש `Code.gs`)
- `NOTIFY_EMAIL` — אם תמלאו מייל, תקבלו התראה על כל הרשמה חדשה.
- `PAYBOX_URL`, `EVENT_NAME`, `EVENT_WHEN` — טקסטים של מייל האישור.

## הערות
- כדי ש-Paybox יופיע גם במייל וגם בעמוד — הקישור מוגדר בשני המקומות (`Code.gs` ו-`index.html`).
  אם הקישור ישתנה, עדכנו בשניהם.
- מיילים נשלחים מחשבון ה-Google שהריץ את הסקריפט (יש מכסה יומית סבירה של MailApp).
