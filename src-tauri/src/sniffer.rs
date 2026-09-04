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

  function isMediaStream(url) {
    if (!url || typeof url !== 'string') return false;
    if (url.startsWith('blob:') || url.startsWith('data:') || url.startsWith('flowdl:')) return false;
    const clean = url.toLowerCase().split('?')[0];
    return clean.endsWith('.m3u8') ||
           clean.endsWith('.mp4') ||
           clean.endsWith('.mpd') ||
           clean.endsWith('.flv') ||
           clean.endsWith('.m4v') ||
           clean.endsWith('.webm') ||
           clean.endsWith('.ts') ||
           url.includes('.m3u8') ||
           url.includes('/hls/') ||
           url.includes('playlist.m3u8') ||
           url.includes('master.m3u8') ||
           url.includes('manifest.mpd') ||
           url.includes('stream.googleapiscdn.com');
  }

  function showFloatingBadge(url, type) {
    try {
      try { navigator.clipboard.writeText(url); } catch(e) {}
      if (document.getElementById('__flowdl_badge__')) return;
      const badge = document.createElement('div');
      badge.id = '__flowdl_badge__';
      badge.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:2147483647;background:rgba(15,23,42,0.96);backdrop-filter:blur(16px);border:2px solid #6366f1;border-radius:16px;padding:14px 20px;color:#fff;font-family:system-ui,-apple-system,sans-serif;box-shadow:0 20px 40px rgba(0,0,0,0.8),0 0 25px rgba(99,102,241,0.6);display:flex;align-items:center;gap:14px;cursor:pointer;user-select:none;';
      badge.innerHTML = `
        <div style="width:12px;height:12px;border-radius:50%;background:#10b981;box-shadow:0 0 12px #10b981;flex-shrink:0;"></div>
        <div>
          <div style="font-size:13px;font-weight:700;color:#e0e7ff;">✨ ĐÃ BẮT ĐƯỢC LUỒNG VIDEO!</div>
          <div style="font-size:11px;color:#94a3b8;margin-top:2px;">Đã tự copy • Bấm vào đây hoặc chuyển về Studio để tải</div>
        </div>
      `;
      badge.onclick = () => {
        try {
          navigator.clipboard.writeText(url);
          badge.innerHTML = '<div style="font-size:13px;font-weight:700;color:#10b981;">ĐÃ SAO CHÉP LINK! Hãy mở cửa sổ Studio để tải.</div>';
        } catch(e) {}
      };
      document.body.appendChild(badge);
    } catch(e) {}
  }

  function emitStream(url, type) {
    if (!url || typeof url !== 'string') return;
    if (url.startsWith('blob:') || url.startsWith('data:') || url.startsWith('flowdl:')) return;
    if (captured.has(url)) return;

    if (url.includes('.js') || url.includes('.css') || url.includes('.png') || url.includes('.jpg') || url.includes('.svg') || url.includes('.woff')) {
      if (!url.includes('.m3u8') && !url.includes('.mp4')) return;
    }

    if (isMediaStream(url)) {
      captured.add(url);
      console.log('[FLOWDL Sniffer Intercepted]', type, url);
      try { navigator.clipboard.writeText(url); } catch(e) {}

      // Signal Rust backend via custom flowdl scheme navigation
      try {
        const payload = encodeURIComponent(JSON.stringify({
          stream_url: url,
          page_url: window.location.href,
          page_title: document.title || 'Video Stream',
          source_type: type
        }));
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = 'flowdl://stream?data=' + payload;
        document.body.appendChild(iframe);
        setTimeout(() => iframe.remove(), 1000);
      } catch(e) {}

      showFloatingBadge(url, type);
    }
  }

  // 1. Hook window.fetch
  const _fetch = window.fetch;
  window.fetch = function(...args) {
    try {
      const u = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url ? args[0].url : '');
      if (u) emitStream(u, 'fetch');
    } catch(e) {}
    return _fetch.apply(this, args);
  };

  // 2. Hook XMLHttpRequest
  const _open = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    try {
      if (url) emitStream(url.toString(), 'xhr');
    } catch(e) {}
    return _open.call(this, method, url, ...rest);
  };

  // 3. Hook HTMLMediaElement
  const _play = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function(...args) {
    try {
      if (this.src) emitStream(this.src, 'media_src');
      if (this.currentSrc) emitStream(this.currentSrc, 'media_currentSrc');
    } catch(e) {}
    return _play.apply(this, args);
  };

  // 4. Hook setAttribute on video / audio / source
  const _setAttr = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function(name, val) {
    try {
      if ((name === 'src' || name === 'data-src') && val) {
        emitStream(val.toString(), 'set_attribute');
      }
    } catch(e) {}
    return _setAttr.call(this, name, val);
  };

  // 5. Hook Hls.js if present
  if (window.Hls) {
    const _loadSource = window.Hls.prototype.loadSource;
    window.Hls.prototype.loadSource = function(url) {
      if (url) emitStream(url, 'hlsjs');
      return _loadSource.apply(this, arguments);
    };
  }

  // 6. DOM Scanner & Global Variables
  function scanDOM() {
    try {
      document.querySelectorAll('video, audio, source').forEach(el => {
        if (el.src) emitStream(el.src, 'dom_media');
        if (el.currentSrc) emitStream(el.currentSrc, 'dom_media');
      });
      if (window.PLAYER_DATA && window.PLAYER_DATA.link) {
        emitStream(window.PLAYER_DATA.link, 'player_data');
      }
      if (window.player && window.player.src) {
        emitStream(window.player.src, 'player_var');
      }
      if (window.jwplayer && typeof window.jwplayer === 'function') {
        try {
          const jw = window.jwplayer();
          if (jw && typeof jw.getPlaylist === 'function') {
            const pl = jw.getPlaylist();
            if (Array.isArray(pl) && pl[0] && pl[0].file) {
              emitStream(pl[0].file, 'jwplayer');
            }
          }
        } catch(e) {}
      }
    } catch(e) {}
  }

  setInterval(scanDOM, 800);
  scanDOM();
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
    .initialization_script(SNIFFER_INJECTION_SCRIPT)
    .on_navigation(move |url| {
        if url.scheme() == "flowdl" {
            for (k, v) in url.query_pairs() {
                if k == "data" {
                    if let Ok(payload) = serde_json::from_str::<SniffedStreamPayload>(&v) {
                        let _ = app_handle_clone.emit("on-sniffed-stream", payload.clone());
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
        .initialization_script(SNIFFER_INJECTION_SCRIPT)
        .on_navigation(move |url| {
            if url.scheme() == "flowdl" {
                for (k, v) in url.query_pairs() {
                    if k == "data" {
                        if let Ok(payload) = serde_json::from_str::<SniffedStreamPayload>(&v) {
                            let _ = app_handle_clone.emit("on-sniffed-stream", payload);
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
