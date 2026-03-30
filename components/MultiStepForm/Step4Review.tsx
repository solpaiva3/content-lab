"use client";

import Image from "next/image";

interface ReviewData {
  name: string;
  sector: string;
  personality: string[];
  pillars: string[];
  toneNotes: string;
  logoUrl: string;
  colors: string[];
  fonts: { primary: string; secondary: string };
}

export function Step4Review({ data }: { data: ReviewData }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Review</h2>
        <p className="mt-1 text-sm text-gray-500">Everything looks good? Save the client.</p>
      </div>

      <div className="space-y-4">
        <Section title="Identity">
          <Row label="Client name" value={data.name} />
          <Row label="Industry / Niche" value={data.sector} />
        </Section>

        <Section title="Tone of voice">
          <Row label="Personality" value={data.personality.join(", ") || "—"} />
          <Row label="Content pillars" value={data.pillars.join(", ") || "—"} />
          {data.toneNotes && <Row label="Tone notes" value={data.toneNotes} />}
        </Section>

        <Section title="Visual">
          {data.logoUrl && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 w-24 shrink-0">Logo</span>
              <Image src={data.logoUrl} alt="Logo" width={64} height={40} className="object-contain h-10" />
            </div>
          )}
          {data.colors.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500 w-24 shrink-0">Colors</span>
              <div className="flex gap-1">
                {data.colors.map((c, i) => (
                  <div
                    key={i}
                    className="w-6 h-6 rounded border border-gray-200"
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
            </div>
          )}
          {data.fonts.primary && <Row label="Primary font" value={data.fonts.primary} />}
          {data.fonts.secondary && <Row label="Secondary font" value={data.fonts.secondary} />}
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</h3>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="text-sm text-gray-500 w-32 shrink-0">{label}</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  );
}
