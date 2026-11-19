/**
 * ItsDrDan End of Semester Surveys: Google Apps Script backend
 * Saves anonymous survey answers from games/survey/3a.html and 1a.html into a Google Sheet,
 * one tab per survey (e.g. "CHEM 3A Fall 2026"). No names, emails, or IDs are collected.
 *
 * SETUP (about 5 minutes):
 * 1. Make a new Google Sheet named "Semester Surveys".
 * 2. Extensions > Apps Script. Delete what's there and paste this whole file. Save.
 * 3. Deploy > New deployment > type "Web app".
 *      Execute as: Me      Who has access: Anyone
 *    Click Deploy, approve the permissions, and copy the Web app URL (ends in /exec).
 * 4. In survey/survey.js, paste that URL into ENDPOINT.
 *
 * If you change this script later: Deploy > Manage deployments > edit (pencil) >
 * Version: New version > Deploy. The URL stays the same.
 */

const SHEET_ID = "1fFnqJCJ1-OZM-7k_AHVp5oKoKvOOEcetv_z848aGsgI"; // the "Semester Surveys" Google Sheet (itsdrdantv); "" = the sheet this script is attached to
const ALLOWED = { "chem3a-fa26": "CHEM 3A Fall 2026", "chem1a-fa26": "CHEM 1A Fall 2026" };

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function doGet() { return json_({ ok: true }); }

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const d = JSON.parse(e.postData.contents);
    const tab = ALLOWED[d.survey];
    if (d.type !== "survey" || !tab) return json_({ ok: false, error: "Unknown survey." });
    const ss = SHEET_ID ? SpreadsheetApp.openById(SHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
    let sh = ss.getSheetByName(tab);
    if (!sh) {
      sh = ss.insertSheet(tab);
      sh.appendRow(["Submitted"]);
      sh.setFrozenRows(1);
    }
    // Header row = question text. Add a column the first time a question shows up.
    const lastCol = Math.max(1, sh.getLastColumn());
    const head = sh.getRange(1, 1, 1, lastCol).getValues()[0];
    const ids = (d.order || []).filter(id => d.labels && d.labels[id]);
    const colOf = {};
    ids.forEach(id => {
      const label = String(d.labels[id]).slice(0, 300);
      let i = head.indexOf(label);
      if (i === -1) { head.push(label); i = head.length - 1; }
      colOf[id] = i;
    });
    sh.getRange(1, 1, 1, head.length).setValues([head]).setFontWeight("bold").setBackground("#e8ebfb").setWrap(true);
    const row = new Array(head.length).fill("");
    row[0] = new Date();
    const a = d.answers || {};
    Object.keys(a).forEach(id => {
      if (!(id in colOf)) return;
      const v = a[id];
      const s = String(Array.isArray(v) ? v.join("; ") : v).slice(0, 5000); row[colOf[id]] = /^[=+\-@]/.test(s) ? "'" + s : s; // keep "- item" text from turning into a formula
    });
    sh.appendRow(row);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}
