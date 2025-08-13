import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { apiClient, type VaultItem as ApiVaultItem, type VaultFolder as ApiVaultFolder, type VaultItemCreateData } from "@/lib/api";
import { encryptionService } from "@/lib/encryption";
import { toast } from "sonner";

// Use API types but with string IDs for compatibility
export interface VaultItem extends Omit<ApiVaultItem, 'id' | 'folder'> {
  id: string;
  // Frontend-specific fields for compatibility
  site: string; // Maps to 'name'
  username?: string;
  password?: string;
  notes?: string;
  modifiedAt: string; // Maps to 'updated_at'
  favorite?: boolean; // Maps to 'is_favorite'
  folder?: string; // Maps to folder name (string instead of number)
}

export interface VaultFolder {
  id: string;
  name: string;
  createdAt: string;
  items_count?: number;
}

interface VaultContextValue {
  items: VaultItem[];
  folders: VaultFolder[];
  loading: boolean;
  addItem: (item: VaultItem) => Promise<void>;
  updateItem: (id: string, patch: Partial<VaultItem>) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  addFolder: (folder: { name: string }) => Promise<void>;
  updateFolder: (id: string, patch: Partial<VaultFolder>) => Promise<void>;
  removeFolder: (id: string) => Promise<void>;
  refreshItems: () => Promise<void>;
  refreshFolders: () => Promise<void>;
  initializeEncryption: () => boolean; // Add method to manually initialize encryption
}

const VaultContext = createContext<VaultContextValue | undefined>(undefined);

// Helper function to convert API item to frontend format
function apiItemToFrontend(apiItem: ApiVaultItem): VaultItem {
  const decryptedData = apiItem.decrypted_data || {};
  return {
    ...apiItem,
    id: apiItem.id.toString(),
    site: apiItem.name,
    username: decryptedData.username,
    password: decryptedData.password,
    notes: decryptedData.notes,
    modifiedAt: apiItem.updated_at,
    favorite: apiItem.is_favorite,
    folder: apiItem.folder_name,
  };
}

// Helper function to convert frontend item to API format
function frontendItemToApi(item: VaultItem, folders: VaultFolder[] = []): VaultItemCreateData {
  // Find folder ID by name if folder is specified
  let folderId: number | undefined;
  if (item.folder && item.folder !== "no-folder") {
    const folder = folders.find(f => f.name === item.folder);
    folderId = folder ? parseInt(folder.id) : undefined;
  }

  return {
    name: item.site,
    item_type: item.item_type,
    sensitiveData: {
      username: item.username,
      password: item.password,
      notes: item.notes,
      url: item.site,
    },
    folder: folderId,
    is_favorite: item.favorite,
  };
}

export function VaultProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<VaultItem[]>([]);
  const [folders, setFolders] = useState<VaultFolder[]>([]);
  const [loading, setLoading] = useState(false);

  // Check if encryption is ready, and try to initialize if needed
  const ensureEncryptionReady = useCallback((showPrompt: boolean = true): boolean => {
    if (encryptionService.isReady()) {
      return true;
    }

    // Try to initialize encryption if user is logged in but encryption not ready
    const currentUser = apiClient.getCurrentUser();
    if (currentUser) {
      if (!showPrompt) {
        // Silent check - don't prompt user yet
        return false;
      }

      // Ask user to re-enter their password to reinitialize encryption
      const password = prompt(
        "Your encryption key is not available. Please enter your password to access your vault:"
      );
      
      if (password) {
        try {
          const userSalt = `locksmith_user_${currentUser.id}_salt_v1`;
          encryptionService.setMasterKey(password, userSalt);
          console.log('🔐 Encryption reinitialized successfully');
          toast.success("Encryption key restored successfully!");
          return true;
        } catch (error) {
          console.error('Failed to reinitialize encryption:', error);
          toast.error("Invalid password. Please try again or log in again.");
          return false;
        }
      } else {
        toast.error("Password required to access your encrypted vault.");
        return false;
      }
    }

    if (showPrompt) {
      toast.error("Please log in to access your vault.");
    }
    return false;
  }, []);

  // Load initial data
  useEffect(() => {
    if (apiClient.isAuthenticated()) {
      // Always try to initialize encryption on page load
      if (ensureEncryptionReady(true)) {
        refreshItems();
        refreshFolders();
      } else {
        console.log('⚠️ Failed to initialize encryption - user may need to log in again');
        // Consider redirecting to login if encryption fails
      }
    }
  }, [ensureEncryptionReady]);

  const refreshItems = useCallback(async () => {
    if (!ensureEncryptionReady(true)) {
      return; // Exit early if encryption is not available
    }

    try {
      setLoading(true);
      const apiItems = await apiClient.getVaultItems();
      const frontendItems = apiItems.map(apiItemToFrontend);
      setItems(frontendItems);
    } catch (error) {
      console.error('Failed to load vault items:', error);
      if (error instanceof Error && error.message.includes('Encryption service not initialized')) {
        // Try to recover encryption
        ensureEncryptionReady(true);
      } else {
        toast.error('Failed to load vault items');
      }
    } finally {
      setLoading(false);
    }
  }, [ensureEncryptionReady]);

  const refreshFolders = useCallback(async () => {
    try {
      const apiFolders = await apiClient.getVaultFolders();
      const frontendFolders = apiFolders.map(folder => ({
        ...folder,
        id: folder.id.toString(),
        createdAt: folder.created_at,
      }));
      setFolders(frontendFolders);
    } catch (error) {
      console.error('Failed to load folders:', error);
      toast.error('Failed to load folders');
    }
  }, []);

  const addItem = useCallback(async (item: VaultItem) => {
    if (!ensureEncryptionReady(true)) {
      throw new Error('Encryption not available');
    }

    try {
      setLoading(true);
      const createData = frontendItemToApi(item, folders);
      const newApiItem = await apiClient.createVaultItem(createData);
      const newFrontendItem = apiItemToFrontend(newApiItem);
      setItems(prev => [newFrontendItem, ...prev]);
      toast.success('Item added successfully');
    } catch (error) {
      console.error('Failed to add item:', error);
      if (error instanceof Error && error.message.includes('Encryption service not initialized')) {
        // This shouldn't happen now, but just in case
        ensureEncryptionReady(true);
      }
      toast.error('Failed to add item');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [ensureEncryptionReady, folders]);

  const updateItem = useCallback(async (id: string, patch: Partial<VaultItem>) => {
    try {
      setLoading(true);
      
      // Handle folder assignment
      let folderId: number | undefined;
      if (patch.folder !== undefined) {
        if (patch.folder && patch.folder !== "no-folder") {
          const folder = folders.find(f => f.name === patch.folder);
          folderId = folder ? parseInt(folder.id) : undefined;
        } else {
          folderId = undefined; // Clear folder assignment
        }
      }
      
      const updateData: Partial<VaultItemCreateData> = {
        name: patch.site,
        item_type: patch.item_type,
        is_favorite: patch.favorite,
        folder: folderId,
      };
      
      if (patch.username || patch.password || patch.notes) {
        updateData.sensitiveData = {
          username: patch.username,
          password: patch.password,
          notes: patch.notes,
          url: patch.site,
        };
      }

      const updatedApiItem = await apiClient.updateVaultItem(parseInt(id), updateData);
      const updatedFrontendItem = apiItemToFrontend(updatedApiItem);
      
      setItems(prev => prev.map(item => item.id === id ? updatedFrontendItem : item));
      toast.success('Item updated successfully');
    } catch (error) {
      console.error('Failed to update item:', error);
      toast.error('Failed to update item');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [folders]);

  const removeItem = useCallback(async (id: string) => {
    try {
      setLoading(true);
      await apiClient.deleteVaultItem(parseInt(id));
      setItems(prev => prev.filter(item => item.id !== id));
      toast.success('Item deleted successfully');
    } catch (error) {
      console.error('Failed to delete item:', error);
      toast.error('Failed to delete item');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const addFolder = useCallback(async (folder: { name: string }) => {
    try {
      const newApiFolder = await apiClient.createVaultFolder(folder.name);
      const newFrontendFolder = {
        ...newApiFolder,
        id: newApiFolder.id.toString(),
        createdAt: newApiFolder.created_at,
      };
      setFolders(prev => [...prev, newFrontendFolder]);
      toast.success('Folder created successfully');
    } catch (error) {
      console.error('Failed to create folder:', error);
      toast.error('Failed to create folder');
      throw error;
    }
  }, []);

  const updateFolder = useCallback(async (id: string, patch: Partial<VaultFolder>) => {
    try {
      if (patch.name) {
        const updatedApiFolder = await apiClient.updateVaultFolder(parseInt(id), patch.name);
        const updatedFrontendFolder = {
          ...updatedApiFolder,
          id: updatedApiFolder.id.toString(),
          createdAt: updatedApiFolder.created_at,
        };
        setFolders(prev => prev.map(folder => folder.id === id ? updatedFrontendFolder : folder));
        toast.success('Folder updated successfully');
      }
    } catch (error) {
      console.error('Failed to update folder:', error);
      toast.error('Failed to update folder');
      throw error;
    }
  }, []);

  const removeFolder = useCallback(async (id: string) => {
    try {
      await apiClient.deleteVaultFolder(parseInt(id));
      setFolders(prev => prev.filter(folder => folder.id !== id));
      // Items with this folder will have their folder set to null by the backend
      await refreshItems();
      toast.success('Folder deleted successfully');
    } catch (error) {
      console.error('Failed to delete folder:', error);
      toast.error('Failed to delete folder');
      throw error;
    }
  }, [refreshItems]);

  const value: VaultContextValue = {
    items,
    folders,
    loading,
    addItem,
    updateItem,
    removeItem,
    addFolder,
    updateFolder,
    removeFolder,
    refreshItems,
    refreshFolders,
    initializeEncryption: () => ensureEncryptionReady(true),
  };

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
}

export function useVault() {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error("useVault must be used within VaultProvider");
  return ctx;
}
