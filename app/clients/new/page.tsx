"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { StepIndicator } from "@/components/MultiStepForm/StepIndicator";
import { Step1Identity } from "@/components/MultiStepForm/Step1Identity";
import { Step2ToneOfVoice } from "@/components/MultiStepForm/Step2ToneOfVoice";
import { Step3Visual } from "@/components/MultiStepForm/Step3Visual";
import { Step4Review } from "@/components/MultiStepForm/Step4Review";

interface FormState {
  // Step 1
  name: string;
  sector: string;
  // Step 2
  toneOfVoice: string;
  personality: string;
  pillars: string;
  toneNotes: string;
  // Step 3
  logoUrl: string;
  logoVariants: { light?: string; dark?: string };
  colors: string[];
  fonts: { primary: string; secondary: string };
  fontFiles: { primary?: string; secondary?: string };
}

const INITIAL_STATE: FormState = {
  name: "",
  sector: "",
  toneOfVoice: "",
  personality: "",
  pillars: "",
  toneNotes: "",
  logoUrl: "",
  logoVariants: {},
  colors: [],
  fonts: { primary: "", secondary: "" },
  fontFiles: {},
};

export default function NewClientPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const updateForm = (updates: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...updates }));
    setErrors({});
  };

  const validateStep = (): boolean => {
    const newErrors: Partial<Record<string, string>> = {};
    if (step === 1) {
      if (!form.name.trim()) newErrors.name = "Nome do cliente é obrigatório";
      if (!form.sector.trim()) newErrors.sector = "Setor / nicho é obrigatório";
    }
    if (step === 2) {
      if (!form.toneOfVoice.trim()) newErrors.toneOfVoice = "Tom de voz é obrigatório";
      if (!form.personality.trim()) newErrors.personality = "Personalidade da marca é obrigatória";
      if (!form.pillars.trim()) newErrors.pillars = "Pilares de conteúdo são obrigatórios";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep()) setStep((s) => s + 1);
  };

  const prevStep = () => setStep((s) => s - 1);

  const handleSave = async () => {
    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          sector: form.sector,
          toneOfVoice: form.toneOfVoice || null,
          personality: form.personality,
          pillars: form.pillars,
          toneNotes: form.toneNotes || null,
          colors: form.colors,
          fonts: form.fonts,
          fontFiles: Object.keys(form.fontFiles).length ? form.fontFiles : null,
          logoUrl: form.logoUrl || null,
          logoVariants: Object.keys(form.logoVariants).length ? form.logoVariants : null,
        }),
      });
      if (!res.ok) throw new Error("Erro ao salvar cliente");
      const client = await res.json();
      router.push(`/clients/${client.id}`);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Erro desconhecido");
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-[#E5E5E5] sticky top-0 z-10 bg-white">
        <div className="max-w-3xl mx-auto px-8 py-5 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-[#A0A0A0] hover:text-[#FC0100] transition font-light"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Voltar
          </Link>
          <span
            className="text-base text-black tracking-[-0.04em]"
            style={{ fontFamily: "'Imbue', serif", fontWeight: 300 }}
          >
            Novo cliente
          </span>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-8 py-12">
        {/* Step indicator */}
        <div className="flex justify-center mb-12">
          <StepIndicator currentStep={step} />
        </div>

        {/* Form card */}
        <div className="bg-white border border-[#E5E5E5] p-10">
          {step === 1 && (
            <Step1Identity
              data={{ name: form.name, sector: form.sector }}
              onChange={updateForm}
              errors={errors}
            />
          )}
          {step === 2 && (
            <Step2ToneOfVoice
              data={{
                toneOfVoice: form.toneOfVoice,
                personality: form.personality,
                pillars: form.pillars,
                toneNotes: form.toneNotes,
              }}
              onChange={updateForm}
              errors={errors}
            />
          )}
          {step === 3 && (
            <Step3Visual
              data={{
                logoUrl: form.logoUrl,
                logoVariants: form.logoVariants,
                colors: form.colors,
                fonts: form.fonts,
                fontFiles: form.fontFiles,
              }}
              onChange={updateForm}
            />
          )}
          {step === 4 && (
            <Step4Review
              data={{
                name: form.name,
                sector: form.sector,
                toneOfVoice: form.toneOfVoice,
                personality: form.personality,
                pillars: form.pillars,
                toneNotes: form.toneNotes,
                logoUrl: form.logoUrl,
                colors: form.colors,
                fonts: form.fonts,
                fontFiles: form.fontFiles,
              }}
            />
          )}

          {saveError && (
            <div className="mt-4 p-4 border border-[#FC0100] bg-white text-sm text-[#FC0100] font-light">
              {saveError}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-10 pt-8 border-t border-[#E5E5E5]">
            {step > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="px-5 py-2.5 border border-[#E5E5E5] text-sm text-[#474747] font-light hover:border-[#FC0100] hover:text-[#FC0100] transition-all duration-200 rounded-xl"
              >
                Voltar
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-6 py-2.5 bg-[#FC0100] text-white text-sm font-medium hover:bg-[#D40000] transition-all duration-200 rounded-xl shadow-[0_2px_8px_rgba(252,1,0,0.25)] hover:shadow-[0_4px_16px_rgba(252,1,0,0.35)]"
              >
                Continuar
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 bg-[#FC0100] text-white text-sm font-medium hover:bg-[#D40000] transition-all duration-200 disabled:opacity-40 flex items-center gap-2 rounded-xl shadow-[0_2px_8px_rgba(252,1,0,0.25)] hover:shadow-[0_4px_16px_rgba(252,1,0,0.35)]"
              >
                {saving ? (
                  <>
                    <div className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin" />
                    Salvando…
                  </>
                ) : (
                  "Salvar cliente"
                )}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
