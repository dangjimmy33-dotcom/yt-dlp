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
  Layers,
  User,
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
  const [searchMode, setSearchMode] = useState<'video' | 'playlist' | 'channel'>('video');
  const [resultLimit, setResultLimit] = useState<number>(50);

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

  const handleTriggerAnalyze = (overrideQuery?: string) => {
    const raw = (overrideQuery || url).trim();
    if (!raw) return;

    if (raw.startsWith("http://") || raw.startsWith("https://")) {
      onAnalyze(raw);
      return;
    }

    // Smart keyword search routing
    if (searchMode === "playlist") {
      onAnalyze(`ytplaylist:${raw}`);
    } else if (searchMode === "channel") {
      onAnalyze(`ytchannel:${raw}`);
    } else {
      onAnalyze(`ytsearch${resultLimit}:${raw}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && url.trim()) {
      handleTriggerAnalyze();
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
          placeholder="Nhập tên video / danh sách phát / kênh (VD: Conan Pops Anime, Sơn Tùng...) hoặc Dán link..."
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
          onClick={() => handleTriggerAnalyze()}
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

      {/* Smart Search Mode & Result Limit Toolbar */}
      {isKeywordSearch && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-950/60 border border-white/[0.08] backdrop-blur-md text-xs"
        >
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-slate-400 font-semibold mr-1">Tìm theo:</span>
            
            <button
              type="button"
              onClick={() => setSearchMode("video")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                searchMode === "video"
                  ? "bg-indigo-600/40 text-indigo-200 border border-indigo-500/60 shadow-sm"
                  : "bg-white/[0.03] text-slate-400 hover:text-white border border-white/[0.06]"
              }`}
            >
              <Video className="w-3.5 h-3.5 text-indigo-400" />
              <span>Video lẻ</span>
            </button>

            <button
              type="button"
              onClick={() => setSearchMode("playlist")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                searchMode === "playlist"
                  ? "bg-purple-600/40 text-purple-200 border border-purple-500/60 shadow-sm"
                  : "bg-white/[0.03] text-slate-400 hover:text-white border border-white/[0.06]"
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-purple-400" />
              <span>Danh Sách Phát / Trọn Bộ</span>
            </button>

            <button
              type="button"
              onClick={() => setSearchMode("channel")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                searchMode === "channel"
                  ? "bg-cyan-600/40 text-cyan-200 border border-cyan-500/60 shadow-sm"
                  : "bg-white/[0.03] text-slate-400 hover:text-white border border-white/[0.06]"
              }`}
            >
              <User className="w-3.5 h-3.5 text-cyan-400" />
              <span>Kênh YouTube</span>
            </button>
          </div>

          {searchMode === "video" && (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <span>Số lượng:</span>
              {[30, 50, 100, 200].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setResultLimit(num)}
                  className={`px-2 py-0.5 rounded-md font-mono font-bold transition-all cursor-pointer ${
                    resultLimit === num
                      ? "bg-indigo-500/30 text-indigo-300 border border-indigo-500/50"
                      : "bg-white/[0.02] text-slate-500 hover:text-slate-300 border border-transparent"
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}

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
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Gợi ý tìm nhanh:
          </span>
          {quickSearchSuggestions.map((term) => (
            <button
              key={term}
              onClick={() => {
                setUrl(term);
                handleTriggerAnalyze(term);
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
