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
            <span className="px-3 py-1 text-sm bg-blue-600 text-white rounded-full">
              Premium
            </span>
          </div>
          <div className="space-y-4">
            {customCircleTemplates.map((template) => (
              <div
                key={template.id}
                className="bg-[#1a1b1e] rounded-xl border border-[#2a2b2e] overflow-hidden shadow-lg"
              >
                <button
                  onClick={() => setExpandedTemplate(expandedTemplate === template.id ? null : template.id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#2a2b2e] transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{template.icon}</span>
                    <span className="text-xl font-semibold text-[#e1e1e6]">{template.name}</span>
                  </div>
                  <svg
                    className={`w-6 h-6 transform transition-transform ${
                      expandedTemplate === template.id ? 'rotate-180' : ''
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

                {expandedTemplate === template.id && (
                  <div className="px-6 py-4 border-t border-[#2a2b2e]">
                    <p className="text-[#a1a1aa] mb-4">{template.description}</p>
                    <div className="grid gap-4">
                      {template.traits.map((traitId) => {
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
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}