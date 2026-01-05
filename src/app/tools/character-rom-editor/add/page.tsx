"use client";

import { Suspense } from "react";
import { AddView } from "./AddView";

export default function AddPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-retro-dark">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-2 border-retro-cyan border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-400">Loading...</span>
          </div>
        </div>
      }
    >
      <AddView />
    </Suspense>
  );
}
