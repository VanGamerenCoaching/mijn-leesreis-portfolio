"use client";

import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

const privacyNoticeKey = "mijn-leesreis-privacy-notice-seen";
const portfolioStorageKey = "mijn-leesreis-portfolio-v1";
const legacyBooksStorageKey = "mijn-leesreis-books";
const legacyGoalsStorageKey = "mijn-leesreis-goals";
const bannerText =
  "Deze app bewaart gegevens alleen lokaal in deze browser. Vul geen gevoelige persoonsgegevens in.";
const hintText = "Schrijf over het boek, niet over privézaken.";
const exportWarning = "Controleer je portfolio op privé-informatie voordat je het deelt.";

function usePageFlags() {
  const pathname = usePathname();
  const normalizedPath = pathname || "/";

  return {
    isDashboard: normalizedPath === "/" || normalizedPath.endsWith("/mijn-leesreis-portfolio"),
    isPortfolio: normalizedPath.endsWith("/portfolio"),
    isPrivacyPage: normalizedPath.endsWith("/over")
  };
}

function readLocalStorage(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeLocalStorage(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // localStorage can be unavailable; the UI can still work for this session.
  }
}

function removeLocalStorage(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Clearing should not crash when browser storage is blocked.
  }
}

function pageContains(text: string) {
  return typeof document !== "undefined" && document.body.innerText.includes(text);
}

function injectReflectionHints() {
  const labels = Array.from(document.querySelectorAll("label"));
  const targetLabels = ["Favoriete quote", "Reflectie", "Notitie", "Mijn antwoorden"];

  labels.forEach((label) => {
    const firstLabelText = label.querySelector("span")?.textContent?.trim() || "";

    if (!targetLabels.includes(firstLabelText) || label.textContent?.includes(hintText)) {
      return;
    }

    const hint = document.createElement("span");
    hint.dataset.privacyHint = "true";
    hint.className = "text-sm font-semibold text-ink/60";
    hint.textContent = hintText;
    label.querySelector("span")?.insertAdjacentElement("afterend", hint);
  });
}

export function PrivacyTools() {
  const { isDashboard, isPortfolio, isPrivacyPage } = usePageFlags();
  const [showBanner, setShowBanner] = useState(false);
  const [hasNativeClearButton, setHasNativeClearButton] = useState(true);
  const [hasNativePortfolioWarning, setHasNativePortfolioWarning] = useState(true);
  const [hasNativePrivacyPage, setHasNativePrivacyPage] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const nativeBanner = pageContains(bannerText);
    setShowBanner(!nativeBanner && readLocalStorage(privacyNoticeKey) !== "true");
    setHasNativeClearButton(pageContains("Wis alle lokale gegevens"));
    setHasNativePortfolioWarning(pageContains(exportWarning));
    setHasNativePrivacyPage(pageContains("Voor docenten") && pageContains("geen tracking"));
  }, [isDashboard, isPortfolio, isPrivacyPage]);

  useEffect(() => {
    injectReflectionHints();
    const observer = new MutationObserver(injectReflectionHints);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isPortfolio || hasNativePortfolioWarning) {
      return;
    }

    const handleExportClick = (event: MouseEvent) => {
      const button = (event.target as HTMLElement | null)?.closest("button");
      const label = button?.textContent || "";
      const isExportAction =
        label.includes("Print portfolio") ||
        label.includes("Kopieer portfolio") ||
        label.includes("Download");

      if (isExportAction && !window.confirm(`${exportWarning}\n\nWil je doorgaan?`)) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    document.addEventListener("click", handleExportClick, true);
    return () => document.removeEventListener("click", handleExportClick, true);
  }, [hasNativePortfolioWarning, isPortfolio]);

  const privacyItems = useMemo(
    () => [
      "Geen AI.",
      "Geen API of externe API-calls.",
      "Geen tracking, analytics of externe scripts.",
      "Geen database, backend of accounts.",
      "Alles blijft lokaal in localStorage in deze browser.",
      "Een docent ziet niets automatisch.",
      "Wis gegevens op gedeelde apparaten."
    ],
    []
  );

  const clearData = () => {
    const confirmed = window.confirm(
      "Weet je zeker dat je alle lokale gegevens wilt wissen? Dit verwijdert boeken, leesmomenten, verslagen en doelen uit deze browser."
    );

    if (!confirmed) {
      return;
    }

    removeLocalStorage(portfolioStorageKey);
    removeLocalStorage(privacyNoticeKey);
    removeLocalStorage(legacyBooksStorageKey);
    removeLocalStorage(legacyGoalsStorageKey);
    setMessage("Alle lokale gegevens zijn gewist in deze browser.");
    window.location.reload();
  };

  return (
    <div data-privacy-tools="true" className="no-print">
      {showBanner ? (
        <section className="border-b border-marigold/30 bg-marigold/10">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 text-sm font-semibold leading-6 text-ink sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <p>{bannerText}</p>
            <button
              type="button"
              className="button-secondary shrink-0"
              onClick={() => {
                writeLocalStorage(privacyNoticeKey, "true");
                setShowBanner(false);
              }}
            >
              Begrepen
            </button>
          </div>
        </section>
      ) : null}

      {isDashboard && !hasNativeClearButton ? (
        <section className="mx-auto max-w-7xl px-4 pb-2 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-ink/10 bg-white p-4 shadow-soft">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-ink/70">
                Gebruik je een gedeeld apparaat? Wis je lokale gegevens als je klaar bent.
              </p>
              <button type="button" className="button-secondary text-berry" onClick={clearData}>
                Wis alle lokale gegevens
              </button>
            </div>
            {message ? <p className="mt-3 text-sm font-semibold text-leaf">{message}</p> : null}
          </div>
        </section>
      ) : null}

      {isPortfolio && !hasNativePortfolioWarning ? (
        <section className="mx-auto max-w-7xl px-4 pb-2 sm:px-6 lg:px-8">
          <p className="rounded-md border border-marigold/30 bg-marigold/10 px-4 py-3 text-sm font-semibold leading-6 text-ink">
            {exportWarning}
          </p>
        </section>
      ) : null}

      {isPrivacyPage && !hasNativePrivacyPage ? (
        <section className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
          <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-soft">
            <h2 className="text-xl font-bold text-ink">Privacy en AVG</h2>
            <ul className="mt-4 grid gap-3 text-ink/70 md:grid-cols-2">
              {privacyItems.map((item) => (
                <li key={item} className="rounded-md bg-chalk p-3">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </div>
  );
}
