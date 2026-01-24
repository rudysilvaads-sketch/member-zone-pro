import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { ProgressSection } from "@/components/dashboard/ProgressSection";
import { RankingCard } from "@/components/dashboard/RankingCard";
import { AchievementsCard } from "@/components/dashboard/AchievementsCard";
import { ProductsShowcase } from "@/components/dashboard/ProductsShowcase";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      
      <div className="pl-64 transition-all duration-300">
        <Header />
        
        <main className="p-6">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold">
              Bem-vindo de volta, <span className="text-gradient-gold">João</span>! 👋
            </h1>
            <p className="mt-1 text-muted-foreground">
              Continue sua jornada e alcance novos patamares.
            </p>
          </div>

          {/* Stats Cards */}
          <StatsCards />

          {/* Main Grid */}
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {/* Left Column - Progress */}
            <div className="lg:col-span-1">
              <ProgressSection />
            </div>

            {/* Right Column - Ranking */}
            <div className="lg:col-span-2">
              <RankingCard />
            </div>
          </div>

          {/* Achievements Section */}
          <div className="mt-6">
            <AchievementsCard />
          </div>

          {/* Products Section */}
          <div className="mt-6">
            <ProductsShowcase />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
