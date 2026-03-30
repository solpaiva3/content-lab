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
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Client identity</h2>
        <p className="mt-1 text-sm text-gray-500">Basic information about the client.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Client name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="e.g. Bloom Studio"
            className={`w-full px-4 py-2.5 rounded-xl border bg-white text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition ${
              errors.name ? "border-red-400" : "border-gray-200"
            }`}
          />
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Industry / Niche <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={data.sector}
            onChange={(e) => onChange({ sector: e.target.value })}
            placeholder="e.g. Sustainable fashion, Artisan bakery, Tech startup..."
            className={`w-full px-4 py-2.5 rounded-xl border bg-white text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition ${
              errors.sector ? "border-red-400" : "border-gray-200"
            }`}
          />
          {errors.sector && <p className="mt-1 text-xs text-red-500">{errors.sector}</p>}
        </div>
      </div>
    </div>
  );
}
