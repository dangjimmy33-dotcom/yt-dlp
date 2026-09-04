import React from "react";
import { EngineStatus } from "../types";
import {
  X,
  Cpu,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Download,
  Sparkles,
  HardDriveDownload,
} from "lucide-react";
import { motion } from "framer-motion";

interface EngineStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  engineStatus: EngineStatus | null;
  onUpdateEngine: () => Promise<void>;
  onInstallFfmpeg: () => Promise<void>;
  isUpdating: boolean;
  isInstallingFfmpeg: boolean;
}

export const EngineStatusModal: React.FC<EngineStatusModalProps> = ({
  isOpen,
  onClose,
  engineStatus,
  onUpdateEngine,
  onInstallFfmpeg,
  isUpdating,
  isInstallingFfmpeg,
}) => {
  if (!isOpen) return null;

  const ready = !!engineStatus?.ytdlp_available && !!engineStatus?.ffmpeg_available;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-xl glass-panel rounded-3xl p-5 flex flex-col space-y-4 shadow-2xl border border-white/10"
      >
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">Engine & Dependencies</h3>
              <p className="text-xs text-slate-400">yt-dlp tải media • FFmpeg ghép video/audio và hậu kỳ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div
          className={`rounded-2xl px-3.5 py-3 border text-xs flex items-start gap-2.5 ${
            ready
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-200"
              : "bg-amber-500/10 border-amber-500/20 text-amber-100"
          }`}
        >
          {ready ? (
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-amber-400" />
          )}
          <div>
            <div className="font-bold">{ready ? "Engine đã sẵn sàng" : "Cần hoàn tất dependency trước khi tải"}</div>
            <div className="text-[11px] opacity-80 mt-0.5">
              FFmpeg là dependency bắt buộc cho 1080p/2K/4K khi video và audio tách stream, tách MP3, cắt đoạn, SponsorBlock và nhiều bước hậu kỳ.
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="p-3.5 rounded-2xl glass-card space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-bold text-slate-200">yt-dlp</span>
                {engineStatus === null ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-slate-300 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Đang kiểm tra
                  </span>
                ) : engineStatus.ytdlp_available ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" /> Sẵn sàng
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-rose-300 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                    <AlertCircle className="w-3 h-3" /> Thiếu
                  </span>
                )}
              </div>
              <span className="text-[10px] font-mono text-indigo-300 truncate max-w-[180px]">
                {engineStatus?.ytdlp_version || "-"}
              </span>
            </div>
            <div className="text-[10px] font-mono text-slate-400 bg-slate-950/60 p-2 rounded-xl border border-white/[0.04] truncate" title={engineStatus?.ytdlp_path || ""}>
              {engineStatus?.ytdlp_path || "Chưa xác định đường dẫn"}
            </div>
            <div className="flex justify-end">
              <button
                onClick={onUpdateEngine}
                disabled={isUpdating}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold glass-button-primary cursor-pointer disabled:opacity-60"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? "animate-spin" : ""}`} />
                <span>{isUpdating ? "Đang tải..." : engineStatus?.ytdlp_available ? "Cập nhật yt-dlp" : "Cài yt-dlp"}</span>
              </button>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl glass-card space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-bold text-slate-200">FFmpeg + ffprobe</span>
                {engineStatus === null ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-slate-300 bg-white/5 px-2 py-0.5 rounded-full border border-white/10">
                    <RefreshCw className="w-3 h-3 animate-spin" /> Đang kiểm tra
                  </span>
                ) : engineStatus.ffmpeg_available ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" /> Sẵn sàng
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-rose-300 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                    <AlertCircle className="w-3 h-3" /> Bắt buộc
                  </span>
                )}
              </div>
              <span className="text-[10px] font-mono text-purple-300 truncate max-w-[180px]">
                {engineStatus?.ffmpeg_version || "-"}
              </span>
            </div>
            <div className="text-[10px] font-mono text-slate-400 bg-slate-950/60 p-2 rounded-xl border border-white/[0.04] truncate" title={engineStatus?.ffmpeg_path || ""}>
              {engineStatus?.ffmpeg_path || "Chưa cài FFmpeg"}
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-[10px] text-slate-500">Bản Windows được tải từ yt-dlp/FFmpeg-Builds (~160 MB).</span>
              <button
                onClick={onInstallFfmpeg}
                disabled={isInstallingFfmpeg}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-200 cursor-pointer disabled:opacity-60"
              >
                {isInstallingFfmpeg ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <HardDriveDownload className="w-3.5 h-3.5" />}
                <span>{isInstallingFfmpeg ? "Đang cài..." : engineStatus?.ffmpeg_available ? "Cài lại FFmpeg" : "Cài FFmpeg"}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-400" /> Engine nằm trong AppData, không cần thêm PATH thủ công.
          </span>
          <Download className="w-3.5 h-3.5 text-slate-500" />
        </div>
      </motion.div>
    </div>
  );
};
