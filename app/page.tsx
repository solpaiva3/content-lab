import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ClientCard } from "@/components/ClientCard";
import { Client } from "@/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-[#E5E5E5] sticky top-0 z-10 bg-white">
        <div className="max-w-6xl mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Latina geometric triangle mark */}
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <polygon points="10,1 19,19 1,19" fill="#FC0100" />
            </svg>
            <span
              className="text-lg tracking-[-0.05em] text-black"
              style={{ fontFamily: "'Imbue', serif", fontWeight: 300 }}
            >
              Content Lab
            </span>
          </div>
          <div className="flex items-center gap-5">
            <Link
              href="/library"
              className="flex items-center gap-1.5 text-sm text-neutral-800 font-medium underline decoration-transparent underline-offset-4 hover:text-[#FC0100] hover:decoration-[#FC0100] transition-all duration-200"
            >
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18M3 12h18M3 17h18" />
              </svg>
              Library
            </Link>
            <Link
              href="/clients/new"
              className="flex items-center gap-2 px-5 py-2.5 bg-[#FC0100] text-white text-sm font-medium tracking-tight rounded-2xl shadow-[0_6px_20px_rgba(0,0,0,0.08)] hover:bg-[#D40000] hover:shadow-[0_8px_28px_rgba(0,0,0,0.13)] hover:-translate-y-px transition-all duration-200"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New client
            </Link>
            <a
              href="/api/logout"
              className="text-xs text-neutral-400 font-light hover:text-neutral-700 transition-colors"
              title="Sign out"
            >
              Sign out
            </a>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-8 py-12">
        {clients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <div className="w-12 h-12 flex items-center justify-center">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <polygon points="20,2 38,38 2,38" stroke="#E5E5E5" strokeWidth="1.5" fill="none" />
              </svg>
            </div>
            <div className="text-center space-y-1">
              <h2
                className="text-2xl text-black tracking-[-0.04em]"
                style={{ fontFamily: "'Imbue', serif", fontWeight: 300 }}
              >
                No clients yet
              </h2>
              <p className="text-sm text-[#A0A0A0] font-light">Start by registering your first client.</p>
            </div>
            <Link
              href="/clients/new"
              className="px-5 py-2.5 bg-[#FC0100] text-white text-sm font-medium rounded-2xl shadow-[0_6px_20px_rgba(0,0,0,0.08)] hover:bg-[#D40000] hover:shadow-[0_8px_28px_rgba(0,0,0,0.13)] hover:-translate-y-px transition-all duration-200"
            >
              Register client
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-10 flex items-end justify-between">
              <div>
                <h1
                  className="text-3xl text-black tracking-[-0.04em]"
                  style={{ fontFamily: "'Imbue', serif", fontWeight: 300 }}
                >
                  Clients
                </h1>
                <p className="mt-1 text-sm text-[#A0A0A0] font-light">
                  {clients.length} client{clients.length !== 1 ? "s" : ""} registered
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {clients.map((client: Client) => (
                <ClientCard key={client.id} client={client} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
