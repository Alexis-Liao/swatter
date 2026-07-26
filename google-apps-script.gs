/**
 * 山寨水会 · Google 表格后端
 *
 * 工作表（首次运行自动创建）：
 * - applications      入会申请
 * - birthday_wishes   生日祝福墙
 * - birthday_logs     生日互动记录（用于统计水庆能量）
 *
 * 更新代码后：部署 → 管理部署 → 编辑 → 新版本 → 部署
 */

const SHEETS = {
  applications: 'applications',
  birthdayWishes: 'birthday_wishes',
  birthdayLogs: 'birthday_logs',
};

function doGet(e) {
  const action = e.parameter.action;

  if (action === 'list') {
    return jsonOutput({ ok: true, data: getPublicApplications() });
  }

  if (action === 'birthday') {
    return jsonOutput({ ok: true, data: getBirthdayData() });
  }

  return jsonOutput({ ok: false, error: 'Unknown action' });
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);

    if (body.type === 'birthday_wish') {
      appendBirthdayWish(body);
      return jsonOutput({ ok: true });
    }

    if (body.type === 'birthday_interaction') {
      appendBirthdayInteraction(body);
      return jsonOutput({ ok: true });
    }

    appendApplication(body);
    return jsonOutput({ ok: true });
  } catch (err) {
    return jsonOutput({ ok: false, error: String(err) });
  }
}

function getOrCreateSheet_(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);

  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function appendApplication(data) {
  const name = String(data.name || '').trim();
  const memberType = String(data.member_type || '').trim();
  const contact = String(data.contact || '').trim();
  const reason = String(data.reason || '').trim();

  if (!name || !memberType || !contact) {
    throw new Error('缺少必填字段');
  }

  if (memberType !== 'regular' && memberType !== 'student') {
    throw new Error('无效的会员类型');
  }

  const sheet = getOrCreateSheet_(SHEETS.applications, [
    'created_at', 'name', 'member_type', 'contact', 'reason',
  ]);

  sheet.appendRow([new Date().toISOString(), name, memberType, contact, reason]);
}

function getPublicApplications() {
  const sheet = getOrCreateSheet_(SHEETS.applications, [
    'created_at', 'name', 'member_type', 'contact', 'reason',
  ]);
  const values = sheet.getDataRange().getValues();

  if (values.length <= 1) return [];

  return values
    .slice(1)
    .map(function (row, index) {
      return {
        id: index + 1,
        created_at: row[0],
        name: row[1],
        member_type: row[2],
        reason: row[4] || null,
      };
    })
    .reverse();
}

function appendBirthdayWish(data) {
  const text = String(data.text || '').trim();
  if (!text) throw new Error('祝福不能为空');
  if (text.length > 120) throw new Error('祝福过长');

  const sheet = getOrCreateSheet_(SHEETS.birthdayWishes, ['created_at', 'text']);
  sheet.appendRow([new Date().toISOString(), text]);
}

function appendBirthdayInteraction(data) {
  const action = String(data.action || '').trim();
  const detail = String(data.detail || '').trim();

  if (!action) throw new Error('缺少互动类型');

  const sheet = getOrCreateSheet_(SHEETS.birthdayLogs, ['created_at', 'action', 'detail']);
  sheet.appendRow([new Date().toISOString(), action, detail]);
}

function getBirthdayData() {
  const wishSheet = getOrCreateSheet_(SHEETS.birthdayWishes, ['created_at', 'text']);
  const logSheet = getOrCreateSheet_(SHEETS.birthdayLogs, ['created_at', 'action', 'detail']);

  const wishValues = wishSheet.getDataRange().getValues();
  const logValues = logSheet.getDataRange().getValues();

  const wishes = wishValues.length <= 1
    ? []
    : wishValues.slice(1).map(function (row, index) {
        return { id: index + 1, created_at: row[0], text: row[1] };
      }).reverse();

  const totalJoy = Math.max(0, logValues.length - 1);

  const recentBlessings = logValues.length <= 1
    ? []
    : logValues
        .slice(1)
        .filter(function (row) { return row[1] === 'bless' && row[2]; })
        .map(function (row) { return { created_at: row[0], text: row[2] }; })
        .reverse()
        .slice(0, 8);

  return { wishes: wishes, totalJoy: totalJoy, recentBlessings: recentBlessings };
}

function jsonOutput(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
