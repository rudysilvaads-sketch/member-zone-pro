import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Label } from '@/components/ui/label';
import { 
  Users, 
  Search, 
  Edit, 
  Trash2, 
  Crown,
  Plus,
  Minus,
  Loader2,
  Shield,
  ShieldCheck,
  UserCog,
  ChevronDown
} from 'lucide-react';
import { collection, getDocs, doc, updateDoc, deleteDoc, increment } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

type UserRole = 'user' | 'moderator' | 'admin';

interface User {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  points: number;
  xp: number;
  level: number;
  rank: string;
  streakDays: number;
  role?: UserRole;
  isAdmin?: boolean;
  isModerator?: boolean;
  createdAt: any;
}

const getRoleFromUser = (user: User): UserRole => {
  if (user.isAdmin || user.role === 'admin') return 'admin';
  if (user.isModerator || user.role === 'moderator') return 'moderator';
  return 'user';
};

const roleConfig: Record<UserRole, { label: string; icon: React.ElementType; color: string }> = {
  admin: { label: 'Admin', icon: Shield, color: 'text-destructive' },
  moderator: { label: 'Moderador', icon: ShieldCheck, color: 'text-primary' },
  user: { label: 'Usuário', icon: UserCog, color: 'text-muted-foreground' },
};

export function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [pointsToAdd, setPointsToAdd] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter(user => 
      user.displayName?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [search, users]);

  const fetchUsers = async () => {
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const usersData = usersSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      
      // Sort by points descending
      usersData.sort((a, b) => (b.points || 0) - (a.points || 0));
      
      setUsers(usersData);
      setFilteredUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPoints = async () => {
    if (!editingUser || pointsToAdd === 0) return;
    
    setSaving(true);
    try {
      const userRef = doc(db, 'users', editingUser.id);
      await updateDoc(userRef, {
        points: increment(pointsToAdd),
      });
      
      toast.success(`${pointsToAdd > 0 ? '+' : ''}${pointsToAdd} pontos para ${editingUser.displayName}`);
      setEditingUser(null);
      setPointsToAdd(0);
      fetchUsers();
    } catch (error) {
      console.error('Error updating points:', error);
      toast.error('Erro ao atualizar pontos');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Tem certeza que deseja excluir ${user.displayName}?`)) return;
    
    try {
      await deleteDoc(doc(db, 'users', user.id));
      toast.success('Usuário excluído com sucesso');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Erro ao excluir usuário');
    }
  };

  const handleChangeRole = async (user: User, newRole: UserRole) => {
    const currentRole = getRoleFromUser(user);
    if (currentRole === newRole) return;
    
    const roleLabels: Record<UserRole, string> = {
      admin: 'Admin',
      moderator: 'Moderador',
      user: 'Usuário'
    };
    
    if (!confirm(`Alterar ${user.displayName} de ${roleLabels[currentRole]} para ${roleLabels[newRole]}?`)) return;
    
    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        role: newRole,
        isAdmin: newRole === 'admin',
        isModerator: newRole === 'moderator',
      });
      
      toast.success(`${user.displayName} agora é ${roleLabels[newRole]}!`);
      fetchUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Erro ao atualizar cargo');
    }
  };

  const getBadgeVariant = (rank: string) => {
    switch (rank?.toLowerCase()) {
      case 'diamond': return 'diamond';
      case 'platinum': return 'platinum';
      case 'gold': return 'gold';
      case 'silver': return 'silver';
      default: return 'bronze';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="secondary">{filteredUsers.length} usuários</Badge>
      </div>

      {/* Users List */}
      <Card variant="gradient">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Gerenciar Usuários
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredUsers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum usuário encontrado
              </p>
            ) : (
              filteredUsers.map((user, index) => (
                <div 
                  key={user.id}
                  className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50 animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <span className="text-lg font-bold text-muted-foreground w-8">
                    #{index + 1}
                  </span>
                  
                  <Avatar className="h-12 w-12 border-2 border-border">
                    <AvatarImage src={user.photoURL || undefined} />
                    <AvatarFallback>{user.displayName?.[0] || 'U'}</AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{user.displayName || 'Sem nome'}</p>
                      <Badge variant={getBadgeVariant(user.rank) as any} className="text-[10px]">
                        {user.rank?.toUpperCase() || 'BRONZE'}
                      </Badge>
                      {(() => {
                        const role = getRoleFromUser(user);
                        const config = roleConfig[role];
                        if (role === 'user') return null;
                        return (
                          <Badge 
                            variant={role === 'admin' ? 'destructive' : 'secondary'} 
                            className="text-[10px]"
                          >
                            <config.icon className="h-3 w-3 mr-1" />
                            {config.label.toUpperCase()}
                          </Badge>
                        );
                      })()}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                      <span>Nível {user.level || 1}</span>
                      <span>{user.xp || 0} XP</span>
                      <span>Streak: {user.streakDays || 0} dias</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-xl font-bold text-primary">{(user.points || 0).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">pontos</p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Role Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="gap-1">
                          {(() => {
                            const role = getRoleFromUser(user);
                            const config = roleConfig[role];
                            return (
                              <>
                                <config.icon className={`h-4 w-4 ${config.color}`} />
                                <ChevronDown className="h-3 w-3" />
                              </>
                            );
                          })()}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => handleChangeRole(user, 'user')}
                          className={getRoleFromUser(user) === 'user' ? 'bg-accent' : ''}
                        >
                          <UserCog className="h-4 w-4 mr-2 text-muted-foreground" />
                          Usuário
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleChangeRole(user, 'moderator')}
                          className={getRoleFromUser(user) === 'moderator' ? 'bg-accent' : ''}
                        >
                          <ShieldCheck className="h-4 w-4 mr-2 text-primary" />
                          Moderador
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleChangeRole(user, 'admin')}
                          className={getRoleFromUser(user) === 'admin' ? 'bg-accent' : ''}
                        >
                          <Shield className="h-4 w-4 mr-2 text-destructive" />
                          Admin
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingUser(user);
                        setPointsToAdd(0);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDeleteUser(user)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Points Dialog */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Pontos</DialogTitle>
            <DialogDescription>
              Adicione ou remova pontos de {editingUser?.displayName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPointsToAdd(prev => prev - 100)}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <div className="text-center">
                <p className="text-3xl font-bold">
                  {pointsToAdd > 0 ? '+' : ''}{pointsToAdd}
                </p>
                <p className="text-sm text-muted-foreground">pontos</p>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPointsToAdd(prev => prev + 100)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex justify-center gap-2">
              {[50, 100, 500, 1000].map(amount => (
                <Button
                  key={amount}
                  variant="secondary"
                  size="sm"
                  onClick={() => setPointsToAdd(amount)}
                >
                  +{amount}
                </Button>
              ))}
            </div>
            
            <div className="text-center text-sm text-muted-foreground">
              Novo total: {((editingUser?.points || 0) + pointsToAdd).toLocaleString()} pontos
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancelar
            </Button>
            <Button 
              variant="gold" 
              onClick={handleAddPoints}
              disabled={pointsToAdd === 0 || saving}
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
