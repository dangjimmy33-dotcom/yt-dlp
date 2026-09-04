import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Search,
  Globe,
  Film,
  Music,
  Tv,
  Share2,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Layers,
  ChevronRight,
  Radio,
  FileCode,
  Sliders,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { invoke } from '@tauri-apps/api/core';

interface SupportedSitesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PopularSite {
  name: string;
  domain: string;
  category: 'social' | 'music' | 'stream' | 'video' | 'asia';
  badge: string;
  features: string[];
  gradient: string;
}

const POPULAR_SITES: PopularSite[] = [
  // Social & Short-form
  {
    name: 'YouTube',
    domain: 'youtube.com',
    category: 'social',
    badge: 'Chính thức',
    features: ['4K/8K 60fps', 'Tách MP3 320k', 'Playlist/Kênh', 'Phụ đề đa ngữ', 'Live Stream'],
    gradient: 'from-red-500/20 to-red-600/10 border-red-500/30 text-red-300',
  },
  {
    name: 'TikTok',
    domain: 'tiktok.com',
    category: 'social',
    badge: 'Không Logo/Watermark',
    features: ['Video HD gốc', 'Tách Audio MP3', 'Tải theo User', 'Tải danh sách nhạc'],
    gradient: 'from-pink-500/20 to-cyan-500/10 border-pink-500/30 text-pink-300',
  },
  {
    name: 'Facebook',
    domain: 'facebook.com',
    category: 'social',
    badge: 'Reels & Watch',
    features: ['Video Full HD', 'Facebook Reels', 'Video Nhóm công khai', 'Tách âm thanh'],
    gradient: 'from-blue-600/20 to-blue-700/10 border-blue-500/30 text-blue-300',
  },
  {
    name: 'Instagram',
    domain: 'instagram.com',
    category: 'social',
    badge: 'Reels & Stories',
    features: ['Reels HD', 'Video Post', 'Story & Highlight', 'Audio gốc'],
    gradient: 'from-purple-500/20 to-pink-500/10 border-purple-500/30 text-purple-300',
  },
  {
    name: 'Twitter / X',
    domain: 'x.com / twitter.com',
    category: 'social',
    badge: 'X Media',
    features: ['Tải video 1080p', 'Tải ảnh GIF', 'Âm thanh Space', 'Đa luồng tải'],
    gradient: 'from-sky-500/20 to-slate-500/10 border-sky-500/30 text-sky-300',
  },
  {
    name: 'Reddit',
    domain: 'reddit.com',
    category: 'social',
    badge: 'v.redd.it',
    features: ['Tự động gộp Video+Audio', 'Độ phân giải cao nhất', 'Tách MP3'],
    gradient: 'from-orange-600/20 to-red-600/10 border-orange-500/30 text-orange-300',
  },
  {
    name: 'Threads',
    domain: 'threads.net',
    category: 'social',
    badge: 'Meta',
    features: ['Tải video Reels HD', 'Âm thanh bài đăng', 'Bóc tách trực tiếp'],
    gradient: 'from-slate-600/20 to-zinc-700/10 border-slate-500/30 text-slate-300',
  },
  {
    name: 'Pinterest',
    domain: 'pinterest.com',
    category: 'social',
    badge: 'Pins Media',
    features: ['Video Pin chất lượng cao', 'GIF động', 'Tải nhanh'],
    gradient: 'from-red-600/20 to-rose-600/10 border-red-500/30 text-rose-300',
  },

  // Music & Audio
  {
    name: 'SoundCloud',
    domain: 'soundcloud.com',
    category: 'music',
    badge: 'Lossless & MP3',
    features: ['MP3 320k / Original', 'Tải Playlist / Album', 'Nhúng Cover Art', 'Nhúng Thẻ ID3'],
    gradient: 'from-amber-500/20 to-orange-600/10 border-amber-500/30 text-amber-300',
  },
  {
    name: 'Bandcamp',
    domain: 'bandcamp.com',
    category: 'music',
    badge: 'Audiophile',
    features: ['Âm thanh chất lượng cao', 'Tải trọn bộ Album', 'Metadata nghệ sĩ'],
    gradient: 'from-teal-500/20 to-cyan-600/10 border-teal-500/30 text-teal-300',
  },
  {
    name: 'Mixcloud',
    domain: 'mixcloud.com',
    category: 'music',
    badge: 'DJ Sets',
    features: ['Bản phối DJ dài', 'Tách Audio MP3', 'Chống méo tiếng'],
    gradient: 'from-indigo-500/20 to-blue-600/10 border-indigo-500/30 text-indigo-300',
  },
  {
    name: 'Apple Podcasts',
    domain: 'podcasts.apple.com',
    category: 'music',
    badge: 'Podcast Series',
    features: ['Âm thanh Podcast chuẩn', 'Tải theo tập', 'Metadata chương mục'],
    gradient: 'from-purple-600/20 to-indigo-600/10 border-purple-500/30 text-purple-300',
  },

  // Livestream & Gaming
  {
    name: 'Twitch',
    domain: 'twitch.tv',
    category: 'stream',
    badge: 'VOD & Clips',
    features: ['Video VOD 1080p60', 'Tải Clip ngắn', 'Tách âm thanh', 'Cắt đoạn thời gian'],
    gradient: 'from-purple-600/20 to-violet-700/10 border-purple-500/30 text-purple-300',
  },
  {
    name: 'Kick',
    domain: 'kick.com',
    category: 'stream',
    badge: 'VODs',
    features: ['Tải Livestream phát lại', 'Độ phân giải gốc', 'Âm thanh trực tiếp'],
    gradient: 'from-emerald-500/20 to-green-600/10 border-emerald-500/30 text-emerald-300',
  },
  {
    name: 'Bilibili',
    domain: 'bilibili.com',
    category: 'stream',
    badge: 'Anime & Gaming',
    features: ['Video 1080p/4K', 'Tải theo Phần/Tập phim', 'Phụ đề Danmaku', 'Tách Audio'],
    gradient: 'from-cyan-500/20 to-blue-600/10 border-cyan-500/30 text-cyan-300',
  },
  {
    name: 'Niconico',
    domain: 'nicovideo.jp',
    category: 'stream',
    badge: 'Japan Media',
    features: ['Tải Video gốc', 'Bình luận màn hình', 'Tách nhạc vocaloid'],
    gradient: 'from-zinc-500/20 to-neutral-600/10 border-zinc-500/30 text-zinc-300',
  },

  // Video Streaming & Cinema
  {
    name: 'Vimeo',
    domain: 'vimeo.com',
    category: 'video',
    badge: 'Pro Video',
    features: ['Video 4K chất lượng cao', 'Phụ đề đa ngữ', 'Tải video nhúng'],
    gradient: 'from-sky-500/20 to-blue-600/10 border-sky-500/30 text-sky-300',
  },
  {
    name: 'Dailymotion',
    domain: 'dailymotion.com',
    category: 'video',
    badge: 'Global Media',
    features: ['Full HD 1080p', 'Tải trọn bộ kênh', 'Tách MP3'],
    gradient: 'from-blue-500/20 to-indigo-600/10 border-blue-500/30 text-blue-300',
  },
  {
    name: 'Rumble',
    domain: 'rumble.com',
    category: 'video',
    badge: 'Video Hub',
    features: ['Video 1080p/4K', 'Kênh phát sóng', 'Không nén video'],
    gradient: 'from-lime-500/20 to-emerald-600/10 border-lime-500/30 text-lime-300',
  },
  {
    name: 'Odysee / LBRY',
    domain: 'odysee.com',
    category: 'video',
    badge: 'Decentralized',
    features: ['Video gốc không giới hạn', 'Tải theo kênh', 'Bảo toàn âm thanh'],
    gradient: 'from-rose-500/20 to-pink-600/10 border-rose-500/30 text-rose-300',
  },

  // Asia & Vietnam
  {
    name: 'Douyin',
    domain: 'douyin.com',
    category: 'asia',
    badge: 'China Short-form',
    features: ['Video HD không logo', 'Nhạc nền MP3', 'Tải theo người dùng'],
    gradient: 'from-rose-600/20 to-red-600/10 border-rose-500/30 text-rose-300',
  },
  {
    name: 'Kuaishou',
    domain: 'kuaishou.com',
    category: 'asia',
    badge: 'Kwai HD',
    features: ['Video HD gốc', 'Tách âm thanh', 'Tải nhanh đa luồng'],
    gradient: 'from-amber-600/20 to-orange-600/10 border-amber-500/30 text-amber-300',
  },
  {
    name: 'Weibo Video',
    domain: 'weibo.com',
    category: 'asia',
    badge: 'Microblog Video',
    features: ['Video bài viết', 'Tải video siêu nét', 'Audio kèm theo'],
    gradient: 'from-red-500/20 to-amber-500/10 border-red-500/30 text-red-300',
  },
  {
    name: 'iQiyi / Tencent Video',
    domain: 'iq.com / v.qq.com',
    category: 'asia',
    badge: 'Phim & Show',
    features: ['Phim bộ & Show truyền hình', 'Trình bóc tách tương thích', 'Phụ đề tiếng Việt'],
    gradient: 'from-green-500/20 to-emerald-600/10 border-green-500/30 text-green-300',
  },
];

export const SupportedSitesModal: React.FC<SupportedSitesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [allExtractors, setAllExtractors] = useState<string[]>([]);
  const [isLoadingExtractors, setIsLoadingExtractors] = useState<boolean>(false);
  const [showTechnicalList, setShowTechnicalList] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && allExtractors.length === 0) {
      setIsLoadingExtractors(true);
      invoke<string[]>('get_supported_extractors')
        .then((res) => {
          if (Array.isArray(res)) {
            setAllExtractors(res);
          }
        })
        .catch(() => {
          // Fallback
        })
        .finally(() => {
          setIsLoadingExtractors(false);
        });
    }
  }, [isOpen]);

  const filteredPopular = useMemo(() => {
    let list = POPULAR_SITES;
    if (activeCategory !== 'all') {
      list = list.filter((s) => s.category === activeCategory);
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.domain.toLowerCase().includes(q) ||
          s.features.some((f) => f.toLowerCase().includes(q))
      );
    }
    return list;
  }, [activeCategory, searchTerm]);

  const filteredExtractors = useMemo(() => {
    if (!searchTerm.trim()) return allExtractors.slice(0, 100);
    const q = searchTerm.toLowerCase();
    return allExtractors.filter((e) => e.toLowerCase().includes(q));
  }, [allExtractors, searchTerm]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-4xl max-h-[88vh] rounded-3xl bg-slate-950/95 border border-white/10 shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Top Header */}
          <div className="p-5 sm:p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-indigo-950/40 via-purple-950/20 to-slate-900/60">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 shadow-lg shadow-indigo-500/10">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                    Nền Tảng Được Hỗ Trợ
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 border border-indigo-500/40 text-indigo-300">
                    {allExtractors.length > 0 ? `${allExtractors.length}+ Trang web` : '1800+ Trang web'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Lõi yt-dlp tích hợp bộ bóc tách chuyên dụng tải tốc độ cao cho hầu hết các trang media trên thế giới.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search & Category Filter Bar */}
          <div className="p-4 sm:p-5 border-b border-white/[0.06] bg-slate-900/50 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm kiếm trang web (vd: Facebook, Bilibili, TikTok, SoundCloud, Reddit, Vimeo, Douyin...)"
                className="w-full bg-slate-950/80 border border-white/10 rounded-2xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all font-medium"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar text-xs">
              {[
                { id: 'all', label: 'Tất cả phổ biến', icon: Layers },
                { id: 'social', label: 'Mạng xã hội & Video ngắn', icon: Share2 },
                { id: 'music', label: 'Âm nhạc & Podcast', icon: Music },
                { id: 'stream', label: 'Livestream & Gaming', icon: Tv },
                { id: 'video', label: 'Phim ảnh & Chia sẻ', icon: Film },
                { id: 'asia', label: 'Châu Á & Đa phương tiện', icon: Globe },
              ].map((cat) => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl whitespace-nowrap font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 border border-white/[0.06]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 custom-scrollbar">
            {/* Live Search Match status */}
            {searchTerm.trim() && (
              <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-indigo-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>
                    Kết quả tìm kiếm cho &quot;<span className="font-bold text-white">{searchTerm}</span>&quot;:
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  {filteredPopular.length} nền tảng phổ biến • {filteredExtractors.length} bộ bóc tách yt-dlp
                </span>
              </div>
            )}

            {/* Popular Platforms Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Nền tảng nổi bật tối ưu hóa đặc biệt:
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {filteredPopular.length} nền tảng
                </span>
              </div>

              {filteredPopular.length === 0 ? (
                <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-center space-y-2">
                  <Globe className="w-8 h-8 text-slate-500 mx-auto" />
                  <div className="text-xs font-bold text-slate-300">
                    Không thấy trong danh mục nổi bật?
                  </div>
                  <p className="text-[11px] text-slate-400 max-w-md mx-auto">
                    Trang web này vẫn được hỗ trợ hoàn toàn qua danh sách hơn 1800+ Extractor kỹ thuật bên dưới hoặc trình Bắt Link Web tự động của Studio!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredPopular.map((site) => (
                    <div
                      key={site.name}
                      className={`p-3.5 rounded-2xl border transition-all bg-gradient-to-br ${site.gradient} hover:border-white/20`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                            {site.name}
                          </h3>
                          <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                            {site.domain}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white/10 text-slate-200 border border-white/10 shrink-0">
                          {site.badge}
                        </span>
                      </div>

                      {/* Feature pills */}
                      <div className="flex flex-wrap gap-1 mt-3">
                        {site.features.map((feat) => (
                          <span
                            key={feat}
                            className="px-1.5 py-0.5 rounded bg-black/40 border border-white/[0.06] text-[10px] font-medium text-slate-300"
                          >
                            {feat}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Technical yt-dlp Extractors Section (Expandable) */}
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/[0.08] space-y-3">
              <div
                onClick={() => setShowTechnicalList(!showTechnicalList)}
                className="flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-xl bg-indigo-500/15 text-indigo-400">
                    <FileCode className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">
                      Danh sách kỹ thuật {allExtractors.length > 0 ? allExtractors.length : '1800+'}{' '}
                      bộ bóc tách (yt-dlp extractors)
                    </span>
                    <span className="text-[11px] text-slate-400 block">
                      Tất cả các định dạng website, diễn đàn, đài truyền hình, dịch vụ lưu trữ media toàn cầu
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-indigo-400">
                    {showTechnicalList ? 'Thu gọn' : 'Xem danh sách chi tiết'}
                  </span>
                  <ChevronRight
                    className={`w-4 h-4 text-indigo-400 transition-transform duration-200 ${
                      showTechnicalList ? 'rotate-90' : ''
                    }`}
                  />
                </div>
              </div>

              {showTechnicalList && (
                <div className="pt-3 border-t border-white/[0.06] space-y-2">
                  <div className="text-[11px] text-slate-400 flex items-center justify-between">
                    <span>
                      Đang hiển thị {filteredExtractors.length} bộ bóc tách
                      {searchTerm.trim() ? ` phù hợp với "${searchTerm}"` : ' (gần nhất)'}:
                    </span>
                    <span className="font-mono text-[10px] text-indigo-300">
                      yt-dlp engine version 2026.08+
                    </span>
                  </div>

                  <div className="max-h-52 overflow-y-auto rounded-xl bg-slate-950/80 p-3 border border-white/[0.06] font-mono text-[11px] text-slate-300 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 custom-scrollbar">
                    {filteredExtractors.map((ext, idx) => (
                      <div
                        key={`${ext}-${idx}`}
                        className="px-2 py-1 rounded bg-white/[0.02] hover:bg-white/[0.06] truncate text-slate-300"
                        title={ext}
                      >
                        • {ext}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Smart Sniffer Note */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-slate-900/60 border border-indigo-500/20 flex items-start gap-3">
              <Sparkles className="w-4 h-4 text-pink-400 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300 space-y-1">
                <span className="font-bold text-slate-100 block">
                  Trang web của bạn không có trong danh sách hoặc bị mã hóa chặn tải?
                </span>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Studio được trang bị chế độ <strong className="text-indigo-300">Bắt Link Web (Sniffer Browser)</strong> thông minh. Chỉ cần dán đường link trang web vào thanh tìm kiếm, ứng dụng sẽ mở trang trong môi trường duyệt web tương tác và tự động tóm gọn luồng video HLS (.m3u8), DASH (.mpd) hay MP4 khi bạn bấm phát video!
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-white/10 bg-slate-900/40 flex items-center justify-between text-xs text-slate-400">
            <span>Tự động cập nhật extractor khi bạn nhấn nút Cập nhật Engine yt-dlp.</span>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all cursor-pointer shadow-md shadow-indigo-600/20"
            >
              Đóng
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
