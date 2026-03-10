import MyPostComponent from "@/app/components/posts/MyPostComponent";
import { getMyPosts } from "@/actions/posts/getMyPosts";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    category?: string;
    visibility?: string;
    search?: string;
    sort?: "asc" | "desc";
  }>;
}

const Page = async ({ searchParams }: PageProps) => {
  const params = await searchParams;
  const currentPage = parseInt(params.page || "1");
  const category = params.category || "";
  const visibility = params.visibility || "";
  const search = params.search || "";
  const sort = (params.sort as "asc" | "desc") || "desc";

  const result = await getMyPosts({
    page: currentPage,
    perPage: 10,
    category,
    visibility: visibility as any,
    search,
    sort,
  });

  const initialData = result.success ? result.data : null;

  return (
    <MyPostComponent
      initialData={initialData}
      filters={{ currentPage, category, visibility, search, sort }}
    />
  );
};

export default Page;
