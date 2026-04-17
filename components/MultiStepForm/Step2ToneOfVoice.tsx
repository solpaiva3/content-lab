"use client";

interface FormData {
  toneOfVoice: string;
  personality: string;
  pillars: string;
  toneNotes: string;
}

interface Step2ToneOfVoiceProps {
  data: FormData;
  onChange: (data: Partial<FormData>) => void;
  errors: Partial<Record<keyof FormData, string>>;
}

function TextareaField({
  label,
  required,
  hint,
  value,
  placeholder,
  rows,
  onChange,
  error,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  value: string;
  placeholder: string;
  rows?: number;
  onChange: (val: string) => void;
  error?: string;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#474747] uppercase tracking-widest mb-2">
        {label}
        {required && <span className="text-[#FC0100] ml-1">*</span>}
        {hint && <span className="text-[#A0A0A0] normal-case font-light ml-1">{hint}</span>}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows ?? 3}
        className={`w-full px-4 py-3 border bg-white text-black placeholder-[#C0C0C0] text-sm font-light focus:outline-none focus:ring-1 focus:ring-[#FC0100] transition resize-none ${
          error ? "border-[#FC0100]" : "border-[#E5E5E5]"
        }`}
      />
      {error && <p className="mt-1 text-xs text-[#FC0100]">{error}</p>}
    </div>
  );
}

export function Step2ToneOfVoice({ data, onChange, errors }: Step2ToneOfVoiceProps) {
  return (
    <div className="space-y-8">
      <div>
        <h2
          className="text-2xl text-black tracking-[-0.04em]"
          style={{ fontFamily: "'Imbue', serif", fontWeight: 300 }}
        >
          Tom de voz
        </h2>
        <p className="mt-1 text-sm text-[#A0A0A0] font-light">
          Descreva a voz da marca, sua personalidade e foco de conteúdo.
        </p>
      </div>

      <TextareaField
        label="Tom de voz"
        required
        value={data.toneOfVoice}
        placeholder="ex.: Caloroso e próximo, mas nunca informal. Direto sem ser frio. Sempre encorajador, nunca insistente."
        rows={3}
        onChange={(val) => onChange({ toneOfVoice: val })}
        error={errors.toneOfVoice}
      />

      <TextareaField
        label="Personalidade da marca"
        required
        value={data.personality}
        placeholder="ex.: Confiante, acessível e com um toque de leveza. A marca parece um amigo experiente — não um vendedor."
        rows={3}
        onChange={(val) => onChange({ personality: val })}
        error={errors.personality}
      />

      <TextareaField
        label="Pilares de conteúdo"
        required
        value={data.pillars}
        placeholder="ex.: Educação sobre produtos, bastidores, histórias de clientes, sustentabilidade, receitas sazonais."
        rows={3}
        onChange={(val) => onChange({ pillars: val })}
        error={errors.pillars}
      />

      <TextareaField
        label="Contexto geral da marca"
        hint="(opcional)"
        value={data.toneNotes}
        placeholder="Qualquer coisa que a IA deva saber — palavras a evitar, temas recorrentes, contexto de campanha, notas sobre o público…"
        rows={4}
        onChange={(val) => onChange({ toneNotes: val })}
      />
    </div>
  );
}
