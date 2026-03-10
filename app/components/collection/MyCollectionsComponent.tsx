"use client";

import { useState, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Collections } from "@/app/components/collection/Collection";
import {
  FolderHeart,
  ChevronLeft,
  ChevronRight,
  X,
  Filter,
} from "lucide-react";
import Button from "@/app/components/Button";

interface MyCollectionsComponentProps {
  initialData: any;
  filters: {
    currentPage: number;
    visibility: string;
    search?: string;
    sort?: string;
  };
}

const MyCollectionsComponent = ({
  initialData,
  filters,
}: MyCollectionsComponentProps) => {
  const { visibility, search = "", sort = "desc" } = filters;
  const [searchInput, setSearchInput] = useState(search);
  const searchParams = useSearchParams();
  const router = useRouter();

  const [isPending, startTransition] = useTransition();
  const collections = initialData?.collections || [];
  const pagination = initialData?.pagination || {
    currentPage: 1,
    pages: 0,
    total: 0,
  };
  const isOwner = initialData?.isOwner || false;

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

  return (
    <div
      className={`max-w-7xl mx-auto px-6 py-10 space-y-10 transition-opacity ${isPending ? "opacity-60" : "opacity-100"}`}
    >
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
            My Collections
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Organize and manage your saved snippets
          </p>
        </div>
      </header>

      {/* Search & Sort */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search collections..."
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
      </div>

      {/* Visibility Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {["", "PUBLIC", "PRIVATE", "FOLLOWERS", "DRAFT"].map((type) => (
          <button
            key={type || "ALL"}
            onClick={() => updateFilters({ visibility: type || null })}
            className={`px-3 py-1.5 text-xs rounded-full border transition ${
              visibility === type
                ? "bg-[#5865F2] text-white border-[#5865F2]"
                : "bg-white text-gray-600 border-gray-200 hover:border-[#5865F2] hover:text-[#5865F2]"
            }`}
          >
            {type || "ALL"}
          </button>
        ))}
      </div>

      {/* Content */}
      {collections.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-primary/50 p-12 text-center">
          <FolderHeart className="w-10 h-10 text-gray-400 mx-auto mb-4" />

          <h3 className="text-xl font-semibold">No collections yet</h3>

          <p className="text-gray-600 m-2">
            Create collections to organize your favorite snippets.
          </p>

          <Button variant="primary" size="md">
            <Link href="/explore/posts" className="flex items-center gap-2">
              Explore Posts
            </Link>
          </Button>
        </div>
      ) : (
        <Collections
          collections={collections}
          variant="grid"
          isOwner={isOwner}
        />
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-between pt-8 border-t">
          <p className="text-sm text-gray-600">
            Page {pagination.currentPage} of {pagination.pages}
          </p>

          <div className="flex items-center gap-2">
            <Button
              onClick={() =>
                updateFilters({ page: (pagination.currentPage - 1).toString() })
              }
              disabled={pagination.currentPage === 1}
              variant="outline"
              size="sm"
            >
              <ChevronLeft size={16} />
            </Button>

            <Button
              onClick={() =>
                updateFilters({ page: (pagination.currentPage + 1).toString() })
              }
              disabled={pagination.currentPage === pagination.pages}
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

export default MyCollectionsComponent;
