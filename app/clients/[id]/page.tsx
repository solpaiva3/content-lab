"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Client, Idea, StructuredPost, parseClient, parseClientPersonality, parseClientPillars } from "@/types";
import { IdeaCard } from "@/components/IdeaCard";
import { CarouselPreview } from "@/components/CarouselPreview";
import { TemplateSelector } from "@/components/TemplateSelector";
import { TEMPLATES } from "@/lib/ai/templates";
import type { GenerationMode } from "@/lib/ai/modes";

interface Brief {
  idea: string;
  reference: string;
}

const EMPTY_BRIEF: Brief = { idea: "", reference: "" };

export default function ClientPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  const [briefs, setBriefs] = useState<Brief[]>([{ ...EMPTY_BRIEF }]);
  const [mode, setMode] = useState<GenerationMode>("quality");
  const [templateId, setTemplateId] = useState<string>(TEMPLATES[0].id);
  const [expandedRef, setExpandedRef] = useState<Record<number, boolean>>({});

  const [posts, setPosts] = useState<Idea[]>([]);
  const [generating, setGenerating] = useState(false);

  const [savingPostFor, setSavingPostFor] = useState<string | null>(null);
  const [approvedPosts, setApprovedPosts] = useState<Record<string, StructuredPost>>({});
  const [approvedTemplateIds, setApprovedTemplateIds] = useState<Record<string, string>>({});
  const [savedPostIds, setSavedPostIds] = useState<Record<string, string>>({});

  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/clients/${id}`)
      .then((r) => r.json())
      .then((c) => {
        if (c.error) { router.push("/"); return; }
        setClient(c);
        setLoading(false);
      })
      .catch(() => router.push("/"));
  }, [id, router]);

  // ── Brief management ─────────────────────────────────────────────
  const updateBrief = (index: number, field: keyof Brief, value: string) => {
    setBriefs((prev) => prev.map((b, i) => i === index ? { ...b, [field]: value } : b));
  };

  const addBrief = () => {
    if (briefs.length < 5) setBriefs((prev) => [...prev, { ...EMPTY_BRIEF }]);
  };

  const removeBrief = (index: number) => {
    setBriefs((prev) => prev.length === 1 ? [{ ...EMPTY_BRIEF }] : prev.filter((_, i) => i !== index));
  };

  const toggleRef = (index: number) => {
    setExpandedRef((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const filledBriefs = briefs.filter((b) => b.idea.trim());

  // ── Generate ─────────────────────────────────────────────────────
  const generatePosts = useCallback(async () => {
    if (!client || filledBriefs.length === 0) return;
    setGenerating(true);
    setError("");
    setPosts([]);
    setApprovedPosts({});
    setSavedPostIds({});
    setApprovedTemplateIds({});

    const results = await Promise.all(
      filledBriefs.map(async (brief) => {
        try {
          const res = await fetch("/api/generate/ideas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              client,
              userIdea: brief.idea,
              reference: brief.reference || null,
              mode,
              templateId,
            }),
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error || "Generation failed");
          return {
            id: crypto.randomUUID(),
            userIdea: brief.idea,
            slides: json.post.slides ?? [],
            caption: json.post.caption ?? "",
            visualDescription: json.post.visualDescription ?? "",
            logoUsage: json.post.logoUsage ?? "",
            status: "pending",
          } as Idea;
        } catch (err) {
          return { _error: err instanceof Error ? err.message : "Failed", userIdea: brief.idea };
        }
      })
    );

    const succeeded = results.filter((r): r is Idea => !("_error" in r));
    const failed = results.filter((r): r is { _error: string; userIdea: string } => "_error" in r);

    setPosts(succeeded);
    if (failed.length > 0) {
      setError(`Failed to generate ${failed.length} post(s): ${failed.map((f) => `"${f.userIdea}"`).join(", ")}`);
    }
    setGenerating(false);
  }, [client, filledBriefs, mode, templateId]);

  // ── Approve ──────────────────────────────────────────────────────
  const approveIdea = useCallback(async (idea: Idea) => {
    if (!client) return;
    setSavingPostFor(idea.id);
    setError("");
    setPosts((prev) => prev.map((p) => p.id === idea.id ? { ...p, status: "approved" } : p));

    const structuredPost: StructuredPost = {
      slides: idea.slides,
      caption: idea.caption,
      visualDescription: idea.visualDescription,
      logoUsage: idea.logoUsage,
    };
    setApprovedPosts((prev) => ({ ...prev, [idea.id]: structuredPost }));
    setApprovedTemplateIds((prev) => ({ ...prev, [idea.id]: templateId }));

    try {
      const saveRes = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: client.id, post: structuredPost, templateId }),
      });
      if (saveRes.ok) {
        const { id: savedId } = await saveRes.json();
        setSavedPostIds((prev) => ({ ...prev, [idea.id]: savedId }));
      } else {
        const saveJson = await saveRes.json().catch(() => ({}));
        setError(`Post approved but failed to save for Figma plugin: ${saveJson.error || saveRes.status}`);
      }
    } catch (err) {
      setPosts((prev) => prev.map((p) => p.id === idea.id ? { ...p, status: "pending" } : p));
      setError(err instanceof Error ? err.message : "Failed to save post");
    } finally {
      setSavingPostFor(null);
    }
  }, [client]);

  const rejectIdea = (ideaId: string) => {
    setPosts((prev) => prev.map((p) => p.id === ideaId ? { ...p, status: "rejected" } : p));
  };

  // ── Render ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-6 h-6 border border-[#FC0100] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!client) return null;

  const parsed = parseClient(client);
  const personalityTags = parseClientPersonality(client);
  const pillarTags = parseClientPillars(client);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-[#E5E5E5] sticky top-0 z-10 bg-white">
        <div className="max-w-6xl mx-auto px-8 py-5 flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-[#A0A0A0] hover:text-[#FC0100] transition font-light shrink-0"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Clients
          </Link>

          <div className="h-4 w-px bg-[#E5E5E5]" />

          <div className="flex-1 flex items-center justify-between min-w-0">
            <div className="flex items-center gap-5 min-w-0">
              <div>
                <h1
                  className="text-lg text-black tracking-[-0.04em] leading-tight truncate"
                  style={{ fontFamily: "'Imbue', serif", fontWeight: 300 }}
                >
                  {parsed.name}
                </h1>
                <p className="text-xs text-[#A0A0A0] font-light">{parsed.sector}</p>
              </div>
              {parsed.colors.length > 0 && (
                <div className="flex gap-1 shrink-0">
                  {parsed.colors.map((c, i) => (
                    <div key={i} className="w-3.5 h-3.5 border border-[#E5E5E5]" style={{ backgroundColor: c }} />
                  ))}
                </div>
              )}
              {parsed.fonts.primary && (
                <span className="text-xs text-[#A0A0A0] font-light shrink-0">{parsed.fonts.primary}</span>
              )}
            </div>
            <Link
              href={`/library?clientId=${id}`}
              className="shrink-0 flex items-center gap-2 px-5 py-2.5 bg-[#FC0100] text-white text-sm font-medium rounded-2xl shadow-[0_6px_20px_rgba(0,0,0,0.08)] hover:bg-[#D40000] hover:shadow-[0_8px_28px_rgba(0,0,0,0.13)] hover:-translate-y-px transition-all duration-200"
            >
              View history
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </header>

      {/* Context strip */}
      {(personalityTags.length > 0 || pillarTags.length > 0) && (
        <div className="border-b border-[#E5E5E5]">
          <div className="max-w-6xl mx-auto px-8 py-3 flex flex-wrap gap-2 items-center">
            {personalityTags.map((tag) => (
              <span key={tag} className="px-2.5 py-0.5 text-xs text-[#FC0100] bg-[#FC0100]/8 rounded-lg font-light">{tag}</span>
            ))}
            {personalityTags.length > 0 && pillarTags.length > 0 && (
              <span className="text-[#C0C0C0] text-xs">·</span>
            )}
            {pillarTags.map((tag) => (
              <span key={tag} className="px-2.5 py-0.5 text-xs text-[#474747] bg-[#F0F0F0] rounded-lg font-light">{tag}</span>
            ))}
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-8 py-10 space-y-10">
        {/* Error banner */}
        {error && (
          <div className="p-4 border border-[#FC0100] text-sm text-[#FC0100] font-light flex items-start gap-3">
            <span className="flex-1">{error}</span>
            <button onClick={() => setError("")} className="shrink-0 text-[#FC0100] hover:opacity-60 transition">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Brief input area */}
        <div className="border border-[#E5E5E5] p-8 space-y-6 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.04)]">
          {/* Header row */}
          <div className="flex items-start justify-between gap-6">
            <div>
              <h2
                className="text-2xl text-[#111] tracking-[-0.04em]"
                style={{ fontFamily: "'Imbue', serif", fontWeight: 300 }}
              >
                Creative briefs
              </h2>
              <p className="text-sm text-[#666] font-light mt-2">
                Describe each post in your own words — topic, angle, audience, goal, or references. The AI will structure the rest.
              </p>
            </div>

            {/* Mode selector */}
            <div className="shrink-0">
              <p className="text-[10px] font-medium text-[#A0A0A0] uppercase tracking-widest mb-2">Mode</p>
              <div className="flex border border-[#E5E5E5] rounded-xl overflow-hidden">
                <button
                  onClick={() => setMode("fast")}
                  className={`px-4 py-2 text-xs font-medium transition-all duration-200 ${
                    mode === "fast" ? "bg-black text-white" : "text-[#474747] hover:text-black"
                  }`}
                >
                  Fast
                </button>
                <button
                  onClick={() => setMode("quality")}
                  className={`px-4 py-2 text-xs font-medium transition-all duration-200 border-l border-[#E5E5E5] ${
                    mode === "quality" ? "bg-black text-white" : "text-[#474747] hover:text-black"
                  }`}
                >
                  Quality
                </button>
              </div>
              <p className="text-[10px] text-[#C0C0C0] font-light mt-1.5">
                {mode === "fast" ? "Faster · lower cost" : "Better writing"}
              </p>
            </div>
          </div>

          {/* Template selector */}
          <TemplateSelector selected={templateId} onChange={setTemplateId} />

          <div className="space-y-4">
            {briefs.map((brief, index) => (
              <div
                key={index}
                className="border border-[#E5E5E5] focus-within:border-[#FC0100] transition-all duration-200 overflow-hidden rounded-xl"
              >
                {/* Card header */}
                <div className="flex items-center justify-between px-4 pt-3 pb-1">
                  <span className="text-[10px] font-medium text-[#A0A0A0] uppercase tracking-widest">
                    Brief {index + 1}
                  </span>
                  {briefs.length > 1 && (
                    <button
                      onClick={() => removeBrief(index)}
                      className="w-6 h-6 flex items-center justify-center text-[#C0C0C0] hover:text-[#FC0100] transition"
                      title="Remove brief"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Idea textarea */}
                <textarea
                  value={brief.idea}
                  onChange={(e) => updateBrief(index, "idea", e.target.value)}
                  placeholder="Describe the post — topic, angle, audience, goal, or anything that sets the direction. The more context you give, the better the output."
                  rows={4}
                  className="w-full px-4 py-2 text-sm text-black placeholder-[#D5D5D5] font-light bg-transparent resize-none focus:outline-none leading-relaxed"
                />

                {/* Reference toggle + field */}
                <div className="px-4 pb-3 border-t border-[#F0F0F0]">
                  <button
                    type="button"
                    onClick={() => toggleRef(index)}
                    className="mt-2 flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900 transition font-light"
                  >
                    <svg
                      className={`w-3 h-3 transition-transform ${expandedRef[index] ? "rotate-90" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                    {brief.reference ? "Reference added" : "Add reference (optional)"}
                  </button>

                  {expandedRef[index] && (
                    <textarea
                      value={brief.reference}
                      onChange={(e) => updateBrief(index, "reference", e.target.value)}
                      placeholder="Paste an example caption, a post you admire, or a tone/style reference. The AI will use it as inspiration — not copy it."
                      rows={3}
                      className="mt-2 w-full text-sm text-[#474747] placeholder-[#D5D5D5] font-light bg-transparent resize-none focus:outline-none leading-relaxed border border-dashed border-[#E5E5E5] px-3 py-2"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <button
              onClick={addBrief}
              disabled={briefs.length >= 5}
              className="flex items-center gap-1.5 text-sm text-[#474747] hover:text-[#FC0100] font-light disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add brief {briefs.length < 5 ? `(${5 - briefs.length} remaining)` : "(max 5)"}
            </button>

            {filledBriefs.length > 0 && (
              <button
                onClick={generatePosts}
                disabled={generating}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#FC0100] text-white text-sm font-medium hover:bg-[#D40000] transition-all duration-200 disabled:opacity-40 rounded-xl shadow-[0_2px_8px_rgba(252,1,0,0.25)] hover:shadow-[0_4px_16px_rgba(252,1,0,0.35)]"
              >
                {generating ? (
                  <>
                    <div className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>Generate {filledBriefs.length === 1 ? "post" : `${filledBriefs.length} posts`}</>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Loading skeletons */}
        {generating && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filledBriefs.map((_, i) => (
              <div key={i} className="border border-[#E5E5E5] p-6 flex flex-col gap-4 animate-pulse rounded-2xl">
                <div className="h-2 bg-[#E5E5E5] w-1/3" />
                <div className="h-5 bg-[#E5E5E5] w-3/4" />
                <div className="space-y-2">
                  <div className="h-3 bg-[#E5E5E5]" />
                  <div className="h-3 bg-[#E5E5E5] w-5/6" />
                  <div className="h-3 bg-[#E5E5E5] w-4/6" />
                </div>
                <div className="h-8 bg-[#E5E5E5] mt-2" />
              </div>
            ))}
          </div>
        )}

        {/* Generated post cards */}
        {!generating && posts.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2
                className="text-2xl text-[#111] tracking-[-0.04em]"
                style={{ fontFamily: "'Imbue', serif", fontWeight: 300 }}
              >
                Generated posts
                <span className="ml-3 text-sm font-light text-[#A0A0A0]" style={{ fontFamily: "'Inter', sans-serif" }}>
                  ({posts.length})
                </span>
              </h2>
              <button
                onClick={generatePosts}
                className="text-sm text-[#A0A0A0] hover:text-[#FC0100] font-light flex items-center gap-1.5 transition"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Regenerate all
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {posts.map((post) => (
                <div key={post.id} className="flex flex-col gap-4">
                  <IdeaCard
                    idea={post}
                    onApprove={() => approveIdea(post)}
                    onReject={() => rejectIdea(post.id)}
                    isSaving={savingPostFor === post.id}
                  />
                  {post.status === "approved" && approvedPosts[post.id] && (
                    <CarouselPreview
                      post={approvedPosts[post.id]}
                      clientName={parsed.name}
                      savedPostId={savedPostIds[post.id]}
                      templateId={approvedTemplateIds[post.id]}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!generating && posts.length === 0 && filledBriefs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <polygon points="16,2 30,30 2,30" stroke="#E5E5E5" strokeWidth="1" fill="none" />
            </svg>
            <div>
              <h2
                className="text-2xl text-[#111] tracking-[-0.04em]"
                style={{ fontFamily: "'Imbue', serif", fontWeight: 300 }}
              >
                Write your first brief above
              </h2>
              <p className="mt-2 text-sm text-[#888] font-light">Describe the topic, angle, or goal — then generate.</p>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
