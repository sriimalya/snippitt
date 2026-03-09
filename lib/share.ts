// lib/share.ts
import { toast } from "sonner";

export const handleShare = async (title: string, url: string) => {
  const shareData = { title, url };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return;
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return;
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard!");
  } catch {
    toast.error("Could not copy link");
  }
};