import { Metadata } from "next";
import { PlaceholderPage } from "@/components/sections/PlaceholderPage";
import { NAV_ITEMS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Systems - RetroStack",
  description: "Explore our collection of vintage computer replicas, game consoles, SDKs, and trainer boards.",
};

// Get enabled sub-pages from NAV_ITEMS
const systemsNav = NAV_ITEMS.find((item) => item.label === "Systems");
const enabledSubPages = systemsNav?.children
  ?.filter((child) => child.enabled)
  .map((child) => ({
    label: child.label,
    href: child.href,
    description: child.description,
  })) ?? [];

export default function SystemsPage() {
  return (
    <PlaceholderPage
      title="Systems"
      description="Browse our collection of vintage computer systems, game consoles, development kits, and educational trainer boards. Each system includes detailed documentation, schematics, and build guides."
      backLink="/"
      backLabel="Back to Home"
      subPages={enabledSubPages}
      icon={
        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
        </svg>
      }
    />
  );
}
