use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::process::Command;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EngineStatus {
    pub ytdlp_available: bool,
    pub ytdlp_version: String,
    pub ytdlp_path: String,
    pub ffmpeg_available: bool,
    pub ffmpeg_version: String,
    pub ffmpeg_path: String,
}

pub fn get_bin_dir() -> PathBuf {
    let mut base_dir = dirs::data_local_dir().unwrap_or_else(|| PathBuf::from("."));
    base_dir.push("YT-DLP-Studio");
    base_dir.push("bin");
    let _ = std::fs::create_dir_all(&base_dir);
    base_dir
}

pub fn get_ytdlp_path() -> PathBuf {
    // 1. Check local app bin dir first (isolated from GUI exe)
    let local_path = get_bin_dir().join(if cfg!(windows) { "yt-dlp-cli.exe" } else { "yt-dlp-cli" });
    if local_path.exists() {
        return local_path;
    }

    // Also check standard yt-dlp.exe in our isolated bin folder
    let local_ytdlp = get_bin_dir().join(if cfg!(windows) { "yt-dlp.exe" } else { "yt-dlp" });
    if local_ytdlp.exists() {
        return local_ytdlp;
    }

    // 2. Check system PATH, but strictly EXCLUDE current running GUI exe!
    let current_exe = std::env::current_exe().ok().and_then(|p| p.canonicalize().ok());
    if let Ok(candidates) = which_bins("yt-dlp") {
        for path in candidates {
            if let Ok(canonical) = path.canonicalize() {
                if let Some(ref cur) = current_exe {
                    if canonical == *cur {
                        // Skip ourselves!
                        continue;
                    }
                }
                return canonical;
            }
        }
    }

    // Default to local target
    local_path
}

pub fn get_ffmpeg_path() -> Option<PathBuf> {
    // 1. Check local app bin dir
    let local_path = get_bin_dir().join(if cfg!(windows) { "ffmpeg.exe" } else { "ffmpeg" });
    if local_path.exists() {
        return Some(local_path);
    }

    // 2. Check system PATH
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
    let cmd = if cfg!(windows) { "where" } else { "which" };
    let output = Command::new(cmd)
        .arg(name)
        .output()
        .map_err(|e| e.to_string())?;

    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        let mut list = Vec::new();
        for line in stdout.lines() {
            let p = PathBuf::from(line.trim());
            if p.exists() {
                list.push(p);
            }
        }
        if !list.is_empty() {
            return Ok(list);
        }
    }
    Err(format!("Binary {} not found in PATH", name))
}

pub fn check_status() -> EngineStatus {
    let ytdlp_p = get_ytdlp_path();
    let mut ytdlp_avail = false;
    let mut ytdlp_ver = String::from("Not installed");

    if ytdlp_p.exists() {
        if let Ok(output) = Command::new(&ytdlp_p).arg("--version").output() {
            if output.status.success() {
                ytdlp_avail = true;
                ytdlp_ver = String::from_utf8_lossy(&output.stdout).trim().to_string();
            }
        }
    }

    let ffmpeg_p = get_ffmpeg_path();
    let mut ffmpeg_avail = false;
    let mut ffmpeg_ver = String::from("Not installed");
    let mut ffmpeg_path_str = String::new();

    if let Some(ref p) = ffmpeg_p {
        ffmpeg_path_str = p.to_string_lossy().to_string();
        if let Ok(output) = Command::new(p).arg("-version").output() {
            if output.status.success() {
                ffmpeg_avail = true;
                let out_str = String::from_utf8_lossy(&output.stdout);
                if let Some(line) = out_str.lines().next() {
                    ffmpeg_ver = line.trim().to_string();
                }
            }
        }
    }

    EngineStatus {
        ytdlp_available: ytdlp_avail,
        ytdlp_version: ytdlp_ver,
        ytdlp_path: ytdlp_p.to_string_lossy().to_string(),
        ffmpeg_available: ffmpeg_avail,
        ffmpeg_version: ffmpeg_ver,
        ffmpeg_path: ffmpeg_path_str,
    }
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

    let client = reqwest::Client::builder()
        .user_agent("YTDLP-Studio/1.0.0")
        .build()
        .map_err(|e| format!("Failed to create HTTP client: {}", e))?;

    let response = client
        .get(download_url)
        .send()
        .await
        .map_err(|e| format!("Network error downloading yt-dlp: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Download failed with status: {}", response.status()));
    }

    let bytes = response
        .bytes()
        .await
        .map_err(|e| format!("Failed to read response body: {}", e))?;

    std::fs::write(&target_file, bytes)
        .map_err(|e| format!("Failed to save yt-dlp binary: {}", e))?;

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let _ = std::fs::set_permissions(&target_file, std::fs::Permissions::from_mode(0o755));
    }

    Ok(target_file.to_string_lossy().to_string())
}
