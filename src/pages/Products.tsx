import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ShoppingBag, Search, Star, Lock, CheckCircle, Coins, ShoppingCart, Package } from "lucide-react";
import { cn } from "@/lib/utils";
import { getProducts, purchaseProduct, getUserPurchases, Product, Purchase } from "@/lib/firebaseServices";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const rankOrder = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
const rankConfig: Record<string, { color: string; bg: string }> = {
  bronze: { color: "text-orange-400", bg: "bg-orange-500/20" },
  silver: { color: "text-slate-300", bg: "bg-slate-400/20" },
  gold: { color: "text-yellow-400", bg: "bg-yellow-500/20" },
  platinum: { color: "text-cyan-400", bg: "bg-cyan-500/20" },
  diamond: { color: "text-purple-400", bg: "bg-purple-500/20" },
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

  const featuredProducts = filteredProducts.filter(p => p.featured);
  const regularProducts = filteredProducts.filter(p => !p.featured);

  const canPurchase = (product: Product): { allowed: boolean; reason?: string } => {
    if (!userProfile) return { allowed: false, reason: "Faça login para comprar" };
    if (userProfile.points < product.price) return { allowed: false, reason: "Pontos insuficientes" };
    
    if (product.requiredRank) {
      const userRankIndex = rankOrder.indexOf(userProfile.rank?.toLowerCase() || 'bronze');
      const requiredRankIndex = rankOrder.indexOf(product.requiredRank.toLowerCase());
      if (userRankIndex < requiredRankIndex) {
        return { allowed: false, reason: `Requer rank ${product.requiredRank}` };
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

  return (
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'pl-20' : 'pl-64'}`}>
        <Header />
        
        <main className="p-6">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <ShoppingBag className="h-8 w-8 text-primary" />
                Loja de Produtos
              </h1>
              <p className="mt-1 text-muted-foreground">
                Troque seus pontos por recompensas exclusivas
              </p>
            </div>
            <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-lg">
              <Coins className="h-5 w-5 text-primary" />
              <span className="font-bold text-lg">{userProfile?.points?.toLocaleString() || 0}</span>
              <span className="text-muted-foreground">pontos</span>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar produtos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <Tabs defaultValue="all" className="mb-6">
            <TabsList>
              <TabsTrigger value="all">Todos</TabsTrigger>
              <TabsTrigger value="available">Disponíveis para mim</TabsTrigger>
              <TabsTrigger value="purchased">Minhas Compras</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              {loading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-72 bg-muted/50 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : (
                <>
                  {/* Featured Products */}
                  {featuredProducts.length > 0 && (
                    <div className="mb-8">
                      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                        <Star className="h-5 w-5 text-yellow-400" />
                        Destaques
                      </h2>
                      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {featuredProducts.map(product => (
                          <ProductCard 
                            key={product.id} 
                            product={product} 
                            canPurchase={canPurchase(product)}
                            isPurchased={isPurchased(product.id)}
                            onSelect={() => setSelectedProduct(product)}
                            featured
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Regular Products */}
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {regularProducts.map(product => (
                      <ProductCard 
                        key={product.id} 
                        product={product} 
                        canPurchase={canPurchase(product)}
                        isPurchased={isPurchased(product.id)}
                        onSelect={() => setSelectedProduct(product)}
                      />
                    ))}
                  </div>

                  {filteredProducts.length === 0 && (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">Nenhum produto encontrado</p>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </TabsContent>
            
            <TabsContent value="available">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredProducts
                  .filter(p => canPurchase(p).allowed && !isPurchased(p.id))
                  .map(product => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      canPurchase={canPurchase(product)}
                      isPurchased={false}
                      onSelect={() => setSelectedProduct(product)}
                    />
                  ))}
              </div>
            </TabsContent>
            
            <TabsContent value="purchased">
              {purchases.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Você ainda não fez nenhuma compra</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {purchases.map(purchase => (
                    <Card key={purchase.id}>
                      <CardContent className="flex items-center justify-between p-4">
                        <div>
                          <p className="font-semibold">{purchase.productName}</p>
                          <p className="text-sm text-muted-foreground">
                            {purchase.purchasedAt?.toDate?.().toLocaleDateString('pt-BR') || 'Data indisponível'}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-primary">
                          -{purchase.price} pontos
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Purchase Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Compra</DialogTitle>
            <DialogDescription>
              Você está prestes a trocar seus pontos por este produto
            </DialogDescription>
          </DialogHeader>
          
          {selectedProduct && (
            <div className="space-y-4">
              <img 
                src={selectedProduct.image} 
                alt={selectedProduct.name}
                className="w-full h-40 object-cover rounded-lg"
              />
              <div>
                <h3 className="font-bold text-lg">{selectedProduct.name}</h3>
                <p className="text-muted-foreground">{selectedProduct.description}</p>
              </div>
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <span>Custo:</span>
                <span className="font-bold text-xl text-primary">
                  {selectedProduct.price.toLocaleString()} pontos
                </span>
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <span>Seus pontos após compra:</span>
                <span className={cn(
                  "font-bold",
                  (userProfile?.points || 0) - selectedProduct.price < 0 ? "text-destructive" : "text-green-500"
                )}>
                  {((userProfile?.points || 0) - selectedProduct.price).toLocaleString()}
                </span>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedProduct(null)}>
              Cancelar
            </Button>
            <Button 
              onClick={handlePurchase} 
              disabled={purchasing || !canPurchase(selectedProduct!).allowed}
            >
              {purchasing ? 'Processando...' : 'Confirmar Compra'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface ProductCardProps {
  product: Product;
  canPurchase: { allowed: boolean; reason?: string };
  isPurchased: boolean;
  onSelect: () => void;
  featured?: boolean;
}

const ProductCard = ({ product, canPurchase, isPurchased, onSelect, featured }: ProductCardProps) => {
  const rankStyle = product.requiredRank 
    ? rankConfig[product.requiredRank.toLowerCase()] 
    : null;

  return (
    <Card className={cn(
      "overflow-hidden transition-all hover:shadow-lg",
      featured && "border-yellow-500/30 bg-gradient-to-b from-yellow-500/5 to-transparent",
      isPurchased && "border-green-500/30"
    )}>
      <div className="relative">
        <img 
          src={product.image} 
          alt={product.name}
          className="w-full h-40 object-cover"
        />
        {featured && (
          <Badge className="absolute top-2 left-2 bg-yellow-500 text-yellow-950">
            <Star className="h-3 w-3 mr-1" />
            Destaque
          </Badge>
        )}
        {isPurchased && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Badge className="bg-green-500 text-white">
              <CheckCircle className="h-4 w-4 mr-1" />
              Comprado
            </Badge>
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-bold">{product.name}</h3>
        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
          {product.description}
        </p>
        
        {product.requiredRank && rankStyle && (
          <Badge className={cn("mt-2", rankStyle.bg, rankStyle.color)}>
            <Lock className="h-3 w-3 mr-1" />
            Requer {product.requiredRank}
          </Badge>
        )}
        
        <div className="flex items-center justify-between mt-4">
          <span className="text-xl font-bold text-primary">
            {product.price.toLocaleString()} pts
          </span>
          <Button 
            size="sm"
            disabled={!canPurchase.allowed || isPurchased}
            onClick={onSelect}
          >
            {isPurchased ? 'Comprado' : canPurchase.allowed ? 'Comprar' : canPurchase.reason}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default Products;
