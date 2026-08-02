function unsplash(id: string, width: number) {
  return `https://images.unsplash.com/${id}?q=80&w=${width}&auto=format&fit=crop`;
}

export const STOCK_IMAGES = {
  hero: {
    id: "photo-1580679568899-be51739ba2df",
    alt: "Mercedes-AMG GT parked at night beneath a modern parking structure",
  },
  whyChooseUs: {
    id: "photo-1625510872834-7db6c4273870",
    alt: "White Rolls-Royce Cullinan displayed in a premium showroom",
  },
  ctaBanner: {
    id: "photo-1760042770723-5b3324aad901",
    alt: "Classic Porsche 911 convertible parked in golden sunset light",
  },
} as const;

export function stockImageUrl(key: keyof typeof STOCK_IMAGES, width: number) {
  return unsplash(STOCK_IMAGES[key].id, width);
}
