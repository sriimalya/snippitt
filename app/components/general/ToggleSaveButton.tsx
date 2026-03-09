"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark } from "lucide-react";
import { savePost, unsavePost } from "@/actions/save";
import { toast } from "sonner";

interface ToggleSaveButtonProps {
  postId: string;
  initialIsSaved: boolean;
  initialSaveCount: number;
}

const ToggleSaveButton: React.FC<ToggleSaveButtonProps> = ({
  postId,
  initialIsSaved,
  initialSaveCount,
}) => {
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  const [count, setCount] = useState(initialSaveCount);
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPending) return;

    const previous = isSaved;
    const newState = !previous;

    // 1️⃣ Optimistic Update
    setIsSaved(newState);
    setCount((prev) => (newState ? prev + 1 : prev - 1));
    setIsPending(true);

    try {
      const result = previous
        ? await unsavePost(postId)
        : await savePost(postId);

      if (!result.success) {
        // 2️⃣ Rollback if server fails
        setIsSaved(previous);
        setCount(initialSaveCount);
        toast.error(result.error?.message || "Failed to update save status");
      } else{
        router.refresh(); 
      }
    } catch {
      // 3️⃣ Rollback on network error
      setIsSaved(previous);
      setCount(initialSaveCount);
      toast.error("Network error occurred");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={handleToggle}
        disabled={isPending}
        className="p-1 cursor-pointer flex items-center justify-center transition active:scale-90 focus:outline-none"
        aria-label={isSaved ? "Unsave" : "Save"}
      >
        <Bookmark
          size={18}
          strokeWidth={2}
          className={`transition-all duration-200 ${
            isSaved
              ? "fill-primary stroke-primary"
              : "fill-transparent stroke-gray-500 hover:stroke-primary"
          }`}
        />
      </button>

      <span
        className={`text-xs font-medium tabular-nums ${
          isSaved ? "text-primary" : "text-gray-500"
        }`}
      >
        {count}
      </span>
    </div>
  );
};

export default ToggleSaveButton;
