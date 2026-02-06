import { getPostById } from "@/actions/posts/getPostById";
import PostDetailClient from "@/app/components/posts/PostDetailsClient";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-providers";

export default async function PostPage({ params }: { params: { id: string } }) {
  const { id } = await params;

  const result = await getPostById(id);
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id || null;

  if (!result.success || !result.data) {
    if (result.code === "FORBIDDEN") {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <h1 className="text-2xl font-black text-gray-900">Access Denied</h1>
          <p className="text-gray-500">
            You don&apos;t have permission to view this snippet.
          </p>
        </div>
      );
    }
    return notFound();
  }

  return (
    <PostDetailClient
      post={result.data}
      currentUserId={currentUserId}
      isOwner={result.isOwner}
    />
  );
}
