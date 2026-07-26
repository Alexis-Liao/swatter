/**
 * 山寨水会 · Google 表格后端
 *
 * 设置步骤：
 * 1. 打开 Google 表格新建一个表格（或打开已有表格）
 * 2. 菜单：扩展程序 → Apps Script
 * 3. 删除默认代码，粘贴本文件全部内容
 * 4. 保存项目（名称如「水会入会接口」）
 * 5. 点击「部署」→「新建部署」
 *    - 类型：Web 应用
 *    - 说明：水会入会
 *    - 执行身份：我
 *    - 谁可以访问：任何人（包括匿名用户）
 * 6. 授权后复制 Web 应用 URL
 * 7. 粘贴到网站 config.js 的 googleScriptUrl
 *
 * 首次运行会自动创建名为 applications 的工作表，列：
 * created_at | name | member_type | contact | reason
 */

const SHEET_NAME = 'applications';

function doGet(e) {
  const action = e.parameter.action;

  if (action === 'list') {
    return jsonOutput({ ok: true, data: getPublicApplications() });
  }

  return jsonOutput({ ok: false, error: 'Unknown action' });
}

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    appendApplication(body);
    return jsonOutput({ ok: true });
  } catch (err) {
    return jsonOutput({ ok: false, error: String(err) });
  }
}

function getOrCreateSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(['created_at', 'name', 'member_type', 'contact', 'reason']);
    sheet.getRange(1, 1, 1, 5).setFontWeight('bold');
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

  const sheet = getOrCreateSheet_();
  sheet.appendRow([
    new Date().toISOString(),
    name,
    memberType,
    contact,
    reason,
  ]);
}

function getPublicApplications() {
  const sheet = getOrCreateSheet_();
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

function jsonOutput(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
