"use client";

import { useState, useRef } from "react";

export interface VisualData {
  logoUrl: string;
  logoVariants: { light?: string; dark?: string };
  colors: string[];
  fonts: { primary: string; secondary: string };
  fontFiles: { primary?: string; secondary?: string };
}

interface Step3VisualProps {
  data: VisualData;
  onChange: (data: Partial<VisualData>) => void;
}

const MAX_DIM = 4000;

function readImageDimensions(file: File): Promise<{ w: number; h: number } | null> {
  // SVGs are vector — dimensions don't apply
  if (file.type === "image/svg+xml") return Promise.resolve(null);
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve({ w: img.naturalWidth, h: img.naturalHeight }); };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
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
  const [uploadError, setUploadError] = useState("");
  const [bgDark, setBgDark] = useState(false);
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setUploadError("");
    setDims(null);
    console.log(`[logo-upload:${variant}] start — name: "${file.name}", type: "${file.type}", size: ${file.size} bytes`);
    try {
      const detected = await readImageDimensions(file);
      if (detected) {
        setDims(detected);
        if (detected.w > MAX_DIM || detected.h > MAX_DIM) {
          console.warn(`[logo-upload:${variant}] oversized: ${detected.w}×${detected.h}`);
        }
      }

      const fd = new FormData();
      fd.append("file", file);
      fd.append("variant", variant);

      const res = await fetch("/api/upload", { method: "POST", body: fd });
      console.log(`[logo-upload:${variant}] response — status: ${res.status}, ok: ${res.ok}`);

      let json: { url?: string; error?: string; mimeType?: string; size?: number } = {};
      try {
        json = await res.json();
        console.log(`[logo-upload:${variant}] parsed JSON — keys: [${Object.keys(json).join(", ")}], url starts with: "${json.url?.slice(0, 30) ?? "none"}"`);
      } catch (parseErr) {
        console.error(`[logo-upload:${variant}] JSON parse failed:`, parseErr);
        throw new Error(`Server error ${res.status} (invalid JSON)`);
      }

      if (!res.ok) {
        throw new Error(json.error ?? `Upload failed (${res.status})`);
      }

      if (json.url) {
        console.log(`[logo-upload:${variant}] calling onUploaded with data URI (${json.url.length} chars)`);
        onUploaded(json.url);
        console.log(`[logo-upload:${variant}] onUploaded done`);
      } else {
        throw new Error("Server returned no URL");
      }
    } catch (err) {
      console.error(`[logo-upload:${variant}] error:`, err);
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      console.log(`[logo-upload:${variant}] done`);
    }
  }

  const isOversized = dims !== null && (dims.w > MAX_DIM || dims.h > MAX_DIM);

  return (
    <div className="space-y-2">
      <span className="text-xs text-[#474747] font-medium uppercase tracking-widest">{label}</span>
      <div
        className={`relative border flex items-center justify-center h-24 cursor-pointer transition ${
          currentUrl ? "border-[#FC0100]" : "border-dashed border-[#E5E5E5] hover:border-black"
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
          <div className={`relative w-full h-full flex items-center justify-center ${bgDark ? "bg-black" : "bg-white"}`}>
            <img src={currentUrl} alt={label} className="object-contain max-h-14 max-w-full" />
          </div>
        ) : uploading ? (
          <div className="flex flex-col items-center gap-1 text-[#A0A0A0]">
            <div className="w-4 h-4 border border-[#FC0100] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-light">Uploading…</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1 text-[#C0C0C0]">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs font-light">PNG, SVG or JPG</span>
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

      {/* Hint — always visible */}
      {!dims && !uploadError && (
        <p className="text-[10px] text-[#C0C0C0] font-light">Max recommended: 4000 × 4000 px</p>
      )}

      {/* Dimensions after upload */}
      {dims && !uploadError && (
        isOversized ? (
          <p className="text-xs text-[#FC0100]">
            {dims.w} × {dims.h} px — large image, may fail in Figma
          </p>
        ) : (
          <p className="text-[10px] text-[#A0A0A0] font-light">{dims.w} × {dims.h} px</p>
        )
      )}

      {uploadError && <p className="text-xs text-[#FC0100]">{uploadError}</p>}

      {currentUrl && (
        <button
          type="button"
          onClick={() => setBgDark(!bgDark)}
          className="text-xs text-[#A0A0A0] hover:text-black transition font-light"
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
        className="w-10 h-10 border border-[#E5E5E5] cursor-pointer relative overflow-hidden"
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
        className="w-16 text-center text-xs border border-[#E5E5E5] px-1 py-0.5 font-mono focus:outline-none focus:ring-1 focus:ring-[#FC0100] text-[#474747]"
      />
      <button
        type="button"
        onClick={onRemove}
        className="text-[#C0C0C0] hover:text-[#FC0100] text-xs transition"
        title={`Remove color ${index + 1}`}
      >
        ×
      </button>
    </div>
  );
}

function FontUploader({
  role,
  fontName,
  fileUrl,
  onNameChange,
  onFileUploaded,
}: {
  role: "primary" | "secondary";
  fontName: string;
  fileUrl?: string;
  onNameChange: (name: string) => void;
  onFileUploaded: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setUploadError("");
    console.log(`[font-upload:${role}] start — name: "${file.name}", type: "${file.type}", size: ${file.size} bytes`);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("variant", `font-${role}`);

      const res = await fetch("/api/upload", { method: "POST", body: fd });
      console.log(`[font-upload:${role}] response — status: ${res.status}, ok: ${res.ok}`);

      let json: { url?: string; error?: string } = {};
      try {
        json = await res.json();
      } catch (parseErr) {
        console.error(`[font-upload:${role}] JSON parse failed:`, parseErr);
        throw new Error(`Server error ${res.status} (invalid JSON)`);
      }

      if (!res.ok) throw new Error(json.error ?? `Upload failed (${res.status})`);
      if (json.url) {
        onFileUploaded(json.url);
        console.log(`[font-upload:${role}] done`);
      } else {
        throw new Error("Server returned no URL");
      }
    } catch (err) {
      console.error(`[font-upload:${role}] error:`, err);
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const fileName = fileUrl ? fileUrl.split("/").pop() : null;

  return (
    <div className="space-y-2">
      <label className="block text-xs text-[#474747] font-medium uppercase tracking-widest capitalize">
        {role} font
      </label>
      <input
        type="text"
        value={fontName}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder={role === "primary" ? "e.g. Imbue" : "e.g. Inter"}
        className="w-full px-3 py-2.5 border border-[#E5E5E5] bg-white text-sm text-black placeholder-[#C0C0C0] font-light focus:outline-none focus:ring-1 focus:ring-[#FC0100] transition"
      />
      <div
        className={`border flex items-center justify-center h-14 cursor-pointer transition ${
          fileUrl ? "border-[#FC0100]" : "border-dashed border-[#E5E5E5] hover:border-black"
        }`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files[0];
          if (f) handleFile(f);
        }}
      >
        {uploading ? (
          <div className="flex items-center gap-2 text-[#A0A0A0] text-xs font-light">
            <div className="w-3.5 h-3.5 border border-[#FC0100] border-t-transparent rounded-full animate-spin" />
            Uploading…
          </div>
        ) : fileUrl ? (
          <div className="flex items-center gap-2 text-black text-xs px-3 font-light">
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="truncate">{fileName}</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-0.5 text-[#C0C0C0]">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span className="text-xs font-light">TTF, OTF, WOFF or WOFF2</span>
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept=".ttf,.otf,.woff,.woff2"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
      </div>
      {uploadError && <p className="text-xs text-[#FC0100]">{uploadError}</p>}
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
    <div className="space-y-10">
      <div>
        <h2
          className="text-2xl text-black tracking-[-0.04em]"
          style={{ fontFamily: "'Imbue', serif", fontWeight: 300 }}
        >
          Visual identity
        </h2>
        <p className="mt-1 text-sm text-[#A0A0A0] font-light">Logo, color palette and typography.</p>
      </div>

      {/* Logo */}
      <div>
        <p className="text-xs font-medium text-[#474747] uppercase tracking-widest mb-4">Logo</p>
        <div className="grid grid-cols-3 gap-4">
          <LogoUploader
            label="Main"
            variant="main"
            currentUrl={data.logoUrl}
            onUploaded={(url) => onChange({ logoUrl: url })}
          />
          <LogoUploader
            label="Light bg"
            variant="light"
            currentUrl={data.logoVariants.light || ""}
            onUploaded={(url) => onChange({ logoVariants: { ...data.logoVariants, light: url } })}
          />
          <LogoUploader
            label="Dark bg"
            variant="dark"
            currentUrl={data.logoVariants.dark || ""}
            onUploaded={(url) => onChange({ logoVariants: { ...data.logoVariants, dark: url } })}
          />
        </div>
      </div>

      {/* Colors */}
      <div>
        <p className="text-xs font-medium text-[#474747] uppercase tracking-widest mb-4">
          Color palette
          <span className="text-[#A0A0A0] font-light normal-case ml-1">(up to 6)</span>
        </p>
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
              className="w-10 h-10 border border-dashed border-[#E5E5E5] flex items-center justify-center text-[#C0C0C0] hover:border-[#FC0100] hover:text-[#FC0100] transition text-lg font-light"
            >
              +
            </button>
          )}
        </div>
        {data.colors.length > 0 && (
          <div className="mt-4 flex gap-0 h-2 w-full max-w-sm">
            {data.colors.map((color, i) => (
              <div key={i} className="flex-1" style={{ backgroundColor: color }} />
            ))}
          </div>
        )}
      </div>

      {/* Typography */}
      <div>
        <p className="text-xs font-medium text-[#474747] uppercase tracking-widest mb-4">Typography</p>
        <div className="grid grid-cols-2 gap-6">
          {(["primary", "secondary"] as const).map((role) => (
            <FontUploader
              key={role}
              role={role}
              fontName={data.fonts[role]}
              fileUrl={data.fontFiles?.[role]}
              onNameChange={(name) => onChange({ fonts: { ...data.fonts, [role]: name } })}
              onFileUploaded={(url) => onChange({ fontFiles: { ...data.fontFiles, [role]: url } })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
