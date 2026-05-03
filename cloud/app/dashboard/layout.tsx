import { requireUser, requireActiveOrg, isAdmin } from "@/lib/session";
import { DashboardSidebar } from "@/components/dashboard-sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const org = await requireActiveOrg(user.id);
  const admin = isAdmin(user.email);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <DashboardSidebar
        orgName={org.name}
        plan={org.plan}
        userEmail={user.email}
        isAdmin={admin}
      />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
