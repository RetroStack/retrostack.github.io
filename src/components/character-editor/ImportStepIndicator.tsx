"use client";

export interface ImportStepIndicatorProps {
  /** Current step (1-based) */
  currentStep: number;
  /** Total number of steps */
  totalSteps: number;
  /** Step labels */
  labels: string[];
}

/**
 * Step indicator for the import wizard
 */
export function ImportStepIndicator({
  currentStep,
  totalSteps,
  labels,
}: ImportStepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: totalSteps }, (_, i) => {
        const step = i + 1;
        const isActive = step === currentStep;
        const isComplete = step < currentStep;

        return (
          <div key={step} className="flex items-center">
            {/* Step circle */}
            <div
              className={`
                flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium
                transition-colors
                ${
                  isActive
                    ? "bg-retro-cyan text-retro-dark"
                    : isComplete
                    ? "bg-retro-cyan/30 text-retro-cyan"
                    : "bg-retro-grid/30 text-gray-500"
                }
              `}
            >
              {isComplete ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
              ) : (
                step
              )}
            </div>

            {/* Label */}
            <span
              className={`
                ml-2 text-sm hidden sm:inline
                ${isActive ? "text-retro-cyan" : isComplete ? "text-gray-400" : "text-gray-500"}
              `}
            >
              {labels[i]}
            </span>

            {/* Connector line */}
            {step < totalSteps && (
              <div
                className={`
                  w-8 sm:w-12 h-0.5 mx-2 sm:mx-4
                  ${isComplete ? "bg-retro-cyan/50" : "bg-retro-grid/30"}
                `}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
