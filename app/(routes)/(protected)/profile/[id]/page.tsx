import { getUserProfile } from "@/actions/user/getUserProfile";
import ProfileClient from "@/app/components/general/Profile";
import { notFound } from "next/navigation";

interface PageProps {
  params: {
    id: string;
  };
}

const Page = async ({ params }: PageProps) => {
  const { id } = await params; 

  const result = await getUserProfile({ profileId: id });

  if (!result.success || !result.data) {
    return notFound();
  }

  return (
    <ProfileClient 
      profileData={result.data.profile}
      categoryStats={result.data.categoryStats}
      initialPosts={result.data.initialPosts}
      initialCollections={result.data.initialCollections}
      currentUserId={result.data.currentUserId}
    />
  );
};
export default Page;