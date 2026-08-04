import { describe, expect, it } from "vitest";
import { matchesCarFilters, type FilterableCar } from "./car-filters";

const car: FilterableCar = {
  category: "sedan",
  transmission: "automatic",
  make: "Toyota",
  model: "Corolla",
  seats: 5,
  pricePerDay: "55.00",
};

describe("matchesCarFilters", () => {
  it("matches everything when no filters are given", () => {
    expect(matchesCarFilters(car, undefined)).toBe(true);
    expect(matchesCarFilters(car, {})).toBe(true);
  });

  it("filters by exact category", () => {
    expect(matchesCarFilters(car, { category: "sedan" })).toBe(true);
    expect(matchesCarFilters(car, { category: "suv" })).toBe(false);
  });

  it("filters by exact transmission", () => {
    expect(matchesCarFilters(car, { transmission: "automatic" })).toBe(true);
    expect(matchesCarFilters(car, { transmission: "manual" })).toBe(false);
  });

  it("filters by exact brand", () => {
    expect(matchesCarFilters(car, { make: "Toyota" })).toBe(true);
    expect(matchesCarFilters(car, { make: "Honda" })).toBe(false);
  });

  it("treats minSeats as an inclusive lower bound", () => {
    expect(matchesCarFilters(car, { minSeats: 5 })).toBe(true);
    expect(matchesCarFilters(car, { minSeats: 4 })).toBe(true);
    expect(matchesCarFilters(car, { minSeats: 6 })).toBe(false);
  });

  it("treats minPrice/maxPrice as an inclusive range", () => {
    expect(matchesCarFilters(car, { minPrice: 55 })).toBe(true);
    expect(matchesCarFilters(car, { minPrice: 56 })).toBe(false);
    expect(matchesCarFilters(car, { maxPrice: 55 })).toBe(true);
    expect(matchesCarFilters(car, { maxPrice: 54 })).toBe(false);
  });

  it("matches search case-insensitively against make or model", () => {
    expect(matchesCarFilters(car, { search: "toyota" })).toBe(true);
    expect(matchesCarFilters(car, { search: "COROLLA" })).toBe(true);
    expect(matchesCarFilters(car, { search: "corol" })).toBe(true);
    expect(matchesCarFilters(car, { search: "honda" })).toBe(false);
  });

  it("requires every provided filter to match (AND, not OR)", () => {
    expect(matchesCarFilters(car, { category: "sedan", make: "Honda" })).toBe(false);
  });
});
