import { Metadata } from "next";
import { Suspense } from "react";
import { ExportAllView } from "./ExportAllView";

export const metadata: Metadata = {
  title: "Export All Character Sets - RetroStack",
  description: "Export multiple character sets to a single JSON file.",
};

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-retro-dark">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-retro-cyan border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-gray-400">Loading...</span>
      </div>
    </div>
  );
}

export default function ExportAllPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ExportAllView />
    </Suspense>
  );
}
