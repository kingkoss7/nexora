"use client";

import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { editorialCategories } from "@/lib/catalog";
import Reveal from "@/components/ui/Reveal";

export default function CategoryGrid() {
  return (
    <section id="categories" className="mx-auto max-w-[1440px] scroll-mt-24 px-5 py-20 sm:px-8 lg:px-12">
      <Reveal>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">Worlds</p>
        <h2 className="font-display mt-3 text-3xl font-bold tracking-[-0.04em] sm:text-4xl">Editorial categories</h2>
      </Reveal>
      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {editorialCategories.map((category, index) => (
          <Reveal key={category.slug} delay={index * 0.06}>
            <Link href={`/shop?category=${category.slug}`} className="group relative block aspect-[16/10] overflow-hidden rounded-[24px]">
              <img src={category.image} alt={category.name} className="h-full w-full object-cover transition duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-black/35 transition group-hover:bg-black/50" />
              <span className="absolute left-6 top-6 h-px w-8 bg-accent transition-all duration-320 group-hover:w-16" />
              <div className="absolute inset-x-6 bottom-6 flex items-end justify-between">
                <h3 className="font-display text-2xl font-bold transition duration-320 group-hover:-translate-y-1">{category.name}</h3>
                <ArrowUpRight className="translate-y-2 text-accent opacity-0 transition duration-320 group-hover:translate-y-0 group-hover:opacity-100" size={22} />
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
