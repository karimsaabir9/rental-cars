"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { trpc } from "@/trpc/client";
import { useSession } from "@/lib/auth-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StarRatingDisplay } from "@/components/reviews/star-rating";
import { ReviewForm } from "@/components/reviews/review-form";
import { ReviewsList } from "@/components/reviews/reviews-list";
import { initials } from "@/lib/utils";

export function ReviewsSection({ carId }: { carId: string }) {
  const { data: session } = useSession();
  const utils = trpc.useUtils();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: allReviews, isLoading } = trpc.reviews.listByCar.useQuery({ carId });
  const { data: myReview } = trpc.reviews.getMine.useQuery(
    { carId },
    { enabled: !!session },
  );
  const { data: eligibility } = trpc.reviews.canReview.useQuery(
    { carId },
    { enabled: !!session && !myReview },
  );

  const deleteMine = trpc.reviews.deleteMine.useMutation({
    onSuccess: () => {
      toast.success("Review deleted.");
      utils.reviews.listByCar.invalidate({ carId });
      utils.reviews.getMine.invalidate({ carId });
      utils.cars.getById.invalidate({ id: carId });
      utils.cars.list.invalidate();
      setConfirmDelete(false);
    },
    onError: (error) => toast.error(error.message),
  });

  const otherReviews = useMemo(
    () => (allReviews ?? []).filter((r) => r.id !== myReview?.id),
    [allReviews, myReview],
  );

  const { average, count } = useMemo(() => {
    if (!allReviews || allReviews.length === 0) return { average: 0, count: 0 };
    const sum = allReviews.reduce((acc, r) => acc + r.rating, 0);
    return { average: sum / allReviews.length, count: allReviews.length };
  }, [allReviews]);

  if (isLoading) return <Skeleton className="h-48 w-full" />;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <StarRatingDisplay rating={average} size="lg" />
        <span className="font-mono text-sm tabular-nums text-muted-foreground">
          {count > 0 ? `${average.toFixed(1)} (${count} review${count > 1 ? "s" : ""})` : "No reviews yet"}
        </span>
      </div>

      {session ? (
        myReview && !editing ? (
          <div className="flex gap-3 rounded-xl border border-border bg-card p-4">
            <Avatar className="size-9 shrink-0">
              <AvatarImage src={session.user.image ?? undefined} alt={session.user.name} />
              <AvatarFallback className="bg-secondary text-xs font-medium">
                {initials(session.user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">Your review</p>
                  <StarRatingDisplay rating={myReview.rating} />
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => setEditing(true)} aria-label="Edit review">
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setConfirmDelete(true)}
                    aria-label="Delete review"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
              {myReview.comment && <p className="mt-2 text-sm">{myReview.comment}</p>}
            </div>
          </div>
        ) : myReview && editing ? (
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="mb-4 text-sm font-medium">Edit your review</p>
            <ReviewForm
              carId={carId}
              existingReview={myReview}
              onSaved={() => setEditing(false)}
            />
            <Button variant="ghost" size="sm" className="mt-2" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        ) : eligibility?.eligible ? (
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="mb-4 text-sm font-medium">Write a review</p>
            <ReviewForm carId={carId} />
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Rent this car to leave a review once your trip is complete.
          </p>
        )
      ) : (
        <p className="text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-accent hover:underline">
            Sign in
          </Link>{" "}
          to leave a review.
        </p>
      )}

      <ReviewsList reviews={otherReviews} />

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete your review</DialogTitle>
            <DialogDescription>This can&apos;t be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteMine.isPending}
              onClick={() => myReview && deleteMine.mutate({ id: myReview.id })}
            >
              {deleteMine.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
