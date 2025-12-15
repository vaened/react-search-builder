/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import { describe, expect, it } from "vitest";
import type { ArrayFilterValue, SynchronousSerializer } from "../field";
import resolve from "./resolve";

describe("resolve serializer", () => {
  describe("1. Scalar Types", () => {
    it("should resolve 'string' serializer", () => {
      const serializer = resolve("string");
      expect(serializer.serialize("hello")).toBe("hello");
    });

    it("should resolve 'number' serializer", () => {
      const serializer = resolve("number");
      expect(serializer.serialize(123)).toBe("123");
      expect(serializer.unserialize("456")).toBe(456);
    });

    it("should resolve 'boolean' serializer", () => {
      const serializer = resolve("boolean");
      expect(serializer.unserialize("true")).toBe(true);
      expect(serializer.unserialize("any-other-value")).toBe(false);
      expect(serializer.unserialize("false")).toBe(false);
    });

    it("should resolve 'date' serializer and normalize output to ISO string", () => {
      const serializer = resolve("date");
      const date = new Date("2023-01-01");

      expect(serializer.serialize(date)).toBe("2023-01-01");
      expect(serializer.unserialize("2023-01-01")).toBeInstanceOf(Date);
    });

    it("should accept various common date formats", () => {
      const serializer = resolve("date") as SynchronousSerializer<Date>;

      const shortDate = serializer.unserialize("2023-01-30");
      expect(shortDate).toBeInstanceOf(Date);
      expect(shortDate?.toISOString()).toContain("2023-01-30");

      const timestamp = serializer.unserialize("1675080000000");
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp?.getTime()).toBe(1675080000000);
    });
  });

  describe("2. Array Types", () => {
    it("should resolve 'string[]' serializer", () => {
      const serializer = resolve("string[]");
      const input = ["a", "b"];

      expect(serializer.serialize(input)).toEqual(["a", "b"]);
    });

    it("should resolve 'number[]' serializer", () => {
      const serializer = resolve("number[]");
      expect(serializer.unserialize(["1", "2"])).toEqual([1, 2]);
    });

    it("should resolve 'date[]' serializer correctly", () => {
      const serializer = resolve("date[]");
      const dates = [new Date("2023-01-01"), new Date("2023-01-02")];

      const serialized = serializer.serialize(dates);

      expect(Array.isArray(serialized)).toBe(true);
      expect(serialized[0]).toContain("2023-01-01");
    });
  });

  describe("3. Invalid Data Handling", () => {
    it("should handle invalid items in 'number[]' by returning undefined elements", () => {
      const serializer = resolve("number[]");

      const result = serializer.unserialize(["1", "abc", "2"]);

      expect(result).toEqual([1, 2]);
    });

    it("should handle invalid items in 'date[]' by returning undefined elements", () => {
      const serializer = resolve("date[]") as SynchronousSerializer<ArrayFilterValue>;

      const result = serializer.unserialize(["2023-01-01", "not-a-date"]);

      expect(Array.isArray(result)).toBe(true);

      expect(result?.[0]).toBeInstanceOf(Date);
      expect(result?.[1]).toBeUndefined();
    });
  });

  describe("4. Error Handling", () => {
    it("should throw error for unknown types", () => {
      // @ts-expect-error Testing invalid type at runtime
      expect(() => resolve("unknown_type")).toThrow(/Cannot auto-resolve serializer/);
    });
  });
});
