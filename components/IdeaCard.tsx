"use client";

import { useState, useRef } from "react";
import { Idea, CarouselSlide, SlideType } from "@/types";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface IdeaEdits {
  slides: CarouselSlide[];
  caption: string;
  visualDescription: string;
  logoUsage: string;
}

interface IdeaCardProps {
  idea: Idea;
  onApprove: (edits?: IdeaEdits) => void;
  onReject: () => void;
  isSaving: boolean;
}

const SLIDE_LABELS: Record<SlideType, string> = {
  hook: "Gancho",
  context: "Contexto",
  problem: "Problema",
  insight: "Insight",
  cta: "CTA",
};

// ── Read-only slide row ───────────────────────────────────────────────────────

function SlideRow({ slide, index }: { slide: CarouselSlide; index: number }) {
  return (
    <div className="flex gap-3 py-3.5 border-b border-[#F0F0F0] last:border-0">
      <div className="shrink-0 w-16 pt-0.5">
        <span className="text-[9px] font-medium text-[#A0A0A0] uppercase tracking-widest">
          {index + 1}. {SLIDE_LABELS[slide.type] ?? slide.type}
        </span>
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <p
          className="text-sm text-black tracking-[-0.02em] leading-snug"
          style={{ fontFamily: "'Imbue', serif", fontWeight: 300 }}
        >
          {slide.title}
        </p>
        {slide.subtitle && (
          <p className="text-sm text-[#555] font-light leading-relaxed">{slide.subtitle}</p>
        )}
        {slide.body && (
          <p className="text-sm text-[#777] font-light leading-relaxed">{slide.body}</p>
        )}
      </div>
    </div>
  );
}

// ── Editable slide row ────────────────────────────────────────────────────────

function SlideEditor({
  slide,
  index,
  onChange,
}: {
  slide: CarouselSlide;
  index: number;
  onChange: (updated: CarouselSlide) => void;
}) {
  return (
    <div className="py-3.5 border-b border-[#F0F0F0] last:border-0 space-y-2">
      <span className="text-[9px] font-medium text-[#A0A0A0] uppercase tracking-widest">
        {index + 1}. {SLIDE_LABELS[slide.type] ?? slide.type}
      </span>
      <input
        value={slide.title}
        onChange={(e) => onChange({ ...slide, title: e.target.value })}
        placeholder="Título"
        className="w-full text-sm text-black font-light border border-[#E5E5E5] rounded-lg px-3 py-2 focus:outline-none focus:border-[#FC0100] transition"
        style={{ fontFamily: "'Imbue', serif" }}
      />
      {(slide.subtitle !== undefined || slide.type === "hook") && (
        <textarea
          value={slide.subtitle ?? ""}
          onChange={(e) => onChange({ ...slide, subtitle: e.target.value || undefined })}
          placeholder="Subtítulo (opcional)"
          rows={2}
          className="w-full text-sm text-[#555] font-light border border-[#E5E5E5] rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-[#FC0100] transition leading-relaxed"
        />
      )}
      {(slide.body !== undefined || slide.type !== "hook") && (
        <textarea
          value={slide.body ?? ""}
          onChange={(e) => onChange({ ...slide, body: e.target.value || undefined })}
          placeholder="Corpo (opcional)"
          rows={3}
          className="w-full text-sm text-[#777] font-light border border-[#E5E5E5] rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-[#FC0100] transition leading-relaxed"
        />
      )}
    </div>
  );
}

// ── IdeaCard ──────────────────────────────────────────────────────────────────

export function IdeaCard({ idea, onApprove, onReject, isSaving }: IdeaCardProps) {
  const isRejected = idea.status === "rejected";
  const isApproved = idea.status === "approved";

  // Persistent edits — null means "use original"
  const [draft, setDraft] = useState<IdeaEdits | null>(null);

  // Modal state
  const [expanded, setExpanded]   = useState(false);
  const [editMode, setEditMode]   = useState(false);

  // Working copy inside edit mode — discarded on Cancel
  const [workingSlides, setWorkingSlides]   = useState<CarouselSlide[]>([]);
  const [workingCaption, setWorkingCaption] = useState("");
  const [workingVisual, setWorkingVisual]   = useState("");
  const [workingLogo, setWorkingLogo]       = useState("");

  // Scroll fade
  const [showFade, setShowFade] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    setShowFade(el.scrollTop + el.clientHeight < el.scrollHeight - 8);
  }

  // Current content = draft if edited, else original
  const current: IdeaEdits = draft ?? {
    slides: idea.slides,
    caption: idea.caption,
    visualDescription: idea.visualDescription,
    logoUsage: idea.logoUsage,
  };

  function enterEditMode() {
    setWorkingSlides(current.slides.map((s) => ({ ...s })));
    setWorkingCaption(current.caption);
    setWorkingVisual(current.visualDescription);
    setWorkingLogo(current.logoUsage);
    setEditMode(true);
  }

  function saveEdits() {
    setDraft({
      slides: workingSlides,
      caption: workingCaption,
      visualDescription: workingVisual,
      logoUsage: workingLogo,
    });
    setEditMode(false);
  }

  function cancelEdits() {
    setEditMode(false);
  }

  function handleApprove() {
    onApprove(draft ?? undefined);
  }

  const hasEdits = draft !== null;

  return (
    <>
      {/* ── Card ──────────────────────────────────────────────────────────── */}
      <div className={`bg-white flex flex-col transition-all duration-200 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.06)]${isRejected ? " opacity-30" : ""}`}>
        {/* Header */}
        <div className={`flex items-center justify-between gap-2 px-5 py-3 border-b ${isApproved ? "border-[#FC0100] bg-[#FC0100]" : "border-[#E5E5E5]"}`}>
          <p
            className={`text-xs truncate flex-1 font-light ${isApproved ? "text-white/60" : "text-[#A0A0A0]"}`}
            title={idea.userIdea}
          >
            {idea.userIdea}
          </p>
          <div className="flex items-center gap-2 shrink-0">
            {hasEdits && !isApproved && (
              <span className="text-[9px] font-medium uppercase tracking-widest text-[#FC0100] bg-[#FC0100]/8 px-1.5 py-0.5 rounded">
                editado
              </span>
            )}
            {isApproved && (
              <span className="text-[10px] font-medium uppercase tracking-widest text-white/80">Aprovado</span>
            )}
            {isRejected && (
              <span className="text-[10px] font-medium uppercase tracking-widest text-[#A0A0A0]">Rejeitado</span>
            )}
          </div>
        </div>

        {/* Slides (read-only preview) with fade */}
        <div className="relative flex-1">
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="px-5 py-1 overflow-y-auto max-h-[420px]"
          >
            {current.slides.map((slide, i) => (
              <SlideRow key={i} slide={slide} index={i} />
            ))}
          </div>

          <div
            aria-hidden
            className={`pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent transition-opacity duration-200 ${showFade ? "opacity-100" : "opacity-0"}`}
          />

          <div className="absolute bottom-1.5 right-3">
            <button
              onClick={() => { setExpanded(true); setEditMode(false); }}
              className="flex items-center gap-1 text-[10px] text-[#C0C0C0] hover:text-[#474747] transition font-light"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
              </svg>
              {hasEdits ? "Ver edições" : "Expandir"}
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 py-4 border-t border-[#F0F0F0]">
          {idea.status === "pending" && (
            <div className="flex gap-2">
              <button
                onClick={handleApprove}
                disabled={isSaving}
                className="flex-1 py-2.5 bg-[#FC0100] text-white text-sm font-medium hover:bg-[#D40000] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 rounded-xl"
              >
                {isSaving ? (
                  <>
                    <div className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin" />
                    Salvando…
                  </>
                ) : "Aprovar"}
              </button>
              <button
                onClick={onReject}
                disabled={isSaving}
                className="px-3 py-2.5 border border-[#E5E5E5] text-[#A0A0A0] text-sm hover:border-[#FC0100] hover:text-[#FC0100] transition-all duration-200 disabled:opacity-40 rounded-xl"
                title="Rejeitar"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          {isRejected && (
            <button
              onClick={handleApprove}
              className="text-xs text-[#A0A0A0] hover:text-black transition font-light underline underline-offset-2"
            >
              Restaurar
            </button>
          )}
        </div>
      </div>

      {/* ── Modal ─────────────────────────────────────────────────────────── */}
      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
          onClick={() => { if (!editMode) setExpanded(false); }}
        >
          <div
            className="bg-white rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.18)] w-full max-w-lg max-h-[88vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5E5] shrink-0">
              <p className="text-xs text-[#A0A0A0] font-light truncate flex-1 pr-4">{idea.userIdea}</p>
              <div className="flex items-center gap-2 shrink-0">
                {!editMode ? (
                  <button
                    onClick={enterEditMode}
                    className="flex items-center gap-1.5 text-xs text-[#474747] font-medium hover:text-[#FC0100] transition px-2.5 py-1.5 border border-[#E5E5E5] rounded-lg hover:border-[#FC0100]"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" />
                    </svg>
                    Editar
                  </button>
                ) : (
                  <span className="text-xs text-[#FC0100] font-medium">Editando</span>
                )}
                {!editMode && (
                  <button
                    onClick={() => setExpanded(false)}
                    className="w-7 h-7 flex items-center justify-center text-[#C0C0C0] hover:text-black transition rounded-lg hover:bg-[#F5F5F5]"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Modal body */}
            <div className="overflow-y-auto flex-1 px-6 py-2">
              {editMode ? (
                /* ── Edit mode ─────────────────────────────────────────── */
                <div className="space-y-1">
                  <p className="text-[9px] font-medium text-[#A0A0A0] uppercase tracking-widest pt-3 pb-1">Slides</p>
                  {workingSlides.map((slide, i) => (
                    <SlideEditor
                      key={i}
                      slide={slide}
                      index={i}
                      onChange={(updated) => {
                        const next = [...workingSlides];
                        next[i] = updated;
                        setWorkingSlides(next);
                      }}
                    />
                  ))}

                  <div className="pt-4 pb-2 space-y-3">
                    <p className="text-[9px] font-medium text-[#A0A0A0] uppercase tracking-widest">Legenda</p>
                    <textarea
                      value={workingCaption}
                      onChange={(e) => setWorkingCaption(e.target.value)}
                      rows={4}
                      placeholder="Legenda do Instagram"
                      className="w-full text-sm text-[#474747] font-light border border-[#E5E5E5] rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-[#FC0100] transition leading-relaxed"
                    />
                    <p className="text-[9px] font-medium text-[#A0A0A0] uppercase tracking-widest">Descrição visual</p>
                    <textarea
                      value={workingVisual}
                      onChange={(e) => setWorkingVisual(e.target.value)}
                      rows={3}
                      placeholder="Direção visual para o designer"
                      className="w-full text-sm text-[#474747] font-light border border-[#E5E5E5] rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-[#FC0100] transition leading-relaxed"
                    />
                    <p className="text-[9px] font-medium text-[#A0A0A0] uppercase tracking-widest">Uso do logo</p>
                    <input
                      value={workingLogo}
                      onChange={(e) => setWorkingLogo(e.target.value)}
                      placeholder="Instrução de posicionamento do logo"
                      className="w-full text-sm text-[#474747] font-light border border-[#E5E5E5] rounded-lg px-3 py-2 focus:outline-none focus:border-[#FC0100] transition"
                    />
                  </div>
                </div>
              ) : (
                /* ── Read mode ─────────────────────────────────────────── */
                <div>
                  {current.slides.map((slide, i) => (
                    <SlideRow key={i} slide={slide} index={i} />
                  ))}

                  {(current.caption || current.visualDescription || current.logoUsage) && (
                    <div className="mt-4 pt-4 border-t border-[#F0F0F0] space-y-4 pb-2">
                      {current.caption && (
                        <div>
                          <p className="text-[9px] font-medium text-[#A0A0A0] uppercase tracking-widest mb-1.5">Legenda</p>
                          <p className="text-sm text-[#474747] font-light leading-relaxed whitespace-pre-wrap">{current.caption}</p>
                        </div>
                      )}
                      {current.visualDescription && (
                        <div>
                          <p className="text-[9px] font-medium text-[#A0A0A0] uppercase tracking-widest mb-1.5">Descrição visual</p>
                          <p className="text-sm text-[#777] font-light leading-relaxed">{current.visualDescription}</p>
                        </div>
                      )}
                      {current.logoUsage && (
                        <div>
                          <p className="text-[9px] font-medium text-[#A0A0A0] uppercase tracking-widest mb-1.5">Uso do logo</p>
                          <p className="text-sm text-[#777] font-light leading-relaxed">{current.logoUsage}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 border-t border-[#E5E5E5] shrink-0">
              {editMode ? (
                <div className="flex gap-2">
                  <button
                    onClick={saveEdits}
                    className="flex-1 py-2.5 bg-black text-white text-sm font-medium hover:bg-[#222] transition rounded-xl"
                  >
                    Salvar alterações
                  </button>
                  <button
                    onClick={cancelEdits}
                    className="px-4 py-2.5 border border-[#E5E5E5] text-sm text-[#A0A0A0] hover:text-black hover:border-black transition rounded-xl"
                  >
                    Cancelar
                  </button>
                </div>
              ) : idea.status === "pending" ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => { setExpanded(false); handleApprove(); }}
                    disabled={isSaving}
                    className="flex-1 py-2.5 bg-[#FC0100] text-white text-sm font-medium hover:bg-[#D40000] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl"
                  >
                    Aprovar{hasEdits ? " versão editada" : ""}
                  </button>
                  <button
                    onClick={() => { setExpanded(false); onReject(); }}
                    disabled={isSaving}
                    className="px-3 py-2.5 border border-[#E5E5E5] text-[#A0A0A0] text-sm hover:border-[#FC0100] hover:text-[#FC0100] transition-all duration-200 disabled:opacity-40 rounded-xl"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
