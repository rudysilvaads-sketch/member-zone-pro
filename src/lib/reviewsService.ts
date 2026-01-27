import { supabase } from "@/integrations/supabase/client";

export interface TutorialReview {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  topic_id: string;
  rating: number;
  comment?: string;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

// Fetch reviews for a topic
export const getTopicReviews = async (topicId: string): Promise<TutorialReview[]> => {
  const { data, error } = await supabase
    .from('tutorial_reviews')
    .select('*')
    .eq('topic_id', topicId)
    .eq('is_approved', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }

  return data as TutorialReview[];
};

// Fetch all reviews (for admin)
export const getAllReviews = async (): Promise<TutorialReview[]> => {
  const { data, error } = await supabase
    .from('tutorial_reviews')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching all reviews:', error);
    return [];
  }

  return data as TutorialReview[];
};

// Create a new review
export const createReview = async (
  userId: string,
  userName: string,
  userAvatar: string | undefined,
  topicId: string,
  rating: number,
  comment?: string
): Promise<{ success: boolean; error?: string }> => {
  // Check if user already reviewed this topic
  const { data: existing } = await supabase
    .from('tutorial_reviews')
    .select('id')
    .eq('user_id', userId)
    .eq('topic_id', topicId)
    .maybeSingle();

  if (existing) {
    return { success: false, error: 'Você já avaliou este tópico' };
  }

  const { error } = await supabase
    .from('tutorial_reviews')
    .insert({
      user_id: userId,
      user_name: userName,
      user_avatar: userAvatar || null,
      topic_id: topicId,
      rating,
      comment: comment || null,
    });

  if (error) {
    console.error('Error creating review:', error);
    return { success: false, error: 'Erro ao criar avaliação' };
  }

  return { success: true };
};

// Update a review
export const updateReview = async (
  reviewId: string,
  rating: number,
  comment?: string
): Promise<boolean> => {
  const { error } = await supabase
    .from('tutorial_reviews')
    .update({ rating, comment, updated_at: new Date().toISOString() })
    .eq('id', reviewId);

  if (error) {
    console.error('Error updating review:', error);
    return false;
  }

  return true;
};

// Delete a review
export const deleteReview = async (reviewId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('tutorial_reviews')
    .delete()
    .eq('id', reviewId);

  if (error) {
    console.error('Error deleting review:', error);
    return false;
  }

  return true;
};

// Calculate average rating
export const calculateAverageRating = (reviews: TutorialReview[]): number => {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
};
