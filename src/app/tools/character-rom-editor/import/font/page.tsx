import { Metadata } from "next";
import { Suspense } from "react";
import { FontImportView } from "./FontImportView";

export const metadata: Metadata = {
  title: "Import from Font - RetroStack",
  description: "Rasterize character sets from TTF, OTF, or WOFF font files.",
};

export default function FontImportPage() {
  return (
    <Suspense fallback={null}>
      <FontImportView />
    </Suspense>
  );
}
