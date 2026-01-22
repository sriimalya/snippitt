"use client";

import React, { useState } from "react";
import { Plus, FolderHeart, LayoutGrid, List, Search } from "lucide-react";
import { Collections } from "@/app/components/general/Collection";
import Button from "@/app/components/Button";
import Link from "next/link";
import { motion } from "framer-motion";

interface ProfileCollectionsClientProps {
  initialCollections: any[];
  initialPagination: any;
  isOwner: boolean;
  profileId: string;
}

const ProfileCollectionsClient = ({
  initialCollections,
  isOwner,
  profileId
}: ProfileCollectionsClientProps) => {
  const [viewVariant, setViewVariant] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");

  // Filter collections locally for instant search feedback
  const filteredCollections = initialCollections.filter(col => 
    col.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FolderHeart className="text-[#5865F2]" />
            {isOwner ? "My Collections" : "Collections"}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {isOwner 
              ? "Organize your snippets into private or public folders." 
              : "Explore curated sets of snippets and resources."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggler */}
          <div className="flex bg-gray-100 p-1 rounded-lg mr-2">
            <button 
              onClick={() => setViewVariant("grid")}
              className={`p-1.5 rounded-md transition ${viewVariant === "grid" ? "bg-white shadow-sm text-[#5865F2]" : "text-gray-500"}`}
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              onClick={() => setViewVariant("list")}
              className={`p-1.5 rounded-md transition ${viewVariant === "list" ? "bg-white shadow-sm text-[#5865F2]" : "text-gray-500"}`}
            >
              <List size={18} />
            </button>
          </div>

          {/* owner only: Create New Button */}
          {isOwner && (
            <Link href="/dashboard/collections/new">
              <Button variant="theme-primary" size="sm" icon={<Plus size={18} />}>
                Create New
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input 
          type="text"
          placeholder="Search collections..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#5865F2]/20 outline-none transition-all"
        />
      </div>

      {/* The Unified Collections Component */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Collections 
          collections={filteredCollections}
          variant={viewVariant}
          showCoverImage={true}
          isOwner={isOwner}
        />
      </motion.div>

      {/* Empty State */}
      {filteredCollections.length === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200 mt-4">
          <p className="text-gray-500">No collections found matching your criteria.</p>
        </div>
      )}
    </div>
  );
};

export default ProfileCollectionsClient;