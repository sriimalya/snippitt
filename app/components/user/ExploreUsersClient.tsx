"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Search, Loader2, User, X } from "lucide-react";
import { useInView } from "react-intersection-observer";
import { getExploreUsers } from "@/actions/user/exploreUser";
import { useDebounce } from "@/hooks/use-debounce";

interface UserItem {
  id: string;
  username: string;
  avatar: string | null;
}

interface ExploreUsersClientProps {
  initialUsers: UserItem[];
}

const ExploreUsersClient = ({ initialUsers }: ExploreUsersClientProps) => {
  // --- State ---
  const [users, setUsers] = useState<UserItem[]>(initialUsers);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [hasMore, setHasMore] = useState(initialUsers.length === 50);
  const [isLoading, setIsLoading] = useState(false);

  const debouncedSearch = useDebounce(search, 500);
  const { ref, inView } = useInView({ threshold: 0 });
  const isFirstRender = useRef(true);

  const clearSearch = () => {
    setSearch("");
    setUsers(initialUsers);
    setPage(1);
    setHasMore(initialUsers.length === 50);
  };

  const handleSearch = useCallback(async (query: string) => {
    setIsLoading(true);
    try {
      const result = await getExploreUsers(0, query);
      if (result.success && result.data) {
        setUsers(result.data);
        setPage(1);
        setHasMore(result.data.length === 50);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (debouncedSearch.trim() === "") {
      setUsers(initialUsers);
      setPage(1);
      setHasMore(initialUsers.length === 50);
    } else {
      handleSearch(debouncedSearch);
    }
  }, [debouncedSearch, handleSearch, initialUsers]);

  // --- Infinite Scroll Handler ---
  const loadMoreUsers = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const result = await getExploreUsers(page, debouncedSearch);
      if (result.success && result.data && result.data.length > 0) {
        setUsers((prev) => [...prev, ...result.data!]);
        setPage((prev) => prev + 1);
        setHasMore(result.data.length === 50);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error("Load more error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, isLoading, hasMore]);

  // --- Trigger Load More when in view ---
  useEffect(() => {
    if (inView && hasMore && !isLoading) {
      loadMoreUsers();
    }
  }, [inView, hasMore, isLoading, loadMoreUsers]);

  return (
    <div className="space-y-12">
      {/* Search Bar Container */}
      <div className="relative max-w-md mx-auto">
        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-gray-400">
          <Search size={18} />
        </div>

        <input
          type="text"
          placeholder="Search by username..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-12 pr-12 py-4 bg-white border border-gray-100 rounded-[2rem] shadow-sm focus:ring-4 focus:ring-[#5865F2]/5 focus:border-[#5865F2] outline-none transition-all font-medium text-gray-700"
        />

        {/* Clear Search Button */}
        {search.length > 0 && (
          <button
            onClick={clearSearch}
            className="absolute inset-y-0 right-4 flex items-center px-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={18} className="bg-gray-100 rounded-full p-0.5" />
          </button>
        )}
      </div>

      {/* Grid List */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {users.map((user) => (
          <Link
            key={user.id}
            href={`/profile/${user.id}`}
            className="group bg-white p-6 rounded-[2.5rem] border border-gray-50 shadow-sm hover:shadow-2xl hover:shadow-[#5865F2]/10 hover:-translate-y-2 transition-all duration-300 text-center"
          >
            <div className="relative w-20 h-20 mx-auto mb-4 rounded-[1.8rem] overflow-hidden bg-gray-50 border-4 border-white group-hover:border-[#5865F2]/10 transition-all shadow-inner">
              {user.avatar ? (
                <Image
                  src={user.avatar}
                  alt={user.username}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#5865F2]/5 text-[#5865F2]">
                  <User size={32} />
                </div>
              )}
            </div>
            <h3 className="font-black text-gray-900 truncate text-sm">
              @{user.username}
            </h3>
            <p className="text-[9px] font-black text-[#5865F2] uppercase tracking-widest mt-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
              View Profile
            </p>
          </Link>
        ))}
      </div>

      {/* Loading & Status Sensor */}
      <div
        ref={ref}
        className="py-12 flex flex-col items-center justify-center gap-4"
      >
        {isLoading && (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-[#5865F2]" size={28} />
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
              Scanning Creators...
            </span>
          </div>
        )}

        {!hasMore && users.length > 0 && (
          <div className="flex flex-col items-center gap-2">
            <div className="h-px w-12 bg-gray-200" />
            <p className="text-xs font-bold text-gray-300">End of the list</p>
          </div>
        )}

        {!isLoading && users.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-400 font-bold italic">
              No creators found matching &quot;{debouncedSearch}&quot;
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExploreUsersClient;
