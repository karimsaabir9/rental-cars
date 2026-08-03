import { describe, expect, it } from "vitest";
import { paginate } from "./paginate";

describe("paginate", () => {
  const items = Array.from({ length: 25 }, (_, i) => i + 1);

  it("returns the first page by default page size", () => {
    const result = paginate(items, 1, 10);
    expect(result).toEqual({ items: items.slice(0, 10), page: 1, pageCount: 3 });
  });

  it("returns the last (partial) page", () => {
    const result = paginate(items, 3, 10);
    expect(result).toEqual({ items: [21, 22, 23, 24, 25], page: 3, pageCount: 3 });
  });

  it("clamps a page number above the last page down to the last page", () => {
    const result = paginate(items, 99, 10);
    expect(result.page).toBe(3);
    expect(result.items).toEqual([21, 22, 23, 24, 25]);
  });

  it("clamps a page number below 1 up to 1", () => {
    const result = paginate(items, 0, 10);
    expect(result.page).toBe(1);
  });

  it("reports a pageCount of 1 for an empty array", () => {
    const result = paginate([] as number[], 1, 10);
    expect(result).toEqual({ items: [], page: 1, pageCount: 1 });
  });

  it("fits everything on one page when pageSize exceeds the array length", () => {
    const result = paginate(items, 1, 100);
    expect(result.pageCount).toBe(1);
    expect(result.items).toHaveLength(25);
  });
});
