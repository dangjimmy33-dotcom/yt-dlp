import React, { useState } from "react";
import { MediaInfo, PlaylistEntry } from "../types";
import { X, CheckSquare, Square, Layers, Search, Download, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface PlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  media: MediaInfo;
  onDownloadSelected: (entries: PlaylistEntry[]) => void;
}

export const PlaylistModal: React.FC<PlaylistModalProps> = ({
  isOpen,
  onClose,
  media,
  onDownloadSelected,
}) => {
  const [entries, setEntries] = useState<PlaylistEntry[]>(
    (media.entries || []).map((e) => ({ ...e, selected: true }))
  );
  const [search, setSearch] = useState<string>("");

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

  const handleConfirm = () => {
    const selected = entries.filter((e) => e.selected);
    onDownloadSelected(selected);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-2xl max-h-[85vh] glass-panel rounded-3xl p-5 flex flex-col space-y-4 shadow-2xl border border-white/10"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 line-clamp-1">{media.title}</h3>
              <p className="text-xs text-slate-400">
                Đã chọn {selectedCount}/{entries.length} video
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Bulk Select Toolbar */}
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm video trong playlist..."
              className="w-full glass-input pl-8 pr-3 py-1.5 rounded-xl text-xs"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSelectAll(true)}
              className="px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[11px] font-semibold text-slate-300 border border-white/[0.06] transition-all"
            >
              Chọn tất cả
            </button>
            <button
              onClick={() => handleSelectAll(false)}
              className="px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[11px] font-semibold text-slate-300 border border-white/[0.06] transition-all"
            >
              Bỏ chọn
            </button>
          </div>
        </div>

        {/* Video Entries List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[45vh]">
          {filteredEntries.map((entry, idx) => (
            <div
              key={entry.id || idx}
              onClick={() => toggleSelect(entry.id)}
              className={`p-2.5 rounded-xl cursor-pointer flex items-center justify-between gap-3 transition-all ${
                entry.selected ? "glass-card-active" : "glass-card"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs font-mono text-slate-500 w-5 text-center">
                  {idx + 1}
                </span>

                {entry.thumbnail && (
                  <img
                    src={entry.thumbnail}
                    alt={entry.title}
                    className="w-14 aspect-video rounded-md object-cover bg-slate-900 shrink-0 border border-white/10"
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
                {entry.selected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-600" />}
              </div>
            </div>
          ))}
        </div>

        {/* Action Footer */}
        <div className="pt-2 border-t border-white/[0.08] flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white glass-button-secondary transition-all"
          >
            Hủy
          </button>
          <button
            onClick={handleConfirm}
            disabled={selectedCount === 0}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              selectedCount === 0
                ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                : "glass-button-primary cursor-pointer"
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Tải {selectedCount} video đã chọn</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
