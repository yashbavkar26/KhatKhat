"use client";

import React from "react";
import { motion } from "framer-motion";
import { Cpu, Users, MapPin, Shield, Zap, Bell } from "lucide-react";

const features = [
  {
    title: "AI Relay Matching",
    description: "Our proprietary algorithm connects your package with the most efficient relay chain.",
    icon: <Cpu className="w-8 h-8" />,
    color: "bg-blue-500",
  },
  {
    title: "Community Network",
    description: "Leverage thousands of local community carriers for faster hyperlocal delivery.",
    icon: <Users className="w-8 h-8" />,
    color: "bg-indigo-500",
  },
  {
    title: "Live Tracking",
    description: "Real-time updates on your parcel location with micro-second accuracy.",
    icon: <MapPin className="w-8 h-8" />,
    color: "bg-emerald-500",
  },
  {
    title: "Trust & Safety",
    description: "Every carrier is verified. Multi-stage security for every shipment.",
    icon: <Shield className="w-8 h-8" />,
    color: "bg-orange-500",
  },
  {
    title: "Smart Pricing",
    description: "Dynamic pricing based on relay availability and distance optimization.",
    icon: <Zap className="w-8 h-8" />,
    color: "bg-purple-500",
  },
  {
    title: "Instant Notifications",
    description: "Get notified at every step of the journey, from pickup to final delivery.",
    icon: <Bell className="w-8 h-8" />,
    color: "bg-pink-500",
  },
];

const Features = () => {
  return (
    <section id="services" className="py-24 bg-white">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-blue-600 font-bold tracking-wider uppercase text-sm mb-4">
            Advanced Features
          </h2>
          <h3 className="text-4xl lg:text-5xl font-bold font-display text-slate-900 mb-6">
            Logistics Reimagined for the Modern World
          </h3>
          <p className="text-lg text-slate-600">
            KhatKhat combines artificial intelligence with community networks to create 
            the fastest delivery ecosystem in Goa.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -10 }}
              className="p-10 rounded-[2.5rem] bg-slate-50 border border-slate-100 hover:bg-white hover:shadow-2xl hover:shadow-blue-100 transition-all group"
            >
              <div className={`${feature.color} w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-8 group-hover:scale-110 transition-transform`}>
                {feature.icon}
              </div>
              <h4 className="text-2xl font-bold font-display text-slate-900 mb-4">{feature.title}</h4>
              <p className="text-slate-600 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
