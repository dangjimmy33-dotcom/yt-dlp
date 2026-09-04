import React, { useState, useMemo } from 'react';
import { MediaInfo, PlaylistEntry, AppSettings, DownloadRequest } from '../types';
import {
  CheckSquare,
  Square,
  Layers,
  Search,
  Download,
  Clock,
  Video,
  Music,
  SlidersHorizontal,
  FolderOpen,
  User,
  Settings2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Check,
  Disc,
  Zap,
  Scissors,
  ExternalLink,
  ListVideo,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { FormatConfigCard, FullFormatConfig } from './FormatConfigCard';

interface SearchResultsListProps {
  media: MediaInfo;
  settings: AppSettings;
  onStartCustomBatch: (requests: DownloadRequest[]) => void;
  onStartSingleDownload: (request: DownloadRequest) => void;
  onSelectFolder: () => void;
  onOpenItem?: (url: string) => void;
  onSearchMore?: (count: number) => void;
}

export const SearchResultsList: React.FC<SearchResultsListProps> = ({
  media,
  settings,
  onStartCustomBatch,
  onStartSingleDownload,
  onSelectFolder,
  onOpenItem,
  onSearchMore,
}) => {
  const allEntries = useMemo(() => media.entries || [], [media.entries]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    return new Set(allEntries.map((e) => e.id));
  });

  const [filterText, setFilterText] = useState<string>('');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [isGlobalSettingExpanded, setIsGlobalSettingExpanded] = useState<boolean>(false);

  // Global Configuration that can be applied to all or used as fallback
  const [globalConfig, setGlobalConfig] = useState<FullFormatConfig>({
    downloadType: 'video',
    quality: settings.defaultVideoQuality || '1080p',
    videoContainer: 'mp4',
    videoCodec: 'auto',
    audioFormat: settings.defaultAudioFormat || 'mp3',
    audioQuality: settings.defaultAudioQuality || '320K',
    audioNormalize: true,
    customFilename: '',
    trimStart: '',
    trimEnd: '',
    embedSubtitles: settings.embedSubtitles || false,
    embedThumbnail: settings.embedThumbnail ?? true,
    embedMetadata: settings.embedMetadata ?? true,
    sponsorblock: settings.sponsorBlock || false,
  });

  // Per-item override configs
  const [itemConfigs, setItemConfigs] = useState<Record<string, FullFormatConfig>>(() => {
    const initial: Record<string, FullFormatConfig> = {};
    allEntries.forEach((e) => {
      initial[e.id] = {
        downloadType: 'video',
        quality: settings.defaultVideoQuality || '1080p',
        videoContainer: 'mp4',
        videoCodec: 'auto',
        audioFormat: settings.defaultAudioFormat || 'mp3',
        audioQuality: settings.defaultAudioQuality || '320K',
        audioNormalize: true,
        customFilename: '',
        trimStart: '',
        trimEnd: '',
        embedSubtitles: settings.embedSubtitles || false,
        embedThumbnail: settings.embedThumbnail ?? true,
        embedMetadata: settings.embedMetadata ?? true,
        sponsorblock: settings.sponsorBlock || false,
      };
    });
    return initial;
  });

  const [fromEp, setFromEp] = useState<string>('1');
  const [toEp, setToEp] = useState<string>(String(allEntries.length || 1));

  const filteredEntries = useMemo(() => {
    if (!filterText.trim()) return allEntries;
    const lower = filterText.toLowerCase();
    return allEntries.filter(
      (e) =>
        e.title.toLowerCase().includes(lower) ||
        (e.uploader && e.uploader.toLowerCase().includes(lower))
    );
  }, [allEntries, filterText]);

  const selectedCount = selectedIds.size;
  const isAllSelected = allEntries.length > 0 && selectedCount === allEntries.length;

  // Toggle selection
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = (select: boolean) => {
    if (select) {
      setSelectedIds(new Set(allEntries.map((e) => e.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleApplyRange = () => {
    const start = Math.max(1, parseInt(fromEp, 10) || 1);
    const end = Math.min(allEntries.length, parseInt(toEp, 10) || allEntries.length);
    const newSet = new Set<string>();
    allEntries.forEach((e, idx) => {
      const epNum = idx + 1;
      if (epNum >= start && epNum <= end) {
        newSet.add(e.id);
      }
    });
    setSelectedIds(newSet);
    toast.success(`Đã chọn ${newSet.size} video từ tập ${start} đến ${end}`);
  };

  // Apply global config to ALL items
  const handleApplyGlobalToAll = () => {
    const updated: Record<string, FullFormatConfig> = {};
    allEntries.forEach((e) => {
      updated[e.id] = {
        ...globalConfig,
        customFilename: itemConfigs[e.id]?.customFilename || '',
        trimStart: itemConfigs[e.id]?.trimStart || '',
        trimEnd: itemConfigs[e.id]?.trimEnd || '',
      };
    });
    setItemConfigs(updated);
    toast.success('Đã đồng bộ toàn bộ cài đặt chung (Format, Độ phân giải, Codec, Audio) cho tất cả video!');
  };

  // Quick preset helpers
  const handleSetAllPreset = (type: 'video' | 'audio', qualityOrFormat: string) => {
    const updated: Record<string, FullFormatConfig> = {};
    allEntries.forEach((e) => {
      const current = itemConfigs[e.id] || globalConfig;
      updated[e.id] = {
        ...current,
        downloadType: type,
        quality: type === 'video' ? qualityOrFormat : current.quality,
        audioFormat: type === 'audio' ? qualityOrFormat : current.audioFormat,
      };
    });
    setItemConfigs(updated);
    toast.success(
      type === 'video'
        ? `Đã chuyển toàn bộ ${allEntries.length} video sang định dạng Video ${qualityOrFormat}!`
        : `Đã chuyển toàn bộ ${allEntries.length} video sang định dạng Âm thanh ${qualityOrFormat.toUpperCase()} 320k!`
    );
  };

  // Update a single item's config
  const updateItemConfig = (id: string, newConfig: FullFormatConfig) => {
    setItemConfigs((prev) => ({
      ...prev,
      [id]: newConfig,
    }));
  };

  // Build DownloadRequest for an entry
  const createDownloadRequest = (entry: PlaylistEntry, config: FullFormatConfig): DownloadRequest => {
    const isAudio = config.downloadType === 'audio';
    const displayTitle = config.customFilename?.trim() || entry.title;
    return {
      id: `task-${Date.now()}-${entry.id}-${Math.random().toString(36).slice(2, 6)}`,
      url: entry.url,
      title: isAudio
        ? `[Audio ${config.audioFormat.toUpperCase()}] ${displayTitle}`
        : `[Video ${config.quality}] ${displayTitle}`,
      download_type: config.downloadType,
      quality: isAudio ? 'best' : config.quality,
      video_container: isAudio ? undefined : config.videoContainer,
      video_codec: isAudio || config.videoCodec === 'auto' ? undefined : config.videoCodec,
      audio_format: isAudio ? config.audioFormat : undefined,
      audio_quality: isAudio ? config.audioQuality : undefined,
      audio_normalize: isAudio ? config.audioNormalize : undefined,
      output_dir: settings.defaultDownloadDir,
      custom_filename: config.customFilename?.trim() || undefined,
      trim_start: config.trimStart?.trim() || undefined,
      trim_end: config.trimEnd?.trim() || undefined,
      embed_subtitles: config.embedSubtitles,
      embed_thumbnail: config.embedThumbnail,
      embed_metadata: config.embedMetadata,
      sponsorblock: config.sponsorblock,
      cookies_browser: settings.cookiesBrowser,
    };
  };

  // 1-Click download 1 single item as Video
  const handleQuickDownloadVideoSingle = (entry: PlaylistEntry) => {
    if (!settings.defaultDownloadDir?.trim()) {
      toast.error('Chưa chọn thư mục lưu video. Hãy chọn nơi lưu trước.');
      onSelectFolder();
      return;
    }
    const cfg = itemConfigs[entry.id] || globalConfig;
    const videoCfg: FullFormatConfig = { ...cfg, downloadType: 'video' };
    const req = createDownloadRequest(entry, videoCfg);
    onStartSingleDownload(req);
    toast.success(`Bắt đầu tải Video: ${entry.title}`);
  };

  // 1-Click download 1 single item as Audio
  const handleQuickDownloadAudioSingle = (entry: PlaylistEntry) => {
    if (!settings.defaultDownloadDir?.trim()) {
      toast.error('Chưa chọn thư mục lưu video. Hãy chọn nơi lưu trước.');
      onSelectFolder();
      return;
    }
    const cfg = itemConfigs[entry.id] || globalConfig;
    const audioCfg: FullFormatConfig = { ...cfg, downloadType: 'audio', audioFormat: cfg.audioFormat || 'mp3' };
    const req = createDownloadRequest(entry, audioCfg);
    onStartSingleDownload(req);
    toast.success(`Bắt đầu tách nhạc MP3 320k: ${entry.title}`);
  };

  // Download all selected items respecting their individual configs
  const handleStartBulkDownloadCustom = () => {
    if (selectedCount === 0) {
      toast.error('Vui lòng chọn ít nhất 1 video để tải.');
      return;
    }
    if (!settings.defaultDownloadDir?.trim()) {
      toast.error('Chưa chọn thư mục lưu video. Hãy chọn nơi lưu trước.');
      onSelectFolder();
      return;
    }
    const selectedEntries = allEntries.filter((e) => selectedIds.has(e.id));
    const requests = selectedEntries.map((entry) => {
      const cfg = itemConfigs[entry.id] || globalConfig;
      return createDownloadRequest(entry, cfg);
    });
    onStartCustomBatch(requests);
    toast.success(`Đã thêm ${requests.length} video vào hàng đợi tải theo cấu hình riêng!`);
  };

  // 1-Click Batch Download all selected as Video
  const handleStartBulkVideo = () => {
    if (selectedCount === 0) {
      toast.error('Vui lòng chọn ít nhất 1 video để tải.');
      return;
    }
    if (!settings.defaultDownloadDir?.trim()) {
      toast.error('Chưa chọn thư mục lưu video. Hãy chọn nơi lưu trước.');
      onSelectFolder();
      return;
    }
    const selectedEntries = allEntries.filter((e) => selectedIds.has(e.id));
    const requests = selectedEntries.map((entry) => {
      const cfg = itemConfigs[entry.id] || globalConfig;
      return createDownloadRequest(entry, { ...cfg, downloadType: 'video', quality: globalConfig.quality || '1080p' });
    });
    onStartCustomBatch(requests);
    toast.success(`Đã thêm ${requests.length} video (${globalConfig.quality}) vào hàng đợi tải!`);
  };

  // 1-Click Batch Download all selected as Audio (MP3 320k)
  const handleStartBulkAudio = () => {
    if (selectedCount === 0) {
      toast.error('Vui lòng chọn ít nhất 1 video để tải.');
      return;
    }
    if (!settings.defaultDownloadDir?.trim()) {
      toast.error('Chưa chọn thư mục lưu video. Hãy chọn nơi lưu trước.');
      onSelectFolder();
      return;
    }
    const selectedEntries = allEntries.filter((e) => selectedIds.has(e.id));
    const requests = selectedEntries.map((entry) => {
      const cfg = itemConfigs[entry.id] || globalConfig;
      return createDownloadRequest(entry, {
        ...cfg,
        downloadType: 'audio',
        audioFormat: globalConfig.audioFormat || 'mp3',
        audioQuality: globalConfig.audioQuality || '320K',
        audioNormalize: true,
      });
    });
    onStartCustomBatch(requests);
    toast.success(`Đã thêm ${requests.length} bài hát (${globalConfig.audioFormat.toUpperCase()} 320k) vào hàng đợi tách nhạc!`);
  };

  // Summary counts
  const summary = useMemo(() => {
    let videoCount = 0;
    let audioCount = 0;
    allEntries.forEach((e) => {
      if (selectedIds.has(e.id)) {
        const cfg = itemConfigs[e.id] || globalConfig;
        if (cfg.downloadType === 'audio') audioCount++;
        else videoCount++;
      }
    });
    return { videoCount, audioCount };
  }, [allEntries, selectedIds, itemConfigs, globalConfig]);

  const isSearchMode = media.uploader === 'YouTube Search' || media.title.startsWith('Kết quả tìm kiếm') || media.title.startsWith('Danh sách phát cho');

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="w-full glass-panel rounded-3xl p-4 md:p-6 space-y-4 border border-indigo-500/25 shadow-2xl relative overflow-hidden"
    >
      {/* Background glowing gradients */}
      <div className="absolute -top-24 -right-24 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0 shadow-lg shadow-indigo-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base md:text-lg font-extrabold text-slate-100 truncate flex items-center gap-2">
              <span>{media.title}</span>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-[11px] text-indigo-300 font-mono">
                {allEntries.length} mục
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Có thể tải nhanh từng video (1080p / MP3 320k), mở trọn bộ playlist hoặc chỉnh chi tiết từng tập.
            </p>
          </div>
        </div>

        {/* Global Settings Trigger */}
        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <button
            onClick={() => setIsGlobalSettingExpanded(!isGlobalSettingExpanded)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <Settings2 className="w-4 h-4 text-indigo-400" />
            <span>{isGlobalSettingExpanded ? 'Thu gọn Cài đặt chung' : 'Cài đặt chung cho tất cả'}</span>
            {isGlobalSettingExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* 1. GLOBAL SETTINGS PANEL (FULL RICH FORMAT SELECTOR) */}
      <AnimatePresence>
        {isGlobalSettingExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-300 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Cài Đặt Chung Cho Toàn Bộ Video (Global Settings)
              </span>
              <button
                onClick={handleApplyGlobalToAll}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-95 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 cursor-pointer self-start sm:self-auto"
                title="Áp dụng cấu hình này ngay cho tất cả video trong danh sách"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Áp dụng cấu hình này cho tất cả</span>
              </button>
            </div>

            <FormatConfigCard
              config={globalConfig}
              onChange={setGlobalConfig}
              showFilenameInput={false}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. QUICK BATCH PRESETS & RANGE TOOLBAR */}
      <div className="space-y-2.5 p-3 rounded-2xl bg-slate-950/40 border border-white/[0.06]">
        {/* Quick Batch Presets Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/[0.04] text-xs">
          <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Tùy chọn nhanh toàn bộ:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => handleSetAllPreset('video', '1080p')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/30 border border-indigo-500/30 text-indigo-300 text-[11px] font-bold transition-all cursor-pointer"
              title="Đặt toàn bộ danh sách thành Video 1080p"
            >
              <Video className="w-3 h-3 text-indigo-400" />
              <span>Tất cả Video 1080p</span>
            </button>

            <button
              onClick={() => handleSetAllPreset('video', 'best')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-500/15 hover:bg-purple-500/30 border border-purple-500/30 text-purple-300 text-[11px] font-bold transition-all cursor-pointer"
              title="Đặt toàn bộ danh sách thành Video Cao Nhất (4K/2K)"
            >
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span>Tất cả Video Cao Nhất</span>
            </button>

            <button
              onClick={() => handleSetAllPreset('audio', 'mp3')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-pink-500/15 hover:bg-pink-500/30 border border-pink-500/30 text-pink-300 text-[11px] font-bold transition-all cursor-pointer"
              title="Đặt toàn bộ danh sách thành Nhạc MP3 320k"
            >
              <Music className="w-3 h-3 text-pink-400" />
              <span>Tất cả Nhạc MP3 320k</span>
            </button>

            <button
              onClick={() => handleSetAllPreset('audio', 'flac')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/30 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold transition-all cursor-pointer"
              title="Đặt toàn bộ danh sách thành Nhạc Lossless FLAC"
            >
              <Disc className="w-3 h-3 text-emerald-400" />
              <span>Tất cả FLAC Lossless</span>
            </button>
          </div>
        </div>

        {/* Filter & Range Selector */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 items-center text-xs">
          {/* Search within results */}
          <div className="md:col-span-6 relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              placeholder="Lọc tiêu đề hoặc tên kênh trong danh sách..."
              className="w-full glass-input pl-8 pr-3 py-1.5 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none"
            />
          </div>

          {/* Range Selector */}
          <div className="md:col-span-6 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-slate-300">
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>Tập:</span>
              <input
                type="number"
                min={1}
                max={allEntries.length}
                value={fromEp}
                onChange={(e) => setFromEp(e.target.value)}
                className="w-14 bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-center font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
              <span>đến</span>
              <input
                type="number"
                min={1}
                max={allEntries.length}
                value={toEp}
                onChange={(e) => setToEp(e.target.value)}
                className="w-14 bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-center font-mono text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleApplyRange}
                className="px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 font-bold transition-all cursor-pointer"
              >
                Chọn khoảng
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleSelectAll(!isAllSelected)}
                className="px-2.5 py-1 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.06] font-semibold transition-all cursor-pointer"
              >
                {isAllSelected ? 'Bỏ chọn hết' : 'Chọn tất cả'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 3. VIDEO / PLAYLIST CARDS LIST WITH INDIVIDUAL ACTIONS */}
      <div className="space-y-2.5 max-h-[52vh] overflow-y-auto pr-1.5 custom-scrollbar">
        {filteredEntries.map((entry, idx) => {
          const isSelected = selectedIds.has(entry.id);
          const itemCfg = itemConfigs[entry.id] || globalConfig;
          const isExpanded = expandedItemId === entry.id;
          const isEntryPlaylist = entry.is_playlist || entry.entry_type === 'playlist' || entry.url.includes('/playlist?list=');
          const isEntryChannel = entry.entry_type === 'channel' || entry.url.includes('/channel/') || entry.url.includes('/@');

          return (
            <div
              key={entry.id || idx}
              className={`rounded-2xl transition-all border ${
                isSelected
                  ? 'bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-900/60 border-indigo-500/40 shadow-md shadow-indigo-950/30'
                  : 'bg-white/[0.02] border-white/[0.06] hover:border-white/15'
              }`}
            >
              {/* Main Card Row */}
              <div className="p-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
                {/* Left: Checkbox, Index, Thumbnail, Title */}
                <div
                  onClick={() => toggleSelect(entry.id)}
                  className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                >
                  <div className="text-indigo-400 shrink-0">
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 text-indigo-400" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-600" />
                    )}
                  </div>

                  <span className="text-xs font-mono text-slate-500 w-6 text-center font-bold shrink-0">
                    #{idx + 1}
                  </span>

                  <div className="relative w-24 aspect-video rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-white/10 shadow-md">
                    {entry.thumbnail ? (
                      <img
                        src={entry.thumbnail}
                        alt={entry.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600">
                        {isEntryPlaylist ? <Layers className="w-6 h-6 text-purple-400" /> : <Video className="w-6 h-6" />}
                      </div>
                    )}
                    {entry.duration ? (
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded bg-black/80 text-[10px] text-slate-200 font-mono font-semibold">
                        {Math.floor(entry.duration / 60)}:
                        {String(Math.floor(entry.duration % 60)).padStart(2, '0')}
                      </span>
                    ) : isEntryPlaylist && (
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded bg-purple-900/90 text-[10px] text-purple-200 font-mono font-bold flex items-center gap-0.5">
                        <Layers className="w-2.5 h-2.5" />
                        <span>{entry.playlist_count || 'Playlist'}</span>
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <h3 className="text-xs md:text-sm font-bold text-slate-100 line-clamp-1 group-hover:text-indigo-300 transition-colors flex items-center gap-2">
                      <span>{itemCfg.customFilename?.trim() || entry.title}</span>
                      {isEntryPlaylist && (
                        <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 font-semibold">
                          Danh sách phát
                        </span>
                      )}
                      {isEntryChannel && (
                        <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-semibold">
                          Kênh
                        </span>
                      )}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium flex-wrap">
                      {entry.uploader && (
                        <span className="flex items-center gap-1 truncate max-w-xs">
                          <User className="w-3 h-3 text-indigo-400 shrink-0" />
                          <span className="truncate">{entry.uploader}</span>
                        </span>
                      )}
                      {entry.playlist_count && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 font-mono border border-purple-500/30">
                          {entry.playlist_count} tập / video
                        </span>
                      )}
                      {itemCfg.trimStart && itemCfg.trimEnd && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30 flex items-center gap-1">
                          <Scissors className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>{itemCfg.trimStart} - {itemCfg.trimEnd}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Modern Glassmorphic Fast Action Controls */}
                <div className="flex items-center gap-2 shrink-0 self-end md:self-center flex-wrap">
                  {/* If this entry is a PLAYLIST: offer direct "Mở trọn bộ danh sách" button */}
                  {isEntryPlaylist && onOpenItem ? (
                    <button
                      onClick={() => onOpenItem(entry.url)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 hover:text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                      title="Mở toàn bộ danh sách các tập của playlist này để chọn tải"
                    >
                      <ListVideo className="w-3.5 h-3.5 text-purple-400" />
                      <span>Mở trọn bộ ({entry.playlist_count || 'Xem các tập'})</span>
                    </button>
                  ) : isEntryChannel && onOpenItem ? (
                    <button
                      onClick={() => onOpenItem(`${entry.url}/playlists`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/40 text-cyan-200 hover:text-white text-xs font-bold transition-all shadow-sm cursor-pointer"
                      title="Xem danh sách phát của kênh này"
                    >
                      <Layers className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Xem Playlist kênh</span>
                    </button>
                  ) : (
                    /* Regular video format switcher pills */
                    <div className="flex items-center p-0.5 rounded-xl bg-slate-900/90 border border-white/10 text-xs">
                      <button
                        type="button"
                        onClick={() => updateItemConfig(entry.id, { ...itemCfg, downloadType: 'video' })}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                          itemCfg.downloadType === 'video'
                            ? 'bg-indigo-600/40 text-indigo-200 border border-indigo-500/50 shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Video className="w-3 h-3" />
                        <span>{itemCfg.quality || '1080p'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => updateItemConfig(entry.id, { ...itemCfg, downloadType: 'audio' })}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                          itemCfg.downloadType === 'audio'
                            ? 'bg-pink-600/40 text-pink-200 border border-pink-500/50 shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Music className="w-3 h-3" />
                        <span>{itemCfg.audioFormat?.toUpperCase() || 'MP3'}</span>
                      </button>
                    </div>
                  )}

                  {/* 1-Click Fast Video Download */}
                  <button
                    onClick={() => handleQuickDownloadVideoSingle(entry)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 hover:border-indigo-500/60 text-indigo-200 hover:text-white text-xs font-bold transition-all cursor-pointer"
                    title={`Tải ngay Video ${itemCfg.quality || '1080p'} MP4`}
                  >
                    <Video className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Tải Video</span>
                  </button>

                  {/* 1-Click Fast Audio Extract */}
                  <button
                    onClick={() => handleQuickDownloadAudioSingle(entry)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-pink-600/20 hover:bg-pink-600/40 border border-pink-500/30 hover:border-pink-500/60 text-pink-200 hover:text-white text-xs font-bold transition-all cursor-pointer"
                    title="Tách ngay âm thanh MP3 320kbps"
                  >
                    <Music className="w-3.5 h-3.5 text-pink-400" />
                    <span>Tách MP3</span>
                  </button>

                  {/* Button to toggle Per-Video Detail Editor Accordion */}
                  <button
                    onClick={() => setExpandedItemId(isExpanded ? null : entry.id)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      isExpanded
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                        : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border-white/10'
                    }`}
                    title="Mở toàn bộ tùy chỉnh chi tiết như khi dán link cho riêng video này"
                  >
                    <Settings2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Chi tiết</span>
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>
              </div>

              {/* Accordion: FULL RICH FORMAT SELECTOR FOR THIS SPECIFIC VIDEO */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden border-t border-white/[0.06] bg-slate-950/70 p-4 rounded-b-2xl space-y-3"
                  >
                    <FormatConfigCard
                      config={itemCfg}
                      onChange={(newCfg) => updateItemConfig(entry.id, newCfg)}
                      showFilenameInput={true}
                      titlePrefix={`Tùy chỉnh chi tiết cho: #${idx + 1} - ${entry.title}`}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {/* Load More Button for Searches */}
        {isSearchMode && onSearchMore && (
          <div className="pt-2 flex justify-center">
            <button
              onClick={() => onSearchMore(100)}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-indigo-500/40 text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Tải thêm kết quả (Xem 100 video)</span>
            </button>
          </div>
        )}
      </div>

      {/* 4. STICKY BOTTOM ACTION BAR WITH DUAL BATCH TRIGGERS */}
      <div className="pt-3 border-t border-white/[0.08] flex flex-col md:flex-row items-center justify-between gap-3">
        <button
          onClick={onSelectFolder}
          className="flex items-center gap-2 text-xs text-slate-400 hover:text-indigo-300 font-mono truncate max-w-xs cursor-pointer"
          title="Đổi thư mục lưu trữ"
        >
          <FolderOpen className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="truncate">{settings.defaultDownloadDir || 'Chọn nơi lưu'}</span>
        </button>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          <div className="text-right mr-1">
            <div className="text-xs text-slate-300 font-bold">
              Đã chọn: <span className="text-indigo-300">{selectedCount}</span> / {allEntries.length} mục
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              ({summary.videoCount} Video, {summary.audioCount} Audio)
            </div>
          </div>

          {/* Batch Extract Audio */}
          <button
            onClick={handleStartBulkAudio}
            disabled={selectedCount === 0}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer border ${
              selectedCount === 0
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border-white/5'
                : 'bg-gradient-to-r from-pink-600 to-purple-600 text-white border-pink-500/30 hover:opacity-95 shadow-pink-600/25'
            }`}
            title="Tách âm thanh MP3 320k cho tất cả video đã chọn"
          >
            <Music className="w-4 h-4 text-pink-200" />
            <span>Tách {selectedCount} Audio</span>
          </button>

          {/* Batch Download Video */}
          <button
            onClick={handleStartBulkVideo}
            disabled={selectedCount === 0}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xl cursor-pointer ${
              selectedCount === 0
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
                : 'bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 text-white shadow-indigo-500/30 hover:opacity-95'
            }`}
            title="Tải toàn bộ video đã chọn với chất lượng video cao"
          >
            <Video className="w-4 h-4" />
            <span>Tải {selectedCount} Video</span>
          </button>

          {/* Batch Download Custom */}
          <button
            onClick={handleStartBulkDownloadCustom}
            disabled={selectedCount === 0}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
              selectedCount === 0
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border-white/5'
                : 'bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 border-white/15'
            }`}
            title="Tải toàn bộ theo đúng cấu hình riêng đã tinh chỉnh của từng video"
          >
            <Download className="w-4 h-4 text-indigo-400" />
            <span>Tải theo cấu hình</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};
