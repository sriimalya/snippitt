"use client";

import React, { useState } from "react";
import { UserPlus, UserCheck, Loader2 } from "lucide-react";
import { toggleFollow } from "@/actions/follow";
import { toast } from "sonner";
import Button from "@/app/components/Button";

interface FollowButtonProps {
  targetUserId: string;
  initialIsFollowing: boolean;
  initialFollowerCount: number;
  initialFollowingCount: number;
}

const FollowButton = ({
  targetUserId,
  initialIsFollowing,
  initialFollowerCount,
  initialFollowingCount,
}: FollowButtonProps) => {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);
  const [isPending, setIsPending] = useState(false);

  const handleToggle = async () => {
    if (isPending) return;

    // 1. Optimistic Update (Instant feedback)
    const previousState = isFollowing;
    setIsFollowing(!previousState);
    setFollowerCount((prev) => (previousState ? prev - 1 : prev + 1));
    setIsPending(true);

    try {
      const result = await toggleFollow(targetUserId);

      if (!result.success) {
        // 2. Rollback on Server Failure
        setIsFollowing(previousState);
        setFollowerCount(initialFollowerCount);
        toast.error(result.message || "Failed to update follow status");
      }
    } catch (error) {
      // 3. Rollback on Network Error
      setIsFollowing(previousState);
      setFollowerCount(initialFollowerCount);
      toast.error("Network error. Please try again.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row items-center gap-6">
      {/* Action Button */}
      <Button
        variant={isFollowing ? "outline" : "theme-primary"}
        onClick={handleToggle}
        disabled={isPending}
        className={`min-w-[130px] shadow-sm ${isFollowing ? "bg-white border-gray-200 text-gray-600 hover:text-red-500 hover:border-red-100 hover:bg-red-50 transition-all" : ""}`}
        icon={isPending ? <Loader2 className="animate-spin" size={18} /> : isFollowing ? <UserCheck size={18} /> : <UserPlus size={18} />}
      >
        {isFollowing ? "Following" : "Follow"}
      </Button>

      {/* Stats Cluster */}
      <div className="flex items-center gap-6">
        <div className="text-center md:text-left">
          <div className="text-lg font-black text-gray-900 leading-none">{followerCount}</div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Followers</div>
        </div>
        <div className="w-px h-8 bg-gray-100" />
        <div className="text-center md:text-left">
          <div className="text-lg font-black text-gray-900 leading-none">{initialFollowingCount}</div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Following</div>
        </div>
      </div>
    </div>
  );
};

export default FollowButton;