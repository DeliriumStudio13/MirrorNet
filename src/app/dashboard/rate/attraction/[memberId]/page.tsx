'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useAuthContext } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, query, where, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';
import { standardCircles, getTraitsForCircle } from '@/lib/traits-library';
import type { AppUser } from '@/types';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, Eye, EyeOff, Sparkles, AlertTriangle } from 'lucide-react';

export default function AttractionRatingPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const memberId = params.memberId as string;
  const usesToken = searchParams.get('token') === 'true';
  
  const { user } = useAuthContext();
  const [member, setMember] = useState<AppUser | null>(null);
  const [scores, setScores] = useState<Record<string, number>>({});
  const [existingRatingId, setExistingRatingId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [willReveal, setWillReveal] = useState(false);

  const circle = standardCircles.attraction;
  const traits = getTraitsForCircle('attraction');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      
      try {
        if (!memberId || !user?.uid) {
          throw new Error('Member ID or user authentication is missing');
        }

        // Check if user has sufficient tokens if this uses a token
        if (usesToken && (!user.isPremium || user.premiumTokens <= 0)) {
          throw new Error('Insufficient premium tokens');
        }

        // Load member data
        const memberDoc = await getDoc(doc(db, 'users', memberId));
        if (!memberDoc.exists()) {
          throw new Error('Member not found');
        }
        setMember({ uid: memberId, ...memberDoc.data() } as AppUser);

        // Check for existing rating
        const ratingsRef = collection(db, 'ratings');
        const ratingsQuery = query(
          ratingsRef,
          where('raterUid', '==', user.uid),
          where('ratedUid', '==', memberId),
          where('circleId', '==', 'attraction')
        );
        
        const ratingsSnapshot = await getDocs(ratingsQuery);
        
        if (!ratingsSnapshot.empty) {
          // Load existing rating
          const existingRating = ratingsSnapshot.docs[0];
          const ratingData = existingRating.data();
          
          setExistingRatingId(existingRating.id);
          setScores(ratingData.scores || {});
          setWillReveal(ratingData.isRevealed || false);
          setIsUpdating(true);
        } else {
          // Initialize scores for new rating
          const attractionTraits = getTraitsForCircle('attraction');
          const initialScores: Record<string, number> = {};
          attractionTraits.forEach(trait => {
            initialScores[trait.id] = 5; // Default to middle value
          });
          setScores(initialScores);
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
  }, [memberId, user?.uid, usesToken]);

  const handleScoreChange = (traitId: string, value: string) => {
    const intValue = Math.max(1, Math.min(10, parseInt(value) || 1));
    setScores(prev => ({
      ...prev,
      [traitId]: intValue
    }));
  };

  const handleSubmit = async () => {
    if (!user || !member) return;

    setIsSubmitting(true);
    try {
      const ratingsRef = collection(db, 'ratings');
      
      const ratingData = {
        raterUid: user.uid,
        ratedUid: member.uid,
        circleId: 'attraction',
        scores,
        isRevealed: willReveal,
        usedToken: usesToken,
        createdAt: serverTimestamp(),
      };

      if (isUpdating && existingRatingId) {
        // Update existing rating
        await updateDoc(doc(db, 'ratings', existingRatingId), {
          scores,
          isRevealed: willReveal,
          updatedAt: serverTimestamp(),
        });
      } else {
        // Create new rating
        await addDoc(ratingsRef, ratingData);
        
        // Deduct premium token if this rating uses one
        if (usesToken && user.isPremium) {
          await updateDoc(doc(db, 'users', user.uid), {
            premiumTokens: user.premiumTokens - 1
          });
        }
      }

      // Redirect back to attraction page
      router.push('/dashboard/rate/attraction');
    } catch (error) {
      console.error('Error submitting rating:', error);
      setError('Failed to submit rating. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
          <p className="text-gray-400 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6">
          <p className="text-red-400">{error}</p>
        </div>
        <Link 
          href="/dashboard/rate/attraction"
          className="inline-block mt-4 text-pink-400 hover:text-pink-300 transition-colors"
        >
          ← Return to Attraction
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link 
            href="/dashboard/rate/attraction"
            className="text-sm text-gray-400 hover:text-white transition-colors block mb-2"
          >
            ← Back to Attraction Selection
          </Link>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Heart className="h-8 w-8 text-pink-500" />
            {isUpdating ? 'Update Attraction Rating' : 'Rate Attraction'}
          </h1>
          <div className="flex items-center gap-4 mt-2">
            {/* Member Info */}
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-gray-700">
                {member?.avatarUrl ? (
                  <Image
                    src={member.avatarUrl}
                    alt={`${member.firstName}'s profile`}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </div>
                )}
              </div>
              <div>
                <p className="text-lg font-semibold text-white">
                  {member?.firstName} {member?.lastName}
                </p>
                <p className="text-gray-400 text-sm">{circle.name} Circle</p>
              </div>
            </div>
            
            {/* User Status Indicator */}
            <div className="flex gap-2">
              {usesToken && (
                <div className="bg-purple-900/30 border border-purple-500/50 rounded-lg px-3 py-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-400" />
                  <span className="text-purple-300 text-sm font-medium">Uses 1 Premium Token</span>
                </div>
              )}
              {!user?.isPremium && (
                <div className="bg-pink-900/30 border border-pink-500/50 rounded-lg px-3 py-2 flex items-center gap-2">
                  <Heart className="h-4 w-4 text-pink-400" />
                  <span className="text-pink-300 text-sm font-medium">Anonymous Rating</span>
                </div>
              )}
            </div>
          </div>
          
          {isUpdating && (
            <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-3 mt-4">
              <p className="text-yellow-400 text-sm">
                You have already rated this member. Your new ratings will replace the previous ones.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Premium Reveal Option */}
      {user?.isPremium && (
        <div className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-500/30 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-400" />
                Premium Feature: Reveal Your Identity
              </h3>
              <p className="text-gray-300 text-sm mb-4">
                As a premium user, you can choose to reveal your identity with this rating. 
                The person will know who rated them.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setWillReveal(false)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    !willReveal 
                      ? 'bg-gray-700 text-white border border-gray-600' 
                      : 'bg-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  <EyeOff className="h-4 w-4" />
                  Anonymous (Default)
                </button>
                <button
                  onClick={() => setWillReveal(true)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    willReveal 
                      ? 'bg-pink-600 text-white border border-pink-500' 
                      : 'bg-transparent text-gray-400 hover:text-white'
                  }`}
                >
                  <Eye className="h-4 w-4" />
                  Reveal Identity
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rating Form */}
      <div className="bg-gray-800 rounded-lg p-8">
        <h2 className="text-xl font-semibold text-white mb-6">Rate the following traits (1-10 scale)</h2>
        
        <div className="space-y-6">
          {traits.map(trait => (
            <div key={trait.id} className="space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-white">{trait.name}</h3>
                  <p className="text-sm text-gray-400">{trait.description}</p>
                </div>
                <div className="text-2xl font-bold text-pink-400 min-w-[3rem] text-center">
                  {scores[trait.id] || 5}
                </div>
              </div>
              
              <div className="relative">
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={scores[trait.id] || 5}
                  onChange={(e) => handleScoreChange(trait.id, e.target.value)}
                  className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  style={{
                    background: `linear-gradient(to right, #ec4899 0%, #ec4899 ${((scores[trait.id] || 5) - 1) * 11.11}%, #374151 ${((scores[trait.id] || 5) - 1) * 11.11}%, #374151 100%)`
                  }}
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1</span>
                  <span>2</span>
                  <span>3</span>
                  <span>4</span>
                  <span>5</span>
                  <span>6</span>
                  <span>7</span>
                  <span>8</span>
                  <span>9</span>
                  <span>10</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Warning for Anonymous Rating */}
        {(!user?.isPremium || !willReveal) && (
          <div className="mt-8 bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-blue-300 text-sm">
                  <strong>Anonymous Rating:</strong> Your identity will be completely hidden. 
                  The person will receive the rating but won't know it came from you.
                  {!user?.isPremium && (
                    <span className="block mt-1 text-gray-400">
                      Standard users can only send anonymous ratings.
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex gap-4 mt-8 pt-6 border-t border-gray-700">
          <button
            onClick={() => router.push('/dashboard/rate/attraction')}
            className="px-6 py-3 text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1 bg-gradient-to-r from-pink-600 to-pink-700 text-white py-3 px-6 rounded-lg hover:from-pink-700 hover:to-pink-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
          >
            {isSubmitting ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                {isUpdating ? 'Updating Rating...' : 'Submitting Rating...'}
              </div>
            ) : (
              <>
                {isUpdating ? 'Update Rating' : 'Submit Rating'}
                {willReveal && ' (Revealed)'}
                {usesToken && ' (Uses Token)'}
                {!user?.isPremium && ' (Anonymous)'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
