import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Crown, Mail, Lock, User, AlertCircle, Gift, Sparkles, Trophy, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function Auth() {
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref') || '';
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  // Auto-switch to signup if coming from referral link
  useEffect(() => {
    if (referralCode) {
      setIsLogin(false);
    }
  }, [referralCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
        toast.success('Login realizado com sucesso!');
      } else {
        if (!displayName.trim()) {
          setError('Por favor, insira seu nome');
          setLoading(false);
          return;
        }
        await signUp(email, password, displayName, referralCode || undefined);
        toast.success('Conta criada com sucesso!');
      }
      navigate('/');
    } catch (err: any) {
      console.error('Auth error:', err);
      
      // Handle Firebase auth errors
      switch (err.code) {
        case 'auth/user-not-found':
          setError('Usuário não encontrado');
          break;
        case 'auth/wrong-password':
          setError('Senha incorreta');
          break;
        case 'auth/email-already-in-use':
          setError('Este email já está em uso');
          break;
        case 'auth/weak-password':
          setError('A senha deve ter pelo menos 6 caracteres');
          break;
        case 'auth/invalid-email':
          setError('Email inválido');
          break;
        case 'auth/invalid-credential':
          setError('Email ou senha incorretos');
          break;
        default:
          setError('Ocorreu um erro. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/20 via-background to-accent/10 p-12 flex-col justify-between relative overflow-hidden">
        {/* Decorative Elements */}
        <div className="absolute top-20 right-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        
        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
              <Crown className="h-7 w-7 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold">
              <span className="text-primary">MEMBER</span>
              <span className="text-foreground">SHIP</span>
            </span>
          </div>
        </div>
        
        {/* Features */}
        <div className="relative z-10 space-y-8">
          <h1 className="text-4xl font-bold leading-tight">
            Sua jornada de
            <br />
            <span className="text-primary">sucesso</span> começa aqui
          </h1>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50">
              <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Trophy className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Sistema de Ranking</h3>
                <p className="text-sm text-muted-foreground">Suba de nível e destaque-se</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50">
              <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Missões Diárias</h3>
                <p className="text-sm text-muted-foreground">Complete tarefas e ganhe recompensas</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-4 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50">
              <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Produtos Exclusivos</h3>
                <p className="text-sm text-muted-foreground">Acesse conteúdos premium</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="relative z-10 text-sm text-muted-foreground">
          © 2024 Membership. Todos os direitos reservados.
        </div>
      </div>
      
      {/* Right Side - Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center">
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
                <Crown className="h-7 w-7 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold">
                <span className="text-primary">MEMBER</span>
                <span className="text-foreground">SHIP</span>
              </span>
            </div>
          </div>
          
          {/* Header */}
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold">
              {isLogin ? 'Bem-vindo de volta!' : 'Crie sua conta'}
            </h2>
            <p className="text-muted-foreground mt-2">
              {isLogin 
                ? 'Entre para acessar sua área exclusiva'
                : referralCode
                  ? 'Você foi convidado para a nossa comunidade!'
                  : 'Junte-se à nossa comunidade exclusiva'
              }
            </p>
          </div>
          
          {/* Referral Badge */}
          {referralCode && !isLogin && (
            <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-primary/10 border border-primary/20">
              <Gift className="h-5 w-5 text-primary" />
              <span className="text-sm text-primary font-medium">
                Convite especial aplicado!
              </span>
            </div>
          )}
          
          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/20">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
              <span className="text-sm text-destructive">{error}</span>
            </div>
          )}
          
          {/* Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">Nome completo</Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Digite seu nome"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="pl-12 h-12 rounded-xl bg-secondary/50 border-border/50"
                  />
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 h-12 rounded-xl bg-secondary/50 border-border/50"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 h-12 rounded-xl bg-secondary/50 border-border/50"
                  required
                  minLength={6}
                />
              </div>
              {isLogin && (
                <div className="text-right">
                  <button type="button" className="text-sm text-primary hover:underline">
                    Esqueceu a senha?
                  </button>
                </div>
              )}
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-12 rounded-xl text-base font-semibold bg-primary hover:bg-primary/90" 
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Carregando...
                </div>
              ) : isLogin ? (
                'Entrar'
              ) : (
                'Criar conta'
              )}
            </Button>
          </form>
          
          {/* Toggle Auth Mode */}
          <p className="text-center text-sm text-muted-foreground">
            {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}{' '}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-primary hover:underline font-semibold"
            >
              {isLogin ? 'Criar conta' : 'Fazer login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
