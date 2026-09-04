import React, { useState } from "react";
import {
  Search,
  ClipboardPaste,
  ArrowRight,
  X,
  Loader2,
  Sparkles,
  Zap,
  Music,
  Video,
  Disc,
  Globe,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface UrlInputBoxProps {
  url: string;
  setUrl: (url: string) => void;
  onAnalyze: (urlToAnalyze?: string) => void;
  onQuickDownload?: (url: string, type: 'video' | 'audio', qualityOrFormat: string, audioQuality?: string) => void;
  onOpenBatchModal?: () => void;
  isLoading: boolean;
}

export const UrlInputBox: React.FC<UrlInputBoxProps> = ({
  url,
  setUrl,
  onAnalyze,
  onQuickDownload,
  onOpenBatchModal,
  isLoading,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        const clean = text.trim();
        // If multiple URLs detected in clipboard, open Batch modal
        if (clean.includes("\n") && onOpenBatchModal) {
          onOpenBatchModal();
          return;
        }
        setUrl(clean);
        if (clean.startsWith("http")) {
          onAnalyze(clean);
        }
      }
    } catch {
      // Fallback
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && url.trim()) {
      onAnalyze();
    }
  };

  const supportedPlatforms = [
    { name: "YouTube", color: "from-red-500/15 to-red-600/15 text-red-300 border-red-500/30" },
    { name: "TikTok", color: "from-pink-500/15 to-cyan-500/15 text-pink-300 border-pink-500/30" },
    { name: "Facebook", color: "from-blue-600/15 to-blue-700/15 text-blue-300 border-blue-500/30" },
    { name: "Instagram", color: "from-purple-500/15 to-pink-500/15 text-purple-300 border-purple-500/30" },
    { name: "Twitter / X", color: "from-sky-500/15 to-slate-500/15 text-sky-300 border-sky-500/30" },
    { name: "SoundCloud", color: "from-orange-500/15 to-amber-500/15 text-orange-300 border-orange-500/30" },
    { name: "Bilibili", color: "from-cyan-500/15 to-blue-500/15 text-cyan-300 border-cyan-500/30" },
  ];

  const hasValidUrl = url.trim().startsWith("http");
  const isKeywordSearch = url.trim().length > 0 && !url.trim().startsWith("http://") && !url.trim().startsWith("https://");

  const quickSearchSuggestions = [
    "Conan Pops Anime",
    "Thám Tử Lừng Danh Conan",
    "Sơn Tùng M-TP",
    "Nhạc Trẻ Remix 2024",
    "Lofi Chill Không Lời",
  ];

  return (
    <div className="w-full space-y-3">
      {/* Input bar container */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className={`relative flex items-center rounded-2xl transition-all duration-300 p-1.5 ${
          isFocused
            ? "glass-panel ring-2 ring-indigo-500/50 shadow-2xl shadow-indigo-500/20"
            : "glass-card hover:border-white/15"
        }`}
      >
        <div className="pl-3.5 pr-2 text-slate-400">
          <Search className={`w-5 h-5 transition-colors ${isFocused ? "text-indigo-400" : "text-slate-400"}`} />
        </div>

        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder="Nhập tên video / phim / bài hát (VD: Conan Pops Anime, Sơn Tùng...) hoặc Dán link..."
          className="w-full bg-transparent text-sm md:text-base text-slate-100 placeholder:text-slate-500 focus:outline-none py-2 px-1 font-medium"
        />

        {url && (
          <button
            onClick={() => setUrl("")}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/10 rounded-lg mr-1 transition-colors cursor-pointer"
            title="Xóa link"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={handlePaste}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white glass-button-secondary rounded-xl transition-all mr-1.5 cursor-pointer"
          title="Dán từ Clipboard"
        >
          <ClipboardPaste className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden sm:inline">Dán</span>
        </button>

        <button
          onClick={() => onAnalyze()}
          disabled={!url.trim() || isLoading}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
            !url.trim() || isLoading
              ? "bg-slate-800/60 text-slate-500 cursor-not-allowed border border-white/5"
              : isKeywordSearch
                ? "bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 text-white shadow-lg shadow-indigo-500/30 hover:opacity-95 cursor-pointer"
                : "glass-button-primary cursor-pointer"
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>{isKeywordSearch ? "Đang tìm..." : "Đang phân tích..."}</span>
            </>
          ) : isKeywordSearch ? (
            <>
              <Search className="w-4 h-4" />
              <span>Tìm Kiếm</span>
            </>
          ) : (
            <>
              <span>Phân Tích</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </motion.div>

      {/* 1-Click Quick Actions Toolbar when URL is present */}
      <AnimatePresence>
        {hasValidUrl && onQuickDownload && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -6 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap items-center gap-2 p-2.5 rounded-xl bg-gradient-to-r from-indigo-950/40 via-purple-950/40 to-slate-900/60 border border-indigo-500/20 backdrop-blur-md">
              <span className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5 pl-1 mr-1">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Tải nhanh:
              </span>

              <button
                onClick={() => onQuickDownload(url.trim(), 'video', '1080p')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-xs font-semibold text-indigo-200 hover:text-white transition-all shadow-sm cursor-pointer"
                title="Tải ngay Video 1080p MP4 không cần chờ phân tích"
              >
                <Video className="w-3.5 h-3.5 text-indigo-400" />
                <span>Video MP4 1080p</span>
              </button>

              <button
                onClick={() => onQuickDownload(url.trim(), 'audio', 'mp3', '320K')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-600/30 hover:bg-pink-600/50 border border-pink-500/40 text-xs font-semibold text-pink-200 hover:text-white transition-all shadow-sm cursor-pointer"
                title="Tách ngay nhạc MP3 320kbps chất lượng cao"
              >
                <Music className="w-3.5 h-3.5 text-pink-400" />
                <span>Nhạc MP3 320k</span>
              </button>

              <button
                onClick={() => onQuickDownload(url.trim(), 'audio', 'flac')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-xs font-semibold text-emerald-200 hover:text-white transition-all shadow-sm cursor-pointer"
                title="Tách ngay âm thanh Lossless FLAC nguyên bản phòng thu"
              >
                <Disc className="w-3.5 h-3.5 text-emerald-400" />
                <span>Lossless FLAC</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Search Suggestions */}
      {!hasValidUrl && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-none">
          <span className="text-slate-500 flex items-center gap-1 shrink-0 font-medium mr-1">
            <Sparkles className="w-3 h-3 text-amber-400" /> Gợi ý tìm nhanh:
          </span>
          {quickSearchSuggestions.map((term) => (
            <button
              key={term}
              onClick={() => {
                setUrl(term);
                onAnalyze(term);
              }}
              className="shrink-0 px-2.5 py-1 rounded-lg bg-white/[0.03] hover:bg-indigo-500/20 border border-white/[0.06] hover:border-indigo-500/30 text-slate-300 hover:text-indigo-200 transition-all cursor-pointer font-medium"
            >
              {term}
            </button>
          ))}
        </div>
      )}

      {/* Platform Badges */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 text-[11px] scrollbar-none"
      >
        <span className="text-slate-400 flex items-center gap-1.5 shrink-0 font-medium mr-1">
          <Globe className="w-3.5 h-3.5 text-indigo-400" /> Hỗ trợ:
        </span>
        {supportedPlatforms.map((p) => (
          <span
            key={p.name}
            className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r ${p.color} border font-medium`}
          >
            <span>{p.name}</span>
          </span>
        ))}
        <span className="shrink-0 text-slate-400 font-medium px-1.5">
          + 1000+ website khác
        </span>
      </motion.div>
    </div>
  );
};

