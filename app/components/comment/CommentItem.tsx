// CommentItem.tsx
"use client";

import Image from "next/image";
import { Trash2, Loader2, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import Button from "../Button";

interface CommentItemProps {
  comment: any;
  currentUserId: string | null;
  postOwnerId: string;
  onDelete: (id: string) => void;
}

export const CommentItem = ({
  comment,
  currentUserId,
  postOwnerId,
  onDelete,
}: CommentItemProps) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const isAuthor = currentUserId === comment.user.id;
  const isPostOwner = currentUserId === postOwnerId;
  const isCommentByPostOwner = comment.user.id === postOwnerId;
  const canDelete = isAuthor || isPostOwner;

  const handleDelete = async () => {
    setIsDeleting(true);
    await onDelete(comment.id);
    setIsDeleting(false);
  };

  return (
    <div
      className={"group flex gap-3 px-3 py-3 rounded-xl transition-colors"}
    >
      {/* Avatar */}
      <div className="relative h-8 w-8 flex-shrink-0 mt-0.5">
        {comment.user.avatar ? (
          <Image
            src={comment.user.avatar}
            alt={comment.user.username}
            fill
            className="rounded-full object-cover"
            unoptimized
          />
        ) : (
          <div className="h-full w-full bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">
            {comment.user.username[0].toUpperCase()}
          </div>
        )}
      </div>

      {/* Bubble */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="bg-gray-50 rounded-xl rounded-tl-none px-3 py-2.5 space-y-1">
          {/* Name row */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-gray-900">
              {comment.user.username}
            </span>
            {isCommentByPostOwner && (
              <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-500 border border-indigo-100 text-[9px] font-bold uppercase rounded tracking-widest">
                Author
              </span>
            )}
            {isAuthor && !isCommentByPostOwner && (
              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-400 text-[9px] font-bold uppercase rounded tracking-widest">
                You
              </span>
            )}
          </div>
          {/* Text */}
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap break-words">
            {comment.content}
          </p>
        </div>

        {/* Meta row */}
        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] text-gray-400">
            {formatDistanceToNow(new Date(comment.createdAt), {
              addSuffix: true,
            })}
          </span>
          {canDelete && (
            <button
              onClick={() => setIsOpen(true)}
              disabled={isDeleting}
              className="flex items-center gap-1 text-[10px] font-medium text-red-600 group-hover:opacity-100 transition-all"
            >
              {isDeleting ? (
                <Loader2 size={10} className="animate-spin" />
              ) : (
                <Trash2 size={10} />
              )}
              {"Delete"}
            </button>
          )}

          {/* Modal */}
          {isOpen && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-auto">
                <div className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mr-3">
                      <AlertCircle className="w-5 h-5 text-red-600" />
                    </div>
                    <div >
                      <h3 className="font-semibold text-gray-900 text-lg">
                        Delete Comment
                      </h3>
                      <p className="text-sm text-gray-500">
                        This action cannot be undone
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 space-x-3">
                    <Button
                      onClick={handleDelete}
                      variant="primary"
                      className="flex-1 w-full"
                      icon={<Trash2 className="w-4 h-4" />}
                      disabled={isDeleting}
                    >
                      {isDeleting ? "Deleting..." : "Delete Comment"}
                    </Button>
                    <Button
                      onClick={() => setIsOpen(false)}
                      variant="outline"
                      className="flex-1 w-full"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
