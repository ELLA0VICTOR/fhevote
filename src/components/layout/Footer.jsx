import React from 'react';
import { Github, Twitter } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="border-t-2 border-border bg-card mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            Built with Zama FHEVM v0.9 • Confidential Voting DApp
          </p>
          <div className="flex gap-4">
            <a href="#" className="text-foreground hover:text-primary transition-colors">
              <Github size={20} />
            </a>
            <a href="#" className="text-foreground hover:text-primary transition-colors">
              <Twitter size={20} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};