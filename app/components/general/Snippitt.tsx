"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { Post } from "@/schemas/post";
import { VisibilityTag } from "./VisibilityTags";
import { Edit, MessageCircle, Ellipsis, Clock } from "lucide-react";
import LikeButton from "./LikeButton";
import AddCollectionButton from "./AddCollectionButton";
import DeleteSnippitButton from "./DeleteSnippitButton";
import ToggleSaveButton from "./ToggleSaveButton";
import ShareActionButton from "./ShareActionButton";

const DEFAULT_COVER_IMAGE = "/assets/default.svg";

interface SnippetProps {
  post: Post;
  menuOpen: string | null;
  toggleMenu: (id: string) => void;
  showActions?: boolean;
  currentUserId?: string;
  variant?: "default" | "compact";
}

const Snippet = ({
  post,
  menuOpen,
  toggleMenu,
  showActions = true,
  currentUserId,
  variant = "default",
}: SnippetProps) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        menuOpen === post.id &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        toggleMenu("");
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen, post.id, toggleMenu]);

  function timeAgo(date: string | Date): string {
    const inputDate = new Date(date);
    if (isNaN(inputDate.getTime())) return "";

    const now = new Date().getTime();

    const seconds = Math.floor((now - inputDate.getTime()) / 1000);
    if (seconds < 5) return "Just now";
    if (seconds < 60) return `${seconds}s`;

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;

    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}w`;

    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo`;

    const years = Math.floor(days / 365);
    return `${years}y`;
  }

  const handleCardClick = () => {
    const link = post.isDraft ? `/posts/${post.id}/edit` : `/posts/${post.id}`;
    window.open(link, "_blank");
  };

  const isCurrentUsersPost = currentUserId === post.user.id;

  if (variant === "compact") {
    return (
      <div
        className="relative bg-white border border-gray-100 rounded-xl 
hover:border-gray-200 hover:shadow-sm transition-all cursor-pointer 
flex flex-col sm:flex-row gap-4 sm:gap-2 p-2 group"
        onClick={handleCardClick}
      >
        {/* Top-right menu button */}
        {showActions && (
          <div
            className="absolute top-3 right-3 z-20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => toggleMenu(post.id)}
                className="w-8 h-8 bg-gray-100/50 rounded-full flex items-center justify-center hover:shadow-md"
              >
                <Ellipsis size={16} className="text-gray-500" />
              </button>

              {menuOpen === post.id && (
                <div
                  className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <AddCollectionButton postId={post.id} userId={post.user.id} />

                  {isCurrentUsersPost && (
                    <>
                      <Link
                        href={`/posts/${post.id}/edit`}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-primary/10 hover:text-primary transition"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Edit size={16} className="mr-2" />
                        Edit
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
        )}

        {/* Thumbnail */}
        <div className="relative w-full sm:w-36 h-48 sm:h-24 rounded-lg overflow-hidden flex-shrink-0">
          <Image
            src={post.coverImage || DEFAULT_COVER_IMAGE}
            alt="Cover"
            fill
            className="object-cover"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-between px-2 sm:mt-1">
          {/* Title + Description */}
          <div>
            <Link
              href={
                post.isDraft ? `/posts/${post.id}/edit` : `/posts/${post.id}`
              }
              className="block w-full font-bold text-gray-900 truncate group-hover:text-primary transition"
            >
              {post.title}
            </Link>

            <p className="text-sm text-gray-500 line-clamp-2 mt-1">
              {post.description}
            </p>
          </div>

          {/* Engagement Row */}
          <div
            className="flex items-center justify-between mt-3 text-xs text-gray-500"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left side: meta */}
            <span>{timeAgo(post.createdAt)}</span>

            {/* Right side: stats */}
            <div className="flex items-center gap-2">
              {/* Like */}
              <LikeButton
                postId={post.id}
                initialIsLiked={post.isLiked}
                initialLikeCount={post._count.likes}
              />

              {/* Link to Comments */}
              <Link
                href={`/posts/${post.id}#comments`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center"
              >
                <div className="p-1 cursor-pointer flex items-center justify-center transition active:scale-90 focus:outline-none">
                  <MessageCircle
                    size={18}
                    strokeWidth={2}
                    className="stroke-gray-500 hover:stroke-primary transition"
                  />
                </div>

                <span className="text-xs tabular-nums text-gray-500">
                  {post._count.comments}
                </span>
              </Link>

              {/* Saved */}
              <ToggleSaveButton
                postId={post.id}
                initialIsSaved={post.isSaved}
                initialSaveCount={post._count.savedBy}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      key={post.id}
      className="group bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md overflow-hidden transition-shadow cursor-pointer flex flex-col"
      onClick={handleCardClick}
    >
      {/* Cover Image */}
      <div className="relative w-full aspect-[16/9]">
        <Image
          src={post.coverImage || DEFAULT_COVER_IMAGE}
          alt="Cover"
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />

        {/* Floating Category Badge */}
        {post.category && (
          <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
            <span className="backdrop-blur-md bg-white/70 text-[10px] font-bold uppercase tracking-wider text-gray-800 px-2.5 py-1 rounded-lg shadow-sm">
              {post.category}
            </span>
          </div>
        )}

        {/* Top-right Buttons */}
        {showActions && (
          <div className="absolute top-3 right-3 z-10 transition">
            <div className="relative" ref={menuRef}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMenu(menuOpen === post.id ? "" : post.id);
                }}
                className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white hover:shadow-md"
                aria-label="More options"
                aria-haspopup="true"
                aria-expanded={menuOpen === post.id}
              >
                <Ellipsis size={18} color="#4b5563" />
              </button>

              {menuOpen === post.id && (
                <div
                  className="absolute right-0 mt-2 w-44 bg-white rounded-lg shadow-lg border border-gray-200 z-30 py-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <AddCollectionButton postId={post.id} userId={post.user.id} />

                  {isCurrentUsersPost && (
                    <>
                      <Link
                        href={`/posts/${post.id}/edit`}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-primary/10 hover:text-primary transition"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Edit size={16} className="mr-2" />
                        Edit
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
        )}
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col h-full bg-white rounded-b-2xl">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2">
            <Link
              href={`/profile/${post.user.id}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative w-8 h-8 rounded-full overflow-hidden border border-gray-100 bg-gray-50">
                {post.user.avatar ? (
                  <Image
                    src={post.user.avatar}
                    alt="User"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="bg-indigo-50 w-full h-full flex items-center justify-center text-sm font-bold text-indigo-600">
                    {post.user.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </Link>

            <Link
              href={`/profile/${post.user.id}`}
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-sm font-medium text-gray-700 hover:text-indigo-600 transition">
                {post.user.username}
              </p>
            </Link>
          </div>
          <div className="flex items-center text-[11px] text-gray-400 gap-1">
            <Clock size={12} />
            {timeAgo(post.createdAt)}
          </div>
        </div>

        <Link
          href={post.isDraft ? `/posts/${post.id}/edit` : `/posts/${post.id}`}
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-base font-bold text-gray-900 leading-tight mb-2 group-hover:text-indigo-600 transition-colors line-clamp-1">
            {post.title}
          </h3>
        </Link>

        <p className="text-sm text-gray-500 line-clamp-1 leading-relaxed mb-4">
          {post.description}
        </p>

        {/* 3. Footer Section */}
        <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
          <div
            className="flex items-center justify-between text-xs text-gray-500"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              {/* Like */}
              <LikeButton
                postId={post.id}
                initialIsLiked={post.isLiked}
                initialLikeCount={post._count.likes}
              />

              {/* Link to Comments */}
              <Link
                href={`/posts/${post.id}#comments`}
                onClick={(e) => e.stopPropagation()}
                className="flex items-center"
              >
                <div className="p-1 cursor-pointer flex items-center justify-center transition active:scale-90 focus:outline-none">
                  <MessageCircle
                    size={18}
                    strokeWidth={2}
                    className="stroke-gray-500 hover:stroke-primary transition"
                  />
                </div>

                <span className="text-xs tabular-nums text-gray-500">
                  {post._count.comments}
                </span>
              </Link>

              {/* Saved */}
              <ToggleSaveButton
                postId={post.id}
                initialIsSaved={post.isSaved}
                initialSaveCount={post._count.savedBy}
              />
            </div>
          </div>
          {post.isDraft ? (
            <div className="flex items-center gap-1 bg-yellow-50 text-yellow-600 text-xs px-2 py-1 rounded-full font-medium">
              <Clock size={12} />
              Draft
            </div>
          ) : (
            <VisibilityTag visibility={post.visibility} />
          )}
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {post.tags.slice(0, 2).map((tag) => (
              <Link
                key={tag}
                href={{
                  pathname: post.isDraft
                    ? `/posts/${post.id}/edit`
                    : "/explore/posts",
                  query: post.isDraft
                    ? ""
                    : {tag},
                }}
                onClick={(e) => e.stopPropagation()}
                className="text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 px-2 py-0.5 rounded-md flex items-center gap-0.5"
              >
                #{tag}
              </Link>
            ))}

            {post.tags.length > 2 && (
              <span className="px-2 py-1 text-xs text-gray-400">
                +{post.tags.length - 2} more
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Snippet;
