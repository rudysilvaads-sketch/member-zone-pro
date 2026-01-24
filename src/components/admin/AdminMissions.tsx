import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Target, 
  Plus, 
  Edit, 
  Trash2, 
  Zap,
  BookOpen,
  MessageSquare,
  Share2,
  Trophy,
  Loader2
} from 'lucide-react';
import { collection, getDocs, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';

interface Mission {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  pointsReward: number;
  type: 'daily' | 'weekly' | 'special';
  requirement: number;
  icon: string;
  active: boolean;
}

const iconOptions = [
  { value: 'zap', label: 'Raio', icon: Zap },
  { value: 'book', label: 'Livro', icon: BookOpen },
  { value: 'message', label: 'Mensagem', icon: MessageSquare },
  { value: 'share', label: 'Compartilhar', icon: Share2 },
  { value: 'trophy', label: 'Troféu', icon: Trophy },
  { value: 'target', label: 'Alvo', icon: Target },
];

const emptyMission: Omit<Mission, 'id'> = {
  title: '',
  description: '',
  xpReward: 50,
  pointsReward: 25,
  type: 'daily',
  requirement: 1,
  icon: 'zap',
  active: true,
};

export function AdminMissions() {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMission, setEditingMission] = useState<Mission | null>(null);
  const [formData, setFormData] = useState<Omit<Mission, 'id'>>(emptyMission);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMissions();
  }, []);

  const fetchMissions = async () => {
    try {
      const missionsSnap = await getDocs(collection(db, 'missions'));
      const missionsData = missionsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Mission[];
      
      setMissions(missionsData);
    } catch (error) {
      console.error('Error fetching missions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingMission(null);
    setFormData(emptyMission);
    setDialogOpen(true);
  };

  const handleOpenEdit = (mission: Mission) => {
    setEditingMission(mission);
    setFormData({
      title: mission.title,
      description: mission.description,
      xpReward: mission.xpReward,
      pointsReward: mission.pointsReward,
      type: mission.type,
      requirement: mission.requirement,
      icon: mission.icon,
      active: mission.active,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title) {
      toast.error('Preencha o título');
      return;
    }

    setSaving(true);
    try {
      if (editingMission) {
        await updateDoc(doc(db, 'missions', editingMission.id), formData);
        toast.success('Missão atualizada!');
      } else {
        const docId = formData.title.toLowerCase().replace(/\s+/g, '-');
        await setDoc(doc(db, 'missions', docId), formData);
        toast.success('Missão criada!');
      }
      
      setDialogOpen(false);
      fetchMissions();
    } catch (error) {
      console.error('Error saving mission:', error);
      toast.error('Erro ao salvar missão');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (mission: Mission) => {
    if (!confirm(`Excluir "${mission.title}"?`)) return;
    
    try {
      await deleteDoc(doc(db, 'missions', mission.id));
      toast.success('Missão excluída!');
      fetchMissions();
    } catch (error) {
      console.error('Error deleting mission:', error);
      toast.error('Erro ao excluir missão');
    }
  };

  const getIcon = (iconName: string) => {
    const found = iconOptions.find(i => i.value === iconName);
    return found ? found.icon : Zap;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'daily': return 'gold';
      case 'weekly': return 'accent';
      case 'special': return 'diamond';
      default: return 'secondary';
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <Badge variant="secondary">{missions.length} missões</Badge>
        <Button variant="gold" onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Missão
        </Button>
      </div>

      {/* Missions List */}
      <Card variant="gradient">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-accent" />
            Gerenciar Missões
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {missions.length === 0 ? (
              <div className="text-center py-8">
                <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhuma missão cadastrada</p>
                <Button variant="gold" className="mt-4" onClick={handleOpenCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Missão
                </Button>
              </div>
            ) : (
              missions.map((mission, index) => {
                const Icon = getIcon(mission.icon);
                
                return (
                  <div 
                    key={mission.id}
                    className={`flex items-center gap-4 p-4 rounded-lg bg-secondary/50 animate-fade-in ${
                      !mission.active ? 'opacity-50' : ''
                    }`}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-gold">
                      <Icon className="h-6 w-6 text-primary-foreground" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{mission.title}</p>
                        <Badge variant={getTypeColor(mission.type) as any} className="text-[10px]">
                          {mission.type.toUpperCase()}
                        </Badge>
                        {!mission.active && (
                          <Badge variant="secondary" className="text-[10px]">Inativa</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{mission.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Requisito: {mission.requirement}x
                      </p>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-bold text-primary">+{mission.xpReward} XP</p>
                      <p className="text-sm text-muted-foreground">+{mission.pointsReward} pts</p>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEdit(mission)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(mission)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingMission ? 'Editar Missão' : 'Nova Missão'}
            </DialogTitle>
            <DialogDescription>
              Configure os detalhes da missão
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Nome da missão"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição da missão"
                rows={2}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Diária</SelectItem>
                    <SelectItem value="weekly">Semanal</SelectItem>
                    <SelectItem value="special">Especial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Ícone</Label>
                <Select
                  value={formData.icon}
                  onValueChange={(value) => setFormData({ ...formData, icon: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {iconOptions.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          <opt.icon className="h-4 w-4" />
                          {opt.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>XP</Label>
                <Input
                  type="number"
                  value={formData.xpReward}
                  onChange={(e) => setFormData({ ...formData, xpReward: Number(e.target.value) })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Pontos</Label>
                <Input
                  type="number"
                  value={formData.pointsReward}
                  onChange={(e) => setFormData({ ...formData, pointsReward: Number(e.target.value) })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Requisito</Label>
                <Input
                  type="number"
                  value={formData.requirement}
                  onChange={(e) => setFormData({ ...formData, requirement: Number(e.target.value) })}
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button variant="gold" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
