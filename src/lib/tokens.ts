import { parseUnits } from "viem";
import { SETTLEMENT_DECIMALS } from "@/lib/constants";

export function parseSwapInput(value: string) {
  return parseUnits(value, SETTLEMENT_DECIMALS);
}

export function isPositiveAmount(value: string) {
  if (!value) return false;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0;
}
