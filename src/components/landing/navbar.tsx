"use client";

import { motion } from "motion/react";
import Link from "next/link";
import Image from "next/image";

export function LandingNavbar() {
  return (
    <motion.header
      className="sticky top-0 z-50 bg-[#fdfaf3]/80 backdrop-blur-md border-b border-[#e3d4aa]"
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logos/logo.png"
            alt="Blessing"
            width={44}
            height={44}
            className="rounded-lg"
          />
          <span className="font-bold text-lg tracking-tight">Blessing</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#746641]">
          <Link
            href="#features"
            className="hover:text-[#1a1408] transition-colors"
          >
            Features
          </Link>
          <Link
            href="#how-it-works"
            className="hover:text-[#1a1408] transition-colors"
          >
            How it works
          </Link>
          <Link
            href="#newsletter"
            className="hover:text-[#1a1408] transition-colors"
          >
            Newsletter
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-medium text-[#1a1408] hover:text-[#8B5A2B] transition-colors"
          >
            Log in
          </Link>
          <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
            <Link
              href="/signup"
              className="text-sm font-semibold bg-[#4A2010] text-[#fdfaf3] px-4 py-2 rounded-lg hover:bg-[#6B3A1F] transition-colors"
            >
              Get Started
            </Link>
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
}
