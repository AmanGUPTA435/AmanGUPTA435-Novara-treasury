import { BalancePanel } from "@/components/BalancePanel";
import { ContractsBanner } from "@/components/ContractsBanner";
import { NetworkPanel } from "@/components/NetworkPanel";
import { SwapPanel } from "@/components/SwapPanel";
import { TransactionPanel } from "@/components/TransactionPanel";
import { WithdrawalPanel } from "@/components/WithdrawalPanel";

export default function DashboardPage() {
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <ContractsBanner />

      <WithdrawalPanel />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-4">
          <BalancePanel />
          <SwapPanel />
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <NetworkPanel />
          <TransactionPanel />
        </div>
      </div>
    </div>
  );
}
