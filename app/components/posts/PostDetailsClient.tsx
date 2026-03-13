"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import {
  Calendar,
  MessageCircle,
  ArrowLeft,
  Ellipsis,
  Edit2,
  Globe,
  Lock,
  Users,
  Hash,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
  Video,
  Image as ImageIcon,
  RefreshCw,
} from "lucide-react";

import LikeButton from "@/app/components/general/LikeButton";
import ToggleSaveButton from "@/app/components/general/ToggleSaveButton";
import CommentSection from "../comment/CommentSection";
import AddCollectionButton from "../general/AddCollectionButton";
import DeleteSnippitButton from "../general/DeleteSnippitButton";
import ShareActionButton from "../general/ShareActionButton";

/* Visibility badge */
const VisibilityBadge = ({ visibility }: { visibility: string }) => {
  const map: Record<
    string,
    { icon: React.ReactNode; label: string; cls: string }
  > = {
    PUBLIC: {
      icon: <Globe size={10} />,
      label: "Public",
      cls: "bg-emerald-50 text-emerald-600 border-emerald-100",
    },
    PRIVATE: {
      icon: <Lock size={10} />,
      label: "Private",
      cls: "bg-gray-100 text-gray-500 border-gray-200",
    },
    FOLLOWERS: {
      icon: <Users size={10} />,
      label: "Followers",
      cls: "bg-indigo-50 text-indigo-600 border-indigo-100",
    },
    DRAFT: {
      icon: <Edit2 size={10} />,
      label: "Draft",
      cls: "bg-yellow-50 text-yellow-600 border-yellow-100",
    },
  };
  const v = map[visibility] ?? map.PRIVATE;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${v.cls}`}
    >
      {v.icon}
      {v.label}
    </span>
  );
};

/* Media item */
const MediaItem = ({
  img,
  idx,
  onExpand,
}: {
  img: any;
  idx: number;
  onExpand: (idx: number) => void;
}) => {
  const isVideo = img.url?.match(/\.(mp4|webm|avi|mov)$/i);
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div
        onClick={() => onExpand(idx)}
        className="relative w-full overflow-hidden bg-gray-50 cursor-zoom-in group"
      >
        {isVideo ? (
          <video
            src={img.url}
            muted
            preload="metadata"
            className="w-full h-56 sm:h-72 object-cover"
          />
        ) : (
          <Image
            src={img.url}
            alt={img.description || `Media ${idx + 1}`}
            width={1200}
            height={800}
            className="w-full h-56 sm:h-72 object-cover"
            priority={idx === 0}
            unoptimized
          />
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-200 flex items-end justify-end p-3">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 backdrop-blur-sm rounded-xl p-2">
            <Maximize2 size={14} className="text-white" />
          </div>
        </div>
        {isVideo && (
          <div className="absolute top-3 left-3 bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1.5">
            <Video size={11} className="text-white" />
            <span className="text-[10px] font-bold text-white uppercase tracking-wide">
              Video
            </span>
          </div>
        )}
        <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm rounded-lg px-2 py-1">
          <span className="text-[10px] font-bold text-white/80 tabular-nums">
            {idx + 1}
          </span>
        </div>
      </div>
      {img.description ? (
        <div className="px-4 py-3.5">
          <p className="text-sm text-gray-600 leading-relaxed">
            {img.description}
          </p>
        </div>
      ) : (
        <div className="px-4 py-3 border-t border-gray-50">
          <p className="text-xs text-gray-300 italic">No description</p>
        </div>
      )}
    </div>
  );
};

/* Preview Modal */
const PreviewModal = ({
  images,
  initialIndex,
  onClose,
}: {
  images: any[];
  initialIndex: number;
  onClose: () => void;
}) => {
  const [current, setCurrent] = useState(initialIndex);
  const [error, setError] = useState(false);

  const prev = useCallback(() => {
    setError(false);
    setCurrent((i) => (i - 1 + images.length) % images.length);
  }, [images.length]);
  const next = useCallback(() => {
    setError(false);
    setCurrent((i) => (i + 1) % images.length);
  }, [images.length]);

  useEffect(() => {
    setError(false);
  }, [current]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, prev, next]);

  const img = images[current];
  const isVideo = img?.url?.match(/\.(mp4|webm|avi|mov)$/i);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-5xl w-full flex flex-col gap-3"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center justify-start gap-3">
            <span className="text-xs font-medium text-white/50 tabular-nums whitespace-nowrap">
              {current + 1} / {images.length}
            </span>
            {img?.description && (
              <p className="text-xs text-white/60 truncate max-w-xs">
                {img.description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all"
          >
            <X size={15} />
          </button>
        </div>
        <div className="rounded-2xl overflow-hidden bg-black flex items-center justify-center min-h-[300px] relative">
          {error ? (
            <div className="p-10 text-center space-y-3">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mx-auto">
                <ImageIcon size={22} className="text-white/40" />
              </div>
              <p className="text-sm font-bold text-white/70">
                Failed to load preview
              </p>
              <button
                onClick={() => setError(false)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-white/50 hover:text-white/80 bg-white/10 hover:bg-white/15 px-3 py-1.5 rounded-lg transition-all"
              >
                <RefreshCw size={11} /> Try again
              </button>
            </div>
          ) : isVideo ? (
            <video
              src={img.url}
              controls
              autoPlay
              onError={() => setError(true)}
              className="max-h-[80vh] w-full"
            />
          ) : (
            <img
              src={img.url}
              alt={img.description || ""}
              onError={() => setError(true)}
              className="max-h-[80vh] w-auto object-contain"
            />
          )}
          {images.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-black/40 hover:bg-black/60 text-white transition-all backdrop-blur-sm"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={next}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-black/40 hover:bg-black/60 text-white transition-all backdrop-blur-sm"
              >
                <ChevronRight size={18} />
              </button>
            </>
          )}
        </div>
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 justify-center">
            {images.map((im, i) => {
              const iv = im.url?.match(/\.(mp4|webm|avi|mov)$/i);
              return (
                <button
                  key={im.id || i}
                  onClick={() => {
                    setError(false);
                    setCurrent(i);
                  }}
                  className={`relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${i === current ? "border-white" : "border-transparent opacity-50 hover:opacity-80"}`}
                >
                  {iv ? (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                      <Video size={14} className="text-white/60" />
                    </div>
                  ) : (
                    <img
                      src={im.url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const PostDetailClient = ({ post, currentUserId }: any) => {
  const router = useRouter();
  const [commentCount, setCommentCount] = useState<number>(
    post._count.comments || 0,
  );
  const [formattedDate, setFormattedDate] = useState<string>("");
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const isOwner = currentUserId === post.user.id;

  useEffect(() => {
    setFormattedDate(format(new Date(post.createdAt), "MMM dd, yyyy"));
    console.log("post visibility and isDraft:", post.visibility, post.isDraft);
  }, [post.createdAt]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          {/* Post info header */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Author row */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-gray-100">
              <Link
                href={`/profile/${post.user.id}`}
                className="flex items-center gap-3 group"
              >
                <div className="relative h-9 w-9 rounded-full overflow-hidden border border-gray-100 bg-gray-50 flex-shrink-0 group-hover:ring-2 group-hover:ring-indigo-500 group-hover:ring-offset-1 transition-all">
                  {post.user.avatar ? (
                    <Image
                      src={post.user.avatar}
                      alt={post.user.username}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="h-full w-full bg-indigo-50 flex items-center justify-center font-bold text-indigo-600 text-sm">
                      {post.user.username[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">
                    @{post.user.username}
                  </p>
                  <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                    <Calendar size={9} />
                    {formattedDate || "—"}
                  </p>
                </div>
              </Link>

              {/* Actions menu */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setMenuOpen((o) => !o)}
                  className="w-8 h-8 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-all"
                >
                  <Ellipsis size={16} className="text-gray-500" />
                </button>
                {menuOpen && (
                  <div
                    className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <AddCollectionButton
                      postId={post.id}
                      userId={post.user.id}
                    />
                    {isOwner && (
                      <>
                        <Link
                          href={`/posts/${post.id}/edit`}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition"
                        >
                          <Edit2 size={14} className="mr-2" /> Edit
                        </Link>
                        <DeleteSnippitButton postId={post.id} />
                      </>
                    )}
                    {!post.isDraft && (
                      <ShareActionButton
                        id={post.id}
                        title={post.title}
                        url={`${process.env.NEXT_PUBLIC_APP_URL}/posts/${post.id}`}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Title, category, visibility, description, tags — all in one row on desktop */}
            <div className="px-5 py-4 space-y-3 border-b border-gray-100">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-100">
                  {post.category}
                </span>
                <VisibilityBadge visibility={post.visibility} />
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-gray-900 leading-snug">
                {post.title}
              </h1>
              {post.description && (
                <p className="text-sm text-gray-500 leading-relaxed">
                  {post.description}
                </p>
              )}
            </div>

            {/* Tags + interaction bar — side by side on desktop */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-3.5">
              {post.tags?.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {post.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 text-sm font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-lg transition-colors cursor-default"
                    >
                      <Hash size={9} className="opacity-50" />
                      {tag}
                    </span>
                  ))}
                </div>
              ) : (
                <div />
              )}

              {/* Interactions */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <LikeButton
                  postId={post.id}
                  initialIsLiked={post.isLiked}
                  initialLikeCount={post._count.likes}
                />
                <Link
                  href={`/posts/${post.id}#comments`}
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1"
                >
                  <MessageCircle
                    size={18}
                    strokeWidth={2}
                    className="stroke-gray-500 hover:stroke-indigo-600 transition"
                  />
                  <span className="text-xs tabular-nums text-gray-500">
                    {commentCount}
                  </span>
                </Link>
                <ToggleSaveButton
                  postId={post.id}
                  initialIsSaved={post.isSaved}
                  initialSaveCount={post._count.savedBy}
                />
              </div>
            </div>
          </div>

          {/* ── 2-col grid: media + comments  */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Media — full width on mobile (order 1), left 7 cols on desktop */}
            <div className="lg:col-span-7 order-first lg:order-first space-y-4">
              {post.images.length > 0 ? (
                post.images.map((img: any, idx: number) => (
                  <MediaItem
                    key={img.id || idx}
                    img={img}
                    idx={idx}
                    onExpand={(i) => setPreviewIndex(i)}
                  />
                ))
              ) : (
                <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-16 text-center">
                  <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <ImageIcon size={22} className="text-gray-300" />
                  </div>
                  <p className="text-sm font-bold text-gray-400">
                    No media attached
                  </p>
                </div>
              )}
            </div>

            {/* Comments — below media on mobile (order 2), right 5 cols on desktop */}
            <div className="lg:col-span-5 order-last lg:order-last">
              <div className="lg:sticky lg:top-6">
                <div
                  id="comments"
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden"
                >
                  <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100">
                    <MessageCircle size={14} className="text-gray-400" />
                    <span className="text-sm font-bold text-gray-800">
                      Comments
                    </span>
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full ml-auto">
                      {commentCount}
                    </span>
                  </div>
                  <div className="p-5">
                    <CommentSection
                      postId={post.id}
                      postOwnerId={post.user.id}
                      currentUserId={currentUserId}
                      onCountChange={(delta: number) =>
                        setCommentCount((prev) => prev + delta)
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {previewIndex !== null && (
        <PreviewModal
          images={post.images}
          initialIndex={previewIndex}
          onClose={() => setPreviewIndex(null)}
        />
      )}
    </>
  );
};

export default PostDetailClient;
