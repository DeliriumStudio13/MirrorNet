'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthContext } from '@/contexts/auth-context';
import { RatingCard } from '@/components/dashboard/rating-card';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { standardCircles, getTraitsForCircle, getTraitsByIds } from '@/lib/traits-library';
import { debounce } from '@/lib/debounce';
import { trackError, trackUserAction, withPerformanceTracking, trackMetric } from '@/lib/monitoring';
import type { CircleStats } from '@/types';

export default function DashboardPage() {
  const { user } = useAuthContext();
  const [stats, setStats] = useState<Record<string, CircleStats>>({});
  const [loading, setLoading] = useState(true);

  /**
   * Loads dashboard statistics for all circles
   * This function can be expensive due to multiple Firestore queries
   */
  const loadStats = useCallback(
    withPerformanceTracking('dashboard.load_stats', async () => {
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
          let selectedTraitIds = traits.map(t => t.id); // Default to standard trait IDs
          const userTraitsDoc = await getDoc(doc(db, 'userCircleTraits', `${user.uid}_${circleId}`));
          if (userTraitsDoc.exists()) {
            const userTraitsData = userTraitsDoc.data();
            traits = getTraitsByIds(userTraitsData.traits);
            selectedTraitIds = userTraitsData.traits; // Use custom trait IDs
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
          
          // Calculate trait averages ONLY for currently selected traits
          const traitStats: Record<string, { avg: number; count: number }> = {};
          let totalScoreSum = 0;
          let totalRatings = 0;
          
          traits.forEach(trait => {
            // Only calculate stats for traits that are currently selected
            if (!selectedTraitIds.includes(trait.id)) {
              // Skip traits that are not currently selected (but keep historical data)
              traitStats[trait.id] = { avg: 0, count: 0 };
              return;
            }
            
            const traitScores = circleRatings
              .map(rating => rating.scores[trait.id])
              .filter(score => score !== undefined && score > 0); // Exclude unrated traits (score = 0)
            
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
      
      // Track metrics for monitoring
      trackMetric({
        name: 'dashboard.circles_loaded',
        value: Object.keys(calculatedStats).length,
      });
      
    } catch (error) {
      trackError(error as Error, {
        userId: user?.uid,
        component: 'DashboardPage',
        action: 'load_stats',
      });
      throw error; // Re-throw for performance tracking
    } finally {
      setLoading(false);
    }
  }), [user?.uid]);

  /**
   * Debounced version of loadStats to reduce Firestore costs
   * Batches rapid updates (like multiple member changes) into a single reload
   * Waits 3 seconds after last change before executing
   */
  const debouncedLoadStats = useCallback(
    debounce(loadStats, 3000, { trailing: true }),
    [loadStats]
  );

  useEffect(() => {
    if (!user?.uid) return;

    // Track dashboard visit
    trackUserAction('dashboard_viewed', user.uid, {
      isPremium: user.isPremium,
      timestamp: new Date(),
    });

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
        console.log(`${circleId} circle members changed, scheduling debounced reload`);
        debouncedLoadStats(); // Use debounced version to batch updates
      });
      unsubscribers.push(unsubscribe);
    });

    // Initial load
    loadStats();

    return () => {
      // Clean up listeners
      unsubscribers.forEach(unsubscribe => unsubscribe());
      // Cancel any pending debounced calls to prevent memory leaks
      debouncedLoadStats.cancel();
    };
  }, [user?.uid, debouncedLoadStats, loadStats]);

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Loading your circles...</p>
          </div>
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