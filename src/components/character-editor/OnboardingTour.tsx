"use client";

import { useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { OnboardingStep } from "@/hooks/useOnboarding";

export interface OnboardingTourProps {
  /** Whether the tour is active */
  isActive: boolean;
  /** Current step data */
  currentStep: OnboardingStep | null;
  /** Current step index (0-based) */
  stepIndex: number;
  /** Total number of steps */
  totalSteps: number;
  /** Whether this is the first step */
  isFirstStep: boolean;
  /** Whether this is the last step */
  isLastStep: boolean;
  /** Go to next step */
  onNext: () => void;
  /** Go to previous step */
  onPrev: () => void;
  /** Skip the tour */
  onSkip: () => void;
}

/**
 * Onboarding tour overlay component
 */
export function OnboardingTour({
  isActive,
  currentStep,
  stepIndex,
  totalSteps,
  isFirstStep,
  isLastStep,
  onNext,
  onPrev,
  onSkip,
}: OnboardingTourProps) {
  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        onSkip();
      } else if (e.key === "ArrowRight" || e.key === "Enter") {
        onNext();
      } else if (e.key === "ArrowLeft") {
        onPrev();
      }
    },
    [onNext, onPrev, onSkip]
  );

  if (!isActive || !currentStep) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onSkip}
      />

      {/* Tour card */}
      <div className="relative w-full max-w-md bg-retro-navy border border-retro-cyan/50 rounded-lg shadow-2xl overflow-hidden animate-fade-in">
        {/* Progress indicator */}
        <div className="flex gap-1 p-2 bg-retro-dark/30">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1 rounded-full transition-colors ${
                i <= stepIndex ? "bg-retro-cyan" : "bg-retro-grid"
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step number */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs text-retro-cyan font-medium uppercase tracking-wide">
              Step {stepIndex + 1} of {totalSteps}
            </span>
            <button
              onClick={onSkip}
              className="text-xs text-gray-500 hover:text-white transition-colors"
            >
              Skip tour
            </button>
          </div>

          {/* Title */}
          <h2 className="text-xl font-medium text-white mb-3">{currentStep.title}</h2>

          {/* Description */}
          <p className="text-gray-300 leading-relaxed">{currentStep.description}</p>

          {/* Icon/illustration */}
          <div className="flex justify-center my-6">
            {stepIndex === 0 && (
              <div className="w-20 h-20 rounded-full bg-retro-cyan/10 border border-retro-cyan/30 flex items-center justify-center">
                <svg className="w-10 h-10 text-retro-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            {stepIndex === 1 && (
              <div className="w-20 h-20 rounded-full bg-retro-pink/10 border border-retro-pink/30 flex items-center justify-center">
                <svg className="w-10 h-10 text-retro-pink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            )}
            {stepIndex === 2 && (
              <div className="w-20 h-20 rounded-full bg-retro-violet/10 border border-retro-violet/30 flex items-center justify-center">
                <svg className="w-10 h-10 text-retro-violet" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
            )}
            {stepIndex === 3 && (
              <div className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center">
                <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
            )}
            {stepIndex === 4 && (
              <div className="w-20 h-20 rounded-full bg-orange-500/10 border border-orange-500/30 flex items-center justify-center">
                <svg className="w-10 h-10 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
            )}
            {stepIndex === 5 && (
              <div className="w-20 h-20 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
            )}
            {stepIndex === 6 && (
              <div className="w-20 h-20 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
                <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            )}
            {stepIndex === 7 && (
              <div className="w-20 h-20 rounded-full bg-retro-cyan/10 border border-retro-cyan/30 flex items-center justify-center">
                <svg className="w-10 h-10 text-retro-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            )}
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between p-4 border-t border-retro-grid/30 bg-retro-dark/30">
          <Button
            onClick={onPrev}
            disabled={isFirstStep}
            variant="ghost"
            size="sm"
          >
            Previous
          </Button>
          <Button
            onClick={onNext}
            variant="cyan"
            size="sm"
          >
            {isLastStep ? "Get Started" : "Next"}
          </Button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
