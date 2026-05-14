"use client";

import React from "react";
import { motion } from "framer-motion";

const stats = [
  { label: "Deliveries Completed", value: "50,000+", suffix: "" },
  { label: "Active Carriers", value: "2,500", suffix: "+" },
  { label: "Cities Covered", value: "12", suffix: "" },
  { label: "Avg Delivery Time", value: "45", suffix: "m" },
];

const Stats = () => {
  return (
    <section className="py-20 bg-blue-600">
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
              <div className="text-4xl lg:text-6xl font-extrabold text-white mb-2">
                {stat.value}{stat.suffix}
              </div>
              <div className="text-blue-100 font-medium tracking-wide uppercase text-sm">
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
