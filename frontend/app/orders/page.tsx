"use client";
import { motion } from "framer-motion";
import { ArrowRight, PackageCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { API, api, getToken, notify } from "@/lib/api";

type Order = { id: number; total: number; status: string; created_at: string; items: { product_name: string; quantity: number; price: number }[] };
export default function Orders() {
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const loadOrders = () => api<Order[]>("/orders").then(setOrders);
    loadOrders().catch((err) => setError(err instanceof Error ? err.message : "Could not load orders."));

    const token = getToken();
    if (!token) return;
    const socketUrl = new URL("/ws/notifications", API);
    socketUrl.protocol = socketUrl.protocol === "https:" ? "wss:" : "ws:";
    socketUrl.searchParams.set("token", token);
    const socket = new WebSocket(socketUrl);
    socket.onmessage = (message) => {
      try {
        const event = JSON.parse(message.data) as { type?: string; order_id?: number; status?: string };
        if (
          (event.type === "order.created" || event.type === "order.status_changed") &&
          event.order_id &&
          event.status
        ) {
          notify(
            event.type === "order.created"
              ? `Order #${event.order_id} was placed.`
              : `Order #${event.order_id} is now ${event.status}.`,
            "info",
          );
          loadOrders().catch(() => notify("Order status changed, but the order list could not be refreshed.", "info"));
        }
      } catch {
        notify("Received an unreadable order update.", "info");
      }
    };
    return () => socket.close();
  }, []);
  return <section className="mx-auto min-h-[65vh] max-w-[1050px] px-5 pb-12 pt-24 sm:px-8 lg:px-12"><p className="text-[10px] font-bold uppercase tracking-[.18em] text-accent">Every good thing, in one place</p><h1 className="font-display mt-2 text-3xl font-extrabold">Your orders</h1>
    {error ? <div className="panel mt-8 p-6 text-sm text-[#bcbac6]"><p>{error === "Not authenticated" ? "Sign in to see your orders." : error}</p><Link className="button-primary mt-5" href="/login">Sign in <ArrowRight size={15} /></Link></div> : orders === null ? <div className="mt-8 space-y-3">{[1,2].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl bg-white/[.04]" />)}</div> : orders.length === 0 ? <div className="panel mt-8 py-16 text-center"><PackageCheck size={24} className="mx-auto text-accent" /><p className="mt-4 text-sm text-[#c2c0cc]">Your next favorite is only a click away.</p><Link className="button-primary mt-5" href="/#shop">Explore the edit <ArrowRight size={15} /></Link></div> : <div className="mt-8 space-y-4">{orders.map((order, index) => <motion.article key={order.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * .06 }} className="panel p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><span className="text-[10px] uppercase tracking-wider text-[#8c8e9b]">Order #{order.id}</span><p className="mt-1 text-[10px] text-[#8c8e9b]">{new Date(order.created_at).toLocaleDateString()}</p></div><span className="rounded-full border border-accent/20 bg-accent/10 px-3 py-1.5 text-[10px] font-semibold capitalize text-accent">{order.status}</span></div><div className="my-4 border-t border-white/[.08]" /><ul className="space-y-2 text-xs text-[#b8b6c2]">{order.items.map((item, index) => <li key={`${order.id}-${index}`} className="flex justify-between gap-3"><span>{item.quantity} × {item.product_name}</span><span>${(item.quantity * item.price).toFixed(2)}</span></li>)}</ul><div className="mt-4 flex justify-between border-t border-white/[.08] pt-4 text-sm font-bold"><span>Total</span><span>${order.total.toFixed(2)}</span></div></motion.article>)}</div>}</section>;
}
