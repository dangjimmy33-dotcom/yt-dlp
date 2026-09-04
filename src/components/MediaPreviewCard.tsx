import React from "react";
import { MediaInfo } from "../types";
import { Play, User, Eye, Clock, Layers, Sparkles, ExternalLink } from "lucide-react";
import { motion } from "framer-motion";

interface MediaPreviewCardProps {
  media: MediaInfo;
  onOpenPlaylistModal?: () => void;
}

export const MediaPreviewCard: React.FC<MediaPreviewCardProps> = ({
  media,
  onOpenPlaylistModal,
}) => {
  const formatViews = (views?: number) => {
    if (!views) return null;
    if (views >= 1_000_000_000) return `${(views / 1_000_000_000).toFixed(1)}B views`;
    if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M views`;
    if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K views`;
    return `${views} views`;
  };

  // Find maximum resolution available
  const maxRes = media.formats?.reduce((max, f) => {
    return (f.height || 0) > max ? (f.height || 0) : max;
  }, 0);

  const maxResLabel =
    maxRes >= 2160 ? "4K Ultra HD" :
    maxRes >= 1440 ? "2K QHD" :
    maxRes >= 1080 ? "1080p Full HD" :
    maxRes >= 720 ? "720p HD" : "SD Quality";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="w-full glass-panel rounded-2xl p-4 md:p-5 relative overflow-hidden"
    >
      {/* Ambient gradient glow in background */}
      <div className="absolute -top-16 -right-16 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative flex flex-col md:flex-row gap-5 items-start">
        {/* Thumbnail Preview */}
        <div className="relative w-full md:w-72 shrink-0 aspect-video rounded-xl overflow-hidden group shadow-lg border border-white/10 bg-slate-900">
          {media.thumbnail ? (
            <img
              src={media.thumbnail}
              alt={media.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-600">
              <Play className="w-12 h-12 opacity-40" />
            </div>
          )}

          {/* Frosted Badge on Thumbnail: Duration / Playlist Count */}
          <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-md border border-white/10 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md">
            {media.is_playlist ? (
              <>
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>{media.duration_str}</span>
              </>
            ) : (
              <>
                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                <span>{media.duration_str}</span>
              </>
            )}
          </div>

          {/* Quality Ribbon */}
          {!media.is_playlist && maxRes > 0 && (
            <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-md bg-indigo-600/85 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wider shadow">
              {maxResLabel}
            </div>
          )}
        </div>

        {/* Media Details */}
        <div className="flex-1 space-y-3 w-full">
          {/* Title */}
          <h2 className="text-base md:text-lg font-bold text-slate-100 line-clamp-2 leading-snug">
            {media.title}
          </h2>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
            {/* Author / Channel */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] text-slate-300 font-medium">
              <User className="w-3.5 h-3.5 text-indigo-400" />
              <span>{media.uploader}</span>
            </div>

            {/* View count */}
            {media.view_count && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/[0.06] font-medium">
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                <span>{formatViews(media.view_count)}</span>
              </div>
            )}

            {/* Playlist Button if playlist */}
            {media.is_playlist && onOpenPlaylistModal && (
              <button
                onClick={onOpenPlaylistModal}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/40 text-indigo-300 font-semibold hover:bg-indigo-500/30 transition-all cursor-pointer"
              >
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>Xem danh sách ({media.playlist_count} video)</span>
              </button>
            )}
          </div>

          {/* Description snippet */}
          {media.description && (
            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed bg-slate-950/40 p-2.5 rounded-xl border border-white/[0.04]">
              {media.description}
            </p>
          )}

          {/* Quick tags */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-400" /> Sẵn sàng tải:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.08] text-slate-300 font-medium">
                Video MP4 / MKV
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.08] text-slate-300 font-medium">
                Audio MP3 320k / Lossless FLAC
              </span>
              {media.subtitles?.length > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.08] text-slate-300 font-medium">
                  {media.subtitles.length} ngôn ngữ phụ đề
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
