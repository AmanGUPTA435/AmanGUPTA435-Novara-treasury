import type { Address } from "viem";

export function shortenAddress(address?: string) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatTokenAmount(value: string, maxFractionDigits = 6) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "0";
  return number.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: maxFractionDigits,
  });
}

export function explorerPath(hash: Address | string) {
  return `#tx/${hash}`;
}
