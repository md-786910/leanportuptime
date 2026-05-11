import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Support from './pages/Support';

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col font-body bg-brand-background text-brand-on-background selection:bg-brand-primary-container selection:text-brand-on-primary-container scroll-smooth">
        <Header />
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/support" element={<Support />} />
        </Routes>

        <Footer />
      </div>
    </Router>
  );
}

export default App;