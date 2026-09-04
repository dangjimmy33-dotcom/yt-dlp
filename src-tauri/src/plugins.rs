use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::time::SystemTime;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CustomPluginInfo {
    pub id: String,
    pub name: String,
    pub filename: String,
    pub path: String,
    pub size: u64,
    pub size_str: String,
    pub modified_at: String,
    pub is_enabled: bool,
    pub description: Option<String>,
}

pub fn get_plugins_dir() -> PathBuf {
    let mut base_dir = dirs::data_local_dir().unwrap_or_else(|| PathBuf::from("."));
    base_dir.push("YT-DLP-Studio");
    base_dir.push("plugins");
    let _ = fs::create_dir_all(&base_dir);
    base_dir
}

pub fn get_system_yt_dlp_plugins_dir() -> Option<PathBuf> {
    if let Some(mut appdata) = dirs::config_dir() {
        appdata.push("yt-dlp");
        appdata.push("plugins");
        let _ = fs::create_dir_all(&appdata);
        return Some(appdata);
    }
    None
}

fn format_bytes(bytes: u64) -> String {
    if bytes < 1024 {
        format!("{} B", bytes)
    } else if bytes < 1024 * 1024 {
        format!("{:.1} KB", bytes as f64 / 1024.0)
    } else {
        format!("{:.2} MB", bytes as f64 / (1024.0 * 1024.0))
    }
}

fn extract_description_from_py(path: &Path) -> Option<String> {
    if let Ok(content) = fs::read_to_string(path) {
        for line in content.lines().take(20) {
            let trimmed = line.trim();
            if trimmed.starts_with("# description:") || trimmed.starts_with("# Description:") {
                return Some(trimmed[14..].trim().to_string());
            }
            if trimmed.starts_with("# desc:") || trimmed.starts_with("# Desc:") {
                return Some(trimmed[7..].trim().to_string());
            }
            if (trimmed.starts_with("\"\"\"") || trimmed.starts_with("'''")) && trimmed.len() > 6 {
                let stripped = trimmed.trim_matches(|c| c == '"' || c == '\'').trim();
                if !stripped.is_empty() {
                    return Some(stripped.to_string());
                }
            }
        }
    }
    None
}

pub fn list_plugins() -> Vec<CustomPluginInfo> {
    let dir = get_plugins_dir();
    let mut result = Vec::new();

    if let Ok(entries) = fs::read_dir(&dir) {
        for entry in entries.flatten() {
            let path = entry.path();
            if path.is_file() {
                let filename = match path.file_name().and_then(|n| n.to_str()) {
                    Some(n) => n.to_string(),
                    None => continue,
                };

                let is_disabled = filename.ends_with(".disabled");
                let clean_name = if is_disabled {
                    filename.trim_end_matches(".disabled").to_string()
                } else {
                    filename.clone()
                };

                let is_py = clean_name.ends_with(".py");
                let is_zip = clean_name.ends_with(".zip");

                if !is_py && !is_zip {
                    continue;
                }

                let meta = fs::metadata(&path).ok();
                let size = meta.as_ref().map(|m| m.len()).unwrap_or(0);
                let size_str = format_bytes(size);

                let modified_at = meta
                    .and_then(|m| m.modified().ok())
                    .map(|time| {
                        let duration = time.duration_since(SystemTime::UNIX_EPOCH).unwrap_or_default();
                        let secs = duration.as_secs();
                        format!("{secs}")
                    })
                    .unwrap_or_else(|| "0".to_string());

                let description = if is_py {
                    extract_description_from_py(&path)
                } else {
                    Some("Gói plugin nén .zip".to_string())
                };

                let display_name = clean_name
                    .trim_end_matches(".py")
                    .trim_end_matches(".zip")
                    .replace('_', " ")
                    .replace('-', " ");

                result.push(CustomPluginInfo {
                    id: clean_name.clone(),
                    name: display_name,
                    filename,
                    path: path.to_string_lossy().to_string(),
                    size,
                    size_str,
                    modified_at,
                    is_enabled: !is_disabled,
                    description,
                });
            }
        }
    }

    result.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    result
}

pub fn install_plugin_file(source_path: &Path) -> Result<CustomPluginInfo, String> {
    if !source_path.exists() {
        return Err("File nguồn không tồn tại".to_string());
    }

    let file_name = source_path
        .file_name()
        .and_then(|n| n.to_str())
        .ok_or_else(|| "Tên file không hợp lệ".to_string())?;

    if !file_name.ends_with(".py") && !file_name.ends_with(".zip") {
        return Err("Chỉ hỗ trợ file plugin định dạng .py hoặc .zip".to_string());
    }

    let target_dir = get_plugins_dir();
    let target_path = target_dir.join(file_name);

    fs::copy(source_path, &target_path)
        .map_err(|e| format!("Không thể sao chép file plugin: {e}"))?;

    // Also sync to system yt-dlp plugin dir for direct engine discovery
    if let Some(sys_dir) = get_system_yt_dlp_plugins_dir() {
        let _ = fs::copy(source_path, sys_dir.join(file_name));
    }

    let list = list_plugins();
    list.into_iter()
        .find(|p| p.filename == file_name || p.id == file_name)
        .ok_or_else(|| "Plugin đã cài đặt nhưng không thể đọc thông tin".to_string())
}

pub async fn install_plugin_from_url(url: &str, custom_name: Option<&str>) -> Result<CustomPluginInfo, String> {
    let clean_url = url.trim();
    if !clean_url.starts_with("http://") && !clean_url.starts_with("https://") {
        return Err("URL không hợp lệ. Vui lòng nhập link https://...".to_string());
    }

    // Convert standard GitHub file link to raw.githubusercontent link
    let effective_url = if clean_url.contains("github.com") && clean_url.contains("/blob/") {
        clean_url
            .replace("github.com", "raw.githubusercontent.com")
            .replace("/blob/", "/")
    } else {
        clean_url.to_string()
    };

    let filename = if let Some(name) = custom_name {
        let trimmed = name.trim();
        if trimmed.ends_with(".py") || trimmed.ends_with(".zip") {
            trimmed.to_string()
        } else {
            format!("{trimmed}.py")
        }
    } else {
        let segments: Vec<&str> = clean_url.split('/').filter(|s| !s.is_empty()).collect();
        let last = segments.last().copied().unwrap_or("custom_extractor.py");
        if last.ends_with(".py") || last.ends_with(".zip") {
            last.to_string()
        } else {
            format!("{last}.py")
        }
    };

    let target_dir = get_plugins_dir();
    let target_path = target_dir.join(&filename);

    let client = reqwest::Client::builder()
        .user_agent("YT-DLP-Studio-GUI/1.0")
        .build()
        .map_err(|e| format!("Lỗi khởi tạo HTTP client: {e}"))?;

    let resp = client
        .get(&effective_url)
        .send()
        .await
        .map_err(|e| format!("Không thể kết nối đến URL: {e}"))?;

    if !resp.status().is_success() {
        return Err(format!("Máy chủ phản hồi lỗi HTTP {}", resp.status()));
    }

    let bytes = resp
        .bytes()
        .await
        .map_err(|e| format!("Không thể tải nội dung file: {e}"))?;

    fs::write(&target_path, &bytes)
        .map_err(|e| format!("Không thể lưu file plugin vào đĩa: {e}"))?;

    // Also sync to system plugin folder
    if let Some(sys_dir) = get_system_yt_dlp_plugins_dir() {
        let _ = fs::write(sys_dir.join(&filename), &bytes);
    }

    let list = list_plugins();
    list.into_iter()
        .find(|p| p.filename == filename || p.id == filename)
        .ok_or_else(|| "Tải plugin thành công nhưng không thể đọc thông tin".to_string())
}

pub fn toggle_plugin(filename: &str, enable: bool) -> Result<(), String> {
    let dir = get_plugins_dir();
    let current_path = dir.join(filename);

    if !current_path.exists() {
        return Err(format!("File plugin '{filename}' không tồn tại"));
    }

    let target_filename = if enable {
        filename.trim_end_matches(".disabled").to_string()
    } else {
        if filename.ends_with(".disabled") {
            filename.to_string()
        } else {
            format!("{filename}.disabled")
        }
    };

    let target_path = dir.join(&target_filename);
    if current_path != target_path {
        fs::rename(&current_path, &target_path)
            .map_err(|e| format!("Không thể đổi trạng thái plugin: {e}"))?;
    }

    // Update system plugin directory as well
    if let Some(sys_dir) = get_system_yt_dlp_plugins_dir() {
        let sys_curr = sys_dir.join(filename);
        let sys_target = sys_dir.join(&target_filename);
        if sys_curr.exists() {
            let _ = fs::rename(sys_curr, sys_target);
        }
    }

    Ok(())
}

pub fn delete_plugin(filename: &str) -> Result<(), String> {
    let dir = get_plugins_dir();
    let file_path = dir.join(filename);

    if file_path.exists() {
        fs::remove_file(&file_path)
            .map_err(|e| format!("Không thể xóa plugin: {e}"))?;
    }

    if let Some(sys_dir) = get_system_yt_dlp_plugins_dir() {
        let sys_file = sys_dir.join(filename);
        if sys_file.exists() {
            let _ = fs::remove_file(sys_file);
        }
    }

    Ok(())
}

pub fn open_plugins_folder() -> Result<(), String> {
    let dir = get_plugins_dir();
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        std::process::Command::new("explorer")
            .arg(&dir)
            .creation_flags(0x0800_0000)
            .spawn()
            .map_err(|e| format!("Không thể mở Explorer: {e}"))?;
        Ok(())
    }
    #[cfg(not(windows))]
    {
        opener::open(&dir).map_err(|e| format!("Không thể mở thư mục: {e}"))
    }
}
