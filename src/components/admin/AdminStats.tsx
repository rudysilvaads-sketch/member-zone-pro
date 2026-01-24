import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  ShoppingBag, 
  TrendingUp, 
  Award,
  DollarSign,
  Activity,
  Crown,
  Target
} from 'lucide-react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface StatsData {
  totalUsers: number;
  totalProducts: number;
  totalPurchases: number;
  totalPointsSpent: number;
  activeUsersToday: number;
  averageLevel: number;
  topRanks: Record<string, number>;
}

export function AdminStats() {
  const [stats, setStats] = useState<StatsData>({
    totalUsers: 0,
    totalProducts: 0,
    totalPurchases: 0,
    totalPointsSpent: 0,
    activeUsersToday: 0,
    averageLevel: 0,
    topRanks: {},
  });
  const [loading, setLoading] = useState(true);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch users
        const usersSnap = await getDocs(collection(db, 'users'));
        const users = usersSnap.docs.map(doc => doc.data());
        
        // Fetch products
        const productsSnap = await getDocs(collection(db, 'products'));
        
        // Fetch purchases
        const purchasesSnap = await getDocs(collection(db, 'purchases'));
        const purchases = purchasesSnap.docs.map(doc => doc.data());
        
        // Calculate stats
        const today = new Date().toISOString().split('T')[0];
        const activeToday = users.filter(u => u.lastActiveDate === today).length;
        const avgLevel = users.length > 0 
          ? users.reduce((sum, u) => sum + (u.level || 1), 0) / users.length 
          : 0;
        const totalSpent = purchases.reduce((sum, p) => sum + (p.price || 0), 0);
        
        // Rank distribution
        const ranks: Record<string, number> = {};
        users.forEach(u => {
          const rank = u.rank || 'bronze';
          ranks[rank] = (ranks[rank] || 0) + 1;
        });

        setStats({
          totalUsers: users.length,
          totalProducts: productsSnap.size,
          totalPurchases: purchasesSnap.size,
          totalPointsSpent: totalSpent,
          activeUsersToday: activeToday,
          averageLevel: Math.round(avgLevel * 10) / 10,
          topRanks: ranks,
        });

        // Recent users
        const recentUsersQuery = query(
          collection(db, 'users'),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const recentSnap = await getDocs(recentUsersQuery);
        setRecentUsers(recentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Total de Usuários',
      value: stats.totalUsers,
      icon: Users,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Ativos Hoje',
      value: stats.activeUsersToday,
      icon: Activity,
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'Produtos',
      value: stats.totalProducts,
      icon: ShoppingBag,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      title: 'Compras',
      value: stats.totalPurchases,
      icon: DollarSign,
      color: 'text-gold',
      bgColor: 'bg-gold/10',
    },
    {
      title: 'Pontos Gastos',
      value: stats.totalPointsSpent.toLocaleString(),
      icon: TrendingUp,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Nível Médio',
      value: stats.averageLevel,
      icon: Award,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat, index) => (
          <Card 
            key={stat.title} 
            variant="gradient"
            className="animate-fade-in"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`h-12 w-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Rank Distribution */}
        <Card variant="gradient">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              Distribuição de Ranks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {['diamond', 'platinum', 'gold', 'silver', 'bronze'].map(rank => {
                const count = stats.topRanks[rank] || 0;
                const percentage = stats.totalUsers > 0 
                  ? (count / stats.totalUsers) * 100 
                  : 0;
                
                return (
                  <div key={rank} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize font-medium">{rank}</span>
                      <span className="text-muted-foreground">
                        {count} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          rank === 'diamond' ? 'bg-rank-diamond' :
                          rank === 'platinum' ? 'bg-rank-platinum' :
                          rank === 'gold' ? 'bg-gradient-gold' :
                          rank === 'silver' ? 'bg-silver' :
                          'bg-bronze'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Users */}
        <Card variant="gradient">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-accent" />
              Usuários Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentUsers.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Nenhum usuário ainda
                </p>
              ) : (
                recentUsers.map(user => (
                  <div 
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-gradient-gold flex items-center justify-center text-primary-foreground font-bold">
                        {user.displayName?.[0] || 'U'}
                      </div>
                      <div>
                        <p className="font-medium">{user.displayName || 'Sem nome'}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">{user.points || 0} pts</p>
                      <p className="text-xs text-muted-foreground capitalize">{user.rank || 'bronze'}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
