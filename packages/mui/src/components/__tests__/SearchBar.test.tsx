import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createFieldStore } from "@vaened/react-search-builder";
import { describe, expect, it, vi } from "vitest";
import { SearchBar } from "../SearchBar";
import { SearchForm } from "../SearchForm";

const renderWithContext = (ui: React.ReactNode, store = createFieldStore({ persistInUrl: false })) => {
  return {
    ...render(<SearchForm store={store}>{ui}</SearchForm>),
    store,
  };
};

describe("SearchBar Integration", () => {
  describe("1. Basic Query Behavior", () => {
    it("should render input and submit button by default", () => {
      renderWithContext(<SearchBar />);

      expect(screen.queryByTestId("search-input-text")).toBeInTheDocument();
      expect(screen.queryByTestId("search-trigger-button")).toBeInTheDocument();

      expect(screen.queryByTestId("index-trigger-button")).not.toBeInTheDocument();
      expect(screen.queryByTestId("flags-trigger-button")).not.toBeInTheDocument();
    });

    it("should submit the form when clicking the search button", async () => {
      const user = userEvent.setup();
      const onSearchMock = vi.fn();

      const store = createFieldStore({ persistInUrl: false });
      store.onPersist(onSearchMock);

      render(
        <SearchForm store={store}>
          <SearchBar />
        </SearchForm>
      );

      const input = screen.getByTestId("search-input-text");
      await user.type(input, "Test");

      const button = screen.getByTestId("search-trigger-button");
      await user.click(button);

      expect(onSearchMock).toHaveBeenCalled();
    });
  });

  describe("2. Index Select Integration", () => {
    const indexes = {
      users: { label: "Users", value: "users" },
      posts: { label: "Posts", value: "posts" },
    };

    it("should render index selector if 'indexes' prop is provided", () => {
      renderWithContext(<SearchBar indexes={indexes} />);

      expect(screen.getByText("Users")).toBeInTheDocument();
    });

    it("should update 'index' field in store when selection changes", async () => {
      const user = userEvent.setup();
      const { store } = renderWithContext(<SearchBar indexes={indexes} name={{ index: "category" }} />);

      const trigger = screen.getByText("Users");
      await user.click(trigger);

      const option = screen.getByRole("menuitem", { name: "Posts" });
      await user.click(option);

      expect(store.get("category")?.value).toBe("posts");
    });
  });

  describe("3. Flags Select Integration", () => {
    const flags = {
      isActive: { label: "Active Only", value: "active" },
      hasImage: { label: "Has Image", value: "image" },
    };

    it("should render flags selector if 'flags' prop is provided", () => {
      renderWithContext(<SearchBar flags={flags} />);

      expect(screen.getByTestId("flags-trigger-button")).toBeInTheDocument();
    });

    it("should update flags in store when selected", async () => {
      const user = userEvent.setup();
      const { store } = renderWithContext(<SearchBar flags={flags} name={{ flags: "options" }} />);

      const trigger = screen.getByTestId("flags-trigger-button");
      await user.click(trigger);

      const option = screen.getByRole("button", { name: "Active Only" });
      await user.click(option);

      expect(store.get("options")?.value).toEqual(["active"]);
    });
  });
});
