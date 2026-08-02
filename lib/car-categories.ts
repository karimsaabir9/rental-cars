export const CAR_CATEGORIES = [
  { value: "sedan", label: "Sedan" },
  { value: "suv", label: "SUV" },
  { value: "hatchback", label: "Hatchback" },
  { value: "coupe", label: "Coupe" },
  { value: "convertible", label: "Convertible" },
  { value: "pickup", label: "Pickup" },
  { value: "van", label: "Van" },
  { value: "minivan", label: "Minivan" },
  { value: "luxury", label: "Luxury" },
  { value: "sports_car", label: "Sports Car" },
  { value: "electric", label: "Electric" },
  { value: "hybrid", label: "Hybrid" },
] as const;

export const CAR_CATEGORY_VALUES = CAR_CATEGORIES.map((c) => c.value) as [
  (typeof CAR_CATEGORIES)[number]["value"],
  ...(typeof CAR_CATEGORIES)[number]["value"][],
];

export type CarCategory = (typeof CAR_CATEGORIES)[number]["value"];

const LABEL_BY_VALUE = new Map(CAR_CATEGORIES.map((c) => [c.value, c.label]));

export function carCategoryLabel(value: string): string {
  return LABEL_BY_VALUE.get(value as CarCategory) ?? value;
}
