import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { ProfileForm } from "@/components/dashboard/profile-form";

export default async function ProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold tracking-tight">Profile</h1>
      <ProfileForm name={session!.user.name} email={session!.user.email} />
    </div>
  );
}
