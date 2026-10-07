"use client";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, LockKeyhole, Sparkles } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { api, notify, setAuth, syncCartFromServer, syncWishlistFromServer } from "@/lib/api";

const LoginSkateboardScene = dynamic(
  () => import("@/components/three/ThreeScenes").then((module) => module.SkateboardScene),
  {
    ssr: false,
    loading: () => <div aria-hidden="true" className="h-full w-full animate-pulse bg-[radial-gradient(ellipse_at_50%_45%,#3dcf8a22_0%,transparent_62%)]" />,
  },
);

export default function Login() {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [register, setRegister] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setBusy(true);
    try {
      const result = await api<{ access_token: string; role: string }>(`/auth/${register ? "register" : "login"}`, { method: "POST", body: JSON.stringify({ email, password }) });
      setAuth(result.access_token, result.role);
      const syncResults = await Promise.allSettled([syncCartFromServer(), syncWishlistFromServer()]);
      for (const syncResult of syncResults) {
        if (syncResult.status === "rejected") notify(`Signed in, but saved shopping data could not be synced: ${syncResult.reason instanceof Error ? syncResult.reason.message : "Please refresh and try again."}`, "info");
      }
      router.push("/"); router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "We couldn't sign you in. Please try again."); }
    finally { setBusy(false); }
  }
  return <motion.section
    initial={reduceMotion ? false : { opacity: 0, y: 20, filter: "blur(8px)" }}
    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
    transition={{ duration: reduceMotion ? 0 : 0.55, ease: [0.22, 1, 0.36, 1] }}
    className="mx-auto grid min-h-[78vh] max-w-[1080px] items-center gap-8 px-5 pb-10 pt-24 sm:px-8 md:grid-cols-[1fr_420px] lg:px-12"
  >
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, x: -14 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.5, delay: reduceMotion ? 0 : 0.08, ease: [0.22, 1, 0.36, 1] }}
      className="relative min-w-0"
    >
      <div className="relative mb-4 h-[210px] overflow-hidden rounded-[28px] border border-white/[.07] bg-[radial-gradient(ellipse_at_50%_45%,#17281f_0%,#101010_48%,#080808_100%)] sm:h-[270px] md:mb-2 md:h-[300px] lg:h-[370px]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_90%,#3dcf8a20_0%,transparent_54%)]" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-[72%] w-[72%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-accent/[.08] [transform:translate(-50%,-50%)_rotateX(68deg)]" />
        <LoginSkateboardScene />
        <span className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-2 text-[9px] font-semibold uppercase tracking-[.16em] text-white/75 backdrop-blur">
          <span className="size-1.5 animate-pulse rounded-full bg-accent" />
          NEXORA · skateboard studio
        </span>
        <span className="pointer-events-none absolute inset-x-0 bottom-4 text-center text-[9px] font-medium uppercase tracking-[.18em] text-white/45">
          Interactive skateboard · drag to rotate
        </span>
      </div>
      <span className="hidden h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-accent to-accent-dim text-white md:grid"><Sparkles size={22} /></span>
      <p className="mt-4 text-[10px] font-bold uppercase tracking-[.2em] text-accent md:mt-5">Welcome to your corner</p>
      <h1 className="font-display mt-2 text-3xl font-extrabold leading-[1.08] tracking-[-.055em] sm:text-4xl md:mt-3 md:text-5xl">The good things, <span className="gradient-text">all in one place.</span></h1>
      <p className="mt-3 max-w-sm text-xs leading-6 text-[#a6a5b2] sm:text-sm md:mt-5 md:leading-7">Keep an eye on your orders, collect your favorites, and make every NEXORA moment yours.</p>
      <div className="mt-5 hidden gap-3 text-[11px] text-[#b7b4c2] sm:flex md:mt-8"><span className="rounded-full border border-white/10 px-3 py-2">Your orders</span><span className="rounded-full border border-white/10 px-3 py-2">Saved favorites</span><span className="rounded-full border border-white/10 px-3 py-2">Easy checkout</span></div>
    </motion.div>
    <motion.form
      onSubmit={submit}
      initial={reduceMotion ? false : { opacity: 0, y: 18, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: reduceMotion ? 0 : 0.5, delay: reduceMotion ? 0 : 0.12, ease: [0.22, 1, 0.36, 1] }}
      className="panel mx-auto w-full max-w-md p-6 sm:p-8"
    >
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent/10 text-accent"><LockKeyhole size={19} /></span>
      <h2 className="font-display mt-5 text-2xl font-extrabold tracking-tight">{register ? "A fresh start." : "Welcome back."}</h2>
      <p className="mt-2 text-xs text-[#9695a2]">{register ? "Create an account and make yourself at home." : "Sign in to pick up right where you left off."}</p>
      <label className="mt-7 block text-[10px] font-semibold text-[#bab8c5]">Email address<input className="field mt-2" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label>
      <label className="mt-4 block text-[10px] font-semibold text-[#bab8c5]">Password<input className="field mt-2" type="password" autoComplete={register ? "new-password" : "current-password"} minLength={6} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" /></label>
      {error && <p role="alert" className="mt-4 rounded-xl border border-rose-300/20 bg-rose-300/[.08] p-3 text-xs text-rose-200">{error}</p>}
      <button disabled={busy} className="button-primary mt-6 w-full disabled:opacity-60">{busy ? "One moment…" : register ? "Create your account" : "Sign in"} <ArrowRight size={15} /></button>
      <button type="button" onClick={() => { setRegister(!register); setError(""); }} className="mt-5 w-full text-center text-xs text-[#aaa8b6] transition hover:text-white">{register ? "Already with us? Sign in" : "New to NEXORA? Create an account"}</button>
    </motion.form>
  </motion.section>;
}
