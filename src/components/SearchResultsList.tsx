import React, { useState, useMemo } from 'react';
import { MediaInfo, PlaylistEntry, AppSettings } from '../types';
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
} from 'lucide-react';
import { motion } from 'framer-motion';

export interface BulkDownloadOptions {
  downloadType: 'video' | 'audio';
  quality: string;
  audioFormat: string;
  audioQuality: string;
}

interface SearchResultsListProps {
  media: MediaInfo;
  settings: AppSettings;
  onDownloadSingle: (
    entry: PlaylistEntry,
    type: 'video' | 'audio',
    qualityOrFormat: string,
    audioQuality?: string
  ) => void;
  onDownloadMultiple: (
    entries: PlaylistEntry[],
    options: BulkDownloadOptions
  ) => void;
  onSelectFolder: () => void;
}

export const SearchResultsList: React.FC<SearchResultsListProps> = ({
  media,
  settings,
  onDownloadSingle,
  onDownloadMultiple,
  onSelectFolder,
}) => {
  const allEntries = useMemo(() => media.entries || [], [media.entries]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    return new Set(allEntries.map((e) => e.id));
  });

  const [filterText, setFilterText] = useState<string>('');
  const [downloadType, setDownloadType] = useState<'video' | 'audio'>('video');
  const [quality, setQuality] = useState<string>(settings.defaultVideoQuality || '1080p');
  const [audioFormat, setAudioFormat] = useState<string>(settings.defaultAudioFormat || 'mp3');
  const [audioQuality, setAudioQuality] = useState<string>(settings.defaultAudioQuality || '320K');

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
  };

  const handleStartBulk = () => {
    const selectedList = allEntries.filter((e) => selectedIds.has(e.id));
    if (selectedList.length === 0) return;
    onDownloadMultiple(selectedList, {
      downloadType,
      quality,
      audioFormat,
      audioQuality,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="w-full glass-panel rounded-3xl p-4 md:p-6 space-y-4 border border-indigo-500/20 shadow-2xl relative overflow-hidden"
    >
      {/* Ambient glow */}
      <div className="absolute -top-20 -right-20 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-white/[0.08] relative">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0 shadow-lg shadow-indigo-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base md:text-lg font-extrabold text-slate-100 truncate flex items-center gap-2">
              <span>{media.title}</span>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-[11px] text-indigo-300 font-mono">
                {allEntries.length} video
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Tích chọn các video bạn muốn tải hoặc bấm tải nhanh từng video bên dưới.
            </p>
          </div>
        </div>

        {/* Global format selector */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-white/10 shrink-0">
            <button
              onClick={() => setDownloadType('video')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                downloadType === 'video'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Video MP4</span>
            </button>
            <button
              onClick={() => setDownloadType('audio')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                downloadType === 'audio'
                  ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              <span>Nhạc MP3</span>
            </button>
          </div>

          {downloadType === 'video' ? (
            <select
              value={quality}
              onChange={(e) => setQuality(e.target.value)}
              className="bg-slate-900 border border-white/10 text-slate-200 text-xs font-semibold rounded-xl py-2 px-3 focus:outline-none focus:border-indigo-500/50 cursor-pointer"
            >
              <option value="best">Cao nhất (4K / 1080p)</option>
              <option value="2160p">4K Ultra HD (2160p)</option>
              <option value="1440p">2K QHD (1440p)</option>
              <option value="1080p">1080p Full HD (Khuyên dùng)</option>
              <option value="720p">720p HD</option>
              <option value="480p">480p SD</option>
            </select>
          ) : (
            <div className="flex items-center gap-1.5">
              <select
                value={audioFormat}
                onChange={(e) => setAudioFormat(e.target.value)}
                className="bg-slate-900 border border-white/10 text-slate-200 text-xs font-semibold rounded-xl py-2 px-2.5 focus:outline-none focus:border-pink-500/50 cursor-pointer"
              >
                <option value="mp3">MP3</option>
                <option value="m4a">M4A (AAC)</option>
                <option value="flac">FLAC (Lossless)</option>
                <option value="wav">WAV</option>
              </select>
              <select
                value={audioQuality}
                onChange={(e) => setAudioQuality(e.target.value)}
                className="bg-slate-900 border border-white/10 text-slate-200 text-xs font-semibold rounded-xl py-2 px-2.5 focus:outline-none focus:border-pink-500/50 cursor-pointer"
              >
                <option value="320K">320 kbps</option>
                <option value="256K">256 kbps</option>
                <option value="192K">192 kbps</option>
                <option value="128K">128 kbps</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Control Bar: Search & Episode Range */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center text-xs">
        {/* Search within results */}
        <div className="md:col-span-6 relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Lọc tiêu đề hoặc kênh trong danh sách..."
            className="w-full glass-input pl-8 pr-3 py-2 rounded-xl text-xs"
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

      {/* Video Cards List */}
      <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1 custom-scrollbar">
        {filteredEntries.map((entry, idx) => {
          const isSelected = selectedIds.has(entry.id);
          return (
            <div
              key={entry.id || idx}
              className={`p-3 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                isSelected ? 'glass-card-active border-indigo-500/40 bg-indigo-950/20' : 'glass-card hover:border-white/15'
              }`}
            >
              {/* Checkbox + Thumbnail + Meta */}
              <div
                onClick={() => toggleSelect(entry.id)}
                className="flex items-center gap-3.5 min-w-0 flex-1 cursor-pointer"
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
                      <Video className="w-6 h-6" />
                    </div>
                  )}
                  {entry.duration && (
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.2 rounded bg-black/80 text-[10px] text-slate-200 font-mono font-semibold">
                      {Math.floor(entry.duration / 60)}:
                      {String(Math.floor(entry.duration % 60)).padStart(2, '0')}
                    </span>
                  )}
                </div>

                <div className="min-w-0 space-y-1">
                  <h3 className="text-xs md:text-sm font-bold text-slate-100 line-clamp-1 group-hover:text-indigo-300 transition-colors">
                    {entry.title}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
                    {entry.uploader && (
                      <span className="flex items-center gap-1 truncate max-w-xs">
                        <User className="w-3 h-3 text-indigo-400 shrink-0" />
                        <span className="truncate">{entry.uploader}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 1-Click Instant Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownloadSingle(entry, 'video', '1080p');
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/30 text-[11px] font-bold text-indigo-300 hover:text-white transition-all cursor-pointer shadow-sm"
                  title="Tải ngay video MP4 1080p của video này"
                >
                  <Video className="w-3 h-3" />
                  <span>1080p</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDownloadSingle(entry, 'audio', 'mp3', '320K');
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-pink-600/20 hover:bg-pink-600/40 border border-pink-500/30 text-[11px] font-bold text-pink-300 hover:text-white transition-all cursor-pointer shadow-sm"
                  title="Tách ngay nhạc MP3 320k của video này"
                >
                  <Music className="w-3 h-3" />
                  <span>MP3</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="pt-3 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-3">
        <button
          onClick={onSelectFolder}
          className="flex items-center gap-2 text-xs text-slate-400 hover:text-indigo-300 font-mono truncate max-w-xs cursor-pointer"
          title="Đổi thư mục lưu trữ"
        >
          <FolderOpen className="w-4 h-4 text-indigo-400 shrink-0" />
          <span className="truncate">{settings.defaultDownloadDir || 'Chọn nơi lưu'}</span>
        </button>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <span className="text-xs text-slate-400 font-medium">
            Đã chọn: <strong className="text-indigo-300">{selectedCount}</strong> / {allEntries.length} video
          </span>

          <button
            onClick={handleStartBulk}
            disabled={selectedCount === 0}
            className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xl cursor-pointer ${
              selectedCount === 0
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
                : 'bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 text-white shadow-indigo-500/30 hover:opacity-95'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>
              Tải {selectedCount} video ({downloadType === 'video' ? quality : audioFormat.toUpperCase()})
            </span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};
