// Applying filters in JS (rather than SQL) is what lets cars.list cache the
// underlying DB fetch once and reuse it across every filter/sort
// combination -- see the comment on getCachedAvailableCarsBase in
// trpc/routers/cars.ts for why. Extracted here so this business logic
// (previously implicit in a SQL WHERE clause) is unit tested directly.
export type CarFilterInput = {
  category?: string;
  transmission?: string;
  make?: string;
  minSeats?: number;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
};

export type FilterableCar = {
  category: string;
  transmission: string;
  make: string;
  model: string;
  seats: number;
  pricePerDay: string;
};

export function matchesCarFilters(car: FilterableCar, filters: CarFilterInput | undefined): boolean {
  if (!filters) return true;
  if (filters.category && car.category !== filters.category) return false;
  if (filters.transmission && car.transmission !== filters.transmission) return false;
  if (filters.make && car.make !== filters.make) return false;
  if (filters.minSeats && car.seats < filters.minSeats) return false;
  if (filters.minPrice && Number(car.pricePerDay) < filters.minPrice) return false;
  if (filters.maxPrice && Number(car.pricePerDay) > filters.maxPrice) return false;
  if (filters.search) {
    const term = filters.search.toLowerCase();
    const inMake = car.make.toLowerCase().includes(term);
    const inModel = car.model.toLowerCase().includes(term);
    if (!inMake && !inModel) return false;
  }
  return true;
}
