import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { ShoppingBag, Lock, Sparkles, Loader2, Zap, Crown, ArrowRight } from "lucide-react";
import { getProducts, purchaseProduct, Product } from "@/lib/firebaseServices";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import Autoplay from "embla-carousel-autoplay";

interface ProductsShowcaseProps {
  userRank: string;
  userPoints: number;
}

const rankOrder = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];

const canAccessProduct = (userRank: string, requiredRank?: string): boolean => {
  if (!requiredRank) return true;
  const userRankIndex = rankOrder.indexOf(userRank.toLowerCase());
  const requiredRankIndex = rankOrder.indexOf(requiredRank.toLowerCase());
  return userRankIndex >= requiredRankIndex;
};

// Default products for display when Firebase is not configured
const defaultProducts: Product[] = [
  {
    id: '1',
    name: 'Google VO3 Ultra',
    description: '45.000 créditos para geração de vídeos com IA',
    price: 5000,
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/480px-Google_%22G%22_logo.svg.png',
    available: true,
    category: 'benefits',
    featured: true,
  },
  {
    id: '2',
    name: 'CapCut Pro 30 Dias',
    description: 'Acesso completo ao CapCut Pro por 30 dias',
    price: 2500,
    image: 'https://sf16-va.tiktokcdn.com/obj/eden-va2/uvpohwj/ljhwZthlaukjlkulzlp/PC/Logo.png',
    available: true,
    category: 'benefits',
    featured: true,
  },
  {
    id: '3',
    name: 'ChatGPT Pro 30 Dias',
    description: 'Acesso ao ChatGPT Pro por 30 dias',
    price: 3500,
    image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/ChatGPT_logo.svg/480px-ChatGPT_logo.svg.png',
    available: true,
    category: 'benefits',
    featured: true,
  },
];

export function ProductsShowcase({ userRank, userPoints }: ProductsShowcaseProps) {
  const [products, setProducts] = useState<Product[]>(defaultProducts);
  const [loading, setLoading] = useState(false);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const fetchedProducts = await getProducts();
        if (fetchedProducts.length > 0) {
          setProducts(fetchedProducts);
        }
      } catch (error) {
        console.log('Using default products');
      }
    };

    fetchProducts();
  }, []);

  const handlePurchase = async (product: Product) => {
    if (!user) {
      toast.error('Você precisa estar logado');
      return;
    }

    if (userPoints < product.price) {
      toast.error('Pontos insuficientes');
      return;
    }

    if (!canAccessProduct(userRank, product.requiredRank)) {
      toast.error(`Requer rank ${product.requiredRank}`);
      return;
    }

    setPurchasingId(product.id);
    
    try {
      const result = await purchaseProduct(user.uid, product);
      
      if (result.success) {
        toast.success(`${product.name} resgatado com sucesso!`);
      } else {
        toast.error(result.error || 'Erro ao processar compra');
      }
    } catch (error) {
      toast.error('Erro ao processar compra');
    } finally {
      setPurchasingId(null);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl animate-fade-in" style={{ animationDelay: "400ms" }}>
      {/* Animated border effect */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#BFFF00]/20 via-[#BFFF00]/5 to-[#BFFF00]/20 animate-pulse" />
      <div className="absolute inset-[1px] rounded-2xl bg-gradient-to-br from-[#0a0a0a] via-[#111111] to-[#0a0a0a]" />
      
      {/* Content */}
      <div className="relative">
        {/* Header with glow effect */}
        <div className="relative px-5 py-4 border-b border-[#BFFF00]/10">
          {/* Glow decoration */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-[#BFFF00]/50 to-transparent" />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-[#BFFF00]/20 blur-lg rounded-full" />
                <div className="relative p-2 rounded-xl bg-gradient-to-br from-[#BFFF00]/20 to-[#BFFF00]/5 border border-[#BFFF00]/20">
                  <ShoppingBag className="h-5 w-5 text-[#BFFF00]" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">
                  Vitrine <span className="text-[#BFFF00] italic">Premium</span>
                </h3>
                <p className="text-xs text-white/40">Ferramentas exclusivas para membros</p>
              </div>
            </div>
            <a 
              href="/products" 
              className="group flex items-center gap-1.5 text-sm font-medium text-[#BFFF00] hover:text-[#BFFF00]/80 transition-colors"
            >
              Ver tudo
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>
        </div>

        {/* Carousel section */}
        <div className="p-4">
          <div className="relative px-10">
            <Carousel
              opts={{
                align: "start",
                loop: true,
              }}
              plugins={[
                Autoplay({
                  delay: 4000,
                  stopOnInteraction: false,
                  stopOnMouseEnter: true,
                }),
              ]}
              className="w-full"
            >
              <CarouselContent className="-ml-3">
                {products.map((product, index) => {
                  const hasAccess = canAccessProduct(userRank, product.requiredRank);
                  const canAfford = userPoints >= product.price;
                  const isAvailable = product.available && hasAccess;
                  
                  return (
                    <CarouselItem key={product.id} className="pl-3 basis-[85%] sm:basis-[45%] lg:basis-[16%]">
                      <div className="group relative">
                        {/* Card glow on hover */}
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#BFFF00]/0 via-[#BFFF00]/20 to-[#BFFF00]/0 rounded-2xl opacity-0 group-hover:opacity-100 blur-sm transition-opacity duration-500" />
                        
                        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.02] backdrop-blur-sm transition-all duration-500 group-hover:border-[#BFFF00]/30 group-hover:shadow-[0_0_30px_rgba(191,255,0,0.1)]">
                          {/* Featured badge */}
                          {product.featured && (
                            <div className="absolute right-2 top-2 z-10">
                              <Badge className="bg-gradient-to-r from-[#BFFF00] to-[#9FDF00] text-black text-[10px] px-2 py-0.5 font-bold flex items-center gap-1 shadow-[0_0_10px_rgba(191,255,0,0.3)]">
                                <Zap className="h-2.5 w-2.5" />
                                HOT
                              </Badge>
                            </div>
                          )}
                          
                          {/* Locked overlay */}
                          {!hasAccess && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0a0a0a]/90 backdrop-blur-md">
                              <div className="text-center">
                                <div className="mx-auto w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-2">
                                  <Lock className="h-5 w-5 text-white/40" />
                                </div>
                                <p className="text-xs font-medium text-white/50">
                                  Requer <span className="text-[#BFFF00]">{product.requiredRank}</span>
                                </p>
                              </div>
                            </div>
                          )}
                          
                          {/* Product image with overlay gradient */}
                          <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-br from-white/5 to-transparent">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            {/* Bottom gradient */}
                            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
                          </div>
                          
                          {/* Product info */}
                          <div className="relative px-4 pt-4 pb-3">
                            <h4 className="font-bold text-sm text-white truncate group-hover:text-[#BFFF00] transition-colors">
                              {product.name}
                            </h4>
                            <p className="mt-1 text-xs text-white/50 line-clamp-1">
                              {product.description}
                            </p>
                            
                            {/* Price and action */}
                            <div className="mt-3 flex items-center justify-between gap-2">
                              <div className="flex items-baseline gap-1">
                                <Crown className={`h-3.5 w-3.5 ${canAfford ? 'text-[#BFFF00]' : 'text-red-400'}`} />
                                <span className={`text-base font-black ${canAfford ? 'text-[#BFFF00]' : 'text-red-400'}`}>
                                  {product.price.toLocaleString()}
                                </span>
                                <span className="text-[10px] text-white/40 font-medium">pts</span>
                              </div>
                              <Button
                                size="sm"
                                variant={isAvailable && canAfford ? "gold" : "secondary"}
                                disabled={!isAvailable || !canAfford || purchasingId === product.id}
                                onClick={() => handlePurchase(product)}
                                className={`h-7 text-[10px] px-3 font-bold ${
                                  isAvailable && canAfford 
                                    ? 'shadow-[0_0_15px_rgba(191,255,0,0.3)]' 
                                    : ''
                                }`}
                              >
                                {purchasingId === product.id ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : !hasAccess ? (
                                  "Bloqueado"
                                ) : !canAfford ? (
                                  "Sem pts"
                                ) : (
                                  "Resgatar"
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
              
              {/* Custom navigation arrows */}
              <CarouselPrevious className="left-0 h-8 w-8 bg-[#0a0a0a]/90 border-[#BFFF00]/20 text-white hover:bg-[#BFFF00] hover:text-black hover:border-[#BFFF00] transition-all duration-300 shadow-[0_0_20px_rgba(0,0,0,0.5)]" />
              <CarouselNext className="right-0 h-8 w-8 bg-[#0a0a0a]/90 border-[#BFFF00]/20 text-white hover:bg-[#BFFF00] hover:text-black hover:border-[#BFFF00] transition-all duration-300 shadow-[0_0_20px_rgba(0,0,0,0.5)]" />
            </Carousel>
          </div>
          
          {/* Bottom decoration */}
          <div className="mt-4 flex justify-center">
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/5">
              <Sparkles className="h-3 w-3 text-[#BFFF00]/60" />
              <span className="text-[10px] text-white/40 font-medium">
                Novos produtos toda semana
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}