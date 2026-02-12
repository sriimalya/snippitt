import { getFollowersList } from "@/actions/user/getFollower";
import FollowersClient from "@/app/components/user/FollowersClient";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function FollowersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getFollowersList(id);

  // Safety check for TypeScript and data integrity
  if (!result.success || !result.data) {
    return notFound();
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link
          href={`/profile/${id}`}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft size={24} className="text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Followers
          </h1>
          <p className="text-sm text-gray-500 font-medium">
            People following this user
          </p>
        </div>
      </div>
      <FollowersClient initialUsers={result.data || []} />
    </div>
  );
}
