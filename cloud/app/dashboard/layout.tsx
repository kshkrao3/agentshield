import Link from "next/link";
import { requireUser, requireActiveOrg, isAdmin } from "@/lib/session";
import { SignOutButton } from "@/components/sign-out-button";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const org = await requireActiveOrg(user.id);
  const admin = isAdmin(user.email);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="font-semibold">AgentShield</Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">Projects</Link>
              <Link href="/dashboard/events" className="text-muted-foreground hover:text-foreground">Events</Link>
              <Link href="/dashboard/analytics" className="text-muted-foreground hover:text-foreground">Analytics</Link>
              <Link href="/dashboard/alerts" className="text-muted-foreground hover:text-foreground">Alerts</Link>
              <Link href="/dashboard/settings" className="text-muted-foreground hover:text-foreground">Settings</Link>
              {admin && (
                <Link href="/admin" className="text-green-600 hover:text-green-700 font-medium">Admin</Link>
              )}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">{org.name}</span>
            <span className="rounded-full bg-secondary px-2 py-0.5 text-xs uppercase">{org.plan}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">{children}</main>
    </div>
  );
}
