import React from 'react';
import { Link } from 'react-router-dom';
import { Vote } from 'lucide-react';
import { WalletConnect } from '../wallet/WalletConnect';

/**
 * ✅ MOBILE RESPONSIVE - Navbar optimized for all screen sizes
 */
export const Navbar = () => {
  return (
    <nav className="border-b-2 border-border bg-card shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          {/* Logo - Responsive sizing */}
          <Link 
            to="/" 
            className="flex items-center gap-1.5 sm:gap-2 font-head text-lg sm:text-xl md:text-2xl hover:opacity-80 transition-opacity"
          >
            <Vote size={24} className="sm:w-7 sm:h-7 md:w-8 md:h-8 flex-shrink-0" />
            <span className="hidden xs:inline">FHEVOTE</span>
            <span className="inline xs:hidden">FHEVOTE</span>
          </Link>
          
          {/* Wallet Connect - Mobile Optimized */}
          <WalletConnect />
        </div>
      </div>
    </nav>
  );
};