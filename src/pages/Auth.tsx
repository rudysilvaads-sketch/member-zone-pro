import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Mail, Lock, User, AlertCircle, Gift, Sparkles, Loader2, CheckCircle, Shield, Eye, EyeOff, ArrowRight, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { LaCasaLogo } from '@/components/LaCasaLogo';
import authBackground from '@/assets/auth-background.jpg';

export default function Auth() {
  const [searchParams] = useSearchParams();
  const referralCode = searchParams.get('ref') || '';
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  
  const { signIn, signUp, resetPassword } = useAuth();
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
        if (!acceptedTerms) {
          setError('Você precisa aceitar os termos de uso para continuar');
          setLoading(false);
          return;
        }
        await signUp(email, password, displayName, referralCode || undefined);
        toast.success('Conta criada com sucesso!');
      }
      navigate('/');
    } catch (err: any) {
      console.error('Auth error:', err);
      
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
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${authBackground})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-black/70" />
      
      {/* Ambient glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#F5A623]/10 rounded-full blur-[150px]" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#F5A623]/5 rounded-full blur-[120px]" />
      
      {/* Logo */}
      <div className="relative z-10 mb-8">
        <LaCasaLogo size="xl" />
      </div>
      
      {/* Glass Card with Animated Border */}
      <div className="relative z-10 w-full max-w-md">
        {/* Animated gradient border - orange theme */}
        <div 
          className="absolute -inset-[1px] rounded-2xl"
          style={{
            background: 'conic-gradient(from var(--border-angle, 0deg), #F5A623 0%, transparent 25%, transparent 75%, #F5A623 100%)',
            animation: 'border-rotate 3s linear infinite',
          }}
        />
        <div className="relative backdrop-blur-2xl bg-black/40 border border-white/10 rounded-2xl p-8 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
          {/* Badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#F5A623]/10 border border-[#F5A623]/30">
              <Zap className="h-4 w-4 text-[#F5A623]" />
              <span className="text-sm text-[#F5A623] font-medium">Área de Membros</span>
            </div>
          </div>
          
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white">
              {isLogin ? 'Bem-vindo de volta' : 'Crie sua conta'}
            </h2>
            <p className="text-white/60 mt-2 text-sm">
              {isLogin ? (
                <>
                  <span className="text-[#F5A623]">Estratégias, ferramentas</span> e <span className="text-[#F5A623]">automação</span>: tudo para criar <span className="text-white font-medium">canais dark lucrativos</span>
                </>
              ) : referralCode ? (
                <>Você foi convidado para <span className="text-[#F5A623]">dominar o YouTube</span>!</>
              ) : (
                <>Aprenda a criar <span className="text-[#F5A623]">canais dark</span> de sucesso</>
              )}
            </p>
            <p className="text-white/40 text-xs mt-1">
              {isLogin ? 'Acesse sua conta para continuar' : 'Preencha os dados abaixo'}
            </p>
          </div>
          
          {/* Referral Badge */}
          {referralCode && !isLogin && (
            <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#F5A623]/10 border border-[#F5A623]/30 mb-6">
              <Gift className="h-5 w-5 text-[#F5A623]" />
              <span className="text-sm text-[#F5A623] font-medium">
                Convite especial aplicado!
              </span>
            </div>
          )}
          
          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 mb-6">
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
              <span className="text-sm text-red-400">{error}</span>
            </div>
          )}
          
          {/* Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-white/80">Nome completo</Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Digite seu nome"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="pl-12 h-12 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#F5A623]/50 focus:ring-[#F5A623]/20"
                  />
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-white/80">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 h-12 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#F5A623]/50 focus:ring-[#F5A623]/20"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-white/80">Senha</Label>
                {isLogin && (
                  <button 
                    type="button" 
                    className="text-xs text-[#F5A623] hover:underline"
                    onClick={() => {
                      setResetEmail(email);
                      setResetDialogOpen(true);
                      setResetSent(false);
                    }}
                  >
                    Esqueceu a senha?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 pr-12 h-12 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#F5A623]/50 focus:ring-[#F5A623]/20"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            
            {!isLogin && (
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="terms"
                  checked={acceptedTerms}
                  onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                  className="mt-0.5 border-white/20 data-[state=checked]:bg-[#F5A623] data-[state=checked]:border-[#F5A623]"
                />
                <label
                  htmlFor="terms"
                  className="text-sm text-white/60 leading-relaxed cursor-pointer"
                >
                  Li e aceito os{' '}
                  <Link to="/terms" className="text-[#F5A623] hover:underline" target="_blank">
                    Termos de Uso
                  </Link>{' '}
                  e a{' '}
                  <Link to="/privacy" className="text-[#F5A623] hover:underline" target="_blank">
                    Política de Privacidade
                  </Link>
                </label>
              </div>
            )}
            
            <Button
              type="submit" 
              className="w-full h-12 rounded-xl text-base font-semibold bg-[#F5A623] hover:bg-[#F5A623]/90 text-black transition-all duration-300 shadow-[0_0_30px_rgba(245,166,35,0.3)] hover:shadow-[0_0_40px_rgba(245,166,35,0.5)] group" 
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Carregando...
                </div>
              ) : isLogin ? (
                <div className="flex items-center gap-2">
                  Entrar
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  Criar conta
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </Button>
          </form>
          
          {/* Toggle Auth Mode */}
          <p className="text-center text-sm text-white/60 mt-6">
            {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}{' '}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              className="text-[#F5A623] hover:underline font-semibold"
            >
              {isLogin ? 'Criar conta' : 'Fazer login'}
            </button>
          </p>
        </div>
      </div>
      
      {/* Footer */}
      <div className="relative z-10 mt-8 flex items-center gap-2 text-white/40 text-xs">
        <Shield className="h-4 w-4" />
        <span>Protegido por criptografia de ponta a ponta</span>
      </div>

      {/* Reset Password Dialog */}
      <Dialog open={resetDialogOpen} onOpenChange={(open) => {
        setResetDialogOpen(open);
        if (!open) {
          setResetSent(false);
        }
      }}>
        <DialogContent className="sm:max-w-md bg-[#1a1a1a] border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Mail className="h-5 w-5 text-[#F5A623]" />
              Recuperar Senha
            </DialogTitle>
            <DialogDescription className="text-white/60">
              {resetSent 
                ? "Email enviado! Verifique sua caixa de entrada."
                : "Digite seu email para receber o link de recuperação."
              }
            </DialogDescription>
          </DialogHeader>

          {resetSent ? (
            <div className="py-8 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-[#F5A623]/10 flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-[#F5A623]" />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-white">Email Enviado!</h3>
              <p className="text-sm text-white/60 mb-4">
                Enviamos um link de recuperação para <strong className="text-white">{resetEmail}</strong>.
                <br />
                Verifique sua caixa de entrada e spam.
              </p>
              <Button 
                onClick={() => setResetDialogOpen(false)} 
                className="w-full bg-[#F5A623] hover:bg-[#F5A623]/90 text-black"
              >
                Voltar ao Login
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="reset-email" className="text-white/80">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="pl-12 h-12 rounded-xl bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-[#F5A623]/50 focus:ring-[#F5A623]/20"
                      required
                    />
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setResetDialogOpen(false)} className="border-white/10 text-white hover:bg-white/5">
                  Cancelar
                </Button>
                <Button 
                  onClick={async () => {
                    if (!resetEmail) {
                      toast.error('Digite seu email');
                      return;
                    }
                    setResetLoading(true);
                    try {
                      await resetPassword(resetEmail);
                      setResetSent(true);
                    } catch (err: any) {
                      if (err.code === 'auth/user-not-found') {
                        toast.error('Email não encontrado');
                      } else if (err.code === 'auth/invalid-email') {
                        toast.error('Email inválido');
                      } else {
                        toast.error('Erro ao enviar email. Tente novamente.');
                      }
                    } finally {
                      setResetLoading(false);
                    }
                  }}
                  disabled={resetLoading}
                  className="bg-[#F5A623] hover:bg-[#F5A623]/90 text-black"
                >
                  {resetLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    'Enviar Link'
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* CSS Animation */}
      <style>{`
        @property --border-angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }
        
        @keyframes border-rotate {
          to {
            --border-angle: 360deg;
          }
        }
      `}</style>
    </div>
  );
}