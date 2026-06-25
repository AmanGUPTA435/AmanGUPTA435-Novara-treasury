export default function DocsPage() {
  return (
    <article className="panel panel-pad space-y-6">
      <header>
        <p className="label">Reference</p>
        <h2 className="mt-1 text-lg font-semibold">Documentation</h2>
        <p className="mt-2 max-w-2xl text-sm text-novara-mist">
          Novara Treasury is a local TEST to USDC conversion desk. It talks only to an Anvil node
          running on this machine.
        </p>
      </header>

      <section className="space-y-2">
        <h3 className="text-base font-medium">Network</h3>
        <ul className="list-disc space-y-1 pl-5 text-sm text-novara-mist">
          <li>RPC: http://127.0.0.1:8545</li>
          <li>Chain ID: 31337</li>
          <li>Name: Anvil Local</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-medium">Assets</h3>
        <ul className="list-disc space-y-1 pl-5 text-sm text-novara-mist">
          <li>TEST — 18 decimals</li>
          <li>USDC — 6 decimals</li>
          <li>Quoted rate: 1 TEST = 0.95 USDC</li>
        </ul>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-medium">Contracts</h3>
        <p className="text-sm text-novara-mist">
          Deployment addresses are written to <code className="font-mono text-zinc-200">src/generated/local.json</code>{" "}
          when you run the deploy script. The interface reads TEST and USDC balances, submits
          TEST approvals, and calls <code className="font-mono text-zinc-200">swapTestForUsdc</code>.
        </p>
      </section>

      <section className="space-y-2">
        <h3 className="text-base font-medium">Connect a wallet</h3>
        <p className="text-sm text-novara-mist">
          Use <strong className="font-medium text-zinc-200">Anvil Local Wallet</strong> for the first
          Anvil account, or import that account into a browser wallet pointed at the local RPC.
        </p>
      </section>
    </article>
  );
}
