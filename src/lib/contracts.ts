import type { Address } from "viem";
import local from "@/generated/local.json";

export type LocalDeployment = {
  chainId: number;
  testToken: Address;
  mockUsdc: Address;
  treasurySwap: Address;
  treasuryWithdrawal: Address;
};

export const deployment = local as LocalDeployment;

export const ZERO_ADDRESS =
  "0x0000000000000000000000000000000000000000" as Address;

export function contractsReady() {
  return (
    deployment.testToken !== ZERO_ADDRESS &&
    deployment.mockUsdc !== ZERO_ADDRESS &&
    deployment.treasurySwap !== ZERO_ADDRESS &&
    deployment.treasuryWithdrawal !== ZERO_ADDRESS
  );
}
