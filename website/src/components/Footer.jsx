import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="py-12 bg-brand-background border-t border-brand-outline-variant/20">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2 opacity-90">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-primary to-blue-600 flex items-center justify-center text-brand-on-primary">
            <span className="material-symbols-outlined text-[16px]">troubleshoot</span>
          </div>
          <span className="font-headline font-bold text-lg text-brand-on-surface">Sitelyze</span>
        </div>
        <div className="flex gap-6 text-sm font-medium text-brand-on-surface-variant">
          <Link to="/privacy" className="hover:text-brand-primary transition-colors">Privacy Policy</Link>
          <Link to="/terms" className="hover:text-brand-primary transition-colors">Terms of Service</Link>
          <Link to="/support" className="hover:text-brand-primary transition-colors">Support</Link>
        </div>
        <p className="text-sm text-brand-on-surface-variant/70 font-medium">
          &copy; {new Date().getFullYear()} Sitelyze. All rights reserved.
        </p>
      </div>
    </footer>
  );
}