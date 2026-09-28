"use client";

import { useEffect, useRef } from "react";
import { useInView, useMotionValue, useSpring, motion, useTransform } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
}

export function AnimatedCounter({ value, suffix = "", prefix = "", duration = 2 }: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  
  const count = useMotionValue(0);
  // useSpring provides a smooth animation
  const springValue = useSpring(count, {
    duration: duration * 1000,
    bounce: 0,
  });
  
  const rounded = useTransform(springValue, (latest) => 
    Intl.NumberFormat("en-US").format(Math.floor(latest))
  );

  useEffect(() => {
    if (isInView) {
      count.set(value);
    }
  }, [isInView, count, value]);

  return (
    <span ref={ref}>
      {prefix}
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  );
}
