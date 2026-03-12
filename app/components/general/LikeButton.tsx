"use client";

import React, { useState } from "react";
import { Heart } from "lucide-react";
import { toggleLike } from "@/actions/like";
import { toast } from "sonner";

interface LikeButtonProps {
  postId: string;
  initialIsLiked: boolean;
  initialLikeCount: number;
}

const LikeButton: React.FC<LikeButtonProps> = ({
  postId,
  initialIsLiked,
  initialLikeCount,
}) => {
  const [liked, setLiked] = useState(initialIsLiked);
  const [count, setCount] = useState(initialLikeCount);
  const [isPending, setIsPending] = useState(false);

  // Sync state when props change (e.g., from router.refresh())
  React.useEffect(() => {
    setLiked(initialIsLiked);
    setCount(initialLikeCount);
  }, [initialIsLiked, initialLikeCount]);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPending) return;

    const previous = liked;
    const newState = !previous;

    setLiked(newState);
    setCount((prev) => (newState ? prev + 1 : prev - 1));
    setIsPending(true);

    try {
      const result = await toggleLike(postId);

      if (!result.success) {
        setLiked(previous);
        setCount(initialLikeCount);
        toast.error("Failed to update like");
      }
    } catch {
      setLiked(previous);
      setCount(initialLikeCount);
      toast.error("Something went wrong");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={handleLike}
        disabled={isPending}
        className="cursor-pointer flex items-center justify-center transition active:scale-90 focus:outline-none"
        aria-label={liked ? "Unlike" : "Like"}
      >
        <Heart
          size={20}
          strokeWidth={2}
          className={`transition-all duration-200 ${
            liked
              ? "fill-red-500 stroke-red-500"
              : "fill-transparent stroke-gray-500 md:hover:stroke-red-500"
          }`}
        />
      </button>

      <span
        className={`text-xs font-medium tabular-nums ${
          liked ? "text-red-500" : "text-gray-500"
        }`}
      >
        {count}
      </span>
    </div>
  );
};

export default LikeButton;
