"use client";

import { useRef, useEffect } from "react";
import { useInView, animate, motion, useMotionValue, useTransform } from "framer-motion";

const AnimatedCounter = ({ from = 0, to, duration = 2 }: { from?: number; to: number; duration?: number }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  
  const count = useMotionValue(from);
  const rounded = useTransform(count, (latest) => Math.round(latest));

  useEffect(() => {
    if (inView) {
      const animation = animate(count, to, { duration: duration, ease: "easeOut" });
      return animation.stop;
    }
  }, [count, to, duration, inView]);

  return <motion.span ref={ref}>{rounded}</motion.span>;
};

export default AnimatedCounter;
