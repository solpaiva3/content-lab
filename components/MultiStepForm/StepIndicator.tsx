"use client";

const STEPS = ["Identity", "Tone", "Visual", "Review"];

interface StepIndicatorProps {
  currentStep: number;
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((label, index) => {
        const step = index + 1;
        const isCompleted = step < currentStep;
        const isActive = step === currentStep;

        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-7 h-7 flex items-center justify-center text-xs font-medium transition-all ${
                  isCompleted
                    ? "bg-[#FC0100] text-white"
                    : isActive
                    ? "bg-[#FC0100] text-white ring-2 ring-offset-2 ring-[#FC0100]"
                    : "bg-white text-[#A0A0A0] border border-[#E5E5E5]"
                }`}
              >
                {isCompleted ? (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step
                )}
              </div>
              <span
                className={`text-[10px] font-medium uppercase tracking-widest whitespace-nowrap transition-colors ${
                  isActive ? "text-black" : isCompleted ? "text-[#474747]" : "text-[#A0A0A0]"
                }`}
              >
                {label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={`h-px w-16 mx-2 mb-5 transition-all ${
                  step < currentStep ? "bg-[#FC0100]" : "bg-[#E5E5E5]"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
