"use client";

interface FormData {
  name: string;
  sector: string;
}

interface Step1IdentityProps {
  data: FormData;
  onChange: (data: Partial<FormData>) => void;
  errors: Partial<Record<keyof FormData, string>>;
}

export function Step1Identity({ data, onChange, errors }: Step1IdentityProps) {
  return (
    <div className="space-y-8">
      <div>
        <h2
          className="text-2xl text-black tracking-[-0.04em]"
          style={{ fontFamily: "'Imbue', serif", fontWeight: 300 }}
        >
          Client identity
        </h2>
        <p className="mt-1 text-sm text-[#A0A0A0] font-light">Basic information about the client.</p>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-xs font-medium text-[#474747] uppercase tracking-widest mb-2">
            Client name <span className="text-[#FC0100]">*</span>
          </label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="e.g. Bloom Studio"
            className={`w-full px-4 py-3 border bg-white text-black placeholder-[#C0C0C0] text-sm font-light focus:outline-none focus:ring-1 focus:ring-[#FC0100] transition ${
              errors.name ? "border-[#FC0100]" : "border-[#E5E5E5]"
            }`}
          />
          {errors.name && <p className="mt-1 text-xs text-[#FC0100]">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-xs font-medium text-[#474747] uppercase tracking-widest mb-2">
            Industry / Niche <span className="text-[#FC0100]">*</span>
          </label>
          <input
            type="text"
            value={data.sector}
            onChange={(e) => onChange({ sector: e.target.value })}
            placeholder="e.g. Sustainable fashion, Artisan bakery, Tech startup…"
            className={`w-full px-4 py-3 border bg-white text-black placeholder-[#C0C0C0] text-sm font-light focus:outline-none focus:ring-1 focus:ring-[#FC0100] transition ${
              errors.sector ? "border-[#FC0100]" : "border-[#E5E5E5]"
            }`}
          />
          {errors.sector && <p className="mt-1 text-xs text-[#FC0100]">{errors.sector}</p>}
        </div>
      </div>
    </div>
  );
}
