import { getDraftPosts } from "@/actions/posts/getDrafts";
import DraftsPosts from "@/app/components/posts/DraftPosts";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    category?: string;
    search?: string;
    sort?: "asc" | "desc";
  }>;
}

export default async function DraftsPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const currentPage = parseInt(params.page || "1");
  const category = params.category || "";
  const search = params.search || "";
  const sort = (params.sort as "asc" | "desc") || "desc";

  const result = await getDraftPosts({
    page: currentPage,
    perPage: 10,
    category,
    search,
    sort,
  });

  const initialData = result.success ? result.data : null;

  return (
    <main className="min-h-screen bg-gray-50">
      <DraftsPosts
        initialData={initialData}
        filters={{ currentPage, category, search, sort }}
      />
    </main>
  );
}
