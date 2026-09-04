import React, { useState, useEffect } from "react";
import { CustomDomainRule, CustomPluginInfo } from "../types";
import { invoke } from "@tauri-apps/api/core";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import {
  X,
  Globe,
  Plus,
  Trash2,
  FolderOpen,
  Download,
  Code2,
  Check,
  Copy,
  Sparkles,
  FileCode,
  Loader2,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Boxes,
  Zap,
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
  const [activeTab, setActiveTab] = useState<"domains" | "plugins">("domains");
  
  // Custom Domains State
  const [domains, setDomains] = useState<CustomDomainRule[]>([]);
  const [domainInput, setDomainInput] = useState<string>("");
  const [isAddingDomain, setIsAddingDomain] = useState<boolean>(false);

  // Custom Python Plugins State
  const [plugins, setPlugins] = useState<CustomPluginInfo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [urlInput, setUrlInput] = useState<string>("");
  const [isInstallingUrl, setIsInstallingUrl] = useState<boolean>(false);
  const [showTemplate, setShowTemplate] = useState<boolean>(false);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const popularSuggestions = [
    { name: "AnimeVietSub", domain: "https://animevietsub.li/" },
    { name: "AnimeHay", domain: "https://animehay.tv/" },
    { name: "MotChill", domain: "https://motchill.in/" },
    { name: "PhimMới", domain: "https://phimmoi.net/" },
    { name: "Bilibili TV", domain: "https://www.bilibili.tv/" },
    { name: "Vuighe", domain: "https://vuighe.net/" },
  ];

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

  const fetchDomains = async () => {
    try {
      const data = await invoke<CustomDomainRule[]>("get_custom_domains");
      setDomains(data);
    } catch (e) {
      console.error("Failed to load custom domains:", e);
    }
  };

  const fetchPlugins = async () => {
    setIsLoading(true);
    try {
      const data = await invoke<CustomPluginInfo[]>("get_custom_plugins");
      setPlugins(data);
    } catch (e) {
      console.error("Failed to load plugins:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDomains();
      fetchPlugins();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Domain Actions
  const handleAddDomain = async (inputUrl?: string, customName?: string) => {
    const targetUrl = (inputUrl || domainInput).trim();
    if (!targetUrl) return;

    setIsAddingDomain(true);
    try {
      const rule = await invoke<CustomDomainRule>("add_custom_site_domain", {
        url: targetUrl,
        name: customName || null,
      });
      setDomainInput("");
      await fetchDomains();
      toast.success(`Đã thêm website: ${rule.name} (${rule.domain})`);
    } catch (err: any) {
      toast.error(typeof err === "string" ? err : "Không thể thêm website này");
    } finally {
      setIsAddingDomain(false);
    }
  };

  const handleToggleDomain = async (rule: CustomDomainRule) => {
    try {
      await invoke("toggle_custom_site_domain", {
        id: rule.id,
        enabled: !rule.is_enabled,
      });
      await fetchDomains();
      toast.success(
        rule.is_enabled ? `Đã tạm tắt quy tắc ${rule.name}` : `Đã kích hoạt ${rule.name}`
      );
    } catch (e) {
      toast.error("Không thể đổi trạng thái website");
    }
  };

  const handleDeleteDomain = async (id: string, name: string) => {
    try {
      await invoke("remove_custom_site_domain", { id });
      await fetchDomains();
      toast.info(`Đã xóa website ${name}`);
    } catch (e) {
      toast.error("Không thể xóa website");
    }
  };

  // Plugin Actions
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

  const handleTogglePlugin = async (plugin: CustomPluginInfo) => {
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

  const handleDeletePlugin = async (plugin: CustomPluginInfo) => {
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
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.08] relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500/20 to-indigo-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-md">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm md:text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Thêm & Quản Lý Website Tự Động</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 font-semibold">
                  {domains.length} Website Đã Thêm
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Chỉ cần dán link domain trang web (ví dụ: https://animevietsub.li/) là app tự động học và bóc tách video
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

        {/* Tab Switching */}
        <div className="flex items-center gap-2 p-1 rounded-xl bg-slate-950/60 border border-white/[0.06] relative z-10">
          <button
            type="button"
            onClick={() => setActiveTab("domains")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "domains"
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/25"
                : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Thêm Website Bằng Link Domain (Tự Động)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("plugins")}
            className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "plugins"
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/25"
                : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Plugin Code (.py)</span>
          </button>
        </div>

        {/* TAB 1: DOMAIN AUTO-LEARNING & RESOLVER */}
        {activeTab === "domains" && (
          <div className="flex-1 flex flex-col space-y-3.5 overflow-hidden relative z-10 min-h-0">
            {/* Input domain box */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 p-1.5 rounded-xl glass-panel border border-white/10 focus-within:border-purple-500/60 transition-colors">
                <div className="pl-2.5 pr-1 text-slate-400">
                  <Globe className="w-4 h-4 text-purple-400" />
                </div>
                <input
                  type="text"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddDomain()}
                  placeholder="Dán link domain website (ví dụ: https://animevietsub.li/ hoặc animehay.tv)..."
                  className="w-full bg-transparent text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none py-1 font-medium"
                />
                <button
                  type="button"
                  onClick={() => handleAddDomain()}
                  disabled={!domainInput.trim() || isAddingDomain}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl glass-button-primary text-xs font-bold transition-all cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {isAddingDomain ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>Thêm Website</span>
                </button>
              </div>

              {/* Quick suggestions */}
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mr-1">
                  <Zap className="w-3 h-3 text-amber-400" /> Gợi ý thêm nhanh:
                </span>
                {popularSuggestions.map((s) => {
                  const isAdded = domains.some((d) => d.original_url.includes(s.domain) || s.domain.includes(d.domain));
                  return (
                    <button
                      key={s.name}
                      type="button"
                      onClick={() => !isAdded && handleAddDomain(s.domain, s.name)}
                      disabled={isAdded}
                      className={`text-[10px] px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${
                        isAdded
                          ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 opacity-80 cursor-default"
                          : "bg-white/[0.04] hover:bg-purple-500/20 border border-white/[0.08] hover:border-purple-500/40 text-slate-300 hover:text-purple-200 cursor-pointer"
                      }`}
                    >
                      {isAdded && <Check className="w-2.5 h-2.5 text-emerald-400" />}
                      <span>{s.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* List of Custom Domains */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[160px]">
              <span className="text-xs font-bold text-slate-300 block flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Danh sách Website Tự Động Bóc Tách:
              </span>

              {domains.length === 0 ? (
                <div className="p-8 rounded-2xl glass-card flex flex-col items-center justify-center text-center space-y-2.5">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                    <Globe className="w-6 h-6" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-200">Chưa thêm website nào</h4>
                  <p className="text-[11px] text-slate-400 max-w-sm leading-relaxed">
                    Dán link domain của trang web (ví dụ: <code>https://animevietsub.li/</code>) vào ô phía trên để app tự động kích hoạt chế độ bắt link HLS/m3u8 cho website đó.
                  </p>
                </div>
              ) : (
                domains.map((rule) => (
                  <div
                    key={rule.id}
                    className={`p-3 rounded-2xl flex items-center justify-between gap-3 transition-all ${
                      rule.is_enabled ? "glass-card hover:border-purple-500/40" : "bg-slate-950/40 opacity-60 border border-white/[0.04]"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`p-2 rounded-xl shrink-0 ${rule.is_enabled ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" : "bg-white/[0.04] text-slate-500"}`}>
                        <Globe className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-100 truncate">{rule.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono border border-indigo-500/30">
                            {rule.domain}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block truncate">
                          Tự động gán Referer: <code className="text-slate-300">{rule.referer}</code> • Tự dò luồng HLS/m3u8
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleDomain(rule)}
                        className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          rule.is_enabled
                            ? "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30"
                            : "bg-slate-800/60 hover:bg-slate-800 text-slate-400 border border-white/10"
                        }`}
                      >
                        {rule.is_enabled ? "Đang bật" : "Đã tắt"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteDomain(rule.id, rule.name)}
                        className="p-1.5 rounded-lg bg-white/[0.04] hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 transition-all cursor-pointer"
                        title="Xóa website"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Explanatory Banner */}
            <div className="p-3 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 text-[11px] text-indigo-200 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Cách sử dụng cực kỳ đơn giản:</span>
                Sau khi thêm domain ở đây, bất cứ khi nào bạn dán link tập phim / bài viết thuộc website đó vào màn hình chính, app sẽ tự động quét bắt luồng video và tải về chất lượng cao nhất mà không bị chặn bởi máy chủ.
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DEVELOPER PYTHON PLUGINS */}
        {activeTab === "plugins" && (
          <div className="flex-1 flex flex-col space-y-3.5 overflow-hidden relative z-10 min-h-0">
            {/* Action Bar & Quick Installer */}
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleInstallFromFile}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold glass-button-primary cursor-pointer shadow-md"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Cài File Plugin (.py / .zip)</span>
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

              {/* URL Installer */}
              <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-950/60 border border-white/[0.08] focus-within:border-purple-500/50 transition-colors">
                <div className="pl-2.5 pr-1 text-slate-400">
                  <Globe className="w-3.5 h-3.5 text-purple-400" />
                </div>
                <input
                  type="text"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleInstallFromUrl()}
                  placeholder="Dán link file .py hoặc raw GitHub..."
                  className="w-full bg-transparent text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none py-1"
                />
                <button
                  type="button"
                  onClick={handleInstallFromUrl}
                  disabled={!urlInput.trim() || isInstallingUrl}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 text-xs font-bold transition-all cursor-pointer disabled:opacity-50 shrink-0"
                >
                  {isInstallingUrl ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  <span>Tải & Kích hoạt</span>
                </button>
              </div>
            </div>

            {/* Code Template Collapsible */}
            <AnimatePresence>
              {showTemplate && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-purple-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                        <FileCode className="w-3.5 h-3.5" /> Mẫu Extractor Python chuẩn:
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
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Plugins List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[160px]">
              {isLoading ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-2 text-slate-400 text-xs">
                  <Loader2 className="w-5 h-5 animate-spin text-purple-400" />
                  <span>Đang kiểm tra danh sách plugin...</span>
                </div>
              ) : plugins.length === 0 ? (
                <div className="p-8 rounded-2xl glass-card flex flex-col items-center justify-center text-center space-y-2.5">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                    <FileCode className="w-6 h-6" />
                  </div>
                  <h4 className="text-xs font-bold text-slate-200">Chưa có plugin script Python nào</h4>
                  <p className="text-[11px] text-slate-400 max-w-sm leading-relaxed">
                    Bạn có thể nạp file <code>.py</code> tự viết hoặc tải từ cộng đồng yt-dlp trên GitHub.
                  </p>
                </div>
              ) : (
                plugins.map((plugin) => (
                  <div
                    key={plugin.filename}
                    className={`p-3 rounded-2xl flex items-center justify-between gap-3 transition-all ${
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
                      <button
                        type="button"
                        onClick={() => handleTogglePlugin(plugin)}
                        className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                          plugin.is_enabled
                            ? "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30"
                            : "bg-slate-800/60 hover:bg-slate-800 text-slate-400 border border-white/10"
                        }`}
                      >
                        {plugin.is_enabled ? "Đang bật" : "Đã tắt"}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeletePlugin(plugin)}
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
          </div>
        )}

        {/* Footer */}
        <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-xs relative z-10">
          <span className="text-[11px] text-slate-400">
            Tất cả website và plugin đã thêm sẽ được lưu vĩnh viễn và tự động áp dụng.
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
