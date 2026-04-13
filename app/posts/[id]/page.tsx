import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TEMPLATES_BY_ID } from "@/lib/ai/templates";
import { PostDetailClient } from "./PostDetailClient";

export const dynamic = "force-dynamic";

export default async function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const post = await prisma.post.findUnique({
    where: { id },
    include: { client: { select: { id: true, name: true, sector: true, logoUrl: true, logoVariants: true } } },
  });

  if (!post) notFound();

  const template = post.templateId ? TEMPLATES_BY_ID[post.templateId] ?? null : null;

  let slides: unknown[] = [];
  try { slides = JSON.parse(post.slides || "[]"); } catch { /* ignore */ }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-[#E5E5E5] sticky top-0 z-10 bg-white">
        <div className="max-w-4xl mx-auto px-8 py-5 flex items-center gap-6">
          <Link
            href={`/clients/${post.client.id}`}
            className="flex items-center gap-1.5 text-sm text-[#A0A0A0] hover:text-[#FC0100] transition font-light shrink-0"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            {post.client.name}
          </Link>
          <div className="h-4 w-px bg-[#E5E5E5]" />
          <p className="text-sm text-[#A0A0A0] font-light truncate">
            {post.title || "Untitled post"}
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-8 py-10">
        <PostDetailClient
          post={{
            id: post.id,
            title: post.title,
            caption: post.caption,
            visualDescription: post.visualDescription,
            logoUsage: post.logoUsage,
            createdAt: post.createdAt.toISOString(),
            slides,
          }}
          client={post.client}
          template={template}
        />
      </main>
    </div>
  );
}
