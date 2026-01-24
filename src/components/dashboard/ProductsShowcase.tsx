import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Lock, Sparkles } from "lucide-react";

const products = [
  {
    id: 1,
    name: "Curso Avançado",
    description: "Desbloqueie conteúdo exclusivo de nível avançado",
    price: 1500,
    currency: "pontos",
    image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=250&fit=crop",
    available: true,
    featured: true,
  },
  {
    id: 2,
    name: "Mentoria VIP",
    description: "1 hora de mentoria individual com especialista",
    price: 3000,
    currency: "pontos",
    image: "https://images.unsplash.com/photo-1552581234-26160f608093?w=400&h=250&fit=crop",
    available: false,
    requiredRank: "Platinum",
  },
  {
    id: 3,
    name: "Badge Exclusiva",
    description: "Badge personalizada para seu perfil",
    price: 500,
    currency: "pontos",
    image: "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=400&h=250&fit=crop",
    available: true,
  },
];

export function ProductsShowcase() {
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
          {products.map((product, index) => (
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
              {!product.available && (
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
                    <span className="text-lg font-bold text-primary">
                      {product.price.toLocaleString()}
                    </span>
                    <span className="ml-1 text-xs text-muted-foreground">
                      {product.currency}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant={product.available ? "gold" : "secondary"}
                    disabled={!product.available}
                  >
                    {product.available ? "Resgatar" : "Bloqueado"}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
