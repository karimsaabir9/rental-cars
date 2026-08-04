import { AdminAuditLogTable } from "@/components/admin/audit-log-table";

export default function AdminAuditLogPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Audit Log</h1>
      <AdminAuditLogTable />
    </div>
  );
}
