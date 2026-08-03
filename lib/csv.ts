// Client-side CSV export -- admin tables already have the full dataset
// loaded via tRPC, so this builds and downloads a file from that in-memory
// data rather than adding a separate export endpoint.

export type CsvColumn<T> = { label: string; value: (row: T) => string | number };

function escapeCsvCell(cell: string | number): string {
  const s = String(cell);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv<T>(rows: T[], columns: CsvColumn<T>[]): string {
  const header = columns.map((c) => escapeCsvCell(c.label)).join(",");
  const lines = rows.map((row) => columns.map((c) => escapeCsvCell(c.value(row))).join(","));
  return [header, ...lines].join("\r\n");
}

export function downloadCsv(filename: string, csv: string) {
  // Leading BOM so Excel (which guesses encoding without one) renders
  // non-ASCII characters correctly instead of mangling them.
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
