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
import { UserProfile } from "@/lib/firebaseServices";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

const Index = () => {
  const { userProfile, refreshProfile } = useAuth();
  const [topUsers, setTopUsers] = useState<(UserProfile & { position: number })[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Real-time listener for ranking updates
  useEffect(() => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('points', 'desc'), limit(100));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map((doc, index) => ({
        ...doc.data(),
        uid: doc.id,
        position: index + 1,
      })) as (UserProfile & { position: number })[];
      
      setTopUsers(users.slice(0, 5));
      
      if (userProfile) {
        const userIndex = users.findIndex(u => u.uid === userProfile.uid);
        if (userIndex !== -1) {
          setUserRank(userIndex + 1);
        }
        // Refresh user profile to get updated data
        refreshProfile();
      }
    });

    return () => unsubscribe();
  }, [userProfile?.uid]);

  const displayName = userProfile?.displayName?.split(' ')[0] || 'Membro';

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'pl-20' : 'pl-64'}`}>
        <Header />
        
        <main className="p-6">
          {/* Welcome Section - La Casa Elite Style */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#BFFF00]/10 border border-[#BFFF00]/20 mb-3">
              <span className="text-xs text-[#BFFF00] uppercase tracking-widest font-medium">Dashboard</span>
            </div>
            <h1 className="text-3xl font-bold text-white">
              Bem-vindo de volta, <span className="text-[#BFFF00] italic">{displayName}</span>! 👋
            </h1>
            <p className="mt-1 text-white/50">
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
