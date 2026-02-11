import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-providers";
import ClientShell from "@/app/components/general/ClientShell";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id || null;

  return <ClientShell userId={userId}>{children}</ClientShell>;
}
