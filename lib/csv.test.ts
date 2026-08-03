import { describe, expect, it } from "vitest";
import { toCsv } from "./csv";

describe("toCsv", () => {
  it("writes a header row from column labels", () => {
    const csv = toCsv([{ name: "Ada" }], [{ label: "Name", value: (r) => r.name }]);
    expect(csv.split("\r\n")[0]).toBe("Name");
  });

  it("joins multiple columns and rows", () => {
    const rows = [
      { name: "Ada", age: 30 },
      { name: "Grace", age: 40 },
    ];
    const csv = toCsv(rows, [
      { label: "Name", value: (r) => r.name },
      { label: "Age", value: (r) => r.age },
    ]);
    expect(csv).toBe("Name,Age\r\nAda,30\r\nGrace,40");
  });

  it("quotes a cell containing a comma", () => {
    const csv = toCsv([{ v: "Smith, Jane" }], [{ label: "V", value: (r) => r.v }]);
    expect(csv).toBe('V\r\n"Smith, Jane"');
  });

  it("quotes and escapes a cell containing double quotes", () => {
    const csv = toCsv([{ v: 'She said "hi"' }], [{ label: "V", value: (r) => r.v }]);
    expect(csv).toBe('V\r\n"She said ""hi"""');
  });

  it("quotes a cell containing a newline", () => {
    const csv = toCsv([{ v: "line1\nline2" }], [{ label: "V", value: (r) => r.v }]);
    expect(csv).toBe('V\r\n"line1\nline2"');
  });

  it("leaves plain cells unquoted", () => {
    const csv = toCsv([{ v: "plain" }], [{ label: "V", value: (r) => r.v }]);
    expect(csv).toBe("V\r\nplain");
  });

  it("produces just the header for an empty dataset", () => {
    const csv = toCsv([] as { v: string }[], [{ label: "V", value: (r) => r.v }]);
    expect(csv).toBe("V");
  });
});
