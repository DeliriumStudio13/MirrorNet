'use client';

import Link from 'next/link';
import { Frame, ArrowLeft } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navigation */}
      <nav className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3">
              <Frame className="h-8 w-8 text-purple-500" />
              <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                MirrorNet™
              </span>
            </Link>
            <Link 
              href="/" 
              className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
          <h1 className="text-3xl font-bold text-white mb-8">Terms of Service</h1>
          <p className="text-gray-300 mb-8">
            <strong>Effective Date:</strong> January 1, 2025
          </p>

          <div className="space-y-8 text-gray-300">
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
              <p>
                By accessing and using MirrorNet™ ("the Service"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">2. Description of Service</h2>
              <p>
                MirrorNet™ is a personal growth platform that facilitates anonymous feedback collection from trusted circles. The Service allows users to create feedback circles, invite participants, and receive structured feedback for personal development purposes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">3. User Accounts</h2>
              <p>
                To access certain features of the Service, you must register for an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">4. Privacy and Data Protection</h2>
              <p>
                We are committed to protecting your privacy. Our Privacy Policy explains how we collect, use, and protect your information when you use our Service. By using the Service, you agree to the collection and use of information in accordance with our Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">5. User Conduct</h2>
              <p>You agree not to use the Service to:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 ml-4">
                <li>Provide false, misleading, or harmful feedback</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Attempt to gain unauthorized access to the Service</li>
                <li>Use the Service for any commercial purpose without permission</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">6. Premium Services</h2>
              <p>
                Certain features of the Service are available through paid subscriptions ("Premium Services"). Premium subscriptions are billed in advance on a monthly basis and are non-refundable except as required by law.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">7. Cancellation and Termination</h2>
              <p>
                You may cancel your Premium subscription at any time through your account settings. We reserve the right to terminate or suspend your account for violations of these Terms of Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">8. Intellectual Property</h2>
              <p>
                The Service and its original content, features, and functionality are owned by MirrorNet™ and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">9. Disclaimer of Warranties</h2>
              <p>
                The Service is provided on an "AS IS" and "AS AVAILABLE" basis. We make no warranties, expressed or implied, and hereby disclaim all other warranties including implied warranties of merchantability, fitness for a particular purpose, or non-infringement.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">10. Limitation of Liability</h2>
              <p>
                In no event shall MirrorNet™ be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">11. Changes to Terms</h2>
              <p>
                We reserve the right to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days notice prior to any new terms taking effect.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-white mb-4">12. Contact Information</h2>
              <p>
                If you have any questions about these Terms of Service, please contact us at:
                <br />
                <a href="mailto:deliriumstudio@mirrornet.net" className="text-purple-400 hover:text-purple-300">
                  deliriumstudio@mirrornet.net
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
