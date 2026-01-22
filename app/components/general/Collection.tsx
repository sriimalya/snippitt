"use client";

import React from "react"; // Added useMemo
import Link from "next/link";
import Image from "next/image";
import { Collection } from "@/types";
import { Eye, Lock, Users, FileText, ChevronRight } from "lucide-react";

const DEFAULT_COVER_IMAGE = "https://thumbs.dreamstime.com/b/book-open-cover-reveals-tree-growing-its-pages-bathed-radiant-light-ideal-fantasy-nature-themed-book-354676529.jpg";

// 1. Move helper OUTSIDE the component to keep the component pure
function getTimeAgo(date: string | Date): string {
  const inputDate = new Date(date);
  if (isNaN(inputDate.getTime())) return "";
  
  // Note: While this still uses Date.now(), moving it to a 
  // formatting step or memoizing the component's output 
  // is the standard way to handle this in React.
  const seconds = Math.floor((Date.now() - inputDate.getTime()) / 1000);
  if (seconds < 5) return "Just now";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return inputDate.toLocaleDateString(); // Fallback for old dates
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
      <div className="text-center py-12 px-4 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
          <FileText className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">No collections yet</h3>
        <Link
          href="/dashboard/collections/new"
          className="mt-4 inline-block px-6 py-2 bg-[#5865F2] text-white rounded-lg font-medium hover:bg-[#5865F2]/90 transition-colors text-sm"
        >
          Create Collection
        </Link>
      </div>
    );
  }

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case "PUBLIC": return <Eye className="w-3.5 h-3.5" />;
      case "PRIVATE": return <Lock className="w-3.5 h-3.5" />;
      case "FOLLOWERS": return <Users className="w-3.5 h-3.5" />;
      default: return <Eye className="w-3.5 h-3.5" />;
    }
  };

  const getGradientClass = (index: number) => {
    const gradients = [
      "from-[#6366f1] via-[#818cf8] to-[#6366f1]",
      "from-[#10b981] via-[#34d399] to-[#10b981]",
      "from-[#f59e0b] via-[#fbbf24] to-[#f59e0b]",
    ];
    return gradients[index % gradients.length];
  };

  return (
    <div className={variant === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" : "space-y-3"}>
      {collections.map((collection, index) => {
        // Fix for postCount: Use the Prisma _count structure
        const postCount = collection._count?.posts ?? 0;
        const timeLabel = getTimeAgo(collection.createdAt);

        if (variant === "grid") {
          return (
            <div
              key={collection.id}
              className={`relative group overflow-hidden rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border ${
                showCoverImage ? "bg-white border-gray-200" : `bg-gradient-to-br ${getGradientClass(index)} text-white border-transparent`
              } ${compact ? "p-4" : "p-5"}`}
            >
              <div className="relative h-32 mb-4 rounded-lg overflow-hidden bg-gray-100">
                <Image
                  src={collection.coverImage || DEFAULT_COVER_IMAGE}
                  alt={collection.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>

              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                   <h4 className={`font-bold truncate mb-1 ${compact ? "text-base" : "text-lg"}`}>
                      #{collection.name}
                    </h4>
                  <p className={`text-sm line-clamp-2 opacity-90 ${showCoverImage ? "text-gray-600" : "text-white"}`}>
                    {collection.description || "No description"}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-3">
                  <div className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${
                    showCoverImage ? "bg-gray-100 text-gray-700" : "bg-white/20 text-white"
                  }`}>
                    {getVisibilityIcon(collection.visibility)}
                    <span className="capitalize">{collection.visibility.toLowerCase()}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs opacity-80">
                    <FileText className="w-3.5 h-3.5" />
                    <span>{postCount}</span>
                  </div>
                </div>
                <div className="text-xs opacity-70">{timeLabel}</div>
              </div>

              <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-2 px-4">
                {isOwner && (
                  <Link href={`/dashboard/collections/edit/${collection.id}`} className="flex-1 py-2 bg-white text-gray-900 rounded-lg font-bold text-center text-xs">
                    Edit
                  </Link>
                )}
                <Link href={`/explore/collection/${collection.id}`} className="flex-1 py-2 bg-[#5865F2] text-white rounded-lg font-bold text-center text-xs">
                  View
                </Link>
              </div>
            </div>
          );
        }

        // List Variant
        return (
          <Link
            key={collection.id}
            href={`/explore/collection/${collection.id}`}
            className="flex items-center gap-4 p-4 rounded-xl transition-all duration-200 bg-white border border-gray-100 hover:border-[#5865F2]"
          >
            <div className={`relative flex-shrink-0 rounded-lg overflow-hidden ${compact ? "w-12 h-12" : "w-16 h-16"}`}>
              {collection.coverImage ? (
                <Image src={collection.coverImage} alt={collection.name} fill className="object-cover" />
              ) : (
                <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${getGradientClass(index)}`}>
                  <span className="text-white font-bold">{collection.name.charAt(0).toUpperCase()}</span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-gray-900 truncate">#{collection.name}</h4>
              <div className="flex items-center gap-3 text-[11px] text-gray-400 font-medium">
                <span className="flex items-center gap-1"><FileText className="w-3 h-3" />{postCount} posts</span>
                <span>•</span>
                <span>{timeLabel}</span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </Link>
        );
      })}
    </div>
  );
};