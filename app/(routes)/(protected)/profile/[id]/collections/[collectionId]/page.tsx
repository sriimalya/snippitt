import { getCollectionWithSnippets } from "@/actions/collection/getCollectionWithSnippites";
import CollectionViewClient from "@/app/components/collection/CollectionViewClient";
import { notFound } from "next/navigation";

export default async function CollectionViewPage({ 
  params 
}: { 
  params: { id: string; collectionId: string } 
}) {
  const { collectionId } = await params;
  const result = await getCollectionWithSnippets({ collectionId });

  if (!result.success || !result.data) return notFound();

  return (
    <CollectionViewClient 
      collection={result.data.collection} 
      snippets={result.data.snippets}
      currentUserId={result.data.currentUserId}
      isOwner={result.data.isOwner}
    />
  );
}