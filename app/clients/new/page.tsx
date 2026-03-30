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
  personality: string[];
  pillars: string[];
  toneNotes: string;
  // Step 3
  logoUrl: string;
  logoVariants: { light?: string; dark?: string };
  colors: string[];
  fonts: { primary: string; secondary: string };
}

const INITIAL_STATE: FormState = {
  name: "",
  sector: "",
  personality: [],
  pillars: [],
  toneNotes: "",
  logoUrl: "",
  logoVariants: {},
  colors: [],
  fonts: { primary: "", secondary: "" },
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
      if (!form.name.trim()) newErrors.name = "Client name is required";
      if (!form.sector.trim()) newErrors.sector = "Industry / niche is required";
    }
    if (step === 2) {
      if (form.personality.length === 0) newErrors.personality = "Select at least one personality trait";
      if (form.pillars.length === 0) newErrors.pillars = "Select at least one content pillar";
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
          personality: form.personality,
          pillars: form.pillars,
          toneNotes: form.toneNotes || null,
          colors: form.colors,
          fonts: form.fonts,
          logoUrl: form.logoUrl || null,
          logoVariants: Object.keys(form.logoVariants).length ? form.logoVariants : null,
        }),
      });
      if (!res.ok) throw new Error("Failed to save client");
      const client = await res.json();
      router.push(`/clients/${client.id}`);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Unknown error");
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </Link>
          <span className="font-semibold text-gray-900">New client</span>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Step indicator */}
        <div className="flex justify-center mb-10">
          <StepIndicator currentStep={step} />
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          {step === 1 && (
            <Step1Identity
              data={{ name: form.name, sector: form.sector }}
              onChange={updateForm}
              errors={errors}
            />
          )}
          {step === 2 && (
            <Step2ToneOfVoice
              data={{ personality: form.personality, pillars: form.pillars, toneNotes: form.toneNotes }}
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
              }}
              onChange={updateForm}
            />
          )}
          {step === 4 && (
            <Step4Review
              data={{
                name: form.name,
                sector: form.sector,
                personality: form.personality,
                pillars: form.pillars,
                toneNotes: form.toneNotes,
                logoUrl: form.logoUrl,
                colors: form.colors,
                fonts: form.fonts,
              }}
            />
          )}

          {saveError && (
            <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
              {saveError}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
            {step > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-600 hover:border-violet-300 hover:text-violet-600 transition"
              >
                Back
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition"
              >
                Continue
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition disabled:opacity-60 flex items-center gap-2"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save client"
                )}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
