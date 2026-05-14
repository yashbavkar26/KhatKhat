"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Menu, X, ArrowRight, Box, Sun, Moon } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isDarkMode, toggleTheme } = useTheme();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Services", href: "#services" },
    { name: "How it Works", href: "#how-it-works" },
    { name: "Pricing", href: "#pricing" },
    { name: "Transportation", href: "#transportation" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "py-4" : "py-6"
      }`}
    >
      <div className="container mx-auto px-6">
        <div
          className={`flex items-center justify-between px-6 py-3 rounded-full transition-all duration-300 ${
            isScrolled 
              ? (isDarkMode ? "glass shadow-[0_0_20px_rgba(0,0,0,0.5)]" : "bg-white/80 backdrop-blur-md shadow-lg border border-slate-200") 
              : "bg-transparent"
          }`}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#FF5A00] rounded-sm flex items-center justify-center relative shadow-lg shadow-[#FF5A00]/20">
               <Box className="text-white w-5 h-5" />
            </div>
            <span className={`text-2xl font-bold tracking-tight font-display transition-colors ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              KhatKhat
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className={`hidden md:flex items-center gap-1 p-1 rounded-full border transition-colors ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-100/50 border-slate-200'}`}>
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`px-5 py-2 text-sm font-medium rounded-full transition-all ${isDarkMode ? 'text-gray-400 hover:text-[#FF5A00] hover:bg-white/5' : 'text-slate-500 hover:text-slate-900 hover:bg-white'}`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full transition-all border ${isDarkMode ? 'bg-white/5 border-white/10 text-yellow-400 hover:bg-white/10' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'}`}
              aria-label="Toggle theme"
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <div className="hidden md:block">
              <Link href="/admin_dashboard/admin.html">
                <motion.button 
                  whileHover={{ scale: 1.05, boxShadow: isDarkMode ? "0 0 20px rgba(255,90,0,0.4)" : "0 4px 15px rgba(255,90,0,0.3)" }}
                  whileTap={{ scale: 0.95 }}
                  className="bg-[#FF5A00] text-white px-6 py-2.5 rounded-full font-bold transition-all flex items-center gap-2 shadow-lg shadow-[#FF5A00]/20"
                >
                  Get Started
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </Link>
            </div>

            {/* Mobile Menu Toggle */}
            <button
              className={`md:hidden p-2 transition-colors ${isDarkMode ? 'text-white' : 'text-slate-900'}`}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`absolute top-24 left-6 right-6 rounded-3xl p-6 shadow-2xl md:hidden border transition-colors ${isDarkMode ? 'glass border-white/10' : 'bg-white border-slate-200'}`}
        >
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`text-lg font-medium transition-colors ${isDarkMode ? 'text-gray-300 hover:text-[#FF5A00]' : 'text-slate-600 hover:text-orange-600'}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <div className={`h-[1px] my-2 transition-colors ${isDarkMode ? 'bg-white/10' : 'bg-slate-100'}`} />
            <Link href="/admin_dashboard/admin.html" onClick={() => setIsMobileMenuOpen(false)}>
              <button className="w-full bg-[#FF5A00] text-white px-6 py-3 rounded-xl font-bold">
                Get Started
              </button>
            </Link>
          </div>
        </motion.div>
      )}
    </nav>
  );
};

export default Navbar;
