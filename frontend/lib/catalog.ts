import type { Product } from "@/lib/api";
import { productImage } from "@/lib/api";

export type ProductView = Product & {
  gallery: string[];
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
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 })
    .format(fromMinorUnits(toMinorUnits(value)));

export const toMinorUnits = (value: number) => Math.round(value * 100);
export const fromMinorUnits = (value: number) => value / 100;
export const addMoney = (...values: number[]) =>
  fromMinorUnits(values.reduce((total, value) => total + toMinorUnits(value), 0));
export const sumMoney = (values: number[]) =>
  fromMinorUnits(values.reduce((total, value) => total + toMinorUnits(value), 0));
export const subtractMoney = (left: number, right: number) =>
  fromMinorUnits(toMinorUnits(left) - toMinorUnits(right));
export const multiplyMoney = (value: number, quantity: number) =>
  fromMinorUnits(toMinorUnits(value) * quantity);

export function productDisplayName(product: Pick<Product, "name">) {
  return /\bwatch\b/i.test(product.name) && !/\bsmartwatch\b/i.test(product.name)
    ? "Luxury Watch Silver Dynamic"
    : product.name;
}

export function festivalPrice(product: Pick<Product, "price"> & Partial<Pick<Product, "festival_price">>) {
  return product.festival_price ?? fromMinorUnits(Math.round(toMinorUnits(product.price) * 0.8));
}

export function enrich(product: Product): ProductView {
  return { ...product, gallery: [productImage(product)] };
}

export const mapCategory = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes("game") || n.includes("keyboard")) return "gaming";
  if (n.includes("headphone") || n.includes("watch") || n.includes("backpack")) return "accessories";
  if (n.includes("shoe") || n.includes("run")) return "fitness";
  return n;
};
