import { Metadata } from "next";
import { PlaceholderPage } from "@/components/sections/PlaceholderPage";
import { NAV_ITEMS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Resources - RetroStack",
  description: "Datasheets, documentation, guides, and reference materials for vintage computing.",
};

// Get enabled sub-pages from NAV_ITEMS
const resourcesNav = NAV_ITEMS.find((item) => item.label === "Resources");
const enabledSubPages =
  resourcesNav?.children
    ?.filter((child) => child.enabled)
    .map((child) => ({
      label: child.label,
      href: child.href,
      description: child.description,
    })) ?? [];

export default function ResourcesPage() {
  return (
    <PlaceholderPage
      title="Resources"
      description="A collection of datasheets, documentation, guides, and reference materials for vintage computing enthusiasts and hardware builders."
      backLink="/"
      backLabel="Back to Home"
      subPages={enabledSubPages}
      icon={
        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      }
    />
  );
}
