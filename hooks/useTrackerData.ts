import { useEffect, useState } from "react";

export interface DomainEntry {
  domain: string;
  seconds: number;
}

interface TrackerData {
  entries: DomainEntry[];
  totalSeconds: number;
}

export function useTrackerData(): TrackerData {
  const [entries, setEntries] = useState<DomainEntry[]>([]);

  function loadData() {
    chrome.storage.local.get({ domainSeconds: {} }, (result) => {
      const sorted = Object.entries(result.domainSeconds as Record<string, number>)
        .filter(([, s]) => s > 0)
        .sort(([, a], [, b]) => b - a)
        .map(([domain, seconds]) => ({ domain, seconds }));

      setEntries(sorted);
    });
  }

  useEffect(() => {
    loadData();
    const listener = (_: unknown, area: string) => {
      if (area === "local") loadData();
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  const totalSeconds = entries.reduce((sum, e) => sum + e.seconds, 0);

  return { entries, totalSeconds };
}
