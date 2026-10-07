"use client";
import { motion } from "framer-motion";
import { ArrowRight, Bell, Heart, LogOut, MapPin, Package, Settings2, ShoppingBag, UserRound, WalletCards } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { api, getRole, getSavedAddresses, getWishlist, logout, notify, SavedAddress } from "@/lib/api";

type Order = { id: number; total: number; status: string; created_at: string };
const menu = [{ label: "Dashboard", href: "/account", icon: UserRound }, { label: "My orders", href: "/orders", icon: Package }, { label: "Wishlist", href: "/wishlist", icon: Heart }, { label: "Addresses", href: "/account#addresses", icon: MapPin }, { label: "Notifications", href: "/account#notifications", icon: Bell }, { label: "Settings", href: "/account#settings", icon: Settings2 }];

export default function Account() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [error, setError] = useState("");
  const [role, setRole] = useState<string | null>(null);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [addressError, setAddressError] = useState("");
  const [addingAddress, setAddingAddress] = useState(false);
  const [addressDraft, setAddressDraft] = useState({ label: "Home", recipient_name: "", phone: "", address_line1: "", address_line2: "", city: "", region: "", postal_code: "", country: "" });
  const loadAddresses = () => getSavedAddresses().then(setAddresses).catch((err: unknown) => setAddressError(err instanceof Error ? err.message : "Saved addresses could not be loaded."));
  useEffect(() => { setFavoriteCount(getWishlist().length); setRole(getRole()); api<Order[]>("/orders").then(setOrders).catch((err) => setError(err instanceof Error ? err.message : "Sign in to see your account.")); void loadAddresses(); }, []);
  const saveAddress = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setAddressError("");
    try {
      await api<SavedAddress>("/addresses", { method: "POST", body: JSON.stringify({ ...addressDraft, country: addressDraft.country.toUpperCase(), is_default: addresses.length === 0 }) });
      setAddressDraft({ label: "Home", recipient_name: "", phone: "", address_line1: "", address_line2: "", city: "", region: "", postal_code: "", country: "" });
      setAddingAddress(false);
      await loadAddresses();
      notify("Your delivery address was saved.");
    } catch (err) { setAddressError(err instanceof Error ? err.message : "Your address could not be saved."); }
  };
  const addressAction = async (id: number, action: "default" | "delete") => {
    setAddressError("");
    try {
      await api(`/addresses/${id}${action === "default" ? "/default" : ""}`, { method: action === "default" ? "PATCH" : "DELETE" });
      await loadAddresses();
      notify(action === "default" ? "Default delivery address updated." : "Delivery address removed.", "info");
    } catch (err) { setAddressError(err instanceof Error ? err.message : "The address could not be updated."); }
  };
  const spent = orders?.reduce((sum, order) => sum + (order.status === "cancelled" ? 0 : order.total), 0) ?? 0;
  const cards = [{ label: "Total orders", value: orders?.length ?? "—", icon: Package }, { label: "Saved favorites", value: favoriteCount, icon: Heart }, { label: "Total spent", value: `$${spent.toFixed(2)}`, icon: WalletCards }, { label: "Member rewards", value: "—", icon: ShoppingBag }];
  return <section className="mx-auto min-h-[70vh] max-w-[1340px] px-5 pb-9 pt-24 sm:px-8 lg:px-12"><div className="mb-7"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-accent">Your NEXORA space</p><h1 className="font-display mt-2 text-3xl font-extrabold">The good things, all here.</h1></div><div className="grid gap-5 lg:grid-cols-[210px_1fr]">
    <aside className="panel h-fit p-3">{menu.map(({ label, href, icon: Icon }, index) => <Link key={label} href={href} className={`mb-1 flex items-center gap-3 rounded-xl px-3 py-3 text-xs transition ${index === 0 ? "bg-accent/12 font-semibold text-accent" : "text-[#a09eab] hover:bg-white/[.05] hover:text-white"}`}><Icon size={15} />{label}</Link>)}<button onClick={() => { logout(); router.push("/login"); }} className="mt-2 flex w-full items-center gap-3 border-t border-white/[.08] px-3 pt-4 text-xs text-[#a09eab] hover:text-white"><LogOut size={15} /> Sign out</button></aside>
    <div className="min-w-0 space-y-5"><div className="panel relative overflow-hidden p-6 sm:p-8"><div className="absolute -right-12 -top-20 h-48 w-48 rounded-full bg-accent/10 blur-3xl" /><p className="relative text-[10px] uppercase tracking-wider text-accent">Your personal edit</p><h2 className="font-display relative mt-2 text-2xl font-bold">{error ? "Welcome to NEXORA." : "Welcome back."}</h2><p className="relative mt-2 max-w-lg text-xs leading-6 text-[#a3a2ae]">{error === "Not authenticated" ? "Sign in to see your order history and personal space." : "Here’s a little overview of your orders, saved finds and NEXORA activity."}</p>{error === "Not authenticated" && <Link href="/login" className="button-primary relative mt-5 !py-2.5 !text-xs">Sign in to your account <ArrowRight size={14} /></Link>}</div>
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{cards.map(({ label, value, icon: Icon }, index) => <motion.div key={label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .05 }} className="panel p-4"><span className="grid h-9 w-9 place-items-center rounded-xl bg-accent/10 text-accent"><Icon size={16} /></span><p className="font-display mt-4 text-xl font-bold">{value}</p><p className="mt-1 text-[10px] text-[#9394a1]">{label}</p></motion.div>)}</div>
    <div className="panel p-5 sm:p-6"><div className="flex items-center justify-between"><div><h2 className="font-display text-sm font-bold">Recent orders</h2><p className="mt-1 text-[10px] text-[#898b98]">Your recent NEXORA arrivals</p></div><Link href="/orders" className="text-[10px] text-accent hover:text-white">See all <ArrowRight className="ml-1 inline" size={12} /></Link></div>{orders?.slice(0, 4).map((order) => <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-white/[.07] pt-4 text-xs" key={order.id}><span className="font-medium">Order #{order.id}</span><span className="capitalize text-[#9e9ca9]">{order.status}</span><span className="font-semibold">${order.total.toFixed(2)}</span></div>)}{orders?.length === 0 && !error && <div className="py-9 text-center"><p className="text-xs text-[#9695a2]">Your next favorite is out there.</p><Link className="mt-3 inline-block text-[10px] text-accent" href="/#shop">Explore the edit →</Link></div>}</div>
    <div id="addresses" className="panel scroll-mt-24 p-5 sm:p-6"><div className="flex items-center justify-between gap-4"><div className="flex items-center gap-3"><MapPin size={17} className="text-accent" /><div><p className="text-xs font-semibold">Delivery addresses</p><p className="mt-1 text-[10px] text-[#858795]">Manage the addresses saved to your account.</p></div></div><button onClick={() => setAddingAddress(!addingAddress)} className="button-secondary shrink-0 !px-3 !py-2 !text-[10px]">{addingAddress ? "Cancel" : "Add address"}</button></div>
      {addressError && <p role="alert" className="mt-4 rounded-xl border border-rose-300/20 bg-rose-300/[.08] p-3 text-xs text-rose-200">{addressError === "Not authenticated" ? "Sign in to save delivery addresses." : addressError}</p>}
      {addresses.length > 0 && <div className="mt-4 space-y-2">{addresses.map((address) => <article key={address.id} className="rounded-2xl border border-white/[.07] bg-white/[.025] p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><span className="text-xs font-semibold">{address.label || "Address"}</span>{address.is_default && <span className="rounded-full bg-accent/10 px-2 py-1 text-[9px] text-accent">Default</span>}</div><p className="mt-1 text-[11px] text-[#aaa8b5]">{address.recipient_name} · {address.phone}</p><p className="mt-1 text-[11px] text-[#858795]">{address.address_line1}{address.address_line2 ? `, ${address.address_line2}` : ""}, {address.city}{address.region ? `, ${address.region}` : ""} {address.postal_code}, {address.country}</p></div><div className="flex gap-2">{!address.is_default && <button onClick={() => void addressAction(address.id, "default")} className="text-[10px] text-accent hover:text-white">Make default</button>}<button onClick={() => void addressAction(address.id, "delete")} className="text-[10px] text-rose-200 hover:text-white">Remove</button></div></div></article>)}</div>}
      {addingAddress && <form onSubmit={(event) => void saveAddress(event)} className="mt-4 grid gap-3 sm:grid-cols-2">{[["label", "Label"], ["recipient_name", "Recipient name"], ["phone", "Phone"], ["address_line1", "Address line 1"], ["address_line2", "Address line 2"], ["city", "City"], ["region", "State / region"], ["postal_code", "Postal code"], ["country", "Country code (2 letters)"]].map(([key, label]) => <label key={key} className="text-[10px] text-[#aaa8b5]">{label}<input className="field mt-1.5 !text-xs" required={!["label", "address_line2", "region"].includes(key)} maxLength={key === "country" ? 2 : undefined} value={addressDraft[key as keyof typeof addressDraft]} onChange={(event) => setAddressDraft({ ...addressDraft, [key]: event.target.value })} /></label>)}<button className="button-primary sm:col-span-2">Save delivery address</button></form>}
    </div>
    <div id="notifications" className="sr-only" /><div id="settings" className="sr-only" />
    {role === "admin" && <Link href="/admin" className="button-secondary w-fit !text-xs">Open store administration <ArrowRight size={14} /></Link>}</div>
  </div></section>;
}
