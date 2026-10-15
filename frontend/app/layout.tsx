"use client";
import "./globals.css";
import Link from "next/link";
import { useState } from "react";
import type { ReactNode } from "react";
import ToastViewport from "@/components/ui/ToastViewport";
import Navbar from "@/components/layout/Navbar";
import CartDrawer from "@/components/commerce/CartDrawer";
import SearchOverlay from "@/components/commerce/SearchOverlay";

export default function RootLayout({ children }: { children: ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [cartOpen, setCartOpen] = useState(false);

  return (
    <html lang="en">
      <head>
        <title>NEXORA — Technology marketplace</title>
        <meta name="description" content="Shop electronics, accessories, and everyday technology essentials at NEXORA." />
        <meta name="theme-color" content="#090D14" />
      </head>
      <body className="min-h-screen depth-layer">
        <Navbar onSearch={(query) => { setSearchQuery(query ?? ""); setSearchOpen(true); }} onCart={() => setCartOpen(true)} />
        <main className="pt-0">{children}</main>
        <footer id="about" className="mt-28 border-t border-white/[.08] bg-black/15">
          <div className="mx-auto max-w-[1440px] px-4 pb-7 pt-12 sm:px-6 lg:px-10">
            <div className="grid gap-12 border-b border-white/[.08] pb-12 md:grid-cols-[1.5fr_1fr_1fr]">
              <div className="max-w-sm">
                <Link className="font-display inline-flex items-center gap-3 text-lg font-extrabold tracking-[.18em]" href="/">
                  <span className="grid size-9 place-items-center rounded-lg bg-accent text-sm tracking-normal text-white">N</span>
                  NEXORA
                </Link>
              </div>
              <div>
                <h2 className="text-[10px] font-bold uppercase tracking-[.18em] text-white/80">Marketplace</h2>
                <div className="mt-5 flex flex-col gap-3 text-xs"><Link className="footer-link" href="/shop">Shop all</Link><Link className="footer-link" href="/#categories">Categories</Link><Link className="footer-link" href="/#deals">Checkout information</Link></div>
              </div>
              <div>
                <h2 className="text-[10px] font-bold uppercase tracking-[.18em] text-white/80">Your account</h2>
                <div className="mt-5 flex flex-col gap-3 text-xs"><Link className="footer-link" href="/account">Account</Link><Link className="footer-link" href="/orders">Order history</Link><Link className="footer-link" href="/wishlist">Saved favorites</Link></div>
              </div>
            </div>
            <div className="flex flex-col gap-4 pt-6 text-[10px] text-[#9993a7] sm:flex-row sm:items-center sm:justify-between">
              <p>© 2026 NEXORA. All rights reserved. Created by Prayukth and Suhal.</p>
              <div className="flex flex-wrap gap-x-5 gap-y-2"><Link className="footer-link" href="/admin">Store admin</Link><a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer" className="footer-link">Image attributions</a></div>
            </div>
            <p className="mt-5 text-[9px] text-[#777183]">
              Phone photos:
              {" "}
              <a href="https://commons.wikimedia.org/wiki/File:IPhone_7_Plus_Rose_Gold_128GB_04.jpg" target="_blank" rel="noreferrer" className="underline">Indrajit Das</a>
              {" and "}
              <a href="https://commons.wikimedia.org/wiki/File:Samsung-Galaxy-A32-2021.jpg" target="_blank" rel="noreferrer" className="underline">OnoMaker 12345</a>
              {" / Wikimedia Commons, "}
              <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer" className="underline">CC BY-SA 4.0</a>.
            </p>
          </div>
        </footer>
        <SearchOverlay open={searchOpen} initialQuery={searchQuery} onClose={() => setSearchOpen(false)} />
        <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
        <ToastViewport />
      </body>
    </html>
  );
}
