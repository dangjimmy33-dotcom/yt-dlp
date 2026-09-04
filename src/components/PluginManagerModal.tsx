import React, { useState, useEffect } from "react";
import { CustomPluginInfo } from "../types";
import { invoke } from "@tauri-apps/api/core";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import {
  X,
  Boxes,
  Plus,
  Trash2,
  FolderOpen,
  Download,
  Code2,
  Check,
  Copy,
  AlertCircle,
  Sparkles,
  FileCode,
  Globe,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface PluginManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PluginManagerModal: React.FC<PluginManagerModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [plugins, setPlugins] = useState<CustomPluginInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [urlInput, setUrlInput] = useState<string>("");
  const [isInstallingUrl, setIsInstallingUrl] = useState<boolean>(false);
  const [showTemplate, setShowTemplate] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const sampleTemplate = `# Description: Bộ bóc tách video tùy chỉnh cho yt-dlp
from yt_dlp.extractor.common import InfoExtractor

class MyCustomSiteIE(InfoExtractor):
    _VALID_URL = r'https?://(?:www\.)?mywebsite\.com/video/(?P<id>[a-zA-Z0-9_-]+)'
    _TEST = {
        'url': 'https://mywebsite.com/video/sample123',
        'info_dict': {
            'id': 'sample123',
            'ext': 'mp4',
            'title': 'Video mẫu',
        }
    }

    def _real_extract(self, url):
        video_id = self._match_id(url)
        webpage = self._download_webpage(url, video_id)
        title = self._html_search_regex(r'<title>(.*?)</title>', webpage, 'title', default='Untitled')
        video_url = self._html_search_regex(r'src="(.*?\.mp4)"', webpage, 'video url', default=None)
        
        return {
            'id': video_id,
            'title': title,
            'url': video_url,
            'ext': 'mp4',
        }
`;

  const fetchPlugins = async () => {
    setIsLoading(true);
    try {
      const data = await invoke<CustomPluginInfo[]>("get_custom_plugins");
      setPlugins(data);
    } catch (e: any) {
      console.error("Failed to load plugins:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchPlugins();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInstallFromFile = async () => {
    try {
      const selected = await openDialog({
        multiple: false,
        directory: false,
        filters: [
          {
            name: "yt-dlp Plugin / Python Script",
            extensions: ["py", "zip"],
          },
        ],
      });

      if (selected && typeof selected === "string") {
        const toastId = toast.loading("Đang cài đặt plugin...");
        try {
          const newPlugin = await invoke<CustomPluginInfo>("install_plugin_from_path", {
            path: selected,
          });
          await fetchPlugins();
          toast.success(`Đã cài đặt plugin: ${newPlugin.name}`, { id: toastId });
        } catch (err: any) {
          toast.error(typeof err === "string" ? err : "Cài đặt thất bại", { id: toastId });
        }
      }
    } catch (e) {
      console.error("File dialog error:", e);
    }
  };

  const handleInstallFromUrl = async () => {
    const clean = urlInput.trim();
    if (!clean) return;

    setIsInstallingUrl(true);
    const toastId = toast.loading("Đang tải plugin từ URL...");
    try {
      const newPlugin = await invoke<CustomPluginInfo>("install_plugin_from_web", {
        url: clean,
        name: null,
      });
      setUrlInput("");
      await fetchPlugins();
      toast.success(`Đã cài đặt thành công: ${newPlugin.name}`, { id: toastId });
    } catch (err: any) {
      toast.error(typeof err === "string" ? err : "Không thể tải plugin từ link này", { id: toastId });
    } finally {
      setIsInstallingUrl(false);
    }
  };

  const handleToggle = async (plugin: CustomPluginInfo) => {
    try {
      await invoke("set_plugin_enabled", {
        filename: plugin.filename,
        enabled: !plugin.is_enabled,
      });
      await fetchPlugins();
      toast.success(
        plugin.is_enabled ? `Đã tạm tắt ${plugin.name}` : `Đã kích hoạt ${plugin.name}`
      );
    } catch (err: any) {
      toast.error("Không thể thay đổi trạng thái plugin");
    }
  };

  const handleDelete = async (plugin: CustomPluginInfo) => {
    try {
      await invoke("remove_custom_plugin", { filename: plugin.filename });
      await fetchPlugins();
      toast.info(`Đã xóa plugin ${plugin.name}`);
    } catch (err: any) {
      toast.error("Không thể xóa plugin");
    }
  };

  const handleOpenFolder = async () => {
    try {
      await invoke("open_plugins_folder");
    } catch (e) {
      toast.error("Không thể mở thư mục plugins");
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(sampleTemplate);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    toast.success("Đã sao chép mã nguồn mẫu vào Clipboard!");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-2xl max-h-[88vh] glass-panel rounded-3xl p-5 md:p-6 flex flex-col space-y-4 shadow-2xl border border-purple-500/20 relative overflow-hidden"
      >
        {/* Glow ambient */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-500/20 to-indigo-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-md">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Quản Lý Plugin & Website Tùy Chỉnh</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 font-semibold">
                  {plugins.length} Plugins
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Thêm bộ bóc tách Extractor (.py / .zip) để tải video từ các trang web riêng biệt
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action Bar & Quick Installer */}
        <div className="space-y-3 relative z-10">
          {/* Top buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleInstallFromFile}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold glass-button-primary cursor-pointer shadow-md"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Cài Plugin từ File (.py / .zip)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowTemplate(!showTemplate)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white/[0.05] hover:bg-white/[0.09] border border-white/[0.08] text-slate-300 hover:text-white transition-all cursor-pointer"
              >
                <Code2 className="w-3.5 h-3.5 text-pink-400" />
                <span>{showTemplate ? "Ẩn mã mẫu" : "Mã nguồn mẫu"}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleOpenFolder}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900/60 hover:bg-slate-800/80 border border-white/[0.08] text-indigo-300 hover:text-indigo-200 transition-all cursor-pointer"
              title="Mở thư mục chứa file plugin trong File Explorer"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Mở thư mục Plugins</span>
            </button>
          </div>

          {/* URL Installer input */}
          <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-950/60 border border-white/[0.08] focus-within:border-purple-500/50 transition-colors">
            <div className="pl-2.5 pr-1 text-slate-400">
              <Globe className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleInstallFromUrl()}
              placeholder="Dán link file .py hoặc raw GitHub (ví dụ: https://github.com/.../mysite.py)..."
              className="w-full bg-transparent text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none py-1"
            />
            <button
              type="button"
              onClick={handleInstallFromUrl}
              disabled={!urlInput.trim() || isInstallingUrl}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-xs font-bold transition-all cursor-pointer disabled:opacity-50 shrink-0"
            >
              {isInstallingUrl ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span>Tải & Kích hoạt</span>
            </button>
          </div>
        </div>

        {/* Code Sample Template (Collapsible) */}
        <AnimatePresence>
          {showTemplate && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden relative z-10"
            >
              <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-purple-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5" /> Mẫu Extractor Python đơn giản:
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-[11px] font-semibold text-slate-300 transition-all cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedCode ? "Đã copy" : "Sao chép mã"}</span>
                  </button>
                </div>
                <pre className="text-[10px] font-mono text-slate-300 bg-black/50 p-3 rounded-xl overflow-x-auto max-h-36 leading-relaxed border border-white/[0.04]">
                  {sampleTemplate}
                </pre>
                <p className="text-[10px] text-slate-400">
                  Lưu file này thành đuôi <code>.py</code> và bấm nút <strong>"Cài Plugin từ File"</strong> ở trên để nạp vào app.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Installed Plugins List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[160px] relative z-10">
          <span className="text-xs font-bold text-slate-300 block flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Danh sách Plugins Đã Cài Đặt:
          </span>

          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-2 text-slate-400 text-xs">
              <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
              <span>Đang kiểm tra danh sách plugin...</span>
            </div>
          ) : plugins.length === 0 ? (
            <div className="p-8 rounded-2xl glass-card flex flex-col items-center justify-center text-center space-y-2.5">
              <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                <Boxes className="w-6 h-6" />
              </div>
              <h4 className="text-xs font-bold text-slate-200">Chưa có plugin tùy chỉnh nào</h4>
              <p className="text-[11px] text-slate-400 max-w-sm leading-relaxed">
                App đã có sẵn 1.750+ website mặc định. Bạn có thể thêm file <code>.py</code> của các trang web riêng hoặc kho plugin yt-dlp trên GitHub.
              </p>
            </div>
          ) : (
            plugins.map((plugin) => (
              <div
                key={plugin.filename}
                className={`p-3.5 rounded-2xl flex items-center justify-between gap-3 transition-all ${
                  plugin.is_enabled ? "glass-card hover:border-purple-500/40" : "bg-slate-950/40 opacity-60 border border-white/[0.04]"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2 rounded-xl shrink-0 ${plugin.is_enabled ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" : "bg-white/[0.04] text-slate-500"}`}>
                    <FileCode className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-100 truncate">{plugin.name}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/[0.06] text-slate-400 font-mono">
                        {plugin.size_str}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 block truncate">
                      {plugin.description || plugin.filename}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Enable / Disable toggle button */}
                  <button
                    type="button"
                    onClick={() => handleToggle(plugin)}
                    className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                      plugin.is_enabled
                        ? "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30"
                        : "bg-slate-800/60 hover:bg-slate-800 text-slate-400 border border-white/10"
                    }`}
                  >
                    {plugin.is_enabled ? "Đang bật" : "Đã tắt"}
                  </button>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => handleDelete(plugin)}
                    className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition-all cursor-pointer"
                    title="Xóa plugin"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-xs relative z-10">
          <span className="text-[11px] text-slate-400">
            Plugins được tự động tải và kích hoạt cùng lúc với engine tải.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold glass-button-secondary hover:text-white transition-all cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </motion.div>
    </div>
  );
};
