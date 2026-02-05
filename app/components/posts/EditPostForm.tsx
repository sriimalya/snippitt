"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import Image from "next/image";
import Button from "@/app/components/Button";
import Dropdown from "@/app/components/inputFields/Dropdown";
import {
  Upload,
  Image as ImageIcon,
  Video,
  Users,
  Globe,
  Lock,
  CheckCircle,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Star,
  FileText,
  Grid,
  List,
  Save,
  Eye as EyeIcon,
  BookOpen,
  Zap,
  Camera,
  Trash2,
  Info,
  X,
} from "lucide-react";
import { getPost } from "@/actions/posts/getPost";
import { deletePost } from "@/actions/posts/deletePost";
import { Category, Visibility } from "@/app/generated/prisma/enums";
import type { Post } from "@/schemas/post";
import { updatePost } from "@/actions/posts/updatePost";
import { generatePresignedUrlAction } from "@/actions/upload";

// Types for file handling
interface FileWithMetadata {
  id: string;
  file: File | null;
  preview: string;
  description: string;
  uploadProgress: number;
  isUploaded: boolean;
  s3Key?: string;
  s3Url?: string;
  isCover: boolean;
  fileType: "image" | "video";
  existingImageId?: string;
}

interface CategoryOption {
  value: Category;
  label: string;
}

interface VisibilityOption {
  value: Visibility;
  label: string;
  icon: React.ComponentType;
  desc: string;
}

const MAX_SIZE_MB = 10;
const MAX_FILES = 10;

const EditPostForm = () => {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [post, setPost] = useState<Post | null>(null);
  const [files, setFiles] = useState<FileWithMetadata[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [viewMode, setViewMode] = useState<"details" | "media">("details");
  const [fileViewMode, setFileViewMode] = useState<"grid" | "list">("grid");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedVisibility, setSelectedVisibility] =
    useState<Visibility>("PRIVATE");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "" as Category,
    tags: [] as string[],
  });

  // Fetch post data
  useEffect(() => {
    const fetchPostData = async () => {
      if (!postId) return;

      try {
        setIsLoading(true);
        const result = await getPost(postId);

        if (result.success && result.data) {
          const postData = result.data;

          // Set post data
          setPost(postData);

          // Set form data
          setFormData({
            title: postData.title,
            description: postData.description,
            category: postData.category as Category,
            tags: postData.tags || [],
          });

          setSelectedVisibility(postData.visibility || "PRIVATE");

          // Transform existing images to FileWithMetadata format
          // Note: We need to fetch images separately since getPost doesn't include all images
          // This will be fixed when we update getPost to include all images
          // In EditPostForm.tsx fetchPostData function:
          const existingFiles: FileWithMetadata[] = postData.images.map(
            (img: any, index: number) => ({
              id: img.id || `existing-${index}`,
              file: null,
              preview: img.url, // This should now have the signed URL
              description: img.description || "",
              uploadProgress: 100,
              isUploaded: true,
              s3Url: img.url,
              isCover: img.isCover || false,
              fileType: img.url.match(/\.(mp4|webm|avi|mov)$/i)
                ? "video"
                : "image",
              existingImageId: img.id,
            }),
          );

          setFiles(existingFiles);
        } else {
          toast.error(result.message || "Failed to load post");
          router.push("/my-posts");
        }
      } catch (error) {
        console.error("Failed to fetch post:", error);
        toast.error("Failed to load post");
        router.push("/my-posts");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPostData();
  }, [postId, router]);

  // File type detection
  const detectFileType = useCallback((file: File): "image" | "video" => {
    return file.type.startsWith("image/") ? "image" : "video";
  }, []);

  // File drop handler
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (files.length + acceptedFiles.length > MAX_FILES) {
        toast.error(`Maximum ${MAX_FILES} files allowed`);
        return;
      }

      const validFiles = acceptedFiles.filter((file) => {
        const isWithinSizeLimit = file.size <= MAX_SIZE_MB * 1024 * 1024;
        if (!isWithinSizeLimit) {
          toast.error(`"${file.name}" exceeds ${MAX_SIZE_MB}MB`);
          return false;
        }
        return true;
      });

      const newFiles: FileWithMetadata[] = validFiles.map((file) => ({
        id: `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        preview: URL.createObjectURL(file),
        description: "",
        uploadProgress: 0,
        isUploaded: false,
        isCover: files.length === 0 && detectFileType(file) === "image", // Auto-set cover if first image
        fileType: detectFileType(file),
      }));

      setFiles((prev) => [...prev, ...newFiles]);
      if (validFiles.length > 0) {
        toast.success(`${validFiles.length} file(s) added`);
      }
    },
    [files.length, detectFileType],
  );

  // Dropzone configuration
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
      "video/*": [".mp4", ".webm", ".avi", ".mov"],
    },
    multiple: true,
    maxSize: MAX_SIZE_MB * 1024 * 1024,
  });

  // Remove a file
  const removeFile = useCallback((index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      const removedFile = newFiles.splice(index, 1)[0];

      // Revoke object URL to prevent memory leaks
      if (!removedFile.isUploaded && removedFile.preview.startsWith("blob:")) {
        URL.revokeObjectURL(removedFile.preview);
      }

      // If removed file was cover, auto-select new cover
      if (removedFile.isCover) {
        const firstImageIndex = newFiles.findIndex(
          (f) => f.fileType === "image",
        );
        if (firstImageIndex !== -1) {
          newFiles[firstImageIndex].isCover = true;
          toast.info("New cover image auto-selected");
        }
      }

      return newFiles;
    });

    toast.success("File removed");
  }, []);

  // Set cover image
  const setCoverImage = useCallback(
    (index: number) => {
      const file = files[index];

      if (file.fileType !== "image") {
        toast.error("Only images can be set as cover");
        return;
      }

      setFiles((prev) =>
        prev.map((f, i) => ({
          ...f,
          isCover: i === index && f.fileType === "image",
        })),
      );

      toast.success("Cover image set");
    },
    [files],
  );

  // Update file description
  const updateFileDescription = useCallback(
    (index: number, description: string) => {
      setFiles((prev) => {
        const newFiles = [...prev];
        newFiles[index].description = description;
        return newFiles;
      });
    },
    [],
  );

  // Toggle tag selection
  const toggleTag = useCallback((tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  }, []);

  // Upload files to S3 in parallel
  const uploadFiles = useCallback(async (): Promise<boolean> => {
    const filesToUpload = files.filter((f) => !f.isUploaded);
    if (filesToUpload.length === 0) return true;

    setIsUploading(true);

    try {
      const uploadPromises = filesToUpload.map(async (fileData) => {
        try {
          // Get presigned URL
          console.log("File name type:", typeof fileData.file!.name);
          console.log("File name value:", fileData.file!.name);
          console.log("File type type:", typeof fileData.file!.type);
          console.log("File type value:", fileData.file!.type);
          const result = await generatePresignedUrlAction({
            fileName: fileData.file!.name,
            fileType: fileData.file!.type,
          });

          if (!result.success || !result.data) {
            throw new Error(result.message || "Failed to get upload URL");
          }

          const presignedData = result.data;

          // Upload file to S3
          await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("PUT", presignedData.uploadUrl, true);
            xhr.setRequestHeader("Content-Type", fileData.file!.type);

            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable) {
                const progress = Math.round((e.loaded / e.total) * 100);
                setFiles((prev) =>
                  prev.map((f) =>
                    f.id === fileData.id
                      ? { ...f, uploadProgress: progress }
                      : f,
                  ),
                );
              }
            };

            xhr.onload = () => {
              if (xhr.status === 200) {
                setFiles((prev) =>
                  prev.map((f) =>
                    f.id === fileData.id
                      ? {
                          ...f,
                          isUploaded: true,
                          s3Key: presignedData.key,
                          s3Url: presignedData.fileUrl,
                          uploadProgress: 100,
                        }
                      : f,
                  ),
                );
                resolve();
              } else {
                reject(new Error("Upload failed"));
              }
            };

            xhr.onerror = () => reject(new Error("Upload failed"));
            xhr.send(fileData.file!);
          });

          return { success: true, fileName: fileData.file!.name };
        } catch (error) {
          console.error(`Upload failed for ${fileData.file?.name}:`, error);
          return {
            success: false,
            fileName: fileData.file?.name,
            error: error instanceof Error ? error.message : "Upload failed",
          };
        }
      });

      const results = await Promise.allSettled(uploadPromises);

      // Check for failures
      const failures = results.filter(
        (r) =>
          r.status === "rejected" ||
          (r.status === "fulfilled" && !r.value.success),
      );

      if (failures.length > 0) {
        failures.forEach((failure) => {
          if (failure.status === "rejected") {
            toast.error("File upload failed");
          } else if (failure.value) {
            toast.error(`Failed to upload ${failure.value.fileName}`);
          }
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error("Upload process error:", error);
      toast.error("Upload process failed");
      return false;
    } finally {
      setIsUploading(false);
    }
  }, [files]);

  // Handle form submission
  const handleSubmit = useCallback(
    async (isDraft: boolean = false) => {
      // Validation
      if (!formData.title.trim()) {
        toast.error("Please enter a title");
        return;
      }

      if (!formData.category) {
        toast.error("Please select a category");
        return;
      }

      if (formData.tags.length === 0) {
        toast.error("Please add at least one tag");
        return;
      }

      // Check for unuploaded files
      const unuploadedFiles = files.filter((f) => !f.isUploaded);
      if (unuploadedFiles.length > 0) {
        const shouldUpload = window.confirm(
          `${unuploadedFiles.length} files are not uploaded. Upload them now?`,
        );
        if (shouldUpload) {
          const uploadSuccess = await uploadFiles();
          if (!uploadSuccess) {
            toast.error("Some files failed to upload");
            return;
          }
        } else {
          return;
        }
      }

      // Ensure at least one image is cover if we have images
      const hasImages = files.length > 0;
      const hasCover = files.some((f) => f.isCover);

      if (hasImages && !hasCover) {
        const firstImageIndex = files.findIndex((f) => f.fileType === "image");
        if (firstImageIndex !== -1) {
          setFiles((prev) =>
            prev.map((f, i) => ({
              ...f,
              isCover: i === firstImageIndex,
            })),
          );
          toast.info("Auto-set first image as cover");
        }
      }

      setIsSubmitting(true);

      try {
        // Prepare images payload
        const images = files.map((file) => ({
          // url: file.s3Url || file.preview,
          url: file.isUploaded ? (file.s3Url || file.preview) : file.preview,
          description: file.description,
          isCover: file.isCover,
          existingImageId: file.existingImageId,
        }));

        // Prepare payload
        const payload = {
          id: postId,
          ...formData,
          visibility: isDraft ? "PRIVATE" : selectedVisibility,
          isDraft,
          images,
        };

        const result = await updatePost(payload);

        if (result.success) {
          toast.success(isDraft ? "Draft saved!" : "Post published!");

          // Clear object URLs to prevent memory leaks
          files.forEach((file) => {
            if (file.preview.startsWith("blob:")) {
              URL.revokeObjectURL(file.preview);
            }
          });

          setTimeout(() => {
            router.push(`/my-posts/${postId}`);
          }, 1000);
        } else {
          toast.error(result.message || "Failed to save changes");
        }
      } catch (error: any) {
        console.error("Update failed:", error);
        toast.error(error.message || "Failed to save changes");
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData, files, postId, selectedVisibility, uploadFiles, router],
  );

  // Handle delete post
  const handleDeletePost = useCallback(async () => {
    setIsDeleting(true);
    try {
      const result = await deletePost(postId);
      if (result.success) {
        toast.success("Post deleted successfully");
        router.push("/dashboard/my-posts");
      } else {
        toast.error(result.message || "Failed to delete post");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete post");
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  }, [postId, router]);

  // Category options
  const categoryOptions = useMemo<CategoryOption[]>(() => {
    return Object.values(Category).map((cat) => ({
      value: cat,
      label: cat.replace(/([A-Z])/g, " $1").trim(),
    }));
  }, []);

  // Visibility options
  const visibilityOptions = useMemo<VisibilityOption[]>(
    () => [
      {
        value: "PRIVATE",
        label: "Private",
        icon: Lock,
        desc: "Only you can see",
      },
      {
        value: "FOLLOWERS",
        label: "Followers",
        icon: Users,
        desc: "Visible to followers",
      },
      {
        value: "PUBLIC",
        label: "Public",
        icon: Globe,
        desc: "Everyone can see",
      },
    ],
    [],
  );

  // Tag options (example - you can fetch from DB or use constants)
  const tagOptions = useMemo(
    () => [
      "Technology",
      "Design",
      "Development",
      "Business",
      "Art",
      "Photography",
      "Travel",
      "Food",
    ],
    [],
  );

  // Stats
  const stats = useMemo(
    () => ({
      totalFiles: files.length,
      uploadedFiles: files.filter((f) => f.isUploaded).length,
      images: files.filter((f) => f.fileType === "image").length,
      videos: files.filter((f) => f.fileType === "video").length,
      coverSet: files.some((f) => f.isCover),
    }),
    [files],
  );
  useEffect(() => {
    return () => {
      // Revoke all blob URLs when component unmounts
      files.forEach((file) => {
        if (file.preview.startsWith("blob:")) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [files]);
  // Get cover image for preview
  const coverFile = files.find((f) => f.isCover);
  const previewImage = coverFile || files[0];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-[#5865F2] animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading post...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Post Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            The post you&apos;re trying to edit doesn&apos;t exist.
          </p>
          <Button
            onClick={() => router.push("/my-posts")}
            variant="theme-primary"
          >
            Back to My Posts
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button
                onClick={() => router.push("/my-posts")}
                variant="outline"
                size="sm"
                icon={<ArrowLeft className="w-4 h-4" />}
              >
                Back
              </Button>
              <div className="ml-4">
                <h1 className="text-lg font-semibold text-gray-900">
                  Edit Post
                </h1>
                <p className="text-xs text-gray-500">
                  ID: {postId?.slice(0, 8)}...
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="hidden sm:flex items-center space-x-2">
                <div
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    post.isDraft
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-green-100 text-green-800"
                  }`}
                >
                  {post.isDraft ? "Draft" : "Published"}
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <BookOpen className="w-3 h-3 mr-1" />
                  {stats.uploadedFiles}/{stats.totalFiles} files
                </div>
              </div>

              <Button
                onClick={() => handleSubmit(false)}
                variant="theme-primary"
                size="sm"
                disabled={isSubmitting}
                icon={
                  isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )
                }
              >
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Stats Bar */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {stats.totalFiles}
                  </div>
                  <div className="text-xs text-gray-500">Total Files</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {stats.uploadedFiles}
                  </div>
                  <div className="text-xs text-gray-500">Uploaded</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.images}
                  </div>
                  <div className="text-xs text-gray-500">Images</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {stats.videos}
                  </div>
                  <div className="text-xs text-gray-500">Videos</div>
                </div>
              </div>
            </div>

            {/* View Toggle */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex space-x-1">
                  <Button
                    onClick={() => setViewMode("details")}
                    variant={
                      viewMode === "details" ? "theme-primary" : "outline"
                    }
                    size="sm"
                    icon={<FileText className="w-4 h-4" />}
                  >
                    Details
                  </Button>
                  <Button
                    onClick={() => setViewMode("media")}
                    variant={viewMode === "media" ? "theme-primary" : "outline"}
                    size="sm"
                    icon={<ImageIcon className="w-4 h-4" />}
                  >
                    Media ({files.length})
                  </Button>
                </div>

                {viewMode === "media" && (
                  <div className="flex space-x-1">
                    <Button
                      onClick={() => setFileViewMode("grid")}
                      variant={
                        fileViewMode === "grid" ? "theme-primary" : "outline"
                      }
                      size="sm"
                      icon={<Grid className="w-4 h-4" />}
                    >
                      Grid
                    </Button>
                    <Button
                      onClick={() => setFileViewMode("list")}
                      variant={
                        fileViewMode === "list" ? "theme-primary" : "outline"
                      }
                      size="sm"
                      icon={<List className="w-4 h-4" />}
                    >
                      List
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Content Area */}
            {viewMode === "details" ? (
              <div className="space-y-6">
                {/* Title & Description Card */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Title
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            title: e.target.value,
                          }))
                        }
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#5865F2] focus:border-transparent"
                        placeholder="Enter post title"
                        disabled={isSubmitting}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        rows={4}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#5865F2] focus:border-transparent resize-none"
                        placeholder="Describe your post..."
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                </div>

                {/* Category & Tags Card */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Category */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Category
                      </label>
                      <Dropdown
                        options={categoryOptions}
                        value={formData.category}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            category: e.target.value as Category,
                          }))
                        }
                        placeholder="Select category"
                      />
                    </div>

                    {/* Tags */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Selected Tags
                      </label>
                      <div className="flex flex-wrap gap-2 mb-4 p-3 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        {formData.tags.length > 0 ? (
                          formData.tags.map((tag) => (
                            <span
                              key={tag}
                              className="flex items-center gap-1 px-3 py-1 bg-[#5865F2] text-white rounded-full text-xs"
                            >
                              {tag}
                              <button
                                type="button"
                                onClick={() => toggleTag(tag)}
                              >
                                <X className="w-3 h-3 hover:text-red-200" />
                              </button>
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">
                            No tags selected
                          </span>
                        )}
                      </div>

                      <label className="block text-sm font-semibold text-gray-900 mb-2 text-xs uppercase text-gray-500">
                        Quick Add
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {tagOptions.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => toggleTag(tag)}
                            className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${
                              formData.tags.includes(tag)
                                ? "hidden"
                                : "bg-white text-gray-700 border-gray-300"
                            }`}
                          >
                            + {tag}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Visibility Card */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <label className="block text-sm font-semibold text-gray-900 mb-4">
                    Visibility
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {visibilityOptions.map((option) => {
                      // Casting to any tells TS to allow the className prop
                      const Icon = option.icon as any;

                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setSelectedVisibility(option.value)}
                          disabled={isSubmitting}
                          className={`p-4 rounded-lg border-2 text-left transition-all ${
                            selectedVisibility === option.value
                              ? "border-[#5865F2] bg-[#5865F2]/5"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center">
                            <Icon
                              className={`w-5 h-5 ${
                                selectedVisibility === option.value
                                  ? "text-[#5865F2]"
                                  : "text-gray-400"
                              }`}
                            />
                            <span className="ml-2 font-medium">
                              {option.label}
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {option.desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              /* Media Management */
              <div className="space-y-6">
                {/* Upload Info */}
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Media Files
                      </h3>
                      <p className="text-sm text-gray-500">
                        Drag & drop files or click to browse. Maximum{" "}
                        {MAX_FILES} files.
                      </p>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <span className="px-2 py-1 bg-gray-100 rounded">
                        {stats.images} images
                      </span>
                      <span className="mx-2">•</span>
                      <span className="px-2 py-1 bg-gray-100 rounded">
                        {stats.videos} videos
                      </span>
                    </div>
                  </div>
                </div>

                {/* Upload Zone */}
                <div
                  {...getRootProps()}
                  className={`bg-white rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? "border-[#5865F2] bg-[#5865F2]/5"
                      : "border-gray-300 hover:border-[#5865F2] hover:bg-gray-50"
                  } ${
                    isSubmitting || isUploading
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                >
                  <input
                    {...getInputProps()}
                    disabled={isSubmitting || isUploading}
                  />
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="font-medium text-gray-900 mb-2">
                    {isDragActive ? "Drop files here" : "Drag & drop files"}
                  </p>
                  <p className="text-sm text-gray-500">
                    or{" "}
                    <span className="text-[#5865F2] font-medium">browse</span>{" "}
                    from your computer
                  </p>
                  <p className="text-xs text-gray-400 mt-3">
                    Supports images & videos • Max {MAX_SIZE_MB}MB each • Max{" "}
                    {MAX_FILES} files
                  </p>
                </div>

                {/* Files Display */}
                {files.length > 0 ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">
                        Files ({files.length})
                      </h3>
                      {files.some((f) => !f.isUploaded) && (
                        <Button
                          onClick={uploadFiles}
                          variant="theme-primary"
                          size="sm"
                          disabled={isUploading || isSubmitting}
                          icon={
                            isUploading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Zap className="w-4 h-4" />
                            )
                          }
                        >
                          {isUploading ? "Uploading..." : "Upload All"}
                        </Button>
                      )}
                    </div>

                    {/* Grid/List View */}
                    {fileViewMode === "grid" ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {files.map((file, index) => (
                          <div
                            key={file.id}
                            className={`bg-white rounded-lg border overflow-hidden group ${
                              file.isCover
                                ? "border-[#5865F2] ring-1 ring-[#5865F2]"
                                : "border-gray-200"
                            }`}
                          >
                            {/* Thumbnail */}
                            <div className="relative aspect-square bg-gray-100">
                              {file.fileType === "image" ? (
                                <Image
                                  src={file.preview}
                                  alt={file.file?.name || "Image"}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                                />
                              ) : (
                                <div className="flex items-center justify-center h-full">
                                  <Video className="w-8 h-8 text-gray-400" />
                                </div>
                              )}

                              {/* Cover Badge */}
                              {file.isCover && (
                                <div className="absolute top-2 left-2 bg-[#5865F2] text-white text-xs font-medium px-2 py-1 rounded-full">
                                  <Star className="w-3 h-3 inline mr-1" />
                                  Cover
                                </div>
                              )}

                              {/* Upload Status */}
                              {!file.isUploaded && (
                                <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2">
                                  <div className="text-xs text-center">
                                    Needs upload
                                  </div>
                                </div>
                              )}

                              {/* Actions Overlay */}
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <div className="flex space-x-2">
                                  {file.fileType === "image" && (
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setCoverImage(index);
                                      }}
                                      className="p-2 bg-white rounded-lg hover:bg-gray-100"
                                      title="Set as cover"
                                      disabled={isSubmitting}
                                    >
                                      <Camera className="w-4 h-4" />
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeFile(index);
                                    }}
                                    className="p-2 bg-white rounded-lg hover:bg-red-50 text-red-500"
                                    title="Remove"
                                    disabled={isSubmitting}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* File Info */}
                            <div className="p-3">
                              <p className="text-sm font-medium text-gray-900 truncate mb-1">
                                {file.file?.name || "Uploaded file"}
                              </p>
                              <textarea
                                value={file.description}
                                onChange={(e) =>
                                  updateFileDescription(index, e.target.value)
                                }
                                placeholder="Add description..."
                                className="w-full text-xs p-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#5865F2] resize-none"
                                rows={2}
                                disabled={isSubmitting}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      /* List View */
                      <div className="space-y-2">
                        {files.map((file, index) => (
                          <div
                            key={file.id}
                            className={`bg-white rounded-lg border p-3 ${
                              file.isCover
                                ? "border-[#5865F2] bg-[#5865F2]/5"
                                : "border-gray-200"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {/* Thumbnail */}
                              <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                {file.fileType === "image" ? (
                                  <Image
                                    src={file.preview}
                                    alt={file.file?.name || "Image"}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                    sizes="64px"
                                  />
                                ) : (
                                  <div className="flex items-center justify-center h-full">
                                    <Video className="w-6 h-6 text-gray-400" />
                                  </div>
                                )}
                                {file.isCover && (
                                  <div className="absolute top-1 right-1 bg-[#5865F2] text-white text-[10px] font-medium px-1 py-0.5 rounded">
                                    Cover
                                  </div>
                                )}
                              </div>

                              {/* File Info */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center">
                                    <p className="font-medium text-gray-900 truncate text-sm">
                                      {file.file?.name || "Uploaded file"}
                                    </p>
                                    {file.isUploaded ? (
                                      <CheckCircle className="w-4 h-4 text-green-500 ml-2" />
                                    ) : (
                                      <AlertCircle className="w-4 h-4 text-yellow-500 ml-2" />
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    {file.fileType === "image" && (
                                      <button
                                        onClick={() => setCoverImage(index)}
                                        disabled={isSubmitting}
                                        className={`text-xs px-2 py-1 rounded ${
                                          file.isCover
                                            ? "bg-[#5865F2] text-white"
                                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                        }`}
                                      >
                                        {file.isCover ? "Cover" : "Set Cover"}
                                      </button>
                                    )}
                                    <button
                                      onClick={() => removeFile(index)}
                                      disabled={isSubmitting}
                                      className="p-1 text-gray-400 hover:text-red-500"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>

                                {/* Progress */}
                                {!file.isUploaded && (
                                  <div className="mb-2">
                                    <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                      <span>Uploading...</span>
                                      <span>{file.uploadProgress}%</span>
                                    </div>
                                    <div className="h-1.5 bg-gray-200 rounded-full">
                                      <div
                                        className="h-full bg-gradient-to-r from-[#5865F2] to-[#94BBFF] rounded-full"
                                        style={{
                                          width: `${file.uploadProgress}%`,
                                        }}
                                      />
                                    </div>
                                  </div>
                                )}

                                {/* Description */}
                                <textarea
                                  value={file.description}
                                  onChange={(e) =>
                                    updateFileDescription(index, e.target.value)
                                  }
                                  placeholder="Add description..."
                                  className="w-full text-xs p-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-[#5865F2] resize-none"
                                  rows={2}
                                  disabled={isSubmitting}
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
                    <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="font-semibold text-gray-900 mb-2">
                      No Media Files
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Add images or videos to your post
                    </p>
                    <p className="text-sm text-gray-400">
                      Maximum {MAX_FILES} files • {MAX_SIZE_MB}MB each
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Quick Actions & Preview */}
          <div className="space-y-6">
            {/* Quick Actions Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <Zap className="w-4 h-4 mr-2" />
                Quick Actions
              </h3>

              <div className="space-y-3">
                <Button
                  onClick={() => handleSubmit(false)}
                  variant="theme-primary"
                  className="w-full"
                  disabled={isSubmitting}
                  icon={
                    isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )
                  }
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>

                <Button
                  onClick={() => handleSubmit(true)}
                  variant="outline"
                  className="w-full"
                  disabled={isSubmitting}
                >
                  Save as Draft
                </Button>

                <div className="pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-2">Publish options:</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => {
                        setSelectedVisibility("PUBLIC");
                        handleSubmit(false);
                      }}
                      variant="custom-blue"
                      size="sm"
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      Public
                    </Button>
                    <Button
                      onClick={() => {
                        setSelectedVisibility("FOLLOWERS");
                        handleSubmit(false);
                      }}
                      variant="custom-blue"
                      size="sm"
                      className="w-full"
                      disabled={isSubmitting}
                    >
                      Followers
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Preview Card */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                <EyeIcon className="w-4 h-4 mr-2" />
                Preview
              </h3>

              <div className="space-y-4">
                {/* Cover Preview */}
                {previewImage ? (
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                    {previewImage.fileType === "image" ? (
                      <Image
                        src={previewImage.preview}
                        alt="Preview"
                        fill
                        className="object-cover"
                        unoptimized
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Video className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="aspect-video rounded-lg bg-gray-100 flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  </div>
                )}

                {/* Post Info */}
                <div>
                  <h4 className="font-bold text-gray-900 truncate">
                    {formData.title || "Untitled Post"}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {formData.description || "No description"}
                  </p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="font-bold text-gray-900">
                      {files.length}
                    </div>
                    <div className="text-xs text-gray-500">Files</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="font-bold text-gray-900">
                      {formData.tags.length}
                    </div>
                    <div className="text-xs text-gray-500">Tags</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="font-bold text-gray-900">
                      {selectedVisibility === "PRIVATE"
                        ? "Pvt"
                        : selectedVisibility === "FOLLOWERS"
                          ? "Fol"
                          : "Pub"}
                    </div>
                    <div className="text-xs text-gray-500">Visibility</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tips Card */}
            <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
              <div className="flex items-start">
                <Info className="w-5 h-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-blue-900 mb-1">Quick Tips</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Set a cover image for better preview</li>
                    <li>• Add descriptions to each media file</li>
                    <li>• Use relevant tags for discoverability</li>
                    <li>• Choose appropriate visibility</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button
              onClick={() => setIsDeleteModalOpen(true)}
              variant="outline"
              className="w-full border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-400"
              icon={<Trash2 className="w-4 h-4" />}
            >
              Delete This Post
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-auto">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mr-3">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">
                    Delete Post
                  </h3>
                  <p className="text-sm text-gray-500">
                    This action cannot be undone
                  </p>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-red-800 font-medium mb-1">
                  Are you sure you want to delete this post?
                </p>
                <p className="text-xs text-red-700">
                  • All associated data will be permanently removed
                  <br />
                  • This includes images, comments, and likes
                  <br />• This action is irreversible
                </p>
              </div>

              <div className="flex space-x-3">
                <Button
                  onClick={() => setIsDeleteModalOpen(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDeletePost}
                  variant="theme-primary"
                  className="flex-1"
                  icon={<Trash2 className="w-4 h-4" />}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Delete Post"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 shadow-xl max-w-sm mx-4">
            <div className="flex flex-col items-center">
              <Loader2 className="w-8 h-8 text-[#5865F2] animate-spin mb-3" />
              <h3 className="font-semibold text-gray-900 mb-1">
                Saving Changes
              </h3>
              <p className="text-sm text-gray-600 text-center">
                Updating your post...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditPostForm;
