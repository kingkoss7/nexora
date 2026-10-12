"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, notify } from "@/lib/api";
import { editorialCategories } from "@/lib/catalog";
import Reveal from "@/components/ui/Reveal";

export default function CategoryGrid() {
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    api<string[]>("/categories").then(setCategories).catch((error: unknown) => {
      notify(error instanceof Error ? error.message : "Categories could not be loaded.", "info");
    });
  }, []);

  return (
    <section id="categories" className="page-frame mx-auto max-w-[1440px] scroll-mt-24 px-4 py-14 sm:px-6 lg:px-10">
      <Reveal>
        <p className="eyebrow">Find your world</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <h2 className="display-heading max-w-[12ch] text-4xl sm:text-5xl">Shop by category.</h2>
          <p className="max-w-xs text-sm leading-6 text-[#9aa8ba]">Browse the categories available in the NEXORA marketplace.</p>
        </div>
      </Reveal>
      <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category, index) => {
          const image = editorialCategories.find((item) => item.slug === category.toLowerCase())?.image ?? editorialCategories[0].image;
          return (
            <Reveal key={category} delay={index * 0.06}>
              <Link href={`/shop?category=${encodeURIComponent(category)}`} className="group relative block aspect-[1.5/1] overflow-hidden rounded-xl border border-[#283444] bg-[#151c26]">
                <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-75 group-hover:opacity-90" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f14]/95 via-[#0b0f14]/15 to-transparent" />
                <div className="absolute inset-x-5 bottom-5 flex items-end justify-between">
                  <div>
                    <span className="text-[10px] font-medium uppercase tracking-wider text-[#c3ccda]">Category</span>
                    <h3 className="font-display mt-1 text-xl font-bold sm:text-2xl">{category}</h3>
                  </div>
                  <span className="grid size-10 place-items-center rounded-lg border border-white/20 bg-[#0b0f14]/70 text-white group-hover:border-accent group-hover:bg-accent"><ArrowUpRight size={18} /></span>
                </div>
              </Link>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
