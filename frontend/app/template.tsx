"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { getPostLoginPath, getToken } from "@/lib/api";

const publicRoutes = new Set(["/", "/login", "/shop"]);

export default function Template({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [readyPath, setReadyPath] = useState<string | null>(null);

  useEffect(() => {
    const hasToken = Boolean(getToken());
    const isPublicRoute = publicRoutes.has(pathname) || pathname.startsWith("/products/") || pathname.startsWith("/_");

    if (pathname === "/login") {
      if (hasToken) {
        router.replace(getPostLoginPath());
      } else {
        setReadyPath(pathname);
      }
      return;
    }

    if (isPublicRoute || hasToken) {
      setReadyPath(pathname);
      return;
    }
    const returnTo = `${pathname}${window.location.search}${window.location.hash}`;
    router.replace(`/login?next=${encodeURIComponent(returnTo)}`);
  }, [pathname, router]);

  if (readyPath !== pathname) return null;

  return <>{children}</>;
}
