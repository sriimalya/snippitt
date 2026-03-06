"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getUserCollections } from "@/actions/collection/getUserCollections";
import { Collections } from "@/app/components/general/Collection";
import { FolderHeart, ChevronLeft, ChevronRight } from "lucide-react";
import Button from "@/app/components/Button";

const MyCollectionsPage = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [collections, setCollections] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pages: 0,
    total: 0,
  });
  const [isOwner, setIsOwner] = useState(false);

  const currentPage = parseInt(searchParams.get("page") || "1");
  const visibility = searchParams.get("visibility") || "";

  const fetchCollections = useCallback(
    async (page: number, visibilityFilter: string = "") => {
      try {
        setLoading(true);

        const result = await getUserCollections({
          page,
          perPage: 12,
          visibility: visibilityFilter as any,
        });

        if (result.success && result.data) {
          setCollections(result.data.collections);
          setPagination(result.data.pagination);
          setIsOwner(result.data.isOwner);
        }
      } catch (error) {
        console.error("Error fetching collections:", error);
      } finally {
        setLoading(false);
        if (initialLoading) setInitialLoading(false);
      }
    },
    [initialLoading],
  );

  useEffect(() => {
    fetchCollections(currentPage, visibility);
  }, [currentPage, visibility, fetchCollections]);

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`?${params.toString()}`);
  };

  const handleVisibilityFilter = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    params.set("page", "1");

    if (value) params.set("visibility", value);
    else params.delete("visibility");

    router.push(`?${params.toString()}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">

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

      {/* Visibility Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {["", "PUBLIC", "PRIVATE", "FOLLOWERS", "DRAFT"].map((type) => (
          <button
            key={type || "ALL"}
            onClick={() => handleVisibilityFilter(type)}
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
        <div className="bg-white rounded-2xl border p-12 text-center">
          <FolderHeart className="w-10 h-10 text-gray-400 mx-auto mb-4" />

          <h3 className="text-xl font-semibold">No collections yet</h3>

          <p className="text-gray-600 mt-2">
            Create collections to organize your favorite snippets.
          </p>
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
              onClick={() => goToPage(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
              variant="outline"
              size="sm"
            >
              <ChevronLeft size={16} />
            </Button>

            <Button
              onClick={() => goToPage(pagination.currentPage + 1)}
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

export default MyCollectionsPage;