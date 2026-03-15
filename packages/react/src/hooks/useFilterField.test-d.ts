import { describe, expectTypeOf, test } from "vitest";
import { useFilterField } from ".";
import { createFieldStore } from "../store";

declare const store: ReturnType<typeof createFieldStore>;

describe("Complex Type Inference (useFilterField)", () => {
  describe("1. Scalar Types Inference", () => {
    test("should correctly infer 'string' type", () => {
      const { value, set } = useFilterField(store, {
        name: "query",
        type: "string",
        defaultValue: "initial" as string,
        serializer: {
          serialize: (v) => v,
          unserialize: (v) => v,
        },
      });

      expectTypeOf(value).toEqualTypeOf<string | null>();
      expectTypeOf(set).toBeCallableWith("new value");
      expectTypeOf(set).toBeCallableWith("new value", { submittable: false });

      // @ts-expect-error Should not accept numbers
      set(123);

      // @ts-expect-error Should not accept invalid options
      set("new value", { submittable: "nope" });
    });

    test("should correctly infer 'number' type", () => {
      const { value, set } = useFilterField(store, {
        name: "age",
        type: "number",
        defaultValue: 18 as number,
        serializer: {
          serialize: (v) => String(v),
          unserialize: (v) => Number(v),
        },
      });

      expectTypeOf(value).toEqualTypeOf<number | null>();
      expectTypeOf(set).toBeCallableWith(25);

      // @ts-expect-error Should not accept strings
      set("25");
    });

    test("should correctly infer 'boolean' type", () => {
      const { value, set } = useFilterField(store, {
        name: "isActive",
        type: "boolean",
        defaultValue: true as boolean,
        serializer: {
          serialize: (v) => v.toString(),
          unserialize: (v) => v === "true",
        },
      });

      expectTypeOf(value).toEqualTypeOf<boolean | null>();
      expectTypeOf(set).toBeCallableWith(false);

      // @ts-expect-error Should not accept strings "true"
      set("true");
    });
  });

  describe("2. Literal Union Types", () => {
    test("should infer specific string literals (Union Type)", () => {
      type Status = "active" | "inactive" | "pending";

      const { value, set } = useFilterField(store, {
        name: "status",
        type: "string",
        defaultValue: "active" as Status,
      });

      expectTypeOf(value).toEqualTypeOf<Status | null>();
      expectTypeOf(set).toBeCallableWith("inactive");

      // @ts-expect-error Should reject invalid strings
      set("deleted");
    });

    test("should infer specific number literals", () => {
      type ValidScores = 1 | 2 | 3 | 4 | 5;

      const { value, set } = useFilterField(store, {
        name: "score",
        type: "number",
        defaultValue: 5 as ValidScores,
      });

      expectTypeOf(value).toEqualTypeOf<ValidScores | null>();
      expectTypeOf(set).toBeCallableWith(3);

      // @ts-expect-error Should reject invalid numbers
      set(10);
    });
  });

  describe("3. Array Types Inference", () => {
    test("should infer 'string[]' even with empty array default", () => {
      const { value, set } = useFilterField(store, {
        name: "tags",
        type: "string[]",
        defaultValue: [],
      });

      expectTypeOf(value).toEqualTypeOf<string[] | null>();
      expectTypeOf(set).toBeCallableWith(["react", "vitest"]);

      // @ts-expect-error Should not accept single string
      set("react");
    });

    test("should infer 'number[]' correctly", () => {
      const { value, set } = useFilterField(store, {
        name: "ids",
        type: "number[]",
        defaultValue: [1, 2, 3],
      });

      expectTypeOf(value).toEqualTypeOf<number[] | null>();
      expectTypeOf(set).toBeCallableWith([4, 5]);

      // @ts-expect-error Should not accept strings inside array
      set([1, "2"]);
    });

    test("should infer array of literals", () => {
      type Role = "admin" | "user" | "guest";

      const { value, set } = useFilterField(store, {
        name: "roles",
        type: "string[]",
        defaultValue: [] as Role[],
      });

      expectTypeOf(value).toEqualTypeOf<Role[] | null>();
      expectTypeOf(set).toBeCallableWith(["admin", "user"]);

      // @ts-expect-error Should reject invalid literal
      set(["admin", "superadmin"]);
    });
  });

  describe("4. Object Types (Complex Structures)", () => {
    test("should infer custom object type", () => {
      type DateRange = { start: string; end: string };

      const { value, set } = useFilterField(store, {
        name: "range",
        type: "object",
        defaultValue: { start: "2023-01-01", end: "2023-12-31" } as DateRange,
      });

      expectTypeOf(value).toEqualTypeOf<DateRange | null>();

      expectTypeOf(set).toBeCallableWith({ start: "2024-01-01", end: "2024-01-31" });

      // @ts-expect-error Should enforce object shape
      set({ start: "2024-01-01" });
    });

    test("should infer array of objects", () => {
      type User = { id: number; name: string };

      const { value, set } = useFilterField(store, {
        name: "users",
        type: "object[]",
        defaultValue: [] as User[],
      });

      expectTypeOf(value).toEqualTypeOf<User[] | null>();

      expectTypeOf(set).toBeCallableWith([{ id: 1, name: "Alice" }]);

      // @ts-expect-error Should enforce object shape inside array
      set([{ id: 1 }]);
    });
  });

  describe("5. Type Safety & Constraints (Negative Tests)", () => {
    test("should prevent assigning array default to scalar field", () => {
      // @ts-expect-error defaultValue [] is not assignable to type string
      useFilterField(store, {
        name: "fail",
        type: "string",
        defaultValue: [],
      });
    });

    test("should prevent assigning scalar default to array field", () => {
      // @ts-expect-error defaultValue string is not assignable to type string[]
      useFilterField(store, {
        name: "fail",
        type: "string[]",
        defaultValue: "invalid",
      });
    });

    test("should prevent type mismatch between 'type' prop and 'defaultValue'", () => {
      useFilterField(store, {
        name: "fail",
        type: "number",
        // @ts-expect-error 'number' type prop conflicts with string defaultValue
        defaultValue: "100",
      });
    });
  });
});
