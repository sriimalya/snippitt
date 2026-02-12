import { getFollowingList } from "@/actions/user/getFollowing";
import FollowingClient from "@/app/components/user/FollowingClient";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function FollowingPage({
  params,
}: {
  params: Promise<{ id: string }>; // 1. Update type to Promise
}) {
  // 2. Unwrap params before using them
  const { id } = await params;

  const result = await getFollowingList(id);

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
            Following
          </h1>
          <p className="text-sm text-gray-500 font-medium">
            Users followed by this profile
          </p>
        </div>
      </div>
      <FollowingClient initialUsers={result.data || []} />
    </div>
  );
}
