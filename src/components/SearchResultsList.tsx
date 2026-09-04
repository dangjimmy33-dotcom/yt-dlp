import React, { useState, useMemo, useEffect } from 'react';
import { MediaInfo, PlaylistEntry, AppSettings, DownloadRequest } from '../types';
import {
  CheckSquare,
  Square,
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
  Zap,
  ListVideo,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  Play,
  RotateCcw,
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

  // Selected entry IDs set
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    return new Set(allEntries.map((e) => e.id));
  });

  const [filterText, setFilterText] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'video' | 'playlist' | 'channel'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [isGlobalSettingExpanded, setIsGlobalSettingExpanded] = useState<boolean>(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(24);

  // Range selector
  const [fromEp, setFromEp] = useState<string>('1');
  const [toEp, setToEp] = useState<string>(String(allEntries.length || 1));

  // Sync state whenever media changes
  useEffect(() => {
    setSelectedIds(new Set(allEntries.map((e) => e.id)));
    setFromEp('1');
    setToEp(String(allEntries.length || 1));
    setCurrentPage(1);
    setExpandedItemId(null);
    if (allEntries.length > 0 && allEntries.every((e) => e.entry_type === 'channel')) {
      setTypeFilter('channel');
    } else if (allEntries.length > 0 && allEntries.every((e) => e.entry_type === 'playlist' || e.is_playlist)) {
      setTypeFilter('playlist');
    } else {
      setTypeFilter('all');
    }
  }, [media.id, media.url, allEntries]);

  // Global format configuration
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
  const [itemConfigs, setItemConfigs] = useState<Record<string, FullFormatConfig>>({});

  // Format seconds to mm:ss or hh:mm:ss
  const formatDuration = (secs?: number): string => {
    if (!secs || isNaN(secs) || secs <= 0) return '';
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Filtered entries
  const filteredEntries = useMemo(() => {
    return allEntries.filter((e) => {
      // Search text filter
      if (filterText.trim()) {
        const lower = filterText.toLowerCase();
        const matchesTitle = e.title.toLowerCase().includes(lower);
        const matchesUploader = e.uploader && e.uploader.toLowerCase().includes(lower);
        if (!matchesTitle && !matchesUploader) return false;
      }

      // Type tab filter
      if (typeFilter === 'video') {
        const isPl = e.is_playlist || e.entry_type === 'playlist' || e.url.includes('/playlist?list=');
        const isCh = e.entry_type === 'channel' || e.url.includes('/channel/') || e.url.includes('/@');
        if (isPl || isCh) return false;
      } else if (typeFilter === 'playlist') {
        const isPl = e.is_playlist || e.entry_type === 'playlist' || e.url.includes('/playlist?list=');
        if (!isPl) return false;
      } else if (typeFilter === 'channel') {
        const isCh = e.entry_type === 'channel' || e.url.includes('/channel/') || e.url.includes('/@');
        if (!isCh) return false;
      }

      return true;
    });
  }, [allEntries, filterText, typeFilter]);

  // Paginated slice
  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / pageSize));
  const paginatedEntries = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEntries.slice(start, start + pageSize);
  }, [filteredEntries, currentPage, pageSize]);

  // Counts
  const selectedCount = useMemo(() => {
    let count = 0;
    allEntries.forEach((e) => {
      if (selectedIds.has(e.id)) count++;
    });
    return count;
  }, [allEntries, selectedIds]);

  const isAllSelected = allEntries.length > 0 && selectedCount === allEntries.length;

  const isCurrentPageAllSelected = useMemo(() => {
    if (paginatedEntries.length === 0) return false;
    return paginatedEntries.every((e) => selectedIds.has(e.id));
  }, [paginatedEntries, selectedIds]);

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

  const handleSelectAllTotal = (select: boolean) => {
    if (select) {
      setSelectedIds(new Set(allEntries.map((e) => e.id)));
      toast.success(`Đã chọn toàn bộ ${allEntries.length} mục`);
    } else {
      setSelectedIds(new Set());
      toast.info('Đã bỏ chọn toàn bộ');
    }
  };

  const handleToggleCurrentPage = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (isCurrentPageAllSelected) {
        paginatedEntries.forEach((e) => next.delete(e.id));
      } else {
        paginatedEntries.forEach((e) => next.add(e.id));
      }
      return next;
    });
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
    toast.success(`Đã chọn ${newSet.size} mục từ vị trí ${start} đến ${end}`);
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
    toast.success('Đã áp dụng cấu hình chung cho tất cả các video!');
  };

  // Build DownloadRequest for an entry
  const createDownloadRequest = (entry: PlaylistEntry, config: FullFormatConfig): DownloadRequest => {
    const isAudio = config.downloadType === 'audio';
    const displayTitle = config.customFilename?.trim() || entry.title;
    return {
      id: `task-${Date.now()}-${entry.id}-${Math.random().toString(36).slice(2, 6)}`,
      url: entry.url,
      title: displayTitle,
      download_type: config.downloadType,
      quality: isAudio ? 'best' : config.quality,
      video_container: isAudio ? undefined : config.videoContainer,
      video_codec: isAudio ? undefined : config.videoCodec,
      audio_format: isAudio ? config.audioFormat : undefined,
      audio_quality: isAudio ? config.audioQuality : undefined,
      audio_normalize: isAudio ? config.audioNormalize : undefined,
      output_dir: settings.defaultDownloadDir || '',
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

  // Single Quick Downloads
  const handleDownloadSingleVideo = (entry: PlaylistEntry) => {
    const cfg = itemConfigs[entry.id] || globalConfig;
    const req = createDownloadRequest(entry, { ...cfg, downloadType: 'video' });
    onStartSingleDownload(req);
    toast.success(`Bắt đầu tải video: ${entry.title}`);
  };

  const handleDownloadSingleAudio = (entry: PlaylistEntry) => {
    const cfg = itemConfigs[entry.id] || globalConfig;
    const req = createDownloadRequest(entry, {
      ...cfg,
      downloadType: 'audio',
      audioFormat: 'mp3',
      audioQuality: '320K',
    });
    onStartSingleDownload(req);
    toast.success(`Bắt đầu tách nhạc MP3: ${entry.title}`);
  };

  // Bulk Actions
  const handleStartBulkVideo = () => {
    const selected = allEntries.filter((e) => selectedIds.has(e.id));
    if (selected.length === 0) {
      toast.error('Chưa chọn video nào!');
      return;
    }
    const requests = selected.map((e) => {
      const cfg = itemConfigs[e.id] || globalConfig;
      return createDownloadRequest(e, { ...cfg, downloadType: 'video' });
    });
    onStartCustomBatch(requests);
  };

  const handleStartBulkAudio = () => {
    const selected = allEntries.filter((e) => selectedIds.has(e.id));
    if (selected.length === 0) {
      toast.error('Chưa chọn mục nào để tách nhạc!');
      return;
    }
    const requests = selected.map((e) => {
      const cfg = itemConfigs[e.id] || globalConfig;
      return createDownloadRequest(e, {
        ...cfg,
        downloadType: 'audio',
        audioFormat: 'mp3',
        audioQuality: '320K',
      });
    });
    onStartCustomBatch(requests);
  };

  const handleStartBulkDownloadCustom = () => {
    const selected = allEntries.filter((e) => selectedIds.has(e.id));
    if (selected.length === 0) {
      toast.error('Chưa chọn video nào!');
      return;
    }
    const requests = selected.map((e) => {
      const cfg = itemConfigs[e.id] || globalConfig;
      return createDownloadRequest(e, cfg);
    });
    onStartCustomBatch(requests);
  };

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

  const channelUploader = media.uploader || 'YouTube Media';

  const renderChannelCard = (entry: PlaylistEntry, index: number, isGrid: boolean) => {
    return (
      <div
        key={entry.id || index}
        className={`${
          isGrid ? 'col-span-full' : 'w-full'
        } rounded-3xl border border-indigo-500/30 bg-gradient-to-r from-slate-950/90 via-indigo-950/30 to-slate-900/90 p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between gap-5 hover:border-indigo-500/60 transition-all shadow-xl group`}
      >
        <div
          onClick={() => onOpenItem && onOpenItem(entry.url)}
          className="flex items-center gap-4 min-w-0 flex-1 cursor-pointer w-full sm:w-auto"
        >
          {/* Avatar circle */}
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-slate-900 border-2 border-indigo-500/50 shrink-0 shadow-xl group-hover:scale-105 transition-transform">
            {entry.thumbnail ? (
              <img
                src={entry.thumbnail}
                alt={entry.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-indigo-600/20 text-indigo-300 font-bold text-xl">
                {entry.title.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="min-w-0 space-y-1.5 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-extrabold text-white group-hover:text-indigo-300 transition-colors">
                {entry.title}
              </h3>
              <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/40">
                Kênh YouTube
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400 font-medium flex-wrap">
              <span className="text-slate-300 font-semibold">{entry.uploader || '@channel'}</span>
              {entry.subscriber_count && (
                <>
                  <span>•</span>
                  <span className="text-indigo-300 font-bold">{entry.subscriber_count}</span>
                </>
              )}
            </div>

            {entry.description && (
              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                {entry.description}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
          <button
            onClick={() => onOpenItem && onOpenItem(entry.url)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
          >
            <Video className="w-4 h-4" />
            <span>Xem Video của Kênh</span>
          </button>
          <button
            onClick={() => {
              const plUrl =
                entry.url.includes('/@') || entry.url.includes('/channel/')
                  ? `${entry.url.replace(/\/+$/, '')}/playlists`
                  : entry.url;
              if (onOpenItem) onOpenItem(plUrl);
            }}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-purple-300 border border-purple-500/30 text-xs font-bold transition-all cursor-pointer"
          >
            <ListVideo className="w-4 h-4" />
            <span>Xem Playlists</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-4 pb-28"
    >
      {/* 1. YOUTUBE-STYLE CHANNEL / SEARCH HEADER BANNER */}
      <div className="relative overflow-hidden rounded-3xl glass-panel p-4 sm:p-6 border border-white/10 shadow-2xl">
        {onOpenItem && (media.url.includes('/videos') || media.url.includes('/playlists')) && (
          <button
            onClick={() => {
              const baseName = channelUploader || 'YouTube';
              onOpenItem(`ytchannel30:${baseName}`);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-indigo-300 border border-white/10 text-xs font-bold transition-all cursor-pointer mb-3"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Quay lại danh sách Kênh</span>
          </button>
        )}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Avatar circle */}
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-gradient-to-tr from-indigo-600 to-pink-600 p-0.5 shrink-0 shadow-xl shadow-indigo-600/20">
              {media.thumbnail ? (
                <img
                  src={media.thumbnail}
                  alt={media.title}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-indigo-300 font-bold text-lg">
                  {channelUploader.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Title & Metadata */}
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight truncate max-w-md sm:max-w-xl">
                  {media.title}
                </h2>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold">
                  <CheckCircle2 className="w-3 h-3 text-indigo-400" />
                  <span>Xác minh</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 flex-wrap font-medium">
                <span className="text-slate-300">{channelUploader}</span>
                <span>•</span>
                <span className="text-indigo-300 font-bold">{allEntries.length} kết quả</span>
                <span>•</span>
                <span>Đã chọn {selectedCount} mục</span>
              </div>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => setIsGlobalSettingExpanded(!isGlobalSettingExpanded)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-bold text-slate-200 transition-all cursor-pointer shadow-md"
            >
              <Settings2 className="w-4 h-4 text-indigo-400" />
              <span>Cài đặt chung ({globalConfig.quality})</span>
              {isGlobalSettingExpanded ? (
                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>
          </div>
        </div>

        {/* Expandable Global Configuration Panel */}
        <AnimatePresence>
          {isGlobalSettingExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden pt-4 mt-4 border-t border-white/[0.08]"
            >
              <div className="space-y-3 p-3 rounded-2xl bg-slate-950/60 border border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Bảng cài đặt định dạng & chất lượng đồng bộ:
                  </span>
                  <button
                    onClick={handleApplyGlobalToAll}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Đồng bộ cho tất cả {allEntries.length} mục</span>
                  </button>
                </div>

                <FormatConfigCard
                  config={globalConfig}
                  onChange={setGlobalConfig}
                  showFilenameInput={false}
                  titlePrefix="Cấu hình chung"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 2. NAVIGATION BAR (YOUTUBE-STYLE TABS & VIEW SWITCHER) */}
      <div className="glass-panel p-3 rounded-2xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-3 shadow-lg">
        {/* Left: Category Tabs */}
        <div className="flex items-center gap-1 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 scrollbar-none text-xs">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'video', label: 'Video lẻ' },
            { id: 'playlist', label: 'Danh sách phát / Trọn bộ' },
            { id: 'channel', label: 'Kênh' },
          ].map((tab) => {
            const isActive = typeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setTypeFilter(tab.id as any);
                  setCurrentPage(1);
                }}
                className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-white/[0.03] hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 border border-white/[0.05]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Center/Right: Live Filter Input & Controls */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end">
          {/* Live Search inside results */}
          <div className="relative flex-1 md:w-60">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={filterText}
              onChange={(e) => {
                setFilterText(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Lọc nhanh kết quả..."
              className="w-full bg-slate-900/90 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center p-0.5 rounded-xl bg-slate-900/90 border border-white/10 shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Dạng lưới chuẩn YouTube"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'list'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Dạng danh sách hàng ngang"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 3. SELECTION & RANGE CONTROLS BAR */}
      <div className="px-4 py-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        {/* Left: Quick Selection buttons */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
          <button
            onClick={() => handleSelectAllTotal(!isAllSelected)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border border-white/[0.08] font-semibold transition-all cursor-pointer"
          >
            {isAllSelected ? (
              <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
            ) : (
              <Square className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>{isAllSelected ? 'Bỏ chọn tất cả' : `Chọn tất cả (${allEntries.length})`}</span>
          </button>

          <button
            onClick={handleToggleCurrentPage}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.08] font-semibold transition-all cursor-pointer"
          >
            <span>{isCurrentPageAllSelected ? 'Bỏ chọn trang này' : 'Chọn cả trang này'}</span>
          </button>
        </div>

        {/* Right: Range selector */}
        <div className="flex items-center gap-2 flex-wrap w-full md:w-auto justify-end">
          <span className="text-slate-400">Chọn từ số:</span>
          <input
            type="number"
            min={1}
            max={allEntries.length}
            value={fromEp}
            onChange={(e) => setFromEp(e.target.value)}
            className="w-12 bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-center font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
          />
          <span className="text-slate-400">đến</span>
          <input
            type="number"
            min={1}
            max={allEntries.length}
            value={toEp}
            onChange={(e) => setToEp(e.target.value)}
            className="w-12 bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-center font-mono text-slate-200 focus:outline-none focus:border-indigo-500"
          />
          <button
            onClick={handleApplyRange}
            className="px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 font-bold transition-all cursor-pointer"
          >
            Chọn khoảng
          </button>
        </div>
      </div>

      {/* 4. RESULTS DISPLAY (GRID OR LIST VIEW) */}
      {paginatedEntries.length === 0 ? (
        <div className="p-12 text-center rounded-3xl glass-panel border border-white/10 space-y-3">
          <Filter className="w-8 h-8 text-slate-500 mx-auto" />
          <div className="text-sm font-bold text-slate-300">Không có kết quả nào phù hợp</div>
          <p className="text-xs text-slate-500">Hãy thử đổi từ khóa tìm kiếm hoặc chọn lại tab phân loại.</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* YOUTUBE-STYLE 16:9 GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginatedEntries.map((entry, index) => {
            const isEntryChannel =
              entry.entry_type === 'channel' || entry.url.includes('/channel/') || entry.url.includes('/@');
            if (isEntryChannel) {
              return renderChannelCard(entry, index, true);
            }

            const isSelected = selectedIds.has(entry.id);
            const isExpanded = expandedItemId === entry.id;
            const isEntryPlaylist =
              entry.is_playlist || entry.entry_type === 'playlist' || entry.url.includes('/playlist?list=');
            const durationStr = formatDuration(entry.duration);

            return (
              <div
                key={entry.id || index}
                className={`group relative rounded-2xl overflow-hidden border transition-all flex flex-col ${
                  isSelected
                    ? 'bg-slate-900/90 border-indigo-500/50 shadow-xl shadow-indigo-950/40'
                    : 'bg-slate-950/60 border-white/[0.08] hover:border-white/20'
                }`}
              >
                {/* 16:9 Thumbnail with duration / playlist overlay */}
                <div className="relative aspect-video w-full bg-slate-900 overflow-hidden">
                  {entry.thumbnail ? (
                    <img
                      src={entry.thumbnail}
                      alt={entry.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-900 to-indigo-950 text-slate-600">
                      <Video className="w-10 h-10" />
                    </div>
                  )}

                  {/* Top-Left Selection Checkbox */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSelect(entry.id);
                    }}
                    className="absolute top-2 left-2 z-10 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 backdrop-blur-md cursor-pointer transition-all border border-white/10"
                    title={isSelected ? 'Bỏ chọn' : 'Tích chọn'}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-indigo-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-300" />
                    )}
                  </div>

                  {/* Bottom-Right Duration or Playlist Badge */}
                  <div className="absolute bottom-2 right-2 z-10">
                    {isEntryPlaylist ? (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-white text-[11px] font-bold border border-white/10 shadow-md">
                        <ListVideo className="w-3.5 h-3.5 text-purple-400" />
                        <span>{entry.playlist_count ? `${entry.playlist_count} video` : 'Trọn bộ'}</span>
                      </div>
                    ) : durationStr ? (
                      <div className="px-1.5 py-0.5 rounded-md bg-black/80 backdrop-blur-md text-white text-[10px] font-mono font-bold">
                        {durationStr}
                      </div>
                    ) : null}
                  </div>
                </div>

                {/* Card Content & Metadata */}
                <div className="p-3 flex-1 flex flex-col justify-between space-y-2.5">
                  <div className="space-y-1">
                    <h3
                      onClick={() => toggleSelect(entry.id)}
                      className="text-xs sm:text-sm font-bold text-slate-100 line-clamp-2 leading-snug cursor-pointer group-hover:text-indigo-300 transition-colors"
                      title={entry.title}
                    >
                      {entry.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 truncate">
                      <User className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="truncate">{entry.uploader || channelUploader}</span>
                    </div>
                  </div>

                  {/* Action Buttons Bar */}
                  <div className="pt-2 border-t border-white/[0.06] flex items-center gap-1.5">
                    {isEntryPlaylist ? (
                      <button
                        onClick={() => onOpenItem && onOpenItem(entry.url)}
                        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/20 cursor-pointer"
                        title="Mở toàn bộ danh sách phát này để tải"
                      >
                        <ListVideo className="w-3.5 h-3.5" />
                        <span>Mở trọn bộ</span>
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleDownloadSingleVideo(entry)}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition-all cursor-pointer"
                          title="Tải video chất lượng cao"
                        >
                          <Video className="w-3 h-3" />
                          <span>Video</span>
                        </button>
                        <button
                          onClick={() => handleDownloadSingleAudio(entry)}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl bg-pink-600/20 hover:bg-pink-600/30 text-pink-300 border border-pink-500/30 text-xs font-bold transition-all cursor-pointer"
                          title="Tách âm thanh MP3 320k"
                        >
                          <Music className="w-3 h-3" />
                          <span>MP3</span>
                        </button>
                        <button
                          onClick={() => setExpandedItemId(isExpanded ? null : entry.id)}
                          className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                            isExpanded
                              ? 'bg-indigo-600 text-white border-indigo-500'
                              : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white border-white/10'
                          }`}
                          title="Tùy chỉnh định dạng riêng"
                        >
                          <Settings2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Expandable Per-item Configuration */}
                  {isExpanded && !isEntryPlaylist && (
                    <div className="pt-2">
                      <FormatConfigCard
                        config={itemConfigs[entry.id] || globalConfig}
                        onChange={(newCfg) =>
                          setItemConfigs((prev) => ({ ...prev, [entry.id]: newCfg }))
                        }
                        showFilenameInput={true}
                        titlePrefix="Tùy chỉnh mục này"
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* YOUTUBE-STYLE HORIZONTAL LIST VIEW */
        <div className="space-y-3">
          {paginatedEntries.map((entry, index) => {
            const isEntryChannel =
              entry.entry_type === 'channel' || entry.url.includes('/channel/') || entry.url.includes('/@');
            if (isEntryChannel) {
              return renderChannelCard(entry, index, false);
            }

            const isSelected = selectedIds.has(entry.id);
            const isExpanded = expandedItemId === entry.id;
            const isEntryPlaylist =
              entry.is_playlist || entry.entry_type === 'playlist' || entry.url.includes('/playlist?list=');
            const durationStr = formatDuration(entry.duration);

            return (
              <div
                key={entry.id || index}
                className={`rounded-2xl border transition-all p-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                  isSelected
                    ? 'bg-slate-900/90 border-indigo-500/50 shadow-lg shadow-indigo-950/30'
                    : 'bg-slate-950/60 border-white/[0.08] hover:border-white/20'
                }`}
              >
                {/* Left: Checkbox + 16:9 Thumbnail + Info */}
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <div
                    onClick={() => toggleSelect(entry.id)}
                    className="cursor-pointer text-indigo-400 p-1"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-5 h-5 text-indigo-400" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-400" />
                    )}
                  </div>

                  <div className="relative aspect-video w-32 sm:w-40 rounded-xl overflow-hidden bg-slate-900 shrink-0 border border-white/10">
                    {entry.thumbnail ? (
                      <img
                        src={entry.thumbnail}
                        alt={entry.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-600">
                        <Video className="w-6 h-6" />
                      </div>
                    )}
                    <div className="absolute bottom-1 right-1 z-10">
                      {isEntryPlaylist ? (
                        <div className="px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-bold text-purple-300">
                          Playlist
                        </div>
                      ) : durationStr ? (
                        <div className="px-1.5 py-0.5 rounded bg-black/80 text-[10px] font-mono font-bold text-white">
                          {durationStr}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Title & Metadata */}
                  <div className="min-w-0 space-y-1">
                    <h3
                      onClick={() => toggleSelect(entry.id)}
                      className="text-xs sm:text-sm font-bold text-slate-100 line-clamp-2 hover:text-indigo-300 cursor-pointer transition-colors"
                    >
                      {entry.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>{entry.uploader || channelUploader}</span>
                      {isEntryPlaylist && (
                        <span className="px-2 py-0.2 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                          {entry.playlist_count ? `${entry.playlist_count} tập` : 'Danh sách phát'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Action buttons */}
                <div className="flex items-center gap-2 w-full md:w-auto justify-end shrink-0">
                  {isEntryPlaylist ? (
                    <button
                      onClick={() => onOpenItem && onOpenItem(entry.url)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                    >
                      <ListVideo className="w-3.5 h-3.5" />
                      <span>Mở trọn bộ</span>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleDownloadSingleVideo(entry)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition-all cursor-pointer"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Tải Video</span>
                      </button>
                      <button
                        onClick={() => handleDownloadSingleAudio(entry)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-pink-600/20 hover:bg-pink-600/30 text-pink-300 border border-pink-500/30 text-xs font-bold transition-all cursor-pointer"
                      >
                        <Music className="w-3.5 h-3.5" />
                        <span>Tách MP3</span>
                      </button>
                      <button
                        onClick={() => setExpandedItemId(isExpanded ? null : entry.id)}
                        className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-white border border-white/10 transition-all cursor-pointer"
                        title="Tùy chỉnh"
                      >
                        <Settings2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. PAGINATION & LAZY LOADING CONTROLS */}
      {totalPages > 1 && (
        <div className="p-4 rounded-2xl glass-panel border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-400">
            Hiển thị trang <span className="text-white font-bold">{currentPage}</span> / {totalPages} (Tổng cộng{' '}
            <span className="text-indigo-300 font-bold">{filteredEntries.length}</span> mục)
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                currentPage === 1
                  ? 'bg-white/[0.02] text-slate-600 cursor-not-allowed border border-white/[0.04]'
                  : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/10'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Trước</span>
            </button>

            {/* Page number buttons */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5 && currentPage > 3) {
                  pageNum = currentPage - 3 + i;
                  if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                }
                const isActive = currentPage === pageNum;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-8 h-8 rounded-xl font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-white/[0.03] hover:bg-white/[0.08] text-slate-400 hover:text-white border border-white/[0.05]'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                currentPage === totalPages
                  ? 'bg-white/[0.02] text-slate-600 cursor-not-allowed border border-white/[0.04]'
                  : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/10'
              }`}
            >
              <span>Sau</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Page size selector */}
          <div className="flex items-center gap-1.5 text-slate-400">
            <span>Mỗi trang:</span>
            {[18, 24, 36].map((sz) => (
              <button
                key={sz}
                onClick={() => {
                  setPageSize(sz);
                  setCurrentPage(1);
                }}
                className={`px-2 py-0.5 rounded-lg font-mono font-bold transition-all cursor-pointer ${
                  pageSize === sz
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {sz}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 6. FLOATING DOCK BOTTOM SUMMARY & BATCH DOWNLOAD ACTIONS */}
      <div className="fixed bottom-4 left-4 right-4 max-w-6xl mx-auto z-40 p-3.5 sm:p-4 rounded-3xl bg-slate-950/90 border border-indigo-500/30 shadow-2xl backdrop-blur-2xl flex flex-col md:flex-row items-center justify-between gap-3">
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
