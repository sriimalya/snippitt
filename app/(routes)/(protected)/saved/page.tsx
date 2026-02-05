import { getSavedPosts } from "@/actions/posts/getSavedPost";
import SavedPosts from "@/app/components/general/SavedPosts";

export default async function SavedPage() {
  const result = await getSavedPosts({ page: 1, perPage: 10 });

  const initialPosts = result.success ? result.data?.posts || [] : [];
  const initialPagination = result.data?.pagination;
  const currentUserId = result.data?.currentUserId || "";

  return (
    <main className="min-h-screen bg-gray-50">
      <SavedPosts
        initialPosts={initialPosts}
        initialPagination={initialPagination}
        currentUserId={currentUserId}
      />
    </main>
  );
}
