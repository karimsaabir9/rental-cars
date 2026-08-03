import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session
    ? {
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        role: session.user.role as "user" | "admin",
      }
    : null;

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader user={user} />
      <div id="main-content" className="flex-1">
        {children}
      </div>
      <SiteFooter user={user} />
    </div>
  );
}
