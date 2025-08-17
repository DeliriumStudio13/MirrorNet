'use client';

import { useState } from 'react';
import { useAuthContext } from '@/contexts/auth-context';
import { standardCircles, customCircleTemplates, traits } from '@/lib/traits-library';

export default function TraitsGuidePage() {
  const { user } = useAuthContext();
  const [expandedCircle, setExpandedCircle] = useState<string | null>(null);
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#121214]">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2 text-[#e1e1e6]">Traits & Circles Guide</h1>
          <p className="text-[#a1a1aa]">
            The official library of all standard and custom circles in MirrorNet™.
          </p>
        </div>

        {/* Standard Circles */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-[#e1e1e6]">Standard Circles</h2>
          <div className="space-y-4">
            {Object.entries(standardCircles).map(([id, circle]) => (
              <div
                key={id}
                className="bg-[#1a1b1e] rounded-xl border border-[#2a2b2e] overflow-hidden shadow-lg"
              >
                <button
                  onClick={() => setExpandedCircle(expandedCircle === id ? null : id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#2a2b2e] transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{circle.icon}</span>
                    <span className="text-xl font-semibold text-[#e1e1e6]">{circle.name}</span>
                  </div>
                  <svg
                    className={`w-6 h-6 transform transition-transform ${
                      expandedCircle === id ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {expandedCircle === id && (
                  <div className="px-6 py-4 border-t border-[#2a2b2e]">
                    {/* Default Traits */}
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold mb-4">Default Traits</h3>
                      <div className="grid gap-4">
                        {circle.defaultTraits.map((traitId) => {
                          const trait = traits[traitId];
                          if (!trait) return null;
                          return (
                            <div key={traitId} className="bg-[#2a2b2e] rounded-lg p-4">
                              <h4 className="font-medium text-[#3b82f6] mb-1">
                                {trait.name}
                              </h4>
                              <p className="text-sm text-[#a1a1aa]">
                                {trait.description}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Alternative Traits (Premium) */}
                    {circle.alternativeTraits && circle.alternativeTraits.length > 0 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center">
                          Alternative Traits
                          <span className="ml-2 px-2 py-1 text-xs bg-[#3b82f6] text-white rounded-full font-medium">
                            Premium
                          </span>
                        </h3>
                        <div className="grid gap-4">
                          {circle.alternativeTraits.map((traitId) => {
                            const trait = traits[traitId];
                            if (!trait) return null;
                            return (
                              <div key={traitId} className="bg-gray-750 rounded-lg p-4">
                                <h4 className="font-medium text-blue-400 mb-1">
                                  {trait.name}
                                </h4>
                                <p className="text-sm text-gray-400">
                                  {trait.description}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Custom Circle Templates */}
        <section>
          <div className="flex items-center space-x-3 mb-6">
            <h2 className="text-2xl font-bold text-[#e1e1e6]">Custom Circle Templates</h2>
            <span className="px-3 py-1 text-sm bg-orange-600 text-white rounded-full">
              Coming Soon
            </span>
          </div>
          
          {/* Coming Soon Message */}
          <div className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700/50 rounded-xl p-8 mb-6 text-center">
            <div className="w-16 h-16 bg-orange-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Custom Circles Coming Soon!</h3>
            <p className="text-gray-400 max-w-md mx-auto">
              We're working on bringing back custom circle creation for premium users. 
              Gaming clans, book clubs, gym buddies, and more specialized communities will be available soon.
            </p>
          </div>
          
          {/* Preview of Templates (Non-interactive) */}
          <div className="space-y-4 opacity-60">
            {customCircleTemplates.map((template) => (
              <div
                key={template.id}
                className="bg-gray-800/30 rounded-xl border border-gray-700/30 overflow-hidden"
              >
                <div className="px-6 py-4 flex items-center justify-between cursor-not-allowed">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl opacity-50">{template.icon}</span>
                    <div>
                      <span className="text-xl font-semibold text-gray-300">{template.name}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="px-2 py-1 text-xs bg-orange-600/20 text-orange-400 rounded">
                          Coming Soon
                        </span>
                      </div>
                    </div>
                  </div>
                  <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}