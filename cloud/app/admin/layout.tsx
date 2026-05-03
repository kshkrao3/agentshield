import Link from "next/link";
import { requireAdmin } from "@/lib/session";
import { SignOutButton } from "@/components/sign-out-button";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-[#0a0f1a] text-white">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin" className="font-semibold text-green-400">
              AgentShield Admin
            </Link>
            <nav className="flex items-center gap-4 text-sm">
              <Link href="/admin" className="text-gray-400 hover:text-white transition-colors">Overview</Link>
              <Link href="/admin/users" className="text-gray-400 hover:text-white transition-colors">Users</Link>
              <Link href="/admin/orgs" className="text-gray-400 hover:text-white transition-colors">Orgs & Billing</Link>
              <Link href="/admin/usage" className="text-gray-400 hover:text-white transition-colors">Usage</Link>
              <Link href="/admin/events" className="text-gray-400 hover:text-white transition-colors">Events</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-400">{user.email}</span>
            <Link href="/dashboard" className="text-gray-400 hover:text-white text-xs">← App</Link>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">{children}</main>
    </div>
  );
}
