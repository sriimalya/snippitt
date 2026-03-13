// CommentSection.tsx
"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, SendHorizonal } from "lucide-react";
import {
  createComment,
  getCommentsByPostId,
  deleteMyComment,
  deleteCommentByPostOwner,
} from "@/actions/comment";
import { CommentItem } from "./CommentItem";

export default function CommentSection({ postId, postOwnerId, currentUserId, onCountChange }: any) {
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inputText, setInputText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    async function fetchComments() {
      const res = await getCommentsByPostId(postId);
      if (res.success) setComments(res.data || []);
      setLoading(false);
    }
    fetchComments();
  }, [postId]);

  const handlePostComment = async (e: React.FormEvent) => {
    if (!inputText.trim() || isSubmitting) return;
    setIsSubmitting(true);
    const res = await createComment(postId, inputText);
    if (res.success) {
      const freshComments = await getCommentsByPostId(postId);
      setComments(freshComments.data || []);
      setInputText("");
      onCountChange(1);
      toast.success("Comment posted!");
    } else {
      toast.error(res.error);
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (commentId: string) => {
    const res =
      currentUserId === postOwnerId
        ? await deleteCommentByPostOwner(commentId, postId)
        : await deleteMyComment(commentId);
    if (res.success) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      onCountChange(-1);
    } else {
      toast.error("Failed to delete comment");
    }
  };

  return (
    <div className="space-y-4">
      {/* Input */}
      {currentUserId ? (
        <form onSubmit={handlePostComment} className="space-y-2">
          <div className="relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)){
                  e.preventDefault();
                  handlePostComment(e);
                } 
              }}
              placeholder="Write a comment…"
              rows={3}
              className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 focus:bg-white outline-none transition-all resize-none text-sm text-gray-700 placeholder-gray-300"
            />
            <button
              type="submit"
              disabled={isSubmitting || !inputText.trim()}
              className="absolute bottom-3 right-3 p-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 text-white rounded-lg transition-all disabled:cursor-not-allowed"
            >
              {isSubmitting
                ? <Loader2 size={13} className="animate-spin" />
                : <SendHorizonal size={13} />
              }
            </button>
          </div>
          <p className="text-[10px] text-gray-300 text-right">Ctrl / ⌘ + Enter to post</p>
        </form>
      ) : (
        <div className="px-4 py-3.5 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-center">
          <p className="text-xs font-medium text-gray-400">
            <span className="text-indigo-500 font-semibold">Log in</span> to join the discussion
          </p>
        </div>
      )}

      {/* List */}
      <div className="space-y-1">
        {loading ? (
          <div className="py-8 flex justify-center">
            <Loader2 size={18} className="animate-spin text-gray-300" />
          </div>
        ) : comments.length > 0 ? (
          comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              postOwnerId={postOwnerId}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <div className="py-8 text-center space-y-1">
            <p className="text-sm font-semibold text-gray-400">No comments yet</p>
            <p className="text-xs text-gray-300">Be the first to share your thoughts</p>
          </div>
        )}
      </div>
    </div>
  );
}