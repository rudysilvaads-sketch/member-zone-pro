import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Lock, CheckCircle, AlertCircle, Shield } from 'lucide-react';
import { LaCasaLogo } from '@/components/LaCasaLogo';
import authBackground from '@/assets/auth-background.jpg';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [email, setEmail] = useState('');
  
  const oobCode = searchParams.get('oobCode');
  
  // Password strength validation
  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  };
  
  const isPasswordStrong = Object.values(passwordChecks).every(Boolean);
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  useEffect(() => {
    const verifyCode = async () => {
      if (!oobCode) {
        setError('Link inválido ou expirado. Solicite um novo link de recuperação.');
        setVerifying(false);
        return;
      }

      try {
        const userEmail = await verifyPasswordResetCode(auth, oobCode);
        setEmail(userEmail);
        setVerifying(false);
      } catch (err: any) {
        console.error('Error verifying code:', err);
        if (err.code === 'auth/expired-action-code') {
          setError('Este link expirou. Solicite um novo link de recuperação.');
        } else if (err.code === 'auth/invalid-action-code') {
          setError('Link inválido. Este link já foi usado ou é inválido.');
        } else {
          setError('Erro ao verificar o link. Tente solicitar um novo.');
        }
        setVerifying(false);
      }
    };

    verifyCode();
  }, [oobCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isPasswordStrong) {
      setError('A senha não atende aos requisitos mínimos de segurança.');
      return;
    }

    if (!passwordsMatch) {
      setError('As senhas não coincidem.');
      return;
    }

    if (!oobCode) {
      setError('Código de verificação não encontrado.');
      return;
    }

    setLoading(true);

    try {
      await confirmPasswordReset(auth, oobCode, password);
      setSuccess(true);
    } catch (err: any) {
      console.error('Error resetting password:', err);
      if (err.code === 'auth/expired-action-code') {
        setError('Este link expirou. Solicite um novo link de recuperação.');
      } else if (err.code === 'auth/weak-password') {
        setError('A senha é muito fraca. Escolha uma senha mais forte.');
      } else {
        setError('Erro ao redefinir a senha. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${authBackground})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/90 to-background/95" />
      
      {/* Animated glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-primary/10 rounded-full blur-[100px] animate-pulse delay-1000" />
      
      {/* Main Card */}
      <div className="relative w-full max-w-md">
        {/* Animated border */}
        <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-primary/50 via-primary to-primary/50 opacity-75 blur-sm animate-pulse" />
        <div className="absolute -inset-[1px] rounded-2xl overflow-hidden">
          <div 
            className="absolute inset-0"
            style={{
              background: 'conic-gradient(from 0deg, transparent, hsl(var(--primary)), transparent 30%)',
              animation: 'spin 4s linear infinite',
            }}
          />
        </div>
        
        <div className="relative bg-card/80 backdrop-blur-xl rounded-2xl p-8 border border-border/50 shadow-2xl">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <LaCasaLogo size="md" />
          </div>
          
          {/* Icon Badge */}
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center">
              {success ? (
                <CheckCircle className="w-8 h-8 text-primary" />
              ) : (
                <Shield className="w-8 h-8 text-primary" />
              )}
            </div>
          </div>

          {verifying ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Verificando link...</p>
            </div>
          ) : success ? (
            <div className="text-center space-y-4">
              <h1 className="text-2xl font-bold text-foreground">
                Senha Alterada!
              </h1>
              <p className="text-muted-foreground">
                Sua senha foi redefinida com sucesso. Você já pode fazer login com sua nova senha.
              </p>
              <Button
                onClick={() => navigate('/auth')}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-primary/25"
              >
                Ir para Login
              </Button>
            </div>
          ) : error && !email ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-destructive/20 border border-destructive/30 flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">
                Link Inválido
              </h1>
              <p className="text-muted-foreground">{error}</p>
              <Button
                onClick={() => navigate('/auth')}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-primary/25"
              >
                Voltar para Login
              </Button>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  Nova Senha
                </h1>
                <p className="text-muted-foreground text-sm">
                  Crie uma nova senha para <span className="text-primary">{email}</span>
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* New Password */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground font-medium">
                    Nova Senha
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-10 pr-10 h-12 bg-background/50 border-border/50 focus:border-primary transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Password Strength Indicators */}
                {password.length > 0 && (
                  <div className="space-y-2 p-3 rounded-lg bg-background/30 border border-border/30">
                    <p className="text-xs font-medium text-muted-foreground mb-2">Requisitos da senha:</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className={`flex items-center gap-1.5 ${passwordChecks.length ? 'text-primary' : 'text-muted-foreground'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${passwordChecks.length ? 'bg-primary' : 'bg-muted-foreground/50'}`} />
                        8+ caracteres
                      </div>
                      <div className={`flex items-center gap-1.5 ${passwordChecks.uppercase ? 'text-primary' : 'text-muted-foreground'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${passwordChecks.uppercase ? 'bg-primary' : 'bg-muted-foreground/50'}`} />
                        Letra maiúscula
                      </div>
                      <div className={`flex items-center gap-1.5 ${passwordChecks.lowercase ? 'text-primary' : 'text-muted-foreground'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${passwordChecks.lowercase ? 'bg-primary' : 'bg-muted-foreground/50'}`} />
                        Letra minúscula
                      </div>
                      <div className={`flex items-center gap-1.5 ${passwordChecks.number ? 'text-primary' : 'text-muted-foreground'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${passwordChecks.number ? 'bg-primary' : 'bg-muted-foreground/50'}`} />
                        Número
                      </div>
                    </div>
                  </div>
                )}

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-foreground font-medium">
                    Confirmar Senha
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`pl-10 pr-10 h-12 bg-background/50 border-border/50 focus:border-primary transition-colors ${
                        confirmPassword.length > 0 && !passwordsMatch ? 'border-destructive' : ''
                      }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {confirmPassword.length > 0 && !passwordsMatch && (
                    <p className="text-xs text-destructive">As senhas não coincidem</p>
                  )}
                  {passwordsMatch && (
                    <p className="text-xs text-primary flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Senhas coincidem
                    </p>
                  )}
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                    {error}
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading || !isPasswordStrong || !passwordsMatch}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3 h-12 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      Redefinindo...
                    </div>
                  ) : (
                    'Redefinir Senha'
                  )}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* CSS for spin animation */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ResetPassword;
