"use client";

import React from "react";
import { motion } from "framer-motion";

const FloatingGradients = () => {
  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-black">
      <motion.div
        animate={{
          x: [0, 50, 0],
          y: [0, 30, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#FF5A00]/5 rounded-full blur-[120px]"
      />
      <motion.div
        animate={{
          x: [0, -30, 0],
          y: [0, 50, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-blue-900/5 rounded-full blur-[150px]"
      />
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.03, 0.06, 0.03],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-[#FF5A00]/5 rounded-full blur-[100px]"
      />
    </div>
  );
};

export default FloatingGradients;
