import { redirect } from "next/navigation";
import { requireUser, getActiveOrg } from "@/lib/session";
import { OnboardingForm } from "./form";

export default async function OnboardingPage() {
  const user = await requireUser();
  const existing = await getActiveOrg(user.id);
  if (existing) redirect("/dashboard");
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-semibold mb-2">Create your organization</h1>
        <p className="text-muted-foreground mb-6">
          Organizations group your projects, team members, and billing.
        </p>
        <OnboardingForm />
      </div>
    </main>
  );
}
