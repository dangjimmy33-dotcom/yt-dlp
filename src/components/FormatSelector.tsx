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
  Layers,
  Cpu,
  Volume2,
  Sliders,
  Disc,
  FileAudio,
  Radio,
  Zap,
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
  
  // Video settings
  const [selectedQuality, setSelectedQuality] = useState<string>("1080p");
  const [selectedContainer, setSelectedContainer] = useState<string>("mp4");
  const [selectedCodec, setSelectedCodec] = useState<string>("auto");

  // Audio settings
  const [selectedAudioFormat, setSelectedAudioFormat] = useState<string>("mp3");
  const [selectedAudioQuality, setSelectedAudioQuality] = useState<string>("320K");
  const [audioNormalize, setAudioNormalize] = useState<boolean>(true);

  // Filename & Advanced
  const [customFilename, setCustomFilename] = useState<string>("");
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

  const videoContainers = [
    { id: "mp4", label: "MP4", desc: "Tương thích cao nhất, phát mọi thiết bị" },
    { id: "mkv", label: "MKV", desc: "Giữ trọn phụ đề rời & đa luồng audio" },
    { id: "webm", label: "WebM", desc: "Tối ưu dung lượng nhẹ cho Web" },
    { id: "mov", label: "MOV", desc: "Chuẩn Apple QuickTime" },
  ];

  const videoCodecs = [
    { id: "auto", label: "Tự động", desc: "Tối ưu theo nguồn" },
    { id: "h264", label: "H.264 / AVC", desc: "Tương thích 100%" },
    { id: "hevc", label: "HEVC / H.265", desc: "Tiết kiệm dung lượng" },
    { id: "av1", label: "AV1 Siêu Nét", desc: "Thế hệ mới tối tân" },
    { id: "vp9", label: "VP9 Google", desc: "Chuẩn YouTube 4K" },
  ];

  const audioFormats = [
    { id: "mp3", label: "MP3 Audio", note: "Tương thích 100% mọi thiết bị", icon: Music, color: "text-indigo-400" },
    { id: "flac", label: "FLAC Lossless", note: "Chất lượng phòng thu nguyên bản", icon: Disc, color: "text-emerald-400" },
    { id: "m4a", label: "M4A (AAC)", note: "Tối ưu cho Apple & iOS", icon: FileAudio, color: "text-sky-400" },
    { id: "wav", label: "WAV Uncompressed", note: "Âm thanh gốc PCM không nén", icon: Radio, color: "text-purple-400" },
    { id: "opus", label: "OPUS Codec", note: "Codec hiện đại chất lượng cao", icon: Zap, color: "text-amber-400" },
    { id: "ogg", label: "OGG Vorbis", note: "Mã nguồn mở chất lượng cao", icon: Sliders, color: "text-pink-400" },
  ];

  const audioBitrates = [
    { id: "320K", label: "320 kbps (Cực cao • Studio Master)" },
    { id: "256K", label: "256 kbps (Rất cao)" },
    { id: "192K", label: "192 kbps (Chuẩn CD)" },
    { id: "128K", label: "128 kbps (Cơ bản)" },
  ];

  const handleDownloadVideo = () => {
    const req: DownloadRequest = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      url: media.url,
      title: media.title,
      download_type: "video",
      quality: selectedQuality,
      video_container: selectedContainer,
      video_codec: selectedCodec === "auto" ? undefined : selectedCodec,
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

  const handleDownloadAudio = () => {
    const req: DownloadRequest = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      url: media.url,
      title: `[Audio ${selectedAudioFormat.toUpperCase()}] ${media.title}`,
      download_type: "audio",
      quality: "best",
      audio_format: selectedAudioFormat,
      audio_quality: selectedAudioQuality,
      audio_normalize: audioNormalize,
      output_dir: outputDir || settings.defaultDownloadDir,
      custom_filename: customFilename.trim() || undefined,
      embed_subtitles: false,
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
          { id: "video", label: "Tùy Chỉnh Video", icon: Video },
          { id: "audio", label: "Studio Âm Thanh", icon: Music },
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
            className="space-y-4"
          >
            {/* Resolution Grid */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Chọn độ phân giải:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
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
              </div>
            </div>

            {/* Container & Codec Matrix */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {/* Container format */}
              <div className="p-3.5 rounded-xl bg-slate-950/40 border border-white/[0.06] space-y-2.5">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-purple-400" /> Định dạng đóng gói (Container):
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {videoContainers.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedContainer(c.id)}
                      className={`p-2 rounded-lg text-left transition-all ${
                        selectedContainer === c.id
                          ? "bg-indigo-500/20 border border-indigo-500/50 text-indigo-200"
                          : "bg-white/[0.03] border border-white/[0.06] text-slate-400 hover:text-white"
                      }`}
                    >
                      <span className="text-xs font-bold block">{c.label}</span>
                      <span className="text-[10px] opacity-75 block truncate">{c.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Codec */}
              <div className="p-3.5 rounded-xl bg-slate-950/40 border border-white/[0.06] space-y-2.5">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-pink-400" /> Bộ mã hóa video (Codec):
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {videoCodecs.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedCodec(c.id)}
                      className={`p-2 rounded-lg text-left transition-all cursor-pointer ${
                        selectedCodec === c.id
                          ? "bg-pink-500/20 border border-pink-500/50 text-pink-200 shadow-sm"
                          : "bg-white/[0.03] border border-white/[0.06] text-slate-400 hover:text-white"
                      }`}
                    >
                      <span className="text-xs font-bold block">{c.label}</span>
                      <span className="text-[10px] opacity-75 block truncate">{c.desc}</span>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400">
                  H.264 cho độ tương thích cao nhất; AV1/HEVC cho độ nét tối đa.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "audio" && (
          <motion.div
            key="audio-tab"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Format selection */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-pink-400" /> Chọn định dạng âm thanh:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {audioFormats.map((af) => {
                  const isSelected = selectedAudioFormat === af.id;
                  const Icon = af.icon;
                  return (
                    <div
                      key={af.id}
                      onClick={() => setSelectedAudioFormat(af.id)}
                      className={`p-3 rounded-xl cursor-pointer transition-all flex items-center justify-between ${
                        isSelected ? "glass-card-active" : "glass-card"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`p-2 rounded-xl bg-white/[0.04] ${af.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
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
            </div>

            {/* Bitrate & Studio Enhancements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {/* Bitrate selection */}
              <div className="p-3.5 rounded-xl bg-slate-950/40 border border-white/[0.06] space-y-2.5">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-400" /> Chất lượng Bitrate (Độ phân giải âm):
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {audioBitrates.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setSelectedAudioQuality(b.id)}
                      className={`px-2.5 py-2 rounded-lg text-xs font-semibold text-left transition-all ${
                        selectedAudioQuality === b.id
                          ? "bg-indigo-500/20 border border-indigo-500/60 text-indigo-300"
                          : "bg-white/[0.03] border border-white/[0.06] text-slate-400 hover:text-white"
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Loudness normalization & Tagging */}
              <div className="p-3.5 rounded-xl bg-slate-950/40 border border-white/[0.06] space-y-2.5 flex flex-col justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> Tinh chỉnh âm thanh phòng thu:
                </span>
                
                <div
                  onClick={() => setAudioNormalize(!audioNormalize)}
                  className={`p-2.5 rounded-lg cursor-pointer flex items-center justify-between transition-all ${
                    audioNormalize ? "bg-emerald-500/15 border border-emerald-500/40" : "bg-white/[0.03] border border-white/[0.06]"
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">Chuẩn hóa âm lượng (EBU R128 Loudnorm)</span>
                    <span className="text-[10px] text-slate-400 block">Cân bằng âm lượng tự động, tránh bài to bài nhỏ</span>
                  </div>
                  <div className={`w-4 h-4 rounded ${audioNormalize ? "bg-emerald-500 text-white" : "border border-white/20"} flex items-center justify-center shrink-0`}>
                    {audioNormalize && <Check className="w-3 h-3" />}
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-pink-400" />
                  <span>Tự động nhúng Cover Art và thẻ ID3 (Ca sĩ, Album) vào file nhạc.</span>
                </div>
              </div>
            </div>
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

      {/* Output Directory & Distinct Action Buttons Row */}
      <div className="pt-3 border-t border-white/[0.08] flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Output folder selector */}
        <div
          onClick={onSelectFolder}
          className="w-full md:w-auto flex-1 flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-950/40 hover:bg-slate-900/60 border border-white/[0.06] text-xs text-slate-300 cursor-pointer transition-colors overflow-hidden"
          title="Bấm để đổi thư mục lưu"
        >
          <Folder className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="truncate font-mono text-[11px] text-slate-400">
            {outputDir || settings.defaultDownloadDir || "Thư mục Downloads mặc định"}
          </span>
        </div>

        {/* Dual Primary Action Buttons: Video Download & Separate Audio Download */}
        <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0 flex-wrap justify-end">
          {/* Tách Nhạc Audio Button */}
          <button
            onClick={handleDownloadAudio}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:opacity-95 text-white shadow-lg shadow-pink-600/25 border border-pink-500/30 transition-all cursor-pointer"
            title={`Tách âm thanh định dạng ${selectedAudioFormat.toUpperCase()} ${selectedAudioQuality}`}
          >
            <Music className="w-4 h-4 text-pink-200" />
            <span>Tách Nhạc ({selectedAudioFormat.toUpperCase()} {selectedAudioQuality})</span>
          </button>

          {/* Tải Video Button */}
          <button
            onClick={handleDownloadVideo}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold glass-button-primary shadow-lg shadow-indigo-500/30 cursor-pointer"
            title={`Tải video chất lượng ${selectedQuality} định dạng ${selectedContainer.toUpperCase()}`}
          >
            <Video className="w-4 h-4" />
            <span>Tải Video ({selectedQuality.toUpperCase()})</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};


