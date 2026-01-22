import { getUserCollections } from "@/actions/collection/getUserCollections";
import ProfileCollectionsClient from "@/app/components/ProfileCollection";

export default async function UserCollectionsPage({ params }: { params: { id: string } }) {
  const { id } = params;
  
  // Fetch collections for the specific profile ID
  const result = await getUserCollections({ userId: id, page: 1, perPage: 12 });

  const initialCollections = result.success ? result.data?.collections || [] : [];
  const initialPagination = result.data?.pagination;
  const isOwner = result.data?.isOwner || false;

  return (
    <ProfileCollectionsClient 
      initialCollections={initialCollections}
      initialPagination={initialPagination}
      isOwner={isOwner}
      profileId={id}
    />
  );
}