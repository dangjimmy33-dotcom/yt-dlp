import React, { useState } from 'react';
import {
  Video,
  Music,
  Scissors,
  Settings2,
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
  FileEdit,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface FullFormatConfig {
  downloadType: 'video' | 'audio';
  quality: string;
  videoContainer: string;
  videoCodec: string;
  audioFormat: string;
  audioQuality: string;
  audioNormalize: boolean;
  customFilename?: string;
  trimStart?: string;
  trimEnd?: string;
  embedSubtitles: boolean;
  embedThumbnail: boolean;
  embedMetadata: boolean;
  sponsorblock: boolean;
}

interface FormatConfigCardProps {
  config: FullFormatConfig;
  onChange: (newConfig: FullFormatConfig) => void;
  showFilenameInput?: boolean;
  titlePrefix?: string;
}

export const videoQualities = [
  { id: 'best', label: 'Chất lượng cao nhất', note: 'Auto Best Video + Audio gốc', badge: 'Max' },
  { id: '4320p', label: '8K Ultra HD', note: '7680x4320 • Siêu nét đỉnh cao', badge: '8K' },
  { id: '2160p', label: '4K Ultra HD', note: '3840x2160 • 60fps sắc nét', badge: '4K' },
  { id: '1440p', label: '2K QHD', note: '2560x1440 • 60fps mượt mà', badge: '2K' },
  { id: '1080p', label: '1080p Full HD', note: '1920x1080 • Chuẩn sắc nét', badge: 'FHD' },
  { id: '720p', label: '720p HD', note: '1280x720 • Dung lượng nhẹ', badge: 'HD' },
  { id: '480p', label: '480p SD', note: '854x480 • Tiết kiệm dữ liệu', badge: 'SD' },
  { id: '360p', label: '360p Mobile', note: '640x360 • Mạng di động', badge: '360p' },
  { id: '240p', label: '240p Tiết kiệm', note: '426x240 • Tiết kiệm băng thông', badge: '240p' },
  { id: '144p', label: '144p Siêu nhẹ', note: '256x144 • Mạng cực yếu', badge: '144p' },
];

export const videoContainers = [
  { id: 'auto', label: 'Gốc (Auto/Source)', desc: 'Không đổi container, stream gốc nhanh nhất', badge: 'Source' },
  { id: 'mp4', label: 'MP4', desc: 'Tương thích cao nhất, phát mọi thiết bị', badge: 'Phổ biến' },
  { id: 'mkv', label: 'MKV', desc: 'Đa năng, giữ trọn phụ đề rời & đa luồng audio', badge: 'Đa năng' },
  { id: 'webm', label: 'WebM', desc: 'Mã nguồn mở Google, tối ưu dung lượng Web', badge: 'Web' },
  { id: 'mov', label: 'MOV', desc: 'Chuẩn Apple QuickTime & Final Cut Pro', badge: 'Apple' },
  { id: 'avi', label: 'AVI', desc: 'Microsoft AVI cho thiết bị & đầu đĩa cổ điển', badge: 'Legacy' },
  { id: 'flv', label: 'FLV', desc: 'Định dạng Flash Video & live stream cổ điển', badge: 'Flash' },
  { id: 'ts', label: 'TS (MPEG-TS)', desc: 'Chuẩn truyền hình số & luồng stream HLS', badge: 'Broadcast' },
  { id: 'gif', label: 'GIF (Ảnh động)', desc: 'Tạo ảnh động GIF chất lượng cao từ video', badge: 'Animation' },
  { id: '3gp', label: '3GP', desc: 'Dung lượng siêu nhẹ cho điện thoại cơ bản', badge: 'Mobile' },
  { id: 'ogv', label: 'OGV (Ogg)', desc: 'Định dạng Ogg Theora mã nguồn mở', badge: 'Open' },
];

export const videoCodecs = [
  { id: 'auto', label: 'Tự động (Best)', desc: 'yt-dlp tự chọn tối ưu theo nguồn' },
  { id: 'h264', label: 'H.264 / AVC', desc: 'Tương thích 100% mọi thiết bị' },
  { id: 'hevc', label: 'HEVC / H.265', desc: 'Tiết kiệm 50% dung lượng, chuẩn 4K/8K' },
  { id: 'av1', label: 'AV1 Siêu Nét', desc: 'Thế hệ mới tối tân (Google, Netflix, Apple)' },
  { id: 'vp9', label: 'VP9 Google', desc: 'Chuẩn YouTube 2K & 4K tối ưu trên Web' },
  { id: 'vp8', label: 'VP8 WebM', desc: 'Codec WebM truyền thống của Google' },
  { id: 'prores', label: 'Apple ProRes', desc: 'Chuẩn dựng phim chuyên nghiệp không nén' },
];

export const audioFormats = [
  { id: 'best', label: 'Gốc tốt nhất (Source)', note: 'Giữ nguyên codec âm thanh gốc, không nén lại', icon: Zap, color: 'text-amber-300' },
  { id: 'mp3', label: 'MP3 Audio', note: 'Tương thích 100% mọi thiết bị', icon: Music, color: 'text-indigo-400' },
  { id: 'm4a', label: 'M4A (AAC)', note: 'Tối ưu cho Apple & iOS, âm thanh trong trẻo', icon: FileAudio, color: 'text-sky-400' },
  { id: 'aac', label: 'AAC Nguyên Bản', note: 'Luồng âm thanh AAC gốc chất lượng cao', icon: Volume2, color: 'text-blue-400' },
  { id: 'flac', label: 'FLAC Lossless', note: 'Chất lượng phòng thu nguyên bản (16/24-bit)', icon: Disc, color: 'text-emerald-400' },
  { id: 'alac', label: 'ALAC (Apple Lossless)', note: 'Lossless của Apple cho iTunes & iOS', icon: Disc, color: 'text-teal-400' },
  { id: 'wav', label: 'WAV Uncompressed', note: 'Âm thanh gốc PCM không nén', icon: Radio, color: 'text-purple-400' },
  { id: 'aiff', label: 'AIFF (Apple PCM)', note: 'Chuẩn phòng thu Apple Mac uncompressed', icon: Radio, color: 'text-fuchsia-400' },
  { id: 'opus', label: 'OPUS Codec', note: 'Codec hiện đại bitrate thấp nhưng chất âm đỉnh', icon: Zap, color: 'text-amber-400' },
  { id: 'ogg', label: 'OGG Vorbis', note: 'Mã nguồn mở chất lượng cao', icon: Sliders, color: 'text-pink-400' },
  { id: 'mka', label: 'MKA Matroska', note: 'Vỏ bọc Matroska cho âm thanh đa kênh', icon: Layers, color: 'text-violet-400' },
  { id: 'wma', label: 'WMA Windows', note: 'Windows Media Audio tương thích Windows', icon: Music, color: 'text-cyan-400' },
];

export const audioBitrates = [
  { id: '0', label: 'VBR 0 (Tốt nhất • Biến thiên cao nhất)' },
  { id: '320K', label: '320 kbps (Cực cao • Studio Master)' },
  { id: '256K', label: '256 kbps (Rất cao • Apple/Spotify High)' },
  { id: '192K', label: '192 kbps (Cao • Chuẩn đĩa CD)' },
  { id: '128K', label: '128 kbps (Cơ bản phổ thông)' },
  { id: '96K', label: '96 kbps (Tiết kiệm băng thông)' },
  { id: '64K', label: '64 kbps (Sách nói / Voice podcast)' },
];

export const FormatConfigCard: React.FC<FormatConfigCardProps> = ({
  config,
  onChange,
  showFilenameInput = false,
  titlePrefix,
}) => {
  const [activeTab, setActiveTab] = useState<'video' | 'audio' | 'trim' | 'advanced'>(
    config.downloadType === 'audio' ? 'audio' : 'video'
  );

  const update = (partial: Partial<FullFormatConfig>) => {
    onChange({ ...config, ...partial });
  };

  return (
    <div className="w-full space-y-4 rounded-2xl bg-slate-950/60 border border-white/[0.08] p-3.5 md:p-4.5 shadow-xl">
      {/* Optional Title */}
      {titlePrefix && (
        <div className="flex items-center gap-2 pb-2 border-b border-white/[0.06] text-xs font-bold text-indigo-300">
          <FileEdit className="w-4 h-4 text-indigo-400" />
          <span>{titlePrefix}</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/90 border border-white/[0.06] overflow-x-auto scrollbar-none">
        {[
          { id: 'video', label: 'Tải Video', icon: Video },
          { id: 'audio', label: 'Studio Âm Thanh', icon: Music },
          { id: 'trim', label: 'Cắt Phân Đoạn', icon: Scissors },
          { id: 'advanced', label: 'Tùy Chọn Thêm', icon: Settings2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                if (tab.id === 'video') update({ downloadType: 'video' });
                if (tab.id === 'audio') update({ downloadType: 'audio' });
              }}
              className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="cfgActiveTabIndicator"
                  className="absolute inset-0 rounded-lg bg-gradient-to-r from-indigo-500/80 to-purple-600/80 shadow-md shadow-indigo-500/25 border border-white/20"
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
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
        {activeTab === 'video' && (
          <motion.div
            key="video-tab"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="space-y-3.5"
          >
            {/* Resolution Grid */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Chọn độ phân giải:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
                {videoQualities.map((q) => {
                  const isSelected = config.quality === q.id && config.downloadType === 'video';
                  return (
                    <div
                      key={q.id}
                      onClick={() => update({ quality: q.id, downloadType: 'video' })}
                      className={`relative p-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between ${
                        isSelected ? 'glass-card-active border-indigo-500/60 bg-indigo-950/40' : 'glass-card hover:border-white/15'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-100">{q.label}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30">
                            {q.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">{q.note}</p>
                      </div>
                      <div
                        className={`w-4.5 h-4.5 rounded-full flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/40'
                            : 'border border-white/20'
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
              <div className="p-3 rounded-xl bg-slate-950/50 border border-white/[0.06] space-y-2">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-purple-400" /> Định dạng đóng gói (Container - {videoContainers.length} định dạng):
                </span>
                <div className="grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                  {videoContainers.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => update({ videoContainer: c.id })}
                      className={`p-2 rounded-lg text-left transition-all cursor-pointer ${
                        config.videoContainer === c.id
                          ? 'bg-indigo-500/20 border border-indigo-500/50 text-indigo-200 shadow-sm'
                          : 'bg-white/[0.03] border border-white/[0.06] text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold block truncate">{c.label}</span>
                        {c.badge && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/[0.06] text-slate-400 font-mono shrink-0">
                            {c.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] opacity-75 block truncate">{c.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Codec */}
              <div className="p-3 rounded-xl bg-slate-950/50 border border-white/[0.06] space-y-2">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-pink-400" /> Bộ mã hóa video (Codec - {videoCodecs.length} codec):
                </span>
                <div className="grid grid-cols-2 gap-1.5 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                  {videoCodecs.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => update({ videoCodec: c.id })}
                      className={`p-2 rounded-lg text-left transition-all cursor-pointer ${
                        config.videoCodec === c.id
                          ? 'bg-pink-500/20 border border-pink-500/50 text-pink-200 shadow-sm'
                          : 'bg-white/[0.03] border border-white/[0.06] text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="text-xs font-bold block">{c.label}</span>
                      <span className="text-[10px] opacity-75 block truncate">{c.desc}</span>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400">
                  H.264 cho độ tương thích cao nhất; AV1/HEVC cho độ nét tối đa; ProRes cho dựng phim.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'audio' && (
          <motion.div
            key="audio-tab"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="space-y-3.5"
          >
            {/* Format selection */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-pink-400" /> Chọn định dạng âm thanh ({audioFormats.length} định dạng):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1 scrollbar-thin">
                {audioFormats.map((af) => {
                  const isSelected = config.audioFormat === af.id && config.downloadType === 'audio';
                  const Icon = af.icon;
                  return (
                    <div
                      key={af.id}
                      onClick={() => update({ audioFormat: af.id, downloadType: 'audio' })}
                      className={`p-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between ${
                        isSelected ? 'glass-card-active border-pink-500/60 bg-pink-950/40' : 'glass-card hover:border-white/15'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg bg-white/[0.04] ${af.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-slate-100 block">{af.label}</span>
                          <span className="text-[11px] text-slate-400 block">{af.note}</span>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-4.5 h-4.5 rounded-full bg-pink-500 text-white flex items-center justify-center">
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
              <div className="p-3 rounded-xl bg-slate-950/50 border border-white/[0.06] space-y-2">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-indigo-400" /> Chất lượng Bitrate:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  {audioBitrates.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => update({ audioQuality: b.id })}
                      className={`px-2.5 py-2 rounded-lg text-xs font-semibold text-left transition-all cursor-pointer ${
                        config.audioQuality === b.id
                          ? 'bg-indigo-500/20 border border-indigo-500/60 text-indigo-300'
                          : 'bg-white/[0.03] border border-white/[0.06] text-slate-400 hover:text-white'
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Loudness normalization */}
              <div className="p-3 rounded-xl bg-slate-950/50 border border-white/[0.06] space-y-2 flex flex-col justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> Tinh chỉnh âm thanh:
                </span>

                <div
                  onClick={() => update({ audioNormalize: !config.audioNormalize })}
                  className={`p-2 rounded-lg cursor-pointer flex items-center justify-between transition-all ${
                    config.audioNormalize ? 'bg-emerald-500/15 border border-emerald-500/40' : 'bg-white/[0.03] border border-white/[0.06]'
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">Chuẩn hóa âm lượng (YouTube -14 LUFS)</span>
                    <span className="text-[10px] text-slate-400 block">Cân bằng âm lượng tự động, tránh bài to bài nhỏ</span>
                  </div>
                  <div className={`w-4 h-4 rounded ${config.audioNormalize ? 'bg-emerald-500 text-white' : 'border border-white/20'} flex items-center justify-center shrink-0`}>
                    {config.audioNormalize && <Check className="w-3 h-3" />}
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

        {activeTab === 'trim' && (
          <motion.div
            key="trim-tab"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="p-3.5 rounded-xl bg-slate-950/50 border border-white/[0.06] space-y-2.5"
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
                  value={config.trimStart || ''}
                  onChange={(e) => update({ trimStart: e.target.value })}
                  placeholder="00:00:00"
                  className="w-full glass-input px-3 py-1.5 rounded-xl text-xs font-mono text-slate-200"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Thời gian kết thúc (vd: 00:03:45):</label>
                <input
                  type="text"
                  value={config.trimEnd || ''}
                  onChange={(e) => update({ trimEnd: e.target.value })}
                  placeholder="00:00:00"
                  className="w-full glass-input px-3 py-1.5 rounded-xl text-xs font-mono text-slate-200"
                />
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'advanced' && (
          <motion.div
            key="advanced-tab"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-2.5"
          >
            {/* Embed Subtitles */}
            <div
              onClick={() => update({ embedSubtitles: !config.embedSubtitles })}
              className={`p-2.5 rounded-xl cursor-pointer flex items-center justify-between ${
                config.embedSubtitles ? 'glass-card-active' : 'glass-card'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Subtitles className="w-4 h-4 text-indigo-400" />
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">Tự động nhúng phụ đề</span>
                  <span className="text-[11px] text-slate-400 block">Embed soft subs vào file video</span>
                </div>
              </div>
              <div className={`w-4 h-4 rounded ${config.embedSubtitles ? 'bg-indigo-500 text-white' : 'border border-white/20'} flex items-center justify-center`}>
                {config.embedSubtitles && <Check className="w-3 h-3" />}
              </div>
            </div>

            {/* Embed Thumbnail */}
            <div
              onClick={() => update({ embedThumbnail: !config.embedThumbnail })}
              className={`p-2.5 rounded-xl cursor-pointer flex items-center justify-between ${
                config.embedThumbnail ? 'glass-card-active' : 'glass-card'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ImageIcon className="w-4 h-4 text-purple-400" />
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">Nhúng ảnh bìa (Thumbnail)</span>
                  <span className="text-[11px] text-slate-400 block">Hiện cover art khi phát video/audio</span>
                </div>
              </div>
              <div className={`w-4 h-4 rounded ${config.embedThumbnail ? 'bg-indigo-500 text-white' : 'border border-white/20'} flex items-center justify-center`}>
                {config.embedThumbnail && <Check className="w-3 h-3" />}
              </div>
            </div>

            {/* Embed Metadata */}
            <div
              onClick={() => update({ embedMetadata: !config.embedMetadata })}
              className={`p-2.5 rounded-xl cursor-pointer flex items-center justify-between ${
                config.embedMetadata ? 'glass-card-active' : 'glass-card'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">Nhúng Metadata (ID3 Tag)</span>
                  <span className="text-[11px] text-slate-400 block">Gắn tác giả, album, năm phát hành</span>
                </div>
              </div>
              <div className={`w-4 h-4 rounded ${config.embedMetadata ? 'bg-indigo-500 text-white' : 'border border-white/20'} flex items-center justify-center`}>
                {config.embedMetadata && <Check className="w-3 h-3" />}
              </div>
            </div>

            {/* SponsorBlock */}
            <div
              onClick={() => update({ sponsorblock: !config.sponsorblock })}
              className={`p-2.5 rounded-xl cursor-pointer flex items-center justify-between ${
                config.sponsorblock ? 'glass-card-active' : 'glass-card'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 text-amber-400" />
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">SponsorBlock (Bỏ quảng cáo)</span>
                  <span className="text-[11px] text-slate-400 block">Tự cắt đoạn tài trợ/intro nhà tài trợ</span>
                </div>
              </div>
              <div className={`w-4 h-4 rounded ${config.sponsorblock ? 'bg-indigo-500 text-white' : 'border border-white/20'} flex items-center justify-center`}>
                {config.sponsorblock && <Check className="w-3 h-3" />}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Optional Filename Input */}
      {showFilenameInput && (
        <div className="pt-2 border-t border-white/[0.06] space-y-1">
          <label className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
            <FileEdit className="w-3.5 h-3.5 text-indigo-400" />
            Đổi tên file lưu trữ cho video này (Tùy chọn):
          </label>
          <input
            type="text"
            value={config.customFilename || ''}
            onChange={(e) => update({ customFilename: e.target.value })}
            placeholder="Tên file tùy thích (để trống sẽ dùng tiêu đề gốc)..."
            className="w-full glass-input px-3 py-2 rounded-xl text-xs font-mono text-slate-200"
          />
        </div>
      )}
    </div>
  );
};
