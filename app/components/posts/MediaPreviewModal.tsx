// app/components/posts/edit/MediaPreviewModal.tsx
"use client";

import { useEffect } from "react";
import { X, Image as ImageIcon, RefreshCw } from "lucide-react";

interface MediaPreviewModalProps {
  file: { src: string; type: "image" | "video"; name: string } | null;
  hasError: boolean;
  onClose: () => void;
  onRetry: () => void;
}

export const MediaPreviewModal = ({
  file,
  hasError,
  onClose,
  onRetry,
}: MediaPreviewModalProps) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!file) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl w-full max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-1 pb-3">
          <p className="text-xs font-medium text-white/60 truncate pr-4">{file.name}</p>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all flex-shrink-0"
          >
            <X size={15} />
          </button>
        </div>

        <div className="rounded-2xl overflow-hidden bg-black flex items-center justify-center min-h-[200px]">
          {hasError ? (
            <div className="p-10 text-center space-y-3">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto">
                <ImageIcon size={22} className="text-white/40" />
              </div>
              <p className="text-sm font-bold text-white/70">Failed to load preview</p>
              <button
                onClick={onRetry}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/50 hover:text-white/80 bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-lg transition-all"
              >
                <RefreshCw size={11} /> Try again
              </button>
            </div>
          ) : file.type === "image" ? (
            <img
              src={file.src}
              alt={file.name}
              onError={onRetry}
              className="max-h-[80vh] w-auto object-contain"
            />
          ) : (
            <video
              src={file.src}
              controls
              autoPlay
              onError={onRetry}
              className="max-h-[80vh] w-full"
            />
          )}
        </div>
      </div>
    </div>
  );
};