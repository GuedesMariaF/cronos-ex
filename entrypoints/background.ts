const HEARTBEAT_INTERVAL_MS = 30_000;   // 30s — aparece mais rápido no popup
const SYNC_INTERVAL_MINUTES = 1;
const IDLE_THRESHOLD_SECONDS = 60;
const ALARM_NAME = "cronos-sync";

interface HeartbeatEntry {
  url: string;
  timestamp: string;
}

interface StorageConfig {
  apiUrl: string;
  userId: string;
  apiToken: string;
}

interface LocalStorage {
  heartbeatQueue: HeartbeatEntry[];
  domainSeconds: Record<string, number>;
}

let currentTabId: number | null = null;
let currentDomain = "";
let lastHeartbeatTime = 0;
let isUserIdle = false;

export default defineBackground(() => {
  chrome.alarms.get(ALARM_NAME, (existing) => {
    if (!existing) {
      chrome.alarms.create(ALARM_NAME, { periodInMinutes: SYNC_INTERVAL_MINUTES });
    }
  });

  chrome.idle.setDetectionInterval(IDLE_THRESHOLD_SECONDS);
  chrome.idle.onStateChanged.addListener((state) => {
    isUserIdle = state !== "active";
  });

  // Detecta a aba ativa imediatamente ao iniciar (service worker pode reiniciar a qualquer momento)
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) handleContextChange(tabs[0].id, tabs[0].url);
  });

  chrome.tabs.onActivated.addListener((activeInfo) => {
    handleContextChange(activeInfo.tabId);
  });

  chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (tabId === currentTabId && changeInfo.url) {
      handleContextChange(tabId, changeInfo.url);
    }
  });

  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === ALARM_NAME) syncDataWithApi();
  });
});

function getConfig(): Promise<StorageConfig> {
  return new Promise((resolve) => {
    chrome.storage.sync.get(
      { apiUrl: "http://127.0.0.1:8000/api/time-spent", userId: "", apiToken: "" },
      (result) => resolve(result as StorageConfig)
    );
  });
}

function getLocalStorage(): Promise<LocalStorage> {
  return new Promise((resolve) => {
    chrome.storage.local.get(
      { heartbeatQueue: [], domainSeconds: {} },
      (result) => resolve(result as LocalStorage)
    );
  });
}

function isSystemPage(url: string): boolean {
  return (
    url.startsWith("chrome://") ||
    url.startsWith("chrome-extension://") ||
    url.startsWith("about:") ||
    url.startsWith("edge://")
  );
}

function handleContextChange(tabId: number, customUrl?: string): void {
  if (isUserIdle) return;

  chrome.tabs.get(tabId, (tab) => {
    if (chrome.runtime.lastError || !tab) return;

    const urlString = customUrl ?? tab.url;
    if (!urlString || isSystemPage(urlString)) {
      currentTabId = null;
      currentDomain = "";
      return;
    }

    let domain: string;
    try {
      domain = new URL(urlString).hostname;
    } catch {
      return;
    }

    const now = Date.now();
    const domainChanged = domain !== currentDomain;
    const heartbeatDue = now - lastHeartbeatTime >= HEARTBEAT_INTERVAL_MS;

    if (domainChanged || heartbeatDue) {
      currentTabId = tabId;
      currentDomain = domain;
      lastHeartbeatTime = now;
      queueHeartbeat(domain, now);
    }
  });
}

function queueHeartbeat(domain: string, timestamp: number): void {
  const isoTimestamp = new Date(timestamp).toISOString();

  getLocalStorage().then(({ heartbeatQueue, domainSeconds }) => {
    const updatedQueue: HeartbeatEntry[] = [
      ...heartbeatQueue,
      { url: domain, timestamp: isoTimestamp },
    ];

    const updatedSeconds = { ...domainSeconds };
    updatedSeconds[domain] = (updatedSeconds[domain] ?? 0) + Math.round(HEARTBEAT_INTERVAL_MS / 1000);

    chrome.storage.local.set({ heartbeatQueue: updatedQueue, domainSeconds: updatedSeconds });
  });
}

async function syncDataWithApi(): Promise<void> {
  const config = await getConfig();
  if (!config.userId) return;

  const { heartbeatQueue: queueToSend } = await getLocalStorage();
  if (queueToSend.length === 0) return;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  if (config.apiToken) {
    headers["Authorization"] = `Bearer ${config.apiToken}`;
  }

  try {
    const response = await fetch(config.apiUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({ user_id: config.userId, user_time_spent: queueToSend }),
    });

    if (!response.ok) {
      console.error(`Cronos: sync falhou [${response.status}]`);
      return;
    }

    const sentTimestamps = new Set(queueToSend.map((e) => e.timestamp));
    const { heartbeatQueue: currentQueue } = await getLocalStorage();
    const remaining = currentQueue.filter((e) => !sentTimestamps.has(e.timestamp));
    chrome.storage.local.set({ heartbeatQueue: remaining });
  } catch (error) {
    console.error("Cronos: erro de rede:", (error as Error).message);
  }
}
