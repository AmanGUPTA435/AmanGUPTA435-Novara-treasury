export type ActivityStatus = "pending" | "confirmed" | "failed";
export type ActivityType = "Approve" | "Swap";

export type ActivityItem = {
  id: string;
  type: ActivityType;
  amount: string;
  status: ActivityStatus;
  hash?: `0x${string}`;
  timestamp: number;
  blockNumber?: string;
};

const STORAGE_KEY = "novara.activity.v1";

export function loadActivity(address?: string): ActivityItem[] {
  if (typeof window === "undefined" || !address) return [];
  try {
    const raw = window.localStorage.getItem(`${STORAGE_KEY}:${address.toLowerCase()}`);
    if (!raw) return [];
    return JSON.parse(raw) as ActivityItem[];
  } catch (error) {
    console.error("[novara] failed to read activity", error);
    return [];
  }
}

export function saveActivity(address: string, items: ActivityItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    `${STORAGE_KEY}:${address.toLowerCase()}`,
    JSON.stringify(items.slice(0, 40)),
  );
}
