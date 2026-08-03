import { describe, expect, it } from "vitest";
import { matchesQuery } from "./search";

describe("matchesQuery", () => {
  it("matches when any field contains the query, case-insensitively", () => {
    expect(matchesQuery(["Ada Lovelace", "ada@example.com"], "LOVELACE")).toBe(true);
  });

  it("returns false when no field matches", () => {
    expect(matchesQuery(["Ada Lovelace", "ada@example.com"], "grace")).toBe(false);
  });

  it("treats an empty or whitespace-only query as matching everything", () => {
    expect(matchesQuery(["Ada Lovelace"], "")).toBe(true);
    expect(matchesQuery(["Ada Lovelace"], "   ")).toBe(true);
  });

  it("ignores null/undefined fields without throwing", () => {
    expect(matchesQuery([null, undefined, "Toyota Corolla"], "corolla")).toBe(true);
    expect(matchesQuery([null, undefined], "corolla")).toBe(false);
  });
});
