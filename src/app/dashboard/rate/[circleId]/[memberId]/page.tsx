'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthContext } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, query, where, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';
import { standardCircles, getTraitsForCircle, getTraitsByIds } from '@/lib/traits-library';
import type { AppUser, CustomCircle } from '@/types';
import Link from 'next/link';

export default function RatingPage() {
  const params = useParams();
  const router = useRouter();
  const circleId = params.circleId as string;
  const memberId = params.memberId as string;
  
  const { user } = useAuthContext();
  const [member, setMember] = useState<AppUser | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [existingRatingId, setExistingRatingId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customCircle, setCustomCircle] = useState<CustomCircle | null>(null);
  const [ratingContext, setRatingContext] = useState<{
    traits: any[];
    isCustom: boolean;
    ownerName?: string;
    circleName?: string;
    circleIcon?: string;
  }>({ traits: [], isCustom: false });

  const circle = standardCircles[circleId as keyof typeof standardCircles];

  // Load rating context (traits) based on circle type
  const loadRatingContext = async (circleId: string, ratedUserId: string, memberData: AppUser) => {
    try {
      // First check if this is a custom circle and if the person being rated owns it
      const customCircleDoc = await getDoc(doc(db, 'customCircles', circleId));
      
      if (customCircleDoc.exists()) {
        const customCircleData = {
          id: customCircleDoc.id,
          ...customCircleDoc.data(),
          createdAt: customCircleDoc.data().createdAt?.toDate(),
          updatedAt: customCircleDoc.data().updatedAt?.toDate()
        } as CustomCircle;
        
        setCustomCircle(customCircleData);
        
        // If the person being rated is the owner of this custom circle, use their custom traits
        if (customCircleData.ownerUid === ratedUserId) {
          const customTraits = getTraitsByIds(customCircleData.customTraits);
          setRatingContext({
            traits: customTraits,
            isCustom: true,
            ownerName: `${memberData.firstName} ${memberData.lastName}`,
            circleName: customCircleData.name,
            circleIcon: customCircleData.icon
          });
          return;
        }
      }
      
      // Check if this is a standard circle and if the person being rated has custom traits
      const standardCircle = standardCircles[circleId as keyof typeof standardCircles];
      if (standardCircle) {
        // Check if the person being rated has customized this standard circle
        const userTraitsDoc = await getDoc(doc(db, 'userCircleTraits', `${ratedUserId}_${circleId}`));
        
        if (userTraitsDoc.exists()) {
          const userTraitsData = userTraitsDoc.data();
          const customTraits = getTraitsByIds(userTraitsData.traits);
          setRatingContext({
            traits: customTraits,
            isCustom: true,
            ownerName: `${memberData.firstName} ${memberData.lastName}`,
            circleName: standardCircle.name,
            circleIcon: standardCircle.icon
          });
          return;
        }
      }
      
      // Fallback to standard circle traits
      const standardTraits = getTraitsForCircle(circleId);
      setRatingContext({
        traits: standardTraits,
        isCustom: false
      });
      
    } catch (error) {
      console.error('Error loading rating context:', error);
      // Fallback to standard traits
      const standardTraits = getTraitsForCircle(circleId);
      setRatingContext({
        traits: standardTraits,
        isCustom: false
      });
    }
  };

  useEffect(() => {
    // Redirect family circle to family assessment
    if (circleId === 'family') {
      router.push('/dashboard/family-assessment');
      return;
    }

    async function loadData() {
      setLoading(true);
      setError(null);
      
      try {
        if (!memberId || !user?.uid) {
          throw new Error('Member ID or user authentication is missing');
        }

        // Load member data
        const memberDoc = await getDoc(doc(db, 'users', memberId));
        if (!memberDoc.exists()) {
          setError('Member not found. They may have been removed from this circle.');
          setLoading(false);
          return;
        }
        const memberData = { uid: memberId, ...memberDoc.data() } as AppUser;
        setMember(memberData);

        // Load rating context (standard vs custom circle)
        await loadRatingContext(circleId, memberId, memberData);

        // Check for existing rating
        const ratingsRef = collection(db, 'ratings');
        const ratingsQuery = query(
          ratingsRef,
          where('raterUid', '==', user.uid),
          where('ratedUid', '==', memberId),
          where('circleId', '==', circleId)
        );
        
        const ratingsSnapshot = await getDocs(ratingsQuery);
        
        if (!ratingsSnapshot.empty) {
          // Load existing rating
          const existingRating = ratingsSnapshot.docs[0];
          const ratingData = existingRating.data();
          
          setExistingRatingId(existingRating.id);
          setScores(ratingData.scores || {});
          setIsUpdating(true);
        } else {
          // Scores will be initialized by the rating context effect
          setIsUpdating(false);
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [memberId, user?.uid, circleId]);

  // Initialize scores when rating context loads (for new ratings)
  useEffect(() => {
    if (ratingContext.traits.length > 0 && !isUpdating && Object.keys(scores).length === 0) {
      const initialScores: Record<string, number> = {};
      ratingContext.traits.forEach(trait => {
        initialScores[trait.id] = 5; // Default to middle value
      });
      setScores(initialScores);
    }
  }, [ratingContext.traits, isUpdating, scores]);

  const handleScoreChange = (traitId: string, value: string) => {
    // Convert to integer and clamp between 1 and 10
    const intValue = Math.max(1, Math.min(10, parseInt(value) || 1));
    setScores(prev => ({
      ...prev,
      [traitId]: intValue
    }));
  };

  const handleSubmit = async () => {
    if (!member || Object.keys(scores).length !== ratingContext.traits.length) {
      return; // Validate all traits are rated
    }

    setIsSubmitting(true);

    try {
      if (isUpdating && existingRatingId) {
        // Update existing rating
        await updateDoc(doc(db, 'ratings', existingRatingId), {
          scores,
          updatedAt: serverTimestamp()
        });
      } else {
        // Create new rating
        await addDoc(collection(db, 'ratings'), {
          ratedUid: memberId,
          raterUid: user?.uid,
          circleId,
          scores,
          isRevealed: circleId !== 'attraction',
          usedToken: false,
          createdAt: serverTimestamp()
        });
      }

      // Return to circle page after successful submission
      router.push(`/dashboard/rate/${circleId}`);
    } catch (err) {
      console.error('Error submitting rating:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit rating');
      setIsSubmitting(false);
    }
  };

  if (!circle || !member) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-white mb-6">
          {!circle ? 'Circle not found' : 'Member not found'}
        </h1>
        <Link href="/dashboard" className="text-blue-400 hover:text-blue-300">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link 
            href={`/dashboard/rate/${circleId}`}
            className="text-sm text-gray-400 hover:text-white transition-colors block mb-2"
          >
            ← Back to Member Selection
          </Link>
          <h1 className="text-2xl font-bold text-white">
            {isUpdating ? 'Re-rate' : 'Rate'} {member.firstName} {member.lastName}
          </h1>
          <p className="text-gray-400 mt-1">{circle.name} Circle</p>
          {isUpdating && (
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 mt-2">
              <p className="text-blue-400 text-sm">
                ✨ You can re-rate this member anytime. Your new ratings will replace the previous ones.
              </p>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Custom Rating Context Indicator */}
          {ratingContext.isCustom && (
            <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="text-2xl">{ratingContext.circleIcon}</div>
                <div>
                  <h3 className="text-purple-300 font-semibold flex items-center gap-2">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    Custom Circle Rating
                  </h3>
                  <p className="text-sm text-gray-300">
                    You're rating <span className="text-white font-medium">{ratingContext.ownerName}</span> based on their 
                    personalized "<span className="text-purple-300">{ratingContext.circleName}</span>" circle traits.
                  </p>
                </div>
              </div>
            </div>
          )}

          {ratingContext.traits.map(trait => (
            <div key={trait.id} className="bg-gray-800 p-6 rounded-lg">
              <div className="flex justify-between mb-2">
                <label className="text-lg font-medium text-white">
                  {trait.name}
                </label>
                <span className="text-2xl font-bold text-blue-400">
                  {scores[trait.id] || 1}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={scores[trait.id] || 1}
                onChange={(e) => handleScoreChange(trait.id, e.target.value)}
                className="w-full accent-blue-500 mb-2"
              />
              <div className="flex justify-between text-sm text-gray-400">
                <span>1</span>
                <span>5</span>
                <span>10</span>
              </div>
              <p className="text-gray-400 mt-3">{trait.description}</p>
            </div>
          ))}

          <button
            onClick={handleSubmit}
            disabled={isSubmitting || Object.keys(scores).length !== ratingContext.traits.length}
            className={`w-full py-4 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed mt-8 text-lg font-medium transition-colors ${
              isUpdating 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
          >
            {isSubmitting 
              ? (isUpdating ? 'Re-rating...' : 'Submitting...') 
              : (isUpdating ? 'Re-rate Member' : 'Submit Rating')
            }
          </button>
        </div>
      )}
    </div>
  );
}
