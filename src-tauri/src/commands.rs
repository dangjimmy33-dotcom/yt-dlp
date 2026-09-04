use crate::engine_manager::{
    check_status, download_ffmpeg_binary, download_ytdlp_binary, EngineStatus,
};
use crate::ytdlp::{
    execute_download, fetch_media_metadata, DownloadManager, DownloadProgressEvent, DownloadRequest,
    MediaInfo,
};
use std::path::PathBuf;
use std::sync::Arc;
use tauri::{AppHandle, Emitter, State};

#[tauri::command]
pub async fn fetch_media_info(
    url: String,
    cookies_browser: Option<String>,
) -> Result<MediaInfo, String> {
    fetch_media_metadata(&url, cookies_browser.as_deref()).await
}

#[tauri::command]
pub async fn start_download(
    app: AppHandle,
    req: DownloadRequest,
    manager: State<'_, Arc<DownloadManager>>,
) -> Result<String, String> {
    let active_map = manager.active_processes.clone();
    let req_clone = req.clone();
    let task_id = req.id.clone();
    let app_for_task = app.clone();

    tokio::spawn(async move {
        if let Err(error) = execute_download(app_for_task.clone(), req_clone, active_map).await {
            let _ = app_for_task.emit(
                "download-progress",
                DownloadProgressEvent {
                    task_id: task_id.clone(),
                    percent: 0.0,
                    speed: "0 B/s".to_string(),
                    eta: "--:--".to_string(),
                    total_size: "0 B".to_string(),
                    status: "error".to_string(),
                    error_message: Some(error),
                    output_path: None,
                },
            );
        }
    });

    Ok(req.id)
}

#[tauri::command]
pub async fn cancel_download(
    app: AppHandle,
    task_id: String,
    manager: State<'_, Arc<DownloadManager>>,
) -> Result<(), String> {
    let mut map = manager.active_processes.lock().await;
    if let Some(pid) = map.remove(&task_id) {
        #[cfg(windows)]
        {
            use std::os::windows::process::CommandExt;
            let _ = std::process::Command::new("taskkill")
                .args(["/F", "/T", "/PID", &pid.to_string()])
                .creation_flags(0x0800_0000)
                .output();
        }
        #[cfg(unix)]
        {
            let _ = std::process::Command::new("kill")
                .args(["-9", &pid.to_string()])
                .output();
        }
        drop(map);

        let _ = app.emit(
            "download-progress",
            DownloadProgressEvent {
                task_id,
                percent: 0.0,
                speed: "0 B/s".to_string(),
                eta: "--:--".to_string(),
                total_size: "Đã hủy".to_string(),
                status: "cancelled".to_string(),
                error_message: None,
                output_path: None,
            },
        );
        return Ok(());
    }
    Err("Download task not active".to_string())
}

#[tauri::command]
pub async fn get_engine_status() -> Result<EngineStatus, String> {
    tauri::async_runtime::spawn_blocking(check_status)
        .await
        .map_err(|e| format!("Không thể kiểm tra engine: {e}"))
}

#[tauri::command]
pub async fn update_engine() -> Result<String, String> {
    download_ytdlp_binary().await
}

#[tauri::command]
pub async fn install_ffmpeg() -> Result<String, String> {
    download_ffmpeg_binary().await
}

#[tauri::command]
pub fn get_default_download_dir() -> String {
    dirs::download_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .to_string_lossy()
        .to_string()
}

#[tauri::command]
pub fn load_app_settings() -> Option<serde_json::Value> {
    let mut config_path = dirs::data_local_dir().unwrap_or_else(|| PathBuf::from("."));
    config_path.push("YT-DLP-Studio");
    config_path.push("config.json");
    if config_path.exists() {
        if let Ok(content) = std::fs::read_to_string(&config_path) {
            if let Ok(json) = serde_json::from_str(&content) {
                return Some(json);
            }
        }
    }
    None
}

#[tauri::command]
pub fn save_app_settings(settings: serde_json::Value) -> Result<(), String> {
    let mut config_dir = dirs::data_local_dir().unwrap_or_else(|| PathBuf::from("."));
    config_dir.push("YT-DLP-Studio");
    let _ = std::fs::create_dir_all(&config_dir);
    let config_path = config_dir.join("config.json");
    let content = serde_json::to_string_pretty(&settings).map_err(|e| e.to_string())?;
    std::fs::write(&config_path, content).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn open_in_folder(path: String) -> Result<(), String> {
    let p = PathBuf::from(&path);
    let target = if p.is_file() {
        p.parent().unwrap_or(&p).to_path_buf()
    } else {
        p
    };

    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        std::process::Command::new("explorer")
            .arg(target)
            .creation_flags(0x0800_0000)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(target)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(target)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
pub fn open_file(path: String) -> Result<(), String> {
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        std::process::Command::new("cmd")
            .args(["/C", "start", "", &path])
            .creation_flags(0x0800_0000)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "linux")]
    {
        std::process::Command::new("xdg-open")
            .arg(&path)
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
pub fn open_url(url: String) -> Result<(), String> {
    open_file(url)
}

#[tauri::command]
pub fn minimize_window(window: tauri::Window) {
    let _ = window.minimize();
}

#[tauri::command]
pub fn toggle_maximize_window(window: tauri::Window) {
    if let Ok(is_max) = window.is_maximized() {
        if is_max {
            let _ = window.unmaximize();
        } else {
            let _ = window.maximize();
        }
    }
}

#[tauri::command]
pub fn close_window(window: tauri::Window) {
    let _ = window.close();
}

#[tauri::command]
pub fn start_drag_window(window: tauri::Window) {
    let _ = window.start_dragging();
}
