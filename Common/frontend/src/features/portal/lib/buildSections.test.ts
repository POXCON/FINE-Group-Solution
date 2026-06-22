import { describe, it, expect } from "vitest";
import { buildSections } from "./buildSections";

const URL = "https://invoice.example.com";

describe("buildSections", () => {
  describe("non-admin user", () => {
    const sections = buildSections({ isAdmin: false, invoiceSearchUrl: URL });

    it("shows only the everyday-tools section", () => {
      expect(sections).toHaveLength(1);
      expect(sections[0].titleKey).toBe("portal.userSection");
    });

    it("does not expose the invoice search card", () => {
      const ids = sections.flatMap((s) => s.cards.map((c) => c.id));
      expect(ids).not.toContain("invoice-search");
    });

    it("marks every everyday card as coming soon", () => {
      expect(sections[0].cards.every((c) => c.comingSoon)).toBe(true);
    });
  });

  describe("admin user", () => {
    const sections = buildSections({ isAdmin: true, invoiceSearchUrl: URL });

    it("shows both admin and everyday sections", () => {
      expect(sections).toHaveLength(2);
      expect(sections[0].titleKey).toBe("portal.adminSection");
      expect(sections[1].titleKey).toBe("portal.userSection");
    });

    it("enables only the invoice search card in the admin section", () => {
      const adminCards = sections[0].cards;
      const enabled = adminCards.filter((c) => !c.comingSoon);
      expect(enabled).toHaveLength(1);
      expect(enabled[0].id).toBe("invoice-search");
    });

    it("wires the invoice search card to the provided URL", () => {
      const invoice = sections[0].cards.find((c) => c.id === "invoice-search");
      expect(invoice?.href).toBe(URL);
    });

    it("keeps sales-review and tax-export coming soon without href", () => {
      const comingSoon = sections[0].cards.filter((c) => c.comingSoon);
      expect(comingSoon.map((c) => c.id).sort()).toEqual([
        "sales-review",
        "tax-export",
      ]);
      expect(comingSoon.every((c) => c.href === undefined)).toBe(true);
    });
  });
});
