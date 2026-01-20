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
  // Local state for instant UI feedback
  const [liked, setLiked] = useState(initialIsLiked);
  const [count, setCount] = useState(initialLikeCount);
  const [isPending, setIsPending] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card navigation
    if (isPending) return;

    // 1. Optimistic Update
    const newLikedState = !liked;
    setLiked(newLikedState);
    setCount((prev) => (newLikedState ? prev + 1 : prev - 1));
    setIsPending(true);

    try {
      const result = await toggleLike(postId);

      if (!result.success) {
        // 2. Rollback if server fails
        setLiked(initialIsLiked);
        setCount(initialLikeCount);
        toast.error("Failed to update like");
      }
    } catch (error) {
      // 3. Rollback on network error
      setLiked(initialIsLiked);
      setCount(initialLikeCount);
      toast.error("Something went wrong");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <button
      onClick={handleLike}
      disabled={isPending}
      className="group flex items-center gap-1.5 focus:outline-none transition-transform active:scale-90"
      aria-label={liked ? "Unlike" : "Like"}
    >
      <Heart
        size={18}
        className={`transition-colors duration-200 ${
          liked
            ? "fill-red-500 text-red-500"
            : "text-zinc-400 group-hover:text-red-400"
        }`}
      />
      <span
        className={`text-sm font-medium ${liked ? "text-red-500" : "text-zinc-500"}`}
      >
        {count}
      </span>
    </button>
  );
};

export default LikeButton;
