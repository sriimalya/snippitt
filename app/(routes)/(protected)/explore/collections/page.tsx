import { getExploreCollections } from "@/actions/collection/exploreCollections";
import ExploreCollectionsClient from "@/app/components/collection/ExploreCollectionClient";

export default async function ExploreCollectionsPage() {
  const result = await getExploreCollections(0, "");
  

  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <div className="mb-12">
        <h1 className="text-4xl font-black text-gray-900 tracking-tight">
          Explore Collections
        </h1>
        <p className="text-gray-500 font-medium mt-2">
          Discover curated snippets from the community.
        </p>
      </div>

      <ExploreCollectionsClient initialData={result.data || []} />
    </div>
  );
}
