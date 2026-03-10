import { getSavedPosts } from "@/actions/posts/getSavedPosts";
import SavedPosts from "@/app/components/general/SavedPosts";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    category?: string;
    search?: string;
    sort?: "asc" | "desc";
  }>;
}

export default async function SavedPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const currentPage = parseInt(params.page || "1");
  const category = params.category || "";
  const search = params.search || "";
  const sort = (params.sort as "asc" | "desc") || "desc";

  const result = await getSavedPosts({
    page: currentPage,
    perPage: 10,
    category,
    search,
    sort,
  });

  const initialData = result.success ? result.data : null;

  return (
    <main className="min-h-screen bg-gray-50">
      <SavedPosts
        initialData={initialData}
        filters={{ currentPage, category, search, sort }}
      />
    </main>
  );
}
