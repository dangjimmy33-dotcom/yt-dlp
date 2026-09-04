use crate::engine_manager::{get_ffmpeg_path, get_ytdlp_path};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
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
    pub audio_format: Option<String>,   // "mp3" | "m4a" | "flac" | "wav" | "opus"
    pub audio_quality: Option<String>,  // "320K" | "256K" | "192K" | "128K"
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

pub async fn fetch_media_metadata(url: &str, cookies_browser: Option<&str>) -> Result<MediaInfo, String> {
    let ytdlp_path = get_ytdlp_path();
    if !ytdlp_path.exists() {
        return Err("yt-dlp engine not found. Please click update engine first.".to_string());
    }

    let mut cmd = Command::new(&ytdlp_path);
    cmd.arg("--dump-single-json")
        .arg("--no-warnings")
        .arg("--flat-playlist")
        .arg(url);

    if let Some(browser) = cookies_browser {
        if !browser.is_empty() && browser != "none" {
            cmd.arg("--cookies-from-browser").arg(browser);
        }
    }

    #[cfg(windows)]
    cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW

    let output = cmd.output().await.map_err(|e| format!("Failed to run yt-dlp: {}", e))?;

    if !output.status.success() {
        let err_msg = String::from_utf8_lossy(&output.stderr);
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

        let playlist_title = json.get("title").and_then(|v| v.as_str()).unwrap_or("Playlist").to_string();
        let uploader = json.get("uploader").or_else(|| json.get("channel")).and_then(|v| v.as_str()).unwrap_or("Unknown").to_string();
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

    // Single video extraction
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
        url: url.to_string(),
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

pub async fn execute_download(
    app: AppHandle,
    req: DownloadRequest,
    active_map: Arc<Mutex<HashMap<String, u32>>>,
) -> Result<(), String> {
    let ytdlp_path = get_ytdlp_path();
    let mut cmd = Command::new(&ytdlp_path);

    // Basic progress formatting template
    cmd.arg("--newline")
        .arg("--progress-template")
        .arg("FLOWDL_PROGRESS|%(progress._percent_str)s|%(progress._speed_str)s|%(progress._eta_str)s|%(progress._total_bytes_estimate_str)s|%(progress.status)s");

    // FFmpeg path if available
    if let Some(ffmpeg_p) = get_ffmpeg_path() {
        if let Some(parent) = ffmpeg_p.parent() {
            cmd.arg("--ffmpeg-location").arg(parent);
        }
    }

    // Output template
    let template = if let Some(ref custom_name) = req.custom_filename {
        if !custom_name.is_empty() {
            format!("{}/{}.%(ext)s", req.output_dir, custom_name)
        } else {
            format!("{}/%(title)s.%(ext)s", req.output_dir)
        }
    } else {
        format!("{}/%(title)s.%(ext)s", req.output_dir)
    };
    cmd.arg("-o").arg(&template);

    // Format & Quality selection
    if req.download_type == "audio" {
        cmd.arg("-x");
        let audio_fmt = req.audio_format.as_deref().unwrap_or("mp3");
        cmd.arg("--audio-format").arg(audio_fmt);
        let audio_q = req.audio_quality.as_deref().unwrap_or("320K");
        cmd.arg("--audio-quality").arg(audio_q);
    } else if let Some(ref fid) = req.format_id {
        if !fid.is_empty() && fid != "auto" {
            cmd.arg("-f").arg(fid);
        } else {
            match req.quality.as_str() {
                "2160p" => { cmd.arg("-f").arg("bestvideo[height<=2160]+bestaudio/best[height<=2160]/best"); }
                "1440p" => { cmd.arg("-f").arg("bestvideo[height<=1440]+bestaudio/best[height<=1440]/best"); }
                "1080p" => { cmd.arg("-f").arg("bestvideo[height<=1080]+bestaudio/best[height<=1080]/best"); }
                "720p" => { cmd.arg("-f").arg("bestvideo[height<=720]+bestaudio/best[height<=720]/best"); }
                "480p" => { cmd.arg("-f").arg("bestvideo[height<=480]+bestaudio/best[height<=480]/best"); }
                "360p" => { cmd.arg("-f").arg("bestvideo[height<=360]+bestaudio/best[height<=360]/best"); }
                _ => { cmd.arg("-f").arg("bestvideo+bestaudio/best"); }
            }
        }
    } else {
        match req.quality.as_str() {
            "2160p" => { cmd.arg("-f").arg("bestvideo[height<=2160]+bestaudio/best[height<=2160]/best"); }
            "1440p" => { cmd.arg("-f").arg("bestvideo[height<=1440]+bestaudio/best[height<=1440]/best"); }
            "1080p" => { cmd.arg("-f").arg("bestvideo[height<=1080]+bestaudio/best[height<=1080]/best"); }
            "720p" => { cmd.arg("-f").arg("bestvideo[height<=720]+bestaudio/best[height<=720]/best"); }
            "480p" => { cmd.arg("-f").arg("bestvideo[height<=480]+bestaudio/best[height<=480]/best"); }
            "360p" => { cmd.arg("-f").arg("bestvideo[height<=360]+bestaudio/best[height<=360]/best"); }
            _ => { cmd.arg("-f").arg("bestvideo+bestaudio/best"); }
        }
    }

    if req.embed_metadata {
        cmd.arg("--embed-metadata");
    }
    if req.embed_thumbnail {
        cmd.arg("--embed-thumbnail");
    }
    if req.embed_subtitles {
        cmd.arg("--embed-subs").arg("--sub-langs").arg("all");
    }
    if req.sponsorblock {
        cmd.arg("--sponsorblock-remove").arg("sponsor,intro,outro,selfpromo");
    }

    if let Some(ref browser) = req.cookies_browser {
        if !browser.is_empty() && browser != "none" {
            cmd.arg("--cookies-from-browser").arg(browser);
        }
    }

    // Trim video by section
    if let (Some(ref start), Some(ref end)) = (&req.trim_start, &req.trim_end) {
        if !start.is_empty() && !end.is_empty() {
            cmd.arg("--download-sections").arg(format!("*{}-{}", start, end));
        }
    }

    // Custom arguments
    if let Some(ref extra) = req.custom_args {
        if !extra.trim().is_empty() {
            for arg in extra.split_whitespace() {
                cmd.arg(arg);
            }
        }
    }

    cmd.arg(&req.url);

    #[cfg(windows)]
    cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW

    cmd.stdout(Stdio::piped());
    cmd.stderr(Stdio::piped());

    let mut child = cmd.spawn().map_err(|e| format!("Failed to start download process: {}", e))?;
    let task_id = req.id.clone();

    if let Some(pid) = child.id() {
        let mut map = active_map.lock().await;
        map.insert(task_id.clone(), pid);
    }

    let stdout = child.stdout.take().ok_or("Failed to open stdout")?;
    let mut reader = BufReader::new(stdout).lines();

    let app_handle = app.clone();
    let current_id = task_id.clone();

    tokio::spawn(async move {
        while let Ok(Some(line)) = reader.next_line().await {
            if line.starts_with("FLOWDL_PROGRESS|") {
                let parts: Vec<&str> = line.split('|').collect();
                if parts.len() >= 6 {
                    let percent_str = parts[1].trim().replace('%', "");
                    let percent = percent_str.parse::<f64>().unwrap_or(0.0);
                    let speed = parts[2].trim().to_string();
                    let eta = parts[3].trim().to_string();
                    let total_size = parts[4].trim().to_string();
                    let _status = parts[5].trim().to_string();

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

    let status = child.wait().await.map_err(|e| format!("Process error: {}", e))?;

    // Remove from active map
    {
        let mut map = active_map.lock().await;
        map.remove(&task_id);
    }

    if status.success() {
        let _ = app.emit(
            "download-progress",
            DownloadProgressEvent {
                task_id: task_id.clone(),
                percent: 100.0,
                speed: "0 B/s".to_string(),
                eta: "00:00".to_string(),
                total_size: "Completed".to_string(),
                status: "completed".to_string(),
                error_message: None,
                output_path: Some(req.output_dir),
            },
        );
        Ok(())
    } else {
        let _ = app.emit(
            "download-progress",
            DownloadProgressEvent {
                task_id: task_id.clone(),
                percent: 0.0,
                speed: "0 B/s".to_string(),
                eta: "00:00".to_string(),
                total_size: "0 B".to_string(),
                status: "error".to_string(),
                error_message: Some("Download process failed or was interrupted".to_string()),
                output_path: None,
            },
        );
        Err("Download process exited with non-zero status".to_string())
    }
}
