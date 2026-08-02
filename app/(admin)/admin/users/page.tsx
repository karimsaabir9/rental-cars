import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { UsersTable } from "@/components/admin/users-table";

export default async function AdminUsersPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Users</h1>
      <UsersTable currentUserId={session!.user.id} />
    </div>
  );
}
