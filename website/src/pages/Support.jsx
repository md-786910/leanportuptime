import React, { useEffect, useState } from 'react';

export default function Support() {
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <main className="flex-grow pt-32 pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="font-headline text-4xl md:text-5xl font-extrabold text-brand-on-surface mb-6">How can we help?</h1>
          <p className="text-brand-on-surface-variant text-lg max-w-2xl mx-auto">
            Whether you're experiencing technical issues, have questions about billing, or need help configuring a new integration, our Enterprise support team is ready to assist.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="bg-brand-surface-container-lowest border border-brand-outline-variant/30 rounded-3xl p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-brand-on-surface mb-6">Send a Message</h2>
            
            {submitted ? (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-6 text-center h-full flex flex-col items-center justify-center">
                <span className="material-symbols-outlined text-4xl text-emerald-500 mb-4">check_circle</span>
                <h3 className="font-bold text-lg mb-2">Message Sent Successfully</h3>
                <p className="text-sm">We've received your inquiry. A support specialist will get back to you within 24 hours.</p>
                <button 
                  onClick={() => setSubmitted(false)}
                  className="mt-6 text-emerald-600 font-semibold hover:underline text-sm"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-brand-on-surface mb-1">Name</label>
                  <input required type="text" className="w-full px-4 py-3 rounded-xl bg-brand-surface-container-low border border-brand-outline-variant/50 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all text-brand-on-surface" placeholder="Jane Doe" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-on-surface mb-1">Work Email</label>
                  <input required type="email" className="w-full px-4 py-3 rounded-xl bg-brand-surface-container-low border border-brand-outline-variant/50 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all text-brand-on-surface" placeholder="jane@company.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-on-surface mb-1">Issue Category</label>
                  <select className="w-full px-4 py-3 rounded-xl bg-brand-surface-container-low border border-brand-outline-variant/50 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all text-brand-on-surface">
                    <option>Technical Support</option>
                    <option>Billing & Account</option>
                    <option>Feature Request</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-on-surface mb-1">Message</label>
                  <textarea required rows="4" className="w-full px-4 py-3 rounded-xl bg-brand-surface-container-low border border-brand-outline-variant/50 focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary transition-all text-brand-on-surface resize-none" placeholder="Please describe your issue in detail..."></textarea>
                </div>
                <button type="submit" className="w-full bg-brand-primary hover:bg-brand-primary-container text-white font-bold py-3 px-4 rounded-xl transition-colors shadow-md">
                  Submit Request
                </button>
              </form>
            )}
          </div>

          {/* Contact Info & FAQs */}
          <div className="space-y-8">
            <div className="bg-brand-background border border-brand-outline-variant/30 rounded-3xl p-8">
              <h3 className="text-xl font-bold text-brand-on-surface mb-6">Direct Contact</h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-brand-surface-container-high flex items-center justify-center text-brand-primary flex-shrink-0">
                    <span className="material-symbols-outlined">mail</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-brand-on-surface">Email Support</h4>
                    <p className="text-sm text-brand-on-surface-variant mb-1">Available 24/7 for all plans.</p>
                    <a href="mailto:support@sitelyze.com" className="text-brand-primary font-medium hover:underline">support@sitelyze.com</a>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-brand-surface-container-high flex items-center justify-center text-brand-primary flex-shrink-0">
                    <span className="material-symbols-outlined">call</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-brand-on-surface">Phone Support</h4>
                    <p className="text-sm text-brand-on-surface-variant mb-1">Available Mon-Fri, 9AM-5PM EST for Enterprise users.</p>
                    <span className="font-medium text-brand-on-surface">+1 (800) 555-0198</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-brand-primary-container/10 border border-brand-primary/20 rounded-3xl p-8">
              <div className="flex items-center gap-3 mb-4 text-brand-primary">
                <span className="material-symbols-outlined">library_books</span>
                <h3 className="text-xl font-bold text-brand-on-surface">Documentation</h3>
              </div>
              <p className="text-brand-on-surface-variant text-sm mb-6 leading-relaxed">
                Looking for self-serve help? Our documentation covers everything from initial setup and connecting Google Search Console to configuring advanced webhook notifications.
              </p>
              <a href="#" className="inline-flex items-center gap-1 text-brand-primary font-bold hover:underline">
                View Documentation
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}