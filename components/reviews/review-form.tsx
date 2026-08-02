"use client";

import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StarRatingInput } from "@/components/reviews/star-rating";

type ExistingReview = { id: string; rating: number; comment: string | null };

export function ReviewForm({
  carId,
  existingReview,
  onSaved,
}: {
  carId: string;
  existingReview?: ExistingReview | null;
  onSaved?: () => void;
}) {
  const utils = trpc.useUtils();
  const [rating, setRating] = useState(existingReview?.rating ?? 0);
  const [comment, setComment] = useState(existingReview?.comment ?? "");

  const invalidate = () => {
    utils.reviews.listByCar.invalidate({ carId });
    utils.reviews.getMine.invalidate({ carId });
    utils.cars.getById.invalidate({ id: carId });
    utils.cars.list.invalidate();
  };

  const create = trpc.reviews.create.useMutation({
    onSuccess: () => {
      toast.success("Review posted.");
      invalidate();
      onSaved?.();
    },
    onError: (error) => toast.error(error.message),
  });

  const update = trpc.reviews.update.useMutation({
    onSuccess: () => {
      toast.success("Review updated.");
      invalidate();
      onSaved?.();
    },
    onError: (error) => toast.error(error.message),
  });

  const isPending = create.isPending || update.isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating < 1) {
      toast.error("Select a star rating.");
      return;
    }
    if (existingReview) {
      update.mutate({ id: existingReview.id, rating, comment: comment.trim() || undefined });
    } else {
      create.mutate({ carId, rating, comment: comment.trim() || undefined });
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-1.5">
        <Label>Your rating</Label>
        <StarRatingInput value={rating} onChange={setRating} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="review-comment">Comment (optional)</Label>
        <Textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="How was the car?"
          rows={3}
        />
      </div>
      <Button type="submit" disabled={isPending}>
        {isPending
          ? "Saving..."
          : existingReview
            ? "Update review"
            : "Post review"}
      </Button>
    </form>
  );
}
