"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { MessageSquare, Loader2 } from "lucide-react";
import { createComment, getCommentsByPostId, deleteMyComment, deleteCommentByPostOwner } from "@/actions/comment";
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
    e.preventDefault();
    if (!inputText.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const res = await createComment(postId, inputText);

    if (res.success) {
      // Re-fetch or manually update (Optimistic update)
      const freshComments = await getCommentsByPostId(postId);
      setComments(freshComments.data || []);
      setInputText("");
      onCountChange(1); // Notify parent to +1
      toast.success("Comment shared!");
    } else {
      toast.error(res.error);
    }
    setIsSubmitting(false);
  };

  const handleDelete = async (commentId: string) => {
    // Determine which delete action to use
    const res = currentUserId === postOwnerId 
      ? await deleteCommentByPostOwner(commentId, postId)
      : await deleteMyComment(commentId);

    if (res.success) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
      onCountChange(-1); // Notify parent to -1
    } else {
      toast.error("Failed to delete comment");
    }
  };

  return (
    <div className="space-y-8 mt-10">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-[#5865F2]/10 rounded-xl text-[#5865F2]">
          <MessageSquare size={20} />
        </div>
        <h3 className="text-xl font-black text-gray-900 tracking-tight">Discussion</h3>
      </div>

      {/* Input Area */}
      {currentUserId ? (
        <form onSubmit={handlePostComment} className="relative group">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Share your thoughts or ask a question..."
            className="w-full p-4 pb-14 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-[#5865F2]/20 outline-none transition-all resize-none text-sm font-medium min-h-[100px]"
          />
          <div className="absolute bottom-3 right-3">
            <button
              disabled={isSubmitting || !inputText.trim()}
              className="px-6 py-2 bg-[#5865F2] text-white rounded-xl font-bold text-xs hover:bg-[#4752C4] disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {isSubmitting && <Loader2 size={14} className="animate-spin" />}
              {isSubmitting ? "Posting..." : "Post Comment"}
            </button>
          </div>
        </form>
      ) : (
        <div className="p-6 bg-gray-50 border border-dashed border-gray-200 rounded-2xl text-center">
          <p className="text-sm text-gray-500 font-bold">Please log in to join the discussion.</p>
        </div>
      )}

      {/* List */}
      <div className="space-y-2 divide-y divide-gray-100">
        {loading ? (
          <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-gray-300" /></div>
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
          <p className="text-center py-10 text-gray-400 font-medium text-sm italic">No comments yet. Be the first to break the silence!</p>
        )}
      </div>
    </div>
  );
}