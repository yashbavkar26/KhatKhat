"use client";

import React from "react";
import { motion } from "framer-motion";

interface LogisticsVisualProps {
  isDarkMode?: boolean;
}

const LogisticsVisual = ({ isDarkMode = true }: LogisticsVisualProps) => {
  // EVENING / SUNSET THEME
  const sunsetSky = "bg-gradient-to-b from-[#FF5A00]/20 via-[#451205] to-[#050505]";
  const lightSky = "bg-gradient-to-b from-orange-100 via-white to-slate-50";
  
  const bgColor = isDarkMode ? sunsetSky : lightSky;
  const buildingColor = isDarkMode ? "#1A1A1A" : "#CBD5E1";
  const streetLightColor = isDarkMode ? "#333" : "#94A3B8";
  
  return (
    <div className={`w-full h-[600px] relative overflow-hidden transition-all duration-700 rounded-[4rem] border shadow-[0_0_80px_rgba(255,90,0,0.1)] ${bgColor} ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
      
      {/* 1. EVENING CLOUDS (Moving Background) */}
      <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={`cloud-${i}`}
            initial={{ x: -400, y: 50 + (i * 60) }}
            animate={{ x: 1000 }}
            transition={{ 
              duration: 40 + i * 10, 
              repeat: Infinity, 
              ease: "linear",
              delay: i * -15 
            }}
            className={`absolute w-96 h-32 blur-[60px] rounded-full ${isDarkMode ? 'bg-[#FF5A00]/15' : 'bg-orange-200/40'}`}
          />
        ))}
      </div>

      {/* 2. DISTANT SKYLINE (Sharp & Visible) */}
      <div className="absolute inset-0 z-5 opacity-40 pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={`skyline-${i}`}
            initial={{ x: -200 }}
            animate={{ x: 1200 }}
            transition={{ 
              duration: 50, 
              repeat: Infinity, 
              ease: "linear",
              delay: i * -8 
            }}
            className="absolute bottom-[45%] w-48 h-[400px]"
            style={{ 
              backgroundColor: isDarkMode ? "#0A0A0A" : "#E2E8F0",
              clipPath: 'polygon(0% 100%, 15% 40%, 30% 10%, 70% 10%, 85% 40%, 100% 100%)',
              left: `${i * 240}px`,
              filter: 'blur(2px)',
              borderTop: isDarkMode ? '1px solid rgba(255,90,0,0.1)' : '1px solid white'
            }}
          />
        ))}
      </div>

      {/* 3. HIGH-VISIBILITY APARTMENT BUILDINGS */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`apt-${i}`}
            initial={{ x: -400 }}
            animate={{ x: 1400 }}
            transition={{ 
              duration: 30, 
              repeat: Infinity, 
              ease: "linear",
              delay: i * -6 
            }}
            className={`absolute bottom-[24%] w-80 h-96 border-x border-t shadow-2xl ${isDarkMode ? 'border-white/10 opacity-90' : 'border-slate-300'}`}
            style={{ backgroundColor: buildingColor, left: `${i * 450}px` }}
          >
            {/* Structured Windows - Brighter in Evening */}
            <div className="grid grid-cols-6 gap-3 p-8">
              {[...Array(30)].map((_, j) => (
                <div 
                  key={j} 
                  className={`w-2 h-2 rounded-[1px] transition-all ${Math.random() > 0.4 ? (Math.random() > 0.8 ? 'bg-[#FF5A00] shadow-[0_0_8px_#FF5A00]' : 'bg-orange-300/40 shadow-[0_0_4px_orange]') : (isDarkMode ? 'bg-white/5' : 'bg-slate-400/20')}`} 
                />
              ))}
            </div>
            {/* Architectural details */}
            <div className="absolute top-4 left-0 w-full h-[1px] bg-white/10" />
            <div className="absolute bottom-0 right-4 w-12 h-full bg-black/10" />
          </motion.div>
        ))}
      </div>

      {/* 4. HIGH-VISIBILITY STREET LIGHTS (Cinematic Evening Glow) */}
      <div className="absolute inset-0 z-15 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={`light-${i}`}
            initial={{ x: -200 }}
            animate={{ x: 1200 }}
            transition={{ duration: 7, repeat: Infinity, ease: "linear", delay: i * -3 }}
            className={`absolute bottom-[10%] w-[6px] h-[360px] shadow-2xl ${isDarkMode ? 'bg-[#222]' : 'bg-slate-400'}`}
            style={{ left: `${i * 600}px` }}
          >
            {/* Curved Arm (Sharp) */}
            <svg width="120" height="50" viewBox="0 0 120 50" className="absolute top-0 right-0 overflow-visible">
              <path d="M6 0C6 0 6 30 70 30H120" stroke={isDarkMode ? "#333" : "#94A3B8"} strokeWidth="6" fill="none" strokeLinecap="round" />
              <circle cx="120" cy="30" r="10" fill="#FF5A00" className="blur-[4px] opacity-80" />
              <circle cx="120" cy="30" r="5" fill="white" className="shadow-[0_0_20px_#FF5A00]" />
              {/* Powerful Glow Cone */}
              <rect x="80" y="30" width="100" height="400" fill="url(#sunset-cone)" opacity="0.4" transform="rotate(5 120 30)" />
            </svg>
          </motion.div>
        ))}
        <defs>
          <linearGradient id="sunset-cone" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#FF5A00" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#FF5A00" stopOpacity="0" />
          </linearGradient>
        </defs>
      </div>

      {/* 5. ROAD (Evening Reflections) */}
      <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none translate-y-20">
        <svg width="100%" height="320" viewBox="0 0 800 320" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M-100 160H900" stroke={isDarkMode ? "#0F0F0F" : "#E2E8F0"} strokeWidth="200" strokeLinecap="round" />
          
          {/* Sunset Road Reflection */}
          <path d="M-100 160H900" stroke="#FF5A00" strokeWidth="202" strokeLinecap="round" className="opacity-15 blur-3xl" />
          
          <path d="M-100 260H900" stroke={isDarkMode ? "#1A1A1A" : "#CBD5E1"} strokeWidth="8" strokeLinecap="round" />
          
          {/* Animated Markers */}
          <path 
            d="M-100 160H900" 
            stroke="#FF5A00" 
            strokeWidth="4" 
            strokeLinecap="round"
            strokeDasharray="100 200"
            className="opacity-60 shadow-[0_0_15px_#FF5A00]"
          >
            <animate attributeName="stroke-dashoffset" from="0" to="-1200" dur="2s" repeatCount="indefinite" />
          </path>
        </svg>
      </div>

      {/* 6. THE TRUCK (Premium Off-White Metallic) */}
      <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none translate-y-14">
        <motion.div
          animate={{ x: [250, -250], y: [0, -4, 0] }}
          transition={{ x: { duration: 24, repeat: Infinity, ease: "linear" }, y: { duration: 0.35, repeat: Infinity, ease: "easeInOut" } }}
          className="relative scale-125 lg:scale-[1.5]"
        >
          <svg width="560" height="200" viewBox="0 0 560 200" fill="none" xmlns="http://www.w3.org/2000/svg">
             <defs>
               <linearGradient id="truck-grad-silver" x1="0%" y1="0%" x2="100%" y2="0%">
                 <stop offset="0%" stopColor="#F8FAFC" />
                 <stop offset="50%" stopColor="#E2E8F0" />
                 <stop offset="100%" stopColor="#F1F5F9" />
               </linearGradient>
               <filter id="neon-glow-evening" x="-25%" y="-25%" width="150%" height="150%">
                 <feGaussianBlur stdDeviation="6" result="blur" />
                 <feComposite in="SourceGraphic" in2="blur" operator="over" />
               </filter>
             </defs>

            <ellipse cx="120" cy="165" rx="50" ry="10" fill="black" fillOpacity="0.6" filter="blur(8px)" />
            <ellipse cx="300" cy="165" rx="50" ry="10" fill="black" fillOpacity="0.6" filter="blur(8px)" />
            <ellipse cx="480" cy="165" rx="50" ry="10" fill="black" fillOpacity="0.6" filter="blur(8px)" />

            {/* Chassis & Cabin (Both Silver Metallic) */}
            <path d="M80 70C80 60 85 55 95 55H500C510 55 515 60 515 70V150C515 158 510 160 500 160H95C85 160 80 158 80 150V70Z" fill="url(#truck-grad-silver)" stroke="#FF5A00" strokeWidth="0.5" />
            <path d="M80 25C80 18 88 15 95 15H200V150H95C85 150 80 145 80 135V25Z" fill="url(#truck-grad-silver)" stroke="#FF5A00" strokeWidth="0.5" />
            
            <rect x="200" y="25" width="310" height="125" rx="8" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" />
            
            <text x="240" y="95" fill="#FF5A00" fontSize="48" fontWeight="950" filter="url(#neon-glow-evening)">KhatKhat</text>
            <text x="240" y="120" fill="#64748B" fontSize="11" fontWeight="bold" opacity="0.6">NEXTGEN_GRID_OS</text>

            <path d="M85 25H140V95H85V25Z" fill="#000" fillOpacity="0.9" />
            
            <rect x="78" y="105" width="5" height="35" fill="#FFF" filter="url(#neon-glow-evening)" />
            <rect x="78" y="105" width="2" height="35" fill="#FF5A00" filter="url(#neon-glow-evening)" />

            <circle cx="120" cy="162" r="24" fill="#111" stroke="#333" strokeWidth="3" />
            <circle cx="120" cy="162" r="8" fill="#FF5A00" filter="url(#neon-glow-evening)" />
            
            <circle cx="300" cy="162" r="24" fill="#111" stroke="#333" strokeWidth="3" />
            <circle cx="300" cy="162" r="8" fill="#FF5A00" filter="url(#neon-glow-evening)" />
            
            <circle cx="480" cy="162" r="24" fill="#111" stroke="#333" strokeWidth="3" />
            <circle cx="480" cy="162" r="8" fill="#FF5A00" filter="url(#neon-glow-evening)" />

            <rect x="95" y="156" width="410" height="4" fill="#FF5A00" filter="url(#neon-glow-evening)" className="animate-pulse" />
          </svg>
        </motion.div>
      </div>

      {/* Atmospheric Overlays */}
      <div className={`absolute inset-0 pointer-events-none z-[60] ${isDarkMode ? 'bg-[radial-gradient(circle_at_center,transparent_30%,rgba(0,0,0,0.6)_100%)]' : 'bg-transparent'}`} />
    </div>
  );
};

export default LogisticsVisual;
