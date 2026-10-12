"use client";

import type { ReactNode } from "react";

export default function MagneticLink({ href, children, className }: { href: string; children: ReactNode; className: string }) {
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}
