// Case-insensitive substring match across multiple fields, used for
// client-side filtering of already-loaded admin table data.
export function matchesQuery(haystacks: (string | null | undefined)[], query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return haystacks.some((h) => h?.toLowerCase().includes(q));
}
