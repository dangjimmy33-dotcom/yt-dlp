import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  BookOpen,
  ShieldCheck,
  Award,
  ExternalLink,
  Video,
  Music,
  Download,
  Search,
  Compass,
  Cookie,
  Cpu,
  Layers,
  Sparkles,
  Info,
  Scale,
  CheckCircle2,
  Code2,
  Terminal,
  FileText,
  Copy,
  Check,
  FolderOpen
} from "lucide-react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { toast } from "sonner";

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "guide" | "terms" | "credits";
}

export const AboutModal: React.FC<AboutModalProps> = ({
  isOpen,
  onClose,
  initialTab = "guide",
}) => {
  const [activeTab, setActiveTab] = useState<"guide" | "terms" | "credits">(initialTab);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleOpenLink = async (url: string) => {
    try {
      await openUrl(url);
    } catch {
      window.open(url, "_blank");
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(label);
    toast.success(`Đã sao chép ${label}`);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/75 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-4xl glass-panel rounded-3xl p-5 sm:p-7 flex flex-col shadow-2xl border border-white/10 max-h-[92vh] overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/10">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-slate-100">
                  Thông Tin & Hướng Dẫn Sử Dụng
                </h2>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  v1.1.0
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                yt-dlp Desktop Studio • Trung tâm hỗ trợ, điều khoản pháp lý & credit công nghệ
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.08] transition-all cursor-pointer"
            title="Đóng hộp thoại"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 pt-3 pb-3 border-b border-white/[0.06] shrink-0 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab("guide")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              activeTab === "guide"
                ? "bg-indigo-600/30 text-indigo-200 border border-indigo-500/50 shadow-lg shadow-indigo-500/10"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Hướng Dẫn Sử Dụng</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("terms")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              activeTab === "terms"
                ? "bg-indigo-600/30 text-indigo-200 border border-indigo-500/50 shadow-lg shadow-indigo-500/10"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Điều Khoản Sử Dụng</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("credits")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
              activeTab === "credits"
                ? "bg-indigo-600/30 text-indigo-200 border border-indigo-500/50 shadow-lg shadow-indigo-500/10"
                : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Credit & Công Nghệ</span>
          </button>
        </div>

        {/* Tab Content Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto custom-scrollbar py-4 pr-1 text-slate-300 text-xs sm:text-sm space-y-6">
          <AnimatePresence mode="wait">
            {activeTab === "guide" && (
              <motion.div
                key="guide-content"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="space-y-6"
              >
                {/* Section 1: Tải nhanh đơn lẻ */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                  <div className="flex items-center gap-2.5 text-indigo-300 font-bold text-sm">
                    <Download className="w-4 h-4 text-indigo-400" />
                    <h3>1. Tải Video & Âm Thanh Đơn Lẻ</h3>
                  </div>
                  <ul className="list-disc list-inside space-y-1.5 text-slate-300/90 text-xs leading-relaxed">
                    <li>
                      <strong className="text-white">Dán liên kết (URL):</strong> Hỗ trợ hàng ngàn nền tảng bao gồm YouTube, TikTok, Facebook, Instagram, Twitter/X, Bilibili, SoundCloud, Vimeo, Reddit,...
                    </li>
                    <li>
                      <strong className="text-white">Phân tích liên kết:</strong> Bấm nút <span className="text-indigo-300 font-medium">Phân Tích URL</span> để ứng dụng truy xuất thông tin tiêu đề, thời lượng, thumbnail và toàn bộ luồng stream tương thích.
                    </li>
                    <li>
                      <strong className="text-white">Tải nhanh tức thì:</strong> Bạn có thể bấm trực tiếp nút <span className="text-indigo-300 font-medium">Tải Nhanh</span> để bắt đầu tải ngay về thư mục lưu trữ mà không cần chờ phân tích chi tiết.
                    </li>
                  </ul>
                </div>

                {/* Section 2: Hệ sinh thái định dạng đỉnh cao */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                  <div className="flex items-center gap-2.5 text-cyan-300 font-bold text-sm">
                    <Layers className="w-4 h-4 text-cyan-400" />
                    <h3>2. Tùy Chọn Định Dạng Toàn Diện (yt-dlp Ecosystem)</h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Hệ thống cung cấp khả năng can thiệp sâu vào thông số luồng stream và quá trình hậu kỳ FFmpeg:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div className="p-3 rounded-xl bg-slate-900/40 border border-white/[0.05] space-y-1.5">
                      <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs">
                        <Video className="w-3.5 h-3.5" />
                        <span>11 Định Dạng Video Container</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
                        MP4, MKV, WebM, MOV, AVI, FLV, WMV, M4V, TS, 3GP, OGV.
                      </p>
                      <div className="pt-1 text-[11px] text-slate-400">
                        <span className="text-slate-300 font-semibold">7 Video Codecs:</span> H.264 (AVC), H.265 (HEVC), AV1, VP9, VP8, Apple ProRes, Giữ nguyên gốc (Copy).
                      </div>
                      <div className="pt-0.5 text-[11px] text-slate-400">
                        <span className="text-slate-300 font-semibold">10 Mức độ phân giải:</span> Tự động tốt nhất (Best), 8K (4320p), 4K (2160p), 2K (1440p), 1080p, 720p, 480p, 360p, 240p, 144p.
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/40 border border-white/[0.05] space-y-1.5">
                      <div className="flex items-center gap-2 text-pink-400 font-bold text-xs">
                        <Music className="w-3.5 h-3.5" />
                        <span>12 Định Dạng Tách Âm Thanh</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
                        MP3, M4A, AAC, FLAC, WAV, OPUS, OGG, WMA, ALAC, AIFF, AC3, AMR.
                      </p>
                      <div className="pt-1 text-[11px] text-slate-400">
                        <span className="text-slate-300 font-semibold">7 Mức Bitrate:</span> 320 kbps (Cực cao), 256 kbps, 192 kbps, 160 kbps, 128 kbps (Tiêu chuẩn), 96 kbps, 64 kbps (Tiết kiệm dung lượng).
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Tải hàng loạt & Danh sách phát */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                  <div className="flex items-center gap-2.5 text-emerald-300 font-bold text-sm">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <h3>3. Tải Hàng Loạt & Phân Tích Danh Sách Phát (Playlist / Channel)</h3>
                  </div>
                  <ul className="list-disc list-inside space-y-1.5 text-slate-300/90 text-xs leading-relaxed">
                    <li>
                      <strong className="text-white">Danh sách phát & Kênh:</strong> Dán liên kết Playlist hoặc Channel, bấm <span className="text-emerald-300 font-medium">Phân Tích Playlist</span>. Ứng dụng sẽ hiển thị danh sách toàn bộ video kèm thumbnail, thời lượng.
                    </li>
                    <li>
                      <strong className="text-white">Mặc định bỏ chọn an toàn:</strong> Danh sách video được bỏ chọn mặc định để bạn linh hoạt tích chọn những video thực sự mong muốn tải về, tránh quá tải ổ cứng hoặc băng thông.
                    </li>
                    <li>
                      <strong className="text-white">Tải danh sách nhiều URL:</strong> Mở tính năng <span className="text-emerald-300 font-medium">Tải Hàng Loạt</span> để dán nhiều liên kết cùng lúc (mỗi dòng một URL) và đồng loạt xử lý với 1 cú click.
                    </li>
                  </ul>
                </div>

                {/* Section 4: Tìm kiếm video & Bắt luồng web */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                  <div className="flex items-center gap-2.5 text-amber-300 font-bold text-sm">
                    <Compass className="w-4 h-4 text-amber-400" />
                    <h3>4. Tìm Kiếm Tích Hợp & Bắt Luồng Web (Web Stream Sniffer)</h3>
                  </div>
                  <ul className="list-disc list-inside space-y-1.5 text-slate-300/90 text-xs leading-relaxed">
                    <li>
                      <strong className="text-white">Tìm kiếm trực tiếp:</strong> Nhập từ khóa tại thanh tìm kiếm để tra cứu kết quả YouTube trực tiếp ngay trong ứng dụng, có thể lọc theo thời lượng, ngày tải lên, phân loại và sắp xếp kết quả.
                    </li>
                    <li>
                      <strong className="text-white">Bắt Link Web (Sniffer):</strong> Dành cho các trang web phim, anime, khóa học hoặc video nhúng luồng m3u8/HLS/MPD mà không có URL trực tiếp. Bấm <span className="text-amber-300 font-medium">Bắt Link Web</span> để mở trình duyệt tích hợp, khi phát video hệ thống sẽ tự động bắt luồng để tải về.
                    </li>
                  </ul>
                </div>

                {/* Section 5: Cookie trình duyệt & Quản lý Engine */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                  <div className="flex items-center gap-2.5 text-purple-300 font-bold text-sm">
                    <Cookie className="w-4 h-4 text-purple-400" />
                    <h3>5. Cookie Trình Duyệt & Quản Lý Engine</h3>
                  </div>
                  <ul className="list-disc list-inside space-y-1.5 text-slate-300/90 text-xs leading-relaxed">
                    <li>
                      <strong className="text-white">Trích xuất Cookie tự động:</strong> Trong Cài đặt, chọn trình duyệt bạn đang sử dụng (Chrome, Firefox, Edge, Brave, Opera, Vivaldi,...). Ứng dụng sẽ sử dụng cookie phiên đăng nhập để tải được các video riêng tư, video giới hạn độ tuổi hoặc video dành riêng cho hội viên.
                    </li>
                    <li>
                      <strong className="text-white">Engine & Dependencies:</strong> Kiểm tra trạng thái yt-dlp và FFmpeg tại thanh trạng thái trên cùng. Bạn có thể tự động cập nhật yt-dlp lên bản mới nhất hoặc chỉ định đường dẫn tệp thực thi exe tùy biến theo ý muốn.
                    </li>
                  </ul>
                </div>
              </motion.div>
            )}

            {activeTab === "terms" && (
              <motion.div
                key="terms-content"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="space-y-6"
              >
                {/* Purpose */}
                <div className="p-4 sm:p-5 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 space-y-2.5">
                  <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
                    <Scale className="w-4 h-4 text-indigo-400" />
                    <h3>1. Mục Đích Sử Dụng (Fair Use & Nghiên Cứu Cá Nhân)</h3>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Ứng dụng yt-dlp Desktop Studio được thiết kế và cung cấp hoàn toàn cho mục đích học tập, nghiên cứu công nghệ truyền thông đa phương tiện cá nhân, phân tích định dạng số và sao lưu dữ liệu cá nhân hợp pháp (Personal Fair Use).
                  </p>
                </div>

                {/* Copyright & User Responsibility */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2.5">
                  <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <h3>2. Quyền Bản Quyền & Trách Nhiệm Của Người Dùng</h3>
                  </div>
                  <ul className="list-disc list-inside space-y-1.5 text-slate-300 text-xs leading-relaxed">
                    <li>
                      Người dùng chịu toàn bộ trách nhiệm pháp lý đối với nội dung mà mình quyết định tải xuống và lưu trữ thông qua ứng dụng này.
                    </li>
                    <li>
                      Bạn phải tôn trọng quyền sở hữu trí tuệ của tác giả và tuân thủ Điều khoản dịch vụ (Terms of Service) của nền tảng lưu trữ nội dung nguồn.
                    </li>
                    <li>
                      Nghiêm cấm sử dụng ứng dụng vào các mục đích thương mại hóa trái phép, phân phối lại hoặc vi phạm bản quyền dưới mọi hình thức mà không có sự đồng ý bằng văn bản của chủ sở hữu bản quyền.
                    </li>
                  </ul>
                </div>

                {/* Client-Side Nature */}
                <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-2.5">
                  <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
                    <FileText className="w-4 h-4 text-cyan-400" />
                    <h3>3. Đặc Tính Phần Mềm Client-Side Độc Lập</h3>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    yt-dlp Desktop Studio là phần mềm máy khách chạy cục bộ hoàn toàn trên máy tính của bạn. Ứng dụng không sở hữu máy chủ trung gian, không thu thập dữ liệu nội dung tải về, không lưu trữ đệm (cache) và không truyền phát hay phân phối bất kỳ tệp dữ liệu media nào qua bên thứ ba. Mọi kết nối tải về đều diễn ra trực tiếp giữa máy tính người dùng và máy chủ dịch vụ nguồn.
                  </p>
                </div>

                {/* Disclaimer */}
                <div className="p-4 sm:p-5 rounded-2xl bg-rose-950/20 border border-rose-500/20 space-y-2.5">
                  <div className="flex items-center gap-2 text-rose-300 font-bold text-sm">
                    <Info className="w-4 h-4 text-rose-400" />
                    <h3>4. Tuyên Bố Miễn Trừ Trách Nhiệm (Disclaimer of Warranty)</h3>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Phần mềm được cung cấp dưới dạng <strong className="text-white">NGUYÊN BẢN (AS-IS)</strong>, không đi kèm bất kỳ cam kết hay bảo đảm nào về tính sẵn sàng liên tục hay sự tương thích vĩnh viễn với các API của bên thứ ba. Nhóm phát triển và những người đóng góp hoàn toàn không chịu trách nhiệm đối với bất kỳ khiếu nại, tổn thất, vi phạm bản quyền hay thiệt hại pháp lý nào phát sinh từ việc sử dụng ứng dụng này của người dùng.
                  </p>
                </div>
              </motion.div>
            )}

            {activeTab === "credits" && (
              <motion.div
                key="credits-content"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18 }}
                className="space-y-4"
              >
                <div className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
                  <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
                    <Award className="w-4 h-4 text-indigo-400" />
                    <h3>Dự Án Mã Nguồn Mở Nòng Cốt</h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Ứng dụng được xây dựng dựa trên sự đóng góp vĩ đại của cộng đồng mã nguồn mở toàn cầu:
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {/* yt-dlp */}
                    <div className="p-3.5 rounded-xl bg-slate-900/50 border border-white/[0.06] space-y-1.5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-200 text-xs">yt-dlp</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                            The Unlicense
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                          Engine dòng lệnh trích xuất video & âm thanh mạnh mẽ nhất hiện nay, hỗ trợ hàng ngàn website.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenLink("https://github.com/yt-dlp/yt-dlp")}
                        className="mt-2 flex items-center gap-1.5 text-[11px] text-indigo-400 hover:text-indigo-300 transition-all cursor-pointer"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>github.com/yt-dlp/yt-dlp</span>
                      </button>
                    </div>

                    {/* FFmpeg */}
                    <div className="p-3.5 rounded-xl bg-slate-900/50 border border-white/[0.06] space-y-1.5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-200 text-xs">FFmpeg</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono">
                            LGPL / GPL
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                          Thư viện xử lý multimedia, ghép luồng video/audio và chuyển mã định dạng hàng đầu thế giới.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenLink("https://ffmpeg.org")}
                        className="mt-2 flex items-center gap-1.5 text-[11px] text-indigo-400 hover:text-indigo-300 transition-all cursor-pointer"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>ffmpeg.org</span>
                      </button>
                    </div>

                    {/* Tauri v2 */}
                    <div className="p-3.5 rounded-xl bg-slate-900/50 border border-white/[0.06] space-y-1.5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-200 text-xs">Tauri Framework v2</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                            MIT / Apache 2.0
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                          Nền tảng xây dựng ứng dụng desktop siêu nhẹ, tối ưu RAM và bảo mật cao bằng Rust & Webview.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenLink("https://tauri.app")}
                        className="mt-2 flex items-center gap-1.5 text-[11px] text-indigo-400 hover:text-indigo-300 transition-all cursor-pointer"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>tauri.app</span>
                      </button>
                    </div>

                    {/* Lucide Icons & React */}
                    <div className="p-3.5 rounded-xl bg-slate-900/50 border border-white/[0.06] space-y-1.5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-200 text-xs">React & Lucide Icons</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                            MIT / ISC
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                          Giao diện người dùng hiện đại, phong cách Glassmorphism tinh tế và bộ biểu tượng vector sắc nét.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenLink("https://lucide.dev")}
                        className="mt-2 flex items-center gap-1.5 text-[11px] text-indigo-400 hover:text-indigo-300 transition-all cursor-pointer"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>lucide.dev</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Developer Information */}
                <div className="p-4 sm:p-5 rounded-2xl bg-indigo-950/20 border border-indigo-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                        <Code2 className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-200 text-xs block">Đơn Vị Phát Triển & Bản Quyền</span>
                        <span className="text-[11px] text-slate-400 block">dangjimmy33-dotcom / toolguine</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy("https://github.com/dangjimmy33-dotcom/yt-dlp", "Liên kết GitHub")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-[11px] font-semibold text-slate-300 transition-all cursor-pointer"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? "Đã sao chép" : "Sao chép liên kết"}</span>
                    </button>
                  </div>
                  <p className="text-xs text-slate-300/80 leading-relaxed pt-1">
                    Dự án được xây dựng với mục tiêu mang đến trải nghiệm người dùng tuyệt vời nhất khi làm việc với các công cụ đa phương tiện trên desktop. Mọi đóng góp, báo lỗi hoặc yêu cầu tính năng đều được hoan nghênh trên kho mã nguồn GitHub.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between shrink-0 text-xs">
          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Phần mềm máy khách mã nguồn mở • Không quảng cáo • Không theo dõi</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold glass-button-primary cursor-pointer"
          >
            Đã Hiểu & Đóng
          </button>
        </div>
      </motion.div>
    </div>
  );
};
