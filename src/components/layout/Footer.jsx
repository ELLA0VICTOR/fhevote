import React from 'react';
import { Github, Twitter } from 'lucide-react';

/**
 * ✅ MOBILE RESPONSIVE - Footer optimized for mobile devices
 */
export const Footer = () => {
  return (
    <footer className="border-t-2 border-border bg-card mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-3 sm:gap-4">
          <p className="text-xs sm:text-sm text-muted-foreground text-center md:text-left">
            Built with Zama FHEVM v0.9 • Confidential Voting DApp
          </p>
          <div className="flex gap-4 sm:gap-6">
            <a 
              href="#" 
              className="text-foreground hover:text-primary transition-colors"
              aria-label="GitHub"
            >
              <Github size={18} className="sm:w-5 sm:h-5" />
            </a>
            <a 
              href="#" 
              className="text-foreground hover:text-primary transition-colors"
              aria-label="Twitter"
            >
              <Twitter size={18} className="sm:w-5 sm:h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};