"use client";

import { useState, useRef } from "react";
import Image from "next/image";

const FONT_OPTIONS = [
  "Playfair Display",
  "DM Sans",
  "Sora",
  "Instrument Serif",
  "Plus Jakarta Sans",
  "Fraunces",
];

const FONT_MAP: Record<string, string> = {
  "Playfair Display": "'Playfair Display', serif",
  "DM Sans": "'DM Sans', sans-serif",
  "Sora": "'Sora', sans-serif",
  "Instrument Serif": "'Instrument Serif', serif",
  "Plus Jakarta Sans": "'Plus Jakarta Sans', sans-serif",
  "Fraunces": "'Fraunces', serif",
};

export interface VisualData {
  logoUrl: string;
  logoVariants: { light?: string; dark?: string };
  colors: string[];
  fonts: { primary: string; secondary: string };
}

interface Step3VisualProps {
  data: VisualData;
  onChange: (data: Partial<VisualData>) => void;
}

function LogoUploader({
  label,
  variant,
  currentUrl,
  onUploaded,
}: {
  label: string;
  variant: string;
  currentUrl: string;
  onUploaded: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [bgDark, setBgDark] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("variant", variant);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const json = await res.json();
    setUploading(false);
    if (json.url) onUploaded(json.url);
  }

  return (
    <div className="space-y-2">
      <span className="text-sm text-gray-600 font-medium">{label}</span>
      <div
        className={`relative rounded-xl border-2 border-dashed flex items-center justify-center h-24 cursor-pointer transition ${
          currentUrl ? "border-violet-300 bg-violet-50" : "border-gray-200 hover:border-violet-300"
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files[0];
          if (f) handleFile(f);
        }}
      >
        {currentUrl ? (
          <div
            className={`relative w-full h-full rounded-xl flex items-center justify-center ${bgDark ? "bg-gray-900" : "bg-white"}`}
          >
            <Image src={currentUrl} alt={label} width={80} height={56} className="object-contain max-h-14" />
          </div>
        ) : uploading ? (
          <div className="flex flex-col items-center gap-1 text-violet-500">
            <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs">Uploading...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 text-gray-400">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs">PNG, SVG or JPG • max 2MB</span>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept="image/png,image/svg+xml,image/jpeg"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
      </div>
      {currentUrl && (
        <button
          type="button"
          onClick={() => setBgDark(!bgDark)}
          className="text-xs text-gray-500 hover:text-violet-600 transition"
        >
          Toggle {bgDark ? "light" : "dark"} background
        </button>
      )}
    </div>
  );
}

function ColorSwatch({
  color,
  index,
  onChange,
  onRemove,
}: {
  color: string;
  index: number;
  onChange: (hex: string) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer relative overflow-hidden"
        style={{ backgroundColor: color }}
      >
        <input
          type="color"
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
      </div>
      <input
        type="text"
        value={color}
        onChange={(e) => onChange(e.target.value)}
        maxLength={7}
        className="w-16 text-center text-xs border border-gray-200 rounded px-1 py-0.5 font-mono focus:outline-none focus:ring-1 focus:ring-violet-500"
      />
      <button
        type="button"
        onClick={onRemove}
        className="text-gray-300 hover:text-red-400 text-xs transition"
        title={`Remove color ${index + 1}`}
      >
        ×
      </button>
    </div>
  );
}

export function Step3Visual({ data, onChange }: Step3VisualProps) {
  const addColor = () => {
    if (data.colors.length < 6) {
      onChange({ colors: [...data.colors, "#CCCCCC"] });
    }
  };

  const updateColor = (index: number, hex: string) => {
    const updated = [...data.colors];
    updated[index] = hex;
    onChange({ colors: updated });
  };

  const removeColor = (index: number) => {
    onChange({ colors: data.colors.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Visual identity</h2>
        <p className="mt-1 text-sm text-gray-500">Logo, color palette and typography.</p>
      </div>

      {/* Logo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Logo</label>
        <div className="grid grid-cols-3 gap-4">
          <LogoUploader
            label="Main"
            variant="main"
            currentUrl={data.logoUrl}
            onUploaded={(url) => onChange({ logoUrl: url })}
          />
          <LogoUploader
            label="Light background"
            variant="light"
            currentUrl={data.logoVariants.light || ""}
            onUploaded={(url) => onChange({ logoVariants: { ...data.logoVariants, light: url } })}
          />
          <LogoUploader
            label="Dark background"
            variant="dark"
            currentUrl={data.logoVariants.dark || ""}
            onUploaded={(url) => onChange({ logoVariants: { ...data.logoVariants, dark: url } })}
          />
        </div>
      </div>

      {/* Colors */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Color palette
          <span className="text-gray-400 font-normal ml-1">(up to 6)</span>
        </label>
        <div className="flex flex-wrap items-end gap-3">
          {data.colors.map((color, i) => (
            <ColorSwatch
              key={i}
              color={color}
              index={i}
              onChange={(hex) => updateColor(i, hex)}
              onRemove={() => removeColor(i)}
            />
          ))}
          {data.colors.length < 6 && (
            <button
              type="button"
              onClick={addColor}
              className="w-10 h-10 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-violet-400 hover:text-violet-500 transition"
            >
              +
            </button>
          )}
        </div>
        {data.colors.length > 0 && (
          <div className="mt-3 flex gap-0 rounded-lg overflow-hidden h-6 w-full max-w-sm">
            {data.colors.map((color, i) => (
              <div key={i} className="flex-1" style={{ backgroundColor: color }} />
            ))}
          </div>
        )}
      </div>

      {/* Typography */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Typography</label>
        <div className="grid grid-cols-2 gap-4">
          {(["primary", "secondary"] as const).map((role) => (
            <div key={role}>
              <label className="block text-xs text-gray-500 mb-2 capitalize">{role} font</label>
              <div className="space-y-1">
                {FONT_OPTIONS.map((font) => {
                  const isSelected = data.fonts[role] === font;
                  return (
                    <button
                      key={font}
                      type="button"
                      onClick={() => onChange({ fonts: { ...data.fonts, [role]: font } })}
                      className={`w-full text-left px-3 py-2 rounded-lg border text-sm transition ${
                        isSelected
                          ? "border-violet-500 bg-violet-50 text-violet-700"
                          : "border-gray-200 text-gray-700 hover:border-violet-300"
                      }`}
                      style={{ fontFamily: FONT_MAP[font] }}
                    >
                      {font}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
