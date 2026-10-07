"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Heart, Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getCart, getToken, notify, syncCartFromServer } from "@/lib/api";

const links = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/#categories", label: "Categories" },
  { href: "/#collections", label: "Collections" },
  { href: "/#deals", label: "Deals" },
  { href: "/#about", label: "About" },
];

export default function Navbar({ onSearch, onCart }: { onSearch: () => void; onCart: () => void }) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [cartPulse, setCartPulse] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const refresh = () => {
      const next = getCart().reduce((sum, line) => sum + line.quantity, 0);
      setCartCount((prev) => {
        if (next > prev) setCartPulse(true);
        return next;
      });
    };
    refresh();
    if (getToken()) {
      void syncCartFromServer().then((cart) => setCartCount(cart.reduce((sum, line) => sum + line.quantity, 0))).catch((error: unknown) => {
        notify(error instanceof Error ? error.message : "Cart could not be loaded.", "info");
      });
    }
    window.addEventListener("storage", refresh);
    window.addEventListener("nexora-cart-change", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("nexora-cart-change", refresh);
    };
  }, []);

  useEffect(() => {
    if (!cartPulse) return;
    const t = window.setTimeout(() => setCartPulse(false), 420);
    return () => window.clearTimeout(t);
  }, [cartPulse]);

  return (
    <header className={`fixed inset-x-0 top-0 z-50 transition-all duration-320 ${scrolled ? "border-b border-white/8 bg-[#050505]/78 backdrop-blur-xl" : "bg-transparent"}`}>
      <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-8 px-5 sm:px-8 lg:px-12">
        <Link href="/" className="font-display shrink-0 text-[15px] font-extrabold tracking-[0.22em]" aria-label="NEXORA home">
          NEXORA
        </Link>
        <nav className="hidden items-center gap-7 text-[13px] md:flex">
          {links.map((link) => (
            <Link key={link.label} href={link.href} className={`nav-link ${pathname === link.href ? "is-active text-white" : ""}`}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1">
          <button aria-label="Search" onClick={onSearch} className="grid h-10 w-10 place-items-center rounded-full text-[#c5c5c5] transition hover:text-white"><Search size={18} /></button>
          <Link href="/wishlist" aria-label="Wishlist" className="hidden h-10 w-10 place-items-center rounded-full text-[#c5c5c5] transition hover:text-white sm:grid"><Heart size={18} /></Link>
          <button id="nav-cart" aria-label={`Cart, ${cartCount} items`} onClick={onCart} className={`relative grid h-10 w-10 place-items-center rounded-full text-[#c5c5c5] transition hover:text-white ${cartPulse ? "text-accent" : ""}`}>
            <ShoppingBag size={18} />
            <AnimatePresence>
              {cartCount > 0 && (
                <motion.span
                  key={cartCount}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[9px] font-bold text-[#04140c]"
                >
                  {cartCount}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
          <Link href="/account" aria-label="Account" className="hidden h-10 w-10 place-items-center rounded-full text-[#c5c5c5] transition hover:text-white sm:grid"><UserRound size={18} /></Link>
          <button aria-label={menuOpen ? "Close menu" : "Open menu"} onClick={() => setMenuOpen(!menuOpen)} className="grid h-10 w-10 place-items-center rounded-full text-[#c5c5c5] md:hidden">{menuOpen ? <X size={18} /> : <Menu size={18} />}</button>
        </div>
      </div>
      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/8 bg-[#0a0a0a] px-6 py-3 md:hidden"
          >
            {[...links, { href: "/wishlist", label: "Wishlist" }, { href: "/account", label: "Account" }].map((link) => (
              <Link key={link.label} href={link.href} onClick={() => setMenuOpen(false)} className="block border-b border-white/6 py-3 text-sm text-[#d4d4d4]">{link.label}</Link>
            ))}
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
