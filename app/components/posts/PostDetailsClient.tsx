"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Calendar, MessageCircle, Share2, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

import LikeButton from "@/app/components/general/LikeButton";
import ToggleSaveButton from "@/app/components/general/ToggleSaveButton";
import CommentSection from "../comment/CommentSection";

const PostDetailClient = ({ post, currentUserId }: any) => {
  const router = useRouter();
  const [commentCount, setCommentCount] = useState(post._count.comments || 0);
  const [formattedDate, setFormattedDate] = React.useState<string>("");
  const handleCountChange = (delta: number) =>
    setCommentCount((prev: number) => prev + delta);
  React.useEffect(() => {
    setFormattedDate(format(new Date(post.createdAt), "MMM dd, yyyy"));
  }, [post.createdAt]);
  return (
    <div className="max-w-6xl mx-auto px-4 py-8 font-sans">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-8 transition font-bold text-sm"
      >
        <ArrowLeft size={18} /> Back to Explore
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* LEFT: Media Gallery */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-4">
            {post.images.map((img: any, idx: number) => (
              <div
                key={img.id}
                className="relative w-full rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm bg-gray-50"
              >
                <Image
                  src={img.url}
                  alt={`${post.title} - image ${idx + 1}`}
                  width={1200}
                  height={800}
                  className="w-full h-auto object-cover"
                  priority={idx === 0}
                  unoptimized // S3 presigned URLs work better unoptimized
                />
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Content & Interactions */}
        <div className="lg:col-span-5 space-y-8">
          {/* Author & Header */}
          <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <Link
                href={`/profile/${post.user.id}`}
                className="flex items-center gap-3 group"
              >
                <div className="relative h-12 w-12 rounded-2xl overflow-hidden border-2 border-transparent group-hover:border-[#5865F2] transition-all">
                  {post.user.avatar ? (
                    <Image
                      src={post.user.avatar}
                      alt={post.user.username}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-[#5865F2]/10 flex items-center justify-center font-bold text-[#5865F2]">
                      {post.user.username[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="font-black text-gray-900 group-hover:text-[#5865F2] transition-colors">
                    @{post.user.username}
                  </h4>
                  <p className="text-xs text-gray-400 font-bold flex items-center gap-1.5 uppercase tracking-wider">
                    <Calendar size={12} />{" "}
                    {formattedDate || "Loading date..."}
                  </p>
                </div>
              </Link>

              <div className="flex items-center gap-2">
                <ToggleSaveButton
                  postId={post.id}
                  initialIsSaved={post.isSaved}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h1 className="text-3xl font-black text-gray-900 tracking-tight leading-none">
                {post.title}
              </h1>
              <p className="text-gray-600 leading-relaxed font-medium">
                {post.description}
              </p>
            </div>

            {/* Interaction Bar */}
            <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <LikeButton
                    postId={post.id}
                    initialIsLiked={post.isLiked}
                    initialLikeCount={post._count.likes}
                  />
                </div>
                <div className="flex items-center gap-2 text-gray-400 font-black text-sm">
                  <MessageCircle size={22} />
                  <span>{commentCount}</span>
                </div>
              </div>

              <button className="p-3 bg-gray-50 text-gray-400 rounded-2xl hover:bg-[#5865F2]/10 hover:text-[#5865F2] transition-all">
                <Share2 size={20} />
              </button>
            </div>
          </div>

          {/* Comment Section Integration */}
          <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
            <CommentSection
              postId={post.id}
              postOwnerId={post.user.id}
              currentUserId={currentUserId}
              onCountChange={handleCountChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetailClient;
