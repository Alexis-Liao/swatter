(function () {
  const TYPE_LABELS = {
    regular: '普通会员 — 流动的水生生物',
    student: '学生会员 — 未脱水的陆地生物',
  };

  function getScriptUrl() {
    const cfg = window.SHUIHUI_CONFIG;
    const url = cfg && cfg.googleScriptUrl;
    if (!url || url.includes('YOUR_')) return null;
    return url;
  }

  /** JSONP — 兼容 iOS / 移动端 Safari */
  function jsonpRequest(params) {
    return new Promise(function (resolve, reject) {
      const baseUrl = getScriptUrl();
      if (!baseUrl) {
        reject(new Error('NOT_CONFIGURED'));
        return;
      }

      const cb = '_sh_' + Date.now() + '_' + Math.random().toString(36).slice(2);
      const script = document.createElement('script');
      const timer = setTimeout(function () {
        cleanup();
        reject(new Error('请求超时，请检查网络后重试'));
      }, 20000);

      function cleanup() {
        clearTimeout(timer);
        try { delete window[cb]; } catch (e) { window[cb] = undefined; }
        if (script.parentNode) script.parentNode.removeChild(script);
      }

      window[cb] = function (result) {
        cleanup();
        if (result && result.ok) {
          resolve(result.data);
        } else {
          reject(new Error((result && result.error) || '请求失败'));
        }
      };

      const qs = Object.keys(params).map(function (key) {
        var val = params[key];
        return encodeURIComponent(key) + '=' + encodeURIComponent(val == null ? '' : val);
      }).join('&');

      script.src = baseUrl + '?' + qs + '&callback=' + encodeURIComponent(cb) + '&_=' + Date.now();
      script.onerror = function () {
        cleanup();
        reject(new Error('网络请求失败'));
      };
      document.head.appendChild(script);
    });
  }

  async function fetchGet(action) {
    const url = getScriptUrl();
    const res = await fetch(url + '?action=' + encodeURIComponent(action) + '&_=' + Date.now(), {
      method: 'GET',
      redirect: 'follow',
      cache: 'no-store',
    });
    const json = await res.json();
    if (!json.ok) throw new Error(json.error || '读取失败');
    return json.data;
  }

  async function get(action) {
    try {
      return await jsonpRequest({ action: action });
    } catch (jsonpErr) {
      return fetchGet(action);
    }
  }

  function buildSubmitParams(payload) {
    if (payload.type === 'birthday_wish') {
      return { action: 'submit', type: 'birthday_wish', text: payload.text, author: payload.author };
    }
    if (payload.type === 'birthday_interaction') {
      return {
        action: 'submit',
        type: 'birthday_interaction',
        interaction: payload.action,
        detail: payload.detail || '',
      };
    }
    return {
      action: 'submit',
      type: 'application',
      name: payload.name,
      member_type: payload.member_type,
      contact: payload.contact,
      reason: payload.reason || '',
    };
  }

  async function post(payload) {
    const url = getScriptUrl();
    if (!url) throw new Error('NOT_CONFIGURED');

    try {
      const res = await fetch(url, {
        method: 'POST',
        redirect: 'follow',
        cache: 'no-store',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || '请求失败');
      return json;
    } catch (fetchErr) {
      // 移动端 Safari POST 失败时，改用 GET + JSONP
      await jsonpRequest(buildSubmitParams(payload));
    }
  }

  window.ShuihuiDB = {
    version: 3,

    isConfigured() {
      return getScriptUrl() !== null;
    },

    getTypeLabel(value) {
      return TYPE_LABELS[value] || value;
    },

    async submitApplication(data) {
      await post({
        name: data.name.trim(),
        member_type: data.member_type,
        contact: data.contact.trim(),
        reason: data.reason ? data.reason.trim() : '',
      });
    },

    async listApplications() {
      var data = await get('list');
      return data || [];
    },

    async getBirthdayData() {
      return get('birthday');
    },

    async submitBirthdayWish(text, author) {
      await post({
        type: 'birthday_wish',
        text: text.trim(),
        author: (author || '').trim(),
      });
    },

    async logBirthdayInteraction(action, detail) {
      await post({
        type: 'birthday_interaction',
        action: action,
        detail: detail || '',
      });
    },
  };
})();
