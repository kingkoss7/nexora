import type { Product } from "@/lib/api";
import { productImage } from "@/lib/api";

export type ProductView = Product & {
  brand: string;
  originalPrice: number;
  discount: number;
  rating: number;
  reviews: number;
  colors: { name: string; hex: string }[];
  sizes: string[];
  gallery: string[];
};

const brands: Record<string, string> = {
  electronics: "Nexora Lab",
  fashion: "Atelier",
  home: "Haus",
  gaming: "Pulse",
  accessories: "Orbit",
  fitness: "Volt",
};

export const editorialCategories = [
  { slug: "electronics", name: "Electronics", image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=1200&q=80" },
  { slug: "gaming", name: "Gaming", image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200&q=80" },
  { slug: "fashion", name: "Fashion", image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80" },
  { slug: "accessories", name: "Accessories", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80" },
  { slug: "home", name: "Home", image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1200&q=80" },
  { slug: "fitness", name: "Fitness", image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80" },
];

export const formatMoney = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

export function enrich(product: Product): ProductView {
  const originalPrice = Math.round(product.price * (product.id % 3 === 0 ? 1.28 : 1.18));
  const discount = Math.max(8, Math.round((1 - product.price / originalPrice) * 100));
  const primary = productImage(product);
  return {
    ...product,
    brand: brands[product.category] ?? "Nexora",
    originalPrice,
    discount,
    rating: Math.round((4.3 + (product.id % 6) * 0.11) * 10) / 10,
    reviews: 42 + product.id * 19,
    colors: [
      { name: "Graphite", hex: "#2a2a2a" },
      { name: "Silver", hex: "#d6d6d6" },
      { name: "Forest", hex: "#3dcf8a" },
    ],
    sizes: product.category === "fashion" ? ["S", "M", "L", "XL"] : ["Standard"],
    gallery: [
      primary,
      `https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=85`,
      `https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=1200&q=85`,
      `https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1200&q=85`,
    ],
  };
}

export const mapCategory = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes("game") || n.includes("keyboard")) return "gaming";
  if (n.includes("headphone") || n.includes("watch") || n.includes("backpack")) return "accessories";
  if (n.includes("shoe") || n.includes("run")) return "fitness";
  return n;
};
