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
  SniffedStreamPayload,
} from "./types";

import { TitleBar } from "./components/TitleBar";
import { UrlInputBox } from "./components/UrlInputBox";
import { MediaPreviewCard } from "./components/MediaPreviewCard";
import { FormatSelector } from "./components/FormatSelector";
import { DownloadQueue } from "./components/DownloadQueue";
import { PlaylistModal } from "./components/PlaylistModal";
import { BatchDownloadModal } from "./components/BatchDownloadModal";
import { SettingsModal } from "./components/SettingsModal";
import { EngineStatusModal } from "./components/EngineStatusModal";
import { UpdateNotificationModal } from "./components/UpdateNotificationModal";
import { PluginManagerModal } from "./components/PluginManagerModal";

import { playNotificationBell, playSuccessChime } from "./utils/sound";
import { checkForGithubUpdates, GithubReleaseInfo } from "./utils/updater";

import {
  Download,
  Home,
  ListOrdered,
  Settings,
  Cpu,
  Sparkles,
  Zap,
  FolderOpen,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  BellRing,
  Video,
  Music,
  Search,
  Boxes,
  Compass,
  Globe,
  Layers,
} from "lucide-react";

export default function App() {
  const [activeNav, setActiveNav] = useState<"home" | "downloads">("home");
  const [url, setUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [mediaInfo, setMediaInfo] = useState<MediaInfo | null>(null);
  const [detectedClipboardUrl, setDetectedClipboardUrl] = useState<string | null>(null);
  const [pendingSniffedStream, setPendingSniffedStream] = useState<SniffedStreamPayload | null>(null);
  const lastCheckedClipboard = useRef<string>("");
  const lastSniffedStream = useRef<{ url: string; at: number } | null>(null);

  // GitHub Update State
  const [githubRelease, setGithubRelease] = useState<GithubReleaseInfo | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState<boolean>(false);

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
  const [isInstallingFfmpeg, setIsInstallingFfmpeg] = useState<boolean>(false);

  // Modals
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState<boolean>(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isEngineModalOpen, setIsEngineModalOpen] = useState<boolean>(false);
  const [isPluginModalOpen, setIsPluginModalOpen] = useState<boolean>(false);

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

  // Keep startup responsive: load settings from disk config, then probe engines.
  useEffect(() => {
    void invoke<AppSettings | null>("load_app_settings")
      .then((diskSettings) => {
        if (diskSettings && diskSettings.defaultDownloadDir) {
          setSettings((prev) => ({ ...prev, ...diskSettings }));
        } else {
          void invoke<string>("get_default_download_dir")
            .then((defaultDir) => {
              if (defaultDir) {
                setSettings((prev) => ({
                  ...prev,
                  defaultDownloadDir: prev.defaultDownloadDir || defaultDir,
                }));
              }
            })
            .catch((e) => console.error("Failed to get default download dir:", e));
        }
      })
      .catch(() => {
        void invoke<string>("get_default_download_dir")
          .then((defaultDir) => {
            if (defaultDir) {
              setSettings((prev) => ({
                ...prev,
                defaultDownloadDir: prev.defaultDownloadDir || defaultDir,
              }));
            }
          })
          .catch((e) => console.error("Failed to get default download dir:", e));
      });

    const timer = window.setTimeout(() => {
      void invoke<EngineStatus>("get_engine_status")
        .then(setEngineStatus)
        .catch((e) => console.error("Initial engine probe failed:", e));
    }, 350);

    return () => window.clearTimeout(timer);
  }, []);

  // Automatic Releases update checker with bell chime notification
  useEffect(() => {
    const checkUpdates = async () => {
      try {
        const info = await checkForGithubUpdates();
        if (info && info.hasUpdate) {
          setGithubRelease(info);
          const alertedTag = sessionStorage.getItem("flowdl_alerted_update_tag");
          if (alertedTag !== info.tagName) {
            sessionStorage.setItem("flowdl_alerted_update_tag", info.tagName);
            playNotificationBell();
            setIsUpdateModalOpen(true);
            toast.info(`Có bản cập nhật mới: ${info.tagName}`);
          }
        }
      } catch (err) {
        console.warn("Update check error:", err);
      }
    };

    // Check 2 seconds after mount, and every 15 minutes
    const initialTimer = window.setTimeout(checkUpdates, 2000);
    const intervalTimer = window.setInterval(checkUpdates, 15 * 60 * 1000);

    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(intervalTimer);
    };
  }, []);

  const refreshEngineStatus = async () => {
    const status = await invoke<EngineStatus>("get_engine_status");
    setEngineStatus(status);
    return status;
  };

  const handleOpenEngineModal = () => {
    setIsEngineModalOpen(true);
    void refreshEngineStatus().catch((e) => {
      console.error("Failed to fetch engine status:", e);
      toast.error("Không thể kiểm tra trạng thái yt-dlp / FFmpeg.");
    });
  };

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
                  playSuccessChime();
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

    // Listen for live stream sniffed events from background or sniffer browser
    let unlistenSniffer: (() => void) | undefined;
    const setupSnifferListener = async () => {
      try {
        unlistenSniffer = await listen<SniffedStreamPayload>("on-sniffed-stream", (event) => {
          const payload = event.payload;
          if (!payload?.stream_url) return;

          const now = Date.now();
          const last = lastSniffedStream.current;
          if (last && last.url === payload.stream_url && now - last.at < 10_000) return;
          lastSniffedStream.current = { url: payload.stream_url, at: now };

          playNotificationBell();
          toast.success(`Đã bắt được luồng video: ${payload.page_title || "Video Stream"}`, {
            description: "Đang chuyển luồng sang hàng đợi tải...",
          });
          setUrl(payload.stream_url);
          setPendingSniffedStream(payload);
        });
      } catch (e) {
        console.error("Failed to listen to on-sniffed-stream events:", e);
      }
    };
    setupSnifferListener();

    return () => {
      if (unlisten) unlisten();
      if (unlistenSniffer) unlistenSniffer();
    };
  }, []);

  // Clipboard sniffer on window focus
  useEffect(() => {
    const checkClipboard = async () => {
      try {
        const text = await navigator.clipboard.readText();
        const clean = text?.trim();
        if (
          clean &&
          clean.startsWith("http") &&
          clean !== lastCheckedClipboard.current &&
          clean !== url
        ) {
          lastCheckedClipboard.current = clean;
          setDetectedClipboardUrl(clean);
          setUrl(clean);
          playNotificationBell();
          toast.success("Đã nhận link video từ bộ nhớ tạm!");
          void handleAnalyze(clean);
        }
      } catch {}
    };

    window.addEventListener("focus", checkClipboard);
    return () => window.removeEventListener("focus", checkClipboard);
  }, [url]);

  const BROWSER_CAPTURE_PREFIX = "FLOWDL_BROWSER_CAPTURE_REQUIRED|";

  const openBrowserCaptureForUrl = async (targetUrl: string, detail?: string) => {
    try {
      await invoke("open_sniffer_browser", { url: targetUrl });
      toast.info("Trang này cần mở bằng trình duyệt tích hợp", {
        description:
          detail ||
          "Phát video trong cửa sổ Bắt Link Web. Khi trang tải luồng media, Studio sẽ tự nhận và đưa vào hàng đợi.",
      });
    } catch (openErr: any) {
      const message = typeof openErr === "string" ? openErr : "Không thể mở trình duyệt bắt link.";
      toast.error(message);
    }
  };

  const getAnalyzeErrorMessage = (err: unknown) => {
    if (typeof err === "string") return err;
    if (err instanceof Error) return err.message;
    return "Không thể phân tích đường link này.";
  };

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
      const message = getAnalyzeErrorMessage(err);
      const needsBrowser =
        message.startsWith(BROWSER_CAPTURE_PREFIX) ||
        /HTTP\s*Error\s*403|Cloudflare|Forbidden/i.test(message);

      if (needsBrowser && /^https?:\/\//i.test(targetUrl)) {
        const detail = message.startsWith(BROWSER_CAPTURE_PREFIX)
          ? message.slice(BROWSER_CAPTURE_PREFIX.length).trim()
          : "Website từ chối request của công cụ dòng lệnh. Studio đã chuyển sang chế độ trình duyệt tương tác.";
        await openBrowserCaptureForUrl(targetUrl, detail);
      } else {
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Quick 1-Click Instant Download without waiting for metadata pre-fetch
  const handleQuickDownload = async (
    targetUrl: string,
    type: "video" | "audio",
    qualityOrFormat: string,
    audioQuality?: string
  ) => {
    const cleanUrl = targetUrl.trim();
    if (!cleanUrl) return;

    let displayTitle = cleanUrl;
    try {
      const parsed = new URL(cleanUrl);
      displayTitle = `${parsed.hostname}${parsed.pathname}`.slice(0, 45);
    } catch {}

    const req: DownloadRequest = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      url: cleanUrl,
      title:
        type === "audio"
          ? `[Audio ${qualityOrFormat.toUpperCase()}] ${displayTitle}`
          : `[Video ${qualityOrFormat}] ${displayTitle}`,
      download_type: type,
      quality: type === "video" ? qualityOrFormat : "best",
      video_container: type === "video" ? "mp4" : undefined,
      audio_format: type === "audio" ? qualityOrFormat : undefined,
      audio_quality: type === "audio" ? audioQuality || "320K" : undefined,
      audio_normalize: type === "audio",
      output_dir: settings.defaultDownloadDir,
      embed_subtitles: settings.embedSubtitles,
      embed_thumbnail: true,
      embed_metadata: true,
      sponsorblock: settings.sponsorBlock,
      cookies_browser: settings.cookiesBrowser,
    };

    setDetectedClipboardUrl(null);
    await handleStartDownload(req);
  };

  // Start Download
  const handleStartDownload = async (req: DownloadRequest) => {
    if (!req.output_dir?.trim()) {
      toast.error("Chưa chọn thư mục tải về.");
      await handleSelectFolder();
      return;
    }

    let status = engineStatus;
    try {
      if (!status) status = await refreshEngineStatus();
    } catch (e) {
      toast.error("Không kiểm tra được Engine. Hãy mở mục Engine để kiểm tra dependency.");
      setIsEngineModalOpen(true);
      return;
    }

    if (!status.ytdlp_available || !status.ffmpeg_available) {
      setIsEngineModalOpen(true);
      if (!status.ytdlp_available && !status.ffmpeg_available) {
        toast.error("Thiếu yt-dlp và FFmpeg. Cài Engine trước khi tải.");
      } else if (!status.ytdlp_available) {
        toast.error("Thiếu yt-dlp. Bấm Cài yt-dlp trong Engine.");
      } else {
        toast.error("Thiếu FFmpeg. Đây là dependency cần để ghép video + audio và tách MP3.");
      }
      return;
    }

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
      const message = typeof err === "string" ? err : "Lỗi khi khởi chạy tiến trình tải";
      setTasks((prev) =>
        prev.map((t) =>
          t.id === req.id ? { ...t, status: "error", errorMessage: message, totalSize: "0 B" } : t
        )
      );
      toast.error(message);
    }
  };
  // A stream captured by the embedded browser is already a media URL.
  // Do not run it through the normal webpage analyzer again; preserve its browser/page Referer
  // and send it straight to the download pipeline.
  useEffect(() => {
    if (!pendingSniffedStream) return;

    const payload = pendingSniffedStream;
    setPendingSniffedStream(null);

    if (!settings.defaultDownloadDir?.trim()) {
      toast.warning("Đã bắt được luồng, nhưng chưa có thư mục tải. Hãy chọn nơi lưu rồi bắt lại luồng.");
      setActiveNav("home");
      return;
    }

    const req: DownloadRequest = {
      id: `sniff-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      url: payload.stream_url,
      title: payload.page_title?.trim() || "Web Stream",
      download_type: "video",
      quality: "best",
      video_container: "mp4",
      output_dir: settings.defaultDownloadDir,
      embed_subtitles: false,
      embed_thumbnail: false,
      embed_metadata: settings.embedMetadata,
      sponsorblock: false,
      cookies_browser: settings.cookiesBrowser,
      referer: payload.page_url,
      direct_stream: true,
    };

    setActiveNav("downloads");
    toast.info("Luồng đã được xác nhận. Đang thêm vào hàng đợi tải...");
    void handleStartDownload(req);
  }, [pendingSniffedStream]);

  // Batch download playlist items
  const handleDownloadPlaylistSelected = (
    entries: PlaylistEntry[],
    options?: { downloadType: "video" | "audio"; quality: string; audioFormat: string; audioQuality: string }
  ) => {
    const dType = options?.downloadType || "video";
    const qual = options?.quality || settings.defaultVideoQuality || "1080p";
    const aFmt = options?.audioFormat || settings.defaultAudioFormat || "mp3";
    const aQual = options?.audioQuality || settings.defaultAudioQuality || "320K";

    entries.forEach((entry, idx) => {
      setTimeout(() => {
        const req: DownloadRequest = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          url: entry.url,
          title:
            dType === "audio"
              ? `[Audio ${aFmt.toUpperCase()}] ${entry.title}`
              : `[Video ${qual}] ${entry.title}`,
          download_type: dType,
          quality: dType === "video" ? qual : "best",
          video_container: dType === "video" ? "mp4" : undefined,
          audio_format: dType === "audio" ? aFmt : undefined,
          audio_quality: dType === "audio" ? aQual : undefined,
          audio_normalize: false,
          output_dir: settings.defaultDownloadDir,
          embed_subtitles: settings.embedSubtitles,
          embed_thumbnail: settings.embedThumbnail,
          embed_metadata: settings.embedMetadata,
          sponsorblock: settings.sponsorBlock,
          cookies_browser: settings.cookiesBrowser,
        };
        handleStartDownload(req);
      }, idx * 400);
    });

    toast.success(`Đã thêm ${entries.length} video vào hàng đợi tải!`);
  };

  // Batch download multiple custom links
  const handleStartBatchDownload = (requests: DownloadRequest[]) => {
    requests.forEach((req, idx) => {
      setTimeout(() => {
        handleStartDownload(req);
      }, idx * 400);
    });
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

  const handleOpenUrl = async (targetUrl: string) => {
    try {
      await invoke("open_url", { url: targetUrl });
    } catch {
      window.open(targetUrl, "_blank");
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
        const updated = { ...settings, defaultDownloadDir: selected };
        setSettings(updated);
        try {
          localStorage.setItem("flowdl_settings", JSON.stringify(updated));
          await invoke("save_app_settings", { settings: updated });
        } catch (err) {
          console.error("Failed to persist folder setting:", err);
        }
        toast.success(`Đã chọn thư mục: ${selected}`);
      }
    } catch (e) {
      console.error("Folder picker error:", e);
    }
  };

  const handleSaveSettings = async (newSettings: AppSettings) => {
    setSettings(newSettings);
    try {
      localStorage.setItem("flowdl_settings", JSON.stringify(newSettings));
      await invoke("save_app_settings", { settings: newSettings });
    } catch (err) {
      console.error("Failed to persist settings:", err);
    }
    toast.success("Đã lưu cài đặt");
  };

  // Update/install dependencies
  const handleUpdateEngine = async () => {
    setIsUpdatingEngine(true);
    const toastId = toast.loading("Đang tải yt-dlp mới nhất...");
    try {
      await invoke("update_engine");
      await refreshEngineStatus();
      toast.success("yt-dlp đã sẵn sàng!", { id: toastId });
    } catch (err: any) {
      toast.error(typeof err === "string" ? err : "Cập nhật yt-dlp thất bại.", { id: toastId });
    } finally {
      setIsUpdatingEngine(false);
    }
  };

  const handleInstallFfmpeg = async () => {
    setIsInstallingFfmpeg(true);
    const toastId = toast.loading("Đang tải và cài FFmpeg (~160 MB). Có thể mất vài phút...");
    try {
      await invoke("install_ffmpeg");
      await refreshEngineStatus();
      toast.success("FFmpeg + ffprobe đã sẵn sàng!", { id: toastId });
    } catch (err: any) {
      toast.error(typeof err === "string" ? err : "Cài FFmpeg thất bại.", { id: toastId });
    } finally {
      setIsInstallingFfmpeg(false);
    }
  };
  const activeTaskCount = tasks.filter(
    (t) => t.status === "downloading" || t.status === "merging" || t.status === "queued"
  ).length;

  const isEngineReady = !!engineStatus?.ytdlp_available && !!engineStatus?.ffmpeg_available;

  return (
    <div className="relative h-screen w-screen bg-slate-950 text-slate-100 flex flex-col pt-11 overflow-hidden select-none">
      {/* Background Animated Neon Mesh Spheres */}
      <div className="mesh-glow w-[500px] h-[500px] bg-indigo-600/25 top-[-100px] left-[-100px]" />
      <div className="mesh-glow w-[600px] h-[600px] bg-purple-600/20 bottom-[-150px] right-[-150px]" />
      <div className="mesh-glow w-[400px] h-[400px] bg-pink-600/15 top-[30%] right-[10%]" />

      {/* Custom Window TitleBar */}
      <TitleBar
        engineStatus={engineStatus}
        onOpenEngineModal={handleOpenEngineModal}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main App Layout */}
      <div className="flex-1 flex flex-col w-full max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 py-4 pb-28 space-y-5 z-10 overflow-y-auto overflow-x-hidden min-h-0">
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

            <button
              onClick={() => setIsBatchModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/[0.04] transition-all cursor-pointer"
              title="Dán danh sách nhiều link hoặc tập phim để tải hàng loạt đa luồng"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Tải Nhiều Link</span>
            </button>

            <button
              onClick={() => setIsPluginModalOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/[0.04] transition-all cursor-pointer"
              title="Quản lý plugins và thêm trang web tùy chỉnh"
            >
              <Boxes className="w-3.5 h-3.5 text-purple-400" />
              <span>Thêm Web</span>
            </button>

            <button
              onClick={() => {
                void invoke("open_sniffer_browser", { url: url || "https://google.com" });
                toast.info("Đang mở Trình duyệt bắt luồng video...");
              }}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/[0.04] transition-all cursor-pointer"
              title="Mở trình duyệt nhúng để bắt URL media mà trang đang phát"
            >
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span>Bắt Link Web</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 min-w-0">
            <button
              onClick={handleSelectFolder}
              className="hidden md:flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/[0.06] border border-white/[0.06] text-slate-300 transition-all cursor-pointer max-w-[320px]"
              title="Chọn thư mục tải về"
            >
              <FolderOpen className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="text-[10px] font-mono truncate">{settings.defaultDownloadDir || "Chọn nơi lưu"}</span>
            </button>

            <button
              onClick={handleOpenEngineModal}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-[10px] font-bold transition-all cursor-pointer ${
                engineStatus === null
                  ? "bg-white/[0.04] border-white/[0.08] text-slate-300"
                  : isEngineReady
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                    : "bg-amber-500/10 border-amber-500/25 text-amber-300"
              }`}
              title="Engine & Dependencies"
            >
              {engineStatus === null ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : isEngineReady ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5" />
              )}
              <span>{engineStatus === null ? "ENGINE..." : isEngineReady ? "ENGINE OK" : "THIẾU ENGINE"}</span>
            </button>

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

              {engineStatus !== null && !isEngineReady && (
                <button
                  onClick={handleOpenEngineModal}
                  className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 text-left transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-amber-200">Engine chưa hoàn tất</div>
                      <div className="text-[11px] text-amber-100/70 truncate">
                        {!engineStatus.ytdlp_available ? "Thiếu yt-dlp" : "yt-dlp OK"} • {!engineStatus.ffmpeg_available ? "Thiếu FFmpeg/ffprobe" : "FFmpeg OK"} — bấm để cài.
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-amber-300 shrink-0">MỞ ENGINE →</span>
                </button>
              )}

              {/* Floating Clipboard Sniffer Banner */}
              <AnimatePresence>
                {detectedClipboardUrl && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-purple-950/80 to-slate-900/90 border border-indigo-500/40 shadow-xl shadow-indigo-950/40 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 w-full sm:w-auto">
                      <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-300 shrink-0">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                          <span>Phát hiện liên kết trong Clipboard</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/30 text-indigo-200 border border-indigo-500/40 font-semibold">Tự động bắt link</span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono truncate max-w-sm sm:max-w-md">
                          {detectedClipboardUrl}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                      <button
                        onClick={() => {
                          handleQuickDownload(detectedClipboardUrl, "video", "1080p");
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                        title="Tải ngay Video MP4 1080p"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Video 1080p</span>
                      </button>
                      <button
                        onClick={() => {
                          handleQuickDownload(detectedClipboardUrl, "audio", "mp3", "320K");
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                        title="Tách ngay nhạc MP3 320k"
                      >
                        <Music className="w-3.5 h-3.5" />
                        <span>MP3 320k</span>
                      </button>
                      <button
                        onClick={() => {
                          setUrl(detectedClipboardUrl);
                          handleAnalyze(detectedClipboardUrl);
                          setDetectedClipboardUrl(null);
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 text-xs font-bold transition-all cursor-pointer"
                      >
                        <Search className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Phân tích</span>
                      </button>
                      <button
                        onClick={() => setDetectedClipboardUrl(null)}
                        className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                        title="Bỏ qua"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Quick destination selector: visible even before a URL is analyzed. */}
              <div className="flex items-center justify-between gap-3 px-3.5 py-3 rounded-2xl glass-panel">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FolderOpen className="w-4 h-4 text-indigo-400 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-[10px] uppercase tracking-wide font-bold text-slate-500">Video sẽ tải về</div>
                    <div className="text-[11px] font-mono text-slate-300 truncate" title={settings.defaultDownloadDir}>
                      {settings.defaultDownloadDir || "Chưa chọn thư mục"}
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleSelectFolder}
                  className="px-3 py-2 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/25 text-[11px] font-bold text-indigo-300 cursor-pointer shrink-0"
                >
                  Chọn thư mục
                </button>
              </div>

              {/* URL Input Box */}
              <UrlInputBox
                url={url}
                setUrl={setUrl}
                onAnalyze={handleAnalyze}
                onQuickDownload={handleQuickDownload}
                onOpenBatchModal={() => setIsBatchModalOpen(true)}
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
                onClearFailedOrCancelled={() =>
                  setTasks((prev) =>
                    prev.filter(
                      (t) => t.status === "downloading" || t.status === "merging" || t.status === "queued" || t.status === "completed"
                    )
                  )
                }
                onClearAll={() =>
                  setTasks((prev) =>
                    prev.filter(
                      (t) => t.status === "downloading" || t.status === "merging" || t.status === "queued"
                    )
                  )
                }
                onRemoveTask={(id) => setTasks((prev) => prev.filter((t) => t.id !== id))}
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

      <BatchDownloadModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        settings={settings}
        onStartBatchDownload={handleStartBatchDownload}
        onSelectFolder={handleSelectFolder}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        onOpenPlugins={() => setIsPluginModalOpen(true)}
      />

      <EngineStatusModal
        isOpen={isEngineModalOpen}
        onClose={() => setIsEngineModalOpen(false)}
        engineStatus={engineStatus}
        onUpdateEngine={handleUpdateEngine}
        onInstallFfmpeg={handleInstallFfmpeg}
        isUpdating={isUpdatingEngine}
        isInstallingFfmpeg={isInstallingFfmpeg}
      />

      <UpdateNotificationModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        releaseInfo={githubRelease}
        onOpenUrl={handleOpenUrl}
      />

      <PluginManagerModal
        isOpen={isPluginModalOpen}
        onClose={() => setIsPluginModalOpen(false)}
      />
    </div>
  );
}
