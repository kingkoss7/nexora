"use client";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { api, getPostLoginPath, notify, setAuth, syncCartFromServer, syncWishlistFromServer } from "@/lib/api";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busy, setBusy] = useState(false);
  const [register, setRegister] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("registered") === "1") {
      setSuccess("Account created successfully. Please sign in.");
    }
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setBusy(true);
    try {
      if (register) {
        const result = await api<{ message: string }>("/auth/register", {
          method: "POST",
          body: JSON.stringify({ name: name.trim(), email, password }),
        });
        setSuccess(result.message);
        setRegister(false);
        setPassword("");
        window.setTimeout(() => {
          const query = new URLSearchParams({ registered: "1" });
          const next = new URLSearchParams(window.location.search).get("next");
          if (next) query.set("next", next);
          router.replace(`/login?${query.toString()}`);
        }, 1200);
        return;
      }
      const result = await api<{ access_token: string; role: string }>("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      setAuth(result.access_token, result.role);
      const syncResults = await Promise.allSettled([syncCartFromServer(), syncWishlistFromServer()]);
      for (const syncResult of syncResults) {
        if (syncResult.status === "rejected") notify(`Signed in, but saved shopping data could not be synced: ${syncResult.reason instanceof Error ? syncResult.reason.message : "Please refresh and try again."}`, "info");
      }
      router.push(getPostLoginPath()); router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "We couldn't sign you in. Please try again."); }
    finally { setBusy(false); }
  }
  return <section
    className="mx-auto grid min-h-[78vh] max-w-[1080px] items-center gap-8 px-5 pb-10 pt-24 sm:px-8 md:grid-cols-[1fr_420px] lg:px-12"
  >
    <div className="relative min-w-0">
      <p className="eyebrow">NEXORA account</p>
      <h1 className="display-heading mt-4 text-4xl sm:text-5xl">Your shopping, in one place.</h1>
      <p className="mt-4 max-w-md text-sm leading-6 text-muted">Sign in to manage saved products, your cart, orders and delivery addresses.</p>
    </div>
    <form
      onSubmit={submit}
      className="panel mx-auto w-full max-w-md p-6 sm:p-8"
    >
      <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent/10 text-accent"><LockKeyhole size={19} /></span>
      <h2 className="font-display mt-5 text-2xl font-extrabold tracking-tight">{register ? "Create an account" : "Welcome back."}</h2>
      {register && <label className="mt-7 block text-[10px] font-semibold text-[#bab8c5]">Full name<input className="field mt-2" type="text" autoComplete="name" maxLength={150} required value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" /></label>}
      <label className={`${register ? "mt-4" : "mt-7"} block text-[10px] font-semibold text-[#bab8c5]`}>Email address<input className="field mt-2" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></label>
      <label className="mt-4 block text-[10px] font-semibold text-[#bab8c5]">Password<input className="field mt-2" type="password" autoComplete={register ? "new-password" : "current-password"} minLength={6} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 6 characters" /></label>
      {error && <p role="alert" className="mt-4 rounded-xl border border-rose-300/20 bg-rose-300/[.08] p-3 text-xs text-rose-200">{error}</p>}
      {success && <p role="status" className="mt-4 rounded-xl border border-accent/20 bg-accent/[.08] p-3 text-xs text-accent">{success}</p>}
      <button disabled={busy} className="button-primary mt-6 w-full disabled:opacity-60">{busy ? "One moment…" : register ? "Create your account" : "Sign in"} <ArrowRight size={15} /></button>
      <button type="button" onClick={() => { setRegister(!register); setError(""); setSuccess(""); }} className="mt-5 w-full text-center text-xs text-[#9aa8ba] hover:text-white">{register ? "Already with us? Sign in" : "New to NEXORA? Create an account"}</button>
    </form>
  </section>;
}
