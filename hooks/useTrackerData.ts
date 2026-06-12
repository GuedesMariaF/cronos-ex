import { useEffect, useState } from "react";

export interface DomainEntry {
  domain: string;
  seconds: number;
}

interface TrackerData {
  entries: DomainEntry[];
  totalSeconds: number;
  pendingCount: number;
}

export function useTrackerData(): TrackerData {
  const [entries, setEntries] = useState<DomainEntry[]>([]);
  const [pendingCount, setPendingCount] = useState(0);

  function loadData() {
    chrome.storage.local.get(
      { domainSeconds: {}, heartbeatQueue: [] },
      (result) => {
        const sorted = Object.entries(result.domainSeconds as Record<string, number>)
          .filter(([, s]) => s > 0)
          .sort(([, a], [, b]) => b - a)
          .map(([domain, seconds]) => ({ domain, seconds }));

        setEntries(sorted);
        setPendingCount((result.heartbeatQueue as unknown[]).length);
      }
    );
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

  return { entries, totalSeconds, pendingCount };
}
