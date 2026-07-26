(function () {
  const TYPE_LABELS = {
    regular: '普通会员 — 流动的水生生物',
    student: '学生会员 — 未脱水的陆地生物',
  };

  function getScriptUrl() {
    const url = window.SHUIHUI_CONFIG?.googleScriptUrl;
    if (!url || url.includes('YOUR_')) return null;
    return url;
  }

  async function post(payload) {
    const url = getScriptUrl();
    if (!url) throw new Error('NOT_CONFIGURED');

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });

    const json = await res.json();
    if (!json.ok) throw new Error(json.error || '请求失败');
    return json;
  }

  async function get(action) {
    const url = getScriptUrl();
    if (!url) throw new Error('NOT_CONFIGURED');

    const res = await fetch(`${url}?action=${action}`);
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || '读取失败');
    return json.data;
  }

  window.ShuihuiDB = {
    isConfigured() {
      return getScriptUrl() !== null;
    },

    getTypeLabel(value) {
      return TYPE_LABELS[value] || value;
    },

    async submitApplication({ name, member_type, contact, reason }) {
      await post({
        name: name.trim(),
        member_type,
        contact: contact.trim(),
        reason: reason?.trim() || '',
      });
    },

    async listApplications() {
      return get('list');
    },

    async getBirthdayData() {
      return get('birthday');
    },

    async submitBirthdayWish(text) {
      await post({ type: 'birthday_wish', text: text.trim() });
    },

    async logBirthdayInteraction(action, detail) {
      await post({
        type: 'birthday_interaction',
        action,
        detail: detail || '',
      });
    },
  };
})();
