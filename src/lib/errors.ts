import {
  BaseError,
  ContractFunctionRevertedError,
  UserRejectedRequestError,
} from "viem";

export function toUserMessage(error: unknown) {
  console.error("[novara]", error);

  if (error instanceof UserRejectedRequestError) {
    return "Transaction rejected";
  }

  const raw =
    error instanceof BaseError
      ? `${error.shortMessage} ${error.details ?? ""} ${error.walk?.()?.message ?? ""}`
      : error instanceof Error
        ? error.message
        : String(error);

  const lower = raw.toLowerCase();

  if (lower.includes("user rejected") || lower.includes("denied transaction")) {
    return "Transaction rejected";
  }
  if (lower.includes("insufficient allowance") || lower.includes("erc20insufficientallowance")) {
    return "Insufficient allowance";
  }
  if (
    lower.includes("insufficient balance") ||
    lower.includes("transfer amount exceeds balance") ||
    lower.includes("erc20insufficientbalance")
  ) {
    return "Insufficient balance";
  }
  if (lower.includes("insufficient funds") || lower.includes("insufficient_funds")) {
    return "Insufficient ETH for gas";
  }
  if (lower.includes("wrong network") || lower.includes("chain mismatch")) {
    return "Wrong network";
  }
  if (lower.includes("connector not connected") || lower.includes("connection")) {
    return "Wallet not connected";
  }
  if (
    lower.includes("reverted") ||
    lower.includes("execution reverted") ||
    error instanceof ContractFunctionRevertedError
  ) {
    return "Transaction reverted";
  }

  return "Transaction failed";
}
