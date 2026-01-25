import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { 
  Key, 
  Clock, 
  CheckCircle2, 
  Send, 
  Loader2,
  ExternalLink,
  User,
  MessageSquare,
  Package
} from "lucide-react";
import { collection, query, where, orderBy, getDocs, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toast } from "sonner";
import { Purchase } from "@/lib/firebaseServices";

interface PendingAccess extends Purchase {
  userName?: string;
  userEmail?: string;
}

export function AdminAccessRequests() {
  const [requests, setRequests] = useState<PendingAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<PendingAccess | null>(null);
  const [accessData, setAccessData] = useState({
    link: "",
    credentials: "",
    instructions: ""
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      // Get all purchases with access requested - simple query to avoid index requirement
      const purchasesRef = collection(db, 'purchases');
      const q = query(purchasesRef, where('accessRequested', '==', true));
      const snapshot = await getDocs(q);
      
      const requestsData: PendingAccess[] = [];
      
      for (const docSnap of snapshot.docs) {
        const purchase = { id: docSnap.id, ...docSnap.data() } as PendingAccess;
        
        // Get user info
        try {
          const userDoc = await getDocs(
            query(collection(db, 'users'), where('uid', '==', purchase.userId))
          );
          if (!userDoc.empty) {
            const userData = userDoc.docs[0].data();
            purchase.userName = userData.displayName;
            purchase.userEmail = userData.email;
          }
        } catch (e) {
          console.error('Error fetching user:', e);
        }
        
        requestsData.push(purchase);
      }
      
      // Sort client-side by accessRequestedAt descending
      requestsData.sort((a, b) => {
        const dateA = a.accessRequestedAt?.toMillis?.() || 0;
        const dateB = b.accessRequestedAt?.toMillis?.() || 0;
        return dateB - dateA;
      });
      
      setRequests(requestsData);
    } catch (error) {
      console.error('Error fetching access requests:', error);
      toast.error('Erro ao carregar solicitações');
    } finally {
      setLoading(false);
    }
  };

  const handleDeliverAccess = async () => {
    if (!selectedRequest) return;
    if (!accessData.link && !accessData.credentials && !accessData.instructions) {
      toast.error('Preencha pelo menos um campo de acesso');
      return;
    }

    setSubmitting(true);
    try {
      const purchaseRef = doc(db, 'purchases', selectedRequest.id);
      await updateDoc(purchaseRef, {
        accessDelivered: true,
        accessDeliveredAt: serverTimestamp(),
        accessData: {
          link: accessData.link || null,
          credentials: accessData.credentials || null,
          instructions: accessData.instructions || null,
        }
      });

      toast.success('Acesso entregue com sucesso!');
      setSelectedRequest(null);
      setAccessData({ link: "", credentials: "", instructions: "" });
      fetchRequests();
    } catch (error) {
      console.error('Error delivering access:', error);
      toast.error('Erro ao entregar acesso');
    } finally {
      setSubmitting(false);
    }
  };

  const pendingRequests = requests.filter(r => !r.accessDelivered);
  const deliveredRequests = requests.filter(r => r.accessDelivered);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Requests */}
      <Card variant="gradient">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-500" />
            Solicitações Pendentes
            {pendingRequests.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingRequests.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingRequests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma solicitação pendente</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <div 
                  key={request.id}
                  className="flex items-center gap-4 p-4 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors"
                >
                  <div className="p-2 rounded-lg bg-yellow-500/10">
                    <Package className="h-5 w-5 text-yellow-500" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{request.productName}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>{request.userName || 'Usuário'}</span>
                      <span>•</span>
                      <span>{request.userEmail}</span>
                    </div>
                    {request.accessRequestMessage && (
                      <div className="flex items-start gap-1 mt-1 text-xs text-muted-foreground">
                        <MessageSquare className="h-3 w-3 mt-0.5 shrink-0" />
                        <span className="line-clamp-2">{request.accessRequestMessage}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right text-xs text-muted-foreground">
                    {request.accessRequestedAt?.toDate?.() 
                      ? new Intl.DateTimeFormat('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        }).format(request.accessRequestedAt.toDate())
                      : '-'
                    }
                  </div>
                  
                  <Button 
                    variant="gold"
                    size="sm"
                    onClick={() => {
                      setSelectedRequest(request);
                      setAccessData({ link: "", credentials: "", instructions: "" });
                    }}
                  >
                    <Key className="h-4 w-4 mr-1" />
                    Entregar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delivered Requests */}
      {deliveredRequests.length > 0 && (
        <Card variant="gradient">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Acessos Entregues
              <Badge variant="secondary" className="ml-2">
                {deliveredRequests.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {deliveredRequests.slice(0, 10).map((request) => (
                <div 
                  key={request.id}
                  className="flex items-center gap-4 p-4 rounded-lg bg-primary/5 border border-primary/10"
                >
                  <div className="p-2 rounded-lg bg-primary/10">
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{request.productName}</p>
                    <p className="text-sm text-muted-foreground">
                      {request.userName || 'Usuário'}
                    </p>
                  </div>
                  
                  <div className="text-right text-xs text-muted-foreground">
                    Entregue em{' '}
                    {request.accessDeliveredAt?.toDate?.() 
                      ? new Intl.DateTimeFormat('pt-BR', {
                          day: '2-digit',
                          month: 'short'
                        }).format(request.accessDeliveredAt.toDate())
                      : '-'
                    }
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Deliver Access Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              Entregar Acesso
            </DialogTitle>
            <DialogDescription>
              Preencha os dados de acesso para{' '}
              <span className="font-medium text-foreground">{selectedRequest?.productName}</span>
              {' '}do usuário <span className="font-medium text-foreground">{selectedRequest?.userName}</span>
            </DialogDescription>
          </DialogHeader>

          {selectedRequest?.accessRequestMessage && (
            <div className="p-3 rounded-lg bg-secondary/50 border border-border">
              <p className="text-xs text-muted-foreground mb-1">Mensagem do usuário:</p>
              <p className="text-sm">{selectedRequest.accessRequestMessage}</p>
            </div>
          )}

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Link de Acesso</Label>
              <Input
                placeholder="https://..."
                value={accessData.link}
                onChange={(e) => setAccessData(prev => ({ ...prev, link: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Credenciais (login/senha)</Label>
              <Input
                placeholder="email@exemplo.com / senha123"
                value={accessData.credentials}
                onChange={(e) => setAccessData(prev => ({ ...prev, credentials: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Instruções</Label>
              <Textarea
                placeholder="Instruções de como usar o acesso..."
                value={accessData.instructions}
                onChange={(e) => setAccessData(prev => ({ ...prev, instructions: e.target.value }))}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRequest(null)}>
              Cancelar
            </Button>
            <Button 
              variant="gold"
              onClick={handleDeliverAccess}
              disabled={submitting || (!accessData.link && !accessData.credentials && !accessData.instructions)}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Entregar Acesso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
