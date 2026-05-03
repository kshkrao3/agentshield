"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { LogoFull } from "@/components/logo";

export function MarketingHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b sticky top-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/"><LogoFull /></Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
          <Link href="https://github.com/kshkrao3/agentshield" className="text-muted-foreground hover:text-foreground transition-colors">GitHub</Link>
          <Link href="/sign-in" className="text-muted-foreground hover:text-foreground transition-colors">Sign in</Link>
          <Link
            href="/sign-up"
            className="inline-flex h-9 items-center rounded-md bg-primary text-primary-foreground px-4 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Get started
          </Link>
        </nav>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 -mr-2 rounded-md hover:bg-accent transition-colors"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden border-t bg-background">
          <nav className="flex flex-col px-6 py-4 gap-4 text-sm">
            <Link href="/pricing" className="text-muted-foreground hover:text-foreground" onClick={() => setOpen(false)}>Pricing</Link>
            <Link href="https://github.com/kshkrao3/agentshield" className="text-muted-foreground hover:text-foreground" onClick={() => setOpen(false)}>GitHub</Link>
            <Link href="/sign-in" className="text-muted-foreground hover:text-foreground" onClick={() => setOpen(false)}>Sign in</Link>
            <Link
              href="/sign-up"
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary text-primary-foreground px-4 font-medium"
              onClick={() => setOpen(false)}
            >
              Get started
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
