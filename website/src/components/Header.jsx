import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Header() {
  const appUrl = import.meta.env.VITE_APP_URL || 'http://localhost:3000';
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-brand-surface-container-lowest/90 backdrop-blur-md border-b border-brand-outline-variant/30 shadow-sm py-3' : 'bg-transparent py-5'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-primary to-blue-600 flex items-center justify-center text-brand-on-primary shadow-lg shadow-brand-primary/20">
            <span className="material-symbols-outlined text-[22px]">troubleshoot</span>
          </div>
          <span className="font-headline font-extrabold text-2xl tracking-tight text-brand-on-surface">Sitelyze</span>
        </Link>
        
        {isHomePage && (
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-brand-on-surface-variant hover:text-brand-primary text-sm font-medium transition-colors">Features</a>
            <a href="#benefits" className="text-brand-on-surface-variant hover:text-brand-primary text-sm font-medium transition-colors">Benefits</a>
          </nav>
        )}

        <div className="flex items-center gap-4">
          <a 
            href={appUrl} 
            className="text-brand-on-surface-variant hover:text-brand-primary font-medium text-sm transition-colors"
          >
            Log in
          </a>
          <a 
            href={appUrl} 
            className="bg-brand-on-surface hover:bg-brand-primary text-brand-surface-container-lowest px-5 py-2.5 rounded-full text-sm font-semibold transition-all shadow-md hover:shadow-lg"
          >
            Get Started
          </a>
        </div>
      </div>
    </header>
  );
}