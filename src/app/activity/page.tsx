import { ActivityList } from "@/components/ActivityList";

export default function ActivityPage() {
  return (
    <section className="panel panel-pad">
      <p className="label">History</p>
      <h2 className="mt-1 text-lg font-semibold">Activity</h2>
      <p className="mt-2 max-w-2xl text-sm text-novara-mist">
        Recent local swaps and approvals for the connected wallet. Entries are stored in this
        browser and refresh after each submitted transaction.
      </p>
      <div className="mt-5">
        <ActivityList />
      </div>
    </section>
  );
}
