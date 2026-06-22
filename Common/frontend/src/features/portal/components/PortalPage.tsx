import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/features/auth/hooks/useAuthContext";
import { isAdmin } from "@/features/auth/lib/roles";
import { PortalHeader } from "./PortalHeader";
import { AppCard } from "./AppCard";
import { buildSections } from "../lib/buildSections";
import { resolveInvoiceSearchUrl } from "../lib/config";

export function PortalPage(): React.JSX.Element {
  const { t } = useTranslation();
  const { user } = useAuth();

  const sections = useMemo(
    () =>
      buildSections({
        isAdmin: isAdmin(user),
        invoiceSearchUrl: resolveInvoiceSearchUrl(),
      }),
    [user],
  );

  return (
    <div className="min-h-screen bg-base-200">
      <PortalHeader />

      <main className="mx-auto w-full max-w-5xl p-4 md:p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-base-content md:text-2xl">
            {t("portal.title")}
          </h1>
          <p className="mt-1 text-sm text-base-content/60">
            {t("portal.subtitle")}
          </p>
        </div>

        <div className="space-y-8">
          {sections.map((section) => (
            <section key={section.titleKey}>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-base-content/50">
                {t(section.titleKey)}
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {section.cards.map((card) => (
                  <AppCard key={card.id} card={card} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
