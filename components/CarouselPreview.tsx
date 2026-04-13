"use client";

import { useState } from "react";
import { StructuredPost, CarouselSlide, SlideType } from "@/types";
import { TEMPLATES_BY_ID, type SlideLayout } from "@/lib/ai/templates";

interface CarouselPreviewProps {
  post: StructuredPost;
  clientName: string;
  savedPostId?: string;
  templateId?: string;
}

const SLIDE_LABELS: Record<SlideType, string> = {
  hook: "Hook",
  context: "Context",
  problem: "Problem",
  insight: "Insight",
  cta: "CTA",
};

// Resolve the display label: prefer the template's custom label (e.g. "Tension", "Setup")
// over the generic slide type label.
function resolveLabel(slide: CarouselSlide, index: number, templateId?: string): string {
  if (templateId) {
    const template = TEMPLATES_BY_ID[templateId];
    const def = template?.slides[index];
    if (def?.label) return def.label;
  }
  return SLIDE_LABELS[slide.type] ?? slide.type;
}

function resolveLayout(slide: CarouselSlide, index: number, templateId?: string): SlideLayout {
  if (templateId) {
    const template = TEMPLATES_BY_ID[templateId];
    const def = template?.slides[index];
    if (def?.layout) return def.layout;
  }
  // Sensible defaults when no template
  if (slide.type === "hook") return "title-subtitle";
  if (slide.type === "insight") return "title-body-large";
  return "title-body";
}

function SlideCard({
  slide,
  index,
  templateId,
}: {
  slide: CarouselSlide;
  index: number;
  templateId?: string;
}) {
  const label = resolveLabel(slide, index, templateId);
  const layout = resolveLayout(slide, index, templateId);
  const isLarge = layout === "title-body-large";

  return (
    <div className="border border-[#E5E5E5]">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-[#E5E5E5]">
        <span className="text-[9px] font-medium text-[#A0A0A0] uppercase tracking-widest">
          {index + 1}
        </span>
        <span className="text-[9px] text-[#C0C0C0]">—</span>
        <span className="text-[9px] font-medium text-[#474747] uppercase tracking-widest">{label}</span>
      </div>
      <div className="px-4 py-3 space-y-1.5">
        <p
          className={`text-black tracking-[-0.03em] leading-tight ${isLarge ? "text-lg" : "text-base"}`}
          style={{ fontFamily: "'Imbue', serif", fontWeight: 300 }}
        >
          {slide.title}
        </p>
        {slide.subtitle && (
          <p className="text-sm text-[#474747] font-light leading-relaxed">{slide.subtitle}</p>
        )}
        {slide.body && (
          <p className={`font-light leading-relaxed ${isLarge ? "text-sm text-black" : "text-sm text-[#474747]"}`}>
            {slide.body}
          </p>
        )}
      </div>
    </div>
  );
}

export function CarouselPreview({ post, clientName: _clientName, savedPostId, templateId }: CarouselPreviewProps) {
  const [copied, setCopied] = useState(false);
  const [idCopied, setIdCopied] = useState(false);
  const figmaFileKey = process.env.NEXT_PUBLIC_FIGMA_FILE_KEY;

  const templateName = templateId ? TEMPLATES_BY_ID[templateId]?.name : undefined;

  const allContent = [
    ...post.slides.map((s, i) => {
      const label = resolveLabel(s, i, templateId);
      return [
        `SLIDE ${i + 1} (${label.toUpperCase()})`,
        `Title: ${s.title}`,
        s.subtitle ? `Subtitle: ${s.subtitle}` : null,
        s.body ? `Body: ${s.body}` : null,
      ]
        .filter(Boolean)
        .join("\n");
    }),
    `\nCAPTION:\n${post.caption}`,
    `\nVISUAL:\n${post.visualDescription}`,
    `\nLOGO:\n${post.logoUsage}`,
  ].join("\n\n");

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

  return (
    <div className="bg-white">
      {/* Figma Plugin ID */}
      {savedPostId && (
        <div className="px-5 pt-5">
          <div className="border border-[#E5E5E5] px-4 py-4">
            <p className="text-[9px] font-medium text-[#A0A0A0] uppercase tracking-widest mb-2">
              Figma plugin — post ID
            </p>
            <p className="text-xs font-mono text-black break-all mb-3 leading-relaxed">{savedPostId}</p>
            <div className="flex gap-2">
              <button
                onClick={copyPostId}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FC0100] hover:bg-[#CC0000] text-white text-xs font-medium transition"
              >
                {idCopied ? (
                  <>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Copied
                  </>
                ) : "Copy ID"}
              </button>
              {figmaFileKey && (
                <a
                  href={`https://www.figma.com/design/${figmaFileKey}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-[#E5E5E5] hover:border-[#FC0100] text-[#474747] text-xs font-medium transition"
                >
                  Open in Figma
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Slides */}
      <div className="px-5 py-5 space-y-3">
        <div className="flex items-center justify-between mb-1">
          <p className="text-[9px] font-medium text-[#A0A0A0] uppercase tracking-widest">
            {templateName ? `${templateName} · ` : ""}{post.slides.length} slides
          </p>
          <button
            onClick={copyAll}
            className="text-xs text-[#A0A0A0] hover:text-black font-light transition"
          >
            {copied ? "Copied" : "Copy all"}
          </button>
        </div>

        {post.slides.map((slide, i) => (
          <SlideCard key={i} slide={slide} index={i} templateId={templateId} />
        ))}
      </div>

      {/* Caption + Visual */}
      <div className="px-5 pb-5 space-y-3">
        {post.caption && (
          <div className="border border-[#E5E5E5] px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[9px] font-medium text-[#A0A0A0] uppercase tracking-widest">Instagram caption</p>
              <span className="text-[9px] text-[#C0C0C0] font-light uppercase tracking-widest">not sent to Figma</span>
            </div>
            <p className="text-sm text-black font-light whitespace-pre-line leading-relaxed">{post.caption}</p>
          </div>
        )}

        <div className="border border-dashed border-[#E5E5E5] px-4 py-3">
          <p className="text-[9px] font-medium text-[#A0A0A0] uppercase tracking-widest mb-1.5">
            Visual direction · designer only
          </p>
          <p className="text-sm text-[#474747] font-light italic leading-relaxed">{post.visualDescription}</p>
          {post.logoUsage && (
            <p className="mt-2 text-xs text-[#777] font-light">{post.logoUsage}</p>
          )}
        </div>
      </div>
    </div>
  );
}
