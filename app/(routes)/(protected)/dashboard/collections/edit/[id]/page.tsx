import { getCollectionWithSnippets } from "@/actions/collection/getCollectionWithSnippites";
import EditCollectionClient from "@/app/components/collection/EditCollectionClient";
import { notFound, redirect } from "next/navigation";

export default async function EditCollectionPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = await params;
  const result = await getCollectionWithSnippets({ collectionId: id });

  if (!result.success || !result.data) return notFound();
  if (!result.data.isOwner) redirect("/dashboard/collections");

  return (
    <EditCollectionClient
      initialCollection={result.data.collection}
      snippets={result.data.snippets}
      currentUserId={result.data.currentUserId}
    />
  );
}
