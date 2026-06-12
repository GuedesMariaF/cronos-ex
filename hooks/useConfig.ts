import { useEffect, useState } from "react";

export interface Config {
  userId: string;
  apiUrl: string;
  apiToken: string;
}

const DEFAULT_CONFIG: Config = {
  userId: "",
  apiUrl: "http://127.0.0.1:8000/api/time-spent",
  apiToken: "",
};

interface UseConfigReturn {
  config: Config;
  saved: boolean;
  setConfig: React.Dispatch<React.SetStateAction<Config>>;
  handleSave: () => void;
}

export function useConfig(): UseConfigReturn {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    chrome.storage.sync.get(DEFAULT_CONFIG, (result) =>
      setConfig(result as Config)
    );
  }, []);

  function handleSave() {
    chrome.storage.sync.set(config, () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    });
  }

  return { config, saved, setConfig, handleSave };
}
