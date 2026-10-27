'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, History, Link as ChainIcon, Info, Search, Menu, X, Terminal } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'SCANNER', href: '/', icon: Search },
    { name: 'HISTORY', href: '/history', icon: History },
    { name: 'BLOCKCHAIN', href: '/blockchain', icon: ChainIcon },
    { name: 'ABOUT // ARCH', href: '/about', icon: Info },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b-[3px] border-black bg-white shadow-[0px_4px_0px_0px_#000]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-18 items-center justify-between">
          {/* Brand Logo Stamp */}
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-11 h-11 bg-[#facc15] border-[3px] border-black flex items-center justify-center shadow-[3px_3px_0px_0px_#000] group-hover:translate-x-[-1px] group-hover:translate-y-[-1px] group-hover:shadow-[5px_5px_0px_0px_#000] transition-all">
                <Shield className="w-6 h-6 text-black fill-black" />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black tracking-tight text-black font-mono">
                    VYRA
                  </span>
                  <span className="px-1.5 py-0.5 bg-black text-white text-[10px] font-mono font-black uppercase">
                    CYBER.AI
                  </span>
                </div>
                <span className="text-[10px] uppercase tracking-wider text-black font-mono font-bold">
                  Phishing Defense Engine
                </span>
              </div>
            </Link>

            {/* Status Stamp */}
            <div className="hidden lg:flex items-center gap-2 ml-4 px-3 py-1 bg-[#ccff00] border-2 border-black font-mono text-xs font-black shadow-[2px_2px_0px_0px_#000]">
              <span className="w-2 h-2 bg-black animate-ping" />
              <span>NODE: SYNCED & ARMED</span>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center space-x-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`flex items-center gap-2 px-4 py-2 border-2 border-black font-mono text-xs font-black transition-all ${
                    isActive
                      ? 'bg-black text-white shadow-[3px_3px_0px_0px_#facc15] translate-x-[-1px] translate-y-[-1px]'
                      : 'bg-white text-black shadow-[3px_3px_0px_0px_#000] hover:bg-[#facc15] hover:translate-x-[-1px] hover:translate-y-[-1px]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#facc15]' : 'text-black'}`} />
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 border-2 border-black bg-[#facc15] text-black shadow-[3px_3px_0px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none font-bold"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t-[3px] border-black bg-[#f6f5f0] p-4 space-y-2 shadow-[0px_4px_0px_0px_#000]">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 border-2 border-black font-mono text-sm font-black ${
                  isActive
                    ? 'bg-black text-white shadow-[3px_3px_0px_0px_#facc15]'
                    : 'bg-white text-black shadow-[3px_3px_0px_0px_#000] hover:bg-[#facc15]'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#facc15]' : 'text-black'}`} />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
