"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Loader2, ChevronDown } from "lucide-react";
import Snippet from "@/app/components/general/Snippitt";
import { getExplorePosts } from "@/actions/posts/explore";
import { Category } from "@/app/generated/prisma/enums";
import type { Post } from "@/schemas/post";
import Button from "@/app/components/Button";

interface ExploreProps {
  initialPosts: Post[];
  initialPagination: {
    total: number;
    pages: number;
    currentPage: number;
  } | undefined;
}

const PostSkeleton = () => (
  <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm animate-pulse">
    <div className="h-48 bg-gray-200 w-full" />
    <div className="p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-8 h-8 bg-gray-200 rounded-full" />
        <div className="flex-1">
          <div className="h-3 bg-gray-200 rounded w-24 mb-2" />
          <div className="h-2 bg-gray-200 rounded w-16" />
        </div>
      </div>
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
      <div className="h-3 bg-gray-200 rounded w-full mb-1" />
      <div className="h-3 bg-gray-200 rounded w-2/3" />
    </div>
  </div>
);

const Explore = ({ initialPosts, initialPagination }: ExploreProps) => {
  // 1. Initialize state with Server Data
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [loading, setLoading] = useState(false); // False because we have initial data
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(initialPagination?.currentPage || 1);
  const [hasMore, setHasMore] = useState(
    initialPagination ? initialPagination.currentPage < initialPagination.pages : false
  );
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  // Track if we've already done the first render to prevent duplicate fetching
  const isFirstRender = useRef(true);

  const fetchPosts = useCallback(async (pageNum: number, search: string, category: string, isAppend: boolean = false) => {
    try {
      if (isAppend) setLoadingMore(true);
      else setLoading(true);

      const result = await getExplorePosts({
        page: pageNum,
        perPage: 9,
        search: search,
        category: category || undefined,
      });

      if (result.success && result.data) {
        setPosts(prev => isAppend ? [...prev, ...result.data!.posts] : result.data!.posts);
        setHasMore(result.data.pagination.currentPage < result.data.pagination.pages);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Handle Search Input with Debounce
  const handleSearchChange = (val: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchTerm(val);
      setPage(1);
    }, 500);
  };

  // 2. Modified Filter Fetch: Skip on initial mount
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    fetchPosts(1, searchTerm, selectedCategory, false);
  }, [searchTerm, selectedCategory, fetchPosts]);

  // 3. Load More Fetch
  useEffect(() => {
    // Only fetch if page is beyond the initial page provided by server
    if (page > (initialPagination?.currentPage || 1)) {
      fetchPosts(page, searchTerm, selectedCategory, true);
    }
  }, [page, fetchPosts, initialPagination]);

  const toggleMenu = (id: string) => setMenuOpen(menuOpen === id ? null : id);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header & Search Bar */}
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">Explore Snippets</h1>
          <p className="text-gray-600 max-w-2xl mx-auto mb-8">
            Discover code tutorials, film reflections, and projects from the community.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4 max-w-4xl mx-auto">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by title or description..."
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-[#5865F2]/20 focus:border-[#5865F2] outline-none transition-all"
              />
            </div>

            <div className="relative w-full md:w-auto">
              <button 
                onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                className="w-full md:w-48 flex items-center justify-between px-4 py-3 bg-white border border-gray-200 rounded-2xl shadow-sm hover:border-[#5865F2] transition-all"
              >
                <span className="text-sm font-medium text-gray-700">
                  {selectedCategory ? selectedCategory.replace(/_/g, ' ') : "All Categories"}
                </span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showCategoryDropdown && (
                <div className="absolute top-full mt-2 w-full bg-white border border-gray-100 rounded-xl shadow-xl z-50 py-2 animate-in fade-in slide-in-from-top-2">
                  <button 
                    onClick={() => { setSelectedCategory(""); setShowCategoryDropdown(false); setPage(1); }}
                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 text-gray-700"
                  >
                    All Categories
                  </button>
                  {Object.values(Category).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => { setSelectedCategory(cat); setShowCategoryDropdown(false); setPage(1); }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-[#5865F2]/5 hover:text-[#5865F2] transition-colors"
                    >
                      {cat.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Area */}
        {loading && page === 1 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => <PostSkeleton key={i} />)}
          </div>
        ) : posts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <AnimatePresence mode="popLayout">
                {posts.map((post) => (
                  <motion.div
                    key={post.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Snippet
                      post={post}
                      menuOpen={menuOpen}
                      currentUserId={post.user.id}
                      toggleMenu={toggleMenu}
                      showActions={true}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {hasMore && (
              <div className="mt-12 text-center">
                <Button
                  onClick={() => setPage(p => p + 1)}
                  variant="theme-primary"
                  size="lg"
                  disabled={loadingMore}
                  className="px-10"
                  icon={loadingMore ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                >
                  {loadingMore ? "Loading..." : "Show More Posts"}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-3xl border border-dashed border-gray-300 p-20 text-center">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No snippets found</h3>
            <p className="text-gray-500 mb-8">Try adjusting your filters or search keywords.</p>
            <Button variant="outline" onClick={() => { setSearchTerm(""); setSelectedCategory(""); setPage(1); }}>
              Clear All Filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Explore;