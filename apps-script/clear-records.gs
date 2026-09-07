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

function doGet() {
  return response_("ready", "クリア記録を受け付けています。");
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
