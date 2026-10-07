"use client";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, CreditCard, MapPin, ShieldCheck, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { api, CartLine, getCart, getSavedAddresses, getToken, notify, SavedAddress, saveCart, syncCartFromServer } from "@/lib/api";

const steps = ["Your bag", "Delivery", "Payment", "All set"];
export default function Checkout() {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState("");
  const [saveAddress, setSaveAddress] = useState(false);
  const [address, setAddress] = useState({ label: "Home", recipient_name: "", phone: "", address_line1: "", address_line2: "", city: "", region: "", postal_code: "", country: "" });
  useEffect(() => {
    setCart(getCart());
    void syncCartFromServer().then(setCart).catch((err: unknown) => setError(err instanceof Error ? err.message : "Your bag could not be loaded."));
    void getSavedAddresses().then((items) => {
      setSavedAddresses(items);
      const defaultAddress = items.find((item) => item.is_default) ?? items[0];
      if (defaultAddress) {
        setSelectedAddressId(String(defaultAddress.id));
        setAddress({
          label: defaultAddress.label || "Home", recipient_name: defaultAddress.recipient_name, phone: defaultAddress.phone,
          address_line1: defaultAddress.address_line1, address_line2: defaultAddress.address_line2 || "", city: defaultAddress.city,
          region: defaultAddress.region || "", postal_code: defaultAddress.postal_code, country: defaultAddress.country,
        });
      }
    }).catch((err: unknown) => setError(err instanceof Error ? err.message : "Saved addresses could not be loaded."));
  }, []);
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shipping = subtotal >= 100 || !subtotal ? 0 : 7.95;
  const total = subtotal + shipping;
  const next = async (event: FormEvent) => {
    event.preventDefault(); setError("");
    if (step === 1) {
      if (!address.recipient_name.trim() || !address.phone.trim() || !address.address_line1.trim() || !address.city.trim() || !address.postal_code.trim() || address.country.trim().length !== 2) {
        setError("Complete the required delivery details. Country must use a 2-letter code, such as US.");
        return;
      }
      if (saveAddress && getToken()) {
        try {
          const saved = await api<SavedAddress>("/addresses", { method: "POST", body: JSON.stringify({ ...address, country: address.country.toUpperCase(), is_default: savedAddresses.length === 0 }) });
          setSavedAddresses((items) => [...items, saved]);
          setSelectedAddressId(String(saved.id));
          notify("Your delivery address was saved.");
        } catch (err) { setError(err instanceof Error ? err.message : "Your address could not be saved."); return; }
      }
    }
    setStep((current) => Math.min(3, current + 1));
  };
  const placeOrder = async () => {
    setBusy(true); setError("");
    try {
      await api("/orders", { method: "POST", body: JSON.stringify({ items: cart.map((line) => ({ product_id: line.product.id, quantity: line.quantity })), address: { ...address, country: address.country.toUpperCase() } }) });
      saveCart([]); setCart([]); setSuccess(true); setStep(3);
    } catch (err) { setError(err instanceof Error ? err.message : "We couldn't place your order."); }
    finally { setBusy(false); }
  };
  if (!cart.length && !success) return <div className="mx-auto min-h-[65vh] max-w-3xl px-5 pb-20 pt-24 text-center"><ShoppingBag className="mx-auto text-accent" size={24} /><h1 className="font-display mt-4 text-2xl font-bold">Your bag is waiting.</h1><Link href="/#shop" className="button-primary mt-6">Explore the edit</Link></div>;
  return <section className="mx-auto min-h-[70vh] max-w-[1120px] px-5 pb-10 pt-24 sm:px-8 lg:px-12">
    <Link href="/cart" className="inline-flex items-center gap-2 text-xs text-[#9b99a7] hover:text-white"><ArrowLeft size={14} /> Back to your bag</Link>
    <h1 className="font-display mt-5 text-3xl font-extrabold">A thoughtful finish.</h1>
    <div className="mt-7 grid grid-cols-4 gap-2">{steps.map((label, index) => <div key={label} className={`border-t-2 pt-2 text-[10px] sm:text-xs ${index <= step ? "border-accent text-accent" : "border-white/10 text-[#757785]"}`}><span className="mr-1.5">{index < step ? "✓" : `0${index + 1}`}</span>{label}</div>)}</div>
    {success ? <motion.div initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} className="panel mx-auto mt-12 max-w-lg px-8 py-12 text-center"><motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: .1 }} className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-accent/15 text-accent"><Check size={25} /></motion.span><h2 className="font-display mt-5 text-2xl font-bold">It’s on its way.</h2><p className="mt-2 text-sm leading-6 text-[#a09eac]">Thank you for choosing NEXORA. Your order is confirmed.</p><Link href="/orders" className="button-primary mt-6">View your order <ArrowRight size={15} /></Link></motion.div> :
      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
        <div className="panel p-5 sm:p-7">
          <div className="mb-6 flex items-center gap-2 text-sm font-semibold">{step === 1 ? <><MapPin size={16} className="text-accent" /> Delivery details</> : step === 2 ? <><CreditCard size={16} className="text-accent" /> Payment</> : <><ShoppingBag size={16} className="text-accent" /> Order check</>}</div>
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: .18 }}>
              {step === 0 && <div className="space-y-3">{cart.map((item) => <div key={item.product.id} className="flex items-center justify-between border-b border-white/[.07] pb-3 text-xs"><span className="text-[#c4c2ce]">{item.quantity} × {item.product.name}</span><span>${(item.product.price * item.quantity).toFixed(2)}</span></div>)}<button onClick={() => setStep(1)} className="button-primary mt-5">Add delivery details <ArrowRight size={15} /></button></div>}
              {step === 1 && <form onSubmit={(event) => void next(event)} className="grid gap-3 sm:grid-cols-2">
                {savedAddresses.length > 0 && <label className="text-[10px] text-[#aaa8b5] sm:col-span-2">Use a saved address<select className="field mt-1.5 !text-xs" value={selectedAddressId} onChange={(event) => {
                  setSelectedAddressId(event.target.value);
                  const selected = savedAddresses.find((item) => String(item.id) === event.target.value);
                  if (selected) setAddress({ label: selected.label || "Home", recipient_name: selected.recipient_name, phone: selected.phone, address_line1: selected.address_line1, address_line2: selected.address_line2 || "", city: selected.city, region: selected.region || "", postal_code: selected.postal_code, country: selected.country });
                  else setAddress({ label: "Home", recipient_name: "", phone: "", address_line1: "", address_line2: "", city: "", region: "", postal_code: "", country: "" });
                }}><option value="">Enter a new address</option>{savedAddresses.map((item) => <option key={item.id} value={item.id}>{item.label || "Address"} · {item.address_line1}, {item.city}</option>)}</select></label>}
                {([["label", "Address label"], ["recipient_name", "Full name"], ["phone", "Phone"], ["address_line1", "Street address"], ["address_line2", "Apartment / suite"], ["city", "City"], ["region", "State / region"], ["postal_code", "Postal code"], ["country", "Country code (2 letters)"]] as const).map(([key, label]) => <label key={key} className={`text-[10px] text-[#aaa8b5] ${key === "address_line1" ? "sm:col-span-2" : ""}`}>{label}<input className="field mt-1.5 !text-xs" required={!["label", "address_line2", "region"].includes(key)} maxLength={key === "country" ? 2 : undefined} value={address[key]} onChange={(event) => { setSelectedAddressId(""); setAddress({ ...address, [key]: key === "country" ? event.target.value.toUpperCase() : event.target.value }); }} /></label>)}
                {getToken() ? <label className="flex items-center gap-2 text-[10px] text-[#aaa8b5] sm:col-span-2"><input type="checkbox" checked={saveAddress} onChange={(event) => setSaveAddress(event.target.checked)} className="accent-[#3dcf8a]" /> Save this address to my account</label> : <p className="text-[10px] text-[#858795] sm:col-span-2">Sign in to save this address for next time.</p>}
                <button className="button-primary mt-2 sm:col-span-2">Continue to payment <ArrowRight size={15} /></button>
              </form>}
              {step === 2 && <div><div className="rounded-2xl border border-white/[.08] bg-white/[.025] p-4"><p className="text-xs font-semibold">Pay securely at delivery</p><p className="mt-2 text-xs leading-5 text-[#9695a2]">Checkout is connected to your existing order API. Online card payments aren’t enabled yet; no card details are collected.</p></div><div className="mt-4 flex items-center gap-2 text-[10px] text-[#898b99]"><ShieldCheck size={15} className="text-accent" /> Your order is placed securely and stock is confirmed.</div><button disabled={busy} onClick={() => void placeOrder()} className="button-primary mt-6 disabled:opacity-60">{busy ? "Placing your order…" : <>Place order · ${total.toFixed(2)} <ArrowRight size={15} /></>}</button></div>}
            </motion.div>
          </AnimatePresence>
          {error && <p role="alert" className="mt-5 rounded-xl border border-rose-300/20 bg-rose-300/[.08] p-3 text-xs text-rose-200">{error === "Not authenticated" ? "Please sign in to place your order." : error} {error === "Not authenticated" && <Link className="ml-2 underline" href="/login">Sign in</Link>}</p>}
        </div>
        <aside className="panel p-5 sm:p-6"><h2 className="text-sm font-bold">Your order summary</h2><div className="mt-5 space-y-3 text-xs text-[#a09eaa]"><div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div><div className="flex justify-between"><span>Delivery</span><span>{shipping ? `$${shipping.toFixed(2)}` : "On us"}</span></div><div className="border-t border-white/[.08] pt-3 text-sm font-bold text-white"><div className="flex justify-between"><span>Total</span><span>${total.toFixed(2)}</span></div></div></div><p className="mt-4 text-[10px] text-[#7f818e]">Shipping address: {address.recipient_name || "Add in the next step"}{address.city ? ` · ${address.city}` : ""}</p></aside>
      </div>}
  </section>;
}
