import { StatsOverview } from "@/components/admin/stats-overview";

export default function AdminOverviewPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Overview</h1>
      <StatsOverview />
    </div>
  );
}
