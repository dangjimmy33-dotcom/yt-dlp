import React from "react";
import { DownloadTask } from "../types";
import {
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  FolderOpen,
  Play,
  RotateCcw,
  X,
  Music,
  Video,
  ExternalLink,
} from "lucide-react";
import { motion } from "framer-motion";

interface DownloadItemProps {
  task: DownloadTask;
  onCancel: (id: string) => void;
  onRetry: (task: DownloadTask) => void;
  onOpenFile: (path: string) => void;
  onOpenFolder: (path: string) => void;
}

export const DownloadItem: React.FC<DownloadItemProps> = ({
  task,
  onCancel,
  onRetry,
  onOpenFile,
  onOpenFolder,
}) => {
  const isCompleted = task.status === "completed";
  const isError = task.status === "error";
  const isDownloading = task.status === "downloading" || task.status === "merging";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      className="p-3.5 rounded-2xl glass-panel relative overflow-hidden space-y-3"
    >
      <div className="flex items-start gap-3.5">
        {/* Thumbnail or Type Icon */}
        <div className="relative w-20 aspect-video rounded-lg overflow-hidden bg-slate-900 shrink-0 border border-white/10 shadow">
          {task.thumbnail ? (
            <img src={task.thumbnail} alt={task.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-500">
              {task.type === "audio" ? <Music className="w-6 h-6" /> : <Video className="w-6 h-6" />}
            </div>
          )}
          <div className="absolute top-1 left-1 px-1 py-0.2 rounded bg-black/70 text-[9px] font-bold text-white uppercase">
            {task.quality}
          </div>
        </div>

        {/* Info & Metrics */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-bold text-slate-100 truncate" title={task.title}>
              {task.title}
            </h4>

            {/* Status Badge */}
            <div>
              {isCompleted && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3" /> Hoàn thành
                </span>
              )}
              {isError && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
                  <AlertCircle className="w-3 h-3" /> Lỗi
                </span>
              )}
              {isDownloading && (
                <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20 animate-pulse">
                  <Download className="w-3 h-3 animate-bounce" /> {task.percent.toFixed(1)}%
                </span>
              )}
            </div>
          </div>

          {/* Download metrics: Speed, ETA, Total size */}
          <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
            {isDownloading && (
              <>
                <span className="text-indigo-300 font-semibold">{task.speed}</span>
                <span>•</span>
                <span>ETA: {task.eta}</span>
                <span>•</span>
              </>
            )}
            <span>{task.totalSize || "Đang xử lý..."}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar with wave animation */}
      {isDownloading && (
        <div className="space-y-1">
          <div className="w-full h-2 rounded-full bg-slate-900/80 border border-white/[0.06] overflow-hidden">
            <motion.div
              className="h-full progress-wave rounded-full shadow-lg shadow-indigo-500/50"
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(100, Math.max(0, task.percent))}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      )}

      {/* Action Buttons Row */}
      <div className="flex items-center justify-between pt-1 border-t border-white/[0.04] text-xs">
        <span className="text-[11px] font-mono text-slate-400 truncate max-w-[240px]">
          {task.outputDir}
        </span>

        <div className="flex items-center gap-1.5">
          {isCompleted && (
            <>
              <button
                onClick={() => onOpenFolder(task.outputPath || task.outputDir)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/10 text-slate-300 hover:text-white transition-all text-[11px] font-semibold cursor-pointer"
                title="Mở thư mục chứa file"
              >
                <FolderOpen className="w-3.5 h-3.5 text-indigo-400" />
                <span>Mở thư mục</span>
              </button>
            </>
          )}

          {isError && (
            <button
              onClick={() => onRetry(task)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 transition-all text-[11px] font-semibold cursor-pointer"
              title="Thử tải lại"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Tải lại</span>
            </button>
          )}

          {isDownloading && (
            <button
              onClick={() => onCancel(task.id)}
              className="p-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-200 transition-all cursor-pointer"
              title="Hủy tải"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};
