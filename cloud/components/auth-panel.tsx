import { LogoFull } from "@/components/logo";

export function AuthPanel() {
  return (
    <div className="hidden lg:flex flex-col justify-between h-full p-10 bg-[#0a0f1a] text-white relative overflow-hidden">
      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(#4ade80 1px, transparent 1px), linear-gradient(90deg, #4ade80 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-green-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-green-400/8 rounded-full blur-2xl" />

      <div className="relative">
        <LogoFull size={30} dark />
      </div>

      <div className="relative space-y-8">
        <div>
          <h2 className="text-3xl font-bold leading-snug">
            Security observability<br />for every LLM agent.
          </h2>
          <p className="mt-3 text-white/50 text-sm leading-relaxed max-w-xs">
            Catch prompt injections, tool misuse, and data leaks in real-time — before they reach production.
          </p>
        </div>

        <ul className="space-y-3 text-sm">
          {[
            "Managed attack pattern library",
            "Real-time violation stream",
            "Slack, email & webhook alerts",
            "Python & TypeScript SDK",
          ].map((item) => (
            <li key={item} className="flex items-center gap-2 text-white/70">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 shrink-0" />
              {item}
            </li>
          ))}
        </ul>

        <p className="text-xs text-white/30">
          Free tier · 10K events/month · No credit card required
        </p>
      </div>
    </div>
  );
}
