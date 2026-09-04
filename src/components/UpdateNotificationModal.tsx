import React from "react";
import { GithubReleaseInfo } from "../utils/updater";
import { Sparkles, Download, ExternalLink, X, BellRing } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface UpdateNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  releaseInfo: GithubReleaseInfo | null;
  onOpenUrl: (url: string) => void;
}

export const UpdateNotificationModal: React.FC<UpdateNotificationModalProps> = ({
  isOpen,
  onClose,
  releaseInfo,
  onOpenUrl,
}) => {
  if (!isOpen || !releaseInfo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-lg">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        className="w-full max-w-lg glass-panel rounded-3xl p-6 flex flex-col space-y-4 shadow-2xl border border-indigo-500/30 relative overflow-hidden"
      >
        {/* Glowing aura */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-indigo-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg">
              <BellRing className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-white">Có Bản Cập Nhật Mới!</h3>
                <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-pink-500 text-[10px] font-black text-slate-950 uppercase tracking-wider shadow">
                  {releaseInfo.tagName}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Một phiên bản mới hơn của YT-dlp đã sẵn sàng trên GitHub.</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Release Notes */}
        <div className="space-y-2 relative z-10 max-h-56 overflow-y-auto pr-1">
          <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Nội dung cập nhật & cải tiến:</span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950/60 border border-white/[0.06] text-xs text-slate-300 whitespace-pre-line leading-relaxed font-sans">
            {releaseInfo.body ? releaseInfo.body : "Bản cập nhật tối ưu hiệu năng, sửa lỗi và nâng cấp engine yt-dlp mới nhất."}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between gap-3 relative z-10">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white glass-button-secondary transition-all cursor-pointer"
          >
            Để sau
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenUrl(releaseInfo.htmlUrl)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-slate-200 transition-all cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
              <span>Xem trên GitHub</span>
            </button>

            <button
              onClick={() => onOpenUrl(releaseInfo.downloadUrl || releaseInfo.htmlUrl)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold glass-button-primary cursor-pointer shadow-lg shadow-indigo-500/25"
            >
              <Download className="w-4 h-4" />
              <span>TẢI BẢN MỚI NGAY</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
