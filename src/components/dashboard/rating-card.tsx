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
      className="relative flex flex-col bg-[#1a1b1e] rounded-xl border border-[#2a2b2e] overflow-hidden shadow-lg transition-all duration-300 hover:shadow-xl hover:border-blue-500/50"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="p-5 flex items-center justify-between">
        <div className="flex flex-col">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">{circle.icon}</span>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-semibold text-[#e1e1e6]">{circle.name}</h3>

            </div>
          </div>
          {STANDARD_CIRCLES.includes(circleId as any) && memberCount !== null && (
            <p className="text-sm text-[#a1a1aa] mt-1 ml-10">
              {memberCount} {memberCount === 1 ? 'member' : 'members'}
            </p>
          )}
        </div>
        <div 
          className={`rounded-full h-12 w-12 flex items-center justify-center shadow-lg transition-colors ${
            isAttractionForStandard
              ? 'bg-[#2a2b2e] text-[#e1e1e6]'
              : avgScore === 0 
                ? 'bg-[#2a2b2e] text-[#e1e1e6]'
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
                <span className="text-[#a1a1aa]">{trait.name}</span>
                <span className={`font-medium ${
                  isAttractionForStandard || displayValue === 0
                    ? 'text-[#e1e1e6]'
                    : displayValue < 4
                      ? 'text-red-400'
                      : displayValue < 7
                        ? 'text-yellow-400'
                        : 'text-green-400'
                }`}>{isAttractionForStandard ? '?' : displayValue.toFixed(1)}</span>
              </div>
              <div className="h-3 bg-[#2a2b2e] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isAttractionForStandard || displayValue === 0
                      ? 'bg-[#2a2b2e]'
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
      <div className="grid grid-cols-2 border-t border-[#2a2b2e]">
        {circleId === 'attraction' && !isPremium ? (
          <Link
            href="/dashboard/attraction"
            className="col-span-2 bg-[#1a1b1e] p-5 text-center flex flex-col items-center justify-center hover:bg-[#2a2b2e] transition-colors group"
          >
            <div className="bg-pink-500/10 rounded-full p-3 mb-3 w-14 h-14 flex items-center justify-center mx-auto group-hover:bg-pink-500/20 transition-colors">
              <Heart className="h-7 w-7 text-pink-400 drop-shadow-lg" />
            </div>
            <h3 className="text-base font-semibold text-[#e1e1e6] mb-1">View Attraction</h3>
            <p className="text-xs text-gray-400">See your rating count & rate others</p>
          </Link>
        ) : circleId === 'eco' ? (
          <Link
            href="/dashboard/eco-assessment"
            className="col-span-2 bg-[#1a1b1e] p-5 text-center flex flex-col items-center justify-center hover:bg-[#2a2b2e] transition-colors group"
          >
            <div className="bg-green-500/10 rounded-full p-3 mb-3 w-14 h-14 flex items-center justify-center mx-auto group-hover:bg-green-500/20 transition-colors">
              <Leaf className="h-7 w-7 text-green-400 drop-shadow-lg" />
            </div>
            <h3 className="text-base font-semibold text-[#e1e1e6] mb-1">Take Assessment</h3>
            <p className="text-xs text-gray-400">Self-assessment questionnaire</p>
          </Link>
        ) : circleId === 'family' ? (
          <>
            <Link
              href={`/dashboard/circle/${circleId}`}
              className="bg-[#1a1b1e] py-4 text-center text-green-400 hover:text-green-300 transition-colors font-medium border-r border-[#2a2b2e]"
            >
              Details
            </Link>
            <Link
              href="/dashboard/family-assessment"
              className="bg-[#1a1b1e] p-3 text-center flex flex-col items-center justify-center hover:bg-[#2a2b2e] transition-colors group"
            >
              <div className="bg-red-500/10 rounded-full p-2 mb-2 w-10 h-10 flex items-center justify-center mx-auto group-hover:bg-red-500/20 transition-colors">
                <Heart className="h-5 w-5 text-red-400 drop-shadow-lg" />
              </div>
              <h3 className="text-sm font-semibold text-[#e1e1e6] mb-1">Take Assessment</h3>
              <p className="text-xs text-gray-400">Self-assessment only</p>
            </Link>
          </>
        ) : circleId === 'attraction' && isPremium ? (
          <>
            <Link
              href="/dashboard/rate/attraction"
              className="bg-[#1a1b1e] py-4 text-center text-pink-400 hover:text-pink-300 transition-colors font-medium border-r border-[#2a2b2e]"
            >
              Rate
            </Link>
            <Link
              href="/dashboard/attraction"
              className="bg-[#1a1b1e] py-4 text-center text-pink-400 hover:text-pink-300 transition-colors font-medium"
            >
              View Ratings
            </Link>
          </>

        ) : (
          <>
            <Link
              href={`/dashboard/rate/${circleId}`}
              className="bg-[#1a1b1e] py-4 text-center text-blue-400 hover:text-blue-300 transition-colors font-medium border-r border-[#2a2b2e]"
            >
              Rate
            </Link>
            <Link
              href={`/dashboard/circle/${circleId}`}
              className="bg-[#1a1b1e] py-4 text-center text-[#a1a1aa] hover:text-[#e1e1e6] transition-colors font-medium"
            >
              Details
            </Link>
          </>
        )}
      </div>

      {/* Premium Upgrade Button - Different logic for different circles */}
      {!isPremium && (
        <>
          {/* Standard circles: Upgrade to Modify Traits */}
          {!isLocked && !['eco', 'family'].includes(circleId) && (
            <Link
              href="/dashboard/premium"
              className="block w-full bg-[#1a1b1e] py-3 text-center text-blue-400 hover:text-blue-300 transition-colors font-medium border-t border-[#2a2b2e]"
            >
              Upgrade to Modify Traits
            </Link>
          )}
          
          {/* Family circle: Upgrade to Suggest Goals */}
          {circleId === 'family' && (
            <Link
              href="/dashboard/premium"
              className="block w-full bg-[#1a1b1e] py-3 text-center text-red-400 hover:text-red-300 transition-colors font-medium border-t border-[#2a2b2e]"
            >
              Upgrade to Suggest Goals
            </Link>
          )}
          
          {/* Eco circle: No premium upgrade needed (self-assessment only) */}
        </>
      )}
      
      {/* Premium users can modify traits for standard circles */}
      {isPremium && ['friends', 'work', 'general'].includes(circleId) && (
        <Link
          href={`/dashboard/circle/${circleId}/modify-traits`}
          className="block w-full bg-[#1a1b1e] py-3 text-center text-purple-400 hover:text-purple-300 transition-colors font-medium border-t border-[#2a2b2e]"
        >
          Modify Traits (1 Token)
        </Link>
      )}
    </div>
  );
}