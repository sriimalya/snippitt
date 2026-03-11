"use client";

import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { useParams, useRouter } from "next/navigation";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import Image from "next/image";
import Button from "@/app/components/Button";
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
  Save,
  Eye as EyeIcon,
  Zap,
  Camera,
  Trash2,
  X,
  Search,
  Sparkles,
  Hash,
  Tag,
  ChevronDown,
  Maximize2,
} from "lucide-react";
import { getPost } from "@/actions/posts/getPost";
import { deletePost } from "@/actions/posts/deletePost";
import { Category, Visibility } from "@/app/generated/prisma/enums";
import type { Post } from "@/schemas/post";
import { updatePost } from "@/actions/posts/updatePost";
import { generatePresignedUrlAction } from "@/actions/upload";
import { getTags, checkTagExists } from "@/actions/tags";

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
  error,
  children,
}: {
  label: string;
  counter?: string;
  error?: string;
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
    {error && (
      <p className="flex items-center gap-1.5 text-xs text-red-600 font-medium">
        <span className="w-1 h-1 rounded-full bg-red-500 inline-block flex-shrink-0" />
        {error}
      </p>
    )}
  </div>
);

const MAX_SIZE_MB = 10;
const MAX_FILES = 10;

const VISIBILITY_OPTIONS: {
  value: Visibility;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  desc: string;
}[] = [
  { value: "PRIVATE", label: "Private", icon: Lock, desc: "Only you" },
  {
    value: "FOLLOWERS",
    label: "Followers",
    icon: Users,
    desc: "Followers only",
  },
  { value: "PUBLIC", label: "Public", icon: Globe, desc: "Everyone" },
];

const EditPostForm = () => {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;

  /* state */
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [post, setPost] = useState<Post | null>(null);
  const [files, setFiles] = useState<FileWithMetadata[]>([]);
  const [viewMode, setViewMode] = useState<"details" | "media">("media");
  const [selectedVisibility, setSelectedVisibility] =
    useState<Visibility>("PRIVATE");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "" as Category,
    tags: [] as string[],
  });

  /* tag state */
  const [tagSearch, setTagSearch] = useState("");
  const [dbTags, setDbTags] = useState<string[]>([]);
  const [isTagInDb, setIsTagInDb] = useState(false);
  const [isCheckingTag, setIsCheckingTag] = useState(false);

  const [isMobile, setIsMobile] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setIsMobile(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
  }, []);

  const cameraPhotoRef = useRef<HTMLInputElement>(null);
  const cameraVideoRef = useRef<HTMLInputElement>(null);

  const [previewFile, setPreviewFile] = useState<{
    src: string;
    type: "image" | "video";
    name: string;
  } | null>(null);

  /* ── fetch tags ── */
  useEffect(() => {
    getTags().then((res) => {
      if (res.success && res.data) setDbTags(res.data);
    });
  }, []);

  useEffect(() => {
    if (tagSearch.trim().length < 2) {
      setIsTagInDb(false);
      setIsCheckingTag(false);
      return;
    }

    // Mark as checking immediately — before the debounce fires
    setIsCheckingTag(true);
    setIsTagInDb(false); // reset stale result

    const delayDebounceFn = setTimeout(async () => {
      const capturedSearch = tagSearch.trim(); // capture for closure safety
      const { exists } = await checkTagExists(capturedSearch);

      // Only update if tagSearch hasn't changed since this check started
      setIsTagInDb(exists);
      setIsCheckingTag(false);
    }, 300);

    return () => {
      clearTimeout(delayDebounceFn);
      // Don't reset isCheckingTag here — the cleanup fires on every keystroke
      // and would immediately hide the pending state
    };
  }, [tagSearch]);

  const tagOptions = useMemo(() => {
    const baseTags = [
      "Technology",
      "Design",
      "Development",
      "Business",
      "Art",
      "Photography",
      "Travel",
      "Food",
      "Health",
      "Education",
    ];
    const map = new Map<string, string>();
    baseTags.forEach((t) => map.set(t.toLowerCase(), t));
    dbTags.forEach((t) => {
      map.set(t.toLowerCase(), t.charAt(0).toUpperCase() + t.slice(1));
    });
    return Array.from(map.values());
  }, [dbTags]);

  const filteredTags = useMemo(() => {
    if (!tagSearch.trim()) return tagOptions;
    return tagOptions.filter((t) =>
      t.toLowerCase().includes(tagSearch.toLowerCase()),
    );
  }, [tagOptions, tagSearch]);

  const displayedTags = filteredTags;

  const canCreateTag = useMemo(() => {
    const searchLower = tagSearch.trim().toLowerCase();
    if (!searchLower) return false;
    if (isCheckingTag) return false;

    const inVisibleList = tagOptions.some(
      (t) => t.toLowerCase() === searchLower,
    );
    const isAlreadySelected = formData.tags.some(
      (t) => t.toLowerCase() === searchLower,
    );

    return !inVisibleList && !isAlreadySelected && !isTagInDb;
  }, [tagSearch, tagOptions, formData.tags, isTagInDb, isCheckingTag]);

  /* ── fetch post ── */
  useEffect(() => {
    if (!postId) return;
    (async () => {
      try {
        setIsLoading(true);
        const result = await getPost(postId);
        if (result.success && result.data) {
          const d = result.data;
          setPost(d);
          setFormData({
            title: d.title,
            description: d.description,
            category: d.category as Category,
            tags: d.tags || [],
          });
          setSelectedVisibility(d.visibility || "PRIVATE");
          setFiles(
            d.images.map((img: any, i: number) => ({
              id: img.id || `existing-${i}`,
              file: null,
              preview: img.url,
              description: img.description || "",
              uploadProgress: 100,
              isUploaded: true,
              s3Url: img.url,
              isCover: img.isCover || false,
              fileType: img.url.match(/\.(mp4|webm|avi|mov)$/i)
                ? "video"
                : "image",
              existingImageId: img.id,
            })),
          );
        } else {
          toast.error(result.message || "Failed to load post");
          router.push("/my-posts");
        }
      } catch {
        toast.error("Failed to load post");
        router.push("/my-posts");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [postId, router]);

  /* cleanup blob URLs on unmount */
  useEffect(() => {
    return () => {
      files.forEach((f) => {
        if (f.preview.startsWith("blob:")) URL.revokeObjectURL(f.preview);
      });
    };
  }, [files]);

  /* ── derived ── */
  const stats = useMemo(
    () => ({
      total: files.length,
      uploaded: files.filter((f) => f.isUploaded).length,
      images: files.filter((f) => f.fileType === "image").length,
      videos: files.filter((f) => f.fileType === "video").length,
    }),
    [files],
  );

  /* ── file helpers ── */
  const detectFileType = useCallback(
    (file: File): "image" | "video" =>
      file.type.startsWith("image/") ? "image" : "video",
    [],
  );

  const onDrop = useCallback(
    (accepted: File[], rejected: any[]) => {
      // 1. Add rejected array here
      // Handle manual limit for total files
      if (files.length + accepted.length > MAX_FILES) {
        toast.error(`Maximum ${MAX_FILES} files allowed`);
        return;
      }

      // 2. Handle automatic rejections (Size or Type)
      if (rejected.length > 0) {
        rejected.forEach(({ file, errors }) => {
          errors.forEach((err: any) => {
            if (err.code === "file-too-large") {
              toast.error(`"${file.name}" is too large. Max ${MAX_SIZE_MB}MB`);
            }
            if (err.code === "file-invalid-type") {
              toast.error(`"${file.name}" is an unsupported file type`);
            }
          });
        });
      }

      // 3. Process the valid files
      // (You can remove your manual size check inside the filter now)
      const newFiles = accepted.map((f) => ({
        id: `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file: f,
        preview: URL.createObjectURL(f),
        description: "",
        uploadProgress: 0,
        isUploaded: false,
        isCover: files.length === 0 && detectFileType(f) === "image",
        fileType: detectFileType(f),
      }));

      if (newFiles.length > 0) {
        setFiles((prev) => [...prev, ...newFiles]);
        toast.success(`${newFiles.length} file(s) added`);
      }
    },
    [files.length, detectFileType],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
      "video/*": [".mp4", ".webm", ".avi", ".mov"],
    },
    multiple: true,
    maxSize: MAX_SIZE_MB * 1024 * 1024,
  });

  const handleCameraCapture = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files?.length) return;

      const accepted: File[] = [];
      const rejected: {
        file: File;
        errors: { code: string; message: string }[];
      }[] = [];

      Array.from(e.target.files).forEach((file) => {
        const errors: { code: string; message: string }[] = [];

        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
          errors.push({
            code: "file-too-large",
            message: `File exceeds ${MAX_SIZE_MB}MB`,
          });
        }

        if (
          !file.type.startsWith("image/") &&
          !file.type.startsWith("video/")
        ) {
          errors.push({
            code: "file-invalid-type",
            message: "Unsupported file type",
          });
        }

        if (errors.length > 0) {
          rejected.push({ file, errors });
        } else {
          accepted.push(file);
        }
      });

      // Handle rejections as before
      if (rejected.length > 0) {
        rejected.forEach(({ file, errors }) => {
          errors.forEach((err) => {
            if (err.code === "file-too-large")
              toast.error(`"${file.name}" is too large. Max ${MAX_SIZE_MB}MB`);
            if (err.code === "file-invalid-type")
              toast.error(`"${file.name}" is an unsupported file type`);
          });
        });
      }

      if (!accepted.length) return;

      if (files.length + accepted.length > MAX_FILES) {
        toast.error(`Maximum ${MAX_FILES} files allowed`);
        return;
      }

      // Use FileReader for camera files instead of createObjectURL
      accepted.forEach((file) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const preview = reader.result as string; // base64 data URL — reliable on all mobile browsers

          setFiles((prev) => [
            ...prev,
            {
              id: `new-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              file,
              preview, // ← data URL instead of blob URL
              description: "",
              uploadProgress: 0,
              isUploaded: false,
              isCover: prev.length === 0 && detectFileType(file) === "image",
              fileType: detectFileType(file),
            },
          ]);
        };
        reader.readAsDataURL(file);
      });

      toast.success(`${accepted.length} file(s) added`);
      e.target.value = "";
    },
    [files.length, detectFileType],
  );

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => {
      const next = [...prev];
      const removed = next.splice(index, 1)[0];
      if (!removed.isUploaded && removed.preview.startsWith("blob:"))
        URL.revokeObjectURL(removed.preview);
      if (removed.isCover) {
        const fi = next.findIndex((f) => f.fileType === "image");
        if (fi !== -1) {
          next[fi].isCover = true;
          toast.info("New cover auto-selected");
        }
      }
      return next;
    });
    toast.success("File removed");
  }, []);

  const setCoverImage = useCallback(
    (index: number) => {
      if (files[index].fileType !== "image") {
        toast.error("Only images can be the cover");
        return;
      }

      const isAlreadyCover = files[index].isCover;

      setFiles((prev) =>
        prev.map((f, i) => ({
          ...f,
          isCover: isAlreadyCover
            ? false
            : i === index && f.fileType === "image",
        })),
      );

      toast.success(isAlreadyCover ? "Cover removed" : "Cover image set");
    },
    [files],
  );

  const updateFileDescription = useCallback(
    (index: number, description: string) => {
      setFiles((prev) => {
        const n = [...prev];
        n[index].description = description;
        return n;
      });
    },
    [],
  );

  const toggleTag = useCallback((tag: string) => {
    setFormData((prev) => {
      const exists = prev.tags.some(
        (t) => t.toLowerCase() === tag.toLowerCase(),
      );
      return {
        ...prev,
        tags: exists
          ? prev.tags.filter((t) => t.toLowerCase() !== tag.toLowerCase())
          : [...prev.tags, tag],
      };
    });
  }, []);

  /* ── upload ── */
  const uploadFiles = useCallback(async (): Promise<boolean> => {
    const pending = files.filter((f) => !f.isUploaded);
    if (!pending.length) return true;
    setIsUploading(true);
    try {
      const results = await Promise.allSettled(
        pending.map(async (fd) => {
          const r = await generatePresignedUrlAction({
            fileName: fd.file!.name,
            fileType: fd.file!.type,
          });
          if (!r.success || !r.data)
            throw new Error(r.message || "No upload URL");
          const { uploadUrl, key, fileUrl } = r.data;
          await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("PUT", uploadUrl, true);
            xhr.setRequestHeader("Content-Type", fd.file!.type);
            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable)
                setFiles((prev) =>
                  prev.map((f) =>
                    f.id === fd.id
                      ? {
                          ...f,
                          uploadProgress: Math.round(
                            (e.loaded / e.total) * 100,
                          ),
                        }
                      : f,
                  ),
                );
            };
            xhr.onload = () => {
              if (xhr.status === 200) {
                setFiles((prev) =>
                  prev.map((f) =>
                    f.id === fd.id
                      ? {
                          ...f,
                          isUploaded: true,
                          s3Key: key,
                          s3Url: fileUrl,
                          uploadProgress: 100,
                        }
                      : f,
                  ),
                );
                resolve();
              } else reject(new Error("Upload failed"));
            };
            xhr.onerror = () => reject(new Error("Upload failed"));
            xhr.send(fd.file!);
          });
          return { success: true };
        }),
      );
      const failures = results.filter(
        (r) =>
          r.status === "rejected" ||
          (r.status === "fulfilled" && !r.value.success),
      );
      if (failures.length) {
        toast.error(`${failures.length} file(s) failed to upload`);
        return false;
      }
      return true;
    } catch {
      toast.error("Upload failed");
      return false;
    } finally {
      setIsUploading(false);
    }
  }, [files]);

  /* ── submit ── */
  const handleSubmit = useCallback(
    async (isDraft = false) => {
      if (!formData.title.trim()) {
        toast.error("Please enter a title");
        return;
      }
      if (!formData.category) {
        toast.error("Please select a category");
        return;
      }
      if (!formData.tags.length) {
        toast.error("Please add at least one tag");
        return;
      }

      const pending = files.filter((f) => !f.isUploaded);
      if (pending.length) {
        if (
          !window.confirm(
            `${pending.length} file(s) not yet uploaded. Upload now?`,
          )
        )
          return;
        if (!(await uploadFiles())) {
          toast.error("Some uploads failed");
          return;
        }
      }

      /* ensure cover */
      const imgs = files.filter((f) => f.fileType === "image");
      if (imgs.length && !files.some((f) => f.isCover)) {
        const fi = files.findIndex((f) => f.fileType === "image");
        setFiles((prev) => prev.map((f, i) => ({ ...f, isCover: i === fi })));
        toast.info("Auto-set first image as cover");
      }

      setIsSubmitting(true);
      try {
        const result = await updatePost({
          id: postId,
          ...formData,
          visibility: isDraft ? "PRIVATE" : selectedVisibility,
          isDraft,
          images: files.map((f) => ({
            url: f.isUploaded ? f.s3Url || f.preview : f.preview,
            description: f.description,
            isCover: f.isCover,
            existingImageId: f.existingImageId,
          })),
        });
        if (result.success) {
          setIsSubmitting(false);
          setIsRedirecting(true);
          toast.success(isDraft ? "Draft saved!" : "Post published!");
          files.forEach((f) => {
            if (f.preview.startsWith("blob:")) URL.revokeObjectURL(f.preview);
          });
          setTimeout(() => router.push(`/posts/${postId}`), 200);
        } else {
          setIsSubmitting(false);
          setIsRedirecting(false);
          toast.error(result.message || "Failed to save");
        }
      } catch (e: any) {
        toast.error(e.message || "Failed to save");
      } finally {
        setIsSubmitting(false);
        setIsRedirecting(false);
      }
    },
    [formData, files, postId, selectedVisibility, uploadFiles, router],
  );

  /* ── delete ── */
  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      const result = await deletePost(postId);
      if (result.success) {
        toast.success("Post deleted");
        router.push("/dashboard/my-posts");
      } else {
        toast.error(result.message || "Failed to delete");
      }
    } catch {
      toast.error("Failed to delete");
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  }, [postId, router]);

  /* Loading states */
  if (isLoading)
    return (
      <div className="min-h-screen bg-[#F8FAFD] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-[#5865F2] border-t-transparent rounded-full"></div>
      </div>
    );

  if (!post)
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center max-w-sm w-full space-y-4">
          <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-gray-900">
              Post not found
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              The post you&apos;re looking for doesn&apos;t exist.
            </p>
          </div>
          <Button
            onClick={() => router.push("/my-posts")}
            variant="primary"
            size="sm"
            className="rounded-xl shadow-sm shadow-indigo-200"
          >
            Back to My Posts
          </Button>
        </div>
      </div>
    );

  /* Main render */
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hidden camera inputs */}
      <input
        ref={cameraPhotoRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleCameraCapture}
      />
      <input
        ref={cameraVideoRef}
        type="file"
        accept="video/*"
        capture="environment"
        className="hidden"
        onChange={handleCameraCapture}
      />
      {/* ── Saving overlay */}
      {(isSubmitting || isRedirecting) && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-8 max-w-xs w-full mx-4 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
            <div>
              <p className="text-sm font-bold text-gray-900">
                {isRedirecting ? "Opening post page" : "Saving your changes"}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {isRedirecting ? "Almost there..." : "Just a moment..."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          <header>
            <button
              type="button"
              onClick={() => router.push("/dashboard")}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors mb-6 group"
            >
              <ArrowLeft
                size={15}
                className="group-hover:-translate-x-0.5 transition-transform"
              />
              Back
            </button>

            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
              <div className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900">
                  Edit Post
                </h1>
                <p className="text-sm text-gray-500">
                  Make changes to your post and save when you&apos;re done.
                </p>
              </div>
            </div>
          </header>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column (2/3) */}
            <div className="lg:col-span-2 space-y-4">
              {/* Stats bar */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm px-6 py-4">
                <div className="grid grid-cols-4 divide-x divide-gray-100">
                  {[
                    { v: stats.total, label: "Files", color: "text-gray-900" },
                    {
                      v: stats.uploaded,
                      label: "Uploaded",
                      color: "text-green-600",
                    },
                    {
                      v: stats.images,
                      label: "Images",
                      color: "text-indigo-600",
                    },
                    {
                      v: stats.videos,
                      label: "Videos",
                      color: "text-purple-600",
                    },
                  ].map(({ v, label, color }) => (
                    <div
                      key={label}
                      className="text-center px-4 first:pl-0 last:pr-0"
                    >
                      <p
                        className={`text-xl font-extrabold tabular-nums ${color}`}
                      >
                        {v}
                      </p>
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Tab bar */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-1.5 flex gap-1">
                {(
                  [
                    {
                      key: "details",
                      label: "Details",
                      icon: <FileText size={14} />,
                    },
                    {
                      key: "media",
                      label: `Media (${files.length})`,
                      icon: <ImageIcon size={14} />,
                    },
                  ] as const
                ).map(({ key, label, icon }) => (
                  <button
                    key={key}
                    onClick={() => setViewMode(key)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all
                    ${
                      viewMode === key
                        ? "bg-primary text-white shadow-sm"
                        : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                    }`}
                  >
                    {icon}
                    {label}
                  </button>
                ))}
              </div>

              {/* Details panel */}
              {viewMode === "details" && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  {/* progress strip */}
                  <div className="h-1 bg-gray-100">
                    <div className="h-full w-full bg-gradient-to-r from-indigo-500 to-indigo-300" />
                  </div>

                  <div className="divide-y divide-gray-100">
                    {/* Core fields */}
                    <div className="p-6 sm:p-8 space-y-6">
                      <Field
                        label="Title"
                        counter={`${formData.title.length}/100`}
                      >
                        <div className="relative group">
                          <input
                            type="text"
                            value={formData.title}
                            onChange={(e) =>
                              setFormData((p) => ({
                                ...p,
                                title: e.target.value.slice(0, 100),
                              }))
                            }
                            placeholder="Give your post a title…"
                            disabled={isSubmitting}
                            className={inputClass()}
                          />
                          {formData.title && (
                            <button
                              type="button"
                              onClick={() =>
                                setFormData((p) => ({ ...p, title: "" }))
                              }
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
                          placeholder="Describe your post — context, notes, key details…"
                          disabled={isSubmitting}
                          className={`${inputClass()} resize-none`}
                        />
                      </Field>

                      <Field label="Category">
                        <div className="relative">
                          <select
                            value={formData.category}
                            onChange={(e) =>
                              setFormData((p) => ({
                                ...p,
                                category: e.target.value as Category,
                              }))
                            }
                            disabled={isSubmitting}
                            className={`${inputClass()} appearance-none pr-10 cursor-pointer`}
                          >
                            <option value="">Select a category</option>
                            {Object.values(Category).map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                          <ChevronDown
                            size={15}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                          />
                        </div>
                      </Field>
                    </div>

                    {/* Tags */}
                    <div className="p-6 sm:p-8 space-y-4 bg-gray-50/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Tag size={14} className="text-gray-400" />
                          <span className="text-sm font-semibold text-gray-900">
                            Tags
                          </span>
                          {formData.tags.length > 0 && (
                            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                              {formData.tags.length} selected
                            </span>
                          )}
                        </div>
                        {formData.tags.length > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              setFormData((p) => ({ ...p, tags: [] }))
                            }
                            className="text-xs font-medium text-gray-400 hover:text-red-500 transition-colors"
                          >
                            Clear all
                          </button>
                        )}
                      </div>

                      {/* selected pills */}
                      {formData.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 p-3 bg-white rounded-xl border border-gray-100">
                          {formData.tags.map((tag) => (
                            <span
                              key={tag}
                              className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg text-xs font-medium"
                            >
                              <Hash size={10} />
                              {tag}
                              <button
                                type="button"
                                onClick={() => toggleTag(tag)}
                                className="ml-0.5 text-indigo-400 hover:text-indigo-700 transition-colors"
                              >
                                <X size={11} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Tag picker panel */}
                      <div className="bg-white rounded-xl border border-gray-100 p-4 space-y-4">
                        {/* Search */}
                        <div className="relative">
                          <Search
                            size={14}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                          />
                          <input
                            type="text"
                            value={tagSearch}
                            onChange={(e) => setTagSearch(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && tagSearch.trim()) {
                                e.preventDefault();
                                toggleTag(tagSearch.trim());
                                setTagSearch("");
                              }
                            }}
                            placeholder="Search or create a tag (Enter to add)…"
                            className="w-full pl-9 pr-9 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 focus:bg-white transition-all"
                          />
                          {tagSearch && (
                            <button
                              type="button"
                              onClick={() => setTagSearch("")}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              <X size={14} />
                            </button>
                          )}
                          {isCheckingTag && (
                            <Loader2
                              size={13}
                              className="absolute right-8 top-1/2 -translate-y-1/2 text-gray-400 animate-spin"
                            />
                          )}
                        </div>

                        {/* Tag chips */}
                        <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
                          {/* Create new */}
                          {canCreateTag && (
                            <button
                              type="button"
                              onClick={() => {
                                toggleTag(tagSearch.trim());
                                setTagSearch("");
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-dashed border-indigo-300 text-indigo-600 hover:bg-indigo-50 text-xs font-medium transition-all"
                            >
                              <Sparkles size={11} />
                              Create &quot;{tagSearch.trim()}&quot;
                            </button>
                          )}

                          {/* DB match — exists in DB but not in visible list */}
                          {isTagInDb &&
                            !isCheckingTag &&
                            !tagOptions.some(
                              (t) =>
                                t.toLowerCase() ===
                                tagSearch.trim().toLowerCase(),
                            ) &&
                            !formData.tags.some(
                              (t) =>
                                t.toLowerCase() ===
                                tagSearch.trim().toLowerCase(),
                            ) && (
                              <button
                                type="button"
                                onClick={() => {
                                  toggleTag(tagSearch.trim());
                                  setTagSearch("");
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-gray-600 border border-gray-200 hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50 text-xs font-medium transition-all"
                              >
                                <Hash size={10} className="opacity-60" />
                                {tagSearch.trim().charAt(0).toUpperCase() +
                                  tagSearch.trim().slice(1)}
                              </button>
                            )}

                          {displayedTags.map((tag) => {
                            const isSelected = formData.tags.some(
                              (t) => t.toLowerCase() === tag.toLowerCase(),
                            );
                            return (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => toggleTag(tag)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all
                                ${
                                  isSelected
                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                    : "bg-white text-gray-600 border-gray-200 hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50"
                                }`}
                              >
                                <Hash
                                  size={10}
                                  className={
                                    isSelected ? "opacity-80" : "opacity-40"
                                  }
                                />
                                {tag}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Visibility */}
                    <div className="p-6 sm:p-8 space-y-4">
                      <div className="flex items-center gap-2">
                        <EyeIcon size={14} className="text-gray-400" />
                        <span className="text-sm font-semibold text-gray-900">
                          Visibility
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        {VISIBILITY_OPTIONS.map(
                          ({ value, label, icon: Icon, desc }) => {
                            const active = selectedVisibility === value;
                            return (
                              <button
                                key={value}
                                type="button"
                                onClick={() => setSelectedVisibility(value)}
                                disabled={isSubmitting}
                                className={`p-4 rounded-xl border-2 text-left transition-all group
                              ${
                                active
                                  ? "border-indigo-500 bg-indigo-50"
                                  : "border-gray-200 hover:border-indigo-200 hover:bg-gray-50"
                              }`}
                              >
                                <Icon
                                  size={15}
                                  className={`mb-2 transition-colors ${active ? "text-indigo-600" : "text-gray-400 group-hover:text-indigo-400"}`}
                                />
                                <p
                                  className={`text-sm font-bold ${active ? "text-indigo-700" : "text-gray-700"}`}
                                >
                                  {label}
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {desc}
                                </p>
                              </button>
                            );
                          },
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Media panel */}
              {viewMode === "media" && (
                <div className="space-y-4">
                  {/* Dropzone */}
                  {files.length > 0 ? (
                    <div
                      className={`bg-white rounded-2xl border border-gray-200 overflow-hidden transition-all divide-y divide-gray-100
    ${isSubmitting || isUploading ? "opacity-50 pointer-events-none" : ""}
    ${files.length >= MAX_FILES ? "opacity-40 pointer-events-none" : ""}`}
                    >
                      {/* Browse row */}
                      <div
                        {...getRootProps()}
                        className={`flex items-center gap-3 px-5 py-3.5 cursor-pointer transition-all
        ${isDragActive ? "bg-indigo-50" : "hover:bg-gray-50"}`}
                      >
                        <input
                          {...getInputProps()}
                          disabled={
                            isSubmitting ||
                            isUploading ||
                            files.length >= MAX_FILES
                          }
                        />
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors
        ${isDragActive ? "bg-indigo-100" : "bg-gray-100"}`}
                        >
                          <Upload
                            size={15}
                            className={
                              isDragActive ? "text-indigo-600" : "text-gray-400"
                            }
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-700">
                            {isDragActive ? "Drop to add" : "Browse files"}
                          </p>
                          <p className="text-xs text-gray-400">
                            {files.length}/{MAX_FILES} used · {MAX_SIZE_MB} MB
                            max
                          </p>
                        </div>
                        {files.length >= MAX_FILES ? (
                          <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-3 py-1 rounded-lg flex-shrink-0">
                            Limit reached
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg flex-shrink-0">
                            Browse
                          </span>
                        )}
                      </div>

                      {/* Camera rows — mobile only */}
                      {isMobile && files.length < MAX_FILES && (
                        <>
                          <button
                            type="button"
                            onClick={() => cameraPhotoRef.current?.click()}
                            disabled={isSubmitting || isUploading}
                            className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-all disabled:opacity-40"
                          >
                            <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                              <Camera size={15} className="text-gray-400" />
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <p className="text-sm font-semibold text-gray-700">
                                Take a photo
                              </p>
                              <p className="text-xs text-gray-400">
                                Opens rear camera
                              </p>
                            </div>
                            <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-3 py-1 rounded-lg flex-shrink-0">
                              Photo
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => cameraVideoRef.current?.click()}
                            disabled={isSubmitting || isUploading}
                            className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-all disabled:opacity-40"
                          >
                            <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                              <Video size={15} className="text-gray-400" />
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <p className="text-sm font-semibold text-gray-700">
                                Record a video
                              </p>
                              <p className="text-xs text-gray-400">
                                Opens rear camera
                              </p>
                            </div>
                            <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-3 py-1 rounded-lg flex-shrink-0">
                              Video
                            </span>
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    /* Empty state — full dropzone + camera buttons below */
                    <div className="space-y-2">
                      <div
                        {...getRootProps()}
                        className={`bg-white rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all
        ${isDragActive ? "border-indigo-400 bg-indigo-50" : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"}
        ${isSubmitting || isUploading ? "opacity-50 pointer-events-none" : ""}`}
                      >
                        <input
                          {...getInputProps()}
                          disabled={isSubmitting || isUploading}
                        />
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors
        ${isDragActive ? "bg-indigo-100" : "bg-gray-100"}`}
                        >
                          <Upload
                            size={22}
                            className={
                              isDragActive ? "text-indigo-600" : "text-gray-400"
                            }
                          />
                        </div>
                        <p className="text-sm font-semibold text-gray-700 mb-1">
                          {isDragActive
                            ? "Drop files here"
                            : "Drag & drop files"}
                        </p>
                        <p className="text-xs text-gray-400">
                          or{" "}
                          <span className="text-indigo-600 font-medium">
                            browse
                          </span>{" "}
                          from your computer
                        </p>
                        <p className="text-[11px] text-gray-300 mt-3 uppercase tracking-wider font-bold">
                          Images & videos · up to {MAX_FILES} files ·{" "}
                          {MAX_SIZE_MB} MB max
                        </p>
                      </div>

                      {/* Camera options — mobile only, empty state */}
                      {isMobile && (
                        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden divide-y divide-gray-100">
                          <button
                            type="button"
                            onClick={() => cameraPhotoRef.current?.click()}
                            disabled={isSubmitting || isUploading}
                            className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-all disabled:opacity-50"
                          >
                            <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                              <Camera size={15} className="text-gray-400" />
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-semibold text-gray-700">
                                Take a photo
                              </p>
                              <p className="text-xs text-gray-400">
                                Capture directly with your camera
                              </p>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => cameraVideoRef.current?.click()}
                            disabled={isSubmitting || isUploading}
                            className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-all disabled:opacity-50"
                          >
                            <div className="w-8 h-8 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                              <Video size={15} className="text-gray-400" />
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-semibold text-gray-700">
                                Record a video
                              </p>
                              <p className="text-xs text-gray-400">
                                Record directly with your camera
                              </p>
                            </div>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Files */}
                  {files.length > 0 ? (
                    <div className="space-y-3">
                      {/* Header */}
                      <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-gray-700">
                            {files.length} file{files.length !== 1 ? "s" : ""}
                          </span>
                          <span className="text-xs text-gray-400">
                            {files.filter((f) => f.isUploaded).length} uploaded
                          </span>
                        </div>
                        {files.some((f) => !f.isUploaded) && (
                          <Button
                            onClick={uploadFiles}
                            variant="primary"
                            size="sm"
                            disabled={isUploading || isSubmitting}
                            className="rounded-xl shadow-sm shadow-indigo-200"
                            icon={
                              isUploading ? (
                                <Loader2 size={13} className="animate-spin" />
                              ) : (
                                <Zap size={13} />
                              )
                            }
                          >
                            {isUploading ? "Uploading…" : "Upload All"}
                          </Button>
                        )}
                      </div>

                      <div className="space-y-2">
                        {files.map((file, index) => (
                          <div
                            key={file.id}
                            className={`rounded-2xl border transition-all duration-200
          ${
            file.isCover
              ? "border-indigo-200 bg-gradient-to-br from-indigo-50/60 to-white shadow-sm shadow-indigo-100"
              : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
          }`}
                          >
                            {/* Cover badge strip */}
                            {file.isCover && (
                              <div className="flex items-center gap-1.5 px-4 pt-3 pb-0">
                                <Star
                                  size={11}
                                  className="text-indigo-500 fill-indigo-500"
                                />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500">
                                  Cover Image
                                </span>
                              </div>
                            )}

                            <div className="flex flex-col sm:flex-row items-start gap-3 p-4">
                              {/* Thumbnail */}
                              <div
                                onClick={() =>
                                  setPreviewFile({
                                    src: file.preview,
                                    type: file.fileType as "image" | "video",
                                    name: file.file?.name || "Uploaded file",
                                  })
                                }
                                className="relative w-full sm:w-[72px] h-48 sm:h-[72px] rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 shadow-sm cursor-zoom-in group"
                              >
                                {file.fileType === "image" ? (
                                  <Image
                                    src={file.preview}
                                    alt={file.file?.name || "Image"}
                                    fill
                                    className="object-cover transition-transform duration-200 group-hover:scale-105"
                                    unoptimized
                                    sizes="(max-width: 640px) 100vw, 72px"
                                  />
                                ) : (
                                  <video
                                    src={file.preview}
                                    className="absolute inset-0 w-full h-full object-cover"
                                    muted
                                    preload="metadata"
                                  />
                                )}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200 flex items-center justify-center">
                                  <Maximize2
                                    size={14}
                                    className="text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                  />
                                </div>
                              </div>

                              {/* Content */}
                              <div className="flex-1 w-full min-w-0 space-y-2.5">
                                {/* Top row: name + status + actions */}
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    {file.isUploaded ? (
                                      <CheckCircle
                                        size={13}
                                        className="text-emerald-500 flex-shrink-0"
                                      />
                                    ) : (
                                      <AlertCircle
                                        size={13}
                                        className="text-amber-400 flex-shrink-0"
                                      />
                                    )}
                                    <p className="text-sm font-semibold text-gray-900 truncate">
                                      {file.file?.name || "Uploaded file"}
                                    </p>
                                  </div>

                                  {/* Actions */}
                                  <div className="flex items-center gap-1.5 flex-shrink-0">
                                    {file.fileType === "image" && (
                                      <button
                                        onClick={() => setCoverImage(index)}
                                        disabled={isSubmitting}
                                        className={`text-[11px] px-2.5 py-1 rounded-lg font-semibold transition-all
                      ${
                        file.isCover
                          ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                          : "bg-gray-100 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 border border-transparent"
                      }`}
                                      >
                                        {file.isCover ? "✓ Cover" : "Set Cover"}
                                      </button>
                                    )}
                                    <button
                                      onClick={() => removeFile(index)}
                                      disabled={isSubmitting}
                                      className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                    >
                                      <Trash2 size={18} />
                                    </button>
                                  </div>
                                </div>

                                {/* Upload progress */}
                                {!file.isUploaded && isUploading && (
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-medium text-gray-400">
                                      <span className="flex items-center gap-1">
                                        <Loader2
                                          size={9}
                                          className="animate-spin"
                                        />
                                        Uploading
                                      </span>
                                      <span className="tabular-nums text-indigo-500">
                                        {file.uploadProgress}%
                                      </span>
                                    </div>
                                    <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full transition-all duration-300"
                                        style={{
                                          width: `${file.uploadProgress}%`,
                                        }}
                                      />
                                    </div>
                                  </div>
                                )}

                                {/* Description */}
                                <textarea
                                  ref={(el) => {
                                    if (!el) return;
                                    el.style.height = "auto";
                                    el.style.height = `${el.scrollHeight}px`;
                                  }}
                                  value={file.description}
                                  onChange={(e) => {
                                    updateFileDescription(
                                      index,
                                      e.target.value,
                                    );
                                    e.target.style.height = "auto";
                                    e.target.style.height = `${e.target.scrollHeight}px`;
                                  }}
                                  placeholder="Add a description for this file…"
                                  disabled={isSubmitting}
                                  rows={2}
                                  className="w-full text-sm px-3 py-2.5 border border-gray-200 bg-gray-50 focus:bg-white rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 resize-none transition-all placeholder-gray-300 text-gray-700 overflow-hidden"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center space-y-3">
                      <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto">
                        <ImageIcon size={22} className="text-gray-300" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-700">
                          No media files
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Use the dropzone above to add images or videos
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right column (1/3) */}
            <div className="space-y-4">
              {/* Publish actions */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <Zap size={14} className="text-indigo-500" />
                  <span className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">
                    Publish
                  </span>
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={() => handleSubmit(false)}
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
                </div>

                <div className="pt-3 border-t border-gray-100 space-y-2">
                  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    Quick publish
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        vis: "PUBLIC" as Visibility,
                        label: "Public",
                        icon: <Globe size={12} />,
                      },
                      {
                        vis: "FOLLOWERS" as Visibility,
                        label: "Followers",
                        icon: <Users size={12} />,
                      },
                    ].map(({ vis, label, icon }) => (
                      <button
                        key={vis}
                        onClick={() => {
                          setSelectedVisibility(vis);
                          handleSubmit(false);
                        }}
                        disabled={isSubmitting}
                        className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 transition-all disabled:opacity-50"
                      >
                        {icon}
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tips */}
              <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-4 space-y-2">
                <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
                  Tips
                </p>
                <ul className="space-y-1.5">
                  {[
                    "Add captions to each media file",
                    "Use relevant tags for discoverability",
                    "Choose the right visibility before publishing",
                  ].map((tip) => (
                    <li
                      key={tip}
                      className="flex items-start gap-1.5 text-xs text-indigo-600"
                    >
                      <span className="mt-1 w-1 h-1 rounded-full bg-indigo-400 flex-shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Delete */}
              <button
                onClick={() => setIsDeleteModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-red-200 text-red-500 text-sm font-semibold hover:bg-red-50 hover:border-red-300 hover:text-red-600 transition-all"
              >
                <Trash2 size={14} /> Delete This Post
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete modal  */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl max-w-sm w-full mx-auto overflow-hidden">
            <div className="p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                  <AlertCircle size={18} className="text-red-500" />
                </div>
                <div>
                  <p className="text-base font-extrabold text-gray-900">
                    Delete Post
                  </p>
                  <p className="text-xs text-gray-400">
                    This action cannot be undone
                  </p>
                </div>
              </div>

              <div className="bg-red-50 border border-red-100 rounded-xl p-4 space-y-2">
                <p className="text-sm font-semibold text-red-700">
                  Are you sure you want to delete this post?
                </p>
                <ul className="space-y-1">
                  {[
                    "All images, comments, and likes will be removed",
                    "This is permanent and irreversible",
                  ].map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-1.5 text-xs text-red-500"
                    >
                      <span className="mt-1 w-1 h-1 rounded-full bg-red-400 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setIsDeleteModalOpen(false)}
                  variant="outline"
                  className="flex-1 rounded-xl"
                >
                  Cancel
                </Button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 size={13} className="animate-spin" /> Deleting…
                    </>
                  ) : (
                    <>
                      <Trash2 size={13} /> Delete Post
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {previewFile && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setPreviewFile(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-1 pb-3">
              <p className="text-xs font-medium text-white/60 truncate pr-4">
                {previewFile.name}
              </p>
              <button
                onClick={() => setPreviewFile(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all flex-shrink-0"
              >
                <X size={15} />
              </button>
            </div>

            {/* Media */}
            <div className="rounded-2xl overflow-hidden bg-black flex items-center justify-center">
              {previewFile.type === "image" ? (
                <img
                  src={previewFile.src}
                  alt={previewFile.name}
                  className="max-h-[80vh] w-auto object-contain"
                />
              ) : (
                <video
                  src={previewFile.src}
                  controls
                  autoPlay
                  className="max-h-[80vh] w-full"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditPostForm;
