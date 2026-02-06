"use client";

import Image from "next/image";
import { Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";

interface CommentItemProps {
  comment: any;
  currentUserId: string | null;
  postOwnerId: string;
  onDelete: (id: string) => void;
}

export const CommentItem = ({ comment, currentUserId, postOwnerId, onDelete }: CommentItemProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  
  const isAuthor = currentUserId === comment.user.id;
  const isPostOwner = currentUserId === postOwnerId;
  const canDelete = isAuthor || isPostOwner;

  const handleDelete = async () => {
    if (!confirm("Delete this comment?")) return;
    setIsDeleting(true);
    await onDelete(comment.id);
    setIsDeleting(false);
  };

  return (
    <div className={`group flex gap-4 p-4 rounded-2xl transition-colors hover:bg-gray-50 ${isDeleting ? "opacity-50 grayscale" : ""}`}>
      {/* Avatar */}
      <div className="relative h-10 w-10 flex-shrink-0">
        {comment.user.avatar ? (
          <Image
            src={comment.user.avatar}
            alt={comment.user.username}
            fill
            className="rounded-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-[#5865F2]/10 text-[#5865F2] rounded-full flex items-center justify-center font-bold">
            {comment.user.username[0].toUpperCase()}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-grow space-y-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-900 text-sm">{comment.user.username}</span>
            <span className="text-[10px] text-gray-400 font-medium">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </span>
            {isPostOwner && comment.user.id === postOwnerId && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[9px] font-black uppercase rounded-md tracking-widest">Author</span>
            )}
          </div>

          {canDelete && (
            <button 
              onClick={handleDelete}
              className="p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all active:scale-90"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
        <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-wrap">
          {comment.content}
        </p>
      </div>
    </div>
  );
};