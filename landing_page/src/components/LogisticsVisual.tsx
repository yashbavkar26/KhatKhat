"use client";

import React from "react";
import { motion } from "framer-motion";

const LogisticsVisual = () => {
  return (
    <div className="w-full h-[600px] relative overflow-hidden flex items-center justify-center">
      {/* 1. LAYERED TRACK SYSTEM (Moving LEFT -> RIGHT) */}
      <div className="absolute inset-0 flex items-center justify-center z-0">
        <svg width="100%" height="200" viewBox="0 0 800 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full opacity-80">
          {/* Main Magnetic Track Base */}
          <path d="M-100 100H900" stroke="#111" strokeWidth="80" strokeLinecap="round" />
          
          {/* Glowing Rails */}
          <path d="M-100 70H900" stroke="#FF5A00" strokeWidth="1.5" className="opacity-20 blur-[1px]" />
          <path d="M-100 130H900" stroke="#FF5A00" strokeWidth="1.5" className="opacity-20 blur-[1px]" />
          
          {/* Animated Track Markers (LEFT -> RIGHT) */}
          <path 
            d="M-100 100H900" 
            stroke="#FF5A00" 
            strokeWidth="3" 
            strokeLinecap="round"
            strokeDasharray="20 100"
            className="opacity-40"
          >
            <animate attributeName="stroke-dashoffset" from="0" to="-600" dur="2s" repeatCount="indefinite" />
          </path>

          {/* Rapid Pulse Lines */}
          <path 
            d="M-100 100H900" 
            stroke="#FF5A00" 
            strokeWidth="1" 
            strokeDasharray="1 300"
            className="opacity-60"
          >
            <animate attributeName="stroke-dashoffset" from="0" to="-1200" dur="1s" repeatCount="indefinite" />
          </path>
        </svg>
      </div>

      {/* 2. ATMOSPHERIC LIGHT STREAKS (Moving LEFT -> RIGHT) */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ x: -200, y: 150 + (i * 40), opacity: 0 }}
            animate={{ 
              x: 1000, 
              opacity: [0, 0.3, 0] 
            }}
            transition={{ 
              duration: 0.5 + Math.random() * 0.5, 
              repeat: Infinity, 
              ease: "linear",
              delay: i * 0.3 
            }}
            className="absolute h-[1px] w-48 bg-gradient-to-r from-transparent via-[#FF5A00] to-transparent blur-sm"
          />
        ))}
      </div>

      {/* 3. THE FUTURISTIC VEHICLE (Moving RIGHT -> LEFT) */}
      <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
        <motion.div
          animate={{ 
            x: [100, -100], // Continuous horizontal travel (Right -> Left)
            y: [0, -4, 0], // Suspension bounce
          }}
          transition={{ 
            x: { duration: 12, repeat: Infinity, ease: "linear" },
            y: { duration: 0.4, repeat: Infinity, ease: "easeInOut" }
          }}
          className="relative group"
        >
          {/* SVG Vehicle Model */}
          <svg width="400" height="120" viewBox="0 0 400 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_0_30px_rgba(255,90,0,0.3)]">
            {/* Main Body Chassis */}
            <path d="M40 70C40 64.4772 44.4772 60 50 60H350C355.523 60 360 64.4772 360 70V100C360 105.523 355.523 110 350 110H50C44.4772 110 40 105.523 40 100V70Z" fill="#0A0A0A" stroke="#FF5A00" strokeWidth="0.5" />
            
            {/* Cargo Compartments */}
            <rect x="50" y="30" width="80" height="70" rx="4" fill="#0F0F0F" stroke="#333" strokeWidth="1" />
            <rect x="140" y="30" width="80" height="70" rx="4" fill="#0F0F0F" stroke="#333" strokeWidth="1" />
            <rect x="230" y="30" width="80" height="70" rx="4" fill="#0F0F0F" stroke="#333" strokeWidth="1" />
            
            {/* Cabin / Front End (Facing Left) */}
            <path d="M50 30H100V100H50C44.4772 100 40 95.5228 40 90V40C40 34.4772 44.4772 30 50 30Z" fill="#050505" stroke="#FF5A00" strokeWidth="0.5" />
            <rect x="42" y="40" width="10" height="30" rx="2" fill="#FF5A00" fillOpacity="0.1" stroke="#FF5A00" strokeWidth="0.5" />
            
            {/* Neon Glow Accents */}
            <rect x="60" y="95" width="280" height="2" fill="#FF5A00" className="animate-pulse" />
            <circle cx="350" cy="85" r="3" fill="#FF5A00" className="animate-pulse" />
            <circle cx="340" cy="85" r="3" fill="#FF5A00" className="animate-pulse" />

            {/* Hubs / Wheels with motion effect */}
            <circle cx="80" cy="110" r="12" fill="#000" stroke="#333" />
            <circle cx="80" cy="110" r="4" fill="#FF5A00" />
            <circle cx="180" cy="110" r="12" fill="#000" stroke="#333" />
            <circle cx="180" cy="110" r="4" fill="#FF5A00" />
            <circle cx="280" cy="110" r="12" fill="#000" stroke="#333" />
            <circle cx="280" cy="110" r="4" fill="#FF5A00" />

            {/* Side Panel HUD Text (SVG) */}
            <text x="150" y="50" fill="#FF5A00" fontSize="10" fontWeight="bold" opacity="0.6" style={{ fontFamily: 'monospace' }}>KHATKHAT_v4</text>
            <text x="150" y="65" fill="#FFF" fontSize="8" fontWeight="bold" opacity="0.4" style={{ fontFamily: 'monospace' }}>NEURAL_RELAY_LINK</text>
          </svg>

          {/* Particle Trail */}
          <div className="absolute top-[100px] left-[350px] flex gap-2">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                animate={{ 
                  x: [0, 100], 
                  y: [0, -20],
                  opacity: [0.8, 0],
                  scale: [1, 0.5]
                }}
                transition={{ 
                  duration: 1, 
                  repeat: Infinity, 
                  delay: i * 0.2,
                  ease: "easeOut"
                }}
                className="w-1 h-1 bg-[#FF5A00] rounded-full blur-[1px]"
              />
            ))}
          </div>
        </motion.div>
      </div>

      {/* 4. OVERLAY VIGNETTE (Static) */}
      <div className="absolute inset-0 pointer-events-none z-30 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.6)_100%)]" />
      
      {/* HUD ELEMENTS (Minimal) */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-40 flex items-center gap-6 pointer-events-none">
        <div className="flex flex-col items-center">
          <div className="text-[10px] font-bold text-[#FF5A00] uppercase tracking-widest mb-1 opacity-60">Status</div>
          <div className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
            Optimized
          </div>
        </div>
        <div className="h-10 w-[1px] bg-white/10" />
        <div className="flex flex-col items-center">
          <div className="text-[10px] font-bold text-[#FF5A00] uppercase tracking-widest mb-1 opacity-60">Velocity</div>
          <div className="text-xs font-bold text-white uppercase tracking-widest">184.2 km/h</div>
        </div>
      </div>
    </div>
  );
};

export default LogisticsVisual;
