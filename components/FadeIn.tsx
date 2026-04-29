"use client";

import { motion } from "framer-motion";

const OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

interface FadeInProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}

export default function FadeIn({ children, className, delay = 0, y = 10 }: FadeInProps) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, ease: OUT, delay }}
    >
      {children}
    </motion.div>
  );
}
