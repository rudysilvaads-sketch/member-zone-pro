import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, ArrowLeft, Search, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LaCasaLogo } from "@/components/LaCasaLogo";
import authBackground from "@/assets/auth-background.jpg";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30"
        style={{ backgroundImage: `url(${authBackground})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/70 to-black/80" />
      
      {/* Ambient glow effects */}
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-[#F5A623]/10 rounded-full blur-[150px] animate-pulse" />
      <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-[#F5A623]/5 rounded-full blur-[120px] animate-pulse delay-1000" />
      
      {/* Content */}
      <div className="relative z-10 w-full max-w-lg text-center">
        {/* Logo */}
        <div className="mb-8">
          <LaCasaLogo size="lg" />
        </div>
        
        {/* Glass Card */}
        <div className="relative">
          {/* Animated border */}
          <div 
            className="absolute -inset-[1px] rounded-2xl"
            style={{
              background: 'conic-gradient(from var(--border-angle, 0deg), #F5A623 0%, transparent 25%, transparent 75%, #F5A623 100%)',
              animation: 'border-rotate 3s linear infinite',
            }}
          />
          
          <div className="relative backdrop-blur-xl bg-[#0a0a0a]/95 rounded-2xl p-8 md:p-12">
            {/* Error Icon */}
            <div className="mx-auto w-20 h-20 rounded-full bg-[#F5A623]/10 border border-[#F5A623]/30 flex items-center justify-center mb-6">
              <AlertTriangle className="w-10 h-10 text-[#F5A623]" />
            </div>
            
            {/* 404 Number */}
            <h1 className="text-8xl md:text-9xl font-black italic text-white mb-2 drop-shadow-[0_0_30px_rgba(255,255,255,0.2)]">
              4<span className="text-[#F5A623]">0</span>4
            </h1>
            
            {/* Message */}
            <h2 className="text-xl md:text-2xl font-bold text-white mb-3">
              Página não encontrada
            </h2>
            <p className="text-white/60 mb-2">
              A página que você está procurando não existe ou foi movida.
            </p>
            <p className="text-white/40 text-sm mb-8">
              Caminho: <code className="text-[#F5A623]/80 bg-white/5 px-2 py-1 rounded">{location.pathname}</code>
            </p>
            
            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                asChild
                className="bg-[#F5A623] hover:bg-[#F5A623]/90 text-black font-semibold shadow-[0_0_20px_rgba(245,166,35,0.3)] hover:shadow-[0_0_30px_rgba(245,166,35,0.5)] transition-all duration-300 group"
              >
                <Link to="/">
                  <Home className="w-4 h-4 mr-2" />
                  Ir para Dashboard
                </Link>
              </Button>
              
              <Button
                asChild
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10 hover:text-white transition-all duration-300"
              >
                <Link to="/auth">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar ao Login
                </Link>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Help Text */}
        <p className="mt-8 text-white/40 text-sm flex items-center justify-center gap-2">
          <Search className="w-4 h-4" />
          Precisa de ajuda? Entre em contato com o suporte.
        </p>
      </div>

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
};

export default NotFound;