"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export function StarRatingDisplay({
  rating,
  size = "sm",
}: {
  rating: number;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClass = size === "lg" ? "size-5" : size === "md" ? "size-4" : "size-3.5";
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const fill = Math.max(0, Math.min(1, rating - (n - 1)));
        return (
          <span key={n} className={cn("relative", sizeClass)}>
            <Star className={cn(sizeClass, "absolute inset-0 text-muted-foreground/30")} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className={cn(sizeClass, "fill-accent text-accent")} />
            </span>
          </span>
        );
      })}
    </div>
  );
}

export function StarRatingInput({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const display = hovered ?? value;

  return (
    <div className="flex items-center gap-1" onMouseLeave={() => setHovered(null)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          className="p-0.5 outline-none focus-visible:ring-2 focus-visible:ring-ring/50 rounded"
        >
          <Star
            className={cn(
              "size-6 transition-colors",
              n <= display ? "fill-accent text-accent" : "text-muted-foreground/30",
            )}
          />
        </button>
      ))}
    </div>
  );
}
