"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Play, ArrowRight, TrendingUp, Package, ShieldCheck, Zap } from "lucide-react";
import LogisticsVisual from "./LogisticsVisual";

const Hero = () => {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden bg-grid">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-[#FF5A00]/10 rounded-full blur-[120px] -z-10" />
      <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-blue-500/5 rounded-full blur-[100px] -z-10" />

      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          {/* Left Content */}
          <div className="flex-1 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FF5A00]/10 border border-[#FF5A00]/20 text-[#FF5A00] text-sm font-semibold mb-6 shadow-[0_0_15px_rgba(255,90,0,0.1)]"
            >
              <Zap className="w-4 h-4 fill-current" />
              Next-Gen Logistics Engine
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-5xl lg:text-7xl font-extrabold font-display text-white leading-[1.1] mb-6 tracking-tight"
            >
              Delivery Fast & <br />
              Safe Across <span className="text-[#FF5A00] text-neon">Goa</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg text-gray-400 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed"
            >
              Community-powered hyperlocal delivery with AI relay matching. 
              The future of logistics is here, faster and more reliable than ever.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start"
            >
              <Link href="/admin_dashboard/admin.html" className="w-full sm:w-auto">
                <motion.button 
                  whileHover={{ scale: 1.05, boxShadow: "0 0 25px rgba(255,90,0,0.5)" }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto bg-[#FF5A00] text-white px-8 py-4 rounded-full font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-xl shadow-[#FF5A00]/20"
                >
                  Get Started
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </Link>
              <button className="w-full sm:w-auto glass hover:bg-white/5 text-white px-8 py-4 rounded-full font-bold text-lg transition-all flex items-center justify-center gap-2">
                <div className="w-8 h-8 bg-[#FF5A00]/10 rounded-full flex items-center justify-center">
                  <Play className="w-4 h-4 fill-[#FF5A00] text-[#FF5A00] ml-0.5" />
                </div>
                Watch Demo
              </button>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="mt-12 flex items-center gap-8 justify-center lg:justify-start grayscale opacity-30"
            >
              <div className="font-bold text-gray-500">PARTNERS</div>
              <div className="text-xl font-bold text-white">GoaLogix</div>
              <div className="text-xl font-bold text-white">SwiftMove</div>
              <div className="text-xl font-bold text-white">RelayGo</div>
            </motion.div>
          </div>

          {/* Right Content - Realistic Visual */}
          <div className="flex-1 w-full max-w-3xl relative">
            <LogisticsVisual />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
