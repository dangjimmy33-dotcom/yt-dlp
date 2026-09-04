use serde::{Deserialize, Serialize};
use std::sync::Arc;
use std::time::Duration;
use tauri::{AppHandle, Listener, WebviewUrl, WebviewWindowBuilder};
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
    if (url.startsWith('blob:') || url.startsWith('data:')) return false;
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

  function emitStream(url, type) {
    if (!url || typeof url !== 'string') return;
    if (url.startsWith('blob:') || url.startsWith('data:')) return;
    if (captured.has(url)) return;

    // Filter out common non-video assets
    if (url.includes('.js') || url.includes('.css') || url.includes('.png') || url.includes('.jpg') || url.includes('.svg') || url.includes('.woff')) {
      if (!url.includes('.m3u8') && !url.includes('.mp4')) return;
    }

    if (isMediaStream(url)) {
      captured.add(url);
      console.log('[FLOWDL Sniffer Intercepted]', type, url);
      try {
        if (window.__TAURI__ && window.__TAURI__.event) {
          window.__TAURI__.event.emit('on-sniffed-stream', {
            stream_url: url,
            page_url: window.location.href,
            page_title: document.title || 'Video Stream',
            source_type: type
          });
        }
      } catch(e) {}
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

    let tx_for_event = tx_arc.clone();
    let handler_id = app.listen("on-sniffed-stream", move |event| {
        if let Ok(payload) = serde_json::from_str::<SniffedStreamPayload>(event.payload()) {
            let tx_clone = tx_for_event.clone();
            tokio::spawn(async move {
                let mut lock = tx_clone.lock().await;
                if let Some(sender) = lock.take() {
                    let _ = sender.send(payload);
                }
            });
        }
    });

    let sniffer_window = WebviewWindowBuilder::new(
        &app,
        &window_label,
        WebviewUrl::External(parsed_url),
    )
    .title("Auto Stream Sniffer")
    .inner_size(800.0, 600.0)
    .visible(false)
    .initialization_script(SNIFFER_INJECTION_SCRIPT)
    .build();

    let win = match sniffer_window {
        Ok(w) => w,
        Err(e) => {
            app.unlisten(handler_id);
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

    app.unlisten(handler_id);
    let _ = win.close();

    result
}
