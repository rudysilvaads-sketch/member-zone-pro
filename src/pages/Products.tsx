import { useEffect, useState, useRef } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Lock, CheckCircle, Coins, Package, Sparkles, Crown, Gem, ShoppingBag, User, Gift, BookOpen, Box, Play, Wrench, Star, ChevronRight, Key } from "lucide-react";
import { cn } from "@/lib/utils";
import { getProducts, purchaseProduct, getUserPurchases, Product, Purchase, ProductCategory } from "@/lib/firebaseServices";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import Autoplay from "embla-carousel-autoplay";
import Fade from "embla-carousel-fade";
import { MyRedemptions } from "@/components/dashboard/MyRedemptions";
import featuredHeroBg from "@/assets/featured-hero-wide.jpg";
import bannerChatGPT from "@/assets/banner-chatgpt.jpg";
import bannerGoogleVO3 from "@/assets/banner-google-vo3.jpg";
import bannerCapCut from "@/assets/banner-capcut.jpg";

// Map product names to their featured banners
const productBanners: Record<string, string> = {
  'chatgpt': bannerChatGPT,
  'google vo3': bannerGoogleVO3,
  'capcut': bannerCapCut,
};

const getProductBanner = (productName: string, featuredImage?: string): string => {
  if (featuredImage) return featuredImage;
  
  const nameLower = productName.toLowerCase();
  for (const [key, banner] of Object.entries(productBanners)) {
    if (nameLower.includes(key)) return banner;
  }
  
  return featuredHeroBg;
};

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
    <div className="min-h-screen bg-[#0a0a0a]">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'pl-20' : 'pl-64'}`}>
        <Header />
        
        <main className="p-6 space-y-6">
          {/* Header Section */}
          <div className="flex items-center gap-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#BFFF00]/10 border border-[#BFFF00]/20">
              <span className="text-xs text-[#BFFF00] uppercase tracking-widest font-medium">Vitrine</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-[#BFFF00]/10 border border-[#BFFF00]/20">
                <Package className="h-6 w-6 text-[#BFFF00]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  <span className="text-[#BFFF00] italic">VITRINE</span> PREMIUM
                </h1>
                <p className="text-sm text-white/50">
                  Troque seus pontos por produtos exclusivos
                </p>
              </div>
            </div>
          </div>

          {/* Main Tabs */}
          <Tabs defaultValue="store" className="space-y-6">
            <TabsList className="bg-white/5 border border-white/10">
              <TabsTrigger value="store" className="flex items-center gap-2 data-[state=active]:bg-[#BFFF00] data-[state=active]:text-black">
                <ShoppingBag className="h-4 w-4" />
                Loja
              </TabsTrigger>
              <TabsTrigger value="redemptions" className="flex items-center gap-2 data-[state=active]:bg-[#BFFF00] data-[state=active]:text-black">
                <Key className="h-4 w-4" />
                Meus Resgates
                {purchases.length > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                    {purchases.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Store Tab */}
            <TabsContent value="store" className="space-y-6">
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
                        align: "center",
                        loop: true,
                      }}
                      plugins={[
                        Fade(),
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
                          <CarouselItem key={product.id} className="pl-4 basis-full">
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
            </TabsContent>

            {/* My Redemptions Tab */}
            <TabsContent value="redemptions">
              <MyRedemptions 
                purchases={purchases} 
                onRefresh={async () => {
                  if (userProfile) {
                    const updatedPurchases = await getUserPurchases(userProfile.uid);
                    setPurchases(updatedPurchases);
                  }
                }}
              />
            </TabsContent>
          </Tabs>
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
  
  // Format name with first word styled
  const getStyledName = (name: string) => {
    const words = name.split(' ');
    if (words.length === 1) return { first: name, rest: '' };
    return { first: words[0], rest: words.slice(1).join(' ') };
  };
  
  const { first, rest } = getStyledName(product.name);
  
  return (
    <div 
      className="group cursor-pointer"
      onClick={onSelect}
    >
      {/* Hero Banner Container */}
      <div className="relative aspect-[21/7] md:aspect-[4/1] rounded-2xl overflow-hidden bg-[#0a0a0a] border border-white/10 group-hover:border-[#BFFF00]/30 transition-all duration-500 shadow-2xl">
        {/* Featured Image - Full Cover */}
        <img 
          src={getProductBanner(product.name, product.featuredImage)} 
          alt={product.name}
          className={cn(
            "absolute inset-0 w-full h-full object-cover transition-all duration-700",
            "group-hover:scale-105",
            (isUnavailable || (!canPurchase.allowed && !isPurchased)) && "opacity-50"
          )}
        />
        
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a0a0a]/90 via-[#0a0a0a]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/60 via-transparent to-transparent" />
        
        {/* Content - Left Side */}
        <div className="absolute inset-0 p-6 md:p-8 flex flex-col justify-between">
          {/* Top Badges */}
          <div className="flex items-center gap-2">
            <Badge className="bg-[#BFFF00] text-black text-[10px] md:text-xs px-2.5 py-1 h-6 md:h-7 font-bold rounded-md shadow-lg">
              <Star className="h-3 w-3 mr-1 fill-current" />
              EM DESTAQUE
            </Badge>
            {isPurchased && (
              <Badge className="bg-[#BFFF00]/90 text-black text-[10px] md:text-xs px-2.5 py-1 h-6 md:h-7 font-bold rounded-md">
                <CheckCircle className="h-3 w-3 mr-1" />
                LIBERADO
              </Badge>
            )}
            {product.requiredRank && !isPurchased && (
              <Badge className="bg-white/10 text-white text-[10px] md:text-xs px-2.5 py-1 h-6 md:h-7 font-medium rounded-md border border-white/20 backdrop-blur-sm">
                <Crown className="h-3 w-3 mr-1 text-[#BFFF00]" />
                VIP
              </Badge>
            )}
          </div>
          
          {/* Bottom Content */}
          <div className="max-w-lg space-y-3 md:space-y-4">
            {/* Title */}
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black leading-[1.1] tracking-tight">
              <span className="text-[#BFFF00] italic">{first}</span>
              {rest && <span className="text-white"> {rest.toUpperCase()}</span>}
            </h2>
            
            {/* Description */}
            <p className="text-sm md:text-base text-white/60 line-clamp-2 max-w-md">
              {product.description}
            </p>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-1">
              <Button
                variant="gold"
                size="default"
                className="rounded-lg font-bold shadow-lg text-sm md:text-base px-4 md:px-6 h-9 md:h-11"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect();
                }}
              >
                {isPurchased ? (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Acessar Conteúdo
                  </>
                ) : (
                  <>
                    <ShoppingBag className="h-4 w-4 mr-2" />
                    {product.price.toLocaleString()} pts
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="default"
                className="rounded-lg font-medium border-white/20 bg-white/5 hover:bg-white/10 text-white text-sm md:text-base px-4 md:px-6 h-9 md:h-11"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect();
                }}
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Mais Informações
              </Button>
            </div>
          </div>
        </div>

        {/* Unavailable Overlay */}
        {isUnavailable && (
          <div className="absolute inset-0 bg-[#0a0a0a]/80 backdrop-blur-sm flex items-center justify-center">
            <Badge variant="secondary" className="text-sm px-4 py-2 bg-white/10 border border-white/20">
              <Wrench className="h-4 w-4 mr-2" />
              Em Manutenção
            </Badge>
          </div>
        )}
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
