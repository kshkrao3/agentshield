import { LogoFull } from "@/components/logo";

const FLOATING_EVENTS = [
  { label: "Injection blocked", dot: "bg-red-400", delay: "0s", duration: "9s", left: "12%", bottom: "54%" },
  { label: "Tool misuse · high", dot: "bg-orange-400", delay: "3s", duration: "11s", left: "48%", bottom: "62%" },
  { label: "Memory drift detected", dot: "bg-yellow-400", delay: "6s", duration: "10s", left: "22%", bottom: "46%" },
];

export function AuthPanel() {
  return (
    <div className="hidden lg:flex flex-col justify-between h-full p-10 bg-[#0a0f1a] text-white relative overflow-hidden">
      <style>{`
        @keyframes orb-drift-a {
          0%,100% { transform: translate(0,0) scale(1); }
          33%      { transform: translate(24px,-36px) scale(1.12); }
          66%      { transform: translate(-18px,22px) scale(0.9); }
        }
        @keyframes orb-drift-b {
          0%,100% { transform: translate(0,0) scale(1); }
          40%     { transform: translate(-28px,18px) scale(1.15); }
          75%     { transform: translate(12px,-24px) scale(0.88); }
        }
        @keyframes grid-breathe {
          0%,100% { opacity: 0.035; }
          50%     { opacity: 0.07; }
        }
        @keyframes scan-line {
          0%   { top: 8%;  opacity: 0; }
          4%   { opacity: 1; }
          88%  { opacity: 0.5; }
          100% { top: 92%; opacity: 0; }
        }
        @keyframes float-fade {
          0%          { transform: translateY(0);    opacity: 0; }
          8%          { opacity: 1; }
          78%         { opacity: 0.85; }
          100%        { transform: translateY(-72px); opacity: 0; }
        }
      `}</style>

      {/* Grid */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(#4ade80 1px,transparent 1px),linear-gradient(90deg,#4ade80 1px,transparent 1px)",
          backgroundSize: "40px 40px",
          animation: "grid-breathe 5s ease-in-out infinite",
        }}
      />

      {/* Scan line */}
      <div
        className="absolute left-0 right-0 h-px pointer-events-none"
        style={{
          background: "linear-gradient(90deg,transparent,rgba(74,222,128,0.55),transparent)",
          animation: "scan-line 7s ease-in-out infinite",
        }}
      />

      {/* Orbs */}
      <div
        className="absolute top-1/4 left-1/4 w-64 h-64 bg-green-500/10 rounded-full blur-3xl"
        style={{ animation: "orb-drift-a 13s ease-in-out infinite" }}
      />
      <div
        className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-green-400/8 rounded-full blur-2xl"
        style={{ animation: "orb-drift-b 16s ease-in-out infinite" }}
      />

      {/* Floating event chips */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {FLOATING_EVENTS.map((ev) => (
          <div
            key={ev.label}
            className="absolute"
            style={{
              left: ev.left,
              bottom: ev.bottom,
              animation: `float-fade ${ev.duration} ease-in-out ${ev.delay} infinite`,
            }}
          >
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-white/70 whitespace-nowrap backdrop-blur-sm">
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${ev.dot} animate-pulse`} />
              {ev.label}
            </div>
          </div>
        ))}
      </div>

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
