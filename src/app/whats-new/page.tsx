import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getActivityFeed } from "@/lib/activity";
import { ActivityList } from "@/components/activity/activity-list";

export const metadata: Metadata = {
  title: "What's New | MySpace Reborn",
  description: "The latest posts, photos, and updates from your friends and the people you follow.",
};

export default async function WhatsNewPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { items, nextCursor } = await getActivityFeed(session.user.id, { limit: 25 });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">What&apos;s New ✨</h1>
        <p className="mt-1 text-sm text-white/50">
          The latest from your friends and the people you follow.
        </p>
      </div>

      <ActivityList initialItems={items} initialCursor={nextCursor} />
    </div>
  );
}
