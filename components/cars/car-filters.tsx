"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search } from "lucide-react";
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
        <Label htmlFor="search">Search</Label>
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="search"
            type="text"
            className="w-44 pl-8"
            defaultValue={searchParams.get("search") ?? ""}
            onBlur={(e) => updateParam("search", e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") updateParam("search", e.currentTarget.value);
            }}
            placeholder="Make or model"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="category">Category</Label>
        <Select
          defaultValue={searchParams.get("category") ?? "all"}
          onValueChange={(v) => updateParam("category", v)}
        >
          <SelectTrigger id="category" className="w-40">
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
        <Label htmlFor="make">Brand</Label>
        <Select
          defaultValue={searchParams.get("make") ?? "all"}
          onValueChange={(v) => updateParam("make", v)}
        >
          <SelectTrigger id="make" className="w-36">
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
        <Label htmlFor="transmission">Transmission</Label>
        <Select
          defaultValue={searchParams.get("transmission") ?? "all"}
          onValueChange={(v) => updateParam("transmission", v)}
        >
          <SelectTrigger id="transmission" className="w-40">
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
        <Label htmlFor="minSeats">Seats</Label>
        <Select
          defaultValue={searchParams.get("minSeats") ?? "all"}
          onValueChange={(v) => updateParam("minSeats", v)}
        >
          <SelectTrigger id="minSeats" className="w-28">
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
        <Label htmlFor="minPrice">Price/day</Label>
        <div className="flex items-center gap-2">
          <Input
            id="minPrice"
            type="number"
            min={0}
            className="w-24"
            defaultValue={searchParams.get("minPrice") ?? ""}
            onBlur={(e) => updateParam("minPrice", e.target.value)}
            placeholder="Min"
          />
          <span className="text-muted-foreground">&ndash;</span>
          <Input
            id="maxPrice"
            type="number"
            min={0}
            className="w-24"
            defaultValue={searchParams.get("maxPrice") ?? ""}
            onBlur={(e) => updateParam("maxPrice", e.target.value)}
            placeholder="Max"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="sort">Sort by</Label>
        <Select
          defaultValue={searchParams.get("sort") ?? "price_asc"}
          onValueChange={(v) => updateParam("sort", v)}
        >
          <SelectTrigger id="sort" className="w-48">
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
