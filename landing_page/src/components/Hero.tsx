"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Play, ArrowRight, Zap } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import LogisticsVisual from "./LogisticsVisual";

const Hero = () => {
  const { isDarkMode } = useTheme();

  return (
    <section className={`relative pt-32 pb-20 overflow-hidden transition-colors duration-500 ${isDarkMode ? 'bg-[#000000]' : 'bg-white'}`}>
      {/* Background Glows (Theme Aware) */}
      <div className={`absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[120px] -z-10 ${isDarkMode ? 'bg-[#FF5A00]/10' : 'bg-[#FF5A00]/5'}`} />
      <div className={`absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full blur-[100px] -z-10 ${isDarkMode ? 'bg-blue-500/5' : 'bg-blue-500/10'}`} />

      {/* Grid Overlay (Theme Aware) */}
      <div className={`absolute inset-0 opacity-[0.03] -z-20 ${isDarkMode ? 'bg-grid' : ''}`} style={!isDarkMode ? { backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '32px 32px' } : {}} />

      <div className="container mx-auto px-6">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          {/* Left Content */}
          <div className="flex-1 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold mb-6 shadow-sm ${isDarkMode ? 'bg-[#FF5A00]/10 border-[#FF5A00]/20 text-[#FF5A00]' : 'bg-orange-50 border-orange-100 text-orange-600'}`}
            >
              <Zap className="w-4 h-4 fill-current" />
              Next-Gen Logistics Engine
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className={`text-5xl lg:text-7xl font-extrabold font-display leading-[1.1] mb-6 tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
            >
              Delivery Fast & <br />
              Safe Across <span className="text-[#FF5A00]">Goa</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className={`text-lg mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}
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
                  whileHover={{ scale: 1.05, boxShadow: isDarkMode ? "0 0 25px rgba(255,90,0,0.5)" : "0 10px 20px rgba(255,90,0,0.2)" }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto bg-[#FF5A00] text-white px-8 py-4 rounded-full font-bold text-lg transition-all flex items-center justify-center gap-2 shadow-xl shadow-[#FF5A00]/20"
                >
                  Get Started
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </Link>
              <button className={`w-full sm:w-auto px-8 py-4 rounded-full font-bold text-lg transition-all flex items-center justify-center gap-2 border ${isDarkMode ? 'glass text-white border-white/10 hover:bg-white/5' : 'bg-white text-slate-900 border-slate-200 hover:bg-slate-50 shadow-sm'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-[#FF5A00]/10' : 'bg-orange-50'}`}>
                  <Play className={`w-4 h-4 fill-[#FF5A00] text-[#FF5A00] ml-0.5`} />
                </div>
                Watch Demo
              </button>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 0.5 }}
              className={`mt-12 flex items-center gap-8 justify-center lg:justify-start ${isDarkMode ? 'opacity-30 grayscale' : 'opacity-60'}`}
            >
              <div className="font-bold text-gray-500">PARTNERS</div>
              <div className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>GoaLogix</div>
              <div className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>SwiftMove</div>
              <div className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>RelayGo</div>
            </motion.div>
          </div>

          {/* Right Content - Visual */}
          <div className="flex-1 w-full max-w-3xl relative">
            <LogisticsVisual isDarkMode={isDarkMode} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
