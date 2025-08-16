'use client';

import { useEffect, useState } from 'react';
import { useAuthContext } from '@/contexts/auth-context';
import { RatingCard } from '@/components/dashboard/rating-card';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { standardCircles, getTraitsForCircle, getTraitsByIds } from '@/lib/traits-library';
import type { CircleStats } from '@/types';

export default function DashboardPage() {
  const { user } = useAuthContext();
  const [stats, setStats] = useState<Record<string, CircleStats>>({});
  const [loading, setLoading] = useState(true);

  async function loadStats() {
    if (!user?.uid) return;
    
    setLoading(true);
    try {
      // Get all ratings where this user is the rated person
      const ratingsRef = collection(db, 'ratings');
      const ratingsQuery = query(
        ratingsRef,
        where('ratedUid', '==', user.uid)
      );
      
      const ratingsSnapshot = await getDocs(ratingsQuery);
      const ratings = ratingsSnapshot.docs.map(doc => doc.data());
      
      // Calculate stats for each circle
      const calculatedStats: Record<string, CircleStats> = {};
      
      // Get user's assessments if they exist
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.exists() ? userDoc.data() : {};
      const ecoAssessment = userData.ecoAssessment;
      const familyAssessment = userData.familyAssessment;
        
      for (const circleId of Object.keys(standardCircles)) {
        if (circleId === 'eco') {
          // Handle eco assessment data
          const traits = getTraitsForCircle(circleId);
          
          if (ecoAssessment && ecoAssessment.traitScores) {
            const traitStats: Record<string, { avg: number; count: number }> = {};
            
            traits.forEach(trait => {
              const score = ecoAssessment.traitScores[trait.id] || 0;
              traitStats[trait.id] = {
                avg: score,
                count: score > 0 ? 1 : 0
              };
            });
            
            calculatedStats[circleId] = {
              count: 1, // Self-assessment count
              avgScore: ecoAssessment.overallScore || 0,
              traits: traitStats,
              updatedAt: ecoAssessment.completedAt ? (ecoAssessment.completedAt instanceof Date ? ecoAssessment.completedAt : new Date(ecoAssessment.completedAt)) : new Date(),
            };
          } else {
            // No eco assessment completed
            calculatedStats[circleId] = {
              count: 0,
              avgScore: 0,
              traits: {},
              updatedAt: new Date(),
            };
          }
        } else if (circleId === 'family') {
          // Handle family assessment data and count actual members
          const traits = getTraitsForCircle(circleId);
          
          // Get family members count using SAME LOGIC as family circle details page
          const membersRef = collection(db, 'userCircles');
          const membersQuery = query(
            membersRef,
            where('ownerUid', '==', user.uid),
            where('circleId', '==', 'family')
            // Note: NO status filter - same as family circle details page
          );
          const membersSnapshot = await getDocs(membersQuery);
          
          // Count other members (excluding current user) + 1 for owner
          const otherMembersCount = membersSnapshot.docs
            .filter(doc => doc.data().memberUid !== user.uid)
            .length;
          const memberCount = otherMembersCount + 1; // +1 for owner
          
          // Check if family assessment exists and has data
          if (familyAssessment && familyAssessment.overallScore) {
            const traitStats: Record<string, { avg: number; count: number }> = {};
            
            traits.forEach(trait => {
              const score = familyAssessment.traitScores[trait.id] || 0;
              traitStats[trait.id] = {
                avg: score,
                count: score > 0 ? 1 : 0
              };
            });
            
            calculatedStats[circleId] = {
              count: memberCount,
              avgScore: Number(familyAssessment.overallScore),
              traits: traitStats,
              updatedAt: new Date(),
            };
          } else {
            // No family assessment completed but still show member count
            calculatedStats[circleId] = {
              count: memberCount,
              avgScore: 0,
              traits: {},
              updatedAt: new Date(),
            };
          }
        } else {
          // Handle regular circle ratings (friends, work, general)
          const circleRatings = ratings.filter(rating => rating.circleId === circleId);
          
          // Get member count using SAME LOGIC as circle details page
          const membersRef = collection(db, 'userCircles');
          const membersQuery = query(
            membersRef,
            where('circleId', '==', circleId),
            where('ownerUid', '==', user.uid)
            // Note: NO status filter - same as circle details page
          );
          const membersSnapshot = await getDocs(membersQuery);
          
          // Count other members (excluding current user) + 1 for owner
          const otherMembersCount = membersSnapshot.docs
            .filter(doc => doc.data().memberUid !== user.uid)
            .length;
          const memberCount = otherMembersCount + 1; // +1 for owner
          
          console.log(`${circleId} circle member count:`, {
            totalDocs: membersSnapshot.size,
            otherMembersCount,
            finalMemberCount: memberCount,
            docs: membersSnapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }))
          });
          
          // Check if user has custom traits for this circle
          let traits = getTraitsForCircle(circleId);
          const userTraitsDoc = await getDoc(doc(db, 'userCircleTraits', `${user.uid}_${circleId}`));
          if (userTraitsDoc.exists()) {
            const userTraitsData = userTraitsDoc.data();
            traits = getTraitsByIds(userTraitsData.traits);
          }
          
          if (circleRatings.length === 0) {
            calculatedStats[circleId] = {
              count: memberCount, // Use actual member count, not rating count
              avgScore: 0,
              traits: {},
              updatedAt: new Date(),
            };
            continue; // Use continue instead of return to process remaining circles
          }
          
          // Calculate trait averages
          const traitStats: Record<string, { avg: number; count: number }> = {};
          let totalScoreSum = 0;
          let totalRatings = 0;
          
          traits.forEach(trait => {
            const traitScores = circleRatings
              .map(rating => rating.scores[trait.id])
              .filter(score => score !== undefined);
            
            if (traitScores.length > 0) {
              const avg = traitScores.reduce((sum, score) => sum + score, 0) / traitScores.length;
              traitStats[trait.id] = {
                avg: Number(avg.toFixed(1)),
                count: traitScores.length
              };
              totalScoreSum += avg * traitScores.length;
              totalRatings += traitScores.length;
            } else {
              traitStats[trait.id] = { avg: 0, count: 0 };
            }
          });
          
          // Calculate overall average
          const avgScore = totalRatings > 0 ? totalScoreSum / totalRatings : 0;
          
          calculatedStats[circleId] = {
            count: memberCount, // Use actual member count, not rating count
            avgScore: Number(avgScore.toFixed(1)),
            traits: traitStats,
            updatedAt: new Date(),
          };
        }
      }
      
      setStats(calculatedStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!user?.uid) return;

    // Set up listeners for member changes
    const unsubscribers: (() => void)[] = [];

    // Listen for member changes in all standard circles
    const standardCircleIds = ['friends', 'work', 'general', 'family'];
    
    standardCircleIds.forEach(circleId => {
      const membersQuery = query(
        collection(db, 'userCircles'),
        where('circleId', '==', circleId),
        where('ownerUid', '==', user.uid)
        // Note: NO status filter - same as circle details pages
      );

      const unsubscribe = onSnapshot(membersQuery, () => {
        console.log(`${circleId} circle members changed, reloading stats`);
        loadStats(); // Reload stats when members change
      });
      unsubscribers.push(unsubscribe);
    });

    // Initial load
    loadStats();

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [user?.uid]);

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Standard Circles */}
          {Object.entries(standardCircles).map(([id, circle]) => (
            <RatingCard
              key={id}
              circleId={id}
              stats={stats[id] || {
                count: 0,
                avgScore: 0,
                traits: {},
                updatedAt: new Date(),
              }}
              isPremium={user.isPremium}
            />
          ))}
        </div>
      )}
    </div>
  );
}