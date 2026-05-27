/**
 * Loads the BudBook bundle. With ?mock=1 or ?demo=1:
 * - Fetches normalized payloads from the Next API (same shapes as Base44 entities)
 * - Patches fetch + XMLHttpRequest so GET .../entities/... returns mock data even when the
 *   bundle targets https://base44.app (see resolveMockEntityGet parity in lib/budbook-mock).
 */
(function () {
  var MAIN_SRC = '/budbook-app/assets/index-DuvVhIRa.js';
  var PAYLOADS_SRC = '/api/internal/budbook-mock/payloads';

  function isMockMode() {
    try {
      var sp = new URLSearchParams(window.location.search);
      if (sp.get('mock') === '1' || sp.get('demo') === '1') return true;
      var h = window.location.hash || '';
      return /(?:^|[&#])mock=1(?:&|$)/.test(h) || /(?:^|[&#])demo=1(?:&|$)/.test(h);
    } catch (e) {
      return false;
    }
  }

  function injectMain() {
    if (document.querySelector('script[data-budbook-main]')) return;
    var s = document.createElement('script');
    s.type = 'module';
    s.crossOrigin = '';
    s.src = MAIN_SRC;
    s.setAttribute('data-budbook-main', '1');
    document.head.appendChild(s);
  }

  /** Keep in sync with cupr_app/lib/budbook-mock/resolveMockEntityGet.ts */
  function resolveMockEntityGet(urlStr, payloads) {
    var pathname = '';
    var search = '';
    try {
      var u = new URL(urlStr);
      pathname = u.pathname;
      search = u.search;
    } catch (e) {
      var cut = urlStr.indexOf('?');
      pathname = cut >= 0 ? urlStr.slice(0, cut) : urlStr;
      search = cut >= 0 ? urlStr.slice(cut) : '';
    }
    var withoutQs = pathname.split('?')[0];
    var m = withoutQs.match(/\/entities\/([^/?]+)(?:\/([^/?]+))?\/?$/);
    if (!m) return null;

    var entity = m[1];
    var id = m[2];
    var sp = new URLSearchParams(search);

    if (entity === 'User' && id === 'me') {
      return payloads.user;
    }
    if (entity === 'Product') {
      if (!id) return payloads.products;
      var pr = payloads.products.find(function (p) {
        return String(p.id) === id;
      });
      return pr == null ? null : pr;
    }
    if (entity === 'Session') {
      if (!id) {
        var limitRaw = parseInt(sp.get('limit') || '50', 10);
        var limit = Number.isFinite(limitRaw)
          ? Math.min(100, Math.max(1, limitRaw))
          : 50;
        return payloads.sessions.slice(0, limit);
      }
      var se = payloads.sessions.find(function (s) {
        return String(s.id) === id;
      });
      return se == null ? null : se;
    }
    if (entity === 'UserInventory' && !id) {
      return payloads.inventory;
    }
    if (entity === 'Dispensary' && !id) {
      return payloads.dispensaries;
    }
    if (entity === 'Accessory' && !id) {
      return payloads.accessories;
    }
    return null;
  }

  function looksLikeEntityUrl(url) {
    return typeof url === 'string' && url.indexOf('/entities/') !== -1;
  }

  function installFetchMock(payloads) {
    var origFetch = window.fetch.bind(window);
    window.fetch = function (input, init) {
      var url =
        typeof input === 'string'
          ? input
          : input && typeof input.url === 'string'
            ? input.url
            : '';
      var method = (
        init && init.method
          ? init.method
          : typeof input !== 'string' && input.method
            ? input.method
            : 'GET'
      ).toUpperCase();
      if (method !== 'GET' || !looksLikeEntityUrl(url)) {
        return origFetch(input, init);
      }
      var data = resolveMockEntityGet(url, payloads);
      if (data === null) {
        return Promise.resolve(
          new Response(JSON.stringify({ message: 'Not found' }), {
            status: 404,
            statusText: 'Not Found',
            headers: { 'Content-Type': 'application/json; charset=utf-8' },
          }),
        );
      }
      return Promise.resolve(
        new Response(JSON.stringify(data), {
          status: 200,
          statusText: 'OK',
          headers: { 'Content-Type': 'application/json; charset=utf-8' },
        })
      );
    };
  }

  function installXhrMock(payloads) {
    var origOpen = XMLHttpRequest.prototype.open;
    var origSend = XMLHttpRequest.prototype.send;
    var origGetResponseHeader = XMLHttpRequest.prototype.getResponseHeader;
    var origGetAllResponseHeaders = XMLHttpRequest.prototype.getAllResponseHeaders;

    XMLHttpRequest.prototype.open = function (method, url) {
      this.__budbookMockMethod = method;
      this.__budbookMockUrl = typeof url === 'string' ? url : String(url);
      return origOpen.apply(this, arguments);
    };

    XMLHttpRequest.prototype.getResponseHeader = function (name) {
      if (this.__budbookMockBody != null && String(name).toLowerCase() === 'content-type') {
        return 'application/json; charset=utf-8';
      }
      return origGetResponseHeader.apply(this, arguments);
    };

    XMLHttpRequest.prototype.getAllResponseHeaders = function () {
      if (this.__budbookMockBody != null) {
        // Axios parses this blob; include CRLF so MIME sniffing matches browsers/XHR.
        return 'content-type: application/json; charset=utf-8\r\n';
      }
      return origGetAllResponseHeaders.apply(this, arguments);
    };

    XMLHttpRequest.prototype.send = function () {
      var xhr = this;
      var url = xhr.__budbookMockUrl || '';
      var method = String(xhr.__budbookMockMethod || 'GET').toUpperCase();

      if (method !== 'GET' || !looksLikeEntityUrl(url)) {
        return origSend.apply(xhr, arguments);
      }

      var data = resolveMockEntityGet(url, payloads);
      var status = 200;
      var bodyText =
        data === null ? JSON.stringify({ message: 'Not found' }) : JSON.stringify(data);
      if (data === null) status = 404;

      xhr.__budbookMockBody = bodyText;

      // Parse for every status (200, 404, …): mock bodies are always JSON. Axios may skip
      // JSON.parse when responseType is set — same object shape expected on errors as on success.
      var parsedBody = null;
      try {
        parsedBody = JSON.parse(bodyText);
      } catch (eParse) {
        parsedBody = null;
      }

      queueMicrotask(function () {
        xhr.readyState = 4;
        xhr.status = status;
        xhr.statusText = status === 404 ? 'Not Found' : 'OK';
        try {
          xhr.responseURL = typeof url === 'string' ? url : String(url);
        } catch (eUrl) {}

        // Axios default transformResponse skips JSON.parse when config.responseType is set (e.g.
        // "text"), leaving data as a string — Session.list().map then throws. Expose parsed JSON
        // on responseText/response so transformResponse treats data as non-string and passes it through.
        if (parsedBody !== null) {
          try {
            Object.defineProperty(xhr, 'responseText', {
              configurable: true,
              enumerable: true,
              get: function () {
                return parsedBody;
              },
            });
            Object.defineProperty(xhr, 'response', {
              configurable: true,
              enumerable: true,
              get: function () {
                return parsedBody;
              },
            });
          } catch (eDef) {
            xhr.responseText = bodyText;
            xhr.response = bodyText;
          }
        } else {
          xhr.responseText = bodyText;
          xhr.response = bodyText;
        }

        // Axios 1.x uses onloadend when available (not only onreadystatechange)
        if (typeof xhr.onloadend === 'function') {
          xhr.onloadend.call(xhr);
        } else {
          if (typeof xhr.onreadystatechange === 'function') xhr.onreadystatechange.call(xhr);
          if (typeof xhr.onload === 'function') xhr.onload.call(xhr);
        }
      });
    };
  }

  try {
    if (!isMockMode()) {
      injectMain();
      return;
    }

    fetch(PAYLOADS_SRC)
      .then(function (r) {
        return r.json();
      })
      .then(function (payloads) {
        window.__BUDBOOK_MOCK_OVERVIEW__ = payloads.overview;
        installFetchMock(payloads);
        installXhrMock(payloads);
        injectMain();
      })
      .catch(function (err) {
        console.error('[BudBook mock] Failed to load mock payloads:', err);
        injectMain();
      });
  } catch (e) {
    console.error('[BudBook mock] Bootstrap execution failed:', e);
    injectMain();
  }
})();
