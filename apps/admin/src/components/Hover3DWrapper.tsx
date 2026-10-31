"use client";

import { useRef, ReactNode } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

interface Hover3DWrapperProps {
  children: ReactNode;
  className?: string;
  intensity?: "subtle" | "medium" | "strong";
}

export default function Hover3DWrapper({ children, className = "", intensity = "medium" }: Hover3DWrapperProps) {
  const ref = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  const getRotation = () => {
    switch (intensity) {
      case "subtle": return ["5deg", "-5deg"];
      case "strong": return ["25deg", "-25deg"];
      default: return ["15deg", "-15deg"];
    }
  };

  const rotationRange = getRotation();
  
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], rotationRange);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], [rotationRange[1], rotationRange[0]]);

  const rectRef = useRef<DOMRect | null>(null);

  const handleMouseEnter = () => {
    if (ref.current) {
      rectRef.current = ref.current.getBoundingClientRect();
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!rectRef.current && ref.current) {
      rectRef.current = ref.current.getBoundingClientRect();
    }
    const rect = rectRef.current;
    if (!rect || rect.width === 0 || rect.height === 0) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / rect.width - 0.5;
    const yPct = mouseY / rect.height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    rectRef.current = null;
    x.set(0);
    y.set(0);
  };

  return (
    <div style={{ perspective: 1200 }} className={className}>
      <motion.div
        ref={ref}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateY,
          rotateX,
          transformStyle: "preserve-3d",
        }}
        className="w-full h-full"
      >
        {children}
      </motion.div>
    </div>
  );
}
