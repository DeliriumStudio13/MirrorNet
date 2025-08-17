'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuthContext } from '@/contexts/auth-context';
import { standardCircles, getTraitsForCircle, getTraitsByIds } from '@/lib/traits-library';
import { STANDARD_CIRCLES } from '@/lib/circle-utils';
import { Lock, Heart, Leaf } from 'lucide-react';
import type { CircleStats } from '@/types';

interface RatingCardProps {
  circleId: string;
  stats: CircleStats;
  isPremium: boolean;
}

export function RatingCard({ circleId, stats, isPremium }: RatingCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [memberCount, setMemberCount] = useState<number | null>(null);
  const { user } = useAuthContext();

  useEffect(() => {
    // For all standard circles, use the count from stats which includes real-time updates
    if (!user?.uid || circleId === 'eco' || circleId === 'attraction') {
      setMemberCount(null);
      return;
    }

    if (STANDARD_CIRCLES.includes(circleId as any)) {
      // Always use stats.count which is calculated consistently (other members + 1 for owner)
      setMemberCount(stats.count || 1);
    } else {
      setMemberCount(null);
    }
  }, [circleId, user?.uid, stats.count]);

  // Get circle data
  const circle = standardCircles[circleId as keyof typeof standardCircles];
  
  // Check if user has custom traits for this circle
  const [traits, setTraits] = useState(getTraitsForCircle(circleId));
  
  useEffect(() => {
    async function loadCustomTraits() {
      if (!user?.uid || !['friends', 'work', 'general'].includes(circleId)) {
        setTraits(getTraitsForCircle(circleId));
        return;
      }
      
      const userTraitsDoc = await getDoc(doc(db, 'userCircleTraits', `${user.uid}_${circleId}`));
      if (userTraitsDoc.exists()) {
        const userTraitsData = userTraitsDoc.data();
        setTraits(getTraitsByIds(userTraitsData.traits));
      } else {
        setTraits(getTraitsForCircle(circleId));
      }
    }
    
    loadCustomTraits();
  }, [user?.uid, circleId]);

  if (!circle) return null;

  const isLocked = circle.isPremiumOnly && !isPremium;
  const avgScore = stats.avgScore || 0;
  const isAttractionForStandard = circleId === 'attraction' && !isPremium;
  


  return (
    <div
      className="relative flex flex-col bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-xl transition-all duration-300 hover:shadow-2xl hover:border-purple-400/50 hover:scale-[1.02]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Updated design v2.1 - Cache bust */}
      {/* Header */}
      <div className="p-5 flex items-center justify-between">
        <div className="flex flex-col">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">{circle.icon}</span>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-semibold text-white">{circle.name}</h3>
              {circle.isBeta && (
                <span className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  BETA
                </span>
              )}
            </div>
          </div>
          {STANDARD_CIRCLES.includes(circleId as any) && memberCount !== null && (
            <p className="text-sm text-gray-400 mt-1 ml-10">
              {memberCount} {memberCount === 1 ? 'member' : 'members'}
            </p>
          )}
        </div>
        <div 
          className={`rounded-full h-12 w-12 flex items-center justify-center shadow-lg transition-all duration-300 ${
            isAttractionForStandard
              ? 'bg-gray-700 text-gray-300'
              : avgScore === 0 
                ? 'bg-gray-700 text-gray-300'
                : avgScore < 4
                  ? 'bg-gradient-to-br from-red-500 to-red-600 text-white'
                  : avgScore < 7
                    ? 'bg-gradient-to-br from-yellow-500 to-yellow-600 text-white'
                    : 'bg-gradient-to-br from-green-500 to-green-600 text-white'
          } ${isAttractionForStandard ? 'blur-sm' : ''}`}
        >
          <span className="font-bold text-lg drop-shadow-md">
            {isAttractionForStandard ? '?' : avgScore.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Traits */}
      <div className={`px-5 pb-5 space-y-4 flex-grow ${isAttractionForStandard ? 'blur-sm' : ''}`}>
        {traits.map(trait => {
          const traitStats = stats.traits[trait.id] || { avg: 0 };
          const displayValue = isAttractionForStandard ? 0 : traitStats.avg;
          return (
            <div key={trait.id}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-400">{trait.name}</span>
                <span className={`font-medium ${
                  isAttractionForStandard || displayValue === 0
                    ? 'text-gray-300'
                    : displayValue < 4
                      ? 'text-red-400'
                      : displayValue < 7
                        ? 'text-yellow-400'
                        : 'text-green-400'
                }`}>{isAttractionForStandard ? '?' : displayValue.toFixed(1)}</span>
              </div>
              <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isAttractionForStandard || displayValue === 0
                      ? 'bg-gray-700'
                      : displayValue < 4
                        ? 'bg-gradient-to-r from-red-600 to-red-400'
                        : displayValue < 7
                          ? 'bg-gradient-to-r from-yellow-600 to-yellow-400'
                          : 'bg-gradient-to-r from-green-600 to-green-400'
                  }`}
                  style={{ width: `${isAttractionForStandard ? 0 : (displayValue / 10) * 100}%` }}
                >
                  <div className="w-full h-full bg-[rgba(255,255,255,0.1)]" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="border-t border-gray-700">
        {circleId === 'attraction' && !isPremium ? (
          <Link
            href="/dashboard/attraction"
            className="block w-full bg-gray-800/50 p-6 text-center flex flex-col items-center justify-center hover:bg-gray-700 transition-all duration-200 group"
          >
            <div className="bg-pink-500/10 rounded-full p-3 mb-3 w-14 h-14 flex items-center justify-center mx-auto group-hover:bg-pink-500/20 transition-colors">
              <Heart className="h-7 w-7 text-pink-400 drop-shadow-lg" />
            </div>
            <h3 className="text-base font-semibold text-white mb-1">View Attraction</h3>
            <p className="text-xs text-gray-400">See your rating count & rate others</p>
          </Link>
        ) : circleId === 'eco' ? (
          <Link
            href="/dashboard/eco-assessment"
            className="block w-full bg-gray-800/50 p-6 text-center flex flex-col items-center justify-center hover:bg-gray-700 transition-all duration-200 group"
          >
            <div className="bg-green-500/10 rounded-full p-3 mb-3 w-14 h-14 flex items-center justify-center mx-auto group-hover:bg-green-500/20 transition-colors">
              <Leaf className="h-7 w-7 text-green-400 drop-shadow-lg" />
            </div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base font-semibold text-white">Take Assessment</h3>
              <span className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                BETA
              </span>
            </div>
            <p className="text-xs text-gray-400">Self-assessment questionnaire</p>
          </Link>
        ) : circleId === 'family' ? (
          <div className="grid grid-cols-2">
            <Link
              href={`/dashboard/circle/${circleId}`}
              className="bg-gray-800/50 py-6 text-center hover:bg-gray-700 transition-all duration-200 font-medium border-r border-gray-700 flex items-center justify-center"
            >
              <span className="text-green-400 hover:text-green-300 transition-colors">Details</span>
            </Link>
            <Link
              href="/dashboard/family-assessment"
              className="bg-gray-800/50 p-4 text-center flex flex-col items-center justify-center hover:bg-gray-700 transition-all duration-200 group"
            >
              <div className="bg-red-500/10 rounded-full p-2 mb-2 w-10 h-10 flex items-center justify-center mx-auto group-hover:bg-red-500/20 transition-colors">
                <Heart className="h-5 w-5 text-red-400 drop-shadow-lg" />
              </div>
              <h3 className="text-sm font-semibold text-white mb-1">Take Assessment</h3>
              <p className="text-xs text-gray-400">Self-assessment only</p>
            </Link>
          </div>
        ) : circleId === 'attraction' && isPremium ? (
          <div className="grid grid-cols-2">
            <Link
              href="/dashboard/rate/attraction"
              className="bg-gray-800/50 py-6 text-center hover:bg-gray-700 transition-all duration-200 font-medium border-r border-gray-700 flex items-center justify-center"
            >
              <span className="text-pink-400 hover:text-pink-300 transition-colors">Rate</span>
            </Link>
            <Link
              href="/dashboard/attraction"
              className="bg-gray-800/50 py-6 text-center hover:bg-gray-700 transition-all duration-200 font-medium flex items-center justify-center"
            >
              <span className="text-pink-400 hover:text-pink-300 transition-colors">View Ratings</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2">
            <Link
              href={`/dashboard/rate/${circleId}`}
              className="bg-gray-800/50 py-6 text-center hover:bg-gray-700 transition-all duration-200 font-medium border-r border-gray-700 flex items-center justify-center"
            >
              <span className="text-blue-400 hover:text-blue-300 transition-colors">Rate</span>
            </Link>
            <Link
              href={`/dashboard/circle/${circleId}`}
              className="bg-gray-800/50 py-6 text-center hover:bg-gray-700 transition-all duration-200 font-medium flex items-center justify-center"
            >
              <span className="text-gray-300 hover:text-white transition-colors">Details</span>
            </Link>
          </div>
        )}
      </div>

      {/* Premium Upgrade Button - Different logic for different circles */}
      {!isPremium && (
        <>
          {/* Standard circles: Upgrade to Modify Traits */}
          {!isLocked && !['eco', 'family'].includes(circleId) && (
            <Link
              href="/dashboard/premium"
              className="block w-full bg-gradient-to-r from-purple-600/10 to-pink-600/10 hover:from-purple-600/20 hover:to-pink-600/20 py-4 text-center border-t border-gray-700 transition-all duration-200 group"
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-purple-400 group-hover:text-purple-300 font-medium">
                  ✨ Upgrade to Modify Traits
                </span>
              </div>
            </Link>
          )}
          
          {/* Family circle: Upgrade to Suggest Goals */}
          {circleId === 'family' && (
            <Link
              href="/dashboard/premium"
              className="block w-full bg-gradient-to-r from-red-600/10 to-pink-600/10 hover:from-red-600/20 hover:to-pink-600/20 py-4 text-center border-t border-gray-700 transition-all duration-200 group"
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-red-400 group-hover:text-red-300 font-medium">
                  🎯 Upgrade to Suggest Goals
                </span>
              </div>
            </Link>
          )}
          
          {/* Attraction circle: Upgrade to Access */}
          {isLocked && (
            <Link
              href="/dashboard/premium"
              className="block w-full bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/30 hover:to-pink-600/30 py-4 text-center border-t border-gray-700 transition-all duration-200 group"
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-purple-400 group-hover:text-purple-300 font-medium">
                  🔒 Upgrade to Access
                </span>
              </div>
            </Link>
          )}
          
          {/* Eco circle: No premium upgrade needed (self-assessment only) */}
        </>
      )}
      
      {/* Premium users can modify traits for standard circles */}
      {isPremium && ['friends', 'work', 'general'].includes(circleId) && (
        <Link
          href={`/dashboard/circle/${circleId}/modify-traits`}
          className="block w-full bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/30 hover:to-pink-600/30 py-4 text-center border-t border-gray-700 transition-all duration-200 group"
        >
          <div className="flex items-center justify-center gap-2">
            <span className="text-purple-400 group-hover:text-purple-300 font-medium">
              ✨ Modify Traits (1 Token)
            </span>
          </div>
        </Link>
      )}
    </div>
  );
}