import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { SettingsView } from "@/components/dashboard/settings-view";

export default async function AdminSettingsPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <SettingsView
      name={session!.user.name}
      email={session!.user.email}
      image={session!.user.image}
      role={session!.user.role as "user" | "admin"}
    />
  );
}
