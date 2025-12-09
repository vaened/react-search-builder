import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createFieldStore } from "@vaened/react-search-builder";
import { describe, expect, it } from "vitest";
import { ActiveFiltersBar } from "../ActiveFiltersBar";
import { SearchForm } from "../SearchForm";

const renderWithStore = (initialData: Record<string, string> = {}) => {
  const store = createFieldStore({ persistInUrl: false });

  Object.entries(initialData).forEach(([key, value]) => {
    store.register({ name: key, type: "string", value: "" as string, humanize: (v: string) => v });

    if (value) {
      store.set(key, value);
    }
  });

  store.persist();

  return {
    ...render(
      <SearchForm store={store}>
        <ActiveFiltersBar limitTags={100} />
      </SearchForm>
    ),
    store,
  };
};

describe("ActiveFiltersBar", () => {
  it("should render nothing if no filters are active", () => {
    renderWithStore({});
    expect(screen.queryByTestId("clear-all-filters-trigger-button")).toBeDisabled();
  });

  it("should render chips for active filters", async () => {
    renderWithStore({ status: "active", type: "user" });

    const chipActive = await screen.findByText("active");
    expect(chipActive).toBeInTheDocument();

    const chipUser = await screen.findByText("user");
    expect(chipUser).toBeInTheDocument();
  });

  it("should remove a specific filter when clicking its chip delete icon", async () => {
    const user = userEvent.setup();
    const { store } = renderWithStore({ status: "active", role: "admin" });
    const chipLabel = await screen.findByText("active");

    const chip = chipLabel.closest(".MuiChip-root");

    expect(chip).toBeInTheDocument();

    const deleteBtn = within(chip as HTMLElement).getByTestId("CancelIcon");

    await user.click(deleteBtn);

    expect(store.get("status")?.value).toBeNull();
    expect(store.get("role")?.value).toBe("admin");
  });

  it("should clear all filters when clicking 'Clear All'", async () => {
    const user = userEvent.setup();
    const { store } = renderWithStore({ a: "1", b: "2" });

    const clearButton = screen.getByTestId("clear-all-filters-trigger-button");

    await waitFor(() => {
      expect(clearButton).not.toBeDisabled();
    });

    await user.click(clearButton);

    expect(store.get("a")?.value).toBe("");
    expect(store.get("b")?.value).toBe("");
  });
});
