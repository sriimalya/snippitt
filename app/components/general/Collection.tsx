"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Collection } from "@/types";
import {
  Eye,
  Lock,
  Users,
  FileText,
  ChevronRight,
  Folder,
  Edit3,
} from "lucide-react";

const DEFAULT_COVER_IMAGE =
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop";

// Design System Tokens
const styles = {
  card: "group relative flex flex-col overflow-hidden rounded-[1.25rem] border border-neutral-200/70 bg-white transition-all duration-300 hover:border-neutral-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1",
  coverImage: "relative h-44 w-full overflow-hidden bg-neutral-100",
  imageOverlay:
    "absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent",
  badge:
    "inline-flex items-center gap-1.5 rounded-lg bg-white/90 backdrop-blur-md px-2.5 py-1 shadow-sm border border-white/50",
  badgeText:
    "text-[10px] font-semibold uppercase tracking-wider text-neutral-700",
  avatar:
    "relative h-7 w-7 overflow-hidden rounded-full border border-neutral-200 shrink-0",
  username: "text-xs font-medium text-neutral-500 truncate",
  title:
    "text-lg font-bold tracking-tight text-neutral-900 line-clamp-1 transition-colors group-hover:text-[#5865F2]",
  description: "text-sm leading-relaxed text-neutral-600 line-clamp-2",
  footer: "flex items-center justify-between border-t border-neutral-100 pt-3",
  timestamp: "text-xs font-medium text-neutral-400",
  link: "inline-flex items-center gap-1 text-xs font-semibold text-[#5865F2] transition-all group-hover:gap-1.5",
} as const;

function getTimeAgo(date: string | Date): string {
  const inputDate = new Date(date);
  if (isNaN(inputDate.getTime())) return "";
  const seconds = Math.floor((Date.now() - inputDate.getTime()) / 1000);
  if (seconds < 5) return "Just now";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return days < 7 ? `${days}d` : inputDate.toLocaleDateString();
}

interface CollectionsProps {
  collections: Collection[];
  showCoverImage?: boolean;
  variant?: "grid" | "list";
  compact?: boolean;
  isOwner?: boolean;
}

export const Collections = ({
  collections,
  showCoverImage = false,
  variant = "grid",
  compact = false,
  isOwner = false,
}: CollectionsProps) => {
  if (!collections || collections.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50/50 p-20 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(88,101,242,0.05),transparent_70%)]" />
        <div className="relative space-y-6">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-xl bg-white shadow-sm border border-neutral-200">
            <Folder size={32} className="text-neutral-300" strokeWidth={1.5} />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-neutral-900">
              No Collections Yet
            </h3>
            <p className="text-sm text-neutral-500 max-w-sm mx-auto">
              Start organizing your snippets by creating your first collection.
            </p>
          </div>
          <Link
            href="/collections/new"
            className="inline-flex items-center gap-2 rounded-full bg-[#5865F2] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#5865F2]/20 transition-all hover:bg-[#4752C4] hover:shadow-xl hover:shadow-[#5865F2]/30 hover:-translate-y-0.5"
          >
            Create Collection
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case "PUBLIC":
        return <Eye className="w-3.5 h-3.5" />;
      case "PRIVATE":
        return <Lock className="w-3.5 h-3.5" />;
      case "FOLLOWERS":
        return <Users className="w-3.5 h-3.5" />;
      default:
        return <Eye className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div
      className={
        variant === "grid"
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
          : "space-y-3"
      }
    >
      {collections.map((collection) => {
        const postCount = collection._count?.posts ?? 0;
        const timeLabel = getTimeAgo(collection.createdAt);

        if (variant === "grid") {
          return (
            <div key={collection.id} className={styles.card}>
              {/* Cover Image */}
              <div className={styles.coverImage}>
                <Image
                  src={collection.coverImage || DEFAULT_COVER_IMAGE}
                  alt={collection.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  unoptimized
                />
                <div className={styles.imageOverlay} />

                {/* Floating Badges */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                  <div className={styles.badge}>
                    {getVisibilityIcon(collection.visibility)}
                    <span className={styles.badgeText}>
                      {collection.visibility}
                    </span>
                  </div>

                  {isOwner && (
                    <Link
                      href={`/collection/${collection.id}/edit`}
                      className="flex items-center justify-center rounded-lg bg-white/90 backdrop-blur-md p-2 shadow-sm border border-white/50 opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:scale-110"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Edit3 size={14} className="text-neutral-700" />
                    </Link>
                  )}
                </div>

                <div className="absolute bottom-3 right-3">
                  <div className={styles.badge}>
                    <FileText size={12} className="text-[#5865F2]" />
                    <span className="text-xs font-semibold text-neutral-900">
                      {postCount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-1 flex-col p-5 space-y-3">
                {/* Author */}
                <div className="flex items-center gap-2.5">
                  <div className={styles.avatar}>
                    {collection.user?.avatar ? (
                      <Image
                        src={collection.user.avatar}
                        alt={collection.user.username}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-neutral-100 text-xs font-semibold text-neutral-500">
                        {collection.user?.username?.[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className={styles.username}>
                    @{collection.user?.username}
                  </span>
                </div>

                {/* Title & Description */}
                <div className="space-y-2 flex-1">
                  <h4 className={styles.title}>#{collection.name}</h4>
                  <p className={styles.description}>
                    {collection.description ||
                      "No description provided for this collection."}
                  </p>
                </div>

                {/* Footer */}
                <div className={styles.footer}>
                  <span className={styles.timestamp}>{timeLabel}</span>
                  <Link
                    href={`/collection/${collection.id}`}
                    className={styles.link}
                  >
                    View <ChevronRight size={14} strokeWidth={2.5} />
                  </Link>
                </div>
              </div>
            </div>
          );
        }

        // List Variant
        return (
          <Link
            key={collection.id}
            href={`/explore/collection/${collection.id}`}
            className="group flex items-center gap-5 rounded-xl border border-neutral-200/70 bg-white p-4 transition-all duration-300 hover:border-neutral-300 hover:shadow-lg hover:shadow-neutral-200/50"
          >
            {/* Thumbnail */}
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg">
              <Image
                src={collection.coverImage || DEFAULT_COVER_IMAGE}
                alt={collection.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-110"
                unoptimized
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <div className="inline-flex items-center gap-1.5 text-[#5865F2]">
                  {getVisibilityIcon(collection.visibility)}
                  <span className="font-semibold uppercase tracking-wider">
                    {collection.visibility}
                  </span>
                </div>
                <span className="text-neutral-300">•</span>
                <span className="font-medium text-neutral-400">
                  {timeLabel}
                </span>
              </div>

              <h4 className="truncate text-base font-bold tracking-tight text-neutral-900 transition-colors group-hover:text-[#5865F2]">
                #{collection.name}
              </h4>

              <p className="truncate text-sm text-neutral-500">
                {collection.description || "No description"}
              </p>
            </div>

            {/* Stats & Action */}
            <div className="flex shrink-0 items-center gap-6">
              <div className="flex flex-col items-center gap-1">
                <div className="flex items-center gap-1.5 rounded-lg bg-neutral-50 px-3 py-1.5">
                  <FileText size={14} className="text-[#5865F2]" />
                  <span className="text-sm font-semibold text-neutral-900">
                    {postCount}
                  </span>
                </div>
                <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider">
                  Snippets
                </span>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-400 transition-all group-hover:bg-[#5865F2] group-hover:text-white group-hover:scale-110">
                <ChevronRight size={18} strokeWidth={2.5} />
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
};
