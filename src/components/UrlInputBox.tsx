import React, { useState } from "react";
import { Search, ClipboardPaste, ArrowRight, X, Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface UrlInputBoxProps {
  url: string;
  setUrl: (url: string) => void;
  onAnalyze: (urlToAnalyze?: string) => void;
  isLoading: boolean;
}

export const UrlInputBox: React.FC<UrlInputBoxProps> = ({
  url,
  setUrl,
  onAnalyze,
  isLoading,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text.trim());
        if (text.startsWith("http")) {
          onAnalyze(text.trim());
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
    { name: "YouTube", icon: "🎬", color: "from-red-500/20 to-red-600/20 text-red-300 border-red-500/30" },
    { name: "TikTok", icon: "🎵", color: "from-pink-500/20 to-cyan-500/20 text-pink-300 border-pink-500/30" },
    { name: "Facebook", icon: "👥", color: "from-blue-600/20 to-blue-700/20 text-blue-300 border-blue-500/30" },
    { name: "Instagram", icon: "📸", color: "from-purple-500/20 to-pink-500/20 text-purple-300 border-purple-500/30" },
    { name: "Twitter / X", icon: "🐦", color: "from-sky-500/20 to-slate-500/20 text-sky-300 border-sky-500/30" },
    { name: "SoundCloud", icon: "🎧", color: "from-orange-500/20 to-amber-500/20 text-orange-300 border-orange-500/30" },
    { name: "Bilibili", icon: "📺", color: "from-cyan-500/20 to-blue-500/20 text-cyan-300 border-cyan-500/30" },
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
          placeholder="Dán đường link Video, Playlist, Shorts, TikTok, Facebook..."
          className="w-full bg-transparent text-sm md:text-base text-slate-100 placeholder:text-slate-500 focus:outline-none py-2 px-1 font-medium"
        />

        {url && (
          <button
            onClick={() => setUrl("")}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/10 rounded-lg mr-1 transition-colors"
            title="Xóa link"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={handlePaste}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white glass-button-secondary rounded-xl transition-all mr-1.5"
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
              : "glass-button-primary cursor-pointer"
          }`}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Đang phân tích...</span>
            </>
          ) : (
            <>
              <span>Phân Tích</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </motion.div>

      {/* Platform Badges */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 text-[11px] scrollbar-none"
      >
        <span className="text-slate-400 flex items-center gap-1 shrink-0 font-medium mr-1">
          <Sparkles className="w-3 h-3 text-indigo-400" /> Hỗ trợ:
        </span>
        {supportedPlatforms.map((p) => (
          <span
            key={p.name}
            className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r ${p.color} border font-medium`}
          >
            <span>{p.icon}</span>
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
