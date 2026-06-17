import { Header } from '../components/layout'
import { Footer } from '../components/layout'
import { BottomNav } from '../components/layout'
import { HeroSection } from '../components/features'
import { ExplainerCardsSection } from '../components/features'
import { FeaturedSection } from '../components/features'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      <Header variant="landing" />
      <main className="pt-0">
        <HeroSection />
        <ExplainerCardsSection />
        <FeaturedSection />
      </main>
      <Footer />
      <BottomNav />
    </div>
  )
}

export default LandingPage
