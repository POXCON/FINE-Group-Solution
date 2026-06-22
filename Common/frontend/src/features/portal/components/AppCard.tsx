import { useTranslation } from "react-i18next";
import type { PortalCard } from "../types";
import { CardIcon } from "./CardIcon";

interface AppCardProps {
  card: PortalCard;
}

export function AppCard({ card }: AppCardProps): React.JSX.Element {
  const { t } = useTranslation();
  const title = t(card.titleKey);
  const description = t(card.descriptionKey);

  const content = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <CardIcon name={card.icon} />
        </div>
        {card.comingSoon ? (
          <span className="badge-soft-neutral rounded-md px-2 py-1 text-xs font-medium">
            {t("portal.comingSoon")}
          </span>
        ) : (
          <span className="badge-soft-success rounded-md px-2 py-1 text-xs font-medium">
            {t("portal.open")}
          </span>
        )}
      </div>
      <div className="mt-4">
        <h3 className="text-base font-semibold text-base-content">{title}</h3>
        <p className="mt-1 text-sm leading-relaxed text-base-content/60">
          {description}
        </p>
      </div>
    </>
  );

  if (card.comingSoon || !card.href) {
    return (
      <div
        aria-disabled="true"
        className="cursor-not-allowed rounded-box border border-base-300 bg-base-100 p-5 opacity-60 shadow-card"
      >
        {content}
      </div>
    );
  }

  return (
    <a
      href={card.href}
      aria-label={title}
      className="group block rounded-box border border-base-300 bg-base-100 p-5 shadow-card transition hover:border-primary/40 hover:shadow-elevated focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
    >
      {content}
    </a>
  );
}
