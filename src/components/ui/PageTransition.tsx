"use client";

import React from "react";
import { m } from "framer-motion";
import { pageTransitionVariants } from "@/lib/motion";
import { cn } from "@/lib/utils";

export function PageTransition({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <m.div
      variants={pageTransitionVariants}
      initial="initial"
      animate="animate"
      className={cn("will-change-transform", className)}
    >
      {children}
    </m.div>
  );
}

