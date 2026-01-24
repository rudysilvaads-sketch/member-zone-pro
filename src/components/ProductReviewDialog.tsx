import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createProductReview, Purchase } from '@/lib/firebaseServices';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ProductReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  purchase: Purchase | null;
  onReviewSubmitted: () => void;
}

export function ProductReviewDialog({ open, onOpenChange, purchase, onReviewSubmitted }: ProductReviewDialogProps) {
  const { userProfile } = useAuth();
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!purchase || !userProfile) return;
    
    if (!comment.trim()) {
      toast.error('Por favor, escreva um comentário');
      return;
    }

    setSubmitting(true);
    try {
      const result = await createProductReview(
        userProfile.uid,
        userProfile.displayName || 'Usuário',
        userProfile.photoURL,
        purchase.productId,
        purchase.productName,
        rating,
        comment.trim()
      );

      if (result.success) {
        toast.success('Avaliação enviada com sucesso!');
        setRating(5);
        setComment('');
        onOpenChange(false);
        onReviewSubmitted();
      } else {
        toast.error(result.error || 'Erro ao enviar avaliação');
      }
    } catch (error) {
      toast.error('Erro ao enviar avaliação');
    } finally {
      setSubmitting(false);
    }
  };

  const getRatingLabel = (rating: number) => {
    switch (rating) {
      case 1: return 'Muito ruim';
      case 2: return 'Ruim';
      case 3: return 'Regular';
      case 4: return 'Bom';
      case 5: return 'Excelente';
      default: return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary fill-primary" />
            Avaliar Produto
          </DialogTitle>
          <DialogDescription>
            Compartilhe sua experiência com "{purchase?.productName}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Star Rating */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Sua avaliação</Label>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    className={cn(
                      "h-8 w-8 transition-colors",
                      (hoverRating || rating) >= star
                        ? "text-primary fill-primary"
                        : "text-muted-foreground"
                    )}
                  />
                </button>
              ))}
              <span className="ml-3 text-sm text-muted-foreground">
                {getRatingLabel(hoverRating || rating)}
              </span>
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label htmlFor="comment" className="text-sm font-medium">
              Seu comentário
            </Label>
            <Textarea
              id="comment"
              placeholder="Conte-nos o que achou do produto..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              maxLength={500}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {comment.length}/500 caracteres
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              'Enviar Avaliação'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}