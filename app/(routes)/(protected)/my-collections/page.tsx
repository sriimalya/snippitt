import MyCollectionsComponent from "@/app/components/collection/MyCollectionsComponent";
import { getUserCollections } from "@/actions/collection/getUserCollections";

interface PageProps {
  searchParams: Promise<{
    page?: string;
    visibility?: string;
    search?: string;
    sort?: "asc" | "desc";
  }>;
}

const Page = async ({ searchParams }: PageProps) => {
  const params = await searchParams;
  const currentPage = parseInt(params.page || "1");
  const visibility = params.visibility || "";
  const search = params.search || "";
  const sort = (params.sort as "asc" | "desc") || "desc";

  const result = await getUserCollections({
    page: currentPage,
    perPage: 12,
    visibility: visibility as any,
    search,
    sort,
  });

  const initialData = result.success ? result.data : null;

  return (
    <MyCollectionsComponent
      initialData={initialData}
      filters={{ currentPage, visibility, search, sort }}
    />
  );
};

export default Page;
