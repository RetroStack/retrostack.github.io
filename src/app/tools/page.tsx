import { Metadata } from "next";
import { PlaceholderPage } from "@/components/sections/PlaceholderPage";
import { NAV_ITEMS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Tools - RetroStack",
  description: "Browser-based development tools for vintage computing.",
};

// Get enabled sub-pages from NAV_ITEMS
const toolsNav = NAV_ITEMS.find((item) => item.label === "Tools");
const enabledSubPages =
  toolsNav?.children
    ?.filter((child) => child.enabled)
    .map((child) => ({
      label: child.label,
      href: child.href,
      description: child.description,
    })) ?? [];

export default function ToolsPage() {
  return (
    <PlaceholderPage
      title="Tools"
      description="A suite of browser-based development tools for working with vintage hardware and software."
      backLink="/"
      backLabel="Back to Home"
      subPages={enabledSubPages}
      icon={
        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      }
    />
  );
}
