"use client";
import { ArrowRight, PackageCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatMoney } from "@/lib/catalog";

type Order = {
  oid: number; total: number; status: string; created_at: string;
  delivery_address_line1: string | null; delivery_city: string | null;
  delivery_region: string | null; delivery_postal_code: string | null; delivery_country: string | null;
  items: { product_name: string; quantity: number; price: number }[];
};
const orderSteps = ["placed", "packed", "shipped", "delivered"];
export default function Orders() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api<Order[]>("/orders")
      .then(setOrders)
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load orders."));
  }, []);
  return (
    <section className="page-frame mx-auto min-h-[65vh] max-w-[1050px] px-5 pb-16 pt-20 sm:px-8 lg:px-12">
      <p className="eyebrow">From our door to yours</p>
      <h1 className="display-heading mt-3 text-5xl sm:text-6xl">Order history.</h1>
      {error ? (
        <div className="panel mt-8 p-6 text-sm text-[#bcbac6]">
          <p>{error === "Not authenticated" ? "Sign in to see your orders." : error}</p>
          <Link className="button-primary mt-5" href="/login">Sign in <ArrowRight size={15} /></Link>
        </div>
      ) : orders === null ? (
        <div className="mt-8 space-y-3">{[1, 2].map((item) => <div key={item} className="h-28 rounded-2xl bg-white/[.04]" />)}</div>
      ) : orders.length === 0 ? (
        <div className="panel mt-8 py-16 text-center">
          <PackageCheck size={24} className="mx-auto text-accent" />
          <p className="mt-4 text-sm text-[#c2c0cc]">Your next favorite is only a click away.</p>
          <Link className="button-primary mt-5" href="/#shop">Explore the edit <ArrowRight size={15} /></Link>
        </div>
      ) : (
        <div className="mt-8 space-y-4">
          {orders.map((order) => {
            const activeStep = orderSteps.indexOf(order.status);
            return (
              <article key={order.oid} className="panel p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-[#8c8e9b]">Order #{order.oid}</span>
                    <p className="mt-1 text-[10px] text-[#8c8e9b]">{new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold capitalize ${order.status === "cancelled" ? "border-rose-300/20 bg-rose-300/[.08] text-rose-200" : "border-accent/20 bg-accent/10 text-accent"}`}>{order.status}</span>
                </div>
                {order.status === "cancelled" ? (
                  <p className="mt-5 rounded-xl border border-rose-300/10 bg-rose-300/[.04] px-4 py-3 text-xs text-rose-100/80">This order was cancelled. Contact support if you need help.</p>
                ) : (
                  <div aria-label={`Order progress: ${order.status}`} className="mt-6 grid grid-cols-4">
                    {orderSteps.map((step, stepIndex) => {
                      const complete = stepIndex <= activeStep;
                      return (
                        <div key={step} className="relative text-center">
                          {stepIndex < orderSteps.length - 1 && <span aria-hidden="true" className={`absolute left-1/2 top-2.5 h-px w-full ${stepIndex < activeStep ? "bg-accent/70" : "bg-white/10"}`} />}
                          <span className={`relative z-[1] mx-auto grid size-5 place-items-center rounded-full border text-[9px] ${complete ? "border-accent bg-accent text-[#06110b]" : "border-white/15 bg-[#151615] text-[#858a87]"}`}>{complete ? "✓" : stepIndex + 1}</span>
                          <span className={`mt-2 block text-[9px] capitalize sm:text-[10px] ${complete ? "text-accent" : "text-[#858a87]"}`}>{step}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
                {order.status === "delivered" && <p className="mt-4 rounded-xl border border-accent/15 bg-accent/[.05] px-4 py-3 text-xs font-semibold text-accent">Delivered successfully</p>}
                {order.delivery_address_line1 && <p className="mt-4 text-[10px] leading-5 text-[#858795]">Delivering to: {order.delivery_address_line1}, {order.delivery_city}{order.delivery_region ? `, ${order.delivery_region}` : ""} {order.delivery_postal_code}, {order.delivery_country}</p>}
                <div className="my-4 border-t border-white/[.08]" />
                <ul className="space-y-2 text-xs text-[#b8b6c2]">
                  {order.items.map((item, itemIndex) => <li key={`${order.oid}-${itemIndex}`} className="flex justify-between gap-3"><span>{item.quantity} × {item.product_name}</span><span>{formatMoney(item.quantity * item.price)}</span></li>)}
                </ul>
                <div className="mt-4 flex justify-between border-t border-white/[.08] pt-4 text-sm font-bold"><span>Total</span><span>{formatMoney(order.total)}</span></div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
