import React from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Minus, Square, X, AlertCircle, Cpu } from "lucide-react";
import { EngineStatus } from "../types";

interface TitleBarProps {
  engineStatus: EngineStatus | null;
  onOpenEngineModal: () => void;
  onOpenSettings: () => void;
}

const appWindow = getCurrentWindow();

export const TitleBar: React.FC<TitleBarProps> = ({
  engineStatus,
  onOpenEngineModal,
}) => {
  const handleMinimize = async () => {
    try {
      await appWindow.minimize();
    } catch (e) {
      console.error("Minimize error:", e);
    }
  };

  const handleMaximize = async () => {
    try {
      await appWindow.toggleMaximize();
    } catch (e) {
      console.error("Maximize error:", e);
    }
  };

  const handleClose = async () => {
    try {
      await appWindow.close();
    } catch (e) {
      console.error("Close error:", e);
    }
  };

  return (
    <div
      data-tauri-drag-region
      className="titlebar-drag h-11 w-full flex items-center px-3 bg-slate-950/85 backdrop-blur-xl border-b border-white/[0.08] select-none z-50 fixed top-0 left-0 right-0 cursor-default"
    >
      {/* Brand & Title - explicitly marked because Tauri drag-region is not inherited. */}
      <div data-tauri-drag-region className="titlebar-drag flex items-center gap-2.5 shrink-0">
        <img
          data-tauri-drag-region
          src="/logo.png"
          alt="yt-dlp logo"
          className="titlebar-drag w-6 h-6 rounded-lg object-contain shadow-lg shadow-indigo-500/20 pointer-events-none"
        />
        <div data-tauri-drag-region className="titlebar-drag flex items-center gap-2 pointer-events-none">
          <span data-tauri-drag-region className="titlebar-drag text-xs font-bold tracking-wider bg-gradient-to-r from-red-400 via-pink-300 to-indigo-300 bg-clip-text text-transparent">
            YT-DLP <span data-tauri-drag-region className="titlebar-drag text-indigo-400 font-extrabold">STUDIO</span>
          </span>
          <span data-tauri-drag-region className="titlebar-drag text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-300 font-medium">
            GUI v1.0
          </span>
        </div>
      </div>

      {/* A real draggable spacer prevents interactive children from eating the titlebar area. */}
      <div data-tauri-drag-region className="titlebar-drag h-full flex-1 min-w-4" />

      {/* Engine Status indicator badge */}
      <div data-tauri-no-drag className="titlebar-no-drag flex items-center gap-3 shrink-0">
        <button
          data-tauri-no-drag
          onClick={onOpenEngineModal}
          className="titlebar-no-drag flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] cursor-pointer"
          title="Engine Status (yt-dlp & ffmpeg)"
        >
          <Cpu className="w-3.5 h-3.5 text-indigo-400 pointer-events-none" />
          {engineStatus === null ? (
            <span className="text-slate-300 pointer-events-none">Engine</span>
          ) : engineStatus.ytdlp_available && engineStatus.ffmpeg_available ? (
            <span className="flex items-center gap-1 text-emerald-400 pointer-events-none">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Engine Ready
            </span>
          ) : (
            <span className="flex items-center gap-1 text-amber-400 pointer-events-none">
              <AlertCircle className="w-3 h-3 text-amber-400" />
              Setup Engine
            </span>
          )}
        </button>
      </div>

      <div data-tauri-drag-region className="titlebar-drag h-full w-3 shrink-0" />

      {/* Windows Window Controls */}
      <div data-tauri-no-drag className="titlebar-no-drag flex items-center gap-1 shrink-0">
        <button
          data-tauri-no-drag
          onClick={handleMinimize}
          className="titlebar-no-drag w-7 h-7 flex items-center justify-center rounded-md hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          title="Minimize"
        >
          <Minus className="w-3.5 h-3.5 pointer-events-none" />
        </button>
        <button
          data-tauri-no-drag
          onClick={handleMaximize}
          className="titlebar-no-drag w-7 h-7 flex items-center justify-center rounded-md hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
          title="Maximize"
        >
          <Square className="w-3 h-3 pointer-events-none" />
        </button>
        <button
          data-tauri-no-drag
          onClick={handleClose}
          className="titlebar-no-drag w-7 h-7 flex items-center justify-center rounded-md hover:bg-rose-500/90 text-slate-400 hover:text-white transition-colors cursor-pointer"
          title="Close"
        >
          <X className="w-3.5 h-3.5 pointer-events-none" />
        </button>
      </div>
    </div>
  );
};
