"use client";

import { useState, useRef } from "react";
import { Idea, CarouselSlide, SlideType } from "@/types";

interface IdeaCardProps {
  idea: Idea;
  onApprove: () => void;
  onReject: () => void;
  isSaving: boolean;
}

const SLIDE_LABELS: Record<SlideType, string> = {
  hook: "Hook",
  context: "Context",
  problem: "Problem",
  insight: "Insight",
  cta: "CTA",
};

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
          <p className="text-sm text-[#555] font-light leading-relaxed">
            {slide.subtitle}
          </p>
        )}
        {slide.body && (
          <p className="text-sm text-[#777] font-light leading-relaxed">
            {slide.body}
          </p>
        )}
      </div>
    </div>
  );
}

export function IdeaCard({ idea, onApprove, onReject, isSaving }: IdeaCardProps) {
  const isRejected = idea.status === "rejected";
  const isApproved = idea.status === "approved";

  const [showFade, setShowFade]   = useState(true);
  const [expanded, setExpanded]   = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 8;
    setShowFade(!atBottom);
  }

  return (
    <>
      <div className={`bg-white flex flex-col transition-all duration-200 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgba(0,0,0,0.06)]${isRejected ? " opacity-30" : ""}`}>
        {/* Brief source */}
        <div className={`flex items-center justify-between gap-2 px-5 py-3 border-b ${isApproved ? "border-[#FC0100] bg-[#FC0100]" : "border-[#E5E5E5]"}`}>
          <p
            className={`text-xs truncate flex-1 font-light ${isApproved ? "text-white/60" : "text-[#A0A0A0]"}`}
            title={idea.userIdea}
          >
            {idea.userIdea}
          </p>
          {isApproved && (
            <span className="shrink-0 text-[10px] font-medium uppercase tracking-widest text-white/80">
              Approved
            </span>
          )}
          {isRejected && (
            <span className="shrink-0 text-[10px] font-medium uppercase tracking-widest text-[#A0A0A0]">
              Rejected
            </span>
          )}
        </div>

        {/* Slides — scrollable with bottom fade */}
        <div className="relative flex-1">
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="px-5 py-1 overflow-y-auto max-h-[420px]"
          >
            {idea.slides.map((slide, i) => (
              <SlideRow key={i} slide={slide} index={i} />
            ))}
          </div>

          {/* Bottom fade — hidden once scrolled to end */}
          <div
            aria-hidden
            className={`pointer-events-none absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent transition-opacity duration-200 ${showFade ? "opacity-100" : "opacity-0"}`}
          />

          {/* Expand button */}
          <div className="absolute bottom-1.5 right-3">
            <button
              onClick={() => setExpanded(true)}
              className="flex items-center gap-1 text-[10px] text-[#C0C0C0] hover:text-[#474747] transition font-light"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5" />
              </svg>
              Expand
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 py-4 border-t border-[#F0F0F0]">
          {idea.status === "pending" && (
            <div className="flex gap-2">
              <button
                onClick={onApprove}
                disabled={isSaving}
                className="flex-1 py-2.5 bg-[#FC0100] text-white text-sm font-medium hover:bg-[#D40000] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 rounded-xl"
              >
                {isSaving ? (
                  <>
                    <div className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin" />
                    Saving…
                  </>
                ) : "Approve"}
              </button>
              <button
                onClick={onReject}
                disabled={isSaving}
                className="px-3 py-2.5 border border-[#E5E5E5] text-[#A0A0A0] text-sm hover:border-[#FC0100] hover:text-[#FC0100] transition-all duration-200 disabled:opacity-40 rounded-xl"
                title="Reject"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          {isRejected && (
            <button
              onClick={onApprove}
              className="text-xs text-[#A0A0A0] hover:text-black transition font-light underline underline-offset-2"
            >
              Revert
            </button>
          )}
        </div>
      </div>

      {/* Expanded reading modal */}
      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm"
          onClick={() => setExpanded(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.18)] w-full max-w-lg max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5E5] shrink-0">
              <p className="text-xs text-[#A0A0A0] font-light truncate flex-1 pr-4">{idea.userIdea}</p>
              <button
                onClick={() => setExpanded(false)}
                className="shrink-0 w-7 h-7 flex items-center justify-center text-[#C0C0C0] hover:text-black transition rounded-lg hover:bg-[#F5F5F5]"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal slides — full scroll, no cap */}
            <div className="overflow-y-auto px-6 py-2 flex-1">
              {idea.slides.map((slide, i) => (
                <SlideRow key={i} slide={slide} index={i} />
              ))}
            </div>

            {/* Modal actions */}
            {idea.status === "pending" && (
              <div className="px-6 py-4 border-t border-[#E5E5E5] shrink-0 flex gap-2">
                <button
                  onClick={() => { setExpanded(false); onApprove(); }}
                  disabled={isSaving}
                  className="flex-1 py-2.5 bg-[#FC0100] text-white text-sm font-medium hover:bg-[#D40000] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl"
                >
                  Approve
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
            )}
          </div>
        </div>
      )}
    </>
  );
}
