"use client";

import React from "react";
import Link from "next/link";
import { Box, Twitter, Instagram, Linkedin, Github } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-black pt-20 pb-10 border-t border-white/5">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 lg:col-span-1">
            <Link href="/" className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-[#FF5A00] rounded-sm flex items-center justify-center relative shadow-[0_0_15px_rgba(255,90,0,0.5)]">
                 <Box className="text-white w-5 h-5" />
              </div>
              <span className="text-2xl font-bold tracking-tight text-white font-display">
                KhatKhat
              </span>
            </Link>
            <p className="text-gray-400 leading-relaxed mb-8">
              Revolutionizing hyperlocal logistics through AI-powered 
              community relay matching. Fast, safe, and reliable.
            </p>
            <div className="flex gap-4">
              {[Twitter, Instagram, Linkedin, Github].map((Icon, i) => (
                <a key={i} href="#" className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-gray-400 hover:text-[#FF5A00] hover:bg-white/10 transition-all border border-white/5">
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6 font-display uppercase tracking-widest text-xs">Company</h4>
            <ul className="space-y-4">
              {["About Us", "Careers", "Press", "Contact"].map((item) => (
                <li key={item}>
                  <Link href="#" className="text-gray-400 hover:text-[#FF5A00] transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6 font-display uppercase tracking-widest text-xs">Services</h4>
            <ul className="space-y-4">
              {["Personal Delivery", "Business Logistics", "Relay Network", "Express Delivery"].map((item) => (
                <li key={item}>
                  <Link href="#" className="text-gray-400 hover:text-[#FF5A00] transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold mb-6 font-display uppercase tracking-widest text-xs">Support</h4>
            <ul className="space-y-4">
              {["Help Center", "Safety Center", "Terms of Service", "Privacy Policy"].map((item) => (
                <li key={item}>
                  <Link href="#" className="text-gray-400 hover:text-[#FF5A00] transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-gray-500 text-sm">
            © 2026 KhatKhat Logistics Pvt Ltd. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="#" className="text-gray-500 hover:text-white text-sm transition-colors">
              Privacy
            </Link>
            <Link href="#" className="text-gray-500 hover:text-white text-sm transition-colors">
              Terms
            </Link>
            <Link href="#" className="text-gray-500 hover:text-white text-sm transition-colors">
              Cookies
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
