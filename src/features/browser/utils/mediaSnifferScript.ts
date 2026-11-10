export const INJECTED_MEDIA_SNIFFER_JS = `
(function() {
  if (window.__mediaFetchSnifferInstalled) return;
  window.__mediaFetchSnifferInstalled = true;

  var seen = {};
  var IGNORE_EXT_RE = /\\.(ts|m4s|vtt|srt|jpg|jpeg|png|webp|gif|svg|ico|css|woff2?|ttf|otf)(\\?|$)/i;
  var MEDIA_URL_RE = /\\.(mp4|m3u8|mpd|mp3|m4a|aac|webm|mov|ogg|flac|opus)(\\?|$|#)/i;
  var MEDIA_HINT_RE = /(mime=(video|audio)|\\/manifest\\b|playlist\\.m3u8|master\\.m3u8|index\\.m3u8)/i;

  function detectKind(url, contentType) {
    var lower = (url || '').toLowerCase();
    var ct = (contentType || '').toLowerCase();
    if (lower.indexOf('.m3u8') !== -1 || ct.indexOf('mpegurl') !== -1) return 'hls';
    if (lower.indexOf('.mpd') !== -1 || ct.indexOf('dash+xml') !== -1) return 'dash';
    if (lower.indexOf('.mp3') !== -1 || ct.indexOf('audio/mpeg') !== -1) return 'mp3';
    if (lower.indexOf('.m4a') !== -1 || lower.indexOf('.aac') !== -1 || lower.indexOf('.ogg') !== -1 || ct.indexOf('audio/') === 0) return 'audio';
    if (lower.indexOf('.mp4') !== -1 || ct.indexOf('video/mp4') !== -1) return 'mp4';
    return 'video';
  }

  function shouldIgnore(url) {
    if (!url || typeof url !== 'string') return true;
    if (url.indexOf('http://') !== 0 && url.indexOf('https://') !== 0) return true;
    if (url.indexOf('googlevideo.com/videoplayback') !== -1) return true;
    if (url.indexOf('doubleclick.net') !== -1 || url.indexOf('google-analytics') !== -1) return true;
    if (IGNORE_EXT_RE.test(url)) return true;
    return false;
  }

  function sanitizeHeaders(rawHeaders) {
    if (!rawHeaders) return undefined;
    var out = {};
    var count = 0;
    for (var k in rawHeaders) {
      if (!Object.prototype.hasOwnProperty.call(rawHeaders, k)) continue;
      var lowerK = k.toLowerCase();
      if (lowerK === 'authorization' || lowerK === 'x-auth-token' || lowerK === 'x-token' || lowerK === 'token' || lowerK === 'x-access-token' || lowerK === 'x-api-key' || lowerK === 'origin') {
        out[k] = String(rawHeaders[k]);
        count++;
      }
    }
    return count > 0 ? out : undefined;
  }

  function reportMedia(url, contentType, headers) {
    try {
      if (shouldIgnore(url)) return;
      var absUrl = new URL(url, window.location.href).toString();
      var isCandidate = MEDIA_URL_RE.test(absUrl) || MEDIA_HINT_RE.test(absUrl) || (contentType && (contentType.indexOf('video/') === 0 || contentType.indexOf('audio/') === 0 || contentType.indexOf('mpegurl') !== -1 || contentType.indexOf('dash+xml') !== -1));
      if (!isCandidate) return;

      var key = absUrl;
      if (seen[key] && !headers) return;
      seen[key] = true;

      if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'MEDIA_DETECTED',
          payload: {
            url: absUrl,
            kind: detectKind(absUrl, contentType),
            headers: sanitizeHeaders(headers),
            referer: window.location.href
          }
        }));
      }
    } catch (e) {}
  }

  // Hook window.fetch
  if (window.fetch) {
    var origFetch = window.fetch;
    window.fetch = function(input, init) {
      var reqUrl = typeof input === 'string' ? input : (input && input.url ? input.url : '');
      var capturedHeaders = {};
      try {
        if (init && init.headers) {
          if (typeof init.headers.forEach === 'function') {
            init.headers.forEach(function(v, k) { capturedHeaders[k] = v; });
          } else if (typeof init.headers === 'object') {
            for (var hk in init.headers) {
              if (Object.prototype.hasOwnProperty.call(init.headers, hk)) {
                capturedHeaders[hk] = init.headers[hk];
              }
            }
          }
        }
        if (input && typeof input === 'object' && input.headers && typeof input.headers.forEach === 'function') {
          input.headers.forEach(function(v, k) { capturedHeaders[k] = v; });
        }
        reportMedia(reqUrl, '', capturedHeaders);
      } catch (e) {}

      return origFetch.apply(this, arguments).then(function(response) {
        try {
          var ct = response && response.headers ? (response.headers.get('content-type') || '') : '';
          var finalUrl = (response && response.url) ? response.url : reqUrl;
          reportMedia(finalUrl, ct, capturedHeaders);
        } catch (e) {}
        return response;
      });
    };
  }

  // Hook XMLHttpRequest
  var OrigXHR = window.XMLHttpRequest;
  if (OrigXHR && OrigXHR.prototype) {
    var origOpen = OrigXHR.prototype.open;
    var origSetHeader = OrigXHR.prototype.setRequestHeader;
    var origSend = OrigXHR.prototype.send;

    OrigXHR.prototype.open = function(method, url) {
      this.__mfUrl = url;
      this.__mfHeaders = {};
      return origOpen.apply(this, arguments);
    };

    OrigXHR.prototype.setRequestHeader = function(name, value) {
      try {
        if (this.__mfHeaders && name) {
          this.__mfHeaders[name] = value;
        }
      } catch (e) {}
      return origSetHeader.apply(this, arguments);
    };

    OrigXHR.prototype.send = function() {
      var xhr = this;
      try {
        if (xhr.__mfUrl) {
          reportMedia(xhr.__mfUrl, '', xhr.__mfHeaders);
        }
        xhr.addEventListener('loadend', function() {
          try {
            var ct = xhr.getResponseHeader('content-type') || '';
            var finalUrl = xhr.responseURL || xhr.__mfUrl;
            reportMedia(finalUrl, ct, xhr.__mfHeaders);
          } catch (e) {}
        });
      } catch (e) {}
      return origSend.apply(this, arguments);
    };
  }

  function scanDomMedia() {
    try {
      var els = document.querySelectorAll('video, audio, source');
      for (var i = 0; i < els.length; i++) {
        var el = els[i];
        var candidate = el.currentSrc || el.src || el.getAttribute('src');
        if (candidate) {
          var tag = (el.tagName || '').toLowerCase();
          var fallbackMime = tag === 'audio' ? 'audio/mpeg' : 'video/mp4';
          reportMedia(candidate, fallbackMime, null);
        }
      }
    } catch (e) {}
  }

  document.addEventListener('loadstart', function(ev) {
    try {
      var t = ev && ev.target;
      if (t && (t.tagName === 'VIDEO' || t.tagName === 'AUDIO')) {
        var src = t.currentSrc || t.src;
        if (src) {
          reportMedia(src, t.tagName === 'AUDIO' ? 'audio/mpeg' : 'video/mp4', null);
        }
      }
    } catch (e) {}
  }, true);

  setInterval(scanDomMedia, 2500);
})();
true;
`;

