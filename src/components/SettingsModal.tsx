import React from "react";
import { AppSettings } from "../types";
import { playNotificationBell } from "../utils/sound";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import {
  X,
  Folder,
  Sliders,
  Cookie,
  Shield,
  Palette,
  Bell,
  Sparkles,
  Zap,
  Save,
  Volume2,
  FileCheck,
} from "lucide-react";
import { motion } from "framer-motion";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  onSelectFolder?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [localSettings, setLocalSettings] = React.useState<AppSettings>(settings);

  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleBrowseFolder = async () => {
    try {
      const selected = await openDialog({
        directory: true,
        multiple: false,
        defaultPath: localSettings.defaultDownloadDir,
      });

      if (selected && typeof selected === "string") {
        setLocalSettings((prev) => ({ ...prev, defaultDownloadDir: selected }));
      }
    } catch (e) {
      console.error("Folder picker error in settings:", e);
    }
  };

  const handleSave = () => {
    onSaveSettings(localSettings);
    onClose();
  };

  const browsers = [
    { id: "none", label: "Không dùng (Mặc định)" },
    { id: "chrome", label: "Google Chrome" },
    { id: "edge", label: "Microsoft Edge" },
    { id: "firefox", label: "Mozilla Firefox" },
    { id: "brave", label: "Brave Browser" },
    { id: "opera", label: "Opera" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-xl max-h-[85vh] glass-panel rounded-3xl p-5 flex flex-col space-y-4 shadow-2xl border border-white/10"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Cài Đặt Ứng Dụng</h3>
              <p className="text-xs text-slate-400">Tùy chỉnh thư mục lưu, mạng và các tùy chọn mặc định</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Settings Body */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1">
          {/* Download Directory */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Folder className="w-3.5 h-3.5 text-indigo-400" />
              <span>Thư mục lưu trữ mặc định</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={localSettings.defaultDownloadDir}
                className="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono text-slate-300"
              />
              <button
                type="button"
                onClick={handleBrowseFolder}
                className="px-3.5 py-2 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-xs font-semibold text-indigo-300 transition-all cursor-pointer shrink-0"
              >
                Duyệt...
              </button>
            </div>
          </div>

          {/* Max Concurrent Downloads */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-purple-400" />
                <span>Số luồng tải đồng thời tối đa</span>
              </label>
              <span className="text-xs font-mono font-bold text-indigo-300">
                {localSettings.maxConcurrentDownloads} luồng
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={8}
              value={localSettings.maxConcurrentDownloads}
              onChange={(e) =>
                setLocalSettings({
                  ...localSettings,
                  maxConcurrentDownloads: parseInt(e.target.value),
                })
              }
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          {/* Browser Cookies for Private/Age Restricted Videos */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Cookie className="w-3.5 h-3.5 text-amber-400" />
              <span>Trích xuất Cookie trình duyệt (Tải video riêng tư / Giới hạn quyền)</span>
            </label>
            <select
              value={localSettings.cookiesBrowser}
              onChange={(e) =>
                setLocalSettings({ ...localSettings, cookiesBrowser: e.target.value })
              }
              className="w-full glass-input px-3 py-2 rounded-xl text-xs text-slate-200 cursor-pointer"
            >
              {browsers.map((b) => (
                <option key={b.id} value={b.id} className="bg-slate-900 text-slate-200">
                  {b.label}
                </option>
              ))}
            </select>
          </div>

          {/* Default Options Checkboxes */}
          <div className="space-y-2 pt-2 border-t border-white/[0.06]">
            <span className="text-xs font-bold text-slate-300 block">Tự động hóa & Tùy chọn</span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label className="flex items-center gap-2.5 p-2.5 rounded-xl glass-card cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.embedMetadata}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, embedMetadata: e.target.checked })
                  }
                  className="rounded accent-indigo-500"
                />
                <span className="text-xs text-slate-200 font-medium">Nhúng Metadata ID3 Tag</span>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-xl glass-card cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.embedThumbnail}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, embedThumbnail: e.target.checked })
                  }
                  className="rounded accent-indigo-500"
                />
                <span className="text-xs text-slate-200 font-medium">Nhúng ảnh bìa Thumbnail</span>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-xl glass-card cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.sponsorBlock}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, sponsorBlock: e.target.checked })
                  }
                  className="rounded accent-indigo-500"
                />
                <span className="text-xs text-slate-200 font-medium">Tự bỏ qua SponsorBlock</span>
              </label>

              <label className="flex items-center gap-2.5 p-2.5 rounded-xl glass-card cursor-pointer">
                <input
                  type="checkbox"
                  checked={localSettings.notifications}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, notifications: e.target.checked })
                  }
                  className="rounded accent-indigo-500"
                />
                <span className="text-xs text-slate-200 font-medium">Thông báo khi tải xong</span>
              </label>
            </div>
          </div>

          {/* Sound & Notifications Section */}
          <div className="space-y-2.5 pt-2 border-t border-white/[0.06]">
            <span className="text-xs font-bold text-slate-300 block flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-amber-400" />
              <span>Âm Thanh & Thông Báo</span>
            </span>

            <div className="p-3 rounded-2xl bg-slate-950/40 border border-white/[0.06] flex items-center justify-between text-xs">
              <div>
                <span className="font-semibold text-slate-200 block">Chuông thông báo (Bell Chime)</span>
                <span className="text-[11px] text-slate-400 block">Tự động phát chuông khi có bản cập nhật mới</span>
              </div>
              <button
                type="button"
                onClick={() => playNotificationBell()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition-all cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Thử chuông</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-white/[0.08] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white glass-button-secondary transition-all cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold glass-button-primary cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Lưu Cài Đặt</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
