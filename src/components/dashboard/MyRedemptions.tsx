import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Package, 
  Clock, 
  CheckCircle2, 
  Send, 
  MessageSquare, 
  ExternalLink,
  Copy,
  Loader2,
  AlertCircle,
  Key
} from "lucide-react";
import { Purchase } from "@/lib/firebaseServices";
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";

interface MyRedemptionsProps {
  purchases: Purchase[];
  onRefresh: () => void;
}

type AccessStatus = 'pending' | 'requested' | 'delivered';

export function MyRedemptions({ purchases, onRefresh }: MyRedemptionsProps) {
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const getAccessStatus = (purchase: Purchase): AccessStatus => {
    if (purchase.accessDelivered) return 'delivered';
    if (purchase.accessRequested) return 'requested';
    return 'pending';
  };

  const handleRequestAccess = async () => {
    if (!selectedPurchase) return;

    setSubmitting(true);
    try {
      const purchaseRef = doc(db, 'purchases', selectedPurchase.id);
      await updateDoc(purchaseRef, {
        accessRequested: true,
        accessRequestedAt: serverTimestamp(),
        accessRequestMessage: requestMessage || null,
      });

      toast.success('Solicitação enviada! O admin será notificado.');
      setSelectedPurchase(null);
      setRequestMessage("");
      onRefresh();
    } catch (error) {
      console.error('Error requesting access:', error);
      toast.error('Erro ao enviar solicitação');
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para a área de transferência!');
  };

  const statusConfig = {
    pending: {
      label: 'Pendente',
      icon: Clock,
      color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      description: 'Solicite seu acesso'
    },
    requested: {
      label: 'Solicitado',
      icon: Send,
      color: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      description: 'Aguardando liberação'
    },
    delivered: {
      label: 'Liberado',
      icon: CheckCircle2,
      color: 'bg-[#BFFF00]/10 text-[#BFFF00] border-[#BFFF00]/20',
      description: 'Acesso disponível'
    }
  };

  if (purchases.length === 0) {
    return (
      <Card variant="gradient" className="border-dashed">
        <CardContent className="py-12 text-center">
          <Package className="h-12 w-12 mx-auto text-white/30 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">Nenhum resgate ainda</h3>
          <p className="text-white/50 text-sm">
            Seus produtos resgatados aparecerão aqui
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {purchases.map((purchase) => {
          const status = getAccessStatus(purchase);
          const config = statusConfig[status];
          const StatusIcon = config.icon;

          return (
            <Card 
              key={purchase.id} 
              variant="gradient" 
              className="overflow-hidden group hover:border-[#BFFF00]/30 transition-all duration-300"
            >
              {/* Product Image */}
              {purchase.productImage && (
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img 
                    src={purchase.productImage} 
                    alt={purchase.productName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
                  
                  {/* Status Badge */}
                  <Badge className={`absolute top-2 right-2 text-[10px] px-1.5 py-0.5 ${config.color}`}>
                    <StatusIcon className="h-2.5 w-2.5 mr-0.5" />
                    {config.label}
                  </Badge>
                </div>
              )}

              <CardContent className="p-2.5 space-y-2">
                <div>
                  <h3 className="font-bold text-white text-sm truncate">{purchase.productName}</h3>
                  <p className="text-[10px] text-white/40">
                    {purchase.purchasedAt?.toDate?.() 
                      ? new Intl.DateTimeFormat('pt-BR', { 
                          day: '2-digit',
                          month: 'short',
                        }).format(purchase.purchasedAt.toDate())
                      : '-'
                    }
                  </p>
                </div>

                {/* Access Info or Action */}
                {status === 'delivered' && purchase.accessData ? (
                  <div className="space-y-1.5 p-2 rounded-md bg-[#BFFF00]/5 border border-[#BFFF00]/20">
                    <div className="flex items-center gap-1.5 text-[#BFFF00]">
                      <Key className="h-3 w-3" />
                      <span className="text-xs font-medium">Dados de Acesso</span>
                    </div>
                    
                    {purchase.accessData.link && (
                      <a 
                        href={purchase.accessData.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-white/80 hover:text-[#BFFF00] transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Acessar
                      </a>
                    )}
                    
                    {purchase.accessData.credentials && (
                      <div className="flex items-center gap-1">
                        <code className="flex-1 text-[10px] bg-black/30 px-1.5 py-0.5 rounded truncate">
                          {purchase.accessData.credentials}
                        </code>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-5 w-5"
                          onClick={() => copyToClipboard(purchase.accessData.credentials!)}
                        >
                          <Copy className="h-2.5 w-2.5" />
                        </Button>
                      </div>
                    )}

                    {purchase.accessData.instructions && (
                      <p className="text-[10px] text-white/60 line-clamp-2">
                        {purchase.accessData.instructions}
                      </p>
                    )}
                  </div>
                ) : status === 'requested' ? (
                  <div className="p-2 rounded-md bg-blue-500/5 border border-blue-500/20">
                    <div className="flex items-center gap-1.5 text-blue-400">
                      <AlertCircle className="h-3 w-3" />
                      <span className="text-xs">Aguardando</span>
                    </div>
                  </div>
                ) : (
                  <Button 
                    variant="gold" 
                    size="sm"
                    className="w-full h-7 text-xs"
                    onClick={() => setSelectedPurchase(purchase)}
                  >
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Solicitar
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Request Access Dialog */}
      <Dialog open={!!selectedPurchase} onOpenChange={() => setSelectedPurchase(null)}>
        <DialogContent className="sm:max-w-md bg-[#0a0a0a]/95 border-[#BFFF00]/20">
          <DialogHeader>
            <DialogTitle className="text-white">Solicitar Acesso</DialogTitle>
            <DialogDescription className="text-white/60">
              Envie uma solicitação para receber os dados de acesso de{' '}
              <span className="text-[#BFFF00] font-medium">{selectedPurchase?.productName}</span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-white/80">Mensagem (opcional)</Label>
              <Textarea
                placeholder="Ex: Preciso do acesso para o email exemplo@email.com"
                value={requestMessage}
                onChange={(e) => setRequestMessage(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none"
                rows={3}
              />
              <p className="text-xs text-white/40">
                Inclua informações relevantes como email ou usuário preferido
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setSelectedPurchase(null)}
              className="border-white/10 text-white hover:bg-white/5"
            >
              Cancelar
            </Button>
            <Button 
              variant="gold"
              onClick={handleRequestAccess}
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Enviar Solicitação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
