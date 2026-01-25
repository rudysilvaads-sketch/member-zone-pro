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
import { LevelUpAnimation } from "@/components/dashboard/LevelUpAnimation";
import { OnlineMembersList } from "@/components/community/OnlineMembersList";
import { ChatModal } from "@/components/ChatModal";
import { useAuth } from "@/contexts/AuthContext";
import { useLevelUpDetection } from "@/hooks/useLevelUpDetection";
import { UserProfile } from "@/lib/firebaseServices";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

const Index = () => {
  const { userProfile, refreshProfile } = useAuth();
  const [topUsers, setTopUsers] = useState<(UserProfile & { position: number })[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatTarget, setChatTarget] = useState<{ uid: string; displayName: string; photoURL: string | null } | null>(null);

  const openChatWithUser = (user: { uid: string; displayName: string; photoURL: string | null }) => {
    if (user.uid === userProfile?.uid) return;
    setChatTarget(user);
    setChatOpen(true);
  };
  
  // Level up detection
  const { showLevelUp, previousLevel, newLevel, closeLevelUp } = useLevelUpDetection({
    currentLevel: userProfile?.level,
  });

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
      
      <div className={`transition-all duration-300 md:${sidebarCollapsed ? 'pl-20' : 'pl-64'}`}>
        <Header />
        
        <main className="p-3 sm:p-4 md:p-6 pt-16 md:pt-6">
          {/* Welcome Section - La Casa Elite Style */}
          <div className="mb-6 md:mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#BFFF00]/10 border border-[#BFFF00]/20 mb-2 md:mb-3">
              <span className="text-[10px] sm:text-xs text-[#BFFF00] uppercase tracking-widest font-medium">Dashboard</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
              Bem-vindo de volta, <span className="text-[#BFFF00] italic">{displayName}</span>! 👋
            </h1>
            <p className="mt-1 text-sm md:text-base text-white/50">
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
          <div className="mt-6 md:mt-8 grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-3">
            <LevelProgress 
              xp={userProfile?.xp || 0} 
              points={userProfile?.points || 0} 
            />
            <StreakCard />
            <DailyMissions />
          </div>

          {/* Main Grid */}
          <div className="mt-4 md:mt-6 grid gap-4 md:gap-6 grid-cols-1 lg:grid-cols-3">
            {/* Left Column - Progress & Online Members */}
            <div className="lg:col-span-1 space-y-4 md:space-y-6">
              <ProgressSection 
                currentPoints={userProfile?.points || 0}
                currentRank={userProfile?.rank || 'bronze'}
                completedModules={userProfile?.completedModules || 0}
                achievements={userProfile?.achievements?.length || 0}
                streakDays={userProfile?.streakDays || 0}
              />
              
              {/* Online Members - Hidden on mobile for space */}
              <div className="hidden sm:block">
                <OnlineMembersList onMemberClick={openChatWithUser} />
              </div>
            </div>

            {/* Right Column - Ranking */}
            <div className="lg:col-span-2">
              <RankingCard users={topUsers} currentUserId={userProfile?.uid} />
            </div>
          </div>

          {/* Achievements Section */}
          <div className="mt-4 md:mt-6">
            <AchievementsCard unlockedAchievements={userProfile?.achievements || []} />
          </div>

          {/* Products Section */}
          <div className="mt-4 md:mt-6 pb-6">
            <ProductsShowcase userRank={userProfile?.rank || 'bronze'} userPoints={userProfile?.points || 0} />
          </div>
        </main>
      </div>

      {/* Level Up Animation */}
      {showLevelUp && previousLevel !== null && newLevel !== null && (
        <LevelUpAnimation
          previousLevel={previousLevel}
          newLevel={newLevel}
          onClose={closeLevelUp}
        />
      )}

      {/* Chat Modal */}
      <ChatModal 
        open={chatOpen} 
        onOpenChange={(open) => {
          setChatOpen(open);
          if (!open) setChatTarget(null);
        }}
        targetUser={chatTarget}
      />
    </div>
  );
};

export default Index;
