"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import FollowButton from "@/app/components/general/FollowButton";

interface UserListItem {
  id: string;
  username: string;
  avatar: string | null;
  bio: string | null;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
  isMe: boolean;
}

const FollowersClient = ({
  initialUsers,
}: {
  initialUsers: UserListItem[];
}) => {
  if (initialUsers.length === 0) {
    return (
      <div className="text-center py-20 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
        <p className="text-gray-400 font-bold">Not Follwers Found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {initialUsers.map((user) => (
        <div
          key={user.id}
          className="bg-white p-4 rounded-[1.5rem] border border-gray-100 shadow-sm flex items-center justify-between hover:border-[#5865F2]/20 transition-all"
        >
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {/* Avatar */}
            <Link href={`/profile/${user.id}`} className="shrink-0">
              <div className="relative w-12 h-12 rounded-2xl overflow-hidden bg-gray-100 border-2 border-gray-50">
                {user.avatar ? (
                  <Image
                    src={user.avatar}
                    alt={user.username}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-[#5865F2] bg-[#5865F2]/10">
                    {user.username[0].toUpperCase()}
                  </div>
                )}
              </div>
            </Link>

            {/* User Info */}
            <div className="min-w-0 flex-1">
              <Link href={`/profile/${user.id}`}>
                <h3 className="font-black text-gray-900 truncate hover:text-[#5865F2] transition-colors">
                  @{user.username}
                </h3>
              </Link>
              <p className="text-xs text-gray-500 line-clamp-1 font-medium">
                {user.bio || "No bio yet."}
              </p>
            </div>
          </div>

          {/* Action: Only show FollowButton if it's NOT the logged-in user themselves */}
          <div className="ml-4">
            {!user.isMe ? (
              <FollowButton
                targetUserId={user.id}
                initialIsFollowing={user.isFollowing}
                initialFollowerCount={user.followerCount}
                initialFollowingCount={user.followingCount}
              />
            ) : (
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-300 px-4">
                You
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default FollowersClient;
