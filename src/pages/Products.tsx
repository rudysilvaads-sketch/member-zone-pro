import { useEffect, useState, useRef } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Search, Lock, CheckCircle, Coins, Package, Sparkles, Crown, Gem, ShoppingBag, User, Gift, BookOpen, Box, Play, Wrench, Star, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getProducts, purchaseProduct, getUserPurchases, Product, Purchase, ProductCategory } from "@/lib/firebaseServices";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import Autoplay from "embla-carousel-autoplay";

const rankOrder = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];

const categoryConfig: Record<ProductCategory, { label: string; icon: React.ElementType }> = {
  avatars: { label: "Avatares", icon: User },
  items: { label: "Itens", icon: Box },
  benefits: { label: "Benefícios", icon: Gift },
  courses: { label: "Cursos", icon: BookOpen },
  other: { label: "Outros", icon: Package },
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'purchased'>('all');
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | 'all'>('all');

  // Default products for display when Firebase returns empty
  const defaultProducts: Product[] = [
    {
      id: 'sample-1',
      name: 'Pack Elementor CSS',
      description: 'Pack completo de elementos CSS para Elementor. Acelere seu desenvolvimento!',
      price: 800,
      image: 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=600&h=400&fit=crop',
      available: true,
      category: 'items',
      featured: true,
    },
    {
      id: 'sample-2',
      name: 'App Disparo em Massa',
      description: 'Aplicativo para disparo em massa via WhatsApp. Automatize suas mensagens.',
      price: 1200,
      image: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600&h=400&fit=crop',
      available: true,
      category: 'items',
    },
    {
      id: 'sample-3',
      name: 'Catálogo de Cursos',
      description: 'Acesso ao catálogo completo de cursos da plataforma.',
      price: 500,
      image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&h=400&fit=crop',
      available: true,
      category: 'courses',
      requiredRank: 'gold',
    },
    {
      id: 'sample-4',
      name: 'Pack After Effects',
      description: 'Pack com 500 elementos UHD 4K para After Effects.',
      price: 750,
      image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&h=400&fit=crop',
      available: true,
      category: 'items',
      featured: true,
    },
    {
      id: 'sample-5',
      name: 'Método IA do Job',
      description: 'Aprenda a usar IA para conseguir oportunidades de trabalho.',
      price: 3000,
      image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=600&h=400&fit=crop',
      available: true,
      category: 'courses',
      requiredRank: 'platinum',
      featured: true,
    },
    {
      id: 'sample-6',
      name: 'Tema Express Shopify',
      description: 'Tema profissional e otimizado para lojas Shopify.',
      price: 1500,
      image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&h=400&fit=crop',
      available: true,
      category: 'items',
    },
    {
      id: 'sample-7',
      name: 'Prompts VEO 3',
      description: 'Coleção de prompts otimizados para geração de vídeos com IA.',
      price: 2500,
      image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=600&h=400&fit=crop',
      available: true,
      category: 'benefits',
      featured: true,
    },
    {
      id: 'sample-8',
      name: 'Pack Edit Pro Kit',
      description: 'Kit básico de edição com mais de 2000 recursos.',
      price: 1800,
      image: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600&h=400&fit=crop',
      available: true,
      category: 'items',
    },
    {
      id: 'sample-9',
      name: 'Master Pay',
      description: 'Sistema completo de pagamentos para seu negócio.',
      price: 4500,
      image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&h=400&fit=crop',
      available: true,
      category: 'benefits',
      requiredRank: 'diamond',
    },
    {
      id: 'sample-10',
      name: 'Script Raspadinha',
      description: 'Script de raspadinha premiada para engajamento.',
      price: 900,
      image: 'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=600&h=400&fit=crop',
      available: true,
      category: 'items',
    },
    {
      id: 'sample-11',
      name: 'Cortes Virais Biblioteca',
      description: 'Biblioteca completa de cortes virais para redes sociais.',
      price: 1100,
      image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=600&h=400&fit=crop',
      available: true,
      category: 'items',
    },
    {
      id: 'sample-12',
      name: 'Páginas de Vendas',
      description: 'Templates de páginas de vendas de alta conversão.',
      price: 2000,
      image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop',
      available: false,
      category: 'items',
    },
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsData, purchasesData] = await Promise.all([
          getProducts(),
          userProfile ? getUserPurchases(userProfile.uid) : Promise.resolve([])
        ]);
        setProducts(productsData.length > 0 ? productsData : defaultProducts);
        setPurchases(purchasesData);
      } catch (error) {
        console.error('Error fetching products:', error);
        setProducts(defaultProducts);
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
    
    if (categoryFilter !== 'all') {
      displayProducts = displayProducts.filter(p => p.category === categoryFilter);
    }
    
    if (statusFilter === 'available') {
      displayProducts = displayProducts.filter(p => canPurchase(p).allowed && !isPurchased(p.id));
    } else if (statusFilter === 'purchased') {
      displayProducts = displayProducts.filter(p => isPurchased(p.id));
    }
    
    return displayProducts;
  };

  const getCategoryCounts = () => {
    const counts: Record<string, number> = { all: filteredProducts.length };
    (Object.keys(categoryConfig) as ProductCategory[]).forEach(cat => {
      counts[cat] = filteredProducts.filter(p => p.category === cat).length;
    });
    return counts;
  };

  const categoryCounts = getCategoryCounts();

  // Split product name to highlight first word
  const formatProductName = (name: string) => {
    const words = name.split(' ');
    if (words.length === 1) return <span className="text-primary font-bold">{name}</span>;
    return (
      <>
        <span className="text-primary font-bold">{words[0]}</span>{' '}
        <span className="text-foreground">{words.slice(1).join(' ')}</span>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'pl-20' : 'pl-64'}`}>
        <Header />
        
        <main className="p-6 space-y-6">
          {/* Header Section */}
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10 border border-primary/20">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                <span className="text-primary">MEUS</span> PRODUTOS
              </h1>
              <p className="text-sm text-muted-foreground">
                Produtos que você tem acesso
              </p>
            </div>
          </div>

          {/* Featured Products Carousel */}
          {!loading && products.filter(p => p.featured).length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary fill-primary" />
                  <h2 className="text-lg font-bold">
                    <span className="text-primary">PRODUTOS</span> EM DESTAQUE
                  </h2>
                </div>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  Ver todos <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              
              <div className="relative px-12">
                <Carousel
                  opts={{
                    align: "start",
                    loop: true,
                  }}
                  plugins={[
                    Autoplay({
                      delay: 5000,
                      stopOnInteraction: false,
                      stopOnMouseEnter: true,
                    }),
                  ]}
                  className="w-full"
                >
                  <CarouselContent className="-ml-4">
                    {products.filter(p => p.featured).map((product) => (
                      <CarouselItem key={product.id} className="pl-4 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                        <FeaturedProductCard
                          product={product}
                          canPurchase={canPurchase(product)}
                          isPurchased={isPurchased(product.id)}
                          onSelect={() => setSelectedProduct(product)}
                          formatName={formatProductName}
                        />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious className="left-0" />
                  <CarouselNext className="right-0" />
                </Carousel>
              </div>
            </div>
          )}

          {/* Filters Row */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 bg-secondary/50 border-border/50 rounded-lg"
              />
            </div>

            {/* Category Filters */}
            <div className="flex flex-wrap gap-2">
              <Button
                variant={categoryFilter === 'all' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setCategoryFilter('all')}
                className="h-8"
              >
                Todos ({categoryCounts.all})
              </Button>
              {(Object.keys(categoryConfig) as ProductCategory[]).map(cat => {
                const count = categoryCounts[cat];
                if (count === 0) return null;
                return (
                  <Button
                    key={cat}
                    variant={categoryFilter === cat ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setCategoryFilter(cat)}
                    className="h-8"
                  >
                    {categoryConfig[cat].label} ({count})
                  </Button>
                );
              })}
            </div>

            {/* Status Filters */}
            <div className="flex gap-2 ml-auto">
              <Button
                variant={statusFilter === 'available' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setStatusFilter(statusFilter === 'available' ? 'all' : 'available')}
                className="h-8"
              >
                <Sparkles className="h-3 w-3 mr-1" />
                Disponíveis
              </Button>
              <Button
                variant={statusFilter === 'purchased' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setStatusFilter(statusFilter === 'purchased' ? 'all' : 'purchased')}
                className="h-8"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Liberados
              </Button>
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="grid gap-5 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-secondary/30 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid gap-5 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                {getDisplayProducts().map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    canPurchase={canPurchase(product)}
                    isPurchased={isPurchased(product.id)}
                    onSelect={() => setSelectedProduct(product)}
                    formatName={formatProductName}
                    index={index}
                  />
                ))}
              </div>

              {getDisplayProducts().length === 0 && (
                <div className="py-20 text-center">
                  <Package className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum produto encontrado</h3>
                  <p className="text-muted-foreground">
                    {statusFilter === 'purchased' 
                      ? "Você ainda não liberou nenhum produto" 
                      : "Tente ajustar sua busca ou filtros"}
                  </p>
                </div>
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
              Liberar Acesso
            </DialogTitle>
            <DialogDescription>
              Você está prestes a trocar seus pontos por este produto
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
                    ? "bg-primary/10" 
                    : "bg-destructive/10"
                )}>
                  <p className="text-sm text-muted-foreground">Saldo após</p>
                  <p className={cn(
                    "text-2xl font-bold",
                    (userProfile?.points || 0) - selectedProduct.price >= 0 
                      ? "text-primary" 
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
              {purchasing ? 'Processando...' : 'Liberar Acesso'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface FeaturedProductCardProps {
  product: Product;
  canPurchase: { allowed: boolean; reason?: string };
  isPurchased: boolean;
  onSelect: () => void;
  formatName: (name: string) => React.ReactNode;
}

const FeaturedProductCard = ({ product, canPurchase, isPurchased, onSelect, formatName }: FeaturedProductCardProps) => {
  const isUnavailable = !product.available;
  
  return (
    <div 
      className="group cursor-pointer"
      onClick={onSelect}
    >
      {/* Glow Container */}
      <div className="relative">
        {/* Animated Glow Background */}
        <div className="absolute -inset-1 bg-gradient-to-r from-primary via-accent to-primary rounded-xl opacity-50 blur-lg animate-glow-pulse group-hover:opacity-75 transition-opacity duration-300" />
        
        {/* Image Container */}
        <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-secondary/50 mb-3 border-2 border-primary/30 animate-border-glow group-hover:border-primary/60 transition-all duration-300">
        <img 
          src={product.image} 
          alt={product.name}
          className={cn(
            "w-full h-full object-cover transition-all duration-300",
            "group-hover:scale-110",
            (isUnavailable || (!canPurchase.allowed && !isPurchased)) && "opacity-60"
          )}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent" />
        
        {/* Featured Badge */}
        <div className="absolute top-2 left-2">
          <Badge className="bg-primary text-primary-foreground text-[10px] px-2 py-0.5 h-5 shadow-lg">
            <Star className="h-2.5 w-2.5 mr-1 fill-current" />
            DESTAQUE
          </Badge>
        </div>
        
        {/* Status Badge */}
        <div className="absolute top-2 right-2">
          {isPurchased && (
            <Badge className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 h-5">
              <CheckCircle className="h-2.5 w-2.5 mr-0.5" />
              LIBERADO
            </Badge>
          )}
        </div>

        {/* Bottom Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          <h3 className="text-sm font-bold leading-tight line-clamp-2 text-foreground drop-shadow-lg">
            {formatName(product.name)}
          </h3>
          <div className="flex items-center justify-between mt-2">
            <span className="text-primary text-sm font-bold">
              {isPurchased ? 'Acessar' : `${product.price.toLocaleString()} pts`}
            </span>
            {product.requiredRank && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0.5 h-5 bg-background/50 backdrop-blur-sm">
                <Crown className="h-2.5 w-2.5 mr-0.5" />
                {product.requiredRank.toUpperCase()}
              </Badge>
            )}
          </div>
        </div>

        {/* Unavailable Overlay */}
        {isUnavailable && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center">
            <Badge variant="secondary" className="text-xs px-2 py-1">
              <Wrench className="h-3 w-3 mr-1" />
              Manutenção
            </Badge>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

interface ProductCardProps {
  product: Product;
  canPurchase: { allowed: boolean; reason?: string };
  isPurchased: boolean;
  onSelect: () => void;
  formatName: (name: string) => React.ReactNode;
  index: number;
}

const ProductCard = ({ product, canPurchase, isPurchased, onSelect, formatName, index }: ProductCardProps) => {
  const isUnavailable = !product.available;
  
  return (
    <div 
      className="group animate-fade-in cursor-pointer"
      style={{ animationDelay: `${index * 30}ms` }}
      onClick={onSelect}
    >
      {/* Card Container */}
      <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-secondary/30 border border-border/50 group-hover:border-primary/50 transition-all duration-300">
        {/* Full Image */}
        <img 
          src={product.image} 
          alt={product.name}
          className={cn(
            "w-full h-full object-cover transition-all duration-500",
            "group-hover:scale-110",
            (isUnavailable || (!canPurchase.allowed && !isPurchased)) && "opacity-70"
          )}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent opacity-60" />
        
        {/* Top Badges Row */}
        <div className="absolute top-3 left-3 right-3 flex items-start justify-between gap-2">
          {/* Left Side Badges */}
          <div className="flex flex-wrap gap-1.5">
            {product.requiredRank && (
              <Badge className="bg-accent text-accent-foreground text-[10px] px-2 py-0.5 h-5 font-semibold shadow-lg">
                VIP
              </Badge>
            )}
            {!isPurchased && canPurchase.allowed && !isUnavailable && (
              <Badge className="bg-primary text-primary-foreground text-[10px] px-2 py-0.5 h-5 font-semibold shadow-lg">
                NOVO
              </Badge>
            )}
            {product.featured && (
              <Badge className="bg-primary text-primary-foreground text-[10px] px-2 py-0.5 h-5 font-semibold shadow-lg">
                <Play className="h-2.5 w-2.5 mr-1 fill-current" />
                DEMO
              </Badge>
            )}
          </div>
          
          {/* Right Side - Liberado Badge */}
          {isPurchased && (
            <Badge className="bg-primary text-primary-foreground text-[10px] px-2 py-0.5 h-5 font-semibold shadow-lg">
              <CheckCircle className="h-2.5 w-2.5 mr-1" />
              LIBERADO
            </Badge>
          )}
        </div>

        {/* Center Download Icon for purchased items */}
        {isPurchased && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center shadow-xl">
              <Package className="h-7 w-7 text-primary-foreground" />
            </div>
          </div>
        )}

        {/* Brand Logo Overlay - Top Right Corner */}
        <div className="absolute top-3 right-3">
          {!isPurchased && product.category && categoryConfig[product.category] && (
            <div className="h-8 w-8 rounded-lg bg-background/80 backdrop-blur-sm flex items-center justify-center border border-border/50">
              {(() => {
                const Icon = categoryConfig[product.category!].icon;
                return <Icon className="h-4 w-4 text-primary" />;
              })()}
            </div>
          )}
        </div>

        {/* Unavailable Overlay */}
        {isUnavailable && (
          <div className="absolute inset-0 bg-background/70 backdrop-blur-[2px] flex items-center justify-center">
            <Badge variant="secondary" className="text-xs px-3 py-1.5">
              <Wrench className="h-3.5 w-3.5 mr-1.5" />
              Manutenção
            </Badge>
          </div>
        )}

        {/* Locked Overlay on Hover */}
        {!isPurchased && !canPurchase.allowed && !isUnavailable && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <Badge variant="secondary" className="text-xs px-3 py-1.5">
              <Lock className="h-3.5 w-3.5 mr-1.5" />
              {canPurchase.reason}
            </Badge>
          </div>
        )}
      </div>

      {/* Product Info Below Card */}
      <div className="mt-3 space-y-1">
        <h3 className="text-sm font-bold leading-tight line-clamp-2 uppercase tracking-wide">
          {formatName(product.name)}
        </h3>
        <button 
          className="text-primary text-xs font-medium hover:underline"
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
        >
          {isPurchased ? 'Acessar' : `${product.price.toLocaleString()} pts`}
        </button>
      </div>
    </div>
  );
};

export default Products;
