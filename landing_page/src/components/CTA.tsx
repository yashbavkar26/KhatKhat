"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

const CTA = () => {
  const { isDarkMode } = useTheme();

  return (
    <section className={`py-24 transition-colors duration-500 ${isDarkMode ? 'bg-black' : 'bg-white'}`}>
      <div className="container mx-auto px-6">
        <div className={`relative overflow-hidden rounded-[4rem] p-12 lg:p-20 text-center border transition-all duration-500 ${isDarkMode ? 'bg-[#FF5A00] border-transparent text-white shadow-[0_0_80px_rgba(255,90,0,0.3)]' : 'bg-slate-900 border-slate-800 text-white shadow-2xl'}`}>
          {/* Background Glows */}
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/10 rounded-full blur-[100px] -z-0 translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-black/10 rounded-full blur-[80px] -z-0 -translate-x-1/2 translate-y-1/2" />

          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-4xl lg:text-6xl font-bold font-display mb-8">
              Ready to Experience the Future of Logistics?
            </h2>
            <p className="text-xl mb-12 opacity-90 leading-relaxed">
              Join thousands of users and carriers in Goa who are already 
              benefiting from our next-gen hyperlocal delivery network.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: "white", color: isDarkMode ? "#FF5A00" : "#0f172a" }}
                whileTap={{ scale: 0.95 }}
                className={`px-10 py-5 rounded-full font-bold text-lg transition-all flex items-center gap-3 shadow-2xl ${isDarkMode ? 'bg-black text-white shadow-black/20' : 'bg-orange-500 text-white shadow-orange-500/20'}`}
              >
                Join as Carrier
                <ArrowRight className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`px-10 py-5 rounded-full font-bold text-lg border-2 transition-all flex items-center gap-3 ${isDarkMode ? 'border-white text-white hover:bg-white hover:text-[#FF5A00]' : 'border-white/20 text-white hover:bg-white/10'}`}
              >
                Schedule Delivery
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
