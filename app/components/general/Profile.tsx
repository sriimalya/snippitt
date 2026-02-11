"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Grid3X3,
  FolderHeart,
  Info,
  Calendar,
  Camera,
  Loader2,
  Check,
  X as CloseIcon,
} from "lucide-react";
import Snippet from "@/app/components/general/Snippitt";
import { Collections } from "@/app/components/general/Collection";
import FollowButton from "./FollowButton";
import CategoryChart from "./CategoryChart";
import { updateUserProfile } from "@/actions/user/updateUserProfile";
import { toast } from "sonner";
import { generatePresignedUrlAction } from "@/actions/upload";
import Image from "next/image";

interface ProfileClientProps {
  profileData: any;
  categoryStats: any;
  initialPosts: any[];
  initialCollections: any[];
  currentUserId: string | null;
}

const ProfileClient = ({
  profileData,
  categoryStats,
  initialPosts,
  initialCollections,
  currentUserId,
}: ProfileClientProps) => {
  // --- UI State ---
  const [activeTab, setActiveTab] = useState<"posts" | "collections">("posts");
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const toggleMenu = (id: string) => setMenuOpen(menuOpen === id ? null : id);

  // --- Edit Mode State ---
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editData, setEditData] = useState({
    username: profileData.username,
    bio: profileData.bio || "",
    avatar: profileData.avatar || "",
  });

  // --- NEW: Temporary avatar state for preview ---
  const [tempAvatarFile, setTempAvatarFile] = useState<File | null>(null);
  const [tempAvatarPreview, setTempAvatarPreview] = useState<string | null>(
    null,
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Avatar Selection Handler (NO UPLOAD YET) ---
  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      return toast.error("Avatar image must be less than 2MB");
    }

    // Create local preview
    const localUrl = URL.createObjectURL(file);
    setTempAvatarPreview(localUrl);
    setTempAvatarFile(file);
  };

  // --- Clear temp avatar on cancel ---
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData({
      username: profileData.username,
      bio: profileData.bio || "",
      avatar: profileData.avatar || "",
    });
    // Clear temp avatar state
    if (tempAvatarPreview) {
      URL.revokeObjectURL(tempAvatarPreview);
    }
    setTempAvatarFile(null);
    setTempAvatarPreview(null);
  };

  // --- Profile Update Handler (UPLOADS ONLY WHEN SAVING) ---
  const handleSaveProfile = async () => {
    setIsSubmitting(true);

    let avatarUrl = editData.avatar; // Start with current avatar URL

    try {
      // 1. Upload new avatar if one was selected
      if (tempAvatarFile) {
        const toastId = toast.loading("Uploading avatar...");

        const result = await generatePresignedUrlAction({
          fileName: tempAvatarFile.name,
          fileType: tempAvatarFile.type,
        });

        if (!result.success || !result.data) {
          toast.error(result.message || "Failed to get upload URL", {
            id: toastId,
          });
          throw new Error(result.message);
        }

        const { uploadUrl, fileUrl } = result.data;

        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          body: tempAvatarFile,
          headers: { "Content-Type": tempAvatarFile.type },
        });

        if (!uploadRes.ok) throw new Error("S3 Upload failed");

        avatarUrl = fileUrl; // Update avatar URL with the uploaded file URL
        toast.success("Avatar uploaded!", { id: toastId });

        // Clean up temp preview
        if (tempAvatarPreview) {
          URL.revokeObjectURL(tempAvatarPreview);
        }
        setTempAvatarFile(null);
        setTempAvatarPreview(null);
      }

      // 2. Update profile with all changes (including new avatar URL if uploaded)
      const res = await updateUserProfile({
        username: editData.username,
        bio: editData.bio,
        avatar: avatarUrl, // Use the uploaded URL or existing one
      });

      if (res.success) {
        toast.success(res.message);
        setIsEditing(false);
        // Refresh to update Server Side Data and Session
        window.location.reload();
      } else {
        toast.error(res.message);
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Clean up object URLs on unmount ---
  React.useEffect(() => {
    return () => {
      if (tempAvatarPreview) {
        URL.revokeObjectURL(tempAvatarPreview);
      }
    };
  }, [tempAvatarPreview]);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 1. Profile Header */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 pt-12 pb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Avatar with Upload Overlay */}
            <div className="relative group shrink-0">
              <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-xl bg-gray-100">
                {/* Show temp preview first, then editData.avatar, then fallback */}
                {tempAvatarPreview || editData.avatar ? (
                  <Image
                    src={tempAvatarPreview || editData.avatar}
                    alt={profileData.username || "User avatar"}
                    fill
                    priority
                    unoptimized
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-400">
                    {editData.username[0]?.toUpperCase()}
                  </div>
                )}

                {isEditing && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 z-10 bg-black/40 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  >
                    <Camera size={24} />
                    <span className="text-[10px] font-bold mt-1">UPDATE</span>
                  </button>
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarSelect} // Changed from handleAvatarChange
                className="hidden"
                accept="image/*"
              />
            </div>

            {/* User Info & Edit Form Logic */}
            <div className="flex-1 text-center md:text-left w-full">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                <div className="w-full">
                  {isEditing ? (
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Username
                      </label>
                      <input
                        value={editData.username}
                        onChange={(e) =>
                          setEditData({ ...editData, username: e.target.value })
                        }
                        className="text-2xl font-bold text-gray-900 border-b-2 border-[#5865F2] outline-none bg-transparent py-1 w-full max-w-md"
                      />
                    </div>
                  ) : (
                    <h1 className="text-3xl font-extrabold text-gray-900">
                      @{profileData.username}
                    </h1>
                  )}
                </div>

                {/* Actions: Follow or Edit */}
                <div className="flex items-center gap-2 justify-center shrink-0">
                  {profileData.isOwner ? (
                    isEditing ? (
                      <div className="flex items-center gap-2">
                        <button
                          disabled={isSubmitting}
                          onClick={handleCancelEdit} // Changed from setIsEditing(false)
                          className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition"
                        >
                          <CloseIcon size={20} />
                        </button>
                        <button
                          disabled={isSubmitting}
                          onClick={handleSaveProfile}
                          className="flex items-center gap-2 px-6 py-2 bg-[#5865F2] text-white rounded-full font-bold text-sm shadow-lg shadow-[#5865F2]/20 hover:bg-[#4752C4] transition disabled:opacity-50"
                        >
                          {isSubmitting ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Check size={16} />
                          )}
                          Save Profile
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-8 py-2.5 border border-gray-200 rounded-full font-bold text-sm hover:bg-gray-50 transition-all shadow-sm"
                      >
                        Edit Profile
                      </button>
                    )
                  ) : (
                    <FollowButton
                      targetUserId={profileData.id}
                      initialIsFollowing={profileData.isFollowing}
                      initialFollowerCount={profileData._count.followers}
                      initialFollowingCount={profileData._count.following}
                    />
                  )}
                </div>
              </div>

              {/* Bio Section */}
              <div className="mt-4">
                {isEditing ? (
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                      Bio
                    </label>
                    <textarea
                      value={editData.bio}
                      onChange={(e) =>
                        setEditData({ ...editData, bio: e.target.value })
                      }
                      placeholder="Share a bit about yourself..."
                      rows={3}
                      className="w-full max-w-xl p-3 bg-gray-50 rounded-xl border border-gray-200 focus:border-[#5865F2] outline-none transition text-gray-700 text-sm"
                    />
                  </div>
                ) : (
                  <p className="text-gray-600 max-w-xl mb-6 text-lg leading-relaxed">
                    {profileData.bio || "No bio added yet."}
                  </p>
                )}
              </div>

              {!isEditing && (
                <div className="flex items-center justify-center md:justify-start gap-6 text-xs font-medium text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={14} />
                    Joined{" "}
                    {new Date(profileData.createdAt).toLocaleDateString(
                      undefined,
                      { month: "long", year: "numeric" },
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Rest of your component remains exactly the same */}
      <div className="max-w-6xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ... sidebar stats ... */}
        <aside className="lg:col-span-1 space-y-6">
          <CategoryChart stats={categoryStats} />

          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Info size={18} className="text-[#5865F2]" /> Engagement
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="text-2xl font-black text-gray-900">
                  {profileData._count.posts}
                </div>
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  Snippets
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="text-2xl font-black text-gray-900">
                  {profileData._count.collections}
                </div>
                <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                  Collections
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="lg:col-span-2">
          {/* ... tabs and content ... */}
          <div className="flex items-center gap-8 border-b border-gray-200 mb-8 overflow-x-auto no-scrollbar">
            <TabButton
              active={activeTab === "posts"}
              onClick={() => setActiveTab("posts")}
              icon={<Grid3X3 size={18} />}
              label="Posts"
            />
            <TabButton
              active={activeTab === "collections"}
              onClick={() => setActiveTab("collections")}
              icon={<FolderHeart size={18} />}
              label="Collections"
            />
          </div>

          <div className="min-h-[400px]">
            <AnimatePresence mode="wait">
              {activeTab === "posts" ? (
                <motion.div
                  key="posts-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  {initialPosts.length > 0 ? (
                    initialPosts.map((post) => (
                      <Snippet
                        key={post.id}
                        post={post}
                        currentUserId={currentUserId as any}
                        showActions={true}
                        menuOpen={menuOpen}
                        toggleMenu={toggleMenu}
                      />
                    ))
                  ) : (
                    <EmptyState message="No snippets published yet." />
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="collections-tab"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <Collections
                    collections={initialCollections}
                    isOwner={profileData.isOwner}
                    showCoverImage={true}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
};

// --- Sub-components (unchanged) ---
const TabButton = ({ active, onClick, icon, label }: any) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 pb-4 px-2 border-b-2 transition-all whitespace-nowrap font-bold text-sm ${
      active
        ? "border-[#5865F2] text-[#5865F2]"
        : "border-transparent text-gray-400 hover:text-gray-600"
    }`}
  >
    {icon}
    {label}
  </button>
);

const EmptyState = ({ message }: { message: string }) => (
  <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
    <Info className="w-12 h-12 text-gray-200 mx-auto mb-4" />
    <p className="text-gray-500 font-medium">{message}</p>
  </div>
);

export default ProfileClient;
