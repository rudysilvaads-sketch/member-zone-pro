import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Star, MessageSquare, Loader2, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  TutorialReview,
  getTopicReviews,
  createReview,
  calculateAverageRating,
} from "@/lib/reviewsService";

interface TutorialReviewsProps {
  topicId: string;
  topicTitle: string;
}

const TutorialReviews = ({ topicId, topicTitle }: TutorialReviewsProps) => {
  const { user, userProfile } = useAuth();
  const [reviews, setReviews] = useState<TutorialReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);

  useEffect(() => {
    loadReviews();
  }, [topicId]);

  const loadReviews = async () => {
    setLoading(true);
    const data = await getTopicReviews(topicId);
    setReviews(data);
    setLoading(false);
  };

  const handleSubmitReview = async () => {
    if (!user) {
      toast.error("Faça login para avaliar");
      return;
    }

    setSubmitting(true);
    const result = await createReview(
      user.uid,
      (userProfile as any)?.displayName || user.email?.split("@")[0] || "Usuário",
      (userProfile as any)?.photoURL,
      topicId,
      rating,
      comment
    );

    if (result.success) {
      toast.success("Avaliação enviada com sucesso!");
      setShowReviewDialog(false);
      setRating(5);
      setComment("");
      loadReviews();
    } else {
      toast.error(result.error || "Erro ao enviar avaliação");
    }
    setSubmitting(false);
  };

  const averageRating = calculateAverageRating(reviews);
  const hasReviewed = reviews.some((r) => r.user_id === user?.uid);

  const renderStars = (count: number, interactive = false, size = "h-4 w-4") => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              size,
              "transition-colors",
              interactive && "cursor-pointer",
              star <= (interactive ? (hoveredStar || rating) : count)
                ? "fill-[#F5A623] text-[#F5A623]"
                : "text-white/20"
            )}
            onClick={() => interactive && setRating(star)}
            onMouseEnter={() => interactive && setHoveredStar(star)}
            onMouseLeave={() => interactive && setHoveredStar(0)}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <Card variant="gradient" className="mt-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-[#F5A623]" />
            Avaliações e Depoimentos
          </CardTitle>
          {user && !hasReviewed && (
            <Button size="sm" onClick={() => setShowReviewDialog(true)}>
              <Star className="h-4 w-4 mr-1" />
              Avaliar
            </Button>
          )}
        </div>

        {/* Summary */}
        {reviews.length > 0 && (
          <div className="flex items-center gap-4 mt-4 p-4 bg-white/5 rounded-lg">
            <div className="text-center">
              <p className="text-3xl font-bold text-[#F5A623]">{averageRating}</p>
              <div className="mt-1">{renderStars(Math.round(averageRating))}</div>
            </div>
            <div className="text-sm text-white/60">
              <p>{reviews.length} avaliação(ões)</p>
              <p className="text-xs">para "{topicTitle}"</p>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-[#F5A623]" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-8 text-white/50">
            <ThumbsUp className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Nenhuma avaliação ainda.</p>
            <p className="text-sm">Seja o primeiro a avaliar!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.slice(0, 5).map((review) => (
              <div
                key={review.id}
                className="flex gap-3 p-4 bg-white/5 rounded-lg"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={review.user_avatar} />
                  <AvatarFallback className="bg-[#F5A623]/20 text-[#F5A623]">
                    {review.user_name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-white">{review.user_name}</p>
                      <div className="flex items-center gap-2">
                        {renderStars(review.rating)}
                        <span className="text-xs text-white/40">
                          {formatDate(review.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  {review.comment && (
                    <p className="mt-2 text-sm text-white/70">{review.comment}</p>
                  )}
                </div>
              </div>
            ))}
            
            {reviews.length > 5 && (
              <p className="text-center text-sm text-white/50">
                +{reviews.length - 5} avaliações
              </p>
            )}
          </div>
        )}
      </CardContent>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Avaliar: {topicTitle}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-white mb-2 block">
                Sua avaliação
              </label>
              <div className="flex justify-center py-2">
                {renderStars(rating, true, "h-8 w-8")}
              </div>
              <p className="text-center text-sm text-white/50 mt-1">
                {rating === 1 && "Muito ruim"}
                {rating === 2 && "Ruim"}
                {rating === 3 && "Regular"}
                {rating === 4 && "Bom"}
                {rating === 5 && "Excelente"}
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-white mb-1 block">
                Comentário (opcional)
              </label>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Conte sua experiência com este conteúdo..."
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-white/40 mt-1 text-right">
                {comment.length}/500
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmitReview} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Enviar Avaliação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default TutorialReviews;
