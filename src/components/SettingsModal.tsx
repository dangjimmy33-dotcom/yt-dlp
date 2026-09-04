import React, { useState, useEffect, useRef } from "react";
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
  Globe,
  Compass,
  Flame,
  Radio,
  Check,
  ChevronDown,
  Boxes,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  onSelectFolder?: () => void;
  onOpenPlugins?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onOpenPlugins,
}) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [isBrowserDropdownOpen, setIsBrowserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings, isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsBrowserDropdownOpen(false);
      }
    };
    if (isBrowserDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isBrowserDropdownOpen]);

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
    {
      id: "none",
      name: "Không dùng (Mặc định)",
      desc: "Chế độ chuẩn không trích xuất cookie",
      icon: Globe,
      color: "text-slate-400",
      bg: "bg-slate-500/10",
      border: "border-slate-500/30",
    },
    {
      id: "chrome",
      name: "Google Chrome",
      desc: "Trích xuất cookie từ Google Chrome",
      icon: Globe,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
    },
    {
      id: "edge",
      name: "Microsoft Edge",
      desc: "Trích xuất cookie từ Microsoft Edge",
      icon: Compass,
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/30",
    },
    {
      id: "firefox",
      name: "Mozilla Firefox",
      desc: "Trích xuất cookie từ Mozilla Firefox",
      icon: Flame,
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
    },
    {
      id: "brave",
      name: "Brave Browser",
      desc: "Trích xuất cookie từ Brave Browser",
      icon: Shield,
      color: "text-orange-400",
      bg: "bg-orange-500/10",
      border: "border-orange-500/30",
    },
    {
      id: "opera",
      name: "Opera Browser",
      desc: "Trích xuất cookie từ Opera",
      icon: Radio,
      color: "text-rose-400",
      bg: "bg-rose-500/10",
      border: "border-rose-500/30",
    },
  ];

  const currentBrowser = browsers.find((b) => b.id === (localSettings.cookiesBrowser || "none")) || browsers[0];
  const CurrentIcon = currentBrowser.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-xl max-h-[88vh] glass-panel rounded-3xl p-5 flex flex-col space-y-4 shadow-2xl border border-white/10"
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

          {/* Browser Cookies for Private/Age Restricted Videos - Sleek Glass Dropdown */}
          <div className="space-y-1.5 relative" ref={dropdownRef}>
            <label className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Cookie className="w-3.5 h-3.5 text-amber-400" />
              <span>Trích xuất Cookie trình duyệt (Tải video riêng tư / Giới hạn quyền)</span>
            </label>

            {/* Custom Trigger Button */}
            <button
              type="button"
              onClick={() => setIsBrowserDropdownOpen(!isBrowserDropdownOpen)}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl glass-input hover:border-indigo-500/50 transition-all cursor-pointer text-left"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`p-1.5 rounded-lg ${currentBrowser.bg} ${currentBrowser.color} shrink-0`}>
                  <CurrentIcon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-slate-100 block truncate">
                    {currentBrowser.name}
                  </span>
                  <span className="text-[10px] text-slate-400 block truncate">
                    {currentBrowser.desc}
                  </span>
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                  isBrowserDropdownOpen ? "rotate-180 text-indigo-400" : ""
                }`}
              />
            </button>

            {/* Popover Menu */}
            <AnimatePresence>
              {isBrowserDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.18 }}
                  className="absolute top-full left-0 right-0 mt-1.5 z-50 p-2 rounded-2xl glass-panel shadow-2xl border border-white/10 space-y-1 backdrop-blur-xl bg-slate-950/95"
                >
                  {browsers.map((b) => {
                    const isSelected = (localSettings.cookiesBrowser || "none") === b.id;
                    const Icon = b.icon;
                    return (
                      <div
                        key={b.id}
                        onClick={() => {
                          setLocalSettings({ ...localSettings, cookiesBrowser: b.id });
                          setIsBrowserDropdownOpen(false);
                        }}
                        className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all ${
                          isSelected
                            ? "bg-indigo-600/20 border border-indigo-500/40 text-white"
                            : "hover:bg-white/[0.06] text-slate-300 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`p-1.5 rounded-lg ${b.bg} ${b.color} shrink-0`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-semibold block">{b.name}</span>
                            <span className="text-[10px] text-slate-400 block truncate">{b.desc}</span>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center text-white shrink-0 shadow-sm">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </motion.div>
              )}
            </AnimatePresence>
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

          {/* Custom Plugins & Websites Section */}
          {onOpenPlugins && (
            <div className="space-y-2.5 pt-2 border-t border-white/[0.06]">
              <span className="text-xs font-bold text-slate-300 block flex items-center gap-1.5">
                <Boxes className="w-3.5 h-3.5 text-purple-400" />
                <span>Mở Rộng & Website Tùy Chỉnh</span>
              </span>

              <div className="p-3 rounded-2xl bg-purple-950/20 border border-purple-500/20 flex items-center justify-between text-xs">
                <div>
                  <span className="font-semibold text-slate-200 block">Plugins / Extractor Riêng</span>
                  <span className="text-[11px] text-slate-400 block">Thêm file .py hoặc tải plugin để bóc tách website mới</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPlugins();
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-200 text-xs font-bold transition-all cursor-pointer"
                >
                  <Boxes className="w-3.5 h-3.5" />
                  <span>Quản lý</span>
                </button>
              </div>
            </div>
          )}
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
