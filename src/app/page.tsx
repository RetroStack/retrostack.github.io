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
