"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createPost } from "@/actions/posts/createPost";
import { Category } from "@/app/generated/prisma/enums";
import Dropdown from "@/app/components/inputFields/Dropdown";
import Button from "@/app/components/Button";
import {
  ArrowLeft,
  Tag,
  Hash,
  Sparkles,
  Search,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const CreatePostForm = () => {
  const router = useRouter();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "" as Category,
    tags: [] as string[],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({
    title: "",
    description: "",
    category: "",
  });

  const [showAllTags, setShowAllTags] = useState(false);
  const [tagSearch, setTagSearch] = useState("");
  const [selectedTagsOpen, setSelectedTagsOpen] = useState(true);

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
      "Health",
      "Education",
      "Science",
      "Music",
      "Sports",
      "Finance",
      "Marketing",
      "Writing",
    ],
    [],
  );

  const validateForm = () => {
    let valid = true;
    const newErrors = { title: "", description: "", category: "" };

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
      valid = false;
    } else if (formData.title.length < 3) {
      newErrors.title = "Title must be at least 3 characters";
      valid = false;
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
      valid = false;
    } else if (formData.description.length < 10) {
      newErrors.description = "Description must be at least 10 characters";
      valid = false;
    }

    if (!formData.category) {
      newErrors.category = "Category is required";
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
      const res = await createPost({
        title: formData.title,
        description: formData.description,
        category: formData.category,
        tags: formData.tags,
      });

      if (res.success) {
        toast.success("🎉 Draft created successfully! Ready for images.");

      
        if (res.data?.id) {
          setTimeout(() => {
            router.push(`/post/${res.data.id}/edit`);
          }, 200);
        }
      } else {
        toast.error(res.message || "Failed to create post");
      }
    } catch (error: any) {
      const errorMessage = error.message || "An unexpected error occurred";
      toast.error(errorMessage);
      console.error("Post creation error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const categoryOptions = Object.values(Category).map((opt) => ({
    value: opt,
    label: opt,
  }));

  // Filter tags based on search
  const filteredTags = useMemo(() => {
    if (!tagSearch.trim()) return tagOptions;
    return tagOptions.filter((tag) =>
      tag.toLowerCase().includes(tagSearch.toLowerCase()),
    );
  }, [tagOptions, tagSearch]);

  // Show limited tags when not expanded
  const displayedTags = showAllTags ? filteredTags : filteredTags.slice(0, 12);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData({ ...formData, category: e.target.value as Category });
    if (errors.category) setErrors({ ...errors, category: "" });
  };

  const toggleTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const removeTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  };

  const clearAllTags = () => {
    setFormData((prev) => ({ ...prev, tags: [] }));
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <div className="mb-10">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-[#5865F2] transition-colors mb-4 group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Create New Post
            </h1>
            <p className="text-gray-600">
              Start by filling in the basic details. You can add images next.
            </p>
          </div>
          <div className="inline-flex items-center px-4 py-2 bg-[#5865F2]/10 rounded-lg">
            <Sparkles className="w-4 h-4 text-[#5865F2] mr-2" />
            <span className="text-sm font-medium text-[#5865F2]">
              Step 1 of 2
            </span>
          </div>
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Form Progress Bar */}
        <div className="h-1.5 bg-gray-100">
          <div
            className="h-full bg-gradient-to-r from-[#5865F2] to-[#94BBFF] transition-all duration-500"
            style={{ width: "50%" }}
          />
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
          {/* Title Field */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="title"
                className="block text-sm font-semibold text-gray-900"
              >
                Post Title
              </label>
              <span className="text-xs text-gray-500">
                {formData.title.length}/60 characters
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => {
                  if (e.target.value.length <= 60) {
                    setFormData({ ...formData, title: e.target.value });
                    if (errors.title) setErrors({ ...errors, title: "" });
                  }
                }}
                className={`w-full px-4 py-3 rounded-xl border-2 bg-[#F8FAFD] focus:bg-white transition-all duration-200
                  text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#94BBFF]/30
                  ${
                    errors.title
                      ? "border-red-300 focus:border-red-300"
                      : "border-gray-200 hover:border-[#94BBFF]/50 focus:border-[#5865F2]"
                  }`}
                placeholder="What's your post about?"
              />
            </div>
            {errors.title && (
              <div className="mt-2 flex items-center text-red-600 text-sm">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></div>
                {errors.title}
              </div>
            )}
          </div>

          {/* Description Field */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="description"
                className="block text-sm font-semibold text-gray-900"
              >
                Description
              </label>
              <span className="text-xs text-gray-500">
                {formData.description.length}/500 characters
              </span>
            </div>
            <div className="relative">
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => {
                  if (e.target.value.length <= 500) {
                    setFormData({ ...formData, description: e.target.value });
                    if (errors.description)
                      setErrors({ ...errors, description: "" });
                  }
                }}
                rows={5}
                className={`w-full px-4 py-3 rounded-xl border-2 bg-[#F8FAFD] focus:bg-white transition-all duration-200
                  text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#94BBFF]/30
                  resize-none
                  ${
                    errors.description
                      ? "border-red-300 focus:border-red-300"
                      : "border-gray-200 hover:border-[#94BBFF]/50 focus:border-[#5865F2]"
                  }`}
                placeholder="Describe your post, what it's about, and any important notes..."
              />
            </div>
            {errors.description && (
              <div className="mt-2 flex items-center text-red-600 text-sm">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></div>
                {errors.description}
              </div>
            )}
          </div>

          {/* Category Field - Using Custom Dropdown */}
          <Dropdown
            label="Category"
            options={categoryOptions}
            value={formData.category}
            onChange={handleCategoryChange}
            error={errors.category}
            placeholder="Select a category"
            required
          />

          {/* Tags Section */}
          <div className="space-y-4">
            {/* Tags Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Tag className="w-5 h-5 text-gray-400 mr-2" />
                <label className="block text-sm font-semibold text-gray-900">
                  Tags
                </label>
                <span className="ml-2 text-xs text-gray-500">
                  ({formData.tags.length} selected)
                </span>
              </div>
              {formData.tags.length > 0 && (
                <button
                  type="button"
                  onClick={clearAllTags}
                  className="text-sm text-red-500 hover:text-red-700 transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Selected Tags */}
            {formData.tags.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-[#5865F2] rounded-full mr-2"></div>
                    <span className="text-sm font-medium text-gray-700">
                      Selected Tags
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedTagsOpen(!selectedTagsOpen)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {selectedTagsOpen ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {selectedTagsOpen && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-[#5865F2]/10 to-[#94BBFF]/10 text-[#5865F2] rounded-lg text-sm font-medium border border-[#94BBFF]/20"
                      >
                        <Hash className="w-3 h-3 mr-1.5" />
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-2 text-[#5865F2] hover:text-[#4854e0] transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tags Selection Panel */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              {/* Search Bar */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={tagSearch}
                    onChange={(e) => setTagSearch(e.target.value)}
                    placeholder="Search tags..."
                    className="w-full pl-10 pr-4 py-2.5 bg-white rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#94BBFF]/30 focus:border-[#5865F2] text-sm"
                  />
                  {tagSearch && (
                    <button
                      type="button"
                      onClick={() => setTagSearch("")}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Tags Grid */}
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-3">
                  {filteredTags.length === tagOptions.length
                    ? `Select relevant tags from ${tagOptions.length} options:`
                    : `Found ${filteredTags.length} matching tags:`}
                </p>
                <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto pr-2">
                  {displayedTags.map((tag) => {
                    const isSelected = formData.tags.includes(tag);
                    return (
                      <button
                        type="button"
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`inline-flex items-center px-3 py-2 rounded-lg border transition-all duration-200
                          ${
                            isSelected
                              ? "bg-gradient-to-r from-[#5865F2] to-[#94BBFF] text-white border-transparent shadow-sm"
                              : "bg-white text-gray-700 border-gray-300 hover:border-[#94BBFF] hover:text-[#5865F2] hover:bg-[#F8FAFD]"
                          }`}
                      >
                        <Hash
                          className={`w-3 h-3 mr-1.5 ${
                            isSelected ? "opacity-90" : "opacity-60"
                          }`}
                        />
                        <span className="text-sm font-medium">{tag}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Show More/Less Button */}
              {filteredTags.length > 12 && (
                <div className="text-center pt-2 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setShowAllTags(!showAllTags)}
                    className="inline-flex items-center text-sm font-medium text-[#5865F2] hover:text-[#4854e0] transition-colors"
                  >
                    {showAllTags ? (
                      <>
                        <ChevronUp className="w-4 h-4 mr-1" />
                        Show Less
                        <span className="ml-1 text-gray-500">
                          ({filteredTags.length - 12} hidden)
                        </span>
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4 mr-1" />
                        Show All {filteredTags.length} Tags
                        <span className="ml-1 text-gray-500">
                          ({filteredTags.length - 12} more)
                        </span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-6 border-t border-gray-100">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Note:</span> Your post will be
                  saved as a draft. You&apos;ll add images and publish in the
                  next step.
                </p>
              </div>
              <Button
                type="submit"
                disabled={isSubmitting}
                variant="theme-gradient"
                size="lg"
                className="min-w-[180px]"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Creating Draft...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    Continue to Edit
                    <ArrowLeft className="w-4 h-4 ml-2 transform rotate-180" />
                  </span>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* Loading Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-sm mx-4">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 border-4 border-[#5865F2]/20 border-t-[#5865F2] rounded-full animate-spin mb-4"></div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Creating your post
              </h3>
              <p className="text-gray-600 text-center">
                Setting up your draft and preparing the editor...
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatePostForm;
