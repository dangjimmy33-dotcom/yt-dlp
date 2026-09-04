import React, { useState, useEffect } from "react";
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
  FolderOpen,
  Check,
  RotateCcw,
  Sliders,
  FileCode,
} from "lucide-react";
import { motion } from "framer-motion";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";

interface EngineStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  engineStatus: EngineStatus | null;
  onUpdateEngine: () => Promise<void>;
  onInstallFfmpeg: () => Promise<void>;
  isUpdating: boolean;
  isInstallingFfmpeg: boolean;
  onRefreshStatus?: () => Promise<EngineStatus | void>;
}

export const EngineStatusModal: React.FC<EngineStatusModalProps> = ({
  isOpen,
  onClose,
  engineStatus,
  onUpdateEngine,
  onInstallFfmpeg,
  isUpdating,
  isInstallingFfmpeg,
  onRefreshStatus,
}) => {
  const [customYtdlp, setCustomYtdlp] = useState<string>("");
  const [isSavingCustom, setIsSavingCustom] = useState<boolean>(false);

  useEffect(() => {
    if (engineStatus?.custom_ytdlp_path) {
      setCustomYtdlp(engineStatus.custom_ytdlp_path);
    } else {
      setCustomYtdlp("");
    }
  }, [engineStatus]);

  if (!isOpen) return null;

  const ready = !!engineStatus?.ytdlp_available && !!engineStatus?.ffmpeg_available;

  const handleBrowseYtdlp = async () => {
    try {
      const selected = await openDialog({
        multiple: false,
        filters: [{ name: "yt-dlp Executable", extensions: ["exe"] }],
      });
      if (selected && typeof selected === "string") {
        setCustomYtdlp(selected);
      }
    } catch (e) {
      console.error("Browse failed:", e);
    }
  };

  const handleSaveCustomEngine = async (pathToSet?: string) => {
    const targetPath = (pathToSet !== undefined ? pathToSet : customYtdlp).trim();
    setIsSavingCustom(true);
    try {
      await invoke("set_custom_engine_path", {
        customYtdlp: targetPath || null,
        customFfmpeg: null,
      });
      if (onRefreshStatus) {
        await onRefreshStatus();
      }
      toast.success(targetPath ? `Đã kích hoạt engine: ${targetPath}` : "Đã đặt lại engine mặc định.");
    } catch (err: any) {
      toast.error(`Không thể lưu cấu hình engine: ${err}`);
    } finally {
      setIsSavingCustom(false);
    }
  };

  const detectedPaths = engineStatus?.detected_ytdlp_paths || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-xl glass-panel rounded-3xl p-5 flex flex-col space-y-4 shadow-2xl border border-white/10 max-h-[90vh] overflow-y-auto"
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
          {/* Active yt-dlp */}
          <div className="p-3.5 rounded-2xl glass-card space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-bold text-slate-200">yt-dlp (Đang kích hoạt)</span>
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
            <div className="text-[10px] font-mono text-slate-300 bg-slate-950/70 p-2.5 rounded-xl border border-white/[0.06] break-all select-all" title={engineStatus?.ytdlp_path || ""}>
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

          {/* Custom Engine Selection */}
          <div className="p-3.5 rounded-2xl glass-card space-y-3 border border-indigo-500/20">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                Tùy chỉnh đường dẫn yt-dlp (VD: E:\Programs\yt-dlp.exe)
              </span>
              {engineStatus?.custom_ytdlp_path && (
                <span className="text-[10px] text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-md font-semibold">
                  Đang dùng tùy chỉnh
                </span>
              )}
            </div>

            {/* Input & Browse */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={customYtdlp}
                onChange={(e) => setCustomYtdlp(e.target.value)}
                placeholder="Nhập hoặc duyệt file yt-dlp.exe trên máy..."
                className="flex-1 bg-slate-950/60 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleBrowseYtdlp}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/10 border border-white/10 text-xs text-slate-200 font-semibold transition-all cursor-pointer shrink-0"
              >
                <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
                <span>Chọn file</span>
              </button>
            </div>

            {/* Quick detected paths */}
            {detectedPaths.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <FileCode className="w-3 h-3 text-emerald-400" /> Phát hiện file engine có sẵn trên máy:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {detectedPaths.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => {
                        setCustomYtdlp(p);
                        void handleSaveCustomEngine(p);
                      }}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[11px] font-mono transition-all cursor-pointer"
                      title={`Bấm để kích hoạt ngay ${p}`}
                    >
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span>{p}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Save & Reset actions */}
            <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/[0.04]">
              {engineStatus?.custom_ytdlp_path && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomYtdlp("");
                    void handleSaveCustomEngine("");
                  }}
                  disabled={isSavingCustom}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] text-xs text-slate-400 hover:text-slate-200 transition-all cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Dùng mặc định</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => handleSaveCustomEngine()}
                disabled={isSavingCustom}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSavingCustom ? "Đang lưu..." : "Áp dụng đường dẫn này"}</span>
              </button>
            </div>
          </div>

          {/* FFmpeg status */}
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
            <Sparkles className="w-3 h-3 text-indigo-400" /> Tự động nhận diện engine cài sẵn và hỗ trợ đường dẫn tùy chỉnh.
          </span>
          <Download className="w-3.5 h-3.5 text-slate-500" />
        </div>
      </motion.div>
    </div>
  );
};
