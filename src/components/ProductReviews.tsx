import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Star, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getProductReviews, ProductReview } from '@/lib/firebaseServices';

interface ProductReviewsProps {
  productId: string;
  productName: string;
}

export function ProductReviews({ productId, productName }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      const data = await getProductReviews(productId);
      setReviews(data);
      setLoading(false);
    };
    fetchReviews();
  }, [productId]);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
    : 0;

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map(i => (
          <div key={i} className="h-24 bg-secondary/30 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <Card className="py-8">
        <CardContent className="text-center">
          <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            Nenhuma avaliação ainda. Seja o primeiro a avaliar!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <Card>
        <CardContent className="p-4 flex items-center gap-4">
          <div className="text-center">
            <p className="text-3xl font-bold text-primary">{averageRating.toFixed(1)}</p>
            <div className="flex items-center gap-0.5 mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    "h-4 w-4",
                    averageRating >= star
                      ? "text-primary fill-primary"
                      : "text-muted-foreground"
                  )}
                />
              ))}
            </div>
          </div>
          <div className="border-l border-border pl-4">
            <p className="text-sm text-muted-foreground">
              {reviews.length} {reviews.length === 1 ? 'avaliação' : 'avaliações'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Reviews List */}
      <div className="space-y-3">
        {reviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={review.userAvatar || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {review.userName?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-sm truncate">{review.userName}</p>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatDate(review.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5 mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={cn(
                          "h-3.5 w-3.5",
                          review.rating >= star
                            ? "text-primary fill-primary"
                            : "text-muted-foreground"
                        )}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2 whitespace-pre-wrap">
                    {review.comment}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}