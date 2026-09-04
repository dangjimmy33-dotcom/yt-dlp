import React, { useState } from "react";
import { MediaInfo, PlaylistEntry } from "../types";
import {
  X,
  CheckSquare,
  Square,
  Layers,
  Search,
  Download,
  Clock,
  Video,
  Music,
  SlidersHorizontal,
} from "lucide-react";
import { motion } from "framer-motion";

export interface PlaylistDownloadOptions {
  downloadType: "video" | "audio";
  quality: string;
  audioFormat: string;
  audioQuality: string;
}

interface PlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  media: MediaInfo;
  onDownloadSelected: (entries: PlaylistEntry[], options?: PlaylistDownloadOptions) => void;
}

export const PlaylistModal: React.FC<PlaylistModalProps> = ({
  isOpen,
  onClose,
  media,
  onDownloadSelected,
}) => {
  const [entries, setEntries] = useState<PlaylistEntry[]>(
    (media.entries || []).map((e) => ({ ...e, selected: false }))
  );
  const [search, setSearch] = useState<string>("");
  const [fromEp, setFromEp] = useState<string>("1");
  const [toEp, setToEp] = useState<string>(String(media.entries?.length || 1));
  const [downloadType, setDownloadType] = useState<"video" | "audio">("video");
  const [quality, setQuality] = useState<string>("1080p");
  const [audioFormat, setAudioFormat] = useState<string>("mp3");
  const [audioQuality, setAudioQuality] = useState<string>("320K");

  if (!isOpen) return null;

  const filteredEntries = entries.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase())
  );

  const selectedCount = entries.filter((e) => e.selected).length;

  const toggleSelect = (id: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, selected: !e.selected } : e))
    );
  };

  const handleSelectAll = (select: boolean) => {
    setEntries((prev) => prev.map((e) => ({ ...e, selected: select })));
  };

  const handleApplyRange = () => {
    const start = Math.max(1, parseInt(fromEp, 10) || 1);
    const end = Math.min(entries.length, parseInt(toEp, 10) || entries.length);
    setEntries((prev) =>
      prev.map((e, idx) => {
        const epIndex = idx + 1;
        return {
          ...e,
          selected: epIndex >= start && epIndex <= end,
        };
      })
    );
  };

  const handleConfirm = () => {
    const selected = entries.filter((e) => e.selected);
    onDownloadSelected(selected, {
      downloadType,
      quality,
      audioFormat,
      audioQuality,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-3xl max-h-[90vh] glass-panel rounded-3xl p-5 md:p-6 flex flex-col space-y-4 shadow-2xl border border-indigo-500/25 relative overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0 shadow-lg shadow-indigo-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm md:text-base font-extrabold text-slate-100 truncate">
                {media.title}
              </h3>
              <p className="text-xs text-slate-400">
                Đã chọn <span className="text-indigo-300 font-bold">{selectedCount}</span> / {entries.length} video
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selection & Episode Range Bar */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-xs">
          {/* Format Selector */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-white/10 shrink-0">
              <button
                onClick={() => setDownloadType("video")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  downloadType === "video"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Video className="w-3 h-3" />
                <span>Video</span>
              </button>
              <button
                onClick={() => setDownloadType("audio")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  downloadType === "audio"
                    ? "bg-pink-600 text-white shadow-md"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Music className="w-3 h-3" />
                <span>Audio</span>
              </button>
            </div>

            {downloadType === "video" ? (
              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
                className="flex-1 bg-slate-900 border border-white/10 text-slate-200 font-semibold rounded-xl py-1.5 px-2.5 focus:outline-none focus:border-indigo-500/50"
              >
                <option value="best">Cao nhất (4K / 1080p)</option>
                <option value="1080p">1080p Full HD</option>
                <option value="720p">720p HD</option>
                <option value="480p">480p SD</option>
              </select>
            ) : (
              <div className="flex-1 flex gap-1.5">
                <select
                  value={audioFormat}
                  onChange={(e) => setAudioFormat(e.target.value)}
                  className="w-1/2 bg-slate-900 border border-white/10 text-slate-200 font-semibold rounded-xl py-1.5 px-2 focus:outline-none focus:border-pink-500/50"
                >
                  <option value="mp3">MP3</option>
                  <option value="m4a">M4A</option>
                  <option value="flac">FLAC</option>
                  <option value="wav">WAV</option>
                </select>
                <select
                  value={audioQuality}
                  onChange={(e) => setAudioQuality(e.target.value)}
                  className="w-1/2 bg-slate-900 border border-white/10 text-slate-200 font-semibold rounded-xl py-1.5 px-2 focus:outline-none focus:border-pink-500/50"
                >
                  <option value="320K">320k</option>
                  <option value="256K">256k</option>
                  <option value="192K">192k</option>
                  <option value="128K">128k</option>
                </select>
              </div>
            )}
          </div>

          {/* Episode Range Selector (e.g. for Conan / Anime) */}
          <div className="flex items-center gap-2 justify-between">
            <div className="flex items-center gap-1.5 text-slate-300">
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
              <span>Tập:</span>
              <input
                type="number"
                min={1}
                max={entries.length}
                value={fromEp}
                onChange={(e) => setFromEp(e.target.value)}
                className="w-12 bg-slate-900 border border-white/10 rounded-lg px-1.5 py-1 text-center font-mono text-xs focus:outline-none focus:border-indigo-500"
              />
              <span>đến</span>
              <input
                type="number"
                min={1}
                max={entries.length}
                value={toEp}
                onChange={(e) => setToEp(e.target.value)}
                className="w-12 bg-slate-900 border border-white/10 rounded-lg px-1.5 py-1 text-center font-mono text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              onClick={handleApplyRange}
              className="px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 font-bold transition-all cursor-pointer"
            >
              Chọn khoảng
            </button>
          </div>
        </div>

        {/* Search & Bulk Select Toolbar */}
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm tập / video trong playlist..."
              className="w-full glass-input pl-8 pr-3 py-1.5 rounded-xl text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSelectAll(true)}
              className="px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[11px] font-semibold text-slate-300 border border-white/[0.06] transition-all cursor-pointer"
            >
              Chọn tất cả
            </button>
            <button
              onClick={() => handleSelectAll(false)}
              className="px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[11px] font-semibold text-slate-300 border border-white/[0.06] transition-all cursor-pointer"
            >
              Bỏ chọn
            </button>
          </div>
        </div>

        {/* Video Entries List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[42vh]">
          {filteredEntries.map((entry, idx) => (
            <div
              key={entry.id || idx}
              onClick={() => toggleSelect(entry.id)}
              className={`p-2.5 rounded-xl cursor-pointer flex items-center justify-between gap-3 transition-all ${
                entry.selected ? "glass-card-active" : "glass-card"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs font-mono text-slate-400 w-6 text-center font-bold">
                  #{idx + 1}
                </span>

                {entry.thumbnail && (
                  <img
                    src={entry.thumbnail}
                    alt={entry.title}
                    className="w-16 aspect-video rounded-md object-cover bg-slate-900 shrink-0 border border-white/10"
                  />
                )}

                <div className="min-w-0 space-y-0.5">
                  <h4 className="text-xs font-semibold text-slate-200 truncate">{entry.title}</h4>
                  {entry.duration && (
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-indigo-400" />
                      {Math.floor(entry.duration / 60)}:
                      {String(Math.floor(entry.duration % 60)).padStart(2, "0")}
                    </span>
                  )}
                </div>
              </div>

              <div className="shrink-0 text-indigo-400">
                {entry.selected ? (
                  <CheckSquare className="w-4 h-4 text-indigo-400" />
                ) : (
                  <Square className="w-4 h-4 text-slate-600" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Action Footer */}
        <div className="pt-2 border-t border-white/[0.08] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white glass-button-secondary transition-all cursor-pointer"
          >
            Hủy
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedCount === 0}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer ${
              selectedCount === 0
                ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                : "bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 text-white shadow-indigo-500/30 hover:opacity-95"
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>
              Tải {selectedCount} video ({downloadType === "video" ? quality : audioFormat.toUpperCase()})
            </span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
