import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { timeAgo } from "@/lib/time";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await prisma.article.findUnique({ where: { slug } });
  if (!article || article.status !== "PUBLISHED") return { title: "Article not found" };

  const title = article.metaTitle ?? article.title;
  const description = article.metaDescription ?? article.excerpt ?? undefined;
  return {
    title: `${title} | MySpace Reborn Blog`,
    description,
    openGraph: { title, description, images: article.coverImage ? [article.coverImage] : undefined },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();

  const article = await prisma.article.findUnique({
    where: { slug },
    include: { author: { select: { id: true, username: true, name: true } } },
  });

  if (!article) notFound();
  const isOwner = session?.user?.id === article.authorId;
  if (article.status === "DRAFT" && !isOwner) notFound();

  return (
    <article className="mx-auto max-w-2xl px-6 py-12">
      {article.status === "DRAFT" && (
        <span className="mb-4 inline-block rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1 text-xs text-yellow-300">
          Draft
        </span>
      )}
      <h1 className="text-3xl font-semibold">{article.title}</h1>
      <p className="mt-2 text-sm text-white/50">
        <Link href={`/profile/${article.author.username}`} className="hover:underline">
          {article.author.name ?? article.author.username}
        </Link>
        {article.publishedAt && ` · ${timeAgo(article.publishedAt)}`} · {article.viewCount} views
      </p>
      {article.category && (
        <span className="mt-3 inline-block rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs">
          {article.category}
        </span>
      )}

      {article.coverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={article.coverImage} alt="" className="mt-6 w-full rounded-2xl" />
      )}

      <div className="prose prose-invert mt-6 whitespace-pre-wrap text-white/90">{article.content}</div>

      {article.tags.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {article.tags.map((tag) => (
            <span key={tag} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {isOwner && (
        <div className="mt-8 border-t border-white/10 pt-4">
          <Link href={`/blog/mine`} className="text-sm text-violet-400 hover:underline">
            Manage your articles →
          </Link>
        </div>
      )}
    </article>
  );
}
