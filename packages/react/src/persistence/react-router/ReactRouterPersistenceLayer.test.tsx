import { render, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { describe, expect, it, vi } from "vitest";
import { useFilterField } from "../../hooks/useFilterField";
import { useSearchStore } from "../../hooks/useSearchStore";
import { ReactRouterPersistenceLayer } from "./ReactRouterPersistenceLayer";

const navigate = vi.fn();

vi.mock("react-router-dom", () => ({
  useLocation: () => ({
    pathname: "/customers",
    search: "?utm=google",
    hash: "#summary",
  }),
  useNavigate: () => navigate,
}));

describe("ReactRouterPersistenceLayer", () => {
  it("should provide React Router persistence as the default for useSearchStore", async () => {
    navigate.mockReset();

    function Probe() {
      const store = useSearchStore();
      const { set } = useFilterField(store, {
        type: "string",
        name: "q",
        defaultValue: "" as string,
      });

      useEffect(() => {
        set("john");
        store.persist();
      }, [set, store]);

      return null;
    }

    render(
      <ReactRouterPersistenceLayer>
        <Probe />
      </ReactRouterPersistenceLayer>,
    );

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledWith("/customers?utm=google&q=john#summary", {
        replace: false,
        state: undefined,
      });
    });
  });
});
