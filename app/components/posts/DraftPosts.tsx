"use client";
import React, { useState, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Plus,
  RefreshCw,
  Filter,
  X,
} from "lucide-react";
import Snippet from "@/app/components/general/Snippitt";
import Button from "@/app/components/Button";
import { Category } from "@/app/generated/prisma/enums";

interface DraftPostsProps {
  initialData: any;
  filters: {
    currentPage: number;
    category: string;
    search?: string;
    sort?: string;
  };
}

const DraftPosts = ({ initialData, filters }: DraftPostsProps) => {
  const { currentPage, category, search = "", sort = "desc" } = filters;
  const [searchInput, setSearchInput] = useState(search);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [isPending, startTransition] = useTransition();

  const posts = initialData?.posts || [];
  const pagination = initialData?.pagination || { pages: 0 };
  const currentUserId = initialData?.currentUserId || "";

  const [menuOpen, setMenuOpen] = useState<string | null>(null);

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
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
            Draft Posts
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Your work in progress. Only you can see these posts until you
            publish them.
          </p>
        </div>
      </header>

      {/* Filters + Controls */}
      <section className="space-y-6">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative w-64">
              <input
                type="text"
                placeholder="Search drafts..."
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
      </section>

      {posts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-primary/50 p-12 text-center">
          <FileText className="w-10 h-10 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold">No drafts yet</h3>
          <p className="text-gray-600 mb-6">
            Start creating posts and they will appear here as drafts until you
            publish them.
          </p>
          <Button onClick={() => router.push("/create-post")}>
            Create Post
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
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

      {pagination.pages > 1 && (
        <div className="flex justify-between items-center mt-10">
          <Button
            variant="outline"
            size="sm"
            disabled={!pagination.hasNextPage || isPending}
            onClick={() =>
              updateFilters({ page: (pagination.currentPage - 1).toString() })
            }
          >
            <ChevronLeft size={16} />
          </Button>

          <p>
            Page {currentPage} of {pagination.pages}
          </p>

          <Button
            variant="outline"
            size="sm"
            disabled={!pagination.hasPrevPage || isPending}
            onClick={() =>
              updateFilters({ page: (pagination.currentPage + 1).toString() })
            }
          >
            <ChevronRight size={16} />
          </Button>
        </div>
      )}
    </div>
  );
};

export default DraftPosts;
