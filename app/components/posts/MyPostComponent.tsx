"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Snippet from "@/app/components/general/Snippitt";
import { getMyPosts } from "@/actions/posts/getMyPosts";
import Button from "@/app/components/Button";
import { 
  Loader2, 
  ChevronLeft, 
  ChevronRight, 
  Grid, 
  List, 
  Filter, 
  Plus, 
  Search, 
  RefreshCw, 
  FileText, 
  Eye, 
  MessageCircle, 
  Bookmark,
  Heart,
  X
} from "lucide-react";
import type { Post } from "@/schemas/post";

const MyPostComponent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    perPage: 10,
    totalPages: 0,
    totalPosts: 0,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [currentUserId, setCurrentUserId] = useState("");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const currentPage = parseInt(searchParams.get("page") || "1");
  const category = searchParams.get("category") || "";

  const fetchPosts = useCallback(async (page: number, categoryFilter: string = "") => {
    try {
      setLoading(true);
      const result = await getMyPosts({
        page,
        perPage: 10,
        category: categoryFilter,
      });

      if (result.success && result.data) {
        setPosts(result.data.posts);
        setPagination(result.data.pagination);
        setCurrentUserId(result.data.currentUserId);
      }
    } catch (error) {
      console.error("Error fetching posts:", error);
    } finally {
      setLoading(false);
      if (initialLoading) setInitialLoading(false);
    }
  }, [initialLoading]);

  useEffect(() => {
    fetchPosts(currentPage, category);
    if (category !== selectedCategory) {
      setSelectedCategory(category);
    }
  }, [currentPage, category, fetchPosts, selectedCategory]);

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    if (selectedCategory) params.set("category", selectedCategory);
    router.push(`?${params.toString()}`);
  };

  const handleCategoryFilter = (category: string) => {
    const params = new URLSearchParams();
    params.set("page", "1");
    if (category) {
      params.set("category", category);
      setSelectedCategory(category);
    } else {
      params.delete("category");
      setSelectedCategory("");
    }
    router.push(`?${params.toString()}`);
  };

  const toggleMenu = (id: string) => {
    setMenuOpen(menuOpen === id ? null : id);
  };

  const handleCreatePost = () => {
    router.push("/create-post");
  };

  const categories = Array.from(new Set(posts.map(post => post.category)));

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="relative inline-block">
            <div className="w-16 h-16 border-4 border-[#5865F2]/20 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-[#5865F2] border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
          <p className="mt-4 text-gray-600 font-medium">Loading your posts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Snippets</h1>
              <p className="text-gray-600">Manage and organize all your code snippets in one place</p>
            </div>
            <Button
              onClick={handleCreatePost}
              variant="theme-primary"
              icon={<Plus className="w-4 h-4" />}
            >
              Create New Snippet
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Posts</p>
                  <p className="text-2xl font-bold text-gray-900">{pagination.totalPosts}</p>
                </div>
                <div className="w-10 h-10 bg-[#5865F2]/10 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-[#5865F2]" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Likes</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {posts.reduce((sum, post) => sum + (post._count?.likes || 0), 0)}
                  </p>
                </div>
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <Heart className="w-5 h-5 text-red-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Total Comments</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {posts.reduce((sum, post) => sum + (post._count?.comments || 0), 0)}
                  </p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Saved By</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {posts.reduce((sum, post) => sum + (post._count?.savedBy || 0), 0)}
                  </p>
                </div>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Bookmark className="w-5 h-5 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1 flex items-center gap-3">
                {/* Category Filter styled like a Search Bar area */}
                <div className="relative max-w-xs w-full">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => handleCategoryFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5865F2]/30 bg-white appearance-none text-sm"
                  >
                    <option value="">All Categories</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                
                {selectedCategory && (
                  <button 
                    onClick={() => handleCategoryFilter("")}
                    className="text-sm text-gray-500 hover:text-red-500 flex items-center gap-1"
                  >
                    <X className="w-4 h-4" /> Clear
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center bg-gray-100 rounded-lg p-1 mr-2">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-1.5 rounded-md transition ${viewMode === "grid" ? "bg-white shadow-sm text-[#5865F2]" : "text-gray-500"}`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-1.5 rounded-md transition ${viewMode === "list" ? "bg-white shadow-sm text-[#5865F2]" : "text-gray-500"}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
                <Button
                  onClick={() => fetchPosts(currentPage, selectedCategory)}
                  variant="outline"
                  size="sm"
                  disabled={loading}
                  icon={<RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />}
                >
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {posts.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No snippets found</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Start sharing your code snippets or projects with the community.
            </p>
            <Button
              onClick={handleCreatePost}
              variant="theme-primary"
              size="lg"
              icon={<Plus className="w-5 h-5" />}
            >
              Create Your First Snippet
            </Button>
          </div>
        ) : (
          <div className="relative">
            {loading && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-xl" />
            )}
            
            <div className={viewMode === "grid" 
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
              : "flex flex-col gap-4"
            }>
              {posts.map((post) => (
                <div key={post.id} className={viewMode === "list" ? "bg-white rounded-xl border border-gray-100 p-2" : ""}>
                  <Snippet
                    post={post}
                    menuOpen={menuOpen}
                    toggleMenu={toggleMenu}
                    currentUserId={currentUserId}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pagination Section */}
        {pagination.totalPages > 1 && (
          <div className="mt-10 pt-8 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-600">
              Showing <span className="font-medium">{(pagination.currentPage - 1) * pagination.perPage + 1}</span> to{" "}
              <span className="font-medium">{Math.min(pagination.currentPage * pagination.perPage, pagination.totalPosts)}</span> of{" "}
              <span className="font-medium">{pagination.totalPosts}</span> snippets
            </p>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={() => goToPage(pagination.currentPage - 1)}
                disabled={!pagination.hasPrevPage || loading}
                variant="outline"
                size="sm"
                icon={<ChevronLeft className="w-4 h-4" />}
              >
                Prev
              </Button>
              
              <div className="hidden sm:flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNum = i + 1; // Simplified for brevity, same as your logic
                  return (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition ${
                        pagination.currentPage === pageNum
                          ? "bg-[#5865F2] text-white"
                          : "bg-white border border-gray-200 text-gray-700 hover:border-[#5865F2] hover:text-[#5865F2]"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <Button
                onClick={() => goToPage(pagination.currentPage + 1)}
                disabled={!pagination.hasNextPage || loading}
                variant="outline"
                size="sm"
                icon={<ChevronRight className="w-4 h-4" />}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyPostComponent;