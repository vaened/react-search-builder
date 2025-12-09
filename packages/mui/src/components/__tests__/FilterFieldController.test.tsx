/**
 * @author enea dhack <contact@vaened.dev>
 * @link https://vaened.dev DevFolio
 */

import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createFieldStore } from "@vaened/react-search-builder";
import { describe, expect, it } from "vitest";
import FilterFieldController, { FieldController } from "../FilterFieldController";

const renderController = (props: Partial<FieldController<"string" | "number", string | number>> = {}) => {
  const store = createFieldStore({ persistInUrl: false });

  const utils = render(
    <FilterFieldController
      store={store}
      name="testField"
      type="string"
      defaultValue=""
      {...props}
      control={({ value, onChange }) => (
        <input data-testid="controlled-input" value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
      )}
    />
  );

  return { ...utils, store };
};

describe("FilterFieldController", () => {
  it("should register the field in the store on mount", () => {
    const { store } = renderController({ defaultValue: "initial" });

    const field = store.get("testField");
    expect(field).toBeDefined();
    expect(field?.value).toBe("initial");
  });

  it("should pass the store value to the control component", () => {
    renderController({ defaultValue: "hello world" });

    const input = screen.getByTestId("controlled-input");
    expect(input).toHaveValue("hello world");
  });

  it("should update the store when control calls onChange", async () => {
    const user = userEvent.setup();
    const { store } = renderController();

    const input = screen.getByTestId("controlled-input");

    await user.type(input, "new value");

    expect(store.get("testField")?.value).toBe("new value");
  });

  it("should update the control when store changes externally", () => {
    const { store } = renderController();
    const input = screen.getByTestId("controlled-input");

    act(() => {
      store.set("testField", "external change");
    });

    expect(input).toHaveValue("external change");
  });

  it("should handle arrays correctly", async () => {
    const store = createFieldStore({ persistInUrl: false });

    render(
      <FilterFieldController
        store={store}
        name="tags"
        type="string[]"
        defaultValue={[]}
        control={({ value, onChange }) => (
          <button data-testid="add-tag" onClick={() => onChange([...(value || []), "new"])}>
            {value?.join(",")}
          </button>
        )}
      />
    );

    const button = screen.getByTestId("add-tag");

    await userEvent.click(button);

    expect(store.get("tags")?.value).toEqual(["new"]);
    expect(button).toHaveTextContent("new");
  });

  it("should serialize/deserialize values if serializer is provided", () => {
    const serializer = {
      serialize: (v: number) => String(v * 2),
      unserialize: (v: string) => Number(v) / 2,
    };

    const { store } = renderController({
      type: "number",
      defaultValue: 10,
      serializer,
    });

    expect(store.get("testField")?.value).toBe(10);
    expect(store.get("testField")?.serializer?.serialize(2)).toBe("4");
    expect(store.get("testField")?.serializer?.unserialize("2")).toBe(1);
  });

  it("should unregister the field when component unmounts", () => {
    const { store, unmount } = renderController();

    expect(store.get("testField")).toBeDefined();

    unmount();

    expect(store.get("testField")).toBeUndefined();
  });
});
