import React, { useState } from "react";
import { DownloadTask } from "../types";
import { DownloadItem } from "./DownloadItem";
import { SpeedGraph } from "./SpeedGraph";
import { Trash2, Inbox, Sparkles, Filter, CheckCircle2, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface DownloadQueueProps {
  tasks: DownloadTask[];
  onCancel: (id: string) => void;
  onRetry: (task: DownloadTask) => void;
  onOpenFile: (path: string) => void;
  onOpenFolder: (path: string) => void;
  onClearCompleted: () => void;
  speedData: { time: string; speed: number }[];
  currentSpeed: string;
}

export const DownloadQueue: React.FC<DownloadQueueProps> = ({
  tasks,
  onCancel,
  onRetry,
  onOpenFile,
  onOpenFolder,
  onClearCompleted,
  speedData,
  currentSpeed,
}) => {
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

  const activeTasks = tasks.filter((t) => t.status === "downloading" || t.status === "merging" || t.status === "queued");
  const completedTasks = tasks.filter((t) => t.status === "completed");

  const filteredTasks = tasks.filter((t) => {
    if (filter === "active") return t.status === "downloading" || t.status === "merging" || t.status === "queued";
    if (filter === "completed") return t.status === "completed";
    return true;
  });

  const isDownloadingAny = activeTasks.length > 0;

  return (
    <div className="w-full space-y-4">
      {/* Real-time speed graph if any download active */}
      {isDownloadingAny && (
        <SpeedGraph data={speedData} currentSpeed={currentSpeed} />
      )}

      {/* Header with Filter Pills and Clear Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/50 border border-white/[0.06]">
          {[
            { id: "all", label: `Tất cả (${tasks.length})` },
            { id: "active", label: `Đang tải (${activeTasks.length})` },
            { id: "completed", label: `Hoàn thành (${completedTasks.length})` },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id as any)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filter === item.id
                  ? "bg-indigo-600/80 text-white shadow-md shadow-indigo-500/30"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Clear Completed */}
        {completedTasks.length > 0 && (
          <button
            onClick={onClearCompleted}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white border border-white/[0.06] text-xs font-semibold transition-all cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Xóa danh sách hoàn thành</span>
          </button>
        )}
      </div>

      {/* Queue items list */}
      <div className="space-y-2.5">
        <AnimatePresence mode="popLayout">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => (
              <DownloadItem
                key={task.id}
                task={task}
                onCancel={onCancel}
                onRetry={onRetry}
                onOpenFile={onOpenFile}
                onOpenFolder={onOpenFolder}
              />
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full glass-panel rounded-2xl p-10 flex flex-col items-center justify-center text-center space-y-3"
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Inbox className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-200">Chưa có tiến trình tải nào</h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Dán liên kết video hoặc playlist vào ô bên trên để bắt đầu tải về ngay.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
