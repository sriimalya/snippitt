import Link from "next/link";
import Image from "next/image";
import { Post } from "@/schemas/post";
import { Visibility } from "@/schemas/post";
import { VisibilityTag } from "./VisibilityTags";
import { Edit, Trash, Share, MessageCircle, Ellipsis } from "lucide-react";
import LikeButton from "./LikeButton";
import AddCollectionButton from "./AddCollectionButton";
import ToggleSaveButton from "./ToggleSaveButton";

const DEFAULT_COVER_IMAGE =
  "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

interface SnippetProps {
  post: Post;
  menuOpen: string | null;
  toggleMenu: (id: string) => void;
  showActions?: boolean;
  currentUserId?: string;
}

const Snippet = ({
  post,
  menuOpen,
  toggleMenu,
  showActions = true,
  currentUserId,
}: SnippetProps) => {
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
    const link = post.linkTo || `/post/${post.id}`;
    window.open(link, "_blank");
  };

  const isCurrentUsersPost = currentUserId === post.user.id;

  return (
    <div
      className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md overflow-hidden transition-shadow cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Cover Image */}
      <div className="relative h-48 w-full">
        <Image
          src={post.coverImage || DEFAULT_COVER_IMAGE}
          alt="Cover"
          fill
          className="object-cover"
          priority
          unoptimized={true} // ← Add this
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />

        {/* Top-right Buttons */}
        {showActions && (
          <div className="absolute top-3 right-3 flex gap-2 z-10">
            <ToggleSaveButton postId={post.id} initialIsSaved={post.isSaved} />

            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleMenu(post.id);
                }}
                className="w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center transition hover:bg-white hover:shadow-md active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-label="More options"
                aria-haspopup="true"
                aria-expanded={menuOpen === post.id}
              >
                <Ellipsis size={18} color="#4b5563" />
              </button>

              {menuOpen === post.id && (
                <div
                  className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-30 py-1 animate-fade-in"
                  onClick={(e) => e.stopPropagation()}
                >
                  <AddCollectionButton postId={post.id} userId={post.user.id} />

                  {isCurrentUsersPost && (
                    <>
                      <Link
                        href={`/post/${post.id}/edit`}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-primary/10 hover:text-primary transition"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Edit size={16} className="mr-2" />
                        Edit
                      </Link>

                      <button
                        className="flex items-center w-full px-4 py-2 text-sm text-red-500 hover:bg-primary/10 hover:text-primary transition"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        <Trash size={16} className="mr-2" />
                        Delete
                      </button>
                    </>
                  )}

                  <button
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-primary/10 hover:text-primary transition"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Share size={16} className="mr-2" />
                    Share
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {/* User Info */}
        <div className="flex items-center gap-3 mb-3">
          <Link
            href={`/profile/${post.user.id}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-8 h-8 bg-primary/20 overflow-hidden rounded-full">
              {post.user.avatar ? (
                <Image
                  src={post.user.avatar}
                  alt={post.user.username}
                  className="w-full h-full object-cover"
                  width={32}
                  unoptimized={true}
                  height={32}
                />
              ) : (
                <span className="w-full h-full flex items-center justify-center text-sm font-semibold text-gray-700">
                  {post.user.username.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </Link>
          <div>
            <Link
              href={`/profile/${post.user.id}`}
              onClick={(e) => e.stopPropagation()}
            >
              <h4 className="font-semibold text-gray-900 hover:text-primary transition">
                {post.user.username}
              </h4>
            </Link>
            <p className="text-xs text-gray-500">{timeAgo(post.createdAt)}</p>
          </div>
        </div>

        {/* Post Title & Description */}
        <Link
          href={post.linkTo || `/post/${post.id}`}
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="font-semibold text-gray-900 mb-1 hover:text-primary transition line-clamp-1">
            {post.title}
          </h3>
        </Link>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {post.description}
        </p>

        {/* Footer - Visibility & Stats */}
        <div className="flex items-center justify-between">
          <VisibilityTag visibility={post.visibility as Visibility} />
          {post.isDraft && (
            <span className="px-2 py-1 text-[10px] font-black bg-amber-100 text-amber-700 rounded-md uppercase tracking-wider">
              Draft
            </span>
          )}

          <div
            className="flex items-center gap-4 text-sm text-zinc-400"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="flex items-center gap-1">
              <LikeButton
                postId={post.id}
                initialIsLiked={post.isLiked}
                initialLikeCount={post._count.likes}
              />
            </span>

            <span className="flex items-center gap-1">
              <MessageCircle size={18} />
              {post._count.comments}
            </span>

            <span className="flex items-center gap-1 text-xs">
              <span className="text-gray-400">Saved:</span>
              {post._count.savedBy}
            </span>
          </div>
        </div>

        {/* Tags (Optional - if you want to show them) */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {post.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
              >
                {tag}
              </span>
            ))}
            {post.tags.length > 3 && (
              <span className="px-2 py-1 text-xs text-gray-400">
                +{post.tags.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Snippet;
