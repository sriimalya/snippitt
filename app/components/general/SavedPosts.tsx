"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Search, Bookmark, Loader2, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Snippet from "@/app/components/general/Snippitt";
import { getSavedPosts } from "@/actions/posts/getSavedPost";
import type { Post } from "@/schemas/post";
import Button from "@/app/components/Button";
import Link from "next/link";

interface SavedPostsClientProps {
  initialPosts: Post[];
  initialPagination: any;
  currentUserId: string;
}

const SavedPosts = ({
  initialPosts,
  initialPagination,
  currentUserId,
}: SavedPostsClientProps) => {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(
    initialPagination
      ? initialPagination.currentPage < initialPagination.pages
      : false,
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstRender = useRef(true);

  const fetchSaved = useCallback(
    async (pageNum: number, search: string, isAppend: boolean = false) => {
      try {
        if (isAppend) setLoadingMore(true);
        else setLoading(true);

        const result = await getSavedPosts({
          page: pageNum,
          perPage: 10,
          search: search,
        });

        if (result.success && result.data) {
          setPosts((prev) =>
            isAppend ? [...prev, ...result.data!.posts] : result.data!.posts,
          );
          setHasMore(
            result.data.pagination.currentPage < result.data.pagination.pages,
          );
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [],
  );

  // Search logic
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    fetchSaved(1, searchTerm, false);
  }, [searchTerm, fetchSaved]);

  // Load more logic
  useEffect(() => {
    if (page > 1) {
      fetchSaved(page, searchTerm, true);
    }
  }, [page, searchTerm, fetchSaved]);

  const handleSearch = (val: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchTerm(val);
      setPage(1);
    }, 500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <Link
            href="/explore"
            className="flex items-center text-sm text-gray-500 hover:text-[#5865F2] mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to Explore
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Bookmark className="w-8 h-8 mr-3 text-[#5865F2] fill-[#5865F2]/10" />
            Saved Snippets
          </h1>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search your saved posts..."
            onChange={(e) => handleSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#5865F2]/20 outline-none transition-all"
          />
        </div>
      </div>

      {/* Grid Content */}
      {loading && page === 1 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="h-80 bg-gray-200 rounded-xl animate-pulse"
            />
          ))}
        </div>
      ) : posts.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence mode="popLayout">
              {posts.map((post) => (
                <motion.div
                  key={post.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Snippet
                    post={post}
                    currentUserId={currentUserId}
                    menuOpen={menuOpen}
                    toggleMenu={(id) =>
                      setMenuOpen(menuOpen === id ? null : id)
                    }
                    showActions={true}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {hasMore && (
            <div className="mt-12 text-center">
              <Button
                onClick={() => setPage((p) => p + 1)}
                variant="theme-primary"
                disabled={loadingMore}
                icon={loadingMore ? <Loader2 className="animate-spin" /> : null}
              >
                {loadingMore ? "Loading..." : "Load More Saved Posts"}
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
          <Bookmark className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">
            No saved snippets found
          </h3>
          <p className="text-gray-500 mt-1">
            {searchTerm
              ? "Try a different search term."
              : "Snippets you save will appear here."}
          </p>
          {!searchTerm && (
            <Link href="/explore">
              <Button variant="theme-primary" className="mt-6">
                Explore Content
              </Button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default SavedPosts;
