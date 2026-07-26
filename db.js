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

  window.ShuihuiDB = {
    isConfigured() {
      return getScriptUrl() !== null;
    },

    getTypeLabel(value) {
      return TYPE_LABELS[value] || value;
    },

    async submitApplication({ name, member_type, contact, reason }) {
      const url = getScriptUrl();
      if (!url) throw new Error('NOT_CONFIGURED');

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          name: name.trim(),
          member_type,
          contact: contact.trim(),
          reason: reason?.trim() || '',
        }),
      });

      const json = await res.json();
      if (!json.ok) throw new Error(json.error || '提交失败');
    },

    async listApplications() {
      const url = getScriptUrl();
      if (!url) throw new Error('NOT_CONFIGURED');

      const res = await fetch(`${url}?action=list`);
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || '读取失败');
      return json.data || [];
    },
  };
})();
