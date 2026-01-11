import { Metadata } from "next";
import { Suspense } from "react";
import { BinaryImportView } from "./BinaryImportView";

export const metadata: Metadata = {
  title: "Import Binary ROM - RetroStack",
  description: "Import binary character ROM files and configure dimensions and format settings.",
};

export default function BinaryImportPage() {
  return (
    <Suspense fallback={null}>
      <BinaryImportView />
    </Suspense>
  );
}
