import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Search, Star, Lock, CheckCircle, Coins, Package, Sparkles, Crown, Gem, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { getProducts, purchaseProduct, getUserPurchases, Product, Purchase } from "@/lib/firebaseServices";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const rankOrder = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
const rankConfig: Record<string, { color: string; bg: string; label: string }> = {
  bronze: { color: "text-orange-400", bg: "bg-orange-500/20", label: "Bronze" },
  silver: { color: "text-slate-300", bg: "bg-slate-400/20", label: "Prata" },
  gold: { color: "text-yellow-400", bg: "bg-yellow-500/20", label: "Ouro" },
  platinum: { color: "text-cyan-400", bg: "bg-cyan-500/20", label: "Platina" },
  diamond: { color: "text-purple-400", bg: "bg-purple-500/20", label: "Diamante" },
};

const Products = () => {
  const { userProfile, refreshProfile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [search, setSearch] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [purchasing, setPurchasing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'available' | 'purchased'>('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsData, purchasesData] = await Promise.all([
          getProducts(),
          userProfile ? getUserPurchases(userProfile.uid) : Promise.resolve([])
        ]);
        setProducts(productsData);
        setPurchases(purchasesData);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userProfile]);

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description.toLowerCase().includes(search.toLowerCase())
  );

  const canPurchase = (product: Product): { allowed: boolean; reason?: string } => {
    if (!userProfile) return { allowed: false, reason: "Faça login" };
    if (userProfile.points < product.price) return { allowed: false, reason: "Pontos insuficientes" };
    
    if (product.requiredRank) {
      const userRankIndex = rankOrder.indexOf(userProfile.rank?.toLowerCase() || 'bronze');
      const requiredRankIndex = rankOrder.indexOf(product.requiredRank.toLowerCase());
      if (userRankIndex < requiredRankIndex) {
        return { allowed: false, reason: `Requer ${product.requiredRank}` };
      }
    }
    
    return { allowed: true };
  };

  const handlePurchase = async () => {
    if (!selectedProduct || !userProfile) return;
    
    setPurchasing(true);
    try {
      const result = await purchaseProduct(userProfile.uid, selectedProduct);
      if (result.success) {
        toast.success('Compra realizada com sucesso!');
        await refreshProfile();
        const updatedPurchases = await getUserPurchases(userProfile.uid);
        setPurchases(updatedPurchases);
        setSelectedProduct(null);
      } else {
        toast.error(result.error || 'Erro ao realizar compra');
      }
    } catch (error) {
      toast.error('Erro ao processar compra');
    } finally {
      setPurchasing(false);
    }
  };

  const isPurchased = (productId: string) => purchases.some(p => p.productId === productId);

  const getDisplayProducts = () => {
    let displayProducts = filteredProducts;
    
    if (filter === 'available') {
      displayProducts = displayProducts.filter(p => canPurchase(p).allowed && !isPurchased(p.id));
    } else if (filter === 'purchased') {
      displayProducts = displayProducts.filter(p => isPurchased(p.id));
    }
    
    return displayProducts;
  };

  const featuredProducts = getDisplayProducts().filter(p => p.featured);
  const regularProducts = getDisplayProducts().filter(p => !p.featured);

  return (
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'pl-20' : 'pl-64'}`}>
        <Header />
        
        <main className="p-6 space-y-8">
          {/* Hero Section */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20 p-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-primary/20 backdrop-blur-sm">
                    <Gem className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                      Vitrine de Recompensas
                    </h1>
                    <p className="text-muted-foreground">
                      Troque seus pontos por prêmios exclusivos
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 px-6 py-4 rounded-xl bg-background/80 backdrop-blur-sm border border-border/50 shadow-lg">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Coins className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Seus pontos</p>
                  <p className="text-2xl font-bold text-primary">{userProfile?.points?.toLocaleString() || 0}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar recompensas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-12 h-12 text-base rounded-xl border-border/50 bg-background/50 backdrop-blur-sm"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === 'all' ? 'default' : 'outline'}
                onClick={() => setFilter('all')}
                className="rounded-xl"
              >
                <ShoppingBag className="h-4 w-4 mr-2" />
                Todos
              </Button>
              <Button
                variant={filter === 'available' ? 'default' : 'outline'}
                onClick={() => setFilter('available')}
                className="rounded-xl"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Disponíveis
              </Button>
              <Button
                variant={filter === 'purchased' ? 'default' : 'outline'}
                onClick={() => setFilter('purchased')}
                className="rounded-xl"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Minhas Compras
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="aspect-[4/5] bg-muted/30 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {/* Featured Products */}
              {featuredProducts.length > 0 && (
                <section className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-yellow-500/20">
                      <Crown className="h-5 w-5 text-yellow-500" />
                    </div>
                    <h2 className="text-xl font-bold">Destaques</h2>
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {featuredProducts.map(product => (
                      <ShowcaseCard 
                        key={product.id} 
                        product={product} 
                        canPurchase={canPurchase(product)}
                        isPurchased={isPurchased(product.id)}
                        onSelect={() => setSelectedProduct(product)}
                        featured
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* Regular Products */}
              {regularProducts.length > 0 && (
                <section className="space-y-4">
                  {featuredProducts.length > 0 && (
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/20">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                      <h2 className="text-xl font-bold">Todas as Recompensas</h2>
                    </div>
                  )}
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {regularProducts.map(product => (
                      <ShowcaseCard 
                        key={product.id} 
                        product={product} 
                        canPurchase={canPurchase(product)}
                        isPurchased={isPurchased(product.id)}
                        onSelect={() => setSelectedProduct(product)}
                      />
                    ))}
                  </div>
                </section>
              )}

              {getDisplayProducts().length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="py-16 text-center">
                    <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      <Package className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Nenhum produto encontrado</h3>
                    <p className="text-muted-foreground">
                      {filter === 'purchased' 
                        ? "Você ainda não fez nenhuma compra" 
                        : filter === 'available' 
                          ? "Nenhum produto disponível no momento"
                          : "Tente ajustar sua busca"}
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </main>
      </div>

      {/* Purchase Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gem className="h-5 w-5 text-primary" />
              Confirmar Resgate
            </DialogTitle>
            <DialogDescription>
              Você está prestes a trocar seus pontos por esta recompensa
            </DialogDescription>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="space-y-4">
              <div className="relative rounded-xl overflow-hidden">
                <img 
                  src={selectedProduct.image} 
                  alt={selectedProduct.name}
                  className="w-full h-48 object-cover"
                />
                {selectedProduct.featured && (
                  <Badge className="absolute top-3 left-3 bg-yellow-500 text-yellow-950">
                    <Star className="h-3 w-3 mr-1" />
                    Destaque
                  </Badge>
                )}
              </div>
              <div>
                <h3 className="font-bold text-xl">{selectedProduct.name}</h3>
                <p className="text-muted-foreground mt-1">{selectedProduct.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-primary/10 rounded-xl text-center">
                  <p className="text-sm text-muted-foreground">Custo</p>
                  <p className="text-2xl font-bold text-primary">
                    {selectedProduct.price.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">pontos</p>
                </div>
                <div className={cn(
                  "p-4 rounded-xl text-center",
                  (userProfile?.points || 0) - selectedProduct.price >= 0 
                    ? "bg-green-500/10" 
                    : "bg-destructive/10"
                )}>
                  <p className="text-sm text-muted-foreground">Saldo após</p>
                  <p className={cn(
                    "text-2xl font-bold",
                    (userProfile?.points || 0) - selectedProduct.price >= 0 
                      ? "text-green-500" 
                      : "text-destructive"
                  )}>
                    {((userProfile?.points || 0) - selectedProduct.price).toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">pontos</p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSelectedProduct(null)} className="rounded-xl">
              Cancelar
            </Button>
            <Button 
              onClick={handlePurchase} 
              disabled={purchasing || !selectedProduct || !canPurchase(selectedProduct!).allowed}
              className="rounded-xl"
            >
              {purchasing ? 'Processando...' : 'Confirmar Resgate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface ShowcaseCardProps {
  product: Product;
  canPurchase: { allowed: boolean; reason?: string };
  isPurchased: boolean;
  onSelect: () => void;
  featured?: boolean;
}

const ShowcaseCard = ({ product, canPurchase, isPurchased, onSelect, featured }: ShowcaseCardProps) => {
  const rankStyle = product.requiredRank 
    ? rankConfig[product.requiredRank.toLowerCase()] 
    : null;

  return (
    <Card className={cn(
      "group overflow-hidden rounded-2xl border-border/50 transition-all duration-300",
      "hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 hover:border-primary/30",
      featured && "border-yellow-500/30 bg-gradient-to-b from-yellow-500/5 to-transparent",
      isPurchased && "border-green-500/30 bg-gradient-to-b from-green-500/5 to-transparent"
    )}>
      {/* Image Container */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img 
          src={product.image} 
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60" />
        
        {/* Featured Badge */}
        {featured && (
          <Badge className="absolute top-3 left-3 bg-yellow-500/90 backdrop-blur-sm text-yellow-950 shadow-lg">
            <Star className="h-3 w-3 mr-1 fill-yellow-950" />
            Destaque
          </Badge>
        )}
        
        {/* Rank Badge */}
        {product.requiredRank && rankStyle && (
          <Badge className={cn("absolute top-3 right-3 backdrop-blur-sm shadow-lg", rankStyle.bg, rankStyle.color)}>
            <Lock className="h-3 w-3 mr-1" />
            {rankStyle.label}
          </Badge>
        )}
        
        {/* Purchased Overlay */}
        {isPurchased && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
            <Badge className="bg-green-500/90 backdrop-blur-sm text-white px-4 py-2 text-base shadow-lg">
              <CheckCircle className="h-5 w-5 mr-2" />
              Resgatado
            </Badge>
          </div>
        )}
      </div>
      
      {/* Content */}
      <CardContent className="p-5 space-y-4">
        <div>
          <h3 className="font-bold text-lg leading-tight line-clamp-1">{product.name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1.5 min-h-[40px]">
            {product.description}
          </p>
        </div>
        
        {/* Price & Action */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center gap-2">
            <Coins className="h-5 w-5 text-primary" />
            <span className="text-xl font-bold text-primary">
              {product.price.toLocaleString()}
            </span>
          </div>
          <Button 
            size="sm"
            variant={isPurchased ? "outline" : canPurchase.allowed ? "default" : "secondary"}
            disabled={!canPurchase.allowed || isPurchased}
            onClick={onSelect}
            className="rounded-xl"
          >
            {isPurchased ? 'Resgatado' : canPurchase.allowed ? 'Resgatar' : canPurchase.reason}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default Products;
