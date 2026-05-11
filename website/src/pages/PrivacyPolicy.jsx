import React, { useEffect } from "react";

export default function PrivacyPolicy() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <main className="flex-grow pt-32 pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="font-headline text-4xl md:text-5xl font-extrabold text-brand-on-surface mb-4">
            Privacy Policy
          </h1>
          <p className="text-brand-on-surface-variant text-lg">
            Last updated: May 2026
          </p>
        </div>

        <div className="prose prose-lg prose-slate dark:prose-invert max-w-none text-brand-on-surface-variant">
          <p>
            At Sitelyze, we take your privacy seriously. This Privacy Policy
            describes how your personal information is collected, used, and
            shared when you visit or use our platform.
          </p>

          <h2 className="text-2xl font-bold text-brand-on-surface mt-10 mb-4">
            Information We Collect
          </h2>
          <p>
            When you use Sitelyze, we collect certain information about your
            device, your interaction with the platform, and information
            necessary to process your requests. This includes:
          </p>
          <ul className="list-disc pl-6 space-y-2 mb-6">
            <li>
              <strong>Account Information:</strong> Name, email address, and
              encrypted passwords.
            </li>
            <li>
              <strong>Project Data:</strong> URLs, API keys for integrations
              (like Google Search Console), and configuration settings.
            </li>
            <li>
              <strong>Usage Data:</strong> Information about how you interact
              with our dashboard and services.
            </li>
          </ul>

          <h2 className="text-2xl font-bold text-brand-on-surface mt-10 mb-4">
            How We Use Your Information
          </h2>
          <p>
            We use the order information that we collect generally to fulfill
            any requests placed through the Site. Additionally, we use this
            information to:
          </p>
          <ul className="list-disc pl-6 space-y-2 mb-6">
            <li>
              Communicate with you regarding alerts, notifications, and platform
              updates.
            </li>
            <li>Screen our platform for potential risk and fraud.</li>
            <li>
              Provide you with information or advertising relating to our
              products or services (only if you have opted in).
            </li>
            <li>
              Improve and optimize our platform by assessing analytics and user
              behavior.
            </li>
          </ul>

          <h2 className="text-2xl font-bold text-brand-on-surface mt-10 mb-4">
            Data Security
          </h2>
          <p>
            We implement industry-standard security measures to protect your
            data. All sensitive data, including API keys and passwords, are
            encrypted at rest and in transit. However, no method of transmission
            over the Internet, or method of electronic storage, is 100% secure.
          </p>

          <h2 className="text-2xl font-bold text-brand-on-surface mt-10 mb-4">
            Contact Us
          </h2>
          <p>
            For more information about our privacy practices, if you have
            questions, or if you would like to make a complaint, please contact
            us by e-mail at{" "}
            <a
              href="mailto:privacy@sitelyze.io"
              className="text-brand-primary hover:underline"
            >
              privacy@sitelyze.io
            </a>
            .
          </p>
        </div>
      </div>
    </main>
  );
}
