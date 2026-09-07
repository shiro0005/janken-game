const SHEET_NAME = "クリア記録";
const MAX_NAME_LENGTH = 30;

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(5000);
    const name = normalizeName_(e && e.parameter ? e.parameter.name : "");
    if (!name) return response_("error", "名前を入力してください。");

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    if (!sheet) return response_("error", "記録シートが見つかりません。");

    const safeName = /^[=+\-@]/.test(name) ? `'${name}` : name;
    sheet.appendRow([safeName, new Date()]);
    sheet.getRange(sheet.getLastRow(), 2).setNumberFormat("yyyy/MM/dd");
    SpreadsheetApp.flush();
    return response_("success", "記録しました。");
  } catch (error) {
    return response_("error", "記録できませんでした。");
  } finally {
    try {
      lock.releaseLock();
    } catch (_) {
      // ロック取得前に失敗した場合は解放不要。
    }
  }
}

function doGet(e) {
  if (e && e.parameter && e.parameter.view === "records") return recordsPage_();
  return response_("ready", "クリア記録を受け付けています。");
}

function recordsPage_() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) return response_("error", "記録シートが見つかりません。");

  const rowCount = Math.max(sheet.getLastRow() - 1, 0);
  const records = rowCount
    ? sheet.getRange(2, 1, rowCount, 2).getDisplayValues().reverse()
    : [];
  const rows = records.map(([name, date]) =>
    `<tr><td>${escapeHtml_(name)}</td><td>${escapeHtml_(date)}</td></tr>`
  ).join("");
  const content = records.length
    ? `<table><thead><tr><th>クリア者名</th><th>クリア日</th></tr></thead><tbody>${rows}</tbody></table>`
    : '<p class="empty">まだクリア記録はありません。</p>';

  return HtmlService.createHtmlOutput(`<!doctype html>
    <html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <style>
      :root{font-family:"Yu Gothic","Hiragino Kaku Gothic ProN",system-ui,sans-serif;color:#202124;background:#fff}
      *{box-sizing:border-box}body{margin:0;padding:4px;background:#fff}table{width:100%;border-collapse:collapse}
      th,td{padding:12px 14px;border-bottom:1px solid #dce3ed;text-align:left}th{position:sticky;top:0;background:#edf3ff;color:#334a78;font-size:14px}
      td:last-child,th:last-child{width:9em;text-align:center;white-space:nowrap}tbody tr:nth-child(even){background:#fafbfd}
      .empty{margin:0;padding:32px 16px;color:#657080;text-align:center;font-weight:700}
    </style></head><body>${content}</body></html>`)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function normalizeName_(value) {
  const name = String(value || "")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return name.length >= 1 && name.length <= MAX_NAME_LENGTH ? name : "";
}

function response_(status, message) {
  return HtmlService.createHtmlOutput(
    `<!doctype html><meta charset="utf-8"><title>${status}</title><p>${message}</p>`
  );
}

function escapeHtml_(value) {
  return String(value || "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[character]);
}
