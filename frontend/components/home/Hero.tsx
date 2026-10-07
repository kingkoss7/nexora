"use client";

import { ArrowRight, UserRound } from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import MagneticLink from "@/components/ui/MagneticLink";
import { getRole, getToken } from "@/lib/api";

const SkateboardScene = dynamic(() => import("@/components/three/ThreeScenes").then((module) => module.SkateboardScene), {
  ssr: false,
  loading: () => <div aria-hidden="true" className="h-full w-full bg-[radial-gradient(ellipse_at_60%_45%,#3dcf8a22_0%,transparent_62%)]" />,
});

export default function Hero() {
  const reduce = useReducedMotion();
  const [accountLink, setAccountLink] = useState({ href: "/login", label: "Sign in" });

  useEffect(() => {
    const token = getToken();
    const role = getRole();
    setAccountLink(token
      ? role === "admin" ? { href: "/admin", label: "Admin dashboard" } : { href: "/account", label: "My account" }
      : { href: "/login", label: "Sign in" });
  }, []);

  return (
    <section className="relative min-h-[100svh] overflow-hidden pt-16">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-24 h-80 w-80 rounded-full bg-white/[0.03] blur-3xl" />
        <div className="absolute right-[18%] top-[28%] h-72 w-72 rounded-full bg-accent/12 blur-[90px]" />
        <div className="absolute bottom-10 left-1/3 h-40 w-40 rounded-full bg-accent/8 blur-[70px]" />
        {!reduce && Array.from({ length: 18 }).map((_, i) => (
          <span
            key={i}
            className="absolute h-0.5 w-0.5 rounded-full bg-white/30"
            style={{
              left: `${8 + (i * 5.1) % 90}%`,
              top: `${12 + (i * 7.3) % 70}%`,
              animation: `floaty ${10 + (i % 5)}s ease-in-out infinite`,
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
      <style>{`@keyframes floaty{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}} @media (prefers-reduced-motion:reduce){* {animation:none!important}}`}</style>
      <div className="relative mx-auto grid min-h-[calc(100svh-4rem)] max-w-[1440px] items-center gap-6 px-5 py-10 sm:px-8 lg:grid-cols-[1.05fr_.95fr] lg:px-12">
        <div className="order-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-accent">The next standard</p>
          <h1 className="font-display mt-5 max-w-[16ch] text-[clamp(3rem,8vw,7.2rem)] font-extrabold leading-[0.92] tracking-[-0.06em]">
            Built to be seen.
          </h1>
          <p className="mt-6 max-w-[440px] text-sm leading-7 text-[#b5b5b5] sm:text-base">
            Discover intelligently designed products built for performance, style and everyday innovation.
          </p>
          <div className="mt-8 hidden flex-wrap gap-3 sm:flex">
            <MagneticLink className="button-primary" href="/shop">Explore products <ArrowRight size={16} /></MagneticLink>
            <Link className="button-secondary" href="/#collections">View collection</Link>
            <Link
              href={accountLink.href}
              className="group relative inline-flex items-center gap-3 overflow-hidden rounded-full border border-accent/30 bg-[linear-gradient(115deg,rgba(61,207,138,.16),rgba(255,255,255,.035)_58%)] py-2 pl-2 pr-5 shadow-[0_8px_32px_rgba(61,207,138,.08)] transition duration-300 hover:-translate-y-0.5 hover:border-accent/65 hover:shadow-[0_12px_36px_rgba(61,207,138,.18)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
            >
              <span className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-accent to-accent-dim text-ink shadow-glow transition-transform duration-300 group-hover:scale-105">
                <UserRound size={17} strokeWidth={2.2} />
              </span>
              <span className="flex flex-col items-start leading-tight">
                <span className="text-[9px] font-bold uppercase tracking-[.16em] text-accent">Your NEXORA</span>
                <span className="mt-1 text-xs font-semibold text-white">{accountLink.label}</span>
              </span>
              <ArrowRight size={15} className="ml-1 text-white/55 transition-all duration-300 group-hover:translate-x-1 group-hover:text-accent" />
            </Link>
          </div>
        </div>
        <div className="relative order-2 h-[52vw] min-h-[320px] max-h-[640px] lg:h-[78vh]">
          <SkateboardScene />
        </div>
        <div className="order-3 flex flex-wrap gap-3 sm:hidden">
          <Link className="button-primary" href="/shop">Explore products</Link>
          <Link className="button-secondary" href="/#collections">View collection</Link>
          <Link
            href={accountLink.href}
            className="group inline-flex min-h-12 items-center gap-2.5 rounded-full border border-accent/35 bg-accent/[.09] py-1.5 pl-1.5 pr-4 transition duration-300 hover:border-accent/65 hover:bg-accent/[.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-ink"
          >
            <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-accent to-accent-dim text-ink">
              <UserRound size={16} strokeWidth={2.2} />
            </span>
            <span className="text-sm font-semibold text-white">{accountLink.label}</span>
            <ArrowRight size={14} className="text-accent transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}
