import React from 'react';
import { Link } from 'react-router-dom';
import { Vote } from 'lucide-react';
import { WalletConnect } from '../wallet/WalletConnect';

export const Navbar = () => {
  return (
    <nav className="border-b-2 border-border bg-card shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center gap-2 font-head text-2xl hover:opacity-80 transition-opacity">
            <Vote size={32} />
            <span>FHEVOTE</span>
          </Link>
          
          <WalletConnect />
        </div>
      </div>
    </nav>
  );
};