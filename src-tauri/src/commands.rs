use crate::engine_manager::{check_status, download_ytdlp_binary, EngineStatus};
use crate::ytdlp::{
    execute_download, fetch_media_metadata, DownloadManager, DownloadRequest, MediaInfo,
};
use std::path::PathBuf;
use std::sync::Arc;
use tauri::{AppHandle, State};

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

    tokio::spawn(async move {
        let _ = execute_download(app, req_clone, active_map).await;
    });

    Ok(task_id)
}

#[tauri::command]
pub async fn cancel_download(
    task_id: String,
    manager: State<'_, Arc<DownloadManager>>,
) -> Result<(), String> {
    let mut map = manager.active_processes.lock().await;
    if let Some(pid) = map.remove(&task_id) {
        #[cfg(windows)]
        {
            let _ = std::process::Command::new("taskkill")
                .args(["/F", "/T", "/PID", &pid.to_string()])
                .output();
        }
        #[cfg(unix)]
        {
            let _ = std::process::Command::new("kill")
                .args(["-9", &pid.to_string()])
                .output();
        }
        return Ok(());
    }
    Err("Download task not active".to_string())
}

#[tauri::command]
pub fn get_engine_status() -> EngineStatus {
    check_status()
}

#[tauri::command]
pub async fn update_engine() -> Result<String, String> {
    download_ytdlp_binary().await
}

#[tauri::command]
pub fn get_default_download_dir() -> String {
    dirs::download_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .to_string_lossy()
        .to_string()
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
        std::process::Command::new("explorer")
            .arg(target)
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
        std::process::Command::new("cmd")
            .args(["/C", "start", "", &path])
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

