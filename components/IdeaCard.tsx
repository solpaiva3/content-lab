"use client";

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
    <div className="flex gap-3 py-3 border-b border-[#F0F0F0] last:border-0">
      <div className="shrink-0 w-16 pt-0.5">
        <span className="text-[9px] font-medium text-[#A0A0A0] uppercase tracking-widest">
          {index + 1}. {SLIDE_LABELS[slide.type] ?? slide.type}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p
          className="text-sm text-black tracking-[-0.02em] leading-tight"
          style={{ fontFamily: "'Imbue', serif", fontWeight: 300 }}
        >
          {slide.title}
        </p>
        {(slide.subtitle || slide.body) && (
          <p className="mt-0.5 text-xs text-[#777] font-light leading-relaxed line-clamp-2">
            {slide.subtitle ?? slide.body}
          </p>
        )}
      </div>
    </div>
  );
}

export function IdeaCard({ idea, onApprove, onReject, isSaving }: IdeaCardProps) {
  const isRejected = idea.status === "rejected";
  const isApproved = idea.status === "approved";

  return (
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

      {/* Slides */}
      <div className="px-5 py-1 flex-1">
        {idea.slides.map((slide, i) => (
          <SlideRow key={i} slide={slide} index={i} />
        ))}
      </div>

      {/* Actions */}
      <div className="px-5 py-4">
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
  );
}
