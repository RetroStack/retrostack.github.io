import { Metadata } from "next";
import { Suspense } from "react";
import { ImageImportView } from "./ImageImportView";

export const metadata: Metadata = {
  title: "Import from Image - RetroStack",
  description: "Extract character sets from PNG images with character grids.",
};

export default function ImageImportPage() {
  return (
    <Suspense fallback={null}>
      <ImageImportView />
    </Suspense>
  );
}
