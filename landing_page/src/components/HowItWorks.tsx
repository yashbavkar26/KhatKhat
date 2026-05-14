"use client";

import React from "react";
import { motion } from "framer-motion";
import { PlusCircle, Search, CheckCircle2 } from "lucide-react";

const steps = [
  {
    title: "Create Parcel",
    description: "Enter parcel details and destination in our app.",
    icon: <PlusCircle className="w-10 h-10" />,
  },
  {
    title: "AI Finds Relay",
    description: "Our AI matches your parcel with available community carriers.",
    icon: <Search className="w-10 h-10" />,
  },
  {
    title: "Parcel Delivered",
    description: "Your parcel travels through the relay and reaches safely.",
    icon: <CheckCircle2 className="w-10 h-10" />,
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 bg-slate-50 relative overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-blue-600 font-bold tracking-wider uppercase text-sm mb-4">
            The Process
          </h2>
          <h3 className="text-4xl lg:text-5xl font-bold font-display text-slate-900 mb-6">
            How KhatKhat Works
          </h3>
        </div>

        <div className="relative">
          {/* Connecting Line */}
          <div className="absolute top-1/2 left-0 w-full h-1 bg-blue-100 -translate-y-1/2 hidden lg:block" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 relative z-10">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="flex flex-col items-center text-center"
              >
                <div className="w-24 h-24 rounded-full bg-white border-8 border-blue-50 flex items-center justify-center text-blue-600 shadow-xl mb-8 relative">
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                  {step.icon}
                </div>
                <h4 className="text-2xl font-bold font-display text-slate-900 mb-4">{step.title}</h4>
                <p className="text-slate-600 max-w-xs mx-auto">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
