"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CAR_CATEGORIES } from "@/lib/car-categories";

const SEAT_OPTIONS = [
  { value: "2", label: "2+" },
  { value: "4", label: "4+" },
  { value: "5", label: "5+" },
  { value: "7", label: "7+" },
];

const SORT_OPTIONS = [
  { value: "price_asc", label: "Price: low to high" },
  { value: "price_desc", label: "Price: high to low" },
  { value: "rating_desc", label: "Highest rated" },
  { value: "popular_desc", label: "Most popular" },
  { value: "newest", label: "Newest" },
];

export function CarFilters({ makes }: { makes: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="space-y-1.5">
        <Label>Category</Label>
        <Select
          defaultValue={searchParams.get("category") ?? "all"}
          onValueChange={(v) => updateParam("category", v)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All categories</SelectItem>
            {CAR_CATEGORIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Brand</Label>
        <Select
          defaultValue={searchParams.get("make") ?? "all"}
          onValueChange={(v) => updateParam("make", v)}
        >
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Any brand" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any brand</SelectItem>
            {makes.map((make) => (
              <SelectItem key={make} value={make}>
                {make}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Transmission</Label>
        <Select
          defaultValue={searchParams.get("transmission") ?? "all"}
          onValueChange={(v) => updateParam("transmission", v)}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any</SelectItem>
            <SelectItem value="automatic">Automatic</SelectItem>
            <SelectItem value="manual">Manual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Seats</Label>
        <Select
          defaultValue={searchParams.get("minSeats") ?? "all"}
          onValueChange={(v) => updateParam("minSeats", v)}
        >
          <SelectTrigger className="w-28">
            <SelectValue placeholder="Any" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Any</SelectItem>
            {SEAT_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="minPrice">Min price/day</Label>
        <Input
          id="minPrice"
          type="number"
          min={0}
          className="w-28"
          defaultValue={searchParams.get("minPrice") ?? ""}
          onBlur={(e) => updateParam("minPrice", e.target.value)}
          placeholder="Any"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="maxPrice">Max price/day</Label>
        <Input
          id="maxPrice"
          type="number"
          min={0}
          className="w-28"
          defaultValue={searchParams.get("maxPrice") ?? ""}
          onBlur={(e) => updateParam("maxPrice", e.target.value)}
          placeholder="Any"
        />
      </div>

      <div className="space-y-1.5">
        <Label>Sort by</Label>
        <Select
          defaultValue={searchParams.get("sort") ?? "price_asc"}
          onValueChange={(v) => updateParam("sort", v)}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
