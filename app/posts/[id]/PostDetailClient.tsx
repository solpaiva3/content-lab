"use client";

import { useState, useCallback } from "react";
import { TEMPLATES_BY_ID, type CarouselTemplate, type SlideLayout } from "@/lib/ai/templates";
import type { CarouselSlide, SlideType } from "@/types";

interface Post {
  id: string;
  title: string;
  caption: string;
  visualDescription: string;
  logoUsage: string;
  createdAt: string;
  slides: unknown[];
}

interface PostClient {
  id: string;
  name: string;
  sector: string;
  logoUrl: string | null;
  logoVariants: string | null;
}

interface Props {
  post: Post;
  client: PostClient;
  template: CarouselTemplate | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const SLIDE_LABELS: Record<SlideType, string> = {
  hook: "Hook", context: "Context", problem: "Problem", insight: "Insight", cta: "CTA",
};

function resolveLabel(slide: CarouselSlide, index: number, template: CarouselTemplate | null): string {
  return template?.slides[index]?.label ?? SLIDE_LABELS[slide.type] ?? slide.type;
}

function resolveLayout(slide: CarouselSlide, index: number, template: CarouselTemplate | null): SlideLayout {
  if (template?.slides[index]?.layout) return template.slides[index].layout;
  if (slide.type === "hook") return "title-subtitle";
  if (slide.type === "insight") return "title-body-large";
  return "title-body";
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

// ── Primitive edit inputs ─────────────────────────────────────────────────────

function EditableField({
  label,
  value,
  onChange,
  multiline = false,
  rows = 2,
  large = false,
  serif = false,
  muted = false,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
  rows?: number;
  large?: boolean;
  serif?: boolean;
  muted?: boolean;
}) {
  const base =
    "w-full bg-transparent focus:outline-none focus:ring-0 border-0 border-b border-transparent " +
    "focus:border-[#E5E5E5] transition resize-none placeholder-[#D0D0D0] font-light leading-relaxed";

  const sizeClass = large ? "text-xl" : "text-sm";
  const colorClass = muted ? "text-[#474747]" : "text-black";
  const fontStyle = serif ? { fontFamily: "'Imbue', serif", fontWeight: 300 } : undefined;

  return (
    <div className="group/field">
      {label && (
        <p className="text-[9px] font-medium text-[#A0A0A0] uppercase tracking-widest mb-1">{label}</p>
      )}
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          className={`${base} ${sizeClass} ${colorClass}`}
          style={fontStyle}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${base} ${sizeClass} ${colorClass}`}
          style={fontStyle}
        />
      )}
    </div>
  );
}

// ── Slide editor card ─────────────────────────────────────────────────────────

function SlideEditor({
  slide,
  index,
  template,
  onChange,
}: {
  slide: CarouselSlide;
  index: number;
  template: CarouselTemplate | null;
  onChange: (updated: CarouselSlide) => void;
}) {
  const label  = resolveLabel(slide, index, template);
  const layout = resolveLayout(slide, index, template);
  const large  = layout === "title-body-large";
  const hasSubtitle = layout === "title-subtitle" || slide.subtitle !== undefined;
  const hasBody     = layout !== "title-subtitle" || slide.body !== undefined;

  return (
    <div className="border border-[#E5E5E5] hover:border-[#C0C0C0] transition-all duration-200 rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_6px_24px_rgba(0,0,0,0.07)]">
      <div className="flex items-center gap-2 px-5 py-2.5 border-b border-[#E5E5E5]">
        <span className="text-[9px] font-medium text-[#A0A0A0] uppercase tracking-widest">{index + 1}</span>
        <span className="text-[9px] text-[#D0D0D0]">—</span>
        <span className="text-[9px] font-medium text-[#474747] uppercase tracking-widest">{label}</span>
        <span className="ml-auto text-[9px] text-[#D0D0D0] font-light">click to edit</span>
      </div>
      <div className="px-5 py-4 space-y-3">
        <EditableField
          value={slide.title}
          onChange={(v) => onChange({ ...slide, title: v })}
          large={large}
          serif
        />
        {hasSubtitle && (
          <EditableField
            value={slide.subtitle ?? ""}
            onChange={(v) => onChange({ ...slide, subtitle: v || undefined })}
            multiline
            rows={2}
            muted
          />
        )}
        {hasBody && (
          <EditableField
            value={slide.body ?? ""}
            onChange={(v) => onChange({ ...slide, body: v || undefined })}
            multiline
            rows={large ? 4 : 3}
            muted={!large}
          />
        )}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function PostDetailClient({ post, client: _client, template }: Props) {
  const [slides, setSlides]               = useState<CarouselSlide[]>(post.slides as CarouselSlide[]);
  const [caption, setCaption]             = useState(post.caption);
  const [visualDesc, setVisualDesc]       = useState(post.visualDescription);
  const [logoUsage, setLogoUsage]         = useState(post.logoUsage);

  const [saving, setSaving]               = useState(false);
  const [saveStatus, setSaveStatus]       = useState<"idle" | "saved" | "error">("idle");
  const [idCopied, setIdCopied]           = useState(false);
  const [captionCopied, setCaptionCopied] = useState(false);

  const figmaFileKey = process.env.NEXT_PUBLIC_FIGMA_FILE_KEY;

  const updateSlide = useCallback((index: number, updated: CarouselSlide) => {
    setSlides((prev) => prev.map((s, i) => i === index ? updated : s));
    setSaveStatus("idle");
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus("idle");
    try {
      const res = await fetch(`/api/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slides, caption, visualDescription: visualDesc, logoUsage }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch {
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  };

  const isDirty =
    JSON.stringify(slides) !== JSON.stringify(post.slides as CarouselSlide[]) ||
    caption !== post.caption ||
    visualDesc !== post.visualDescription ||
    logoUsage !== post.logoUsage;

  const copyPostId = () => {
    navigator.clipboard.writeText(post.id);
    setIdCopied(true);
    setTimeout(() => setIdCopied(false), 2000);
  };

  const copyCaption = () => {
    navigator.clipboard.writeText(caption);
    setCaptionCopied(true);
    setTimeout(() => setCaptionCopied(false), 2000);
  };

  return (
    <div className="space-y-10">
      {/* Meta + actions row */}
      <div className="flex items-start justify-between gap-6">
        <div className="space-y-1.5">
          <h2
            className="text-2xl text-black tracking-[-0.04em] leading-tight"
            style={{ fontFamily: "'Imbue', serif", fontWeight: 300 }}
          >
            {slides[0]?.title || post.title || "Untitled post"}
          </h2>
          <div className="flex items-center gap-3 flex-wrap">
            {template && (
              <span className="text-xs text-[#474747] border border-[#E5E5E5] px-2 py-0.5 font-light">
                {template.name}
              </span>
            )}
            <span className="text-xs text-[#A0A0A0] font-light">
              {slides.length} slide{slides.length !== 1 ? "s" : ""}
            </span>
            <span className="text-xs text-[#C0C0C0] font-light">{formatDate(post.createdAt)}</span>
          </div>
        </div>

        {/* Save + Figma */}
        <div className="shrink-0 flex flex-col gap-3">
          {/* Save button */}
          <div className="flex items-center gap-3">
            {saveStatus === "saved" && (
              <span className="text-xs text-[#A0A0A0] font-light">Saved</span>
            )}
            {saveStatus === "error" && (
              <span className="text-xs text-[#FC0100] font-light">Error saving</span>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !isDirty}
              className="px-4 py-2 border border-[#E5E5E5] text-xs font-medium text-[#474747] hover:border-black hover:text-black transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>

          {/* Figma plugin */}
          <div className="border border-[#E5E5E5] px-4 py-3">
            <p className="text-[9px] font-medium text-[#A0A0A0] uppercase tracking-widest mb-2">
              Figma plugin — post ID
            </p>
            <p className="text-xs font-mono text-black break-all mb-3 leading-relaxed">{post.id}</p>
            <div className="flex gap-2">
              <button
                onClick={copyPostId}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FC0100] hover:bg-[#D40000] text-white text-xs font-medium transition-all duration-200 rounded-lg"
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
                  Open Figma
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Slides */}
      <div className="space-y-3">
        <p className="text-[10px] font-medium text-[#A0A0A0] uppercase tracking-widest">
          Carousel · {slides.length} slides
        </p>
        {slides.map((slide, i) => (
          <SlideEditor
            key={i}
            slide={slide}
            index={i}
            template={template}
            onChange={(updated) => updateSlide(i, updated)}
          />
        ))}
      </div>

      {/* Caption */}
      <div className="border border-[#E5E5E5] px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[9px] font-medium text-[#A0A0A0] uppercase tracking-widest">Instagram caption</p>
          <button
            onClick={copyCaption}
            className="text-xs text-[#A0A0A0] hover:text-black font-light transition"
          >
            {captionCopied ? "Copied" : "Copy"}
          </button>
        </div>
        <textarea
          value={caption}
          onChange={(e) => { setCaption(e.target.value); setSaveStatus("idle"); }}
          rows={6}
          className="w-full bg-transparent text-sm text-black font-light leading-relaxed focus:outline-none resize-none"
        />
      </div>

      {/* Visual direction */}
      <div className="border border-dashed border-[#E5E5E5] px-5 py-4 space-y-3">
        <p className="text-[9px] font-medium text-[#A0A0A0] uppercase tracking-widest">
          Visual direction · designer only
        </p>
        <textarea
          value={visualDesc}
          onChange={(e) => { setVisualDesc(e.target.value); setSaveStatus("idle"); }}
          rows={3}
          className="w-full bg-transparent text-sm text-[#474747] font-light italic leading-relaxed focus:outline-none resize-none"
        />
        {(logoUsage || post.logoUsage) && (
          <input
            type="text"
            value={logoUsage}
            onChange={(e) => { setLogoUsage(e.target.value); setSaveStatus("idle"); }}
            className="w-full bg-transparent text-xs text-[#A0A0A0] font-light focus:outline-none border-b border-transparent focus:border-[#E5E5E5] transition"
          />
        )}
      </div>

      {/* Floating save bar — appears when dirty */}
      {isDirty && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 bg-white border border-[#E5E5E5] px-5 py-3 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.10)]">
          <span className="text-xs text-[#A0A0A0] font-light">Unsaved changes</span>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1.5 bg-black text-white text-xs font-medium hover:bg-[#222] transition-all duration-200 disabled:opacity-40 rounded-lg"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      )}
    </div>
  );
}
