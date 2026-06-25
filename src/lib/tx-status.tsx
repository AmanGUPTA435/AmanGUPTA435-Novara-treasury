"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useAccount } from "wagmi";
import {
  loadActivity,
  saveActivity,
  type ActivityItem,
  type ActivityStatus,
} from "@/lib/activity";

export type TxPhase =
  | "idle"
  | "wallet"
  | "submitting"
  | "pending"
  | "confirmed"
  | "failed";

type TxState = {
  phase: TxPhase;
  hash?: `0x${string}`;
  error?: string;
  label?: string;
};

type TxContextValue = {
  tx: TxState;
  activity: ActivityItem[];
  setPhase: (phase: TxPhase, extra?: Partial<TxState>) => void;
  reset: () => void;
  recordActivity: (item: Omit<ActivityItem, "id" | "timestamp">) => void;
};

const TxContext = createContext<TxContextValue | null>(null);

export function TxProvider({ children }: { children: ReactNode }) {
  const { address } = useAccount();
  const [tx, setTx] = useState<TxState>({ phase: "idle" });
  const [activity, setActivity] = useState<ActivityItem[]>([]);

  useEffect(() => {
    setActivity(loadActivity(address));
  }, [address]);

  const persist = useCallback(
    (items: ActivityItem[]) => {
      setActivity(items);
      if (address) saveActivity(address, items);
    },
    [address],
  );

  const setPhase = useCallback((phase: TxPhase, extra?: Partial<TxState>) => {
    setTx((current) => ({ ...current, phase, error: extra?.error, ...extra }));
  }, []);

  const reset = useCallback(() => {
    setTx({ phase: "idle" });
  }, []);

  const recordActivity = useCallback(
    (item: Omit<ActivityItem, "id" | "timestamp">) => {
      const next: ActivityItem = {
        ...item,
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        timestamp: Date.now(),
      };
      persist([next, ...loadActivity(address)]);
    },
    [address, persist],
  );

  const value = useMemo(
    () => ({ tx, activity, setPhase, reset, recordActivity }),
    [tx, activity, setPhase, reset, recordActivity],
  );

  return <TxContext.Provider value={value}>{children}</TxContext.Provider>;
}

export function useTx() {
  const value = useContext(TxContext);
  if (!value) {
    throw new Error("useTx must be used within TxProvider");
  }
  return value;
}

export function statusFromPhase(phase: TxPhase): ActivityStatus {
  if (phase === "confirmed") return "confirmed";
  if (phase === "failed") return "failed";
  return "pending";
}
