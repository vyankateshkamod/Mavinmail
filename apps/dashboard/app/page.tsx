import { SiteHeader, SiteFooter } from "@/components/landing/HeaderFooter"
import { HeroSection } from "@/components/landing/HeroSection"
import { FeaturesSection } from "@/components/landing/FeaturesSection"
import { FlowchartSection } from "@/components/landing/FlowchartSection"
import { WorkflowDiagrams } from "@/components/landing/WorkflowDiagrams"
import { PricingAndCTA } from "@/components/landing/PricingAndCTA"

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#0C0C0C] text-white selection:bg-[#24D3EE]/20 selection:text-white antialiased overflow-x-hidden">
      <SiteHeader />
      <HeroSection />
      <FeaturesSection />
      <FlowchartSection />
      <WorkflowDiagrams />
      <PricingAndCTA />
      <SiteFooter />
    </main>
  )
}
