import { describe, expect, it } from "vitest";
import type { Serializer } from "../field";
import { EMPTY_VALUE, FieldsCollection } from "./FieldsCollection";
import type { GenericRegisteredField } from "./FieldsRepository";

const createField = (
  name: string,
  value: string | number | boolean | Date | string[] | null | undefined,
  type: "string" | "number" | "boolean" | "date" | "string[]" = "string",
  serializer?: Serializer<any>
): GenericRegisteredField => {
  return {
    name,
    type: type as any,
    value,
    defaultValue: null,
    isHydrating: false,
    updatedAt: Date.now(),
    submittable: true,
    humanize: (v: any) => String(v),
    serializer: serializer || {
      serialize: (v: any) => v,
      unserialize: (v: any) => v,
    },
  } as GenericRegisteredField;
};

describe("FieldsCollection", () => {
  describe("1. Creation and Iteration", () => {
    it("should create an empty collection", () => {
      const collection = FieldsCollection.empty();
      expect(collection.size()).toBe(0);
      expect(collection.toArray()).toEqual([]);
    });

    it("should create a collection from a Map", () => {
      const map = new Map();
      map.set("q", createField("q", "hello"));

      const collection = FieldsCollection.from(map);

      expect(collection.size()).toBe(1);
      expect(collection.exists("q")).toBe(true);
    });

    it("should be iterable directly", () => {
      const map = new Map();
      map.set("a", createField("a", 1));
      map.set("b", createField("b", 2));
      const collection = FieldsCollection.from(map);

      const names = [];
      for (const field of collection) {
        names.push(field.name);
      }

      expect(names).toEqual(["a", "b"]);
    });
  });

  describe("2. Transformation", () => {
    it("should convert to a simple values object with toValues()", () => {
      const map = new Map();
      map.set("name", createField("name", "John"));
      map.set("age", createField("age", 30));

      const collection = FieldsCollection.from(map);
      const values = collection.toValues();

      expect(values).toEqual({
        name: "John",
        age: 30,
      });
    });

    it("should serialize values with toPrimitives()", () => {
      const dateSerializer = {
        serialize: (d: Date) => d.toISOString(),
        unserialize: (v: string) => new Date(v),
      };

      const map = new Map();
      map.set("q", createField("q", "search"));
      map.set("date", createField("date", new Date("2023-01-01T00:00:00.000Z"), "date", dateSerializer));
      map.set("empty", createField("empty", null));

      const collection = FieldsCollection.from(map);
      const primitives = collection.toPrimitives();

      expect(primitives).toEqual({
        q: "search",
        date: "2023-01-01T00:00:00.000Z",
      });
    });

    it("should handle array serialization in toPrimitives()", () => {
      const map = new Map();
      map.set("tags", createField("tags", ["a", "b"]));

      const collection = FieldsCollection.from(map);
      const primitives = collection.toPrimitives();

      expect(primitives).toEqual({
        tags: ["a", "b"],
      });
    });
  });

  describe("3. Filtering (Actives/Validations)", () => {
    it("should filter only active fields (ignoring null, undefined, empty string)", () => {
      const map = new Map();
      map.set("valid", createField("valid", "ok"));
      map.set("null", createField("null", null));
      map.set("undefined", createField("undefined", undefined));
      map.set("emptyString", createField("emptyString", EMPTY_VALUE));
      map.set("zero", createField("zero", 0));
      map.set("false", createField("false", false));

      const collection = FieldsCollection.from(map);
      const actives = collection.onlyActives();

      const activeNames = actives.map((f) => f.name);

      expect(activeNames).toContain("valid");
      expect(activeNames).toContain("zero");
      expect(activeNames).toContain("false");

      expect(activeNames).not.toContain("null");
      expect(activeNames).not.toContain("undefined");
      expect(activeNames).not.toContain("emptyString");
    });

    it("should allow custom mapping with map()", () => {
      const map = new Map();
      map.set("a", createField("a", 1));
      map.set("b", createField("b", 2));

      const collection = FieldsCollection.from(map);
      const values = collection.map((f) => f.value);

      expect(values).toEqual([1, 2]);
    });

    it("should allow custom filtering with filter()", () => {
      const map = new Map();
      map.set("keep", createField("keep", 100));
      map.set("drop", createField("drop", 1));

      const collection = FieldsCollection.from(map);
      const result = collection.filter((f) => (f.value as number) > 10);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("keep");
    });
  });
});
