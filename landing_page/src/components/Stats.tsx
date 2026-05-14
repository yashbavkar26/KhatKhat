"use client";

import React from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";

const stats = [
  { label: "Deliveries Completed", value: "50k", suffix: "+" },
  { label: "Active Carriers", value: "2.5k", suffix: "+" },
  { label: "Cities Covered", value: "12", suffix: "" },
  { label: "Avg Delivery Time", value: "45", suffix: "m" },
];

const Stats = () => {
  const { isDarkMode } = useTheme();

  return (
    <section className={`py-20 transition-colors duration-500 border-y ${isDarkMode ? 'bg-[#FF5A00]/5 border-white/5' : 'bg-orange-50/50 border-orange-100'}`}>
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-12">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="text-center"
            >
              <div className={`text-4xl lg:text-6xl font-bold font-display mb-2 transition-colors ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                {stat.value}<span className="text-[#FF5A00]">{stat.suffix}</span>
              </div>
              <div className={`font-medium uppercase tracking-widest text-xs transition-colors ${isDarkMode ? 'text-gray-500' : 'text-slate-400'}`}>
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Stats;
