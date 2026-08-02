import { AdminReviewsTable } from "@/components/admin/reviews-table";

export default function AdminReviewsPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Reviews</h1>
      <AdminReviewsTable />
    </div>
  );
}
