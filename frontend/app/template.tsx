"use client";

import { motion, useReducedMotion } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { getToken } from "@/lib/api";

const publicRoutes = new Set(["/", "/login", "/shop", "/wishlist", "/cart", "/checkout"]);

export default function Template({ children }: { children: ReactNode }) {
  const reduceMotion = useReducedMotion();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const hasToken = Boolean(getToken());
    const isPublicRoute = publicRoutes.has(pathname) || pathname.startsWith("/products/") || pathname.startsWith("/_");

    if (pathname === "/login") {
      if (hasToken) {
        router.replace("/");
      }
      return;
    }

    if (!hasToken && !isPublicRoute) {
      router.replace("/login");
    }
  }, [pathname, router]);

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.2, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
