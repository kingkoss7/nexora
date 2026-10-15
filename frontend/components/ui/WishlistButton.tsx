"use client";

import { Heart } from "lucide-react";

export default function WishlistButton({ saved, onToggle, className = "" }: { saved: boolean; onToggle: () => void; className?: string }) {
  return (
    <button
      type="button"
      aria-label={saved ? "Remove from wishlist" : "Add to wishlist"}
      aria-pressed={saved}
      onClick={onToggle}
      className={`relative grid h-10 w-10 place-items-center rounded-full border border-white/12 bg-black/40 text-white backdrop-blur hover:border-accent/40 ${saved ? "text-accent" : ""} ${className}`}
    >
      <Heart size={16} fill={saved ? "currentColor" : "none"} />
    </button>
  );
}
