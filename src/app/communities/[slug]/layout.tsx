import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const community = await prisma.community.findUnique({
    where: { slug },
    select: { name: true, description: true, visibility: true },
  });
  if (!community || community.visibility !== "PUBLIC") {
    return { title: "Community" };
  }

  const title = community.name;
  const description =
    community.description ?? `Join the ${community.name} community on MySpace Reborn.`;
  return { title, description, openGraph: { title, description } };
}

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return children;
}
