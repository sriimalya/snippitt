"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createPost } from "@/actions/posts/createPost";
import { getTags, checkTagExists } from "@/actions/tags";
import { Category } from "@/app/generated/prisma/enums";
import Button from "@/app/components/Button";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Search,
  X,
  ChevronDown,
  ChevronUp,
  Hash,
  Tag,
  Loader2,
} from "lucide-react";

const inputBase =
  "w-full px-4 py-3 rounded-xl border bg-gray-50 focus:bg-white text-sm text-gray-900 placeholder-gray-400 outline-none transition-all";

const inputClass = (hasError: boolean) =>
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

const CreatePostForm = () => {
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "" as Category,
    tags: [] as string[],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [errors, setErrors] = useState({
    title: "",
    description: "",
    category: "",
  });
  const [tagSearch, setTagSearch] = useState("");
  const [dbTags, setDbTags] = useState<string[]>([]);
  const [isTagInDb, setIsTagInDb] = useState(false);
  const [isCheckingTag, setIsCheckingTag] = useState(false);

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
    setIsTagInDb(false); 

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

  const validateForm = () => {
    const newErrors = { title: "", description: "", category: "" };
    let valid = true;

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
      valid = false;
    } else if (formData.title.trim().length < 3) {
      newErrors.title = "Title must be at least 3 characters";
      valid = false;
    }
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
      valid = false;
    } else if (formData.description.trim().length < 10) {
      newErrors.description = "Description must be at least 10 characters";
      valid = false;
    }
    if (!formData.category) {
      newErrors.category = "Please select a category";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const res = await createPost(formData);
      if (res.success && res.data?.id) {
        setIsSubmitting(false);
        setIsRedirecting(true);
        toast.success("Draft created as private post!");
        setTimeout(() => router.push(`/posts/${res.data.id}/edit`), 200);
      } else {
        toast.error(res.message || "Failed to create post");
        setIsSubmitting(false);
        setIsRedirecting(false);
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
      setIsRedirecting(false);
    }
  };

  const toggleTag = useCallback((tag: string) => {
    setFormData((prev) => {
      const normalizedTag = tag.trim();
      const exists = prev.tags.some(
        (t) => t.toLowerCase() === normalizedTag.toLowerCase(),
      );

      if (exists) {
        return {
          ...prev,
          tags: prev.tags.filter(
            (t) => t.toLowerCase() !== normalizedTag.toLowerCase(),
          ),
        };
      } else {
        return {
          ...prev,
          tags: [...prev.tags, normalizedTag],
        };
      }
    });
  }, []);

  return (
    <>
      {/* Loading/Redirecting Overlay */}
      {(isSubmitting || isRedirecting) && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xl p-8 max-w-xs w-full mx-4 text-center space-y-3">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto" />
            <div>
              <p className="text-sm font-bold text-gray-900">
                {isRedirecting ? "Opening Editor" : "Setting up your draft"}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {isRedirecting ? "Almost there..." : "Just a moment..."}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="mx-auto max-w-2xl space-y-8">
          {/* Header */}
          <header>
            <button
              type="button"
              onClick={() => router.back()}
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
                  Create Post
                </h1>
                <p className="text-sm text-gray-500">
                  Fill in the basics — you&apos;ll add images in the next step.
                </p>
              </div>
            </div>
          </header>

          {/* Form card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Progress bar */}
            <div className="h-1 bg-gray-100">
              <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-300" />
            </div>

            <form onSubmit={handleSubmit} className="divide-y divide-gray-100">
              <div className="p-6 sm:p-8 space-y-6">
                {/* Title */}
                <Field
                  label="Title"
                  counter={`${formData.title.length}/60`}
                  error={errors.title}
                >
                  <div className="relative group">
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          title: e.target.value.slice(0, 60),
                        });
                        if (errors.title) setErrors({ ...errors, title: "" });
                      }}
                      placeholder="What's your post about?"
                      className={inputClass(!!errors.title)}
                    />
                    {formData.title && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, title: "" })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-gray-300 hover:text-gray-500 transition-colors opacity-0 group-focus-within:opacity-100"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </Field>

                {/* Category */}
                <Field label="Category" error={errors.category}>
                  <div className="relative">
                    <select
                      value={formData.category}
                      onChange={(e) => {
                        setFormData({
                          ...formData,
                          category: e.target.value as Category,
                        });
                        if (errors.category)
                          setErrors({ ...errors, category: "" });
                      }}
                      className={`${inputClass(!!errors.category)} appearance-none pr-10 cursor-pointer`}
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

                {/* Description */}
                <Field
                  label="Description"
                  counter={`${formData.description.length}/500`}
                  error={errors.description}
                >
                  <textarea
                    value={formData.description}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        description: e.target.value.slice(0, 500),
                      });
                      if (errors.description)
                        setErrors({ ...errors, description: "" });
                    }}
                    rows={4}
                    placeholder="Describe your post — what it covers, any useful context…"
                    className={`${inputClass(!!errors.description)} resize-none`}
                  />
                </Field>
              </div>

              {/* Tags section */}
              <div className="p-6 sm:p-8 space-y-4 bg-gray-50/60">
                {/* Tags header */}
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
                        setFormData((prev) => ({ ...prev, tags: [] }))
                      }
                      className="text-xs font-medium text-gray-400 hover:text-red-500 transition-colors"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                {/* Selected tag pills */}
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
                          t.toLowerCase() === tagSearch.trim().toLowerCase(),
                      ) &&
                      !formData.tags.some(
                        (t) =>
                          t.toLowerCase() === tagSearch.trim().toLowerCase(),
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
                            className={isSelected ? "opacity-80" : "opacity-40"}
                          />
                          {tag}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 sm:px-8 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-gray-400 leading-relaxed">
                    <span className="font-medium text-gray-500">Note:</span>{" "}
                    Saves as a draft — you&apos;ll add images and publish next.
                  </p>
                  {errors &&
                    (errors.title || errors.description || errors.category) && (
                      <p className="flex items-center gap-1.5 text-xs text-red-600 font-medium mt-2 sm:mt-0">
                        <span className="w-1 h-1 rounded-full bg-red-500 inline-block flex-shrink-0" />
                        Please fix the errors above before continuing.
                      </p>
                    )}
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={isSubmitting}
                  className="flex items-center justify-center gap-2 min-w-[160px] rounded-xl shadow-sm shadow-indigo-200 whitespace-nowrap"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Creating…
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight size={15} />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default CreatePostForm;
