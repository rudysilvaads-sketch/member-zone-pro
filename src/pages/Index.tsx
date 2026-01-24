import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { ProgressSection } from "@/components/dashboard/ProgressSection";
import { RankingCard } from "@/components/dashboard/RankingCard";
import { AchievementsCard } from "@/components/dashboard/AchievementsCard";
import { ProductsShowcase } from "@/components/dashboard/ProductsShowcase";
import { DailyMissions } from "@/components/dashboard/DailyMissions";
import { LevelProgress } from "@/components/dashboard/LevelProgress";
import { StreakCard } from "@/components/dashboard/StreakCard";
import { useAuth } from "@/contexts/AuthContext";
import { getTopUsers, UserProfile } from "@/lib/firebaseServices";

const Index = () => {
  const { userProfile } = useAuth();
  const [topUsers, setTopUsers] = useState<(UserProfile & { position: number })[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const users = await getTopUsers(100);
        setTopUsers(users.slice(0, 5));
        
        if (userProfile) {
          const userIndex = users.findIndex(u => u.uid === userProfile.uid);
          if (userIndex !== -1) {
            setUserRank(userIndex + 1);
          }
        }
      } catch (error) {
        console.error('Error fetching ranking:', error);
      }
    };

    fetchRanking();
  }, [userProfile]);

  const displayName = userProfile?.displayName?.split(' ')[0] || 'Membro';

  return (
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'pl-20' : 'pl-64'}`}>
        <Header />
        
        <main className="p-6">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold">
              Bem-vindo de volta, <span className="text-gradient-gold">{displayName}</span>! 👋
            </h1>
            <p className="mt-1 text-muted-foreground">
              Continue sua jornada e alcance novos patamares.
            </p>
          </div>

          {/* Stats Cards */}
          <StatsCards 
            userRank={userRank} 
            points={userProfile?.points || 0}
            achievements={userProfile?.achievements?.length || 0}
            streakDays={userProfile?.streakDays || 0}
          />

          {/* Level, Streak & Missions Row */}
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <LevelProgress 
              xp={userProfile?.xp || 0} 
              points={userProfile?.points || 0} 
            />
            <StreakCard />
            <DailyMissions />
          </div>

          {/* Main Grid */}
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            {/* Left Column - Progress */}
            <div className="lg:col-span-1">
              <ProgressSection 
                currentPoints={userProfile?.points || 0}
                currentRank={userProfile?.rank || 'bronze'}
                completedModules={userProfile?.completedModules || 0}
                achievements={userProfile?.achievements?.length || 0}
                streakDays={userProfile?.streakDays || 0}
              />
            </div>

            {/* Right Column - Ranking */}
            <div className="lg:col-span-2">
              <RankingCard users={topUsers} currentUserId={userProfile?.uid} />
            </div>
          </div>

          {/* Achievements Section */}
          <div className="mt-6">
            <AchievementsCard unlockedAchievements={userProfile?.achievements || []} />
          </div>

          {/* Products Section */}
          <div className="mt-6">
            <ProductsShowcase userRank={userProfile?.rank || 'bronze'} userPoints={userProfile?.points || 0} />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
