"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
}

export default function AnimatedSection({ 
  children, 
  className = "", 
  delay = 0,
  direction = "up"
}: AnimatedSectionProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const getInitialOffset = () => {
    switch (direction) {
      case "up": return { y: 50, opacity: 0 };
      case "down": return { y: -50, opacity: 0 };
      case "left": return { x: 50, opacity: 0 };
      case "right": return { x: -50, opacity: 0 };
      case "none": return { opacity: 0 };
      default: return { y: 50, opacity: 0 };
    }
  };

  const initial = getInitialOffset();

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={initial}
      animate={isInView ? { x: 0, y: 0, opacity: 1 } : initial}
      transition={{ 
        duration: 0.7, 
        ease: "easeOut",
        delay: delay
      }}
    >
      {children}
    </motion.div>
  );
}
