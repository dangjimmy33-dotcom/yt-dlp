use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use std::io;
use std::path::{Path, PathBuf};
use std::process::Command;
use tokio::io::AsyncWriteExt;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EngineStatus {
    pub ytdlp_available: bool,
    pub ytdlp_version: String,
    pub ytdlp_path: String,
    pub ffmpeg_available: bool,
    pub ffmpeg_version: String,
    pub ffmpeg_path: String,
    pub custom_ytdlp_path: Option<String>,
    pub custom_ffmpeg_path: Option<String>,
    pub detected_ytdlp_paths: Vec<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct CustomEngineConfig {
    pub custom_ytdlp_path: Option<String>,
    pub custom_ffmpeg_path: Option<String>,
}

#[cfg(windows)]
const CREATE_NO_WINDOW: u32 = 0x0800_0000;

#[cfg(windows)]
fn hide_console(cmd: &mut Command) {
    use std::os::windows::process::CommandExt;
    cmd.creation_flags(CREATE_NO_WINDOW);
}

#[cfg(not(windows))]
fn hide_console(_cmd: &mut Command) {}

pub fn get_bin_dir() -> PathBuf {
    let mut base_dir = dirs::data_local_dir().unwrap_or_else(|| PathBuf::from("."));
    base_dir.push("YT-DLP-Studio");
    base_dir.push("bin");
    let _ = std::fs::create_dir_all(&base_dir);
    base_dir
}

pub fn get_engine_config_file() -> PathBuf {
    get_bin_dir().join("engine_config.json")
}

pub fn load_engine_config() -> CustomEngineConfig {
    let path = get_engine_config_file();
    if let Ok(content) = std::fs::read_to_string(&path) {
        if let Ok(config) = serde_json::from_str::<CustomEngineConfig>(&content) {
            return config;
        }
    }
    CustomEngineConfig::default()
}

pub fn save_engine_config(config: &CustomEngineConfig) -> Result<(), String> {
    let path = get_engine_config_file();
    let content = serde_json::to_string_pretty(config).map_err(|e| e.to_string())?;
    std::fs::write(&path, content).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn find_detected_ytdlp_paths() -> Vec<String> {
    let mut detected = Vec::new();
    #[cfg(windows)]
    {
        for p_str in &[r"E:\Programs\yt-dlp.exe", r"D:\Programs\yt-dlp.exe", r"C:\Programs\yt-dlp.exe"] {
            let p = PathBuf::from(p_str);
            if p.exists() {
                detected.push(p_str.to_string());
            }
        }
    }
    if let Ok(candidates) = which_bins("yt-dlp") {
        for p in candidates {
            let s = p.to_string_lossy().to_string();
            if !detected.contains(&s) {
                detected.push(s);
            }
        }
    }
    detected
}

pub fn get_ytdlp_path() -> PathBuf {
    let config = load_engine_config();
    if let Some(custom) = config.custom_ytdlp_path {
        let trimmed = custom.trim();
        if !trimmed.is_empty() {
            let p = PathBuf::from(trimmed);
            if p.exists() {
                return p;
            }
        }
    }

    let local_cli = get_bin_dir().join(if cfg!(windows) { "yt-dlp-cli.exe" } else { "yt-dlp-cli" });
    if local_cli.exists() {
        return local_cli;
    }

    let local_standard = get_bin_dir().join(if cfg!(windows) { "yt-dlp.exe" } else { "yt-dlp" });
    if local_standard.exists() {
        return local_standard;
    }

    #[cfg(windows)]
    {
        for p_str in &[r"E:\Programs\yt-dlp.exe", r"D:\Programs\yt-dlp.exe", r"C:\Programs\yt-dlp.exe"] {
            let p = PathBuf::from(p_str);
            if p.exists() {
                return p;
            }
        }
    }

    let current_exe = std::env::current_exe().ok().and_then(|p| p.canonicalize().ok());
    if let Ok(candidates) = which_bins("yt-dlp") {
        for path in candidates {
            if let Ok(canonical) = path.canonicalize() {
                if let Some(ref cur) = current_exe {
                    if canonical == *cur {
                        continue;
                    }
                }
                return canonical;
            }
        }
    }

    local_cli
}

pub fn get_ffmpeg_path() -> Option<PathBuf> {
    let config = load_engine_config();
    if let Some(custom) = config.custom_ffmpeg_path {
        let trimmed = custom.trim();
        if !trimmed.is_empty() {
            let p = PathBuf::from(trimmed);
            if p.exists() {
                return Some(p);
            }
        }
    }

    let local_path = get_bin_dir().join(if cfg!(windows) { "ffmpeg.exe" } else { "ffmpeg" });
    if local_path.exists() {
        return Some(local_path);
    }

    #[cfg(windows)]
    {
        for p_str in &[r"E:\Programs\ffmpeg.exe", r"D:\Programs\ffmpeg.exe", r"C:\ffmpeg\bin\ffmpeg.exe"] {
            let p = PathBuf::from(p_str);
            if p.exists() {
                return Some(p);
            }
        }
    }

    let current_exe = std::env::current_exe().ok().and_then(|p| p.canonicalize().ok());
    if let Ok(candidates) = which_bins("ffmpeg") {
        for path in candidates {
            if let Ok(canonical) = path.canonicalize() {
                if let Some(ref cur) = current_exe {
                    if canonical == *cur {
                        continue;
                    }
                }
                return Some(canonical);
            }
        }
    }

    None
}

fn which_bins(name: &str) -> Result<Vec<PathBuf>, String> {
    let program = if cfg!(windows) { "where" } else { "which" };
    let mut cmd = Command::new(program);
    cmd.arg(name);
    hide_console(&mut cmd);

    let output = cmd.output().map_err(|e| e.to_string())?;
    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        let list: Vec<PathBuf> = stdout
            .lines()
            .map(str::trim)
            .filter(|line| !line.is_empty())
            .map(PathBuf::from)
            .filter(|p| p.exists())
            .collect();
        if !list.is_empty() {
            return Ok(list);
        }
    }
    Err(format!("Binary {name} not found in PATH"))
}

fn probe_version(path: &Path, arg: &str) -> Option<String> {
    let mut cmd = Command::new(path);
    cmd.arg(arg);
    hide_console(&mut cmd);
    let output = cmd.output().ok()?;
    if !output.status.success() {
        return None;
    }

    let text = String::from_utf8_lossy(&output.stdout);
    text.lines().next().map(str::trim).filter(|s| !s.is_empty()).map(String::from)
}

pub fn check_status() -> EngineStatus {
    let config = load_engine_config();
    let ytdlp_p = get_ytdlp_path();
    let ytdlp_version = if ytdlp_p.exists() {
        probe_version(&ytdlp_p, "--version")
    } else {
        None
    };

    let ffmpeg_p = get_ffmpeg_path();
    let ffmpeg_version = ffmpeg_p
        .as_ref()
        .and_then(|p| probe_version(p, "-version"));

    EngineStatus {
        ytdlp_available: ytdlp_version.is_some(),
        ytdlp_version: ytdlp_version.unwrap_or_else(|| "Not installed".to_string()),
        ytdlp_path: ytdlp_p.to_string_lossy().to_string(),
        ffmpeg_available: ffmpeg_version.is_some(),
        ffmpeg_version: ffmpeg_version.unwrap_or_else(|| "Not installed".to_string()),
        ffmpeg_path: ffmpeg_p
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_default(),
        custom_ytdlp_path: config.custom_ytdlp_path,
        custom_ffmpeg_path: config.custom_ffmpeg_path,
        detected_ytdlp_paths: find_detected_ytdlp_paths(),
    }
}

async fn download_to_file(url: &str, target: &Path) -> Result<(), String> {
    let client = reqwest::Client::builder()
        .user_agent("YT-DLP-Studio/1.0.0")
        .redirect(reqwest::redirect::Policy::limited(10))
        .build()
        .map_err(|e| format!("Không thể tạo HTTP client: {e}"))?;

    let response = client
        .get(url)
        .send()
        .await
        .map_err(|e| format!("Lỗi mạng khi tải dependency: {e}"))?;

    if !response.status().is_success() {
        return Err(format!("Máy chủ trả về HTTP {} khi tải dependency", response.status()));
    }

    if let Some(parent) = target.parent() {
        tokio::fs::create_dir_all(parent)
            .await
            .map_err(|e| format!("Không thể tạo thư mục engine: {e}"))?;
    }

    let temp = target.with_extension("download");
    let mut file = tokio::fs::File::create(&temp)
        .await
        .map_err(|e| format!("Không thể tạo file tạm: {e}"))?;

    let mut stream = response.bytes_stream();
    while let Some(chunk) = stream.next().await {
        let chunk = chunk.map_err(|e| format!("Lỗi khi nhận dữ liệu dependency: {e}"))?;
        file.write_all(&chunk)
            .await
            .map_err(|e| format!("Không thể ghi dependency: {e}"))?;
    }
    file.flush().await.map_err(|e| format!("Không thể flush file: {e}"))?;
    drop(file);

    if target.exists() {
        let _ = tokio::fs::remove_file(target).await;
    }
    tokio::fs::rename(&temp, target)
        .await
        .map_err(|e| format!("Không thể hoàn tất file dependency: {e}"))?;

    Ok(())
}

pub async fn download_ytdlp_binary() -> Result<String, String> {
    let bin_dir = get_bin_dir();
    let target_file = bin_dir.join(if cfg!(windows) { "yt-dlp-cli.exe" } else { "yt-dlp-cli" });

    let download_url = if cfg!(windows) {
        "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe"
    } else if cfg!(target_os = "macos") {
        "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos"
    } else {
        "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp"
    };

    download_to_file(download_url, &target_file).await?;

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let _ = std::fs::set_permissions(&target_file, std::fs::Permissions::from_mode(0o755));
    }

    Ok(target_file.to_string_lossy().to_string())
}

#[cfg(windows)]
fn extract_ffmpeg_windows(zip_path: &Path, bin_dir: &Path) -> Result<(), String> {
    let file = std::fs::File::open(zip_path)
        .map_err(|e| format!("Không thể mở gói FFmpeg: {e}"))?;
    let mut archive = zip::ZipArchive::new(file)
        .map_err(|e| format!("Gói FFmpeg không hợp lệ: {e}"))?;

    let mut found_ffmpeg = false;
    let mut found_ffprobe = false;

    for index in 0..archive.len() {
        let mut entry = archive
            .by_index(index)
            .map_err(|e| format!("Không thể đọc FFmpeg ZIP: {e}"))?;
        if entry.is_dir() {
            continue;
        }

        let filename = Path::new(entry.name())
            .file_name()
            .and_then(|v| v.to_str())
            .unwrap_or("")
            .to_ascii_lowercase();

        let target_name = match filename.as_str() {
            "ffmpeg.exe" => {
                found_ffmpeg = true;
                "ffmpeg.exe"
            }
            "ffprobe.exe" => {
                found_ffprobe = true;
                "ffprobe.exe"
            }
            _ => continue,
        };

        let target = bin_dir.join(target_name);
        let temp = target.with_extension("new");
        let mut out = std::fs::File::create(&temp)
            .map_err(|e| format!("Không thể tạo {target_name}: {e}"))?;
        io::copy(&mut entry, &mut out)
            .map_err(|e| format!("Không thể giải nén {target_name}: {e}"))?;
        drop(out);
        if target.exists() {
            let _ = std::fs::remove_file(&target);
        }
        std::fs::rename(&temp, &target)
            .map_err(|e| format!("Không thể cài {target_name}: {e}"))?;
    }

    if !found_ffmpeg || !found_ffprobe {
        return Err("Không tìm thấy ffmpeg.exe/ffprobe.exe trong gói tải về".to_string());
    }

    Ok(())
}

pub async fn download_ffmpeg_binary() -> Result<String, String> {
    #[cfg(windows)]
    {
        let bin_dir = get_bin_dir();
        let archive_path = bin_dir.join("ffmpeg-engine.zip");
        let url = "https://github.com/yt-dlp/FFmpeg-Builds/releases/latest/download/ffmpeg-master-latest-win64-gpl.zip";

        download_to_file(url, &archive_path).await?;
        let extract_zip = archive_path.clone();
        let extract_dir = bin_dir.clone();
        tokio::task::spawn_blocking(move || extract_ffmpeg_windows(&extract_zip, &extract_dir))
            .await
            .map_err(|e| format!("FFmpeg installer task failed: {e}"))??;
        let _ = tokio::fs::remove_file(&archive_path).await;

        let ffmpeg = bin_dir.join("ffmpeg.exe");
        if probe_version(&ffmpeg, "-version").is_none() {
            return Err("Đã giải nén FFmpeg nhưng không chạy được ffmpeg.exe".to_string());
        }
        return Ok(ffmpeg.to_string_lossy().to_string());
    }

    #[cfg(not(windows))]
    {
        Err("Cài FFmpeg tự động hiện được hỗ trợ cho Windows. Hãy cài FFmpeg/ffprobe vào PATH.".to_string())
    }
}
