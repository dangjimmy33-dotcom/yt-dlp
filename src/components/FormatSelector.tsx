import React, { useState } from "react";
import { MediaInfo, DownloadRequest, AppSettings } from "../types";
import {
  Video,
  Music,
  Scissors,
  Settings2,
  Download,
  Folder,
  Sparkles,
  Check,
  Subtitles,
  Image as ImageIcon,
  ShieldCheck,
  FileText,
  Clock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FormatSelectorProps {
  media: MediaInfo;
  settings: AppSettings;
  onStartDownload: (req: DownloadRequest) => void;
  onSelectFolder: () => void;
  outputDir: string;
}

export const FormatSelector: React.FC<FormatSelectorProps> = ({
  media,
  settings,
  onStartDownload,
  onSelectFolder,
  outputDir,
}) => {
  const [activeTab, setActiveTab] = useState<"video" | "audio" | "trim" | "advanced">("video");
  const [selectedQuality, setSelectedQuality] = useState<string>("1080p");
  const [selectedAudioFormat, setSelectedAudioFormat] = useState<string>("mp3");
  const [selectedAudioQuality, setSelectedAudioQuality] = useState<string>("320K");
  const [customFilename, setCustomFilename] = useState<string>("");

  // Options toggles
  const [embedSubs, setEmbedSubs] = useState<boolean>(settings.embedSubtitles);
  const [embedThumb, setEmbedThumb] = useState<boolean>(settings.embedThumbnail);
  const [embedMeta, setEmbedMeta] = useState<boolean>(settings.embedMetadata);
  const [sponsorBlock, setSponsorBlock] = useState<boolean>(settings.sponsorBlock);

  // Trim times
  const [trimStart, setTrimStart] = useState<string>("");
  const [trimEnd, setTrimEnd] = useState<string>("");
  const [customArgs, setCustomArgs] = useState<string>("");

  const videoQualities = [
    { id: "best", label: "Chất lượng cao nhất", note: "Auto Best Video + Audio", badge: "Max" },
    { id: "2160p", label: "4K Ultra HD", note: "3840x2160 • 60fps", badge: "4K" },
    { id: "1440p", label: "2K QHD", note: "2560x1440 • 60fps", badge: "2K" },
    { id: "1080p", label: "1080p Full HD", note: "1920x1080 • Chuẩn sắc nét", badge: "FHD" },
    { id: "720p", label: "720p HD", note: "1280x720 • Dung lượng nhẹ", badge: "HD" },
    { id: "480p", label: "480p SD", note: "854x480 • Tiết kiệm dữ liệu", badge: "SD" },
  ];

  const audioFormats = [
    { id: "mp3", label: "MP3 Audio", note: "Tương thích mọi thiết bị", icon: "🎵" },
    { id: "flac", label: "FLAC Lossless", note: "Chất lượng phòng thu nguyên bản", icon: "💎" },
    { id: "m4a", label: "M4A (AAC)", note: "Tối ưu cho Apple & iOS", icon: "🍏" },
    { id: "wav", label: "WAV Uncompressed", note: "Âm thanh không nén", icon: "🎼" },
    { id: "opus", label: "OPUS Codec", note: "Chuẩn codec hiện đại nhất", icon: "⚡" },
  ];

  const audioBitrates = [
    { id: "320K", label: "320 kbps (Cực cao)" },
    { id: "256K", label: "256 kbps (Rất cao)" },
    { id: "192K", label: "192 kbps (Chuẩn)" },
    { id: "128K", label: "128 kbps (Cơ bản)" },
  ];

  const handleDownload = () => {
    const req: DownloadRequest = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      url: media.url,
      title: media.title,
      download_type: activeTab === "audio" ? "audio" : "video",
      quality: selectedQuality,
      audio_format: selectedAudioFormat,
      audio_quality: selectedAudioQuality,
      output_dir: outputDir || settings.defaultDownloadDir,
      custom_filename: customFilename.trim() || undefined,
      embed_subtitles: embedSubs,
      embed_thumbnail: embedThumb,
      embed_metadata: embedMeta,
      sponsorblock: sponsorBlock,
      cookies_browser: settings.cookiesBrowser,
      trim_start: activeTab === "trim" ? trimStart : undefined,
      trim_end: activeTab === "trim" ? trimEnd : undefined,
      custom_args: customArgs.trim() || undefined,
    };

    onStartDownload(req);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.35 }}
      className="w-full glass-panel rounded-2xl p-4 md:p-5 space-y-4"
    >
      {/* Tab Navigation with Animated Indicator */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/60 border border-white/[0.06] overflow-x-auto scrollbar-none">
        {[
          { id: "video", label: "Tải Video", icon: Video },
          { id: "audio", label: "Tách Âm Thanh", icon: Music },
          { id: "trim", label: "Cắt Phân Đoạn", icon: Scissors },
          { id: "advanced", label: "Tùy Chọn Thêm", icon: Settings2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isActive
                  ? "text-white"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 rounded-lg bg-gradient-to-r from-indigo-500/80 to-purple-600/80 shadow-md shadow-indigo-500/25 border border-white/20"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab Content Panels */}
      <AnimatePresence mode="wait">
        {activeTab === "video" && (
          <motion.div
            key="video-tab"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5"
          >
            {videoQualities.map((q) => {
              const isSelected = selectedQuality === q.id;
              return (
                <div
                  key={q.id}
                  onClick={() => setSelectedQuality(q.id)}
                  className={`relative p-3 rounded-xl cursor-pointer transition-all flex items-center justify-between ${
                    isSelected ? "glass-card-active" : "glass-card"
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-100">{q.label}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                        {q.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{q.note}</p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                      isSelected
                        ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/40"
                        : "border border-white/20"
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}

        {activeTab === "audio" && (
          <motion.div
            key="audio-tab"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            {/* Format selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {audioFormats.map((af) => {
                const isSelected = selectedAudioFormat === af.id;
                return (
                  <div
                    key={af.id}
                    onClick={() => setSelectedAudioFormat(af.id)}
                    className={`p-3 rounded-xl cursor-pointer transition-all flex items-center justify-between ${
                      isSelected ? "glass-card-active" : "glass-card"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{af.icon}</span>
                      <div>
                        <span className="text-xs font-bold text-slate-100 block">{af.label}</span>
                        <span className="text-[11px] text-slate-400 block">{af.note}</span>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Bitrate selection */}
            {selectedAudioFormat === "mp3" && (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-slate-400 font-medium">Chất lượng Bitrate:</span>
                <div className="flex items-center gap-2">
                  {audioBitrates.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setSelectedAudioQuality(b.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                        selectedAudioQuality === b.id
                          ? "bg-indigo-500/30 border border-indigo-500/60 text-indigo-300"
                          : "bg-white/[0.04] border border-white/[0.06] text-slate-400 hover:text-white"
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "trim" && (
          <motion.div
            key="trim-tab"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="p-3.5 rounded-xl bg-slate-950/40 border border-white/[0.06] space-y-3"
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>Chỉ tải một đoạn video (Cắt phân đoạn tự động)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Thời gian bắt đầu (vd: 00:01:20):</label>
                <input
                  type="text"
                  value={trimStart}
                  onChange={(e) => setTrimStart(e.target.value)}
                  placeholder="00:00:00"
                  className="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Thời gian kết thúc (vd: 00:03:45):</label>
                <input
                  type="text"
                  value={trimEnd}
                  onChange={(e) => setTrimEnd(e.target.value)}
                  placeholder="00:00:00"
                  className="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono"
                />
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "advanced" && (
          <motion.div
            key="advanced-tab"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            {/* Embed Subtitles */}
            <div
              onClick={() => setEmbedSubs(!embedSubs)}
              className={`p-3 rounded-xl cursor-pointer flex items-center justify-between ${
                embedSubs ? "glass-card-active" : "glass-card"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Subtitles className="w-4 h-4 text-indigo-400" />
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">Tự động nhúng phụ đề</span>
                  <span className="text-[11px] text-slate-400 block">Embed soft subs vào file video</span>
                </div>
              </div>
              <div className={`w-4 h-4 rounded ${embedSubs ? "bg-indigo-500 text-white" : "border border-white/20"} flex items-center justify-center`}>
                {embedSubs && <Check className="w-3 h-3" />}
              </div>
            </div>

            {/* Embed Thumbnail & Metadata */}
            <div
              onClick={() => setEmbedThumb(!embedThumb)}
              className={`p-3 rounded-xl cursor-pointer flex items-center justify-between ${
                embedThumb ? "glass-card-active" : "glass-card"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ImageIcon className="w-4 h-4 text-purple-400" />
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">Nhúng ảnh bìa (Thumbnail)</span>
                  <span className="text-[11px] text-slate-400 block">Hiện cover art khi phát video/audio</span>
                </div>
              </div>
              <div className={`w-4 h-4 rounded ${embedThumb ? "bg-indigo-500 text-white" : "border border-white/20"} flex items-center justify-center`}>
                {embedThumb && <Check className="w-3 h-3" />}
              </div>
            </div>

            {/* Embed Tag Metadata */}
            <div
              onClick={() => setEmbedMeta(!embedMeta)}
              className={`p-3 rounded-xl cursor-pointer flex items-center justify-between ${
                embedMeta ? "glass-card-active" : "glass-card"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">Nhúng Metadata (ID3 Tag)</span>
                  <span className="text-[11px] text-slate-400 block">Gắn tác giả, album, năm phát hành</span>
                </div>
              </div>
              <div className={`w-4 h-4 rounded ${embedMeta ? "bg-indigo-500 text-white" : "border border-white/20"} flex items-center justify-center`}>
                {embedMeta && <Check className="w-3 h-3" />}
              </div>
            </div>

            {/* SponsorBlock */}
            <div
              onClick={() => setSponsorBlock(!sponsorBlock)}
              className={`p-3 rounded-xl cursor-pointer flex items-center justify-between ${
                sponsorBlock ? "glass-card-active" : "glass-card"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">SponsorBlock (Bỏ quảng cáo)</span>
                  <span className="text-[11px] text-slate-400 block">Tự cắt đoạn tài trợ/intro nhà tài trợ</span>
                </div>
              </div>
              <div className={`w-4 h-4 rounded ${sponsorBlock ? "bg-indigo-500 text-white" : "border border-white/20"} flex items-center justify-center`}>
                {sponsorBlock && <Check className="w-3 h-3" />}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Output Directory & Action Row */}
      <div className="pt-2 border-t border-white/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Output folder selector */}
        <div
          onClick={onSelectFolder}
          className="w-full sm:w-auto flex-1 flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-950/40 hover:bg-slate-900/60 border border-white/[0.06] text-xs text-slate-300 cursor-pointer transition-colors overflow-hidden"
          title="Bấm để đổi thư mục lưu"
        >
          <Folder className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="truncate font-mono text-[11px] text-slate-400">
            {outputDir || settings.defaultDownloadDir || "Thư mục Downloads mặc định"}
          </span>
        </div>

        {/* Start Download Button */}
        <button
          onClick={handleDownload}
          className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-6 py-2.5 rounded-xl text-xs font-bold glass-button-primary cursor-pointer shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>BẮT ĐẦU TẢI NGAY</span>
        </button>
      </div>
    </motion.div>
  );
};
