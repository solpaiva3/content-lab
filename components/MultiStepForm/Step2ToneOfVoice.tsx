"use client";

const PERSONALITY_OPTIONS = [
  "Sophisticated",
  "Welcoming",
  "Laid-back",
  "Irreverent",
  "Inspiring",
  "Technical",
  "Minimalist",
  "Playful",
];

const PILLAR_OPTIONS = [
  "Product",
  "Behind the scenes",
  "Lifestyle",
  "Educational",
  "Recipes",
  "Sustainability",
  "Culture",
];

interface FormData {
  personality: string[];
  pillars: string[];
  toneNotes: string;
}

interface Step2ToneOfVoiceProps {
  data: FormData;
  onChange: (data: Partial<FormData>) => void;
  errors: Partial<Record<keyof FormData, string>>;
}

function PillSelector({
  options,
  selected,
  onToggle,
  error,
}: {
  options: string[];
  selected: string[];
  onToggle: (val: string) => void;
  error?: string;
}) {
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const isSelected = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onToggle(opt)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                isSelected
                  ? "bg-violet-600 text-white border-violet-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-violet-400 hover:text-violet-600"
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {error && <p className="mt-1.5 text-xs text-red-500">{error}</p>}
    </div>
  );
}

export function Step2ToneOfVoice({ data, onChange, errors }: Step2ToneOfVoiceProps) {
  const togglePersonality = (val: string) => {
    const updated = data.personality.includes(val)
      ? data.personality.filter((p) => p !== val)
      : [...data.personality, val];
    onChange({ personality: updated });
  };

  const togglePillar = (val: string) => {
    const updated = data.pillars.includes(val)
      ? data.pillars.filter((p) => p !== val)
      : [...data.pillars, val];
    onChange({ pillars: updated });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Tone of voice</h2>
        <p className="mt-1 text-sm text-gray-500">Define the brand personality and content pillars.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Brand personality <span className="text-red-500">*</span>
          <span className="text-gray-400 font-normal ml-1">(select at least one)</span>
        </label>
        <PillSelector
          options={PERSONALITY_OPTIONS}
          selected={data.personality}
          onToggle={togglePersonality}
          error={errors.personality}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Content pillars <span className="text-red-500">*</span>
          <span className="text-gray-400 font-normal ml-1">(select at least one)</span>
        </label>
        <PillSelector
          options={PILLAR_OPTIONS}
          selected={data.pillars}
          onToggle={togglePillar}
          error={errors.pillars}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Additional tone instructions
          <span className="text-gray-400 font-normal ml-1">(optional)</span>
        </label>
        <textarea
          value={data.toneNotes}
          onChange={(e) => onChange({ toneNotes: e.target.value })}
          placeholder="e.g. Always use inclusive language. Avoid technical jargon. Words we love: cozy, crafted, real..."
          rows={3}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition resize-none"
        />
      </div>
    </div>
  );
}
