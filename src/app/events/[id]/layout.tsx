import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    select: { title: true, description: true, startsAt: true, location: true },
  });
  if (!event) {
    return { title: "Event" };
  }

  const title = event.title;
  const description =
    event.description ??
    `${event.title}${event.location ? ` at ${event.location}` : ""} — ${event.startsAt.toLocaleDateString()}`;
  return { title, description, openGraph: { title, description } };
}

export default function EventLayout({ children }: { children: React.ReactNode }) {
  return children;
}
