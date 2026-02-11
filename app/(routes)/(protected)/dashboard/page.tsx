import { getDashboardData } from "@/actions/dashboard";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-providers";
import { redirect } from "next/navigation";
import DashboardClient from "@/app/components/general/DashboardClient";

export default async function DashboardPage() {
  // 1. Check session on the server to prevent flashing
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin"); // Or your custom login route
  }

  // 2. Fetch all sections (Stats, Posts, Drafts, Collections)
  const result = await getDashboardData();
  

  if (!result.success) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500 font-bold">
          Failed to load dashboard. Please try again.
        </p>
      </div>
    );
  }

  return <DashboardClient data={result.data} currentUserId={session.user.id} />;
}
