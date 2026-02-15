import { getUserCollections } from "@/actions/collection/getUserCollections";
import { Collections } from "@/app/components/general/Collection";
import { FolderHeart } from "lucide-react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-providers";

export default async function MyCollectionsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login?callbackUrl=/my-collections");
  }
  const result = await getUserCollections({
    page: 1,
    perPage: 50,
  });

  if (!result.success || !result.data) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-black text-gray-900">
          Something went wrong
        </h1>
        <p className="text-gray-500 mt-2">
          {result.message || "Failed to load collections."}
        </p>
      </div>
    );
  }

  const { collections, isOwner } = result.data;

  return (
    <div className="min-h-screen bg-gray-50/30 pb-20">
      {/* Header Section */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-[#5865F2]/10 rounded-2xl text-[#5865F2]">
                  <FolderHeart size={24} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                  Workspace
                </span>
              </div>
              <h1 className="text-5xl font-black text-gray-900 tracking-tight">
                My Collections
              </h1>
              <p className="text-gray-500 font-medium mt-3 max-w-lg">
                Manage your curated snippets, private libraries, and community
                contributions in one place.
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right hidden md:block mr-4">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Total Assets
                </p>
                <p className="text-2xl font-black text-gray-900">
                  {collections.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="max-w-7xl mx-auto px-4 mt-12">
        <Collections
          collections={collections}
          variant="grid"
          showCoverImage={true}
          isOwner={isOwner}
        />
      </div>
    </div>
  );
}
