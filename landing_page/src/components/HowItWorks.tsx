"use client";

import React from "react";
import { motion } from "framer-motion";
import { PlusCircle, Search, CheckCircle2 } from "lucide-react";

const steps = [
  {
    title: "Create Parcel",
    description: "Enter parcel details and destination in our app.",
    icon: <PlusCircle className="w-12 h-12" />,
  },
  {
    title: "AI Finds Relay",
    description: "Our AI matches your parcel with available community carriers.",
    icon: <Search className="w-12 h-12" />,
  },
  {
    title: "Parcel Delivered",
    description: "Your parcel travels through the relay and reaches safely.",
    icon: <CheckCircle2 className="w-12 h-12" />,
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 bg-black relative">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-[#FF5A00] font-bold tracking-wider uppercase text-sm mb-4">
            The Process
          </h2>
          <h3 className="text-4xl lg:text-5xl font-bold font-display text-white mb-6">
            How KhatKhat Works
          </h3>
        </div>

        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 }}
              className="flex-1 flex flex-col items-center text-center group"
            >
              <div className="w-24 h-24 rounded-full bg-[#FF5A00]/10 flex items-center justify-center text-[#FF5A00] mb-8 relative group-hover:bg-[#FF5A00] group-hover:text-white transition-all duration-500 shadow-[0_0_30px_rgba(255,90,0,0.1)] group-hover:shadow-[0_0_30px_rgba(255,90,0,0.4)]">
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-white text-black rounded-full flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>
                {step.icon}
              </div>
              <h4 className="text-2xl font-bold font-display text-white mb-4">{step.title}</h4>
              <p className="text-gray-400 max-w-xs mx-auto">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
