import { createContext, useContext, useMemo, useState } from "react";
import { sampleVault, folders as sampleFolders, type VaultItem } from "@/data/mockVault";

export interface VaultFolder {
  id: string;
  name: string;
  createdAt: string;
}

interface VaultContextValue {
  items: VaultItem[];
  folders: VaultFolder[];
  addItem: (item: VaultItem) => void;
  updateItem: (id: string, patch: Partial<VaultItem>) => void;
  removeItem: (id: string) => void;
  addFolder: (folder: { name: string }) => void;
  updateFolder: (id: string, patch: Partial<VaultFolder>) => void;
  removeFolder: (id: string) => void;
}

const VaultContext = createContext<VaultContextValue | undefined>(undefined);

export function VaultProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<VaultItem[]>(sampleVault);
  const [folders, setFolders] = useState<VaultFolder[]>(
    sampleFolders.map((name, index) => ({
      id: `folder-${index + 1}`,
      name,
      createdAt: new Date().toISOString(),
    }))
  );

  const api = useMemo<VaultContextValue>(() => ({
    items,
    folders,
    addItem: (item) => setItems((prev) => [item, ...prev]),
    updateItem: (id, patch) =>
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch, modifiedAt: new Date().toISOString() } : it))),
    removeItem: (id) => setItems((prev) => prev.filter((it) => it.id !== id)),
    addFolder: (folder) => {
      const newFolder: VaultFolder = {
        id: `folder-${Date.now()}`,
        name: folder.name,
        createdAt: new Date().toISOString(),
      };
      setFolders((prev) => [...prev, newFolder]);
    },
    updateFolder: (id, patch) =>
      setFolders((prev) => prev.map((folder) => (folder.id === id ? { ...folder, ...patch } : folder))),
    removeFolder: (id) => {
      setFolders((prev) => prev.filter((folder) => folder.id !== id));
      // Remove folder reference from items
      setItems((prev) => prev.map((item) => (item.folder === folders.find(f => f.id === id)?.name ? { ...item, folder: undefined } : item)));
    },
  }), [items, folders]);

  return <VaultContext.Provider value={api}>{children}</VaultContext.Provider>;
}

export function useVault() {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error("useVault must be used within VaultProvider");
  return ctx;
}
