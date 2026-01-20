"use client";

import React, { useState } from "react";
import { Bookmark } from "lucide-react";
import { savePost, unsavePost } from "@/actions/save";
import { toast } from "sonner";

interface ToggleSaveButtonProps {
  postId: string;
  initialIsSaved: boolean;
}

const ToggleSaveButton: React.FC<ToggleSaveButtonProps> = ({
  postId,
  initialIsSaved,
}) => {
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  const [isPending, setIsPending] = useState(false);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Stops the card from opening
    if (isPending) return;

    // 1. Optimistic Update
    const previousState = isSaved;
    setIsSaved(!previousState);
    setIsPending(true);

    try {
      // 2. Choose the correct action
      const result = previousState
        ? await unsavePost(postId)
        : await savePost(postId);

      if (!result.success) {
        // 3. Rollback on failure
        setIsSaved(previousState);
        toast.error(result.error?.message || "Failed to update save status");
      } else {
        toast.success(previousState ? "Removed from saved" : "Post saved!");
      }
    } catch (error) {
      setIsSaved(previousState);
      toast.error("Network error occurred");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className="w-8 h-8 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center transition hover:bg-white hover:shadow-md active:scale-90 focus:outline-none"
      aria-label={isSaved ? "Unsave" : "Save"}
    >
      <Bookmark
        size={18}
        className={`transition-all duration-200 ${
          isSaved
            ? "fill-[#5865F2] text-[#5865F2]"
            : "text-gray-600 group-hover:text-[#5865F2]"
        }`}
      />
    </button>
  );
};

export default ToggleSaveButton;
