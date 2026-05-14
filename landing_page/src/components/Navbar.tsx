"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Menu, X, ArrowRight, Box } from "lucide-react";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
            isScrolled ? "glass shadow-[0_0_20px_rgba(0,0,0,0.5)]" : "bg-transparent"
          }`}
        >
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#FF5A00] rounded-sm flex items-center justify-center relative shadow-[0_0_15px_rgba(255,90,0,0.5)]">
               <Box className="text-white w-5 h-5" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white font-display">
              KhatKhat
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/10">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="px-5 py-2 text-sm font-medium text-gray-400 hover:text-[#FF5A00] rounded-full transition-all hover:bg-white/5"
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* CTA Button */}
          <div className="hidden md:block">
            <Link href="/admin_dashboard/admin.html">
              <motion.button 
                whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(255,90,0,0.4)" }}
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
            className="md:hidden p-2 text-white"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-24 left-6 right-6 glass rounded-3xl p-6 shadow-xl md:hidden border border-white/10"
        >
          <div className="flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-lg font-medium text-gray-300 hover:text-[#FF5A00]"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <Link href="/admin_dashboard/admin.html" onClick={() => setIsMobileMenuOpen(false)}>
              <button className="w-full bg-[#FF5A00] text-white px-6 py-3 rounded-xl font-bold mt-2">
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
