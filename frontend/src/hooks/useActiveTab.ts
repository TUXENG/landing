import { useCallback, useEffect, useState } from "react";

import type { TabSlug } from "../types/api";

const VALID_TABS: readonly TabSlug[] = ["desarrollo", "soporte", "academia"];

function parseTabHash(hash: string): TabSlug | null {
  const clean = hash.replace(/^#/, "").trim().toLowerCase();
  return (VALID_TABS as readonly string[]).includes(clean) ? (clean as TabSlug) : null;
}

export function useActiveTab(defaultTab: TabSlug = "desarrollo") {
  const [activeTab, setActiveTabState] = useState<TabSlug>(() => {
    if (typeof window === "undefined") return defaultTab;
    return parseTabHash(window.location.hash) ?? defaultTab;
  });

  useEffect(() => {
    const initialTab = parseTabHash(window.location.hash);
    if (initialTab) {
      requestAnimationFrame(() => {
        document.getElementById("servicios")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

    const onHashChange = () => {
      const next = parseTabHash(window.location.hash);
      if (next) {
        setActiveTabState(next);
      }
    };

    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const selectTab = useCallback((tab: TabSlug, scrollToSection = false) => {
    setActiveTabState(tab);
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${tab}`);
      if (scrollToSection) {
        document.getElementById("servicios")?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, []);

  return { activeTab, selectTab };
}
