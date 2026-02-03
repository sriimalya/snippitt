"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, Save, ArrowLeft, Trash2, AlertTriangle, X } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";

import { generatePresignedUrlAction } from "@/actions/upload";
import { updateCollection } from "@/actions/collection/updateCollection";
import { deleteCollection } from "@/actions/collection/deleteCollection";
import { removePostFromCollection } from "@/actions/collection";
import Snippet from "@/app/components/general/Snippitt";
import Button from "@/app/components/Button";

const EditCollectionClient = ({
  initialCollection,
  snippets, // These are our initial snippets from the server
  currentUserId,
}: any) => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- 1. State Management ---
  const [localSnippets, setLocalSnippets] = useState(snippets); // Control snippets locally for instant removal
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const toggleMenu = (id: string) => setMenuOpen(menuOpen === id ? null : id);

  // --- 2. Image & Form State ---
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(initialCollection.coverImage);

  const [formData, setFormData] = useState({
    collectionId: initialCollection.id,
    name: initialCollection.name,
    description: initialCollection.description || "",
    visibility: initialCollection.visibility,
    coverImage: initialCollection.coverImage,
  });

  // --- 3. Handlers ---

  const handleRemoveSnippet = async (postId: string) => {
    // OPTIMISTIC UI: Remove instantly from the screen
    const previousSnippets = [...localSnippets];
    setLocalSnippets(localSnippets.filter((s: any) => s.id !== postId));
    
    toast.success("Removing snippet...");

    try {
      const res = await removePostFromCollection(initialCollection.id, postId);
      if (!res.success) {
        // Rollback if server fails
        setLocalSnippets(previousSnippets);
        toast.error(res.error?.message || "Failed to remove snippet");
      } else {
        router.refresh(); // Sync server components
      }
    } catch (error) {
      setLocalSnippets(previousSnippets);
      toast.error("An error occurred while removing");
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return toast.error("Image must be less than 2MB");

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    let finalCoverUrl = formData.coverImage;

    try {
      if (selectedFile) {
        const toastId = toast.loading("Uploading new cover...");
        const res = await generatePresignedUrlAction({
          fileName: selectedFile.name,
          fileType: selectedFile.type,
        });

        if (!res.success || !res.data) throw new Error(res.message);

        const uploadRes = await fetch(res.data.uploadUrl, {
          method: "PUT",
          body: selectedFile,
          headers: { "Content-Type": selectedFile.type },
        });

        if (!uploadRes.ok) throw new Error("S3 Upload failed");
        finalCoverUrl = res.data.fileUrl;
        toast.success("Image uploaded!", { id: toastId });
      }

      const res = await updateCollection({ ...formData, coverImage: finalCoverUrl });

      if (res.success) {
        toast.success("Collection saved!");
        router.refresh();
      } else {
        toast.error(res.message);
      }
    } catch (error: any) {
      toast.error(error.message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCollection = async () => {
    setIsDeleting(true);
    try {
      const res = await deleteCollection(initialCollection.id);
      if (res.success) {
        toast.success("Collection deleted");
        router.push("/dashboard/collections");
      } else {
        toast.error(res.error?.message || "Delete failed");
      }
    } catch (error) {
      toast.error("Internal error occurred");
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 font-sans relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition font-medium">
          <ArrowLeft size={18} /> Back
        </button>
        <button onClick={() => setShowDeleteModal(true)} className="flex items-center gap-2 text-red-500 hover:text-red-700 text-sm font-bold transition">
          <Trash2 size={16} /> Delete Collection
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Settings Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Settings</h2>
            
            {/* Cover Image Upload (Deferred) */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Cover Image</label>
              <div
                className="relative h-44 w-full rounded-xl overflow-hidden bg-gray-50 border-2 border-dashed border-gray-200 group cursor-pointer transition-all hover:border-[#5865F2]/50"
                onClick={() => fileInputRef.current?.click()}
              >
                {previewUrl ? (
                  <Image src={previewUrl} alt="Preview" fill className="object-cover" unoptimized />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400">
                    <Camera size={32} strokeWidth={1.5} />
                    <span className="text-xs font-semibold mt-2">Upload</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                  <Camera size={24} />
                </div>
              </div>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
            </div>

            <div className="space-y-4">
              <input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                placeholder="Name"
              />
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none resize-none"
                placeholder="Description"
              />
              <div className="grid grid-cols-3 gap-2">
                {["PUBLIC", "FOLLOWERS", "PRIVATE"].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setFormData({ ...formData, visibility: v as any })}
                    className={`py-2 text-[10px] font-black rounded-lg border transition-all ${
                      formData.visibility === v ? "bg-[#5865F2] text-white border-[#5865F2]" : "bg-white text-gray-400"
                    }`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={handleSave} disabled={isSubmitting} className="w-full py-6 font-bold" variant="theme-primary">
              {isSubmitting ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save size={18} className="mr-2" />}
              Save Changes
            </Button>
          </div>
        </div>

        {/* Snippets Content */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-lg font-black text-gray-900">Snippets ({localSnippets.length})</h3>
          <div className="space-y-6">
            {localSnippets.map((post: any) => (
              <div key={post.id} className="relative group">
                <Snippet
                  post={post}
                  showActions={true}
                  menuOpen={menuOpen}
                  toggleMenu={toggleMenu}
                  currentUserId={currentUserId}
                />
                <button
                  className="absolute top-3 right-24 p-2 bg-white shadow-md rounded-lg text-red-500 opacity-0 group-hover:opacity-100 transition hover:bg-red-50 z-20 border border-red-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveSnippet(post.id);
                  }}
                  title="Remove from collection"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            {localSnippets.length === 0 && (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200 text-gray-400">
                No snippets in this collection.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal (Same as before) */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full animate-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-6">
              <div className="p-3 bg-red-100 rounded-2xl text-red-600"><AlertTriangle size={24} /></div>
              <button onClick={() => setShowDeleteModal(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">Delete Collection?</h3>
            <p className="text-gray-500 mb-8 leading-relaxed">This will permanently delete "{initialCollection.name}" and its cover image.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-4 font-bold text-gray-500">Cancel</button>
              <button onClick={handleDeleteCollection} disabled={isDeleting} className="flex-1 py-4 bg-red-500 text-white font-bold rounded-2xl">
                {isDeleting ? <Loader2 className="animate-spin mx-auto" /> : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditCollectionClient;