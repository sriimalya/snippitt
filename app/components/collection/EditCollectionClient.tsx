"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Camera,
  Loader2,
  Save,
  ArrowLeft,
  Trash2,
  X,
  ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { generatePresignedUrlAction } from "@/actions/upload";
import { updateCollection } from "@/actions/collection/updateCollection";
import { deleteCollection } from "@/actions/collection/deleteCollection";
import Button from "@/app/components/Button";
import { Visibility } from "@/app/generated/prisma/enums";
import { DeleteModal } from "../general/DeleteModal";
import { VisibilityPanel } from "../general/VisibilityPanel";

const inputBase =
  "w-full px-4 py-3 rounded-xl border bg-gray-50 focus:bg-white text-sm text-gray-900 placeholder-gray-400 outline-none transition-all";
const inputClass = (hasError = false) =>
  `${inputBase} focus:ring-2 ${
    hasError
      ? "border-red-300 focus:border-red-400 focus:ring-red-100"
      : "border-gray-200 hover:border-indigo-200 focus:border-indigo-500 focus:ring-indigo-100"
  }`;

const Field = ({
  label,
  counter,
  children,
}: {
  label: string;
  counter?: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between px-0.5">
      <label className="text-sm font-semibold text-gray-900">{label}</label>
      {counter && (
        <span className="text-xs text-gray-400 tabular-nums">{counter}</span>
      )}
    </div>
    {children}
  </div>
);

const EditCollectionClient = ({ initialCollection }: any) => {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(initialCollection.coverImage);
  const [formData, setFormData] = useState({
    collectionId: initialCollection.id,
    name: initialCollection.name,
    description: initialCollection.description || "",
    visibility: initialCollection.visibility,
    coverImage: initialCollection.coverImage,
  });
  const currVisibility = initialCollection.visibility;
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024)
      return toast.error("Image must be less than 2MB");
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    let finalCoverUrl = formData.coverImage;
    try {
      if (selectedFile) {
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
        if (!uploadRes.ok) throw new Error("Upload failed");
        finalCoverUrl = res.data.fileUrl;
      }
      const res = await updateCollection({
        ...formData,
        coverImage: finalCoverUrl,
      });
      if (res.success) {
        setIsSubmitting(false);
        setIsRedirecting(true);
        toast.success("Collection saved!");
        setTimeout(
          () => router.push(`/collections/${initialCollection.id}`),
          200,
        );
      } else {
        toast.error(res.message);
        setIsSubmitting(false);
      }
    } catch (error: any) {
      toast.error(error.message || "Unexpected error");
      setIsSubmitting(false);
    }
  };

  const handleDeleteCollection = async () => {
    setIsDeleting(true);
    try {
      const res = await deleteCollection(initialCollection.id);
      if (res.success) {
        toast.success("Collection deleted");
        router.push("/my-collections");
      } else toast.error(res.error?.message || "Delete failed");
    } catch {
      toast.error("Internal error");
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {(isSubmitting || isRedirecting) && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-8 max-w-xs w-full mx-4 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
            <div>
              <p className="text-sm font-bold text-gray-900">
                {isRedirecting ? "Opening collection" : "Saving changes"}
              </p>
              <p className="text-xs text-gray-400 mt-1">Just a moment…</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <header>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors mb-6 group"
          >
            <ArrowLeft
              size={15}
              className="group-hover:-translate-x-0.5 transition-transform"
            />
            Back
          </button>
          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
              Edit Collection
            </h1>
            <p className="text-sm text-gray-500">
              Update your collection details and manage its snippets.
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Left column ── */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="h-1 bg-gray-100">
                <div className="h-full w-full bg-gradient-to-r from-indigo-500 to-indigo-300" />
              </div>
              <div className="p-6 sm:p-8 space-y-6">
                <Field label="Cover Image">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="relative h-44 w-full rounded-xl overflow-hidden bg-gray-50 border-2 border-dashed border-gray-200 group cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-all"
                  >
                    {previewUrl ? (
                      <>
                        <Image
                          src={previewUrl}
                          alt="Cover preview"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-xl px-3 py-2 flex items-center gap-2">
                            <Camera size={14} className="text-gray-700" />
                            <span className="text-xs font-semibold text-gray-700">
                              Change cover
                            </span>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center gap-2 text-gray-400 group-hover:text-indigo-400 transition-colors">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover:bg-indigo-100 flex items-center justify-center transition-colors">
                          <ImageIcon size={18} />
                        </div>
                        <span className="text-xs font-semibold">
                          Click to upload cover
                        </span>
                        <span className="text-[10px] text-gray-300">
                          Max 2MB
                        </span>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </Field>

                <Field label="Name" counter={`${formData.name.length}/100`}>
                  <div className="relative group">
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((p) => ({
                          ...p,
                          name: e.target.value.slice(0, 100),
                        }))
                      }
                      placeholder="Give your collection a name…"
                      disabled={isSubmitting}
                      className={inputClass()}
                    />
                    {formData.name && (
                      <button
                        type="button"
                        onClick={() => setFormData((p) => ({ ...p, name: "" }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-300 hover:text-gray-500 opacity-0 group-focus-within:opacity-100 transition-all"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </Field>

                <Field
                  label="Description"
                  counter={`${formData.description.length}/500`}
                >
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((p) => ({
                        ...p,
                        description: e.target.value.slice(0, 500),
                      }))
                    }
                    rows={4}
                    placeholder="Describe your collection — what it's about, who it's for…"
                    disabled={isSubmitting}
                    className={`${inputClass()} resize-none`}
                  />
                </Field>
              </div>
            </div>
          </div>

          {/* ── Right column ── */}
          <div className="space-y-4">
            {/* Visibility */}
            <VisibilityPanel
              visibility={formData.visibility}
              isSubmitting={isSubmitting}
              currVisibility={currVisibility}
              onChange={(v: Visibility) =>
                setFormData((p) => ({ ...p, visibility: v }))
              }
            />

            <div className="space-y-3">
              {/* Save */}
              <Button
                onClick={handleSave}
                variant="primary"
                className="w-full rounded-xl shadow-sm shadow-indigo-200"
                disabled={isSubmitting}
                icon={
                  isSubmitting ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Save size={14} />
                  )
                }
              >
                {isSubmitting ? "Saving…" : "Save Changes"}
              </Button>
              {/* Delete */}
              <button
                onClick={() => setShowDeleteModal(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-red-200 text-red-500 text-sm font-semibold hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all"
              >
                <Trash2 size={14} /> Delete Collection
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete modal */}
      <DeleteModal
        label="Collection"
        isOpen={showDeleteModal}
        isDeleting={isDeleting}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteCollection}
      />
    </div>
  );
};

export default EditCollectionClient;