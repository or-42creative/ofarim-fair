/**
 * יריד תחילת הלימודים בסניף עופרים – קליטת הרשמות ל-Google Sheets + שליחת מייל אישור.
 *
 * התקנה (פעם אחת):
 * 1. פתחו את גיליון ה-Google Sheets שאליו תרצו לחבר את ההרשמות.
 * 2. תפריט: Extensions ▸ Apps Script
 * 3. מחקו את כל הקוד שמופיע והדביקו את כל הקובץ הזה.
 * 4. שמרו (אייקון הדיסקט).
 * 5. Deploy ▸ New deployment ▸ סוג: "Web app".
 *      - Execute as:  Me (המייל שלכם)
 *      - Who has access:  Anyone   (חובה! אחרת הטופס לא יוכל לשלוח)
 *    לחצו Deploy, אשרו את ההרשאות (Authorize access).
 * 6. העתיקו את כתובת ה-Web app URL שמתקבלת (מסתיימת ב-/exec).
 * 7. הדביקו אותה בקובץ index.html בשורה:  const SCRIPT_URL = '...'
 *
 * אם תשנו את הקוד בעתיד – צריך Deploy ▸ Manage deployments ▸ Edit ▸ Version: New version.
 */

// ===================== הגדרות =====================
const SHEET_NAME   = 'הרשמות';
const PAYBOX_URL   = 'https://links.payboxapp.com/B9Z3yPFb74b';
const EVENT_NAME   = 'יריד תחילת הלימודים בסניף עופרים';
const EVENT_WHEN   = 'יום חמישי | 27.8 | י״ד אלול';
const SENDER_NAME  = 'סניף עופרים';
// קישור "הוספה ליומן Google" — יום חמישי 27.8.2026, 17:00–19:00 (שעון ישראל):
const CAL_URL =
  'https://calendar.google.com/calendar/render?action=TEMPLATE' +
  '&text='   + encodeURIComponent(EVENT_NAME) +
  '&dates=20260827T170000/20260827T190000' +
  '&ctz=Asia/Jerusalem' +
  '&location=' + encodeURIComponent('סניף עופרים, בית אריה-עופרים') +
  '&details='  + encodeURIComponent(
    '17:00 – יריד החלפת ספרים וסדנת הכנת סימניות\n' +
    '18:00 – מפגש עם הסופר והיוטיובר נדב נוה (לכיתות ג׳ ומעלה)\n\n' +
    'עלות: 10₪ למשתתף. ההרשמה תקפה רק לאחר תשלום:\n' + PAYBOX_URL
  );
// אופציונלי: מייל לקבלת התראה על כל הרשמה חדשה (השאירו ריק כדי לבטל):
const NOTIFY_EMAIL = '';
// ==================================================


function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000); // מונע כתיבות במקביל שדורסות שורות
    const data  = parseInput_(e);
    const sheet = getSheet_();

    sheet.appendRow([
      new Date(),
      data.firstName   || '',
      data.lastName    || '',
      data.numChildren || '',
      data.grades      || data.grade || '',
      normalizePhone_(data.phone),
      data.email       || ''
    ]);

    if (data.email) {
      sendConfirmation_(data);
    }
    if (NOTIFY_EMAIL) {
      MailApp.sendEmail(
        NOTIFY_EMAIL,
        'הרשמה חדשה · ' + EVENT_NAME,
        'נרשם/ת חדש/ה:\n' +
        'שם: '          + (data.firstName || '') + ' ' + (data.lastName || '') + '\n' +
        'מספר ילדים: '  + (data.numChildren || '') + '\n' +
        'כיתות: '       + (data.grades || data.grade || '') + '\n' +
        'טלפון: '       + (data.phone || '') + '\n' +
        'מייל: '        + (data.email || '')
      );
    }

    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (_) {}
  }
}

// בדיקת חיים – פתיחת ה-URL בדפדפן תראה הודעה זו:
function doGet() {
  return json_({ ok: true, msg: 'Web app is live · ' + EVENT_NAME });
}

// ---------------- עוזרים ----------------

function parseInput_(e) {
  if (e && e.postData && e.postData.contents) {
    try { return JSON.parse(e.postData.contents); } catch (_) {}
  }
  return (e && e.parameter) ? e.parameter : {};
}

const HEADERS = ['תאריך הרשמה', 'שם', 'שם משפחה', 'מספר ילדים', 'כיתות', 'טלפון', 'אימייל'];

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  // כתיבת/תיקון שורת הכותרות כך שתתאים תמיד לעמודות הנוכחיות
  const current = sheet.getLastRow() > 0
    ? sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0]
    : [];
  if (current.join('|') !== HEADERS.join('|')) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// שומר את הטלפון כטקסט (כדי שלא ייחתך אפס מוביל)
function normalizePhone_(phone) {
  if (!phone) return '';
  return "'" + String(phone).replace(/[^\d+\-]/g, '');
}

function sendConfirmation_(data) {
  const name    = (data.firstName || '').trim();
  const hello   = name ? ('שלום ' + name + ',') : 'שלום,';
  const subject = 'תודה על ההרשמה · ' + EVENT_NAME;

  const htmlBody =
    '<div dir="rtl" style="font-family:Arial,Helvetica,sans-serif;color:#2c2836;line-height:1.6;max-width:560px;margin:auto">' +
      '<h2 style="color:#5f2b8c;margin:0 0 8px">תודה על ההרשמה! 🎉</h2>' +
      '<p>' + escapeHtml_(hello) + '</p>' +
      '<p>נרשמתם ל<strong>' + escapeHtml_(EVENT_NAME) + '</strong> (' + escapeHtml_(EVENT_WHEN) + ').</p>' +

      '<div style="background:#fff6de;border:2px dashed #f4b400;border-radius:12px;padding:14px 16px;margin:18px 0;font-weight:bold;color:#6b5200">' +
        '⚠️ שימו לב: ההרשמה תקפה <u>רק לאחר תשלום</u> של 10₪ למשתתף.' +
      '</div>' +

      '<p>להשלמת ההרשמה, בצעו את התשלום בקישור הבא:</p>' +
      '<p style="text-align:center;margin:22px 0">' +
        '<a href="' + PAYBOX_URL + '" ' +
           'style="display:inline-block;background:#0089a3;color:#fff;text-decoration:none;' +
           'font-weight:bold;font-size:18px;padding:14px 30px;border-radius:12px">💳 לתשלום ב-Paybox</a>' +
      '</p>' +
      '<p style="font-size:13px;color:#6b6478;word-break:break-all">אם הכפתור לא עובד, העתיקו קישור זה לדפדפן:<br>' +
        '<a href="' + PAYBOX_URL + '">' + PAYBOX_URL + '</a></p>' +

      '<p style="text-align:center;margin:22px 0">' +
        '<a href="' + CAL_URL + '" ' +
           'style="display:inline-block;background:#fff;color:#5f2b8c;text-decoration:none;' +
           'font-weight:bold;font-size:16px;padding:12px 26px;border-radius:12px;border:2px solid #8a4fb0">' +
           '📅 הוספת האירוע ליומן Google</a>' +
      '</p>' +

      '<hr style="border:none;border-top:1px solid #eee;margin:24px 0">' +
      '<p style="font-size:13px;color:#6b6478">נתראה באירוע!<br>' + escapeHtml_(SENDER_NAME) + '</p>' +
    '</div>';

  const plainBody =
    hello + '\n\n' +
    'תודה על ההרשמה ל' + EVENT_NAME + ' (' + EVENT_WHEN + ').\n\n' +
    'שימו לב: ההרשמה תקפה רק לאחר תשלום של 10₪ למשתתף.\n' +
    'לתשלום ב-Paybox: ' + PAYBOX_URL + '\n\n' +
    'הוספת האירוע ליומן Google: ' + CAL_URL + '\n\n' +
    'נתראה באירוע!\n' + SENDER_NAME;

  MailApp.sendEmail({
    to:       data.email,
    subject:  subject,
    htmlBody: htmlBody,
    body:     plainBody,
    name:     SENDER_NAME
  });
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function escapeHtml_(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
