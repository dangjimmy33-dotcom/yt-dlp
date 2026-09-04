import React from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Minus, Square, X, AlertCircle, Cpu } from "lucide-react";
import { EngineStatus } from "../types";

interface TitleBarProps {
  engineStatus: EngineStatus | null;
  onOpenEngineModal: () => void;
  onOpenSettings: () => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({
  engineStatus,
  onOpenEngineModal,
}) => {
  const appWindow = typeof window !== "undefined" ? getCurrentWindow() : null;

  const handleMinimize = async () => {
    try {
      await appWindow?.minimize();
    } catch (e) {
      console.error(e);
    }
  };

  const handleMaximize = async () => {
    try {
      await appWindow?.toggleMaximize();
    } catch (e) {
      console.error(e);
    }
  };

  const handleClose = async () => {
    try {
      await appWindow?.close();
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartDrag = async (e: React.MouseEvent) => {
    if (e.buttons === 1) {
      const target = e.target as HTMLElement;
      if (!target.closest("button") && !target.closest("input") && !target.closest("select")) {
        try {
          await appWindow?.startDragging();
        } catch (err) {
          console.error("Dragging error:", err);
        }
      }
    }
  };

  return (
    <div
      data-tauri-drag-region
      onMouseDown={handleStartDrag}
      className="h-11 w-full flex items-center justify-between px-3 bg-slate-950/85 backdrop-blur-xl border-b border-white/[0.08] select-none z-50 fixed top-0 left-0 right-0 cursor-default"
    >
      {/* Brand & Title */}
      <div data-tauri-drag-region className="flex items-center gap-2.5">
        <img
          src="/logo.png"
          alt="yt-dlp logo"
          className="w-6 h-6 rounded-lg object-contain shadow-lg shadow-indigo-500/20 pointer-events-none"
        />
        <div data-tauri-drag-region className="flex items-center gap-2 pointer-events-none">
          <span className="text-xs font-bold tracking-wider bg-gradient-to-r from-red-400 via-pink-300 to-indigo-300 bg-clip-text text-transparent">
            YT-DLP <span className="text-indigo-400 font-extrabold">STUDIO</span>
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-300 font-medium">
            GUI v1.0
          </span>
        </div>
      </div>

      {/* Engine Status indicator badge */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenEngineModal}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] cursor-pointer"
          title="Engine Status (yt-dlp & ffmpeg)"
        >
          <Cpu className="w-3.5 h-3.5 text-indigo-400" />
          {engineStatus?.ytdlp_available ? (
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Engine Ready
            </span>
          ) : (
            <span className="flex items-center gap-1 text-amber-400">
              <AlertCircle className="w-3 h-3 text-amber-400" />
              Setup Engine
            </span>
          )}
        </button>
      </div>

      {/* Windows Window Controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={handleMinimize}
          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          title="Minimize"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleMaximize}
          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          title="Maximize"
        >
          <Square className="w-3 h-3" />
        </button>
        <button
          onClick={handleClose}
          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-rose-500/90 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Close"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
