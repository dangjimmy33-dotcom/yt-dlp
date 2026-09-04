pub mod commands;
pub mod engine_manager;
pub mod ytdlp;

use commands::*;
use std::sync::Arc;
use tauri::Manager;
use ytdlp::DownloadManager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let download_manager = Arc::new(DownloadManager::new());

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_shell::init())
        .manage(download_manager)
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();
            let _ = window.set_shadow(true);

            #[cfg(target_os = "macos")]
            {
                use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial};
                let _ = apply_vibrancy(&window, NSVisualEffectMaterial::HudWindow, None, None);
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            fetch_media_info,
            start_download,
            cancel_download,
            get_engine_status,
            update_engine,
            install_ffmpeg,
            get_default_download_dir,
            load_app_settings,
            save_app_settings,
            open_in_folder,
            open_file,
            open_url,
            minimize_window,
            toggle_maximize_window,
            close_window,
            start_drag_window
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
