"use client";

import { Heart, Menu, Search, ShoppingBag, UserRound, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { getCart, getToken, getWishlist, notify, syncCartFromServer } from "@/lib/api";

const links = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Shop" },
  { href: "/#categories", label: "Categories" },
  { href: "/#deals", label: "Deals" },
];

export default function Navbar({ onSearch, onCart }: { onSearch: (query?: string) => void; onCart: () => void }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [query, setQuery] = useState("");
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const refresh = () => {
      setCartCount(getCart().reduce((sum, line) => sum + line.quantity, 0));
      setWishlistCount(getWishlist().length);
      setAuthenticated(Boolean(getToken()));
    };
    refresh();
    if (getToken()) {
      void syncCartFromServer().then((cart) => setCartCount(cart.reduce((sum, line) => sum + line.quantity, 0))).catch((error: unknown) => {
        notify(error instanceof Error ? error.message : "Cart could not be loaded.", "info");
      });
    }
    window.addEventListener("storage", refresh);
    window.addEventListener("nexora-cart-change", refresh);
    window.addEventListener("nexora-wishlist-change", refresh);
    window.addEventListener("nexora-auth-change", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener("nexora-cart-change", refresh);
      window.removeEventListener("nexora-wishlist-change", refresh);
      window.removeEventListener("nexora-auth-change", refresh);
    };
  }, []);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch(query.trim());
  };

  return (
    <header className="sticky top-0 z-50 border-b border-[#263449] bg-[#101722]">
      <div className="mx-auto flex min-h-[72px] max-w-[1440px] items-center gap-4 px-4 sm:px-6 lg:gap-8 lg:px-10">
        <Link href="/" aria-label="NEXORA home" className="font-display flex shrink-0 items-center gap-2.5 text-lg font-bold tracking-[.11em]">
          <span className="grid size-8 place-items-center rounded-lg bg-accent text-sm text-white">N</span>
          NEXORA
        </Link>
        <nav aria-label="Main navigation" className="hidden items-center gap-1 lg:flex">
          {links.map((link) => {
            const active = link.href === "/shop" ? pathname === "/shop" : link.href === "/" ? pathname === "/" : false;
            return <Link key={link.label} href={link.href} aria-current={active ? "page" : undefined} className={`nav-link rounded-lg px-3 py-2 text-sm font-medium ${active ? "is-active" : ""}`}>{link.label}</Link>;
          })}
        </nav>
        <form role="search" onSubmit={submitSearch} className="ml-auto hidden h-11 max-w-[440px] flex-1 items-center rounded-xl border border-[#263449] bg-[#090d14] px-3 focus-within:border-accent md:flex">
          <Search size={17} className="shrink-0 text-muted" />
          <input aria-label="Search products" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products" className="min-w-0 flex-1 bg-transparent px-2.5 text-sm text-white outline-none placeholder:text-muted" />
          <button type="submit" className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#60a5fa]">Search</button>
        </form>
        <div className="flex items-center gap-0.5 sm:gap-1">
          <button aria-label="Search products" onClick={() => onSearch()} className="icon-button md:hidden"><Search size={19} /></button>
          <Link href="/wishlist" aria-label={`Wishlist, ${wishlistCount} saved`} className="icon-button nav-secondary-control relative">
            <Heart size={19} />
            {wishlistCount > 0 && <span className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">{wishlistCount}</span>}
          </Link>
          <button id="nav-cart" aria-label={`Cart, ${cartCount} items`} onClick={onCart} className="icon-button relative">
            <ShoppingBag size={19} />
            {cartCount > 0 && <span className="absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">{cartCount}</span>}
          </button>
          <Link href={authenticated ? "/account" : "/login?next=%2Faccount"} aria-label={authenticated ? "My account" : "Sign in"} className="icon-button nav-secondary-control"><UserRound size={19} /></Link>
          <button aria-label={menuOpen ? "Close menu" : "Open menu"} aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)} className="icon-button lg:hidden">{menuOpen ? <X size={19} /> : <Menu size={19} />}</button>
        </div>
      </div>
      {menuOpen && (
        <nav aria-label="Mobile navigation" className="border-t border-[#263449] bg-[#101722] px-4 py-2 lg:hidden">
          {[...links, { href: "/wishlist", label: "Wishlist" }, { href: authenticated ? "/account" : "/login?next=%2Faccount", label: authenticated ? "My account" : "Sign in" }].map((link) => (
            <Link key={link.label} href={link.href} onClick={() => setMenuOpen(false)} className="block border-b border-[#283444] py-3 text-sm text-[#9aa8ba] last:border-0 hover:text-white">{link.label}</Link>
          ))}
          <form role="search" onSubmit={submitSearch} className="my-3 flex h-10 items-center rounded-lg border border-[#283444] bg-[#0b0f14] px-3 md:hidden">
            <Search size={16} className="text-muted" />
            <input aria-label="Search products" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search products" className="min-w-0 flex-1 bg-transparent px-2.5 text-sm outline-none placeholder:text-muted" />
            <button type="submit" className="text-xs font-semibold text-accent">Search</button>
          </form>
        </nav>
      )}
    </header>
  );
}
