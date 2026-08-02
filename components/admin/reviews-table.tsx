"use client";

import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/trpc/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { StarRatingDisplay } from "@/components/reviews/star-rating";

export function AdminReviewsTable() {
  const { data: reviews, isLoading } = trpc.reviews.listAll.useQuery();
  const utils = trpc.useUtils();
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const deleteReview = trpc.reviews.deleteAny.useMutation({
    onSuccess: () => {
      toast.success("Review removed.");
      utils.reviews.listAll.invalidate();
      setPendingDeleteId(null);
    },
    onError: (error) => toast.error(error.message),
  });

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
        No reviews yet.
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Customer</TableHead>
            <TableHead>Car</TableHead>
            <TableHead>Rating</TableHead>
            <TableHead>Comment</TableHead>
            <TableHead>Date</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {reviews.map((review) => (
            <TableRow key={review.id}>
              <TableCell>
                {review.user.name}
                <div className="text-xs text-muted-foreground">{review.user.email}</div>
              </TableCell>
              <TableCell>
                {review.car.make} {review.car.model}
              </TableCell>
              <TableCell>
                <StarRatingDisplay rating={review.rating} />
              </TableCell>
              <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                {review.comment || "—"}
              </TableCell>
              <TableCell className="font-mono text-xs tabular-nums text-muted-foreground">
                {new Date(review.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => setPendingDeleteId(review.id)}
                >
                  Remove
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={!!pendingDeleteId} onOpenChange={(open) => !open && setPendingDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove review</DialogTitle>
            <DialogDescription>
              This will permanently remove this review. This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={deleteReview.isPending}
              onClick={() => pendingDeleteId && deleteReview.mutate({ id: pendingDeleteId })}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
