"use client";

import { useState } from "react";

export default function MultiStepForm({
  steps,
  onComplete,
}: {
  steps: {
    label: string;
    content: (data: Record<string, unknown>, updateData: (d: Record<string, unknown>) => void) => React.ReactNode;
  }[];
  onComplete: (data: Record<string, unknown>) => void;
}) {
  const [current, setCurrent] = useState(0);
  const [data, setData] = useState<Record<string, unknown>>({});

  function updateData(d: Record<string, unknown>) {
    setData((prev) => ({ ...prev, ...d }));
  }

  function next() {
    if (current < steps.length - 1) setCurrent((c) => c + 1);
    else onComplete(data);
  }

  function prev() {
    if (current > 0) setCurrent((c) => c - 1);
  }

  return (
    <div>
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, i) => (
            <div key={step.label} className="flex items-center">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                  i < current
                    ? "bg-sage text-parchment"
                    : i === current
                      ? "bg-ink text-parchment"
                      : "bg-ink/10 text-ink/40"
                }`}
              >
                {i < current ? "✓" : i + 1}
              </div>
              <span className={`ml-2 hidden text-sm sm:inline ${i === current ? "text-ink" : "text-ink/40"}`}>
                {step.label}
              </span>
              {i < steps.length - 1 && (
                <div className={`mx-3 hidden h-px w-8 sm:block ${i < current ? "bg-sage" : "bg-ink/10"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[300px]">{steps[current].content(data, updateData)}</div>

      {/* Navigation */}
      <div className="mt-8 flex justify-between">
        <button
          onClick={prev}
          disabled={current === 0}
          className="focus-ring rounded-card border border-ink/20 px-4 py-2 text-sm text-ink hover:border-ink/40 disabled:opacity-30"
        >
          Back
        </button>
        <button
          onClick={next}
          className="focus-ring rounded-card bg-ink px-5 py-2.5 text-sm font-medium text-parchment hover:bg-ink-light"
        >
          {current === steps.length - 1 ? "Submit" : "Continue"}
        </button>
      </div>
    </div>
  );
}
