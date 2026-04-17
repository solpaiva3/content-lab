"use client";

import { TEMPLATES, type CarouselTemplate } from "@/lib/ai/templates";

interface TemplateSelectorProps {
  selected: string;
  onChange: (id: string) => void;
}

function SlideTypePip({ type }: { type: string }) {
  const colors: Record<string, string> = {
    hook: "bg-black",
    context: "bg-[#A0A0A0]",
    problem: "bg-[#474747]",
    insight: "bg-[#FC0100]",
    cta: "bg-[#474747]",
  };
  return (
    <span
      className={`inline-block w-1.5 h-1.5 rounded-full ${colors[type] ?? "bg-[#C0C0C0]"}`}
      title={type}
    />
  );
}

function TemplateCard({
  template,
  selected,
  onClick,
}: {
  template: CarouselTemplate;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left w-full border p-4 transition-all duration-200 flex flex-col gap-3 rounded-xl ${
        selected
          ? "border-black shadow-[0_4px_16px_rgba(0,0,0,0.10)]"
          : "border-[#E5E5E5] hover:border-[#C0C0C0] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-black tracking-tight leading-tight">{template.name}</p>
          <p className="text-xs text-[#888] font-light mt-1 leading-snug">{template.description}</p>
        </div>
        <span className="shrink-0 text-[10px] text-[#A0A0A0] font-light whitespace-nowrap">
          {template.slides.length} slides
        </span>
      </div>

      {/* Slide type pips */}
      <div className="flex items-center gap-1.5">
        {template.slides.map((slide, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <SlideTypePip type={slide.type} />
            <span className="text-[8px] text-[#C0C0C0] font-light uppercase tracking-wider leading-none">
              {slide.label}
            </span>
          </div>
        ))}
      </div>

      {selected && (
        <p className="text-[10px] text-[#666] font-light leading-snug border-t border-[#E5E5E5] pt-2">
          {template.narrativeGoal}
        </p>
      )}
    </button>
  );
}

export function TemplateSelector({ selected, onChange }: TemplateSelectorProps) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-medium text-[#A0A0A0] uppercase tracking-widest">
        Modelo de carrossel
      </p>
      <div className="grid grid-cols-3 gap-3">
        {TEMPLATES.map((t) => (
          <TemplateCard
            key={t.id}
            template={t}
            selected={selected === t.id}
            onClick={() => onChange(t.id)}
          />
        ))}
      </div>
    </div>
  );
}
