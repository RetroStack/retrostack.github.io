/**
 * Home Page
 *
 * The main landing page for the RetroStack website. Displays:
 * - Hero section with main value proposition
 * - Systems preview showcasing vintage computer collections (if enabled)
 * - Tools preview highlighting available development tools (if enabled)
 * - Call to action for community engagement
 *
 * This is a server component that composes layout and section
 * components to create the full homepage experience.
 *
 * @module app/page
 */
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Hero } from "@/components/sections/Hero";
import { SystemsPreview } from "@/components/sections/SystemsPreview";
import { ToolsPreview } from "@/components/sections/ToolsPreview";
import { CallToAction } from "@/components/sections/CallToAction";
import { NAV_ITEMS } from "@/lib/constants";

// Check if sections are enabled in navigation
const isSystemsEnabled = NAV_ITEMS.find((item) => item.label === "Systems")?.enabled ?? false;
const isToolsEnabled = NAV_ITEMS.find((item) => item.label === "Tools")?.enabled ?? false;

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        {isSystemsEnabled && <SystemsPreview />}
        {isToolsEnabled && <ToolsPreview />}
        <CallToAction />
      </main>
      <Footer />
    </>
  );
}
