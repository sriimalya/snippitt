"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, FolderPlus, Check, Loader2, Folder } from "lucide-react";
import {
  getUserCollectionNames,
  addNewPostToCollection,
  removePostFromCollection,
  createCollection,
} from "@/actions/collection";
import { toast } from "sonner";
import Button from "../Button";

interface Collection {
  id: string;
  name: string;
  hasPost?: boolean; // We'll determine this locally
}

interface AddCollectionButtonProps {
  postId: string;
  userId: string;
}
const AddCollectionButton: React.FC<AddCollectionButtonProps> = ({
  postId,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Stability fix: wrap in useCallback to use in multiple places
  const loadData = useCallback(async () => {
    setIsLoading(true);
    const result = await getUserCollectionNames(postId); // Pass postId
    if (result.success && result.data) {
      setCollections(result.data);
    } else {
      toast.error("Could not load collections");
    }
    setIsLoading(false);
  }, [postId]);

  useEffect(() => {
    if (isOpen) loadData();
  }, [isOpen, loadData]);

  const handleTogglePost = async (
    collectionId: string,
    currentlyHasPost: boolean,
  ) => {
    try {
      if (currentlyHasPost) {
        const res = await removePostFromCollection(collectionId, postId);
        if (!res.success) throw new Error(res.error?.message);
        toast.success("Removed from collection");
      } else {
        const res = await addNewPostToCollection(collectionId, postId);
        if (!res.success) throw new Error(res.error?.message);
        toast.success("Added to collection");
      }

      // ✅ SUCCESS ACTION: Close modal quickly
      setIsOpen(false);
    } catch (error: any) {
      toast.error(error.message || "Operation failed");
    }
  };

  const handleCreateNewCollection = async () => {
    if (!newCollectionName.trim()) return;
    setIsCreating(true);
    try {
      const result = await createCollection(newCollectionName);
      if (result.success) {
        setNewCollectionName("");
        toast.success("Collection created!");
        // Refresh list instead of closing so they can then add the post to it
        await loadData();
      } else {
        toast.error(result.error?.message || "Error creating collection");
      }
    } catch (err) {
      toast.error("Something went wrong");
    } finally {
      setIsCreating(false);
    }
  };
  return (
    <>
      {/* The Menu Item trigger - matching your Snippet style */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-primary/10 hover:text-primary transition"
      >
        <FolderPlus size={16} className="mr-2" />
        Add to Collection
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Save to Collection
              </h3>

              {/* Create New Section */}
              <div className="flex gap-2 mb-6">
                <input
                  type="text"
                  placeholder="New collection name..."
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5865F2]"
                />
                <Button
                  size="sm"
                  variant="theme-primary"
                  onClick={handleCreateNewCollection}
                  disabled={isCreating || !newCollectionName.trim()}
                >
                  {isCreating ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Plus size={18} />
                  )}
                </Button>
              </div>

              {/* Collections List */}
              <div className="max-h-60 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                {isLoading ? (
                  <div className="py-8 text-center">
                    <Loader2 className="mx-auto animate-spin text-gray-400" />
                  </div>
                ) : collections.length > 0 ? (
                  collections.map((col) => (
                    <button
                      key={col.id}
                      onClick={() => handleTogglePost(col.id, !!col.hasPost)}
                      className="flex items-center justify-between w-full p-3 rounded-xl border border-gray-100 hover:border-[#5865F2] hover:bg-[#5865F2]/5 transition-all text-left group"
                    >
                      <div className="flex items-center">
                        <Folder
                          size={18}
                          className="text-gray-400 mr-3 group-hover:text-[#5865F2]"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          {col.name}
                        </span>
                      </div>
                      {col.hasPost && (
                        <Check size={18} className="text-green-500" />
                      )}
                    </button>
                  ))
                ) : (
                  <p className="text-center py-4 text-sm text-gray-500 italic">
                    No collections yet.
                  </p>
                )}
              </div>
            </div>

            <div className="bg-gray-50 p-4 flex justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="text-sm font-semibold text-gray-600 hover:text-gray-900"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AddCollectionButton;
