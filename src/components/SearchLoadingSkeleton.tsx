import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, Sparkles, Video, Search, Globe, Radio } from 'lucide-react';

interface SearchLoadingSkeletonProps {
  query?: string;
}

export const SearchLoadingSkeleton: React.FC<SearchLoadingSkeletonProps> = ({ query }) => {
  const displayQuery = query
    ? query
        .replace(/^ytsearch\d*:/, '')
        .replace(/^ytplaylist\d*:/, '')
        .replace(/^ytchannel\d*:/, '')
        .trim()
    : '';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3 }}
      className="space-y-5 w-full"
    >
      {/* 1. Radar Scanning Hero Card */}
      <div className="relative overflow-hidden rounded-3xl glass-panel p-5 sm:p-6 border border-indigo-500/30 shadow-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900/70">
        {/* Animated scanning beam on top border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent animate-pulse" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            {/* Spinning Radar Icon with glowing ring */}
            <div className="relative w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center shrink-0 shadow-lg shadow-indigo-500/20">
              <Loader2 className="w-7 h-7 text-indigo-400 animate-spin" />
              <div className="absolute inset-0 rounded-2xl border border-indigo-400/30 animate-ping opacity-25" />
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                  <span>Đang bóc tách & tìm kiếm dữ liệu</span>
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-bounce" />
                  </span>
                </h3>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-300 font-medium truncate max-w-lg">
                <Search className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="truncate">
                  {displayQuery ? (
                    <>
                      Truy vấn: <strong className="text-indigo-300 font-bold">&quot;{displayQuery}&quot;</strong>
                    </>
                  ) : (
                    'Đang phân tích đường dẫn media...'
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-xs font-semibold text-indigo-300">
              <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
              <span>Đang kết nối yt-dlp...</span>
            </span>
          </div>
        </div>

        {/* Dynamic progress bar animation */}
        <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span>Tự động nhận diện kênh, danh sách phát và video theo chuẩn YouTube</span>
          </span>
          <span className="font-mono text-indigo-300 text-[10px]">Tốc độ cao ~ 1.5s</span>
        </div>
      </div>

      {/* 2. Shimmering Skeleton Cards Grid (16:9 YouTube Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl overflow-hidden border border-white/[0.06] bg-slate-950/40 p-0 flex flex-col space-y-3 animate-pulse"
          >
            {/* 16:9 Thumbnail Skeleton with gradient shimmer */}
            <div className="relative aspect-video w-full bg-slate-900/90 overflow-hidden flex items-center justify-center">
              <Video className="w-8 h-8 text-slate-700/60" />
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
              {/* Badge placeholder */}
              <div className="absolute bottom-2 right-2 w-12 h-4 rounded bg-slate-800/80" />
            </div>

            {/* Info Skeleton */}
            <div className="p-3 pt-0 space-y-2.5 flex-1 flex flex-col justify-between">
              <div className="space-y-2">
                {/* Title lines */}
                <div className="h-3.5 bg-slate-800/90 rounded-md w-11/12" />
                <div className="h-3.5 bg-slate-800/60 rounded-md w-3/4" />

                {/* Channel name */}
                <div className="flex items-center gap-2 pt-1">
                  <div className="w-5 h-5 rounded-full bg-slate-800/80 shrink-0" />
                  <div className="h-3 bg-slate-800/60 rounded-md w-1/2" />
                </div>
              </div>

              {/* Button skeletons */}
              <div className="pt-2 border-t border-white/[0.04] flex items-center gap-2">
                <div className="h-7 bg-slate-800/70 rounded-xl flex-1" />
                <div className="h-7 bg-slate-800/70 rounded-xl flex-1" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};
