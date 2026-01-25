import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { ShoppingBag, Lock, Sparkles, Loader2 } from "lucide-react";
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
    <Card variant="gradient" className="animate-fade-in" style={{ animationDelay: "400ms" }}>
      <CardHeader className="flex flex-row items-center justify-between py-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShoppingBag className="h-4 w-4 text-[#BFFF00]" />
          <span className="text-white">Loja de</span>
          <span className="text-[#BFFF00] italic">Recompensas</span>
        </CardTitle>
        <a href="/products" className="text-xs text-[#BFFF00] hover:underline">
          Ver loja
        </a>
      </CardHeader>
      <CardContent className="pt-0 px-2">
        <div className="relative px-8">
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
            <CarouselContent className="-ml-2">
              {products.map((product, index) => {
                const hasAccess = canAccessProduct(userRank, product.requiredRank);
                const canAfford = userPoints >= product.price;
                const isAvailable = product.available && hasAccess;
                
                return (
                  <CarouselItem key={product.id} className="pl-2 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5">
                    <div
                      className="group relative overflow-hidden rounded-xl border border-white/10 bg-white/5 transition-all duration-300 hover:border-[#BFFF00]/30 hover:shadow-[0_0_20px_rgba(191,255,0,0.1)]"
                    >
                      {product.featured && (
                        <div className="absolute left-1.5 top-1.5 z-10">
                          <Badge variant="gold" className="text-[10px] px-1.5 py-0.5 flex items-center gap-0.5">
                            <Sparkles className="h-2.5 w-2.5" />
                            Destaque
                          </Badge>
                        </div>
                      )}
                      {!hasAccess && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0a0a0a]/80 backdrop-blur-sm">
                          <div className="text-center">
                            <Lock className="mx-auto h-5 w-5 text-white/30" />
                            <p className="mt-1 text-xs font-medium text-white/50">
                              Requer {product.requiredRank}
                            </p>
                          </div>
                        </div>
                      )}
                      <div className="aspect-[4/3] overflow-hidden">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                      <div className="p-2.5">
                        <h3 className="font-medium text-sm text-white truncate">{product.name}</h3>
                        <p className="mt-0.5 text-xs text-white/50 line-clamp-1">
                          {product.description}
                        </p>
                        <div className="mt-2 flex items-center justify-between">
                          <div>
                            <span className={`text-sm font-bold ${canAfford ? 'text-[#BFFF00]' : 'text-red-400'}`}>
                              {product.price.toLocaleString()}
                            </span>
                            <span className="ml-0.5 text-[10px] text-white/40">
                              pts
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant={isAvailable && canAfford ? "gold" : "secondary"}
                            disabled={!isAvailable || !canAfford || purchasingId === product.id}
                            onClick={() => handlePurchase(product)}
                            className="h-6 text-[10px] px-2"
                          >
                            {purchasingId === product.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : !hasAccess ? (
                              "Bloqueado"
                            ) : !canAfford ? (
                              "Sem pontos"
                            ) : (
                              "Resgatar"
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            <CarouselPrevious className="left-0 bg-[#0a0a0a]/80 border-white/10 text-white hover:bg-[#BFFF00]/20 hover:text-[#BFFF00] hover:border-[#BFFF00]/30" />
            <CarouselNext className="right-0 bg-[#0a0a0a]/80 border-white/10 text-white hover:bg-[#BFFF00]/20 hover:text-[#BFFF00] hover:border-[#BFFF00]/30" />
          </Carousel>
        </div>
      </CardContent>
    </Card>
  );
}
