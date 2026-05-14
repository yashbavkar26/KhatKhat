"use client";

import React from "react";
import Link from "next/link";
import { Box, Twitter, Instagram, Linkedin, Github } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

const Footer = () => {
  const { isDarkMode } = useTheme();

  return (
    <footer className={`pt-20 pb-10 transition-colors duration-500 border-t ${isDarkMode ? 'bg-[#050505] border-white/5' : 'bg-slate-50 border-slate-200'}`}>
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-[#FF5A00] rounded-sm flex items-center justify-center shadow-lg shadow-[#FF5A00]/20">
                <Box className="text-white w-5 h-5" />
              </div>
              <span className={`text-2xl font-bold tracking-tight font-display transition-colors ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                KhatKhat
              </span>
            </Link>
            <p className={`mb-8 transition-colors ${isDarkMode ? 'text-gray-400' : 'text-slate-500'}`}>
              Next-gen community-powered hyperlocal delivery platform 
              revolutionizing logistics across Goa.
            </p>
            <div className="flex items-center gap-4">
              {[Twitter, Instagram, Linkedin, Github].map((Icon, i) => (
                <Link 
                  key={i} 
                  href="#" 
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isDarkMode ? 'bg-white/5 text-gray-400 hover:bg-[#FF5A00] hover:text-white' : 'bg-white text-slate-400 border border-slate-200 hover:border-orange-500 hover:text-orange-500'}`}
                >
                  <Icon size={20} />
                </Link>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className={`text-lg font-bold font-display mb-6 transition-colors ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Platform</h4>
            <ul className="flex flex-col gap-4">
              {["How it Works", "Pricing", "API Reference", "Carrier App"].map((link) => (
                <li key={link}>
                  <Link href="#" className={`transition-colors ${isDarkMode ? 'text-gray-400 hover:text-[#FF5A00]' : 'text-slate-500 hover:text-orange-600'}`}>
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className={`text-lg font-bold font-display mb-6 transition-colors ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Company</h4>
            <ul className="flex flex-col gap-4">
              {["About Us", "Careers", "Blog", "Contact"].map((link) => (
                <li key={link}>
                  <Link href="#" className={`transition-colors ${isDarkMode ? 'text-gray-400 hover:text-[#FF5A00]' : 'text-slate-500 hover:text-orange-600'}`}>
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className={`text-lg font-bold font-display mb-6 transition-colors ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Support</h4>
            <ul className="flex flex-col gap-4">
              {["Help Center", "Safety Center", "Community Guidelines", "Terms of Service"].map((link) => (
                <li key={link}>
                  <Link href="#" className={`transition-colors ${isDarkMode ? 'text-gray-400 hover:text-[#FF5A00]' : 'text-slate-500 hover:text-orange-600'}`}>
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className={`pt-10 border-t flex flex-col md:flex-row items-center justify-between gap-6 transition-colors ${isDarkMode ? 'border-white/5 text-gray-500' : 'border-slate-200 text-slate-400'}`}>
          <p className="text-sm">
            © {new Date().getFullYear()} KhatKhat Logistics. All rights reserved.
          </p>
          <div className="flex items-center gap-8 text-sm">
            <Link href="#" className="hover:text-[#FF5A00] transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-[#FF5A00] transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-[#FF5A00] transition-colors">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
