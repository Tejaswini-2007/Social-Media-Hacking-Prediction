import { createContext, useContext, useState, useCallback } from "react";

const AlertsContext = createContext(null);

export function AlertsProvider({ children }) {
  const [alerts, setAlerts] = useState([]);
  const [unread, setUnread] = useState(0);

  const pushAlert = useCallback((result, source = "Analyse") => {
    if (!result) return;
    if (result.action === "ALLOW") return; // only alert on risky outcomes

    const alert = {
      id: Date.now() + Math.random(),
      action: result.action,
      risk_score: result.risk_score,
      source,
      timestamp: result.timestamp || new Date().toISOString(),
    };

    setAlerts(prev => [alert, ...prev].slice(0, 50));
    setUnread(prev => prev + 1);
  }, []);

  const clearUnread = useCallback(() => setUnread(0), []);
  const removeAlert = useCallback((id) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  return (
    <AlertsContext.Provider value={{ alerts, unread, pushAlert, clearUnread, removeAlert }}>
      {children}
    </AlertsContext.Provider>
  );
}

export function useAlerts() {
  return useContext(AlertsContext);
}