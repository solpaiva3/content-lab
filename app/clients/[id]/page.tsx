"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Client, Idea, StructuredPost, parseClient } from "@/types";
import { IdeaCard } from "@/components/IdeaCard";
import { PostPreview } from "@/components/PostPreview";

export default function ClientPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  // User inputs
  const [userInputs, setUserInputs] = useState<string[]>([""]);

  // Generated posts
  const [posts, setPosts] = useState<Idea[]>([]);
  const [generating, setGenerating] = useState(false);

  // Approve flow
  const [generatingPostFor, setGeneratingPostFor] = useState<string | null>(null);
  const [approvedPosts, setApprovedPosts] = useState<Record<string, StructuredPost>>({});
  const [savedPostIds, setSavedPostIds] = useState<Record<string, string>>({}); // ideaId → DB post id

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

  // ── Input management ────────────────────────────────────────────
  const updateInput = (index: number, value: string) => {
    setUserInputs((prev) => prev.map((v, i) => (i === index ? value : v)));
  };

  const addInput = () => {
    if (userInputs.length < 5) setUserInputs((prev) => [...prev, ""]);
  };

  const removeInput = (index: number) => {
    setUserInputs((prev) => prev.length === 1 ? [""] : prev.filter((_, i) => i !== index));
  };

  const filledInputs = userInputs.filter((v) => v.trim());

  // ── Generate posts ───────────────────────────────────────────────
  const generatePosts = useCallback(async () => {
    if (!client || filledInputs.length === 0) return;
    setGenerating(true);
    setError("");
    setPosts([]);
    setApprovedPosts({});
    setSavedPostIds({});

    const results = await Promise.all(
      filledInputs.map(async (userIdea) => {
        try {
          const res = await fetch("/api/generate/ideas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ client, userIdea }),
          });
          const json = await res.json();
          if (!res.ok) throw new Error(json.error || "Generation failed");
          return {
            id: crypto.randomUUID(),
            userIdea,
            ...json.post,
            characteristic3: json.post.characteristic3 ?? null,
            status: "pending" as const,
          } satisfies Idea;
        } catch (err) {
          const message = err instanceof Error ? err.message : "Failed";
          return { _error: message, userIdea };
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
  }, [client, filledInputs]);

  // ── Approve ──────────────────────────────────────────────────────
  const approveIdea = useCallback(async (idea: Idea) => {
    if (!client) return;
    setGeneratingPostFor(idea.id);
    setError("");
    setPosts((prev) => prev.map((p) => p.id === idea.id ? { ...p, status: "approved" } : p));

    try {
      const res = await fetch("/api/generate/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client, idea }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Post generation failed");
      const structuredPost: StructuredPost = json.post;
      setApprovedPosts((prev) => ({ ...prev, [idea.id]: structuredPost }));

      // Persist to DB so the Figma plugin can fetch it by ID
      const saveRes = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: client.id, post: structuredPost }),
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
      setError(err instanceof Error ? err.message : "Failed to generate post");
    } finally {
      setGeneratingPostFor(null);
    }
  }, [client]);

  const rejectIdea = (ideaId: string) => {
    setPosts((prev) => prev.map((p) => p.id === ideaId ? { ...p, status: "rejected" } : p));
  };


  // ── Render ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!client) return null;

  const parsed = parseClient(client);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Clients
          </Link>

          <div className="flex-1 flex items-center gap-4 min-w-0">
            <div className="h-6 w-px bg-gray-200" />
            <div>
              <h1 className="font-bold text-gray-900 text-base leading-tight truncate">{parsed.name}</h1>
              <p className="text-xs text-gray-500">{parsed.sector}</p>
            </div>
            {parsed.colors.length > 0 && (
              <div className="flex gap-1 ml-2 shrink-0">
                {parsed.colors.map((c, i) => (
                  <div key={i} className="w-4 h-4 rounded-full border border-white shadow-sm" style={{ backgroundColor: c }} />
                ))}
              </div>
            )}
            {parsed.fonts.primary && (
              <span className="text-xs text-gray-400 shrink-0">{parsed.fonts.primary}</span>
            )}
          </div>
        </div>
      </header>

      {/* Tone tags */}
      <div className="bg-violet-50 border-b border-violet-100">
        <div className="max-w-6xl mx-auto px-6 py-3 flex flex-wrap gap-2">
          {parsed.personality.map((tag) => (
            <span key={tag} className="px-2.5 py-1 rounded-full text-xs font-medium bg-violet-100 text-violet-700">{tag}</span>
          ))}
          <span className="text-violet-300">·</span>
          {parsed.pillars.map((tag) => (
            <span key={tag} className="px-2.5 py-1 rounded-full text-xs font-medium bg-white border border-violet-200 text-violet-600">{tag}</span>
          ))}
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Error banner */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-3">
            <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
            <button onClick={() => setError("")} className="ml-auto text-red-400 hover:text-red-600">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Idea input area */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Your post ideas</h2>
            <p className="text-sm text-gray-500 mt-0.5">Describe each post idea — the AI will generate structured content for each one.</p>
          </div>

          <div className="space-y-3">
            {userInputs.map((value, index) => (
              <div key={index} className="flex gap-2 items-center">
                <span className="shrink-0 w-6 h-6 rounded-full bg-violet-100 text-violet-600 text-xs font-bold flex items-center justify-center">
                  {index + 1}
                </span>
                <input
                  type="text"
                  value={value}
                  onChange={(e) => updateInput(index, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && index === userInputs.length - 1 && userInputs.length < 5) {
                      addInput();
                    }
                  }}
                  placeholder={`Post idea ${index + 1}, e.g. "A post about our new winter collection drop"`}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
                {userInputs.length > 1 && (
                  <button
                    onClick={() => removeInput(index)}
                    className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                    title="Remove"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={addInput}
              disabled={userInputs.length >= 5}
              className="flex items-center gap-1.5 text-sm text-violet-600 hover:text-violet-700 font-medium disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add idea {userInputs.length < 5 ? `(${5 - userInputs.length} remaining)` : "(max 5)"}
            </button>

            {filledInputs.length > 0 && (
              <button
                onClick={generatePosts}
                disabled={generating}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition disabled:opacity-60"
              >
                {generating ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Generate {filledInputs.length === 1 ? "post" : `${filledInputs.length} posts`}
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Loading skeletons */}
        {generating && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filledInputs.map((_, i) => (
              <div key={i} className="rounded-2xl border border-gray-100 bg-white p-5 flex flex-col gap-3 animate-pulse">
                <div className="h-3 bg-gray-100 rounded w-2/3" />
                <div className="h-5 bg-gray-100 rounded w-3/4" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-100 rounded" />
                  <div className="h-4 bg-gray-100 rounded w-5/6" />
                  <div className="h-4 bg-gray-100 rounded w-4/6" />
                </div>
                <div className="h-9 bg-violet-100 rounded-xl mt-1" />
              </div>
            ))}
          </div>
        )}

        {/* Generated post cards */}
        {!generating && posts.length > 0 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">
                Generated posts
                <span className="ml-2 text-sm font-normal text-gray-400">({posts.length})</span>
              </h2>
              <button
                onClick={generatePosts}
                className="text-sm text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
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
                    isGeneratingPost={generatingPostFor === post.id}
                  />
                  {post.status === "approved" && approvedPosts[post.id] && (
                    <PostPreview
                      post={approvedPosts[post.id]}
                      clientName={parsed.name}
                      savedPostId={savedPostIds[post.id]}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!generating && posts.length === 0 && filledInputs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center">
              <svg className="w-7 h-7 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-semibold text-gray-900">Add your ideas above</h2>
              <p className="mt-1 text-sm text-gray-500">Type your post ideas and click &ldquo;Generate posts&rdquo; to get AI-powered content.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
