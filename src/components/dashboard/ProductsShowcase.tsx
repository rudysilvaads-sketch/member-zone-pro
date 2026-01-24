import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Lock, Sparkles, Loader2 } from "lucide-react";
import { getProducts, purchaseProduct, Product } from "@/lib/firebaseServices";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

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
    name: 'Avatar Ninja',
    description: 'Avatar exclusivo estilo ninja com máscara e olhos brilhantes',
    price: 800,
    image: 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=400&h=400&fit=crop',
    available: true,
    category: 'avatars',
    featured: true,
  },
  {
    id: '2',
    name: 'Tema Neon',
    description: 'Tema visual neon cyberpunk para seu dashboard',
    price: 750,
    image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=400&fit=crop',
    available: true,
    category: 'items',
  },
  {
    id: '3',
    name: 'Mentoria Individual',
    description: '1 hora de mentoria com especialista da área',
    price: 3000,
    image: 'https://images.unsplash.com/photo-1552581234-26160f608093?w=400&h=400&fit=crop',
    available: true,
    category: 'benefits',
    requiredRank: 'platinum',
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
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <ShoppingBag className="h-5 w-5 text-primary" />
          Loja de Recompensas
        </CardTitle>
        <a href="/products" className="text-sm text-primary hover:underline">
          Ver loja
        </a>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {products.map((product, index) => {
            const hasAccess = canAccessProduct(userRank, product.requiredRank);
            const canAfford = userPoints >= product.price;
            const isAvailable = product.available && hasAccess;
            
            return (
              <div
                key={product.id}
                className="group relative overflow-hidden rounded-lg border border-border bg-secondary transition-all duration-300 hover:border-primary/50 hover:shadow-glow-gold animate-scale-in"
                style={{ animationDelay: `${(index + 8) * 100}ms` }}
              >
                {product.featured && (
                  <div className="absolute left-2 top-2 z-10">
                    <Badge variant="gold" className="flex items-center gap-1">
                      <Sparkles className="h-3 w-3" />
                      Destaque
                    </Badge>
                  </div>
                )}
                {!hasAccess && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                    <div className="text-center">
                      <Lock className="mx-auto h-8 w-8 text-muted-foreground" />
                      <p className="mt-2 text-sm font-medium">
                        Requer {product.requiredRank}
                      </p>
                    </div>
                  </div>
                )}
                <div className="aspect-video overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-semibold">{product.name}</h3>
                  <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                    {product.description}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <span className={`text-lg font-bold ${canAfford ? 'text-primary' : 'text-destructive'}`}>
                        {product.price.toLocaleString()}
                      </span>
                      <span className="ml-1 text-xs text-muted-foreground">
                        pontos
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant={isAvailable && canAfford ? "gold" : "secondary"}
                      disabled={!isAvailable || !canAfford || purchasingId === product.id}
                      onClick={() => handlePurchase(product)}
                    >
                      {purchasingId === product.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
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
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
