import React, { useEffect } from "react";

export default function TermsOfService() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className="flex-grow pt-32 pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="font-headline text-4xl md:text-5xl font-extrabold text-brand-on-surface mb-4">
            Terms of Service
          </h1>
          <p className="text-brand-on-surface-variant text-lg">
            Last updated: May 2026
          </p>
        </div>

        <div className="prose prose-lg prose-slate dark:prose-invert max-w-none text-brand-on-surface-variant">
          <p>
            By accessing or using the Sitelyze platform, you agree to be bound
            by these Terms of Service. If you disagree with any part of the
            terms, then you may not access the service.
          </p>

          <h2 className="text-2xl font-bold text-brand-on-surface mt-10 mb-4">
            1. Use of Service
          </h2>
          <p>
            You may use our platform only for lawful purposes and in accordance
            with these Terms. You agree not to use the platform:
          </p>
          <ul className="list-disc pl-6 space-y-2 mb-6">
            <li>
              In any way that violates any applicable federal, state, local, or
              international law or regulation.
            </li>
            <li>
              For the purpose of exploiting, harming, or attempting to exploit
              or harm minors in any way.
            </li>
            <li>
              To transmit, or procure the sending of, any advertising or
              promotional material without our prior written consent.
            </li>
            <li>
              To impersonate or attempt to impersonate Sitelyze, a Sitelyze
              employee, another user, or any other person or entity.
            </li>
          </ul>

          <h2 className="text-2xl font-bold text-brand-on-surface mt-10 mb-4">
            2. Monitoring and Auditing Restrictions
          </h2>
          <p>
            Our uptime and security auditing tools are designed for
            infrastructure you own or have explicit authorization to monitor.
            You agree not to:
          </p>
          <ul className="list-disc pl-6 space-y-2 mb-6">
            <li>
              Scan, test, or monitor third-party websites without permission.
            </li>
            <li>
              Utilize the service to launch denial-of-service (DoS) attacks or
              generate abusive traffic.
            </li>
          </ul>

          <h2 className="text-2xl font-bold text-brand-on-surface mt-10 mb-4">
            3. Termination
          </h2>
          <p>
            We may terminate or suspend your access immediately, without prior
            notice or liability, for any reason whatsoever, including without
            limitation if you breach the Terms. Upon termination, your right to
            use the platform will immediately cease.
          </p>

          <h2 className="text-2xl font-bold text-brand-on-surface mt-10 mb-4">
            4. Limitation of Liability
          </h2>
          <p>
            In no event shall Sitelyze, nor its directors, employees, partners,
            agents, suppliers, or affiliates, be liable for any indirect,
            incidental, special, consequential or punitive damages, including
            without limitation, loss of profits, data, use, goodwill, or other
            intangible losses, resulting from your access to or use of or
            inability to access or use the Service.
          </p>

          <h2 className="text-2xl font-bold text-brand-on-surface mt-10 mb-4">
            Contact
          </h2>
          <p>
            If you have any questions about these Terms, please contact us at{" "}
            <a
              href="mailto:legal@sitelyze.io"
              className="text-brand-primary hover:underline"
            >
              legal@sitelyze.io
            </a>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
