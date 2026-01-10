/**
 * Home Page
 *
 * The main landing page for the RetroStack website. Displays:
 * - Hero section with main value proposition
 * - Systems preview showcasing vintage computer collections
 * - Tools preview highlighting available development tools
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

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <SystemsPreview />
        <ToolsPreview />
        <CallToAction />
      </main>
      <Footer />
    </>
  );
}
