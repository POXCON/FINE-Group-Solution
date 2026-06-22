import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AppCard } from "./AppCard";
import type { PortalCard } from "../types";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const enabledCard: PortalCard = {
  id: "invoice-search",
  titleKey: "portal.cards.invoiceSearch.title",
  descriptionKey: "portal.cards.invoiceSearch.description",
  icon: "invoiceSearch",
  href: "https://invoice.example.com",
  comingSoon: false,
};

const comingSoonCard: PortalCard = {
  id: "inventory",
  titleKey: "portal.cards.inventory.title",
  descriptionKey: "portal.cards.inventory.description",
  icon: "inventory",
  comingSoon: true,
};

describe("AppCard", () => {
  it("renders an enabled card as a link to its href", () => {
    render(<AppCard card={enabledCard} />);
    const link = screen.getByRole("link", {
      name: "portal.cards.invoiceSearch.title",
    });
    expect(link).toHaveAttribute("href", "https://invoice.example.com");
    expect(screen.getByText("portal.open")).toBeDefined();
  });

  it("renders a coming-soon card as a disabled, non-link element", () => {
    render(<AppCard card={comingSoonCard} />);
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("portal.comingSoon")).toBeDefined();
    const disabled = screen.getByText("portal.cards.inventory.title").closest("div");
    expect(disabled?.closest('[aria-disabled="true"]')).not.toBeNull();
  });

  it("does not render as a link when comingSoon is false but href is missing", () => {
    render(<AppCard card={{ ...enabledCard, href: undefined }} />);
    expect(screen.queryByRole("link")).toBeNull();
  });
});
