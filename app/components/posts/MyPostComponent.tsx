"use client";

import React, { useState, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Snippet from "@/app/components/general/Snippitt";
import Button from "@/app/components/Button";
import { Category } from "@/app/generated/prisma/enums";
import {
  ChevronLeft,
  ChevronRight,
  Grid,
  List,
  Filter,
  Plus,
  RefreshCw,
  FileText,
  MessageCircle,
  Bookmark,
  Heart,
  X,
} from "lucide-react";

interface MyPostComponentProps {
  initialData: any;
  filters: {
    currentPage: number;
    category: string;
    visibility: string;
    search?: string;
    sort?: string;
  };
}

const MyPostComponent = ({ initialData, filters }: MyPostComponentProps) => {
  const {
    currentPage,
    category,
    visibility,
    search = "",
    sort = "desc",
  } = filters;
  const [searchInput, setSearchInput] = useState(search);
  const searchParams = useSearchParams();
  const router = useRouter();

  // Use transition to show a loading state during server re-fetches
  const [isPending, startTransition] = useTransition();

  const posts = initialData?.posts || [];
  const pagination = initialData?.pagination || {};
  const currentUserId = initialData?.currentUserId || "";

  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Helper to update URL and trigger Server Component re-fetch
  const updateFilters = (newParams: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(newParams).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });

    // Always reset to page 1 when changing filters (unless specifically navigating pages)
    if (!newParams.page) params.set("page", "1");

    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  const categories = Object.values(Category);

  return (
    <div
      className={`max-w-7xl mx-auto px-6 py-10 space-y-10 transition-opacity ${isPending ? "opacity-60" : "opacity-100"}`}
    >
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
            My Snippets
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage your content, visibility, and performance
          </p>
        </div>

        <Link href="/create-post" className="w-full sm:w-auto">
          <Button
            variant="primary"
            size="md"
            className="flex items-center justify-center gap-1 w-full sm:w-auto"
          >
            <Plus size={16} />
            New Post
          </Button>
        </Link>
      </header>

      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          value={pagination.totalPosts || 0}
          label="Total Posts"
          icon={<FileText className="w-5 h-5 text-[#5865F2]" />}
          bgColor="bg-indigo-50"
        />
        <StatCard
          value={posts.reduce(
            (sum: number, p: any) => sum + (p._count?.likes || 0),
            0,
          )}
          label="Total Likes"
          icon={<Heart className="w-5 h-5 text-red-600" />}
          bgColor="bg-rose-50"
        />
        <StatCard
          value={posts.reduce(
            (sum: number, p: any) => sum + (p._count?.comments || 0),
            0,
          )}
          label="Total Comments"
          icon={<MessageCircle className="w-5 h-5 text-blue-600" />}
          bgColor="bg-blue-50"
        />
        <StatCard
          value={posts.reduce(
            (sum: number, p: any) => sum + (p._count?.savedBy || 0),
            0,
          )}
          label="Saved By"
          icon={<Bookmark className="w-5 h-5 text-purple-600" />}
          bgColor="bg-purple-50"
        />
      </div>

      {/* Filters + Controls */}
      <section className="space-y-6">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative w-64">
              <input
                type="text"
                placeholder="Search posts..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    updateFilters({ search: searchInput });
                  }
                }}
                className="w-full pl-4 pr-10 py-3 bg-white border border-gray-200 rounded-2xl text-sm text-gray-700 shadow-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 appearance-none"
              />
              {searchInput && (
                <button
                  onClick={() => {
                    setSearchInput("");
                    updateFilters({ search: null });
                  }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => updateFilters({ sort: e.target.value })}
                className="pl-4 pr-10 py-3 bg-white border border-gray-200 rounded-2xl text-sm text-gray-700 shadow-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 appearance-none"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <Filter className="w-4 h-4 text-gray-400" />
              </div>
            </div>

            {/* Category Dropdown */}
            <div className="relative w-48">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={category}
                onChange={(e) => updateFilters({ category: e.target.value })}
                className="w-full pl-11 pr-10 py-3 bg-white border border-gray-200 rounded-2xl text-sm text-gray-700 shadow-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 appearance-none"
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {category && (
              <div className="flex items-center gap-2 bg-indigo-50 text-indigo-600 text-xs px-3 py-1.5 rounded-full">
                {category}
                <button onClick={() => updateFilters({ category: null })}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* View Toggle & Refresh */}
          <div className="flex items-center gap-4">
            <div className="flex bg-gray-100 rounded-2xl p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`px-4 py-2 rounded-xl text-sm flex items-center gap-2 ${viewMode === "grid" ? "bg-white shadow text-indigo-600" : "text-gray-500"}`}
              >
                <Grid size={16} /> Grid
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-4 py-2 rounded-xl text-sm flex items-center gap-2 ${viewMode === "list" ? "bg-white shadow text-indigo-600" : "text-gray-500"}`}
              >
                <List size={16} /> List
              </button>
            </div>

            <button
              onClick={handleRefresh}
              disabled={isPending}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <RefreshCw
                className={`w-5 h-5 text-gray-600 ${isPending ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* Visibility Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {["", "PUBLIC", "PRIVATE", "FOLLOWERS", "DRAFT"].map((type) => (
            <button
              key={type || "ALL"}
              onClick={() => updateFilters({ visibility: type || null })}
              className={`px-3 py-1.5 text-xs rounded-full border transition ${
                (visibility || "") === type
                  ? "bg-[#5865F2] text-white border-[#5865F2]"
                  : "bg-white text-gray-600 border-gray-200 hover:border-[#5865F2] hover:text-[#5865F2]"
              }`}
            >
              {type || "ALL"}
            </button>
          ))}
        </div>
      </section>

      {/* Content Rendering */}
      {posts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-primary/50 p-12 text-center">
          <FileText className="w-10 h-10 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold">No snippets found</h3>
          <p className="text-gray-600 mb-6">
            Start sharing your snippets with the community.
          </p>
          <Button onClick={() => router.push("/create-post")}>
            <Plus className="w-4 h-4 mr-1" /> Create Snippet
          </Button>
        </div>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              : "flex flex-col gap-4"
          }
        >
          {posts.map((post: any) => (
            <Snippet
              key={post.id}
              post={post}
              menuOpen={menuOpen}
              toggleMenu={setMenuOpen}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-8 border-t">
          <p className="text-sm text-gray-600">
            Page {pagination.currentPage} of {pagination.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              onClick={() =>
                updateFilters({ page: (pagination.currentPage - 1).toString() })
              }
              disabled={!pagination.hasPrevPage || isPending}
              variant="outline"
              size="sm"
            >
              <ChevronLeft size={16} />
            </Button>
            <Button
              onClick={() =>
                updateFilters({ page: (pagination.currentPage + 1).toString() })
              }
              disabled={!pagination.hasNextPage || isPending}
              variant="outline"
              size="sm"
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ value, label, icon, bgColor }: any) => (
  <div className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-3xl font-black text-gray-900 tabular-nums">
          {value}
        </p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
      <div
        className={`w-10 h-10 ${bgColor} rounded-xl flex items-center justify-center`}
      >
        {icon}
      </div>
    </div>
  </div>
);

export default MyPostComponent;
