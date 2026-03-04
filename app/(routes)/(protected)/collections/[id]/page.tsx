import { getCollectionWithSnippets } from "@/actions/collection/getCollectionWithSnippites";
import CollectionViewClient from "@/app/components/collection/CollectionViewClient";
import { authOptions } from "@/lib/auth-providers";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";

export default async function CollectionViewPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id;
  const { id } = await params;
  const result = await getCollectionWithSnippets({ collectionId: id });

  if (!result.success || !result.data) return notFound();

  return (
    <CollectionViewClient
      collection={result.data.collection}
      snippets={result.data.snippets}
      currentUserId={currentUserId}
      isOwner={result.data.isOwner}
    />
  );
}
