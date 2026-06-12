const HEARTBEAT_INTERVAL_MS = 30_000;
const IDLE_THRESHOLD_SECONDS = 60;
const ALARM_NAME = "cronos-heartbeat";

let currentTabId: number | null = null;
let currentDomain = "";
let lastHeartbeatTime = 0;
let isUserIdle = false;

export default defineBackground(() => {
  // Alarme mantém o service worker ativo e acumula tempo periodicamente
  chrome.alarms.get(ALARM_NAME, (existing) => {
    if (!existing) {
      chrome.alarms.create(ALARM_NAME, { periodInMinutes: 1 });
    }
  });

  chrome.idle.setDetectionInterval(IDLE_THRESHOLD_SECONDS);
  chrome.idle.onStateChanged.addListener((state) => {
    isUserIdle = state !== "active";
  });

  // Detecta aba ativa ao iniciar (service worker pode reiniciar a qualquer momento)
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

  // A cada minuto, acumula tempo na aba atual mesmo sem trocar de aba
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name !== ALARM_NAME) return;
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) handleContextChange(tabs[0].id, tabs[0].url);
    });
  });
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function isSystemPage(url: string): boolean {
  return (
    url.startsWith("chrome://") ||
    url.startsWith("chrome-extension://") ||
    url.startsWith("about:") ||
    url.startsWith("edge://")
  );
}

// ── Lógica de tracking ───────────────────────────────────────────────────────

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
      recordHeartbeat(domain);
    }
  });
}

function recordHeartbeat(domain: string): void {
  chrome.storage.local.get({ domainSeconds: {} }, (result) => {
    const domainSeconds = { ...(result.domainSeconds as Record<string, number>) };
    domainSeconds[domain] = (domainSeconds[domain] ?? 0) + Math.round(HEARTBEAT_INTERVAL_MS / 1000);
    chrome.storage.local.set({ domainSeconds });
  });
}
