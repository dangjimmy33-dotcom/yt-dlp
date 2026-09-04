use crate::engine_manager::{get_ffmpeg_path, get_ytdlp_path};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, VecDeque};
use std::process::Stdio;
use std::sync::Arc;
use tauri::{AppHandle, Emitter};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::process::Command;
use tokio::sync::Mutex;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct VideoFormat {
    pub format_id: String,
    pub ext: String,
    pub resolution: Option<String>,
    pub width: Option<u32>,
    pub height: Option<u32>,
    pub fps: Option<f64>,
    pub filesize: Option<u64>,
    pub filesize_approx: Option<u64>,
    pub vcodec: Option<String>,
    pub acodec: Option<String>,
    pub format_note: Option<String>,
    pub is_video: bool,
    pub is_audio: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SubtitleInfo {
    pub lang: String,
    pub name: String,
    pub is_auto: bool,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct PlaylistEntry {
    pub id: String,
    pub title: String,
    pub url: String,
    pub duration: Option<f64>,
    pub uploader: Option<String>,
    pub thumbnail: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct MediaInfo {
    pub id: String,
    pub title: String,
    pub url: String,
    pub thumbnail: String,
    pub duration: f64,
    pub duration_str: String,
    pub uploader: String,
    pub channel_url: Option<String>,
    pub view_count: Option<u64>,
    pub description: Option<String>,
    pub formats: Vec<VideoFormat>,
    pub subtitles: Vec<SubtitleInfo>,
    pub is_playlist: bool,
    pub playlist_count: Option<usize>,
    pub entries: Option<Vec<PlaylistEntry>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DownloadRequest {
    pub id: String,
    pub url: String,
    pub title: String,
    pub download_type: String, // "video" | "audio" | "custom"
    pub quality: String,       // "best" | "2160p" | "1440p" | "1080p" | "720p" | "480p" | "360p"
    pub format_id: Option<String>,
    pub video_container: Option<String>, // "mp4" | "mkv" | "webm" | "mov"
    pub video_codec: Option<String>,     // "h264" | "hevc" | "av1" | "vp9"
    pub audio_format: Option<String>,   // "mp3" | "m4a" | "flac" | "wav" | "opus" | "ogg"
    pub audio_quality: Option<String>,  // "320K" | "256K" | "192K" | "128K"
    pub audio_normalize: Option<bool>,
    pub output_dir: String,
    pub custom_filename: Option<String>,
    pub embed_subtitles: bool,
    pub embed_thumbnail: bool,
    pub embed_metadata: bool,
    pub sponsorblock: bool,
    pub cookies_browser: Option<String>,
    pub trim_start: Option<String>,
    pub trim_end: Option<String>,
    pub custom_args: Option<String>,
    /// Referer captured from the browser page that requested a direct stream.
    pub referer: Option<String>,
    /// True when `url` is already a direct media/HLS/DASH stream.
    pub direct_stream: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DownloadProgressEvent {
    pub task_id: String,
    pub percent: f64,
    pub speed: String,
    pub eta: String,
    pub total_size: String,
    pub status: String, // "downloading" | "merging" | "completed" | "error" | "cancelled"
    pub error_message: Option<String>,
    pub output_path: Option<String>,
}

pub struct DownloadManager {
    pub active_processes: Arc<Mutex<HashMap<String, u32>>>, // task_id -> pid
}

impl DownloadManager {
    pub fn new() -> Self {
        Self {
            active_processes: Arc::new(Mutex::new(HashMap::new())),
        }
    }
}

pub fn parse_single_video_json(json: &serde_json::Value, fallback_url: &str) -> Result<MediaInfo, String> {
    let id = json.get("id").and_then(|v| v.as_str()).unwrap_or("").to_string();
    let title = json.get("title").and_then(|v| v.as_str()).unwrap_or("Untitled").to_string();
    let duration = json.get("duration").and_then(|v| v.as_f64()).unwrap_or(0.0);
    let uploader = json.get("uploader").or_else(|| json.get("channel")).and_then(|v| v.as_str()).unwrap_or("Unknown").to_string();
    let view_count = json.get("view_count").and_then(|v| v.as_u64());

    let thumbnail = json.get("thumbnail")
        .or_else(|| json.get("thumbnails").and_then(|t| t.as_array()).and_then(|a| a.last()).and_then(|t| t.get("url")))
        .and_then(|v| v.as_str())
        .unwrap_or("")
        .to_string();

    let mut formats = Vec::new();
    if let Some(raw_formats) = json.get("formats").and_then(|v| v.as_array()) {
        for f in raw_formats {
            let format_id = f.get("format_id").and_then(|v| v.as_str()).unwrap_or("").to_string();
            let ext = f.get("ext").and_then(|v| v.as_str()).unwrap_or("").to_string();
            let resolution = f.get("resolution").and_then(|v| v.as_str()).map(String::from);
            let width = f.get("width").and_then(|v| v.as_u64()).map(|v| v as u32);
            let height = f.get("height").and_then(|v| v.as_u64()).map(|v| v as u32);
            let fps = f.get("fps").and_then(|v| v.as_f64());
            let filesize = f.get("filesize").and_then(|v| v.as_u64());
            let filesize_approx = f.get("filesize_approx").and_then(|v| v.as_u64());
            let vcodec = f.get("vcodec").and_then(|v| v.as_str()).map(String::from);
            let acodec = f.get("acodec").and_then(|v| v.as_str()).map(String::from);
            let format_note = f.get("format_note").and_then(|v| v.as_str()).map(String::from);

            let is_video = vcodec.as_ref().map(|v| v != "none").unwrap_or(false) || height.is_some();
            let is_audio = acodec.as_ref().map(|a| a != "none").unwrap_or(false);

            formats.push(VideoFormat {
                format_id,
                ext,
                resolution,
                width,
                height,
                fps,
                filesize,
                filesize_approx,
                vcodec,
                acodec,
                format_note,
                is_video,
                is_audio,
            });
        }
    }

    let mut subtitles = Vec::new();
    if let Some(subs) = json.get("subtitles").and_then(|v| v.as_object()) {
        for (lang, details) in subs {
            let name = details.as_array()
                .and_then(|a| a.first())
                .and_then(|d| d.get("name"))
                .and_then(|v| v.as_str())
                .unwrap_or(lang)
                .to_string();

            subtitles.push(SubtitleInfo {
                lang: lang.clone(),
                name,
                is_auto: false,
            });
        }
    }

    let mins = (duration / 60.0).floor() as u64;
    let secs = (duration % 60.0).round() as u64;
    let duration_str = if mins >= 60 {
        let hrs = mins / 60;
        let rem_mins = mins % 60;
        format!("{:02}:{:02}:{:02}", hrs, rem_mins, secs)
    } else {
        format!("{:02}:{:02}", mins, secs)
    };

    Ok(MediaInfo {
        id,
        title,
        url: fallback_url.to_string(),
        thumbnail,
        duration,
        duration_str,
        uploader,
        channel_url: json.get("channel_url").and_then(|v| v.as_str()).map(String::from),
        view_count,
        description: json.get("description").and_then(|v| v.as_str()).map(String::from),
        formats,
        subtitles,
        is_playlist: false,
        playlist_count: None,
        entries: None,
    })
}

async fn sniff_and_extract_webpage(page_url: &str, referer: Option<&str>) -> Result<MediaInfo, String> {
    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36")
        .build()
        .map_err(|e| e.to_string())?;

    let mut req = client.get(page_url);
    if let Some(ref_url) = referer {
        req = req.header("Referer", ref_url);
    }
    let resp = req.send().await.map_err(|e| e.to_string())?;
    let html = resp.text().await.map_err(|e| e.to_string())?;

    let page_title = if let Some(start) = html.find("<title>") {
        if let Some(end) = html[start + 7..].find("</title>") {
            html[start + 7..start + 7 + end].trim().to_string()
        } else {
            "Custom Video".to_string()
        }
    } else {
        "Custom Video".to_string()
    };

    let thumbnail = if let Some(start) = html.find("property=\"og:image\" content=\"") {
        if let Some(end) = html[start + 28..].find('"') {
            html[start + 28..start + 28 + end].to_string()
        } else {
            String::new()
        }
    } else {
        String::new()
    };

    let m3u8_regex = regex::Regex::new(r#"https?://[^"'\s<>]+\.m3u8[^"'\s<>]*"#).ok();
    let mp4_regex = regex::Regex::new(r#"https?://[^"'\s<>]+\.mp4[^"'\s<>]*"#).ok();

    let stream_url = if let Some(ref re) = m3u8_regex {
        re.find(&html).map(|m| m.as_str().to_string())
    } else {
        None
    }.or_else(|| {
        if let Some(ref re) = mp4_regex {
            re.find(&html).map(|m| m.as_str().to_string())
        } else {
            None
        }
    });

    if let Some(stream) = stream_url {
        let ytdlp_path = get_ytdlp_path();
        let mut cmd = Command::new(&ytdlp_path);
        cmd.arg("--dump-single-json")
            .arg("--no-warnings")
            .arg("--js-runtimes")
            .arg("node")
            .arg(&stream);

        if let Some(ref_url) = referer {
            cmd.arg("--referer").arg(ref_url);
        } else {
            cmd.arg("--referer").arg(page_url);
        }
        cmd.arg("--user-agent")
            .arg("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36");

        #[cfg(windows)]
        cmd.creation_flags(0x0800_0000);

        if let Ok(output) = cmd.output().await {
            if output.status.success() {
                let stdout_str = String::from_utf8_lossy(&output.stdout);
                if let Ok(json) = serde_json::from_str::<serde_json::Value>(&stdout_str) {
                    if let Ok(mut info) = parse_single_video_json(&json, page_url) {
                        if !page_title.is_empty() && page_title != "Custom Video" {
                            info.title = page_title;
                        }
                        if !thumbnail.is_empty() {
                            info.thumbnail = thumbnail;
                        }
                        return Ok(info);
                    }
                }
            }
        }

        return Ok(MediaInfo {
            id: format!("custom_{}", stream.len()),
            title: page_title,
            url: stream,
            thumbnail,
            duration: 0.0,
            duration_str: "--:--".to_string(),
            uploader: page_url.to_string(),
            channel_url: None,
            view_count: None,
            description: Some("Tự động bóc tách luồng trực tiếp từ trang web".to_string()),
            formats: vec![
                VideoFormat {
                    format_id: "auto".to_string(),
                    ext: "mp4".to_string(),
                    resolution: Some("HD / Auto".to_string()),
                    width: None,
                    height: Some(1080),
                    fps: None,
                    filesize: None,
                    filesize_approx: None,
                    vcodec: Some("auto".to_string()),
                    acodec: Some("auto".to_string()),
                    format_note: Some("Luồng video HLS / Direct".to_string()),
                    is_video: true,
                    is_audio: true,
                }
            ],
            subtitles: Vec::new(),
            is_playlist: false,
            playlist_count: None,
            entries: None,
        });
    }

    Err("Không thể bóc tách luồng video từ trang web này".to_string())
}

fn cli_access_denied(stderr: &str) -> bool {
    let lower = stderr.to_ascii_lowercase();
    lower.contains("http error 403")
        || lower.contains("403 forbidden")
        || lower.contains("attention required! | cloudflare")
        || lower.contains("cloudflare anti-bot challenge")
}

fn browser_capture_required_error() -> String {
    "FLOWDL_BROWSER_CAPTURE_REQUIRED|Trang web từ chối truy cập trực tiếp từ yt-dlp (HTTP 403). Đã chuyển sang Bắt Link Web; hãy phát video trong cửa sổ trình duyệt để Studio nhận luồng mà trang thực sự tải.".to_string()
}

pub async fn fetch_media_metadata(url: &str, cookies_browser: Option<&str>) -> Result<MediaInfo, String> {
    let ytdlp_path = get_ytdlp_path();
    if !ytdlp_path.exists() {
        return Err("yt-dlp engine not found. Please click update engine first.".to_string());
    }

    let trimmed = url.trim();
    let is_search = !trimmed.starts_with("http://")
        && !trimmed.starts_with("https://")
        && !trimmed.starts_with("ytsearch");

    let query_target = if is_search {
        format!("ytsearch30:{}", trimmed)
    } else {
        trimmed.to_string()
    };

    let referer = if !is_search {
        crate::plugins::get_referer_for_url(&query_target)
    } else {
        None
    };

    let mut cmd = Command::new(&ytdlp_path);
    cmd.arg("--dump-single-json")
        .arg("--no-warnings")
        .arg("--flat-playlist")
        .arg("--js-runtimes")
        .arg("node")
        .arg("--extractor-args")
        .arg("youtube:player_client=android,web,ios")
        .arg(&query_target);

    let plugins_dir = crate::plugins::get_plugins_dir();
    if plugins_dir.exists() {
        cmd.arg("--paths").arg(format!("plugin:{}", plugins_dir.display()));
    }

    if let Some(ref ref_url) = referer {
        cmd.arg("--referer").arg(ref_url);
    }
    cmd.arg("--user-agent")
        .arg("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36");

    if let Some(browser) = cookies_browser {
        if !browser.is_empty() && browser != "none" {
            cmd.arg("--cookies-from-browser").arg(browser);
        }
    }

    #[cfg(windows)]
    cmd.creation_flags(0x0800_0000); // CREATE_NO_WINDOW

    let output = cmd.output().await.map_err(|e| format!("Failed to run yt-dlp: {}", e))?;

    if !output.status.success() {
        let err_msg = String::from_utf8_lossy(&output.stderr);

        // Do not keep hammering a page that explicitly rejected non-browser access.
        // Hand the decision back to the UI so it can open the interactive WebView capture flow.
        if cli_access_denied(&err_msg) {
            return Err(browser_capture_required_error());
        }

        if let Ok(sniffed) = sniff_and_extract_webpage(url, referer.as_deref()).await {
            return Ok(sniffed);
        }

        return Err(format!("yt-dlp error: {}", err_msg.trim()));
    }

    let stdout_str = String::from_utf8_lossy(&output.stdout);
    let json: serde_json::Value = serde_json::from_str(&stdout_str)
        .map_err(|e| format!("Failed to parse metadata JSON: {}", e))?;

    let is_playlist = json.get("_type").and_then(|v| v.as_str()) == Some("playlist")
        || json.get("entries").is_some();

    if is_playlist {
        let mut entries = Vec::new();
        if let Some(raw_entries) = json.get("entries").and_then(|v| v.as_array()) {
            for entry in raw_entries {
                let id = entry.get("id").and_then(|v| v.as_str()).unwrap_or("").to_string();
                let title = entry.get("title").and_then(|v| v.as_str()).unwrap_or("Untitled").to_string();
                let entry_url = entry.get("url").and_then(|v| v.as_str()).unwrap_or("").to_string();
                let full_url = if entry_url.starts_with("http") {
                    entry_url
                } else if !id.is_empty() {
                    format!("https://www.youtube.com/watch?v={}", id)
                } else {
                    entry_url
                };

                let thumbnail = entry.get("thumbnail")
                    .or_else(|| entry.get("thumbnails").and_then(|t| t.as_array()).and_then(|a| a.last()).and_then(|t| t.get("url")))
                    .and_then(|v| v.as_str())
                    .unwrap_or("")
                    .to_string();

                entries.push(PlaylistEntry {
                    id,
                    title,
                    url: full_url,
                    duration: entry.get("duration").and_then(|v| v.as_f64()),
                    uploader: entry.get("uploader").and_then(|v| v.as_str()).map(String::from),
                    thumbnail: if thumbnail.is_empty() { None } else { Some(thumbnail) },
                });
            }
        }

        let playlist_title = if is_search {
            format!("Kết quả tìm kiếm: \"{}\"", trimmed)
        } else {
            json.get("title").and_then(|v| v.as_str()).unwrap_or("Playlist").to_string()
        };
        let uploader = if is_search {
            "YouTube Search".to_string()
        } else {
            json.get("uploader").or_else(|| json.get("channel")).and_then(|v| v.as_str()).unwrap_or("Unknown").to_string()
        };
        let count = entries.len();

        return Ok(MediaInfo {
            id: json.get("id").and_then(|v| v.as_str()).unwrap_or("").to_string(),
            title: playlist_title,
            url: url.to_string(),
            thumbnail: entries.first().and_then(|e| e.thumbnail.clone()).unwrap_or_default(),
            duration: 0.0,
            duration_str: format!("{} videos", count),
            uploader,
            channel_url: json.get("channel_url").and_then(|v| v.as_str()).map(String::from),
            view_count: None,
            description: json.get("description").and_then(|v| v.as_str()).map(String::from),
            formats: Vec::new(),
            subtitles: Vec::new(),
            is_playlist: true,
            playlist_count: Some(count),
            entries: Some(entries),
        });
    }

    parse_single_video_json(&json, url)
}

pub async fn execute_download(
    app: AppHandle,
    req: DownloadRequest,
    active_map: Arc<Mutex<HashMap<String, u32>>>,
) -> Result<(), String> {
    let ytdlp_path = get_ytdlp_path();
    if !ytdlp_path.exists() {
        return Err("Thiếu yt-dlp. Mở mục Engine và cài/cập nhật yt-dlp trước khi tải.".to_string());
    }

    let ffmpeg_path = get_ffmpeg_path().ok_or_else(|| {
        "Thiếu FFmpeg/ffprobe. FFmpeg là dependency bắt buộc để ghép video + audio, tách MP3 và xử lý hậu kỳ. Mở mục Engine và bấm Cài FFmpeg.".to_string()
    })?;

    if req.output_dir.trim().is_empty() {
        return Err("Chưa chọn thư mục tải về. Hãy chọn thư mục lưu trước khi bắt đầu.".to_string());
    }

    tokio::fs::create_dir_all(&req.output_dir)
        .await
        .map_err(|e| format!("Không thể tạo/mở thư mục tải '{}': {e}", req.output_dir))?;

    let mut cmd = Command::new(&ytdlp_path);
    cmd.arg("--js-runtimes").arg("node");
    cmd.arg("--extractor-args").arg("youtube:player_client=android,web,ios");

    let plugins_dir = crate::plugins::get_plugins_dir();
    if plugins_dir.exists() {
        cmd.arg("--paths").arg(format!("plugin:{}", plugins_dir.display()));
    }

    // A captured direct stream must keep the page/player Referer that produced it.
    // Fall back to the custom-domain plugin rule for normal webpage downloads.
    let referer = req
        .referer
        .clone()
        .filter(|v| !v.trim().is_empty())
        .or_else(|| crate::plugins::get_referer_for_url(&req.url));
    if let Some(ref ref_url) = referer {
        cmd.arg("--referer").arg(ref_url);
    }
    cmd.arg("--user-agent")
        .arg("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36");

    cmd.arg("--newline")
        .arg("--progress-template")
        .arg("FLOWDL_PROGRESS|%(progress._percent_str)s|%(progress._speed_str)s|%(progress._eta_str)s|%(progress._total_bytes_estimate_str)s|%(progress.status)s")
        .arg("--print")
        .arg("after_move:FLOWDL_FILE|%(filepath)s")
        .arg("--ffmpeg-location")
        .arg(ffmpeg_path.parent().unwrap_or(&ffmpeg_path))
        .arg("-P")
        .arg(&req.output_dir)
        .arg("--trim-filenames")
        .arg("180");

    #[cfg(windows)]
    cmd.arg("--windows-filenames");

    if req.direct_stream == Some(true) {
        cmd.arg("--no-playlist");
    }

    let filename_template = if let Some(ref custom_name) = req.custom_filename {
        if !custom_name.trim().is_empty() {
            format!("{}.%(ext)s", custom_name.trim())
        } else {
            "%(title)s.%(ext)s".to_string()
        }
    } else {
        "%(title)s.%(ext)s".to_string()
    };
    cmd.arg("-o").arg(filename_template);

    if req.download_type == "audio" {
        cmd.arg("-x");
        let audio_fmt = req.audio_format.as_deref().unwrap_or("mp3");
        cmd.arg("--audio-format").arg(audio_fmt);
        let audio_q = req.audio_quality.as_deref().unwrap_or("0");
        cmd.arg("--audio-quality").arg(audio_q);

        if req.audio_normalize == Some(true) {
            cmd.arg("--postprocessor-args").arg("ffmpeg:-af loudnorm=I=-14:TP=-1:LRA=11");
        }
    } else {
        if let Some(ref container) = req.video_container {
            if !container.is_empty() && container != "auto" {
                cmd.arg("--merge-output-format").arg(container);
            }
        }

        if req.direct_stream == Some(true) {
            cmd.arg("-f").arg("best");
        } else if let Some(ref fid) = req.format_id {
            if !fid.is_empty() && fid != "auto" {
                cmd.arg("-f").arg(fid);
            } else {
                add_quality_and_codec_format(&mut cmd, &req.quality, req.video_codec.as_deref());
            }
        } else {
            add_quality_and_codec_format(&mut cmd, &req.quality, req.video_codec.as_deref());
        }
    }

    if req.embed_metadata {
        cmd.arg("--embed-metadata");
    }
    if req.embed_thumbnail && req.direct_stream != Some(true) {
        cmd.arg("--embed-thumbnail");
    }
    if req.embed_subtitles {
        cmd.arg("--embed-subs").arg("--sub-langs").arg("all");
    }
    if req.sponsorblock && req.direct_stream != Some(true) {
        cmd.arg("--sponsorblock-remove").arg("sponsor,intro,outro,selfpromo");
    }

    if let Some(ref browser) = req.cookies_browser {
        if !browser.is_empty() && browser != "none" {
            cmd.arg("--cookies-from-browser").arg(browser);
        }
    }

    if let (Some(ref start), Some(ref end)) = (&req.trim_start, &req.trim_end) {
        if !start.is_empty() && !end.is_empty() {
            cmd.arg("--download-sections").arg(format!("*{}-{}", start, end));
        }
    }

    if let Some(ref extra) = req.custom_args {
        if !extra.trim().is_empty() {
            for arg in extra.split_whitespace() {
                cmd.arg(arg);
            }
        }
    }

    cmd.arg(&req.url);

    #[cfg(windows)]
    cmd.creation_flags(0x0800_0000); // CREATE_NO_WINDOW

    cmd.stdout(Stdio::piped());
    cmd.stderr(Stdio::piped());

    let mut child = cmd
        .spawn()
        .map_err(|e| format!("Không thể khởi chạy yt-dlp: {e}"))?;
    let task_id = req.id.clone();

    if let Some(pid) = child.id() {
        let mut map = active_map.lock().await;
        map.insert(task_id.clone(), pid);
    }

    let stdout = child.stdout.take().ok_or("Không thể đọc stdout của yt-dlp")?;
    let stderr = child.stderr.take().ok_or("Không thể đọc stderr của yt-dlp")?;

    let output_path = Arc::new(Mutex::new(None::<String>));
    let last_errors = Arc::new(Mutex::new(VecDeque::<String>::with_capacity(24)));

    let app_handle = app.clone();
    let current_id = task_id.clone();
    let output_path_for_reader = output_path.clone();
    let stdout_task = tokio::spawn(async move {
        let mut reader = BufReader::new(stdout).lines();
        while let Ok(Some(line)) = reader.next_line().await {
            if let Some(path) = line.strip_prefix("FLOWDL_FILE|") {
                *output_path_for_reader.lock().await = Some(path.trim().to_string());
                continue;
            }

            if line.starts_with("FLOWDL_PROGRESS|") {
                let parts: Vec<&str> = line.split('|').collect();
                if parts.len() >= 6 {
                    let percent_str = parts[1].trim().replace('%', "");
                    let percent = percent_str.parse::<f64>().unwrap_or(0.0);
                    let speed = parts[2].trim().to_string();
                    let eta = parts[3].trim().to_string();
                    let total_size = parts[4].trim().to_string();

                    let _ = app_handle.emit(
                        "download-progress",
                        DownloadProgressEvent {
                            task_id: current_id.clone(),
                            percent,
                            speed: if speed.is_empty() || speed == "NA" { "0 B/s".to_string() } else { speed },
                            eta: if eta.is_empty() || eta == "NA" { "--:--".to_string() } else { eta },
                            total_size: if total_size.is_empty() || total_size == "NA" { "Unknown".to_string() } else { total_size },
                            status: if percent >= 100.0 { "merging".to_string() } else { "downloading".to_string() },
                            error_message: None,
                            output_path: None,
                        },
                    );
                }
            }
        }
    });

    let errors_for_reader = last_errors.clone();
    let stderr_task = tokio::spawn(async move {
        let mut reader = BufReader::new(stderr).lines();
        while let Ok(Some(line)) = reader.next_line().await {
            let line = line.trim().to_string();
            if line.is_empty() {
                continue;
            }
            let mut errors = errors_for_reader.lock().await;
            if errors.len() >= 24 {
                errors.pop_front();
            }
            errors.push_back(line);
        }
    });

    let status = child
        .wait()
        .await
        .map_err(|e| format!("Lỗi khi chờ tiến trình yt-dlp: {e}"))?;
    let _ = stdout_task.await;
    let _ = stderr_task.await;

    let was_active = {
        let mut map = active_map.lock().await;
        map.remove(&task_id).is_some()
    };

    if !was_active && !status.success() {
        return Ok(());
    }

    if status.success() {
        let final_path = output_path.lock().await.clone();
        let _ = app.emit(
            "download-progress",
            DownloadProgressEvent {
                task_id: task_id.clone(),
                percent: 100.0,
                speed: "0 B/s".to_string(),
                eta: "00:00".to_string(),
                total_size: "Hoàn thành".to_string(),
                status: "completed".to_string(),
                error_message: None,
                output_path: final_path.or_else(|| Some(req.output_dir.clone())),
            },
        );
        Ok(())
    } else {
        let errors = last_errors.lock().await;
        let mut message = errors
            .iter()
            .rev()
            .take(8)
            .cloned()
            .collect::<Vec<_>>();
        message.reverse();
        let details = message.join("\n");
        if details.is_empty() {
            Err(format!("yt-dlp thoát với mã lỗi {:?}. Không có stderr chi tiết.", status.code()))
        } else if req.direct_stream == Some(true) && cli_access_denied(&details) {
            Err("Luồng media đã được phát hiện nhưng máy chủ từ chối tải ngoài phiên trình duyệt (HTTP 403). Studio sẽ không tự sao chép cookie/token hay vượt challenge. Hãy dùng nguồn/tùy chọn tải mà website cho phép, hoặc thử một URL media công khai mà bạn có quyền tải.".to_string())
        } else {
            Err(details)
        }
    }
}

fn add_quality_and_codec_format(cmd: &mut Command, quality: &str, codec: Option<&str>) {
    let max_height = match quality {
        "2160p" => Some(2160),
        "1440p" => Some(1440),
        "1080p" => Some(1080),
        "720p" => Some(720),
        "480p" => Some(480),
        "360p" => Some(360),
        _ => None,
    };

    let codec_filter = match codec {
        Some("h264") | Some("avc") => Some("[vcodec^=avc1]"),
        Some("hevc") | Some("h265") => Some("[vcodec^=hvc1]"),
        Some("vp9") => Some("[vcodec^=vp9]"),
        Some("av1") => Some("[vcodec^=av01]"),
        _ => None,
    };

    let selector = match (max_height, codec_filter) {
        (Some(h), Some(cf)) => format!(
            "bestvideo[height<={h}]{cf}+bestaudio/bestvideo[height<={h}]+bestaudio/best[height<={h}]/best",
            h = h,
            cf = cf
        ),
        (Some(h), None) => format!(
            "bestvideo[height<={h}]+bestaudio/best[height<={h}]/best",
            h = h
        ),
        (None, Some(cf)) => format!(
            "bestvideo{cf}+bestaudio/bestvideo+bestaudio/best",
            cf = cf
        ),
        (None, None) => "bestvideo+bestaudio/best".to_string(),
    };

    cmd.arg("-f").arg(selector);
}
