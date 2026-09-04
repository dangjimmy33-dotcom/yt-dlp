import React, { useState, useEffect } from "react";
import { DownloadRequest, AppSettings } from "../types";
import {
  X,
  Layers,
  Video,
  Music,
  Download,
  ClipboardPaste,
  Trash2,
  Sparkles,
  FolderOpen,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface BatchDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onStartBatchDownload: (requests: DownloadRequest[]) => void;
  onSelectFolder: () => void;
  initialUrls?: string[];
}

export const BatchDownloadModal: React.FC<BatchDownloadModalProps> = ({
  isOpen,
  onClose,
  settings,
  onStartBatchDownload,
  onSelectFolder,
  initialUrls = [],
}) => {
  const [rawText, setRawText] = useState<string>("");
  const [downloadType, setDownloadType] = useState<"video" | "audio">("video");
  const [quality, setQuality] = useState<string>("1080p");
  const [audioFormat, setAudioFormat] = useState<string>("mp3");
  const [audioQuality, setAudioQuality] = useState<string>("320K");

  useEffect(() => {
    if (initialUrls && initialUrls.length > 0) {
      setRawText(initialUrls.join("\n"));
    }
  }, [initialUrls, isOpen]);

  if (!isOpen) return null;

  // Extract valid URLs from raw text
  const extractUrls = (text: string): string[] => {
    const lines = text.split(/[\r\n,]+/);
    const urls: string[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        urls.push(trimmed);
      }
    }
    return urls;
  };

  const detectedUrls = extractUrls(rawText);

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        const newUrls = extractUrls(text);
        if (newUrls.length > 0) {
          const combined = rawText.trim()
            ? `${rawText.trim()}\n${newUrls.join("\n")}`
            : newUrls.join("\n");
          setRawText(combined);
          toast.success(`Đã nhận diện thêm ${newUrls.length} link từ bộ nhớ tạm!`);
        } else {
          toast.info("Không tìm thấy đường link web hợp lệ trong bộ nhớ tạm.");
        }
      }
    } catch {
      toast.error("Không thể đọc bộ nhớ tạm.");
    }
  };

  const handleStart = () => {
    if (detectedUrls.length === 0) {
      toast.error("Chưa có đường link hợp lệ nào để tải.");
      return;
    }

    if (!settings.defaultDownloadDir?.trim()) {
      toast.error("Chưa chọn thư mục lưu video. Hãy chọn nơi lưu trước.");
      onSelectFolder();
      return;
    }

    const requests: DownloadRequest[] = detectedUrls.map((url, idx) => {
      let displayTitle = url;
      try {
        const parsed = new URL(url);
        displayTitle = `${parsed.hostname}${parsed.pathname}`.slice(0, 40);
      } catch {}

      return {
        id: `batch-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
        url,
        title:
          downloadType === "audio"
            ? `[Audio ${audioFormat.toUpperCase()}] ${displayTitle}`
            : `[Video ${quality}] ${displayTitle}`,
        download_type: downloadType,
        quality: downloadType === "video" ? quality : "best",
        video_container: downloadType === "video" ? "mp4" : undefined,
        audio_format: downloadType === "audio" ? audioFormat : undefined,
        audio_quality: downloadType === "audio" ? audioQuality : undefined,
        audio_normalize: false, // Default untouched 100% full volume
        output_dir: settings.defaultDownloadDir,
        embed_subtitles: settings.embedSubtitles,
        embed_thumbnail: true,
        embed_metadata: settings.embedMetadata,
        sponsorblock: settings.sponsorBlock,
        cookies_browser: settings.cookiesBrowser,
      };
    });

    onStartBatchDownload(requests);
    toast.success(`Đã thêm ${requests.length} video vào hàng đợi tải đa luồng!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-2xl max-h-[90vh] glass-panel rounded-3xl p-5 md:p-6 flex flex-col space-y-4 shadow-2xl border border-indigo-500/25 relative overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-100 flex items-center gap-2">
                Tải Nhiều Link Cùng Lúc (Batch Mode)
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-[10px] text-indigo-300 font-mono">
                  {detectedUrls.length} link
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Dán danh sách nhiều video, tập phim hoặc bài hát để tải hàng loạt đa luồng siêu tốc.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Textarea Input Container */}
        <div className="space-y-1.5 flex-1 min-h-[160px] flex flex-col">
          <div className="flex items-center justify-between text-xs">
            <label className="font-semibold text-slate-300 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              Danh sách link (Mỗi link 1 dòng):
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePasteFromClipboard}
                className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 cursor-pointer"
              >
                <ClipboardPaste className="w-3 h-3" />
                <span>Dán từ bộ nhớ tạm</span>
              </button>
              {rawText && (
                <button
                  onClick={() => setRawText("")}
                  className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-red-400 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Xóa hết</span>
                </button>
              )}
            </div>
          </div>

          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={`https://www.youtube.com/watch?v=...\nhttps://www.youtube.com/watch?v=...\nhttps://tiktok.com/@user/video/...\nhttps://animevietsub.li/phim/...`}
            rows={7}
            className="w-full flex-1 bg-slate-900/80 border border-white/10 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 rounded-2xl p-3 text-xs md:text-sm font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none resize-none transition-all"
          />
        </div>

        {/* Batch Configuration Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
          {/* Mode Switcher */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Định dạng tải toàn bộ:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setDownloadType("video")}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  downloadType === "video"
                    ? "bg-indigo-600/30 border border-indigo-500/50 text-white shadow-md shadow-indigo-500/20"
                    : "bg-white/[0.03] border border-white/[0.06] text-slate-400 hover:text-slate-200"
                }`}
              >
                <Video className="w-3.5 h-3.5 text-indigo-400" />
                <span>Video MP4</span>
              </button>

              <button
                onClick={() => setDownloadType("audio")}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  downloadType === "audio"
                    ? "bg-pink-600/30 border border-pink-500/50 text-white shadow-md shadow-pink-500/20"
                    : "bg-white/[0.03] border border-white/[0.06] text-slate-400 hover:text-slate-200"
                }`}
              >
                <Music className="w-3.5 h-3.5 text-pink-400" />
                <span>Tách Nhạc MP3</span>
              </button>
            </div>
          </div>

          {/* Quality / Resolution Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              {downloadType === "video" ? "Độ phân giải mặc định:" : "Chất lượng âm thanh:"}
            </label>

            {downloadType === "video" ? (
              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 text-slate-200 text-xs font-semibold rounded-xl py-2 px-3 focus:outline-none focus:border-indigo-500/50"
              >
                <option value="best">Cao nhất (Tự động 4K / 1080p)</option>
                <option value="2160p">4K Ultra HD (2160p)</option>
                <option value="1440p">2K QHD (1440p)</option>
                <option value="1080p">1080p Full HD (Khuyên dùng)</option>
                <option value="720p">720p HD (Tiết kiệm dung lượng)</option>
                <option value="480p">480p SD</option>
              </select>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={audioFormat}
                  onChange={(e) => setAudioFormat(e.target.value)}
                  className="bg-slate-900 border border-white/10 text-slate-200 text-xs font-semibold rounded-xl py-2 px-2.5 focus:outline-none focus:border-pink-500/50"
                >
                  <option value="mp3">MP3</option>
                  <option value="m4a">M4A (AAC)</option>
                  <option value="flac">FLAC (Lossless)</option>
                  <option value="wav">WAV</option>
                </select>

                <select
                  value={audioQuality}
                  onChange={(e) => setAudioQuality(e.target.value)}
                  className="bg-slate-900 border border-white/10 text-slate-200 text-xs font-semibold rounded-xl py-2 px-2.5 focus:outline-none focus:border-pink-500/50"
                >
                  <option value="320K">320 kbps (Cực cao)</option>
                  <option value="256K">256 kbps</option>
                  <option value="192K">192 kbps</option>
                  <option value="128K">128 kbps</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Target Folder & Start Button Footer */}
        <div className="pt-2 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={onSelectFolder}
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-indigo-300 font-mono truncate max-w-xs cursor-pointer"
            title="Đổi thư mục lưu trữ"
          >
            <FolderOpen className="w-4 h-4 text-indigo-400 shrink-0" />
            <span className="truncate">{settings.defaultDownloadDir || "Chọn nơi lưu"}</span>
          </button>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              Hủy
            </button>

            <button
              onClick={handleStart}
              disabled={detectedUrls.length === 0}
              className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer ${
                detectedUrls.length === 0
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5"
                  : "bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500 text-white shadow-indigo-500/30 hover:opacity-95"
              }`}
            >
              <Download className="w-4 h-4" />
              <span>Bắt Đầu Tải {detectedUrls.length > 0 ? `(${detectedUrls.length} Video)` : ""}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
