import React, { useState, useEffect } from "react";
import { DownloadRequest, AppSettings } from "../types";
import {
  X,
  Layers,
  Download,
  ClipboardPaste,
  Trash2,
  FolderOpen,
  FileText,
  SlidersHorizontal,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { FormatConfigCard, FullFormatConfig } from "./FormatConfigCard";

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
  const [formatConfig, setFormatConfig] = useState<FullFormatConfig>({
    downloadType: "video",
    quality: settings.defaultVideoQuality || "1080p",
    videoContainer: "mp4",
    videoCodec: "auto",
    audioFormat: settings.defaultAudioFormat || "mp3",
    audioQuality: settings.defaultAudioQuality || "320K",
    audioNormalize: false,
    embedSubtitles: settings.embedSubtitles || false,
    embedThumbnail: settings.embedThumbnail ?? true,
    embedMetadata: settings.embedMetadata ?? true,
    sponsorblock: settings.sponsorBlock || false,
  });

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
          formatConfig.downloadType === "audio"
            ? `[Audio ${formatConfig.audioFormat.toUpperCase()}] ${displayTitle}`
            : `[Video ${formatConfig.quality}] ${displayTitle}`,
        download_type: formatConfig.downloadType,
        quality: formatConfig.downloadType === "video" ? formatConfig.quality : "best",
        video_container: formatConfig.downloadType === "video" ? formatConfig.videoContainer : undefined,
        video_codec: formatConfig.downloadType === "video" ? formatConfig.videoCodec : undefined,
        audio_format: formatConfig.downloadType === "audio" ? formatConfig.audioFormat : undefined,
        audio_quality: formatConfig.downloadType === "audio" ? formatConfig.audioQuality : undefined,
        audio_normalize: formatConfig.audioNormalize,
        output_dir: settings.defaultDownloadDir,
        embed_subtitles: formatConfig.embedSubtitles,
        embed_thumbnail: formatConfig.embedThumbnail,
        embed_metadata: formatConfig.embedMetadata,
        sponsorblock: formatConfig.sponsorblock,
        cookies_browser: settings.cookiesBrowser,
      };
    });

    onStartBatchDownload(requests);
    toast.success(`Đã thêm ${requests.length} video vào hàng đợi tải đa luồng!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-3xl max-h-[92vh] glass-panel rounded-3xl p-4 sm:p-6 flex flex-col shadow-2xl border border-indigo-500/25 relative overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] shrink-0">
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
                Dán danh sách nhiều link để tải hàng loạt với cấu hình đồng bộ chuyên nghiệp.
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

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto pr-1 my-3 space-y-4 max-h-[calc(92vh-150px)]">
          {/* Textarea Input Container */}
          <div className="space-y-1.5 flex flex-col">
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
              rows={4}
              className="w-full bg-slate-900/80 border border-white/10 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 rounded-2xl p-3 text-xs md:text-sm font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none resize-none transition-all"
            />
          </div>

          {/* Synchronized Format Configuration Card */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
              <span>Cấu hình tải đồng bộ cho toàn bộ link:</span>
            </div>
            <FormatConfigCard
              config={formatConfig}
              onChange={setFormatConfig}
              showFilenameInput={false}
              titlePrefix="Cấu hình tải toàn bộ"
            />
          </div>
        </div>

        {/* Target Folder & Start Button Footer */}
        <div className="pt-3 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
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
              <span>Bắt Đầu Tải {detectedUrls.length > 0 ? `(${detectedUrls.length} Link)` : ""}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
