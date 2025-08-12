import { createContext, useContext, useMemo, useState } from "react";
import { sampleVault, type VaultItem } from "@/data/mockVault";

interface VaultContextValue {
  items: VaultItem[];
  addItem: (item: VaultItem) => void;
  updateItem: (id: string, patch: Partial<VaultItem>) => void;
  removeItem: (id: string) => void;
}

const VaultContext = createContext<VaultContextValue | undefined>(undefined);

export function VaultProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<VaultItem[]>(sampleVault);

  const api = useMemo<VaultContextValue>(() => ({
    items,
    addItem: (item) => setItems((prev) => [item, ...prev]),
    updateItem: (id, patch) =>
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch, modifiedAt: new Date().toISOString() } : it))),
    removeItem: (id) => setItems((prev) => prev.filter((it) => it.id !== id)),
  }), [items]);

  return <VaultContext.Provider value={api}>{children}</VaultContext.Provider>;
}

export function useVault() {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error("useVault must be used within VaultProvider");
  return ctx;
}
