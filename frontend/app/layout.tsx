"use client";
import "./globals.css";
import Link from "next/link";
import { useState } from "react";
import type { ReactNode } from "react";
import ToastViewport from "@/components/ui/ToastViewport";
import Navbar from "@/components/layout/Navbar";
import ScrollProgress from "@/components/layout/ScrollProgress";
import LaunchLoader from "@/components/layout/LaunchLoader";
import CartDrawer from "@/components/commerce/CartDrawer";
import SearchOverlay from "@/components/commerce/SearchOverlay";
import AddToCartFly from "@/components/commerce/AddToCartFly";

export default function RootLayout({ children }: { children: ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <html lang="en">
      <head>
        <title>NEXORA — The next standard</title>
        <meta name="description" content="Premium products built for performance, style and everyday innovation." />
        <meta name="theme-color" content="#050505" />
      </head>
      <body className="min-h-screen depth-layer">
        <LaunchLoader />
        <ScrollProgress />
        <Navbar onSearch={() => setSearchOpen(true)} onCart={() => setCartOpen(true)} />
        <main className="pt-0">{children}</main>
        <footer id="about" className="mt-20 border-t border-white/[.07]">
          <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-5 py-10 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
            <Link className="font-display font-extrabold tracking-[.2em] text-white" href="/">NEXORA</Link>
            <p>© 2026 NEXORA. All rights reserved. Created by Prayukth &amp; Suhal.</p>
            <div className="flex gap-5"><Link href="/orders">Orders</Link><Link href="/admin">Admin</Link><Link href="/account">Account</Link></div>
          </div>
          <p className="mx-auto max-w-[1440px] px-5 pb-6 text-[10px] text-muted sm:px-8 lg:px-12">
            Phone photos:
            {" "}
            <a href="https://commons.wikimedia.org/wiki/File:IPhone_7_Plus_Rose_Gold_128GB_04.jpg" target="_blank" rel="noreferrer" className="underline">Indrajit Das</a>
            {" and "}
            <a href="https://commons.wikimedia.org/wiki/File:Samsung-Galaxy-A32-2021.jpg" target="_blank" rel="noreferrer" className="underline">OnoMaker 12345</a>
            {" / Wikimedia Commons, "}
            <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer" className="underline">CC BY-SA 4.0</a>.
          </p>
        </footer>
        <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
        <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
        <AddToCartFly />
        <ToastViewport />
      </body>
    </html>
  );
}
