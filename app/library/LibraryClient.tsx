"use client";

import { useState } from "react";
import Link from "next/link";
import { TEMPLATES_BY_ID, type CarouselTemplate } from "@/lib/ai/templates";

interface PostRow {
  id: string;
  title: string;
  templateId: string;
  slides: string;
  createdAt: Date | string;
  client: { id: string; name: string };
}

interface Props {
  posts: PostRow[];
  clients: { id: string; name: string }[];
  templates: CarouselTemplate[];
  initialClientId?: string;
}

function slideCount(slidesJson: string): number {
  try { return (JSON.parse(slidesJson) as unknown[]).length; } catch { return 0; }
}

function formatDate(d: Date | string): string {
  return new Date(d).toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" });
}

function templateName(id: string): string {
  return TEMPLATES_BY_ID[id]?.name ?? id ?? "—";
}

export function LibraryClient({ posts, clients, templates, initialClientId = "" }: Props) {
  const [clientFilter, setClientFilter]     = useState(initialClientId);
  const [templateFilter, setTemplateFilter] = useState("");

  const filtered = posts.filter((p) => {
    if (clientFilter   && p.client.id   !== clientFilter)   return false;
    if (templateFilter && p.templateId  !== templateFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium text-[#A0A0A0] uppercase tracking-widest">Cliente</span>
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="border border-[#E5E5E5] rounded-xl px-3 py-1.5 text-xs text-black font-light focus:outline-none focus:border-[#FC0100] transition bg-white"
          >
            <option value="">Todos os clientes</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium text-[#A0A0A0] uppercase tracking-widest">Template</span>
          <select
            value={templateFilter}
            onChange={(e) => setTemplateFilter(e.target.value)}
            className="border border-[#E5E5E5] rounded-xl px-3 py-1.5 text-xs text-black font-light focus:outline-none focus:border-[#FC0100] transition bg-white"
          >
            <option value="">Todos os templates</option>
            {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>

        {(clientFilter || templateFilter) && (
          <button
            onClick={() => { setClientFilter(""); setTemplateFilter(""); }}
            className="text-xs text-[#A0A0A0] hover:text-[#FC0100] font-light transition"
          >
            Limpar filtros
          </button>
        )}

        <span className="ml-auto text-xs text-[#A0A0A0] font-light">
          {filtered.length} post{filtered.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <polygon points="16,2 30,30 2,30" stroke="#E5E5E5" strokeWidth="1" fill="none" />
          </svg>
          <p className="text-sm text-[#A0A0A0] font-light">Nenhum post encontrado com os filtros atuais.</p>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-[#E5E5E5] divide-y divide-[#E5E5E5]">
          {filtered.map((post) => {
            const count = slideCount(post.slides);
            return (
              <Link
                key={post.id}
                href={`/posts/${post.id}`}
                className="flex items-center gap-5 px-6 py-4 hover:bg-[#FAFAFA] transition-all duration-200 group"
              >
                <div className="flex-1 min-w-0 space-y-0.5">
                  <p
                    className="text-sm text-black tracking-tight leading-tight truncate group-hover:text-[#FC0100] transition"
                    style={{ fontFamily: "'Imbue', serif", fontWeight: 300 }}
                  >
                    {post.title || "Sem título"}
                  </p>
                  <p className="text-xs text-[#A0A0A0] font-light">{post.client.name}</p>
                </div>

                <div className="shrink-0 hidden sm:flex items-center gap-4">
                  <span className="text-xs text-[#474747] font-light border border-[#E5E5E5] rounded-lg px-2 py-0.5">
                    {templateName(post.templateId)}
                  </span>
                  <span className="text-[10px] text-[#A0A0A0] font-light uppercase tracking-widest">
                    {count} slide{count !== 1 ? "s" : ""}
                  </span>
                  <span className="text-[10px] text-[#C0C0C0] font-light w-24 text-right">
                    {formatDate(post.createdAt)}
                  </span>
                </div>

                <svg className="w-3.5 h-3.5 text-[#E5E5E5] group-hover:text-[#FC0100] transition shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
