import React, { useState } from "react";
import { EngineStatus } from "../types";
import {
  X,
  Cpu,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Download,
  Sparkles,
  Terminal,
  ExternalLink,
} from "lucide-react";
import { motion } from "framer-motion";

interface EngineStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  engineStatus: EngineStatus | null;
  onUpdateEngine: () => Promise<void>;
  isUpdating: boolean;
}

export const EngineStatusModal: React.FC<EngineStatusModalProps> = ({
  isOpen,
  onClose,
  engineStatus,
  onUpdateEngine,
  isUpdating,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-lg glass-panel rounded-3xl p-5 flex flex-col space-y-4 shadow-2xl border border-white/10"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Quản Lý Lõi Xử Lý (Engine)</h3>
              <p className="text-xs text-slate-400">Trạng thái yt-dlp & ffmpeg trên hệ thống</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Engine Cards */}
        <div className="space-y-3">
          {/* yt-dlp Status Card */}
          <div className="p-3.5 rounded-2xl glass-card space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-200">Lõi yt-dlp</span>
                {engineStatus?.ytdlp_available ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" /> Sẵn sàng
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    <AlertCircle className="w-3 h-3" /> Chưa tải về
                  </span>
                )}
              </div>
              <span className="text-[11px] font-mono text-indigo-300 font-semibold">
                {engineStatus?.ytdlp_version || "Không xác định"}
              </span>
            </div>

            <div className="text-[11px] font-mono text-slate-400 bg-slate-950/60 p-2 rounded-xl border border-white/[0.04] truncate">
              {engineStatus?.ytdlp_path || "Chưa có đường dẫn"}
            </div>
          </div>

          {/* FFmpeg Status Card */}
          <div className="p-3.5 rounded-2xl glass-card space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-200">Bộ Giải Mã FFmpeg</span>
                {engineStatus?.ffmpeg_available ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" /> Sẵn sàng
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    <AlertCircle className="w-3 h-3" /> Tùy chọn (đã tích hợp)
                  </span>
                )}
              </div>
            </div>

            <div className="text-[11px] font-mono text-slate-400 bg-slate-950/60 p-2 rounded-xl border border-white/[0.04] truncate">
              {engineStatus?.ffmpeg_path || "FFmpeg System Available"}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-400" /> Tự động cập nhật bản mới nhất
          </span>

          <button
            onClick={onUpdateEngine}
            disabled={isUpdating}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold glass-button-primary cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? "animate-spin" : ""}`} />
            <span>{isUpdating ? "Đang cập nhật..." : "Cập Nhật yt-dlp"}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
