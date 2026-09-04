import React, { useState, useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

import {
  MediaInfo,
  DownloadRequest,
  DownloadTask,
  DownloadProgressEvent,
  AppSettings,
  EngineStatus,
  PlaylistEntry,
} from "./types";

import { TitleBar } from "./components/TitleBar";
import { UrlInputBox } from "./components/UrlInputBox";
import { MediaPreviewCard } from "./components/MediaPreviewCard";
import { FormatSelector } from "./components/FormatSelector";
import { DownloadQueue } from "./components/DownloadQueue";
import { PlaylistModal } from "./components/PlaylistModal";
import { SettingsModal } from "./components/SettingsModal";
import { EngineStatusModal } from "./components/EngineStatusModal";

import {
  Download,
  Home,
  ListOrdered,
  Settings,
  Cpu,
  Sparkles,
  Zap,
} from "lucide-react";

export default function App() {
  const [activeNav, setActiveNav] = useState<"home" | "downloads">("home");
  const [url, setUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [mediaInfo, setMediaInfo] = useState<MediaInfo | null>(null);

  const [tasks, setTasks] = useState<DownloadTask[]>(() => {
    try {
      const saved = localStorage.getItem("flowdl_tasks");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem("flowdl_settings");
      return saved
        ? JSON.parse(saved)
        : {
            defaultDownloadDir: "",
            maxConcurrentDownloads: 3,
            defaultVideoQuality: "1080p",
            defaultAudioFormat: "mp3",
            defaultAudioQuality: "320K",
            embedMetadata: true,
            embedThumbnail: true,
            embedSubtitles: false,
            sponsorBlock: false,
            cookiesBrowser: "none",
            speedLimit: "",
            theme: "dark",
            notifications: true,
          };
    } catch {
      return {
        defaultDownloadDir: "",
        maxConcurrentDownloads: 3,
        defaultVideoQuality: "1080p",
        defaultAudioFormat: "mp3",
        defaultAudioQuality: "320K",
        embedMetadata: true,
        embedThumbnail: true,
        embedSubtitles: false,
        sponsorBlock: false,
        cookiesBrowser: "none",
        speedLimit: "",
        theme: "dark",
        notifications: true,
      };
    }
  });

  const [engineStatus, setEngineStatus] = useState<EngineStatus | null>(null);
  const [isUpdatingEngine, setIsUpdatingEngine] = useState<boolean>(false);

  // Modals
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isEngineModalOpen, setIsEngineModalOpen] = useState<boolean>(false);

  // Speed data for real-time graph
  const [speedData, setSpeedData] = useState<{ time: string; speed: number }[]>([]);
  const [currentSpeedStr, setCurrentSpeedStr] = useState<string>("0 MB/s");

  // Save tasks and settings to local storage
  useEffect(() => {
    try {
      localStorage.setItem("flowdl_tasks", JSON.stringify(tasks));
    } catch {}
  }, [tasks]);

  useEffect(() => {
    try {
      localStorage.setItem("flowdl_settings", JSON.stringify(settings));
    } catch {}
  }, [settings]);

  // Initial load: Fetch Engine Status & Default Download Dir
  useEffect(() => {
    const initApp = async () => {
      try {
        const status = await invoke<EngineStatus>("get_engine_status");
        setEngineStatus(status);
      } catch (e) {
        console.error("Failed to fetch engine status:", e);
      }

      if (!settings.defaultDownloadDir) {
        try {
          const defaultDir = await invoke<string>("get_default_download_dir");
          if (defaultDir) {
            setSettings((prev) => ({ ...prev, defaultDownloadDir: defaultDir }));
          }
        } catch (e) {
          console.error("Failed to get default download dir:", e);
        }
      }
    };

    initApp();
  }, []);

  // Listen for real-time download progress events
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const setupListener = async () => {
      try {
        unlisten = await listen<DownloadProgressEvent>("download-progress", (event) => {
          const payload = event.payload;

          setTasks((prev) =>
            prev.map((t) => {
              if (t.id === payload.task_id) {
                const isFinished = payload.status === "completed";
                const isError = payload.status === "error";

                if (isFinished && t.status !== "completed") {
                  toast.success(`Đã tải xong: ${t.title}`);
                  confetti({
                    particleCount: 80,
                    spread: 70,
                    origin: { y: 0.8 },
                  });
                } else if (isError && t.status !== "error") {
                  toast.error(`Lỗi tải file: ${t.title}`);
                }

                return {
                  ...t,
                  percent: payload.percent,
                  speed: payload.speed,
                  eta: payload.eta,
                  totalSize: payload.total_size,
                  status: payload.status,
                  errorMessage: payload.error_message || t.errorMessage,
                  outputPath: payload.output_path || t.outputPath,
                  completedAt: isFinished ? Date.now() : t.completedAt,
                };
              }
              return t;
            })
          );

          // Update speed graph
          if (payload.status === "downloading") {
            const rawSpeed = payload.speed || "0";
            let speedMB = 0;
            if (rawSpeed.includes("MiB/s") || rawSpeed.includes("MB/s")) {
              speedMB = parseFloat(rawSpeed);
            } else if (rawSpeed.includes("KiB/s") || rawSpeed.includes("KB/s")) {
              speedMB = parseFloat(rawSpeed) / 1024;
            } else if (rawSpeed.includes("GiB/s") || rawSpeed.includes("GB/s")) {
              speedMB = parseFloat(rawSpeed) * 1024;
            }

            setCurrentSpeedStr(rawSpeed);
            setSpeedData((prev) => [
              ...prev.slice(-20),
              { time: new Date().toLocaleTimeString(), speed: speedMB },
            ]);
          }
        });
      } catch (e) {
        console.error("Failed to listen to download-progress events:", e);
      }
    };

    setupListener();

    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  // Analyze media URL
  const handleAnalyze = async (urlToAnalyze?: string) => {
    const targetUrl = (urlToAnalyze || url).trim();
    if (!targetUrl) return;

    setIsLoading(true);
    try {
      const result = await invoke<MediaInfo>("fetch_media_info", {
        url: targetUrl,
        cookiesBrowser: settings.cookiesBrowser,
      });

      setMediaInfo(result);
      toast.success(`Đã phân tích: ${result.title}`);
    } catch (err: any) {
      toast.error(typeof err === "string" ? err : "Không thể phân tích đường link này.");
    } finally {
      setIsLoading(false);
    }
  };

  // Start Download
  const handleStartDownload = async (req: DownloadRequest) => {
    // Add to task list immediately
    const newTask: DownloadTask = {
      id: req.id,
      url: req.url,
      title: req.title,
      thumbnail: mediaInfo?.thumbnail || "",
      type: req.download_type as any,
      quality: req.quality,
      outputDir: req.output_dir,
      percent: 0,
      speed: "0 B/s",
      eta: "--:--",
      totalSize: "Đang khởi tạo...",
      status: "downloading",
      createdAt: Date.now(),
    };

    setTasks((prev) => [newTask, ...prev]);
    setActiveNav("downloads");
    toast.info(`Bắt đầu tải: ${req.title}`);

    try {
      await invoke("start_download", { req });
    } catch (err: any) {
      toast.error(typeof err === "string" ? err : "Lỗi khi khởi chạy tiến trình tải");
    }
  };

  // Batch download playlist items
  const handleDownloadPlaylistSelected = (entries: PlaylistEntry[]) => {
    entries.forEach((entry, idx) => {
      setTimeout(() => {
        const req: DownloadRequest = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          url: entry.url,
          title: entry.title,
          download_type: "video",
          quality: settings.defaultVideoQuality || "1080p",
          output_dir: settings.defaultDownloadDir,
          embed_subtitles: settings.embedSubtitles,
          embed_thumbnail: settings.embedThumbnail,
          embed_metadata: settings.embedMetadata,
          sponsorblock: settings.sponsorBlock,
          cookies_browser: settings.cookiesBrowser,
        };
        handleStartDownload(req);
      }, idx * 600);
    });

    toast.success(`Đã thêm ${entries.length} video vào hàng đợi tải!`);
  };

  // Cancel task
  const handleCancelDownload = async (id: string) => {
    try {
      await invoke("cancel_download", { taskId: id });
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: "cancelled" } : t))
      );
      toast.info("Đã hủy tải video");
    } catch (err) {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, status: "cancelled" } : t))
      );
    }
  };

  // Retry task
  const handleRetry = (task: DownloadTask) => {
    const req: DownloadRequest = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      url: task.url,
      title: task.title,
      download_type: task.type,
      quality: task.quality,
      output_dir: task.outputDir,
      embed_subtitles: settings.embedSubtitles,
      embed_thumbnail: settings.embedThumbnail,
      embed_metadata: settings.embedMetadata,
      sponsorblock: settings.sponsorBlock,
      cookies_browser: settings.cookiesBrowser,
    };
    handleStartDownload(req);
  };

  // Open file / folder
  const handleOpenFolder = async (path: string) => {
    try {
      await invoke("open_in_folder", { path });
    } catch (e) {
      toast.error("Không thể mở thư mục");
    }
  };

  const handleOpenFile = async (path: string) => {
    try {
      await invoke("open_file", { path });
    } catch (e) {
      toast.error("Không thể mở file");
    }
  };

  // Folder picker dialog
  const handleSelectFolder = async () => {
    try {
      const selected = await openDialog({
        directory: true,
        multiple: false,
        defaultPath: settings.defaultDownloadDir,
      });

      if (selected && typeof selected === "string") {
        setSettings((prev) => ({ ...prev, defaultDownloadDir: selected }));
        toast.success(`Đã chọn thư mục: ${selected}`);
      }
    } catch (e) {
      console.error("Folder picker error:", e);
    }
  };

  // Update engine
  const handleUpdateEngine = async () => {
    setIsUpdatingEngine(true);
    toast.loading("Đang tải & cập nhật lõi yt-dlp mới nhất...");
    try {
      await invoke("update_engine");
      const status = await invoke<EngineStatus>("get_engine_status");
      setEngineStatus(status);
      toast.dismiss();
      toast.success("Đã cập nhật lõi yt-dlp thành công!");
    } catch (err: any) {
      toast.dismiss();
      toast.error(typeof err === "string" ? err : "Cập nhật yt-dlp thất bại.");
    } finally {
      setIsUpdatingEngine(false);
    }
  };

  const activeTaskCount = tasks.filter(
    (t) => t.status === "downloading" || t.status === "merging" || t.status === "queued"
  ).length;

  return (
    <div className="relative min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col pt-11 overflow-hidden select-none">
      {/* Background Animated Neon Mesh Spheres */}
      <div className="mesh-glow w-[500px] h-[500px] bg-indigo-600/25 top-[-100px] left-[-100px]" />
      <div className="mesh-glow w-[600px] h-[600px] bg-purple-600/20 bottom-[-150px] right-[-150px]" />
      <div className="mesh-glow w-[400px] h-[400px] bg-pink-600/15 top-[30%] right-[10%]" />

      {/* Custom Window TitleBar */}
      <TitleBar
        engineStatus={engineStatus}
        onOpenEngineModal={() => setIsEngineModalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main App Layout */}
      <div className="flex-1 flex flex-col max-w-6xl w-full mx-auto p-4 md:p-6 space-y-5 z-10 overflow-y-auto">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between gap-3 p-1.5 rounded-2xl glass-panel">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveNav("home")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeNav === "home"
                  ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30"
                  : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Tải Mới</span>
            </button>

            <button
              onClick={() => setActiveNav("downloads")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
                activeNav === "downloads"
                  ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30"
                  : "text-slate-400 hover:text-white hover:bg-white/[0.04]"
              }`}
            >
              <ListOrdered className="w-3.5 h-3.5" />
              <span>Hàng Đợi</span>
              {activeTaskCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-pink-500 text-white text-[10px] font-bold animate-pulse">
                  {activeTaskCount}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-xl hover:bg-white/[0.08] text-slate-400 hover:text-white transition-all cursor-pointer"
              title="Cài đặt"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* View Switcher with Framer Motion transitions */}
        <AnimatePresence mode="wait">
          {activeNav === "home" ? (
            <motion.div
              key="home-view"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              {/* Official Hero Banner */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 md:p-5 rounded-2xl glass-panel relative overflow-hidden">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl p-2 bg-slate-900/80 border border-white/10 flex items-center justify-center shrink-0 shadow-xl">
                    <img src="/logo.png" alt="yt-dlp logo" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-lg md:text-xl font-extrabold tracking-tight bg-gradient-to-r from-red-400 via-pink-300 to-indigo-300 bg-clip-text text-transparent">
                        yt-dlp Desktop Studio
                      </h1>
                      <span className="px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 text-[10px] font-bold border border-indigo-500/30">
                        Official Fork
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Công cụ tải video & tách nhạc đa năng, hiện đại với giao diện Glassmorphism mượt mà.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-slate-300">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-semibold">Đa luồng siêu tốc</span>
                  </div>
                </div>
              </div>

              {/* URL Input Box */}
              <UrlInputBox
                url={url}
                setUrl={setUrl}
                onAnalyze={handleAnalyze}
                isLoading={isLoading}
              />

              {/* Media Preview & Formats Card */}
              {mediaInfo && (
                <div className="space-y-4">
                  <MediaPreviewCard
                    media={mediaInfo}
                    onOpenPlaylistModal={() => setIsPlaylistModalOpen(true)}
                  />

                  <FormatSelector
                    media={mediaInfo}
                    settings={settings}
                    onStartDownload={handleStartDownload}
                    onSelectFolder={handleSelectFolder}
                    outputDir={settings.defaultDownloadDir}
                  />
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="downloads-view"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              <DownloadQueue
                tasks={tasks}
                onCancel={handleCancelDownload}
                onRetry={handleRetry}
                onOpenFile={handleOpenFile}
                onOpenFolder={handleOpenFolder}
                onClearCompleted={() =>
                  setTasks((prev) => prev.filter((t) => t.status !== "completed"))
                }
                speedData={speedData}
                currentSpeed={currentSpeedStr}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      {mediaInfo && (
        <PlaylistModal
          isOpen={isPlaylistModalOpen}
          onClose={() => setIsPlaylistModalOpen(false)}
          media={mediaInfo}
          onDownloadSelected={handleDownloadPlaylistSelected}
        />
      )}

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={(newSettings) => {
          setSettings(newSettings);
          toast.success("Đã lưu cài đặt!");
        }}
        onSelectFolder={handleSelectFolder}
      />

      <EngineStatusModal
        isOpen={isEngineModalOpen}
        onClose={() => setIsEngineModalOpen(false)}
        engineStatus={engineStatus}
        onUpdateEngine={handleUpdateEngine}
        isUpdating={isUpdatingEngine}
      />
    </div>
  );
}
