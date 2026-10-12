/**
 * @OnlyCurrentDoc  Limits this script's access to the one spreadsheet it is attached to.
 *
 * Sidekick beta sign-ups → this Google Sheet.
 *
 * Install: open the sheet → Extensions → Apps Script → replace Code.gs with this file → Save →
 * run `setUp` once → Deploy → New deployment → Web app (Execute as: Me, Who has access: Anyone).
 * Full steps: SETUP.md beside this file.
 *
 * What it does
 *  - doPost: receives the website's beta form, validates it, and appends one row per Google account
 *    email (a repeat request from the same email is not added twice).
 *  - A "Sidekick beta" menu: set up the sheet, export the emails you marked "Selected" for Google
 *    Play's tester list, and mark them as added.
 *
 * It never reads anything back to the website: the only reply is {ok: true} or {ok: false}.
 */

const SHEET_NAME = 'Beta requests';
const EXPORT_SHEET_NAME = 'Play testers export';
const HEADERS = [
  'Submitted at',
  'Name',
  'Google account email',
  'Mac',
  'Android phone',
  'Android version',
  'Country',
  'Most wants Sidekick to',
  'Consent',
  'Status',
  'Added to Play',
  'Mac token issued',
  'Notes',
];
const COL = HEADERS.reduce((m, h, i) => ((m[h] = i + 1), m), {});
const STATUSES = ['New', 'Selected', 'Invited', 'Not this round'];
const MAC_TYPES = { 'apple-silicon': 'Apple silicon', intel: 'Intel', 'not-sure': 'Not sure' };
const ANDROID_VERSIONS = ['16', '15', '14', '13', '12', '11', '10', 'not-sure'];
const LIMITS = { name: 100, email: 254, phone_model: 120, country: 60, wish: 1000 };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* ------------------------------------------------------------------ web app */

function doPost(e) {
  const p = (e && e.parameter) || {};
  // The website's script adds _js=1 and wants JSON. A browser without JavaScript posts the form
  // directly and should get a readable page instead.
  const wantsJson = p._js === '1';
  try {
    // Honeypot: real people never fill the hidden "website" field. Pretend success, store nothing.
    if (p.website) return respond_(wantsJson, { ok: true });

    const result = validate_(p);
    if (!result.ok) return respond_(wantsJson, { ok: false, error: 'invalid', fields: result.fields });

    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      const sheet = getSheet_();
      if (!isDuplicate_(sheet, result.data.email)) appendRequest_(sheet, result.data);
    } finally {
      lock.releaseLock();
    }
    return respond_(wantsJson, { ok: true });
  } catch (err) {
    console.error(err);
    return respond_(wantsJson, { ok: false, error: 'server' });
  }
}

/** Health check only — returns nothing from the sheet. */
function doGet() {
  return json_({ ok: true, service: 'sidekick-beta' });
}

/* ------------------------------------------------------------------ validation and storage */

function validate_(p) {
  const s = (k) => String(p[k] == null ? '' : p[k]).trim();
  const data = {
    name: s('name'),
    email: s('email').toLowerCase(),
    mac: s('mac'),
    phone_model: s('phone_model'),
    android_version: s('android_version'),
    country: s('country'),
    wish: s('wish'),
    consent: s('consent'),
  };
  const fields = [];
  if (!data.name || data.name.length > LIMITS.name) fields.push('name');
  if (!EMAIL_RE.test(data.email) || data.email.length > LIMITS.email) fields.push('email');
  if (!Object.prototype.hasOwnProperty.call(MAC_TYPES, data.mac)) fields.push('mac');
  if (!data.phone_model || data.phone_model.length > LIMITS.phone_model) fields.push('phone_model');
  if (ANDROID_VERSIONS.indexOf(data.android_version) < 0) fields.push('android_version');
  if (data.country.length > LIMITS.country) fields.push('country');
  if (data.wish.length > LIMITS.wish) fields.push('wish');
  if (data.consent !== 'yes') fields.push('consent');
  return fields.length ? { ok: false, fields } : { ok: true, data };
}

/**
 * Stops a submitted value being read as a formula ("=HYPERLINK(…)", "+1…", "@…") when it lands in a
 * cell or a CSV export. The leading apostrophe is hidden by Sheets.
 */
function safe_(v) {
  return /^[=+\-@\t\r]/.test(v) ? "'" + v : v;
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(SHEET_NAME) || setUpSheet_(ss);
}

function isDuplicate_(sheet, email) {
  const last = sheet.getLastRow();
  if (last < 2) return false;
  const emails = sheet.getRange(2, COL['Google account email'], last - 1, 1).getValues();
  for (let i = 0; i < emails.length; i++) {
    if (String(emails[i][0]).replace(/^'/, '').trim().toLowerCase() === email) return true;
  }
  return false;
}

function appendRequest_(sheet, d) {
  const row = [
    new Date(),
    d.name,
    d.email,
    MAC_TYPES[d.mac],
    d.phone_model,
    d.android_version === 'not-sure' ? 'Not sure' : 'Android ' + d.android_version,
    d.country,
    d.wish,
    'Yes',
    'New',
    '',
    '',
    '',
  ].map((v) => (typeof v === 'string' ? safe_(v) : v));
  sheet.appendRow(row);
}

function respond_(wantsJson, body) {
  if (wantsJson) return json_(body);
  const site = PropertiesService.getScriptProperties().getProperty('SITE_URL');
  const back = site ? '<p><a href="' + site.replace(/"/g, '') + '/beta" target="_top">Back to Sidekick</a></p>' : '';
  const html = body.ok
    ? '<h1>Request received</h1><p>If there’s a place in the beta, you’ll get an email with what to do next.</p>' + back
    : '<h1>That didn’t go through</h1><p>Nothing was saved. Go back, check every field, and try again.</p>' + back;
  return HtmlService.createHtmlOutput(
    '<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<div style="font:16px/1.5 system-ui,sans-serif;max-width:32rem;margin:3rem auto;padding:0 1rem">' +
      html +
      '</div>',
  ).setTitle('Sidekick beta');
}

function json_(body) {
  return ContentService.createTextOutput(JSON.stringify(body)).setMimeType(ContentService.MimeType.JSON);
}

/* ------------------------------------------------------------------ sheet set-up and menu */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Sidekick beta')
    .addItem('Set up this sheet', 'setUp')
    .addSeparator()
    .addItem('Export “Selected” emails for Google Play', 'exportSelectedForPlay')
    .addItem('Mark “Selected” as added to Play', 'markSelectedAsInvited')
    .addToUi();
}

/** Run once from the editor (or the menu). Safe to run again: it never deletes rows. */
function setUp() {
  setUpSheet_(SpreadsheetApp.getActiveSpreadsheet());
}

function setUpSheet_(ss) {
  const sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]).setFontWeight('bold');
  sheet.setFrozenRows(1);
  const rows = Math.max(sheet.getMaxRows() - 1, 1);
  sheet
    .getRange(2, COL.Status, rows, 1)
    .setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(STATUSES, true).setAllowInvalid(false).build());
  const dateRule = SpreadsheetApp.newDataValidation().requireDate().setAllowInvalid(true).build();
  sheet.getRange(2, COL['Added to Play'], rows, 1).setDataValidation(dateRule);
  sheet.getRange(2, COL['Mac token issued'], rows, 1).setDataValidation(dateRule);
  sheet.getRange(2, COL['Submitted at'], rows, 1).setNumberFormat('yyyy-mm-dd hh:mm');
  // Keep typed values (e.g. phone models, emails) as plain text.
  sheet.getRange(2, COL.Name, rows, COL['Most wants Sidekick to'] - COL.Name + 1).setNumberFormat('@');
  sheet.setColumnWidth(COL['Google account email'], 240);
  sheet.setColumnWidth(COL['Most wants Sidekick to'], 320);
  return sheet;
}

/**
 * Writes every "Selected" email (one per row, no header) to the "Play testers export" tab and shows
 * them comma-separated, ready to paste into Play Console → Testing → your track → Testers → email list.
 * The tab can also be downloaded as CSV (File → Download → .csv) for Play's "Upload CSV file".
 */
function exportSelectedForPlay() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const emails = selectedRows_(ss).map((r) => r.email);
  const out = ss.getSheetByName(EXPORT_SHEET_NAME) || ss.insertSheet(EXPORT_SHEET_NAME);
  out.clear();
  if (emails.length) out.getRange(1, 1, emails.length, 1).setValues(emails.map((e) => [e]));
  const ui = SpreadsheetApp.getUi();
  if (!emails.length) {
    ui.alert('No rows have Status “Selected”. Set Status to “Selected” for the people you want, then run this again.');
    return;
  }
  const html = HtmlService.createHtmlOutput(
    '<div style="font:14px/1.5 system-ui,sans-serif">' +
      '<p>' + emails.length + ' email(s). Paste into Play Console → Test and release → Testing → your closed track → Testers → your email list, or download the “' +
      EXPORT_SHEET_NAME + '” tab as CSV and upload it.</p>' +
      '<textarea style="width:100%;height:160px" readonly onclick="this.select()">' +
      emails.join(', ').replace(/</g, '&lt;') +
      '</textarea><p>Then use “Mark “Selected” as added to Play”.</p></div>',
  )
    .setWidth(520)
    .setHeight(320);
  ui.showModalDialog(html, 'Testers for Google Play');
}

/** Sets "Added to Play" to today and Status to "Invited" for every "Selected" row. */
function markSelectedAsInvited() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const rows = selectedRows_(ss);
  const ui = SpreadsheetApp.getUi();
  if (!rows.length) {
    ui.alert('No rows have Status “Selected”.');
    return;
  }
  const answer = ui.alert('Mark ' + rows.length + ' row(s) as added to Play today and set Status to “Invited”?', ui.ButtonSet.YES_NO);
  if (answer !== ui.Button.YES) return;
  const sheet = ss.getSheetByName(SHEET_NAME);
  const today = new Date();
  rows.forEach((r) => {
    sheet.getRange(r.row, COL['Added to Play']).setValue(today);
    sheet.getRange(r.row, COL.Status).setValue('Invited');
  });
}

function selectedRows_(ss) {
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) return [];
  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, HEADERS.length).getValues();
  const out = [];
  values.forEach((v, i) => {
    const email = String(v[COL['Google account email'] - 1]).replace(/^'/, '').trim();
    if (v[COL.Status - 1] === 'Selected' && EMAIL_RE.test(email)) out.push({ row: i + 2, email: email });
  });
  return out;
}
