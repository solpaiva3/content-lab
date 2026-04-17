"use client";


interface ReviewData {
  name: string;
  sector: string;
  toneOfVoice: string;
  personality: string;
  pillars: string;
  toneNotes: string;
  logoUrl: string;
  colors: string[];
  fonts: { primary: string; secondary: string };
  fontFiles: { primary?: string; secondary?: string };
}

export function Step4Review({ data }: { data: ReviewData }) {
  return (
    <div className="space-y-8">
      <div>
        <h2
          className="text-2xl text-black tracking-[-0.04em]"
          style={{ fontFamily: "'Imbue', serif", fontWeight: 300 }}
        >
          Revisão
        </h2>
        <p className="mt-1 text-sm text-[#A0A0A0] font-light">Tudo certo? Salve o cliente.</p>
      </div>

      <div className="space-y-3">
        <Section title="Identidade">
          <Row label="Nome do cliente" value={data.name} />
          <Row label="Setor / Nicho" value={data.sector} />
        </Section>

        <Section title="Tom de voz">
          {data.toneOfVoice && <Row label="Tom de voz" value={data.toneOfVoice} />}
          {data.personality && <Row label="Personalidade da marca" value={data.personality} />}
          {data.pillars && <Row label="Pilares de conteúdo" value={data.pillars} />}
          {data.toneNotes && <Row label="Contexto geral" value={data.toneNotes} />}
        </Section>

        <Section title="Visual">
          {data.logoUrl && (
            <div className="flex gap-4 py-2">
              <span className="text-xs text-[#A0A0A0] w-32 shrink-0 pt-0.5 uppercase tracking-widest">Logo</span>
              <img src={data.logoUrl} alt="Logo" className="object-contain h-10 max-w-[64px]" />
            </div>
          )}
          {data.colors.length > 0 && (
            <div className="flex items-center gap-4 py-2">
              <span className="text-xs text-[#A0A0A0] w-32 shrink-0 uppercase tracking-widest">Cores</span>
              <div className="flex gap-1">
                {data.colors.map((c, i) => (
                  <div
                    key={i}
                    className="w-5 h-5 border border-[#E5E5E5]"
                    style={{ backgroundColor: c }}
                    title={c}
                  />
                ))}
              </div>
            </div>
          )}
          {(data.fonts.primary || data.fonts.secondary) && (
            <div className="flex items-start gap-4 py-2">
              <span className="text-xs text-[#A0A0A0] w-32 shrink-0 pt-0.5 uppercase tracking-widest">Tipografia</span>
              <div className="space-y-1">
                {data.fonts.primary && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-black font-light">{data.fonts.primary}</span>
                    <span className="text-xs text-[#A0A0A0]">primária</span>
                    {data.fontFiles?.primary && (
                      <span className="text-xs text-[#474747] border border-[#E5E5E5] px-1.5 py-0.5">arquivo</span>
                    )}
                  </div>
                )}
                {data.fonts.secondary && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-black font-light">{data.fonts.secondary}</span>
                    <span className="text-xs text-[#A0A0A0]">secundária</span>
                    {data.fontFiles?.secondary && (
                      <span className="text-xs text-[#474747] border border-[#E5E5E5] px-1.5 py-0.5">arquivo</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white p-5 space-y-2">
      <h3 className="text-[10px] font-medium text-[#A0A0A0] uppercase tracking-widest mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4 py-1">
      <span className="text-xs text-[#A0A0A0] w-32 shrink-0 pt-0.5 uppercase tracking-widest leading-relaxed">{label}</span>
      <span className="text-sm text-black font-light break-words leading-relaxed">{value}</span>
    </div>
  );
}
