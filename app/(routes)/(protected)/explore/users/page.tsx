import { getExploreUsers } from "@/actions/user/exploreUser";
import ExploreUsersClient from "@/app/components/user/ExploreUsersClient";

export default async function ExploreUsersPage() {
  // Initial fetch (Page 0, No Search)
  const result = await getExploreUsers(0, "");

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-3">
          Explore Creators
        </h1>
        <p className="text-gray-500 font-medium">
          Discover and connect with developers and creators around the globe.
        </p>
      </div>

      <ExploreUsersClient initialUsers={result.data || []} />
    </div>
  );
}