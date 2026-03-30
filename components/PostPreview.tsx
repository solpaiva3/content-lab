"use client";

import { useState } from "react";
import Image from "next/image";
import { StructuredPost } from "@/types";

interface PostPreviewProps {
  post: StructuredPost;
  clientName: string;
  savedPostId?: string;
}

export function PostPreview({ post, clientName, savedPostId }: PostPreviewProps) {
  const [copied, setCopied] = useState(false);
  const [idCopied, setIdCopied] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

  const figmaFileKey = process.env.NEXT_PUBLIC_FIGMA_FILE_KEY;

  const allContent = `TITLE: ${post.title}\n\nSUBTITLE: ${post.subtitle}\n\nCAPTION:\n${post.body}\n\nVISUAL DESCRIPTION:\n${post.visualDescription}\n\nLOGO USAGE:\n${post.logoUsage}`;

  const copyAll = () => {
    navigator.clipboard.writeText(allContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyPostId = () => {
    if (!savedPostId) return;
    navigator.clipboard.writeText(savedPostId);
    setIdCopied(true);
    setTimeout(() => setIdCopied(false), 2000);
  };

  const generateImage = async () => {
    setGeneratingImage(true);
    setImageError(null);
    try {
      const res = await fetch("/api/generate/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visualDescription: post.visualDescription, clientName }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Image generation failed");
      setImageUrl(json.url);
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "Failed to generate image");
    } finally {
      setGeneratingImage(false);
    }
  };

  return (
    <div className="rounded-2xl border border-violet-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-white text-base">Structured post</h3>
          <p className="text-violet-200 text-xs mt-0.5">Approved — ready for Figma plugin</p>
        </div>
        <button
          onClick={copyAll}
          className="px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-sm transition flex items-center gap-1.5"
        >
          {copied ? (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy all
            </>
          )}
        </button>
      </div>

      {/* Figma Plugin ID */}
      {savedPostId && (
        <div className="px-6 pt-5">
          <div className="rounded-xl bg-violet-50 border border-violet-200 px-4 py-4">
            <p className="text-xs font-semibold text-violet-500 uppercase tracking-wider mb-2">
              Use this ID in the Content Lab Figma plugin
            </p>
            <p className="text-sm font-mono text-violet-900 break-all mb-3">{savedPostId}</p>
            <div className="flex gap-2">
              <button
                onClick={copyPostId}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-semibold transition"
              >
                {idCopied ? (
                  <>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy ID
                  </>
                )}
              </button>
              {figmaFileKey && (
                <a
                  href={`https://www.figma.com/design/${figmaFileKey}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-violet-200 hover:border-violet-400 text-violet-700 text-xs font-semibold transition"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  Open in Figma
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Post fields */}
      <div className="p-6 space-y-4">
        <PostField label="Title" value={post.title} />
        <PostField label="Subtitle" value={post.subtitle} />
        <PostField label="Caption" value={post.body} multiline />
        <PostField label="Logo usage" value={post.logoUsage} accent="blue" />
      </div>

      {/* Visual reference + image generation */}
      <div className="px-6 pb-6 space-y-3">
        <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-amber-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Visual reference · designer only
              </p>
              <p className="text-sm text-amber-800 italic leading-relaxed">{post.visualDescription}</p>
            </div>
            <button
              onClick={generateImage}
              disabled={generatingImage}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-semibold transition disabled:opacity-60"
            >
              {generatingImage ? (
                <>
                  <div className="w-3 h-3 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                  Generating…
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {imageUrl ? "Regenerate" : "Generate image"}
                </>
              )}
            </button>
          </div>
        </div>

        {imageError && <p className="text-xs text-red-600 px-1">{imageError}</p>}

        {imageUrl && (
          <div className="rounded-xl overflow-hidden border border-gray-100 relative">
            <Image
              src={imageUrl}
              alt="AI generated visual"
              width={1024}
              height={1024}
              className="w-full h-auto"
              unoptimized
            />
            <a
              href={imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white text-xs font-medium transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

function PostField({
  label,
  value,
  multiline,
  accent,
}: {
  label: string;
  value: string;
  multiline?: boolean;
  accent?: "amber" | "blue";
}) {
  const accentClass =
    accent === "amber"
      ? "bg-amber-50 border-amber-100"
      : accent === "blue"
      ? "bg-blue-50 border-blue-100"
      : "bg-gray-50 border-gray-100";

  return (
    <div className={`rounded-xl border px-4 py-3 ${accentClass}`}>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-sm text-gray-900 ${multiline ? "whitespace-pre-line leading-relaxed" : ""}`}>
        {value}
      </p>
    </div>
  );
}
