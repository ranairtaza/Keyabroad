"use client";

import { ReactNode, useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import Link from "next/link";

interface Feature3DCardProps {
  title: string;
  description: string;
  icon: ReactNode;
  href?: string;
}

export default function Feature3DCard({ title, description, icon, href }: Feature3DCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["17.5deg", "-17.5deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-17.5deg", "17.5deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();

    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const cardContent = (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateY,
        rotateX,
        transformStyle: "preserve-3d",
      }}
      className="relative w-full h-full rounded-2xl bg-gradient-to-br from-white to-slate-50 shadow-xl border border-slate-200 cursor-pointer"
    >
      <div
        style={{
          transform: "translateZ(60px)",
          transformStyle: "preserve-3d",
        }}
        className="absolute inset-4 flex flex-col items-center justify-center rounded-xl bg-white/80 backdrop-blur-sm shadow-inner p-6 text-center border border-white"
      >
        <div 
          style={{ transform: "translateZ(40px)" }}
          className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary"
        >
          {icon}
        </div>
        <h3 
          style={{ transform: "translateZ(30px)" }}
          className="text-2xl font-bold text-slate-900 mb-2"
        >
          {title}
        </h3>
        <p 
          style={{ transform: "translateZ(20px)" }}
          className="text-slate-600 font-medium"
        >
          {description}
        </p>
      </div>
    </motion.div>
  );

  return (
    <div style={{ perspective: 1000 }} className="w-full h-80">
      {href ? (
        <Link href={href} className="block w-full h-full">
          {cardContent}
        </Link>
      ) : (
        cardContent
      )}
    </div>
  );
}
