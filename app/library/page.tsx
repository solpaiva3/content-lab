import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { TEMPLATES } from "@/lib/ai/templates";
import { LibraryClient } from "./LibraryClient";

export const dynamic = "force-dynamic";

export default async function LibraryPage({ searchParams }: { searchParams: Promise<{ clientId?: string }> }) {
  const { clientId } = await searchParams;
  const [posts, clients] = await Promise.all([
    prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      include: { client: { select: { id: true, name: true } } },
    }),
    prisma.client.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-[#E5E5E5] sticky top-0 z-10 bg-white">
        <div className="max-w-6xl mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-sm text-[#A0A0A0] hover:text-[#FC0100] transition font-light"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Clients
            </Link>
            <div className="h-4 w-px bg-[#E5E5E5]" />
            <h1
              className="text-lg text-black tracking-[-0.04em]"
              style={{ fontFamily: "'Imbue', serif", fontWeight: 300 }}
            >
              Content library
            </h1>
          </div>
          <p className="text-xs text-[#A0A0A0] font-light">{posts.length} saved post{posts.length !== 1 ? "s" : ""}</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-8 py-10">
        <LibraryClient posts={posts} clients={clients} templates={TEMPLATES} initialClientId={clientId ?? ""} />
      </main>
    </div>
  );
}
