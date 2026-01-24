import { useState } from "react";
import { useTheme } from "next-themes";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Settings as SettingsIcon, User, Bell, Shield, Palette, Save, Mail, Key, Trash2, LogOut, Sun, Moon, Monitor, Sparkles, Frame } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AvatarSelector } from "@/components/settings/AvatarSelector";
import { FrameSelector } from "@/components/settings/FrameSelector";
import { getFrameById } from "@/lib/frameData";

const rankConfig: Record<string, { color: string; bg: string; label: string }> = {
  bronze: { color: "text-orange-400", bg: "bg-orange-500/20", label: "Bronze" },
  silver: { color: "text-slate-300", bg: "bg-slate-400/20", label: "Prata" },
  gold: { color: "text-yellow-400", bg: "bg-yellow-500/20", label: "Ouro" },
  platinum: { color: "text-cyan-400", bg: "bg-cyan-500/20", label: "Platina" },
  diamond: { color: "text-purple-400", bg: "bg-purple-500/20", label: "Diamante" },
};

const Settings = () => {
  const { user, userProfile, logout, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Form states
  const [displayName, setDisplayName] = useState(userProfile?.displayName || "");
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    missions: true,
    achievements: true,
    ranking: false,
  });

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { displayName });
      await refreshProfile();
      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar alterações');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logout realizado com sucesso!');
      navigate('/auth');
    } catch (error) {
      toast.error('Erro ao fazer logout');
    }
  };

  const rankStyle = rankConfig[userProfile?.rank || 'bronze'];

  return (
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'pl-20' : 'pl-64'}`}>
        <Header />
        
        <main className="p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <SettingsIcon className="h-8 w-8 text-primary" />
              Configurações
            </h1>
            <p className="mt-1 text-muted-foreground">
              Gerencie sua conta e preferências
            </p>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full max-w-2xl grid-cols-6">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Perfil</span>
              </TabsTrigger>
              <TabsTrigger value="avatars" className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">Avatares</span>
              </TabsTrigger>
              <TabsTrigger value="frames" className="flex items-center gap-2">
                <Frame className="h-4 w-4" />
                <span className="hidden sm:inline">Molduras</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">Notificações</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span className="hidden sm:inline">Segurança</span>
              </TabsTrigger>
              <TabsTrigger value="appearance" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                <span className="hidden sm:inline">Aparência</span>
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Profile Card */}
                <Card className="lg:col-span-1">
                  <CardContent className="pt-6 text-center">
                    <div className="relative inline-flex items-center justify-center">
                      {(() => {
                        const frame = getFrameById(userProfile?.currentFrameId || 'frame-none');
                        return (
                          <div className={cn("avatar-frame-wrapper", frame?.animationClass)}>
                            <Avatar 
                              className={cn(
                                "h-24 w-24 avatar-with-frame",
                                frame?.borderStyle,
                                frame?.glowStyle
                              )}
                            >
                              <AvatarImage src={userProfile?.photoURL || undefined} />
                              <AvatarFallback className="text-2xl bg-primary/20">
                                {userProfile?.displayName?.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        );
                      })()}
                    </div>
                    <h3 className="mt-4 font-bold text-lg">{userProfile?.displayName}</h3>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                    <Badge className={cn("mt-2", rankStyle?.bg, rankStyle?.color)}>
                      {rankStyle?.label || 'Bronze'}
                    </Badge>
                    
                    <Separator className="my-6" />
                    
                    <div className="space-y-3 text-left">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Pontos</span>
                        <span className="font-semibold">{userProfile?.points?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Nível</span>
                        <span className="font-semibold">{userProfile?.level || 1}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">XP Total</span>
                        <span className="font-semibold">{userProfile?.xp || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Conquistas</span>
                        <span className="font-semibold">{userProfile?.achievements?.length || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Streak</span>
                        <span className="font-semibold">{userProfile?.streakDays || 0} dias</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Edit Profile Form */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Informações Pessoais</CardTitle>
                    <CardDescription>
                      Atualize suas informações de perfil
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="displayName">Nome de exibição</Label>
                        <Input 
                          id="displayName"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder="Seu nome"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input 
                          id="email"
                          value={user?.email || ""}
                          disabled
                          className="bg-muted"
                        />
                      </div>
                    </div>
                    
                    <Button onClick={handleSaveProfile} disabled={saving}>
                      <Save className="h-4 w-4 mr-2" />
                      {saving ? 'Salvando...' : 'Salvar Alterações'}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notifications">
              <Card>
                <CardHeader>
                  <CardTitle>Preferências de Notificação</CardTitle>
                  <CardDescription>
                    Escolha como você quer ser notificado
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Notificações por Email</Label>
                      <p className="text-sm text-muted-foreground">
                        Receba atualizações importantes por email
                      </p>
                    </div>
                    <Switch 
                      checked={notifications.email}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, email: checked }))}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Notificações Push</Label>
                      <p className="text-sm text-muted-foreground">
                        Receba alertas no navegador
                      </p>
                    </div>
                    <Switch 
                      checked={notifications.push}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, push: checked }))}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Missões Diárias</Label>
                      <p className="text-sm text-muted-foreground">
                        Lembrete de missões pendentes
                      </p>
                    </div>
                    <Switch 
                      checked={notifications.missions}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, missions: checked }))}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Conquistas</Label>
                      <p className="text-sm text-muted-foreground">
                        Aviso ao desbloquear conquistas
                      </p>
                    </div>
                    <Switch 
                      checked={notifications.achievements}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, achievements: checked }))}
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Atualizações de Ranking</Label>
                      <p className="text-sm text-muted-foreground">
                        Notificar mudanças na sua posição
                      </p>
                    </div>
                    <Switch 
                      checked={notifications.ranking}
                      onCheckedChange={(checked) => setNotifications(prev => ({ ...prev, ranking: checked }))}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Segurança da Conta</CardTitle>
                    <CardDescription>
                      Gerencie a segurança da sua conta
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button variant="outline" className="w-full justify-start">
                      <Key className="h-4 w-4 mr-2" />
                      Alterar Senha
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Mail className="h-4 w-4 mr-2" />
                      Verificar Email
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-destructive/50">
                  <CardHeader>
                    <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
                    <CardDescription>
                      Ações irreversíveis na sua conta
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button variant="outline" onClick={handleLogout} className="w-full justify-start text-destructive hover:text-destructive">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sair da Conta
                    </Button>
                    <Button variant="destructive" className="w-full justify-start">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir Conta
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Avatars Tab */}
            <TabsContent value="avatars">
              <AvatarSelector />
            </TabsContent>

            {/* Frames Tab */}
            <TabsContent value="frames">
              <FrameSelector />
            </TabsContent>

            {/* Appearance Tab */}
            <TabsContent value="appearance">
              <AppearanceSettings />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

const AppearanceSettings = () => {
  const { theme, setTheme } = useTheme();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Aparência</CardTitle>
        <CardDescription>
          Personalize a aparência da plataforma
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label>Tema</Label>
          <div className="grid grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className={cn(
                "h-20 flex-col gap-2",
                theme === 'light' && "border-primary ring-2 ring-primary"
              )}
              onClick={() => setTheme('light')}
            >
              <div className="w-10 h-10 rounded-lg bg-white border-2 flex items-center justify-center">
                <Sun className="h-5 w-5 text-yellow-500" />
              </div>
              <span className="text-xs font-medium">Claro</span>
            </Button>
            <Button 
              variant="outline" 
              className={cn(
                "h-20 flex-col gap-2",
                theme === 'dark' && "border-primary ring-2 ring-primary"
              )}
              onClick={() => setTheme('dark')}
            >
              <div className="w-10 h-10 rounded-lg bg-slate-900 border-2 border-slate-700 flex items-center justify-center">
                <Moon className="h-5 w-5 text-slate-300" />
              </div>
              <span className="text-xs font-medium">Escuro</span>
            </Button>
            <Button 
              variant="outline" 
              className={cn(
                "h-20 flex-col gap-2",
                theme === 'system' && "border-primary ring-2 ring-primary"
              )}
              onClick={() => setTheme('system')}
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-white to-slate-900 border-2 flex items-center justify-center">
                <Monitor className="h-5 w-5 text-foreground" />
              </div>
              <span className="text-xs font-medium">Sistema</span>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            {theme === 'system' 
              ? 'O tema será ajustado automaticamente de acordo com as preferências do seu sistema.' 
              : `Tema ${theme === 'dark' ? 'escuro' : 'claro'} selecionado.`
            }
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default Settings;
