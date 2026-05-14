"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const CTA = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-6">
        <div className="relative bg-slate-900 rounded-[3rem] p-12 lg:p-20 overflow-hidden text-center">
          {/* Background pattern */}
          <div className="absolute inset-0 opacity-10 bg-grid invert" />
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-600 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-4xl lg:text-6xl font-bold font-display text-white mb-8">
              Ready to ship your first parcel?
            </h2>
            <p className="text-xl text-slate-400 mb-12">
              Join thousands of businesses and individuals who trust KhatKhat for their daily logistics needs.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-6 justify-center">
              <Link href="/admin_dashboard/admin.html" className="w-full sm:w-auto">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-10 py-5 rounded-full font-bold text-lg transition-all shadow-xl shadow-blue-900/20 flex items-center justify-center gap-2"
                >
                  Get Started Now
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </Link>
              <button className="w-full sm:w-auto bg-white/10 hover:bg-white/20 text-white px-10 py-5 rounded-full font-bold text-lg transition-all backdrop-blur-sm border border-white/10">
                Contact Sales
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
