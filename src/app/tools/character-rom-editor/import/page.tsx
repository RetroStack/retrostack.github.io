import { Metadata } from "next";
import { Suspense } from "react";
import { ImportHubView } from "./ImportHubView";

export const metadata: Metadata = {
  title: "Import Character Set - RetroStack",
  description: "Import character sets from binary ROM files, images, fonts, or code.",
};

export default function ImportPage() {
  return (
    <Suspense fallback={null}>
      <ImportHubView />
    </Suspense>
  );
}
