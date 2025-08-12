export type SecurityStatus = "strong" | "weak" | "compromised";

export type VaultItemType = "login" | "card" | "note" | "identity";

export interface VaultItem {
  id: string;
  type: VaultItemType;
  site: string; // domain or label
  username?: string;
  password?: string;
  notes?: string;
  modifiedAt: string; // ISO date
  createdAt: string; // ISO date
  strength: SecurityStatus;
  favorite?: boolean;
  folder?: string;
  tags?: string[];
}

export const getFaviconUrl = (site: string) => {
  const domain = site.replace(/^https?:\/\//, "").split("/")[0];
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
};

export const folders = ["Work", "Personal", "Banking"];

export const sampleVault: VaultItem[] = [
  {
    id: "1",
    type: "login",
    site: "https://github.com",
    username: "dev@example.com",
    password: "s3cureP@ss!",
    notes: "2FA enabled",
    createdAt: "2024-10-10T10:00:00Z",
    modifiedAt: "2025-01-03T12:30:00Z",
    strength: "strong",
    favorite: true,
    folder: "Work",
    tags: ["code", "work"],
  },
  {
    id: "2",
    type: "login",
    site: "https://bank.example.com",
    username: "me@example.com",
    password: "Password123",
    createdAt: "2024-09-01T08:00:00Z",
    modifiedAt: "2025-01-01T09:15:00Z",
    strength: "weak",
    folder: "Banking",
    tags: ["finance"],
  },
  {
    id: "3",
    type: "login",
    site: "https://twitter.com",
    username: "@secure_me",
    password: "reusedPass!",
    createdAt: "2024-08-15T08:00:00Z",
    modifiedAt: "2024-12-20T09:15:00Z",
    strength: "compromised",
    favorite: false,
    folder: "Personal",
    tags: ["social", "personal"],
  },
  {
    id: "4",
    type: "note",
    site: "Secure Note – WiFi",
    notes: "Home WiFi: SSID NovaNet",
    createdAt: "2024-07-01T10:00:00Z",
    modifiedAt: "2024-11-03T14:00:00Z",
    strength: "strong",
    folder: "Personal",
  },
  {
    id: "5",
    type: "login",
    site: "https://amazon.com",
    username: "shopper@example.com",
    password: "Sup3r$hopping",
    createdAt: "2024-06-21T10:00:00Z",
    modifiedAt: "2025-01-05T09:00:00Z",
    strength: "strong",
    favorite: true,
    folder: "Personal",
    tags: ["shopping", "personal"],
  },
  {
    id: "6",
    type: "login",
    site: "https://notion.so",
    username: "notes@example.com",
    password: "letmein",
    createdAt: "2024-04-10T10:00:00Z",
    modifiedAt: "2024-12-31T21:00:00Z",
    strength: "weak",
    folder: "Work",
    tags: ["productivity", "work", "notes"],
  }
];
