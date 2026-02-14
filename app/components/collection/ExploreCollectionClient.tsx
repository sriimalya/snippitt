"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Search, Loader2, FolderOpen, X } from "lucide-react";
import { useInView } from "react-intersection-observer";
import { getExploreCollections } from "@/actions/collection/exploreCollections";
import { useDebounce } from "@/hooks/use-debounce";
import { Collections as CollectionCard } from "@/app/components/general/Collection";

const ExploreCollectionsClient = ({ initialData }: { initialData: any[] }) => {
  // --- State Management ---
  const [items, setItems] = useState(initialData);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [hasMore, setHasMore] = useState(initialData.length === 12);
  const [isLoading, setIsLoading] = useState(false);

  const debouncedSearch = useDebounce(search, 500);
  const { ref, inView } = useInView();

  // Use a ref to track if this is the first time the component is rendering
  const isFirstRender = useRef(true);

  // --- Search Logic ---
  const handleSearch = useCallback(async (query: string) => {
    setIsLoading(true);
    try {
      const res = await getExploreCollections(0, query);
      if (res.success) {
        setItems(res.data);
        setPage(1);
        setHasMore(res.hasMore || false);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // --- Effects ---

  // Effect for Search: Handles debounced input changes
  useEffect(() => {
    // Skip the logic on initial mount because we already have initialData
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // If search is cleared, reset to server-provided initial data without an API call
    if (debouncedSearch.trim() === "") {
      setItems(initialData);
      setPage(1);
      setHasMore(initialData.length === 12);
      return;
    }

    handleSearch(debouncedSearch);
  }, [debouncedSearch, handleSearch, initialData]);

  // Infinite Scroll Logic
  const loadMore = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    const res = await getExploreCollections(page, debouncedSearch);

    if (res.success && res.data.length > 0) {
      setItems((prev) => [...prev, ...res.data]);
      setPage((p) => p + 1);
      setHasMore(res.hasMore || false);
    } else {
      setHasMore(false);
    }
    setIsLoading(false);
  }, [page, debouncedSearch, isLoading, hasMore]);

  // Trigger loadMore when sensor is in view
  useEffect(() => {
    if (inView && hasMore && !isLoading) {
      loadMore();
    }
  }, [inView, hasMore, isLoading, loadMore]);

  return (
    <div className="space-y-10">
      {/* Search Bar */}
      <div className="relative max-w-lg mx-auto">
        <Search
          className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400"
          size={18}
        />
        <input
          type="text"
          placeholder="Search collections..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-12 py-4 bg-white border border-gray-100 rounded-[2rem] shadow-sm focus:ring-4 focus:ring-[#5865F2]/5 outline-none font-medium transition-all"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Grid */}
      {/* Replace your previous grid mapping with this single line */}
      <div className="w-full">
        <CollectionCard
          collections={items}
          variant="grid"
          showCoverImage={true}
        />
      </div>

      {/* Loading & Status Sensor */}
      <div
        ref={ref}
        className="py-20 flex flex-col items-center justify-center gap-4"
      >
        {isLoading && (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="animate-spin text-[#5865F2]" size={32} />
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Loading...
            </span>
          </div>
        )}

        {!hasMore && items.length > 0 && (
          <p className="text-gray-300 font-bold uppercase text-[10px] tracking-widest italic">
            End of the feed
          </p>
        )}

        {!isLoading && items.length === 0 && (
          <div className="text-center py-10">
            <FolderOpen className="mx-auto text-gray-100 mb-4" size={64} />
            <p className="text-gray-400 font-medium italic">
              No collections match &quot;{search}&quot;
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExploreCollectionsClient;
