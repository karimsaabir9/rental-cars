import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StarRatingDisplay } from "@/components/reviews/star-rating";
import { initials } from "@/lib/utils";
import type { RouterOutputs } from "@/trpc/routers/_app";

type Review = RouterOutputs["reviews"]["listByCar"][number];

export function ReviewsList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return <p className="text-sm text-muted-foreground">No reviews yet.</p>;
  }

  return (
    <ul className="space-y-6">
      {reviews.map((review) => (
        <li key={review.id} className="flex gap-3">
          <Avatar className="size-9 shrink-0">
            <AvatarImage src={review.user.image ?? undefined} alt={review.user.name} />
            <AvatarFallback className="bg-secondary text-xs font-medium">
              {initials(review.user.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium">{review.user.name}</p>
              <StarRatingDisplay rating={review.rating} />
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {new Date(review.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
              {new Date(review.updatedAt).getTime() !== new Date(review.createdAt).getTime() &&
                " (edited)"}
            </p>
            {review.comment && <p className="mt-2 text-sm">{review.comment}</p>}
          </div>
        </li>
      ))}
    </ul>
  );
}
