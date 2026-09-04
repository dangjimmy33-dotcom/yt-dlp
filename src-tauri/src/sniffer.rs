use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::time::Duration;
use tauri::{AppHandle, Emitter, WebviewUrl, WebviewWindowBuilder};
use tokio::sync::oneshot;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SniffedStreamPayload {
    pub stream_url: String,
    pub page_url: String,
    pub page_title: String,
    pub source_type: String,
}

pub const SNIFFER_INJECTION_SCRIPT: &str = r#"
(function() {
  if (window.__FLOWDL_SNIFFER_INITIALIZED__) return;
  window.__FLOWDL_SNIFFER_INITIALIZED__ = true;

  const captured = new Set();
  let committed = false;
  let pendingCandidate = null;
  let pendingTimer = null;

  function absoluteUrl(raw) {
    try {
      return new URL(String(raw), window.location.href).href;
    } catch (_) {
      return String(raw || '');
    }
  }

  function classifyMedia(url, contentType) {
    if (!url || typeof url !== 'string') return null;
    if (url.startsWith('blob:') || url.startsWith('data:') || url.startsWith('flowdl:')) return null;

    const ct = String(contentType || '').toLowerCase();
    let pathname = '';
    try { pathname = new URL(url, window.location.href).pathname.toLowerCase(); }
    catch (_) { pathname = url.toLowerCase().split('?')[0].split('#')[0]; }

    // Ignore HLS fragments. A .ts fragment is not a downloadable video by itself.
    if (/\.(?:ts|m4s|aac|vtt)(?:$|\?)/i.test(url)) return null;

    if (pathname.endsWith('.m3u8') || ct.includes('mpegurl')) {
      const lower = url.toLowerCase();
      const score = lower.includes('master') ? 130 : lower.includes('playlist') || lower.includes('index') ? 125 : 120;
      return { kind: 'hls', score };
    }
    if (pathname.endsWith('.mpd') || ct.includes('dash+xml')) return { kind: 'dash', score: 115 };
    if (pathname.endsWith('.mp4') || pathname.endsWith('.m4v') || ct.startsWith('video/mp4')) return { kind: 'mp4', score: 90 };
    if (pathname.endsWith('.webm') || ct.startsWith('video/webm')) return { kind: 'webm', score: 88 };
    if (pathname.endsWith('.flv') || ct.startsWith('video/x-flv')) return { kind: 'flv', score: 82 };
    if (ct.startsWith('video/')) return { kind: 'video', score: 75 };
    return null;
  }

  function showFloatingBadge(url, kind) {
    try {
      if (document.getElementById('__flowdl_badge__')) return;
      const badge = document.createElement('div');
      badge.id = '__flowdl_badge__';
      badge.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:2147483647;background:rgba(15,23,42,.96);backdrop-filter:blur(16px);border:2px solid #6366f1;border-radius:16px;padding:14px 20px;color:#fff;font-family:system-ui,-apple-system,sans-serif;box-shadow:0 20px 40px rgba(0,0,0,.8),0 0 25px rgba(99,102,241,.6);display:flex;align-items:center;gap:14px;cursor:pointer;user-select:none;max-width:420px;';
      badge.innerHTML = `
        <div style="width:12px;height:12px;border-radius:50%;background:#10b981;box-shadow:0 0 12px #10b981;flex-shrink:0;"></div>
        <div>
          <div style="font-size:13px;font-weight:700;color:#e0e7ff;">ĐÃ BẮT ĐƯỢC LUỒNG ${String(kind || 'VIDEO').toUpperCase()}</div>
          <div style="font-size:11px;color:#94a3b8;margin-top:2px;">Đã gửi sang Studio và thêm vào hàng đợi tải</div>
        </div>`;
      badge.onclick = () => { try { navigator.clipboard.writeText(url); } catch (_) {} };
      (document.body || document.documentElement).appendChild(badge);
    } catch (_) {}
  }

  function commitCandidate() {
    if (committed || !pendingCandidate) return;
    const c = pendingCandidate;
    pendingCandidate = null;
    committed = true;
    captured.add(c.url);

    console.log('[FLOWDL Sniffer Intercepted]', c.type, c.kind, c.url);
    try { navigator.clipboard.writeText(c.url); } catch (_) {}

    try {
      const payload = encodeURIComponent(JSON.stringify({
        stream_url: c.url,
        // For an iframe player this intentionally points at the player document,
        // which is normally the correct HTTP Referer for the media request.
        page_url: window.location.href,
        page_title: document.title || 'Video Stream',
        source_type: `${c.type}:${c.kind}`
      }));
      const bridge = document.createElement('iframe');
      bridge.style.display = 'none';
      bridge.src = 'flowdl://stream?data=' + payload;
      (document.body || document.documentElement).appendChild(bridge);
      setTimeout(() => bridge.remove(), 1500);
    } catch (_) {}

    showFloatingBadge(c.url, c.kind);
  }

  function queueCandidate(rawUrl, type, contentType) {
    if (committed) return;
    const url = absoluteUrl(rawUrl);
    if (!url || captured.has(url)) return;

    const media = classifyMedia(url, contentType);
    if (!media) return;

    const next = { url, type, kind: media.kind, score: media.score };
    if (!pendingCandidate || next.score > pendingCandidate.score) pendingCandidate = next;

    if (pendingTimer) clearTimeout(pendingTimer);
    // Give the player a short window to reveal a master playlist before committing.
    pendingTimer = setTimeout(commitCandidate, media.kind === 'hls' || media.kind === 'dash' ? 650 : 1400);
  }

  // 1. fetch(): inspect both the request URL and the response Content-Type/final URL.
  const nativeFetch = window.fetch;
  if (typeof nativeFetch === 'function') {
    window.fetch = function(...args) {
      try {
        const req = args[0];
        const u = typeof req === 'string' ? req : (req && req.url ? req.url : '');
        if (u) queueCandidate(u, 'fetch_request', '');
      } catch (_) {}

      return nativeFetch.apply(this, args).then((response) => {
        try {
          const ct = response.headers && response.headers.get ? (response.headers.get('content-type') || '') : '';
          queueCandidate(response.url || '', 'fetch_response', ct);
        } catch (_) {}
        return response;
      });
    };
  }

  // 2. XMLHttpRequest: inspect URL and response headers.
  const nativeOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    try {
      const requestUrl = absoluteUrl(url);
      queueCandidate(requestUrl, 'xhr_request', '');
      this.addEventListener('loadend', () => {
        try {
          const ct = this.getResponseHeader('content-type') || '';
          queueCandidate(this.responseURL || requestUrl, 'xhr_response', ct);
        } catch (_) {}
      }, { once: true });
    } catch (_) {}
    return nativeOpen.call(this, method, url, ...rest);
  };

  // 3. Media element sources.
  const nativePlay = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function(...args) {
    try {
      if (this.currentSrc) queueCandidate(this.currentSrc, 'media_current_src', '');
      if (this.src) queueCandidate(this.src, 'media_src', '');
    } catch (_) {}
    return nativePlay.apply(this, args);
  };

  const nativeSetAttribute = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function(name, value) {
    try {
      if ((name === 'src' || name === 'data-src') && value) queueCandidate(value, 'set_attribute', '');
    } catch (_) {}
    return nativeSetAttribute.call(this, name, value);
  };

  // 4. Hls.js may be loaded after our init script, so retry until its prototype exists.
  function hookHlsJs() {
    try {
      const Hls = window.Hls;
      if (!Hls || !Hls.prototype || Hls.prototype.__FLOWDL_HOOKED__) return;
      const nativeLoadSource = Hls.prototype.loadSource;
      if (typeof nativeLoadSource !== 'function') return;
      Hls.prototype.__FLOWDL_HOOKED__ = true;
      Hls.prototype.loadSource = function(url) {
        try { queueCandidate(url, 'hlsjs', 'application/vnd.apple.mpegurl'); } catch (_) {}
        return nativeLoadSource.apply(this, arguments);
      };
    } catch (_) {}
  }
  hookHlsJs();
  setInterval(hookHlsJs, 500);

  // 5. Resource Timing sees requests not made through the page's own fetch/XHR wrappers.
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        try { queueCandidate(entry.name, 'performance', ''); } catch (_) {}
      }
    });
    observer.observe({ entryTypes: ['resource'] });
  } catch (_) {}

  // 6. DOM/player scan for libraries that expose the media URL directly.
  function scanDOM() {
    if (committed) return;
    try {
      document.querySelectorAll('video, audio, source').forEach((el) => {
        if (el.currentSrc) queueCandidate(el.currentSrc, 'dom_current_src', '');
        if (el.src) queueCandidate(el.src, 'dom_src', '');
      });

      if (window.PLAYER_DATA && window.PLAYER_DATA.link) queueCandidate(window.PLAYER_DATA.link, 'player_data', '');
      if (window.player && window.player.src) queueCandidate(window.player.src, 'player_var', '');

      if (window.jwplayer && typeof window.jwplayer === 'function') {
        try {
          const jw = window.jwplayer();
          const pl = jw && typeof jw.getPlaylist === 'function' ? jw.getPlaylist() : null;
          if (Array.isArray(pl) && pl[0]) {
            if (pl[0].file) queueCandidate(pl[0].file, 'jwplayer_file', '');
            if (Array.isArray(pl[0].sources)) {
              pl[0].sources.forEach((src) => src && src.file && queueCandidate(src.file, 'jwplayer_source', ''));
            }
          }
        } catch (_) {}
      }
    } catch (_) {}
  }

  scanDOM();
  setInterval(scanDOM, 700);
})();
"#;

pub async fn sniff_url_stream(
    app: AppHandle,
    target_url: &str,
    timeout_secs: u64,
) -> Result<SniffedStreamPayload, String> {
    let parsed_url = url::Url::parse(target_url)
        .map_err(|e| format!("URL không hợp lệ: {e}"))?;

    let now_ms = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis();
    let window_label = format!("sniffer_{now_ms}");

    let (tx, rx) = oneshot::channel::<SniffedStreamPayload>();
    let tx_arc = Arc::new(tokio::sync::Mutex::new(Some(tx)));

    let tx_for_nav = tx_arc.clone();
    let app_handle_clone = app.clone();

    let sniffer_window = WebviewWindowBuilder::new(
        &app,
        &window_label,
        WebviewUrl::External(parsed_url),
    )
    .title("Auto Stream Sniffer")
    .inner_size(800.0, 600.0)
    .visible(false)
    .initialization_script_for_all_frames(SNIFFER_INJECTION_SCRIPT)
    .on_navigation(move |url| {
        if url.scheme() == "flowdl" {
            for (k, v) in url.query_pairs() {
                if k == "data" {
                    if let Ok(payload) = serde_json::from_str::<SniffedStreamPayload>(&v) {
                        let _ = app_handle_clone.emit_to("main", "on-sniffed-stream", payload.clone());
                        let tx_inner = tx_for_nav.clone();
                        tokio::spawn(async move {
                            let mut lock = tx_inner.lock().await;
                            if let Some(sender) = lock.take() {
                                let _ = sender.send(payload);
                            }
                        });
                    }
                }
            }
            return false;
        }
        true
    })
    .build();

    let win = match sniffer_window {
        Ok(w) => w,
        Err(e) => {
            return Err(format!("Không thể tạo trình phân tích ngầm: {e}"));
        }
    };

    let result = tokio::select! {
        res = rx => {
            match res {
                Ok(payload) => Ok(payload),
                Err(_) => Err("Không nhận được dữ liệu luồng từ trình duyệt ngầm".to_string()),
            }
        }
        _ = tokio::time::sleep(Duration::from_secs(timeout_secs)) => {
            Err(format!("Hết thời gian ({timeout_secs}s) chờ bóc tách luồng từ website"))
        }
    };

    let _ = win.close();
    result
}

pub fn create_sniffer_browser_window(app: &AppHandle, target_url: url::Url) -> Result<tauri::WebviewWindow, String> {
    let now_ms = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis();
    let label = format!("browser_{now_ms}");
    let app_handle_clone = app.clone();

    WebviewWindowBuilder::new(app, &label, WebviewUrl::External(target_url))
        .title("Trình duyệt bắt luồng Video - YT-DLP Studio")
        .inner_size(1180.0, 780.0)
        .center()
        .initialization_script_for_all_frames(SNIFFER_INJECTION_SCRIPT)
        .on_navigation(move |url| {
            if url.scheme() == "flowdl" {
                for (k, v) in url.query_pairs() {
                    if k == "data" {
                        if let Ok(payload) = serde_json::from_str::<SniffedStreamPayload>(&v) {
                            let _ = app_handle_clone.emit_to("main", "on-sniffed-stream", payload);
                        }
                    }
                }
                return false;
            }
            true
        })
        .build()
        .map_err(|e| format!("Không thể mở trình duyệt bắt luồng: {e}"))
}
