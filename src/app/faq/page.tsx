'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';

export default function FAQPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqData = [
    {
      question: "How does MirrorNet™ ensure anonymity?",
      answer: "We use advanced encryption and privacy-by-design principles. Feedback is completely anonymous, and we never store identifying information with responses. Your feedback providers cannot be identified, and their responses are aggregated and anonymized before being shown to you."
    },
    {
      question: "What's the difference between Free and Premium?",
      answer: "All basic features are free forever, including Family, Friends, Work, and General circles. Premium users get exclusive Attraction Circle access, 3 Premium Tokens monthly, Family Goals, early access to new features, and a premium supporter badge to show their support for MirrorNet."
    },
    {
      question: "How do I invite people to my circles?",
      answer: "You can invite trusted friends, family, or colleagues who already have MirrorNet™ accounts. Use the search feature to find users by name or email, then send them circle invitations. They'll receive a notification and can choose to accept or decline your invitation."
    },
    {
      question: "Can I see who gave me specific feedback?",
      answer: "No, all feedback is completely anonymous by design. This ensures honest, unbiased responses. The only exception is the Attraction Circle (Premium), where raters can choose to reveal their identity if there's mutual interest."
    },
    {
      question: "How often should I ask for feedback?",
      answer: "We recommend requesting feedback every 2-3 months to track your growth over time. However, our re-rating system allows you to get updated feedback whenever you feel you've made significant changes or improvements."
    },
    {
      question: "What are Premium Tokens and how do they work?",
      answer: "Premium tokens are credits that allow you to unlock advanced features like rating anyone in the Attraction Circle and requesting identity reveals. Premium subscribers receive 3 tokens monthly, and you can use them for enhanced interactions and personalized experiences within MirrorNet."
    },
    {
      question: "Is my data safe and private?",
      answer: "Absolutely. We use enterprise-grade security measures, including end-to-end encryption and secure cloud infrastructure. We never sell your data, and you maintain full control over your information. You can export or delete your data at any time."
    },
    {
      question: "Can I delete my account and data?",
      answer: "Yes, you can delete your account at any time from the Settings page. This will permanently remove all your data, feedback, and account information. The action cannot be undone, so please consider exporting your data first if you want to keep any insights."
    },
    {
      question: "How do Family Goals work?",
      answer: "Family Goals (Premium feature) allow you to suggest relationship improvement activities to family members. Premium users can create goals like 'Daily Check-ins' or 'Weekly Date Nights,' invite family members to participate, and track progress together with helpful tips and guidance."
    },
    {
      question: "What happens if someone gives inappropriate feedback?",
      answer: "We have strict community guidelines and automated detection systems for inappropriate content. You can report concerning feedback, and we'll investigate immediately. Verified violations result in account suspension or permanent bans."
    },
    {
      question: "Can I cancel my Premium subscription anytime?",
      answer: "Yes, you can cancel your Premium subscription at any time from your account settings. You'll continue to have access to Premium features until the end of your current billing period, after which your account will revert to the free tier."
    },
    {
      question: "How does the Eco Rating work?",
      answer: "The Eco Rating is a self-assessment tool that helps you evaluate and track your environmental consciousness across 5 key areas: energy consumption, waste management, transportation choices, consumption habits, and water usage. It's completely free and helps promote environmental awareness."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navigation */}
      <nav className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center space-x-3">
              <img src="/mirrornet-logo.png" alt="MirrorNet Logo" className="h-8 w-8" />
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
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-purple-500/10 rounded-full p-4">
              <HelpCircle className="h-12 w-12 text-purple-500" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Frequently Asked 
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"> Questions</span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Get answers to common questions about MirrorNet™ and how to make the most of your personal growth journey.
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqData.map((faq, index) => (
            <div key={index} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                className="w-full px-6 py-6 text-left flex items-center justify-between hover:bg-gray-700/50 transition-colors"
              >
                <span className="text-lg font-semibold text-white pr-4">{faq.question}</span>
                {openFaq === index ? (
                  <ChevronUp className="h-6 w-6 text-purple-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="h-6 w-6 text-gray-400 flex-shrink-0" />
                )}
              </button>
              {openFaq === index && (
                <div className="px-6 pb-6 border-t border-gray-700 bg-gray-800/50">
                  <div className="pt-6">
                    <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact Section */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 rounded-xl p-8 border border-gray-700">
            <h2 className="text-2xl font-bold text-white mb-4">Still have questions?</h2>
            <p className="text-gray-300 mb-6">
              Can't find the answer you're looking for? We're here to help.
            </p>
            <a
              href="mailto:deliriumstudio@mirrornet.net"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all transform hover:scale-105"
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

