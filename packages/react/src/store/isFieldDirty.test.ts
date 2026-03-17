import { describe, expect, it } from "vitest";
import type { Field } from "../field";
import { isFieldDirty } from "./isFieldDirty";

describe("isFieldDirty", () => {
  it("should treat equal primitive arrays as clean", () => {
    const field: Field<"string[]", string[]> = {
      name: "tags",
      type: "string[]",
      value: ["a", "b"],
    };

    expect(isFieldDirty(field, ["a", "b"])).toBe(false);
  });

  it("should treat reordered primitive arrays as dirty", () => {
    const field: Field<"string[]", string[]> = {
      name: "tags",
      type: "string[]",
      value: ["a", "b"],
    };

    expect(isFieldDirty(field, ["b", "a"])).toBe(true);
  });

  it("should compare date arrays by getTime", () => {
    const field: Field<"date[]", Date[]> = {
      name: "dates",
      type: "date[]",
      value: [new Date("2024-01-01"), new Date("2024-01-02")],
    };

    expect(
      isFieldDirty(field, [new Date("2024-01-01"), new Date("2024-01-02")]),
    ).toBe(false);
  });

  it("should keep object arrays dirty without a custom comparator", () => {
    const field: Field<"object[]", object[]> = {
      name: "items",
      type: "object[]",
      value: [{ id: 1 }],
    };

    expect(isFieldDirty(field, [{ id: 1 }])).toBe(true);
  });

  it("should honor a custom comparator before the default array equality", () => {
    const field: Field<"string[]", string[]> = {
      name: "tags",
      type: "string[]",
      value: ["a", "b"],
      isValueEqualsTo: (current, next) => current.join(",") === next.join(","),
    };

    expect(isFieldDirty(field, ["a", "b"])).toBe(false);
  });
});
