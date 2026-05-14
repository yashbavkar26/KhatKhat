"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const CTA = () => {
  return (
    <section id="pricing" className="py-24 bg-[#050505] overflow-hidden">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-[#111] to-black rounded-[3rem] p-12 lg:p-20 text-center relative overflow-hidden border border-white/5"
        >
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#FF5A00]/5 rounded-full blur-[100px] -z-0 translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[80px] -z-0 -translate-x-1/2 translate-y-1/2" />

          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-4xl lg:text-6xl font-bold font-display text-white mb-8">
              Ready to ship your <br />
              <span className="text-[#FF5A00]">first parcel?</span>
            </h2>
            <p className="text-xl text-gray-400 mb-10">
              Join thousands of businesses and individuals who trust KhatKhat 
              for their daily logistics needs.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
              <Link href="/admin_dashboard/admin.html" className="w-full sm:w-auto">
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-full sm:w-auto bg-[#FF5A00] text-white px-10 py-4 rounded-full font-bold text-lg transition-all shadow-xl shadow-[#FF5A00]/20 flex items-center justify-center gap-2"
                >
                  Get Started Now
                  <ArrowRight className="w-5 h-5" />
                </motion.button>
              </Link>
              <button className="w-full sm:w-auto glass hover:bg-white/5 text-white px-10 py-4 rounded-full font-bold text-lg transition-all flex items-center justify-center gap-2">
                Contact Sales
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTA;
