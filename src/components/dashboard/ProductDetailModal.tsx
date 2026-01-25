import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Zap, Lock, Loader2, ShoppingBag } from "lucide-react";
import { Product } from "@/lib/firebaseServices";

interface ProductDetailModalProps {
  product: Product | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userRank: string;
  userPoints: number;
  onPurchase: (product: Product) => void;
  purchasing: boolean;
}

const rankOrder = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];

const canAccessProduct = (userRank: string, requiredRank?: string): boolean => {
  if (!requiredRank) return true;
  const userRankIndex = rankOrder.indexOf(userRank.toLowerCase());
  const requiredRankIndex = rankOrder.indexOf(requiredRank.toLowerCase());
  return userRankIndex >= requiredRankIndex;
};

export function ProductDetailModal({
  product,
  open,
  onOpenChange,
  userRank,
  userPoints,
  onPurchase,
  purchasing,
}: ProductDetailModalProps) {
  if (!product) return null;

  const hasAccess = canAccessProduct(userRank, product.requiredRank);
  const canAfford = userPoints >= product.price;
  const isAvailable = product.available && hasAccess;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-[#0a0a0a]/95 border-[#BFFF00]/20 backdrop-blur-xl p-0 overflow-hidden">
        {/* Product Image */}
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover"
          />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
          
          {/* Featured badge */}
          {product.featured && (
            <div className="absolute right-4 top-4">
              <Badge className="bg-gradient-to-r from-[#BFFF00] to-[#9FDF00] text-black text-xs px-3 py-1 font-bold flex items-center gap-1.5 shadow-[0_0_20px_rgba(191,255,0,0.4)]">
                <Zap className="h-3.5 w-3.5" />
                HOT
              </Badge>
            </div>
          )}

          {/* Locked overlay */}
          {!hasAccess && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a]/80 backdrop-blur-sm">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-3">
                  <Lock className="h-8 w-8 text-white/40" />
                </div>
                <p className="text-sm font-medium text-white/50">
                  Requer rank <span className="text-[#BFFF00] font-bold">{product.requiredRank}</span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <DialogHeader className="space-y-2">
            <div className="flex items-start justify-between gap-4">
              <DialogTitle className="text-xl font-bold text-white">
                {product.name}
              </DialogTitle>
              {product.category && (
                <Badge variant="outline" className="border-[#BFFF00]/30 text-[#BFFF00] text-xs shrink-0">
                  {product.category}
                </Badge>
              )}
            </div>
          </DialogHeader>

          <p className="text-sm text-white/60 leading-relaxed">
            {product.description}
          </p>

          {product.requiredRank && (
            <div className="flex items-center gap-2 text-xs text-white/40">
              <Lock className="h-3.5 w-3.5" />
              <span>Requer rank <span className="text-[#BFFF00]">{product.requiredRank}</span> ou superior</span>
            </div>
          )}

          {/* Price and Purchase */}
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            <div className="flex items-baseline gap-2">
              <Crown className={`h-5 w-5 ${canAfford ? 'text-[#BFFF00]' : 'text-red-400'}`} />
              <span className={`text-2xl font-black ${canAfford ? 'text-[#BFFF00]' : 'text-red-400'}`}>
                {product.price.toLocaleString()}
              </span>
              <span className="text-sm text-white/40 font-medium">pontos</span>
            </div>

            <Button
              size="lg"
              variant={isAvailable && canAfford ? "gold" : "secondary"}
              disabled={!isAvailable || !canAfford || purchasing}
              onClick={() => onPurchase(product)}
              className={`px-6 font-bold ${
                isAvailable && canAfford 
                  ? 'shadow-[0_0_20px_rgba(191,255,0,0.3)]' 
                  : ''
              }`}
            >
              {purchasing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processando...
                </>
              ) : !hasAccess ? (
                <>
                  <Lock className="h-4 w-4 mr-2" />
                  Bloqueado
                </>
              ) : !canAfford ? (
                "Pontos insuficientes"
              ) : (
                <>
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Resgatar agora
                </>
              )}
            </Button>
          </div>

          {!canAfford && hasAccess && (
            <p className="text-xs text-red-400/80 text-center">
              Você precisa de mais {(product.price - userPoints).toLocaleString()} pontos para resgatar este item.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
